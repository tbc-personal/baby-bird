# ADR-003: Images

Status: superseded in part (2026-09-09); embed code removed 2026-09-14 (commit
`2e695cf`). Accepted 2026-09-06 as "bird images via Macaulay Library embeds";
the embed route was abandoned on 2026-09-08 for the reason recorded below, and
**Wikimedia Commons is now the route for weeks 3–42**. `MacaulayEmbed.tsx`,
`macaulay.ts`, `useOnline.ts` and `OfflineGoose.tsx` have since been deleted
from the tree, along with the `mlAssetId` / `fallbackMlAssetId` / `embedUrl`
schema fields and data keys — see "The embed code is gone" below. Coverage is
not yet complete: as of this correction (2026-09-14), 36 of the 40 comparison
weeks have a curated Commons photo; weeks 7, 9, 12 and 13 still show the "Photo
coming" silhouette. The original decision and its context are kept in full,
because the non-commercial constraint it reasoned about is why the Commons
licence list is what it is.

## Decision

For weeks 7–42 (eggs and birds), each screen embeds one Macaulay Library asset using the library's official share/embed iframe. Asset IDs are curated once and stored in `data/comparisons.json` (`image.mlAssetId`). The app must remain non-commercial: no ads, no paid tier, no for-profit ownership.

For weeks 3–6 (seeds), the Macaulay Library has no assets. Use Wikimedia Commons CC0 / CC BY photos, downloaded into the repo with attribution stored in the same JSON `image` object (`provider: "commons"`).

## Context

Cornell's help center states embedding and sharing Macaulay Library media is for non-commercial purposes only; any revenue-generating use needs a helpdesk ticket and license. All About Birds photos are Macaulay Library assets, so this is the closest permitted route to "the bird photo from All About Birds". See `docs/research/licensing.md`.

## Constraints and mitigations

| Risk                                                   | Mitigation                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Iframe markup or URL pattern changes on Cornell's side | Isolate in one component (`MacaulayEmbed`). Store the asset ID, not the markup; build the iframe from a single template constant. Add a smoke test that loads one embed in CI via Playwright and fails if it renders empty.                         |
| No offline support for embeds                          | Service worker does not cache cross-origin frames. Show the offline goose (a line-drawn goose in a hat with a no-wifi symbol) with the tag "Photo needs a connection" when `navigator.onLine` is false or the frame fails to load within a timeout. |
| Third-party script weight on every screen              | Lazy-load the iframe only for the current week's card; timeline rows use small kind silhouettes (seed / egg / bird), not photos.                                                                                                                    |
| No asset ID curated yet                                | Render the kind silhouette with the tag "Photo coming". Distinct from the offline goose.                                                                                                                                                            |
| Contributor deletes an asset                           | Curate two IDs per species (primary, fallback). Quarterly link check script.                                                                                                                                                                        |
| Commercial drift                                       | README and LICENSE state the non-commercial constraint. Any monetization requires re-doing this ADR and filing a Macaulay Library license request.                                                                                                  |

## Resolved, 2026-09-08: the Macaulay embed route is not shippable

Three findings, in the order they were established. The middle one corrects a
wrong claim this file previously carried, and that correction stands.

**1. The template was always right.** Cornell's Embed dialog produces an iframe
pointing at exactly the URL `MACAULAY_EMBED_TEMPLATE` predicted, at 640x552.

**2. Two bugs were ours, not Cornell's.** An earlier revision here claimed the
endpoint was blocked, citing the author's home connection. That evidence was in
fact our own bug: the lazy-load gate could hang, so no frame was created, no
request was ever made, and with no frame the load timeout never started, leaving
the card on "Loading photo" with no goose. Fixed with
`EMBED_VISIBILITY_FALLBACK_MS`. The conclusion had also generalised from curl and
a server-side fetcher, which were never evidence about browsers.

