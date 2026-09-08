# Content curation checklist

Two human tasks must happen alongside (or after) the code build. Both write into `data/comparisons.json`.

## What the build session could and could not do (2026-09-06)

The implementation session ran in a sandbox whose egress proxy refuses `CONNECT`
to every source this checklist depends on. `macaulaylibrary.org`,
`search.macaulaylibrary.org`, `commons.wikimedia.org`, `upload.wikimedia.org`,
`en.wikipedia.org` and `www.allaboutbirds.org` all answer `HTTP 403` at the
gateway before a request leaves the machine. So:

| Task | Status | What is left |
|---|---|---|
| A. Macaulay asset ids, weeks 7–42 | **not started** | All 36 rows. `image` is `null` throughout; every card renders the kind silhouette tagged "Photo coming" and the app is fully usable that way. |
| A. Commons seed photos, weeks 2–6 | **not started** | All 5 rows, including the week 3 grit photo. Files were to go in `public/images/seeds/`; that directory is empty. |
| Verify the Macaulay embed `src` | **not done** | See `docs/decisions/ADR-003-images.md` → "Embed mechanics". The template in `src/components/macaulay.ts` is an unverified guess and is the only line that needs changing if it is wrong. |
| B. Facts, weeks 2–42 | **drafted, unverified** | Written from the build session's own knowledge and cited to public references it could not open. Every fact is `reviewed: false`. See "Facts to review" below. |
| C. Verify slugs and species codes | **not done** | `scripts/check-links.ts` automates it; run it from a machine with network access. |

None of this blocks the code. `scripts/validate-data.ts` treats missing images
and missing facts as warnings, not errors, so CI stays green while curation
trails; it reports the outstanding counts on every run.

## Update: network access, and the fact-check triage (2026-09-08)

Network access was opened for a later session, so the paragraph above no longer
describes the current environment. What is reachable now:

| Source | Status |
|---|---|
| `en.wikipedia.org`, including the action API for full article text | open |
| `commons.wikimedia.org`, `upload.wikimedia.org` | open — task A for the seed weeks is now doable |
| `www.audubon.org` | open |
| `birdsoftheworld.org` | open, but only the free introduction; the species account is paywalled |
| `search.macaulaylibrary.org` | reachable, still a JavaScript catalog rather than a page that can be read |
| `www.allaboutbirds.org` | **still 403.** This one is not the egress proxy — Cornell serves a Cloudflare block to datacenter IPs. Opening the network policy further will not fix it. |
| `web.archive.org` | not reachable through the proxy, so archived copies are not a way round the line above |

**Task B has had a triage pass, and its findings are applied.** All 123 facts were
checked against source text that was actually downloaded and read; see
`docs/research/fact-check-summary.md` for the rollup and
`docs/research/fact-check-<range>.md` for the per-fact evidence. 85 citations were
swapped and 9 facts rewritten, recorded change by change in
`docs/research/fact-check-changeset.json` and applied by `npm run apply-fact-check`.
No `sources[]` entry points at All About Birds any more; the `allAboutBirdsSlug`
per row is untouched, since that drives the card link ADR-004 asks for and is not a
citation. Regenerate the evidence corpus with `npm run fact-sources` and audit the
reports with `npm run verify-fact-check`.

**Task A is half done.** The four seed weeks that have a usable Commons photo are
sourced, downloaded and credited: week 2 poppy, week 4 nyjer, week 5 millet, week 6
sunflower. The curated choices live in `docs/research/seed-images.json` with a note on
why each was picked; `npm run seed-images` does the mechanical half — fetch the metadata,
refuse any licence not on ADR-003's allowed list, download, resize, and write the `image`
object. To swap a photo, change `commonsTitle` there and re-run. Attribution is never
hand-typed: author, licence, licence URL and source URL all come from the Commons API.

`vite.config.ts` now precaches `jpg` as well. Without it those four cards would have
broken offline, which is the one case shipping the photos locally was meant to cover.

Two parts of task A are **not** done, for different reasons:

