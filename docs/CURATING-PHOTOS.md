# Curating the photos

How to get a photograph onto every week's card. All 42 weeks come from Wikimedia
Commons; weeks 2, 4, 5 and 6 are done, week 3 has no usable photo, and weeks
7–42 are the work.

The Macaulay Library route this document used to describe is dead. Cornell put
`macaulaylibrary.org` behind a proof-of-work bot challenge that runs _inside the
embed frame_, so every visitor would watch a bot check where the photo should
be. ADR-003 records how that was established. Nothing below involves Cornell.

---

## The split: what the scripts do, and what you do

Two things have to happen for each week, and only one of them is a judgement.

**Finding candidates is mechanical**, so `npm run survey-commons` does it. For
each week it walks the species' Commons category, throws out everything the
project cannot ship — wrong licence, no named author, under 1000px, engravings
and book plates, museum skins, maps, sound files — scores what is left, and
writes a shortlist of six with thumbnails.

**Choosing between six photographs is not mechanical**, so you do it. The script
never picks. It cannot tell whether a bird reads at 150px or whether the crop
cuts its head off.

```bash
npm run survey-commons -- --weeks 14-22 --sheet
```

That writes `docs/research/commons-shortlist-14-22.md`. Open it — on GitHub, so
the thumbnails render — and pick a letter per week.

API responses are cached under `.commons-survey/`, so re-running to re-score or
re-render a sheet costs no network. Add `--refresh` to ignore the cache.

---

## What makes a good photo _for this app_

The card crops to a **150px-tall, full-width strip** (`object-fit: cover`,
centred). That is a wide letterbox, and it is the whole of the aesthetic
problem:

- **The subject must be near the vertical centre.** A bird in the top third of
  the frame is cropped out entirely.
- **Landscape, not portrait.** The shortlist already penalises portrait files,
  but a 4:3 shot of a bird standing tall still loses its head and feet.
- **One bird, filling a decent share of the frame.** A distant bird on a branch
  is a smudge at this size.
- **Quiet background.** At 150px the bird has to separate from what is behind
  it or the card reads as mush.
- **Egg weeks: an egg has to be visible.** A nest with a clutch in it is the
  target. A bird sitting on a nest is not an egg photo, however charming.

The shortlist tags candidates the API says are Featured Pictures or Quality
Images. That is a real signal about photographic quality and no signal at all
about whether the photo survives this crop. Trust the thumbnail over the badge.

---

## Recording a choice

Add an entry to `docs/research/commons-images.json`:

```json
{
  "week": 10,
  "comparison": "American Robin egg",
  "commonsTitle": "File:Robin Turdus migratorius Egg in Nest 8990 01.jpg",
  "file": "images/eggs/american-robin-egg.jpg",
  "altText": "Three pale blue robin eggs in a mud-lined nest, seen from above.",
  "why": "The clutch fills the middle of a landscape frame, which is what the strip crop needs."
}
```

- **`commonsTitle`** — exactly as the shortlist gives it, `File:` prefix and all.
- **`file`** — where it lands under `public/`. Use `images/eggs/` and
  `images/birds/`; the seed weeks are already under `images/seeds/`.
- **`altText`** — write it for someone who cannot see the photo. Describe what
  is in the frame, not why it matters. One sentence. Write it from the photo,
  not from the Commons caption, which is often wrong about the crop.
- **`why`** — one line, for whoever revisits this choice.
- **`authorOverride`** — only to trim import noise from the Commons Artist field
  (a Flickr geographic suffix, say). It must be a prefix of the real author
  string or the script refuses it. It cannot be used to credit somebody else.

Then:

```bash
npm run commons-images
```

That fetches each file's metadata, **refuses any licence not on ADR-003's
allowed list**, downloads at 900px, re-encodes with sharp, and writes the
`image` object into `data/comparisons.json`. Author, licence, licence URL and
source URL all come from the API response, so the credit line under each card is
whatever Commons actually says — never a guess. `--dry-run` reports without
writing.

The credit is not a line under the card. It sits behind the small **i** in the
bottom-right corner of the photo, which means a wrong credit is easy to miss by
eye.

---

## Checking your work

```bash
npm run validate-data     # schema, and the outstanding-image count
npm run check-links       # every source URL and slug actually resolves
npm run dev               # then look at the weeks you changed
```

Looking at the cards is not optional. `validate-data` will happily accept a
correctly licensed, correctly attributed photograph of the wrong species.

---

## Licensing, which is the part that bites

ADR-003 ships only CC0, public domain, CC BY (2.0/3.0/4.0) and CC BY-SA
(3.0/4.0). The list lives in `ALLOWED_COMMONS_LICENSES` in `src/lib/schema.ts`
and is enforced twice: once when fetching, once by the schema. Non-commercial
and no-derivatives licences are not on it and never will be — they would put the
same constraint on the app that killed the Macaulay route.

Attribution is a licence condition, not a courtesy. Every Commons row must carry
`author`, `license`, `licenseUrl` and `sourceUrl`, and the schema rejects the row
if any is missing.

---

## Weeks with no photo

**Week 3 (grain of grit)** has none. No usable Commons image of gizzard grit
exists — searches return scanned pages from pre-1920 poultry manuals. It is also
the one comparison still marked `proposed: true`, and the fact-check found its
only citation never mentions grouse, doves or roadsides. Settle whether the
comparison stays before spending time on a picture for it.

A week with no image renders the kind silhouette tagged "Photo coming", which is
a deliberate, distinct state from the offline goose. Leaving a week unsourced is
allowed; putting a bad photo on it is worse.
