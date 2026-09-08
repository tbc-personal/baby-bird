# Curating the bird photos

How to pick a Macaulay Library photo for each of weeks 7–42 and get it into the
app. Weeks 2–6 are seeds and are already done, except week 3; see the end.

This is the one job in the project that cannot be automated, for two reasons.
The catalog is a JavaScript app behind a proof-of-work bot challenge, so no
script can read it. And "is this a good photo of a Wood Thrush egg" is a
judgement about a picture, which is the part you would have to check anyway.

Budget roughly an hour for all 36, once you have a rhythm.

---

> **Step 0 is done — 2026-09-08.** The embed template is confirmed correct
> against Cornell's own Embed dialog, and embeds render for real visitors. Two
> bugs on our side were stopping the photo appearing and are fixed. Keep Step 0
> below for the record, but you do not need to repeat it; start at Step 1.

## Step 0 — verify the embed template, once

**Do this before curating anything else.** `MACAULAY_EMBED_TEMPLATE` in
`src/components/macaulay.ts` is an unverified guess: the build session could not
reach Cornell to confirm it. If it is wrong, every ID you curate will render an
empty box, and you will not know until you have done all 36.

1. Open any asset page, e.g. <https://macaulaylibrary.org/asset/633445471>.
2. Find the **Embed** control (share menu or the ⋯ menu on the asset).
3. Copy the `<iframe>` it gives you and look at its `src`.
4. Compare against the template:
   ```
   https://macaulaylibrary.org/asset/{id}/embed
   ```
5. If the `src` differs, edit that one constant in `src/components/macaulay.ts`.
   It is the only place the URL is built. Note any `width`/`height` Cornell
   specifies — the app currently renders a fixed 150px-tall frame
   (`EMBED_HEIGHT`), and that may need to change.
6. Then update the "VERIFICATION STATUS" comment in that file and the "Embed
   mechanics" section of `docs/decisions/ADR-003-images.md`, which both still
   say the pattern is unconfirmed.

Sanity-check with one week before doing the rest: put a single `mlAssetId` into
week 22 (Blue Jay), run `npm run dev`, open `#/week/22`, and confirm a photo
actually appears rather than an empty frame or the offline goose.

---

## Step 1 — find a photo

`docs/CURATION.md` has a per-week table of search URLs. They take the form:

```
https://search.macaulaylibrary.org/catalog?taxonCode=<code>&mediaType=photo&sort=rating_rank_desc
```

`sort=rating_rank_desc` puts the community's best-rated photos first, which is
usually enough. For the egg weeks (7–13) add the **Egg** age/behavior filter in
the left-hand panel, or the search will return adult birds.

### What makes a good photo *for this app*

The card crops to a **150px-tall, full-width strip** (`object-fit: cover`,
centred). That is a wide letterbox, so:

- **The subject must be near the centre.** A bird in the top corner of a tall
  portrait shot will be cropped out entirely.
- **Prefer a horizontal composition.** Portrait photos lose most of their frame.
- **Avoid busy backgrounds.** At 150px the bird needs to separate from the
  background, or the card reads as mush.
- **One bird, filling a decent share of the frame.** A distant bird on a branch
  disappears at this size.
- **Egg weeks: the egg should be identifiable as an egg** — a nest with a clear
  clutch beats a scientific specimen tray.

Check the crop rather than trusting the thumbnail: the app centre-crops, and
Macaulay's own thumbnail may be cropped differently.

### Two IDs per species

ADR-003 asks for a primary and a fallback, because a contributor can delete an
asset and the card would go blank. Pick the best two while you are on the page —
it costs nothing now and saves a return trip.

---

## Step 2 — record it

Each week's row in `data/comparisons.json` has an `image` object. Fill it in:

```json
"image": {
  "provider": "macaulay",
  "mlAssetId": "633445471",
  "fallbackMlAssetId": "612233445",
  "embedUrl": null,
  "credit": "Jane Photographer",
  "altText": "A Blue Jay on a bare branch, crest raised.",
  "file": null,
  "author": null,
  "license": null,
  "licenseUrl": null,
  "sourceUrl": null
}
```

- **`mlAssetId`** — digits only, no `ML` prefix. The app adds it.
- **`credit`** — the photographer's name as Macaulay shows it. Cornell's credit
  guidance wants photographer + library + ML number; the app assembles the rest.
- **`altText`** — write it for someone who cannot see the photo. Describe what
  is in the frame, not why it matters. One sentence.
- The `file` / `author` / `license` / `licenseUrl` / `sourceUrl` fields are for
  Commons images only; leave them `null` here. The schema enforces this.

The credit is no longer a line under the card. It sits behind the small **i** in
the bottom-right corner of the photo, so a wrong `credit` value is easy to miss
by eye — which is what `npm run check-links` is for.

---

## Step 3 — check your work

```bash
npm run validate-data     # schema, and the outstanding-image count
npm run check-links       # every asset ID and slug actually resolves
npm run dev               # then look at the weeks you changed
```

`check-links` makes several dozen requests to Cornell, so it is not in CI. Run
it after a curation session, not after every row.

Looking at the cards is not optional. `validate-data` will happily accept a
well-formed ID pointing at a photo of the wrong species.

---

## The constraint that matters

ADR-003 chose Macaulay embeds over downloading images because Cornell permits
embedding **for non-commercial use only**. That is why the app embeds an iframe
rather than shipping a copy of the photo, and why the README and LICENSE say the
app is non-commercial.

Do not download Macaulay photos into `public/`. If the app ever takes money, the
embeds have to be re-licensed with a helpdesk ticket, and ADR-003 has to be
redone.

---

## Weeks 2–6, the seeds

Already done, and differently: seeds have no Macaulay assets, so ADR-003 uses
Wikimedia Commons files downloaded into `public/images/seeds/`.

Those are automated. The curated choices live in `docs/research/seed-images.json`
and `npm run seed-images` does the rest — fetches metadata, refuses any licence
not on ADR-003's allowed list, downloads, resizes, and writes the `image` object.
To swap one, change its `commonsTitle` and re-run.

**Week 3 has no photo.** No usable Commons image of gizzard grit exists — the
searches return scanned pages from pre-1920 poultry manuals. It is also the one
comparison still marked `proposed: true`, and the fact-check found its only
citation never mentions grouse, doves or roadsides. Settle whether the
comparison stays before spending time on a picture for it.