- **Week 3, the grit photo.** No suitable Commons image exists. Searches for poultry,
  pigeon, gizzard and granite grit return only scanned pages from pre-1920 poultry
  manuals; coarse-sand searches return beach and sandstone geology, which does not read
  as something a bird swallows. This is moot until the comparison is settled anyway —
  week 3 is still `proposed: true`, and the fact-check found its only citation never
  mentions grouse, doves or roadsides. Decide the comparison first.
- **Macaulay asset ids and the embed template, weeks 7–42.** Still yours, and now more
  firmly so. `macaulaylibrary.org` and `search.macaulaylibrary.org` are behind
  **Anubis**, a proof-of-work challenge whose own page says it is there "to protect the
  server against the scourge of AI companies aggressively scraping websites". Every
  HTTP 200 from those hosts is that challenge page, not content. A headless browser
  would likely solve the challenge, but doing so to read Cornell's catalog is the
  scraping the challenge exists to stop, so this session did not. ADR-003's verification
  step is unchanged and small: one person, one asset page, one Embed dialog, compared
  against `MACAULAY_EMBED_TEMPLATE`. Nothing is blocked meanwhile — no row carries an
  `mlAssetId`, so those cards render the silhouette tagged "Photo coming".

That pass does **not** discharge the review below. It found 2 contradicted facts,
21 partly supported and 1 unverifiable, and all of those are now corrected — but the
99 facts it marked supported have not been independently re-read, and `reviewed: true`
is still a human act, which `apply-fact-check` deliberately cannot perform. Three
facts remain only partly resolved; they are listed under "Still open after this pass"
in the summary. Every rewritten sentence also wants a voice pass: they were written
to be defensible against a source, not to sound like the author. The most-cited source, All About Birds (74 of 123 facts), is the one
that stayed shut; those facts were verified against other sources, and each
report records which source was actually read for each fact.

## A. Image IDs (weeks 7–42: Macaulay Library; weeks 2–6: Wikimedia Commons)

**See `docs/CURATING-PHOTOS.md` for the walkthrough** — how to verify the embed
template first (do that before curating anything), what makes a photo work in
the card's 150px letterbox crop, and how to check the result. The per-week
search URLs below are the reference table it points at.

For each species row, open the search page, pick a well-rated photo showing the whole bird (or the egg for
weeks 7–13), open the asset, use **Embed**, and record the numeric asset ID (`ML` number) in `image.mlAssetId`
and the photographer credit in `image.credit`. Record a second ID in `image.fallbackMlAssetId` if possible.

Search URL pattern: `https://search.macaulaylibrary.org/catalog?taxonCode=<code>&mediaType=photo&sort=rating_rank_desc`
For eggs, add the age/behavior filter for eggs in the search UI (or search "egg" in the tag field).