**3. With the frame actually loading, the route fails for a different reason.**
`macaulaylibrary.org` sits behind Anubis, a proof-of-work bot challenge, and it
runs **inside the frame, in real time**. Every visitor watches a bot check where
the photo should be, on every card, before any image appears. Observed directly
by the author once the frame was loading. This is not a latency problem to tune
around: the app would be putting a third party's anti-abuse interstitial in front
of its own content.

So the embed route is abandoned. The frame kept the mockup's 150px strip at
first; it is 200px now (see "The strip is 200px" below).
`MacaulayEmbed` and the template stayed in the tree at first — they were correct,
and if Cornell exempts the embed endpoint the route would have been a data
change away — but no row was to carry an `mlAssetId` while the challenge sat in
front of it. **That code has since been deleted outright** (commit `2e695cf`,
2026-09-14): see "The embed code is gone" below. If Cornell ever exempts the
embed endpoint, the route would need to be rebuilt, not just re-enabled with
data.

### Where that leaves images

- **Wikimedia Commons is the route.** This ADR already named it as the fallback
  if embedding broke, and `image.provider` was designed for the swap. Weeks 3,
  4, 5 and 6 prove the path end to end.
- **Audubon is not an option.** Their terms reserve all rights, apply no
  Creative Commons licence, permit only personal non-commercial copying, and
  forbid using materials "separate from the accompanying text". Using their
  photos would need written permission.
- **Finding the files is now tooled.** `npm run survey-commons` walks each
  species' Commons category, rejects everything unshippable (licence, no author,
  under 1000px, engravings, museum skins, maps, sound), scores what is left on
  signals the API reports — Featured/Quality/Valued badges, aspect ratio against
  the strip crop, whether an egg week's file actually shows an egg — and
  writes a six-candidate shortlist with thumbnails. It never picks; choosing
  between six photographs stays a human act, the same split as `reviewed` in
  ADR-004. Responses cache under `.commons-survey/`.
- **Coverage is sufficient but uneven.** A survey of Commons for all 36 species,
  counting only files at least 900px wide under CC0 / public domain / CC BY /
  CC BY-SA and excluding scanned book plates, found every bird week (14-42) with
  18 or more candidates. The egg weeks are thinner and need per-week judgement:
  American Robin 52 and Bald Eagle 37 are comfortable, Great Blue Heron 11 and
  Black Tern 19 are workable, and **Wood Thrush has 3**. Some egg weeks will
  have to show a nest with a clutch, or a bird on a nest, rather than a clean
  egg photograph. One happy accident: a Commons file of a Wood Thrush nest
  containing a cowbird egg would illustrate week 9's own cowbird fact exactly.

## The embed code is gone (2026-09-14, commit `2e695cf`)

Everything below this point that describes `MacaulayEmbed`, `useOnline`,
`OfflineGoose`, `macaulay.ts`, or the `mlAssetId` / `fallbackMlAssetId` /
`embedUrl` fields is describing code and data that no longer exist. It is kept
as history of what was built and why it was later removed, not as a
description of the current app. `src/components/MacaulayEmbed.tsx`,
`src/components/OfflineGoose.tsx`, `src/components/macaulay.ts`, and
`src/useOnline.ts` have all been deleted (commit `2e695cf`), along with the
corresponding schema fields and every `mlAssetId`/`embedUrl` key in
`data/comparisons.json`.

There is no offline goose any more — it was reachable only through the embed's
failure states, and those states no longer exist. Every photo is downloaded
into `public/images/` and served locally, so there is nothing left for an
"offline" or "failed to load" image state to handle. Weeks with no curated
photo (currently 7, 9, 12, 13) render the plain kind silhouette, tagged "Photo
coming", the same as before — that part of the design did not change.

## Embed mechanics

**Historical. Superseded by "Resolved, 2026-09-08" above.** The verification this
section asks for was done, and the answer was that the route does not work. The
text is left as written because it records what was and was not known at the
time, including a claim about blocked egress that later turned out to be about
this container rather than about Cornell.