| Week | Comparison | Code (verify) | Search |
|---|---|---|---|
| 7 | House Wren egg | houwre | https://search.macaulaylibrary.org/catalog?taxonCode=houwre&mediaType=photo&sort=rating_rank_desc |
| 8 | Barn Swallow egg | barswa | https://search.macaulaylibrary.org/catalog?taxonCode=barswa&mediaType=photo&sort=rating_rank_desc |
| 9 | Wood Thrush egg | woothr | https://search.macaulaylibrary.org/catalog?taxonCode=woothr&mediaType=photo&sort=rating_rank_desc |
| 10 | American Robin egg | amerob | https://search.macaulaylibrary.org/catalog?taxonCode=amerob&mediaType=photo&sort=rating_rank_desc |
| 11 | Black Tern egg | blkter | https://search.macaulaylibrary.org/catalog?taxonCode=blkter&mediaType=photo&sort=rating_rank_desc |
| 12 | Great Blue Heron egg | grbher | https://search.macaulaylibrary.org/catalog?taxonCode=grbher&mediaType=photo&sort=rating_rank_desc |
| 13 | Bald Eagle egg | baleag | https://search.macaulaylibrary.org/catalog?taxonCode=baleag&mediaType=photo&sort=rating_rank_desc |
| 14 | Ruby-throated Hummingbird | rthhum | https://search.macaulaylibrary.org/catalog?taxonCode=rthhum&mediaType=photo&sort=rating_rank_desc |
| 15 | Ruby-crowned Kinglet | ruckin | https://search.macaulaylibrary.org/catalog?taxonCode=ruckin&mediaType=photo&sort=rating_rank_desc |
| 16 | Black-capped Chickadee | bkcchi | https://search.macaulaylibrary.org/catalog?taxonCode=bkcchi&mediaType=photo&sort=rating_rank_desc |
| 17 | Carolina Wren | carwre | https://search.macaulaylibrary.org/catalog?taxonCode=carwre&mediaType=photo&sort=rating_rank_desc |
| 18 | Tufted Titmouse | tuftit | https://search.macaulaylibrary.org/catalog?taxonCode=tuftit&mediaType=photo&sort=rating_rank_desc |
| 19 | Cedar Waxwing | cedwax | https://search.macaulaylibrary.org/catalog?taxonCode=cedwax&mediaType=photo&sort=rating_rank_desc |
| 20 | Eastern Bluebird | easblu | https://search.macaulaylibrary.org/catalog?taxonCode=easblu&mediaType=photo&sort=rating_rank_desc |
| 21 | American Kestrel | amekes | https://search.macaulaylibrary.org/catalog?taxonCode=amekes&mediaType=photo&sort=rating_rank_desc |
| 22 | Blue Jay | blujay | https://search.macaulaylibrary.org/catalog?taxonCode=blujay&mediaType=photo&sort=rating_rank_desc |
| 23 | Atlantic Puffin | atlpuf | https://search.macaulaylibrary.org/catalog?taxonCode=atlpuf&mediaType=photo&sort=rating_rank_desc |
| 24 | Northern Flicker | norfli | https://search.macaulaylibrary.org/catalog?taxonCode=norfli&mediaType=photo&sort=rating_rank_desc |
| 25 | Belted Kingfisher | belkin1 | https://search.macaulaylibrary.org/catalog?taxonCode=belkin1&mediaType=photo&sort=rating_rank_desc |
| 26 | Common Tern | comter | https://search.macaulaylibrary.org/catalog?taxonCode=comter&mediaType=photo&sort=rating_rank_desc |
| 27 | Peregrine Falcon | perfal | https://search.macaulaylibrary.org/catalog?taxonCode=perfal&mediaType=photo&sort=rating_rank_desc |
| 28 | Cooper's Hawk | coohaw | https://search.macaulaylibrary.org/catalog?taxonCode=coohaw&mediaType=photo&sort=rating_rank_desc |
| 29 | American Barn Owl | brnowl | https://search.macaulaylibrary.org/catalog?taxonCode=brnowl&mediaType=photo&sort=rating_rank_desc |
| 30 | American Crow | amecro | https://search.macaulaylibrary.org/catalog?taxonCode=amecro&mediaType=photo&sort=rating_rank_desc |
| 31 | Pileated Woodpecker | pilwoo | https://search.macaulaylibrary.org/catalog?taxonCode=pilwoo&mediaType=photo&sort=rating_rank_desc |
| 32 | Hooded Merganser | hoomer | https://search.macaulaylibrary.org/catalog?taxonCode=hoomer&mediaType=photo&sort=rating_rank_desc |
| 33 | Green Heron | grnher | https://search.macaulaylibrary.org/catalog?taxonCode=grnher&mediaType=photo&sort=rating_rank_desc |
| 34 | Ring-billed Gull | ribgul | https://search.macaulaylibrary.org/catalog?taxonCode=ribgul&mediaType=photo&sort=rating_rank_desc |
| 35 | Red-tailed Hawk | rethaw | https://search.macaulaylibrary.org/catalog?taxonCode=rethaw&mediaType=photo&sort=rating_rank_desc |
| 36 | Wood Duck | wooduc | https://search.macaulaylibrary.org/catalog?taxonCode=wooduc&mediaType=photo&sort=rating_rank_desc |
| 37 | Red-shouldered Hawk | reshaw | https://search.macaulaylibrary.org/catalog?taxonCode=reshaw&mediaType=photo&sort=rating_rank_desc |
| 38 | Barred Owl | brdowl | https://search.macaulaylibrary.org/catalog?taxonCode=brdowl&mediaType=photo&sort=rating_rank_desc |
| 39 | Mallard | mallar3 | https://search.macaulaylibrary.org/catalog?taxonCode=mallar3&mediaType=photo&sort=rating_rank_desc |
| 40 | Snowy Owl | snoowl | https://search.macaulaylibrary.org/catalog?taxonCode=snoowl&mediaType=photo&sort=rating_rank_desc |
| 41 | Great Horned Owl | grhowl | https://search.macaulaylibrary.org/catalog?taxonCode=grhowl&mediaType=photo&sort=rating_rank_desc |
| 42 | Osprey | osprey | https://search.macaulaylibrary.org/catalog?taxonCode=osprey&mediaType=photo&sort=rating_rank_desc |