The build session was asked to confirm the exact `src` from a live asset page's
Embed dialog. It could not. The sandbox's egress proxy refuses `CONNECT` to
`macaulaylibrary.org` and `search.macaulaylibrary.org`, and the gateway answers
`HTTP 403` before any request leaves the machine. The same block applies to
`commons.wikimedia.org`, `upload.wikimedia.org`, `en.wikipedia.org` and
`www.allaboutbirds.org`. Nothing about Cornell's markup was observed; the note
below is unchanged from the planning guess and is recorded as a guess.

- Assumed form, templated in `src/components/macaulay.ts` as the single constant
  `MACAULAY_EMBED_TEMPLATE`: `https://macaulaylibrary.org/asset/<ID>/embed`,
  rendered as an `<iframe>` with `loading="lazy"` and a fixed 150px height.
  Required size attributes, if Cornell specifies any, are unknown.
- Verification step for whoever picks this up: open any asset page, use the
  **Embed** control, copy the iframe it produces, and compare it against
  `MACAULAY_EMBED_TEMPLATE`. If the `src` differs, that one constant is the only
  edit needed. `scripts/check-links.ts` will then confirm the asset ids resolve.
- The app is fully usable meanwhile. No row in `data/comparisons.json` carries an
  `mlAssetId`, so every card renders the kind silhouette tagged "Photo coming",
  and `MacaulayEmbed` is never mounted in the shipped build.
- The embed renders its own credit line. The app still shows
  "Photo: <photographer> / Macaulay Library at the Cornell Lab of Ornithology
  ML<ID>" as text, for accessibility and per Cornell's credit guidance.
- Each card also deep-links to `https://www.allaboutbirds.org/guide/<slug>/overview`.

### Failure handling as built

- `navigator.onLine` false, or no `load` within **6 seconds**: the offline goose,
  tagged "Photo needs a connection".
- No `mlAssetId` curated: the kind silhouette, tagged "Photo coming". Distinct
  from the offline state, as this ADR requires.
- The frame is created only when the card comes within 200px of the viewport,
  via a callback ref rather than a mount effect, so a card that first renders
  offline still attaches its observer when the connection returns.

## Alternatives rejected

- Wikimedia Commons for all weeks: no permission needed, offline-capable, but not Cornell's photos. Remains the fallback if the embed route breaks; the `image.provider` field is designed so the swap is a data change.
- Requesting a Cornell license for downloaded images: cheap to ask, uncertain timeline. Can be pursued in parallel; not a v1 dependency.

## The strip is 200px, not the mockup's 150px (2026-09-14)

The photo window was 150px tall across the card, about 2.8:1, and showed roughly
half of each photograph's height. Two things followed from that. Birds sitting
in the upper part of their frame lost their heads to a centred crop — the
Northern Flicker and the Pileated Woodpecker both reached the data that way —
and even correctly-cropped cards clipped a puffin's feet and a kingfisher's bill.

Two changes, in order:

- **`image.objectPosition`**, curated per photograph. Which part of a photograph
  holds the bird is a judgement about that photograph, not something the code
  can derive, so it is data like everything else here. Nine weeks carry one.
  Week 10 is the clearest case: the robin's eggs sit in the bottom third, and
  the card had been showing an empty nest.
- **200px**, at the author's direction. Measured across all 36 curated weeks
  with `npm run crop-preview -- --compare 200`: the share of each photograph's
  height that reaches the card goes from a mean of 52% to 69%. Four to six weeks
  gain something identifiable — the puffin's orange feet, the kingfisher's bill
  tip, the bluebird's tail, the crow's feet. The rest gain context. As the
  author put it, this is the pregnancy tracker for bird lovers, and the bird is
  a central part of the fun.

`npm run crop-preview` is the tool for both: it draws each curated photograph
whole with the card's real window marked on it and a percentage scale down the
side. The review sheets cannot show this, because their thumbnails are 16:9.