Seeds (weeks 2, 4, 5, 6): **done.** The curated choices are in
`docs/research/seed-images.json` and `npm run seed-images` fetches, checks the
licence, downloads and records them. To swap a photo, change its `commonsTitle`
and re-run.

Week 3, proposed "Grain of grit" (`proposed: true` in the data): no photo, and
no usable Commons candidate found. Settle whether the comparison stays first.

## B. Facts review

The build session writes facts with `reviewed: false`. Review pass: check each against its cited source,
edit for voice, set `reviewed: true`. `scripts/validate-data.ts` reports the count of unreviewed facts;
the release checklist requires zero.

## Facts to review

**123 facts, across all 41 comparison weeks (2–42). All 123 are `reviewed: false`.
None has been checked against a live source.**

Three facts per week. They are original sentences written for this app; no text
was copied from All About Birds, Audubon, Birds of the World or Wikipedia. They
follow the ADR-004 rules, which `scripts/validate-data.ts` enforces: one
sentence, 160 characters or fewer, no exclamation marks, at least one source URL.

**The accuracy caveat matters here.** The build session's egress proxy blocked
`en.wikipedia.org` and `www.allaboutbirds.org` along with everything else, so
the sentences were written from the model's own knowledge and the `sources[]`
URLs point at where each claim *should* be checked, not at a page that was
opened. Treat every one as an unverified draft.

### How to review

1. Run the app with `?review=1` on the URL (or `npm run dev`, where review mode
   is always on). Each unreviewed fact shows a small **draft** chip beside it.
2. Walk the timeline week by week. For each fact, open the URL in its
   `sources[]` and confirm the claim.
3. Edit for voice and accuracy in `data/comparisons.json`, then set
   `"reviewed": true` on that fact.
4. `npm run validate-data` prints the remaining unreviewed count. Release
   requires it to reach zero.

### Where to look hardest

These are the claims most worth a careful check, either because they are
specific numbers or because they are the kind of widely repeated statement that
turns out to be folklore:

| Week | Claim | Why |
|---|---|---|
| 3 | Grouse and doves take grit from roadsides | The whole week-3 comparison is `proposed: true` and needs the author's sign-off first. |
| 5 | Proso millet ripens in 60–90 days | A range, quoted from memory. |
| 13 | An eagle nest can reach two meters across and a tonne | Record-holder figures; confirm whether they describe a record or a typical nest. |
| 21 | Kestrels see vole urine trails in ultraviolet | Real research, but the popular version overstates it. |
| 27 | Nostril baffles let a Peregrine breathe in a stoop | Widely repeated and not firmly established; the sentence hedges with "thought to". |
| 28 | Many Cooper's Hawks carry healed fractures | Comes from a specific skeletal survey; check the proportion before restating it. |
| 30 | Crows recognize faces and pass the grudge on | From Marzluff's masked-researcher studies; check what the studies actually showed. |
| 34 | Ring-billed chicks peck at the parent's bill | The classic red-spot experiment is Herring Gull, not Ring-billed. |
| 36 | Ducklings drop from as high as fifteen meters | Confirm the figure. |
| 40 | Snowy Owl clutches run 3 to 11 with the lemming supply | A range, quoted from memory. |

## C. Verify slugs and codes

For each row: `https://www.allaboutbirds.org/guide/<allAboutBirdsSlug>/overview` returns 200, and
`https://ebird.org/species/<ebirdSpeciesCode>` shows the expected species. `scripts/check-links.ts` automates this.

## D. Interface copy to review for voice

Everything below was written by the build session, not by the author. It is
listed here for the same reason the facts are: it is content, not code, and it
should sound like the author. None of it is load-bearing — editing any string is
safe.

The facts themselves are section B above and are not repeated here.

### Setup
- "Your baby's size, week by week, as a seed, an egg, then a bird." (tagline)
- Method labels: "Last menstrual period", "Conception date", "Enter my due date"
- Date-field labels: "Date of last period", "Date of conception", "Due date"
- Preview labels: "Due date", "Counting from", "Today you are"
- Button: "Start counting"
- Shared-link sheet: "Replace your saved date with the shared one?" / "Use the shared date" / "Keep mine"
- Validation: "Enter a date." / "Enter a date as year, month, day." / "That date is in the future." / "That date is more than 300 days ago." / "That due date is more than 280 days away."

### Today
- Too early: "Too early for a comparison" / "Counting starts from your period date, so the first two weeks are before conception." (the second line is from the mockup's state table)
- Invalid: "That date has not arrived yet" / "Counting starts from the date you entered. Change it in Setup."
- Past term: "Past 42 weeks. The card stays on the last row."
- No row: "No comparison for this week" / "The table runs from week 2 to week 42."
- After copying: "Link copied."

### Comparison card
- Convention note (weeks 20 and 21): "Length is measured crown to rump through week 20 and head to heel from week 21, which is why the number jumps."
- Week 3: "This comparison is a proposal, not yet signed off."
- Link labels: "More at All About Birds →", "More on Wikipedia →"
- Size captions: "length, crown to rump", "length, head to heel", "weight (17.6 oz)", "weight, under 0.04 oz"

### Timeline and week
- "All 41 weeks", "Seeds 2–6 · Eggs 7–13 · Birds 14–42"
- Convention divider: "▲ crown to rump · ▼ head to heel"
- "Back to the timeline", "← All weeks"

### Images
- Tags: "Photo coming", "Photo needs a connection", "Loading photo"
- Goose alt text: "A goose wearing a hat with a crossed-out wifi symbol"
- Credit lines: "Photo: <name> / Macaulay Library at the Cornell Lab of Ornithology ML<id>." and "Photo: <author>, <license>, via Wikimedia Commons."

### Labor panel
- "chance labor starts on its own in the next 7 days, given you're still pregnant today"
- Tile captions: "by your due date", "most likely single day"
- "See the daily curve →", "Hide this panel"
- Chart description: "Daily chance of spontaneous labor from 34 to 43 weeks. The curve rises to a peak just after the due date and falls away after it. About N per cent of pregnancies have started labor by today."
- The three caveat paragraphs, including the one that states the post-term miss.

### About
- Section headings: "Display", "Limitations", "Where the numbers come from", "Credits", "Non-commercial", "Your data"
- The limitations paragraph and the v1.1 "coming later" note
- The three "where the numbers come from" bullets
- The three credits bullets
- The non-commercial paragraph
- The privacy paragraph: "Your date and these settings are stored on this device only. There are no accounts, no analytics, and nothing is sent anywhere. The only network requests the app makes are the photo embeds."
- "Forget my data" / "Forget your saved date and settings?" / "Forget it" / "Cancel"
- Toggle label: "Show the labor chances panel from 34 weeks"
