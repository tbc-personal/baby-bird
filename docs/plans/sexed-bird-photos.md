# Plan: sexed bird photos from week 14

Status: **draft for the author's review.** Nothing here is decided. Every
paragraph of prose in this document was composed by Claude; the UI copy drafts
in §6.3 are flagged separately because they are the ones that would ship in the
author's voice.

## 1. The feature

From week 14, if the parents have chosen "boy" or "girl" in settings, the card's
photograph shows a male or female bird — but only for species where the sexes
actually look different in a photograph. Every other week is unchanged, and the
default state, for anyone who has not chosen, is exactly what ships today.

## 2. What the repository already decides for us

Five findings from reading the code, because four of them make the feature
smaller than it sounds and one makes it bigger.

**Week 14 needs no gate.** Weeks 3–6 are seeds and weeks 7–13 are eggs; week 14
(Ruby-throated Hummingbird) is the first `kind: "bird"` row. The "starting with
week 14" rule falls out of the data, so no week-number check belongs in the
code. If sexed photos exist only on bird rows, the threshold enforces itself.

**The cards already show a sex, silently.** Nine of the 29 bird weeks name a sex
in their alt text or Commons filename, and eight of those nine are male:

| Week | Species                   | Photo today |
| ---- | ------------------------- | ----------- |
| 14   | Ruby-throated Hummingbird | male        |
| 20   | Eastern Bluebird          | male        |
| 21   | American Kestrel          | female      |
| 24   | Northern Flicker          | male        |
| 27   | Peregrine Falcon          | male        |
| 28   | Cooper's Hawk             | male        |
| 32   | Hooded Merganser          | male        |
| 36   | Wood Duck                 | male        |
| 39   | Mallard                   | male        |

The rest are unmarked, which is not the same as unsexed — the week 25 Belted
Kingfisher alt text describes "a rust-coloured band across the belly", which is
the female's mark, and the week 31 Pileated Woodpecker's sex cannot be read off
the alt text at all. So this feature does not introduce sex into the app. It
makes a choice the curation already made visible and controllable.

**`survey-commons` is already half-built for this.** `--prefer '\bmale\b'` was
added for exactly this reason — week 20's shortlist was full of shippable
bluebirds and the author wanted the male — and the bird-week subcategory filter
already admits `male` and `female` subcategories. Sexed curation needs a picks
file change, not a new script.

**Only the card renders a photograph.** Timeline draws silhouettes, not images.
`ComparisonCard.renderPhoto()` is the single call site, so image selection has
exactly one place to change.

**The cost is curation, and it is not small.** Every variant is a full ADR-003
pass: survey, human pick from six, licence check, crop-preview, a curated
`objectPosition`, and hand-written alt text. Two photographs per qualifying
week, of which we already own roughly half. §4 puts the number between 10 and 18
new photographs depending on how §5.1 is decided.

## 3. Which species qualify — VERIFIED 2026-09-18

Verified in `docs/research/dimorphism.md`, with the evidence quoted per week.
**Not against Birds of the World, which is paywalled** — the plumage sections
need a subscription. English Wikipedia was used instead, which ADR-004 already
accepts as a reference. Five tier B rows are still open and marked ⚠ there.

**Tier A — usable at card size (8 weeks): 14 Ruby-throated Hummingbird, 20
Eastern Bluebird, 21 American Kestrel, 25 Belted Kingfisher, 32 Hooded
Merganser, 36 Wood Duck, 39 Mallard, 40 Snowy Owl.** The same eight this plan
guessed at before verification.

**Tier B — real but marginal (5 weeks):** 24 Northern Flicker and 31 Pileated
Woodpecker (malar stripe only), 42 Osprey and 29 American Barn Owl (a tendency,
not a mark), 15 Ruby-crowned Kinglet (**drop** — the male conceals the patch).
Osprey and Barn Owl were wrongly filed as monomorphic in the first draft.

**Out — size-only or negligible (16 weeks):** 16, 17, 18, 19, 22, 23, 26, 27,
28, 30, 33, 34, 35, 37, 38, 41. Eight of these differ only in size, which a
single photograph cannot show; that rejection is structural and permanent.

**So the feature covers 8 of 29 bird weeks — under a third.** A parent who sets
"boy" sees a different photograph on eight cards out of twenty-nine and an
identical one on the other twenty-one. That is the feature's real shape and §5.2
is about whether the app explains it or lets it read as a bug.

### The sexing rule verification forced

Four ways a pick could be mis-sexed turned up (eclipse plumage on the three
ducks, juvenile kingfishers carrying the female's rufous band, snowy owl
overlap, and the unidentified week 40 photo). All four point one way:

**A sexed pick is valid only if the Commons file itself states the sex** — in
its categories, title or description. We do not sex a bird by looking at it.
This is stricter than the rest of the curation, because unlike a crop judgement
it is a factual claim the card then makes. It belongs in ADR-008 and in
`CURATING-PHOTOS.md`.

## 4. Photograph budget

Tier A only: 16 variants for 8 weeks. Six existing photographs are already
usable as one side of a pair (14 male, 20 male, 21 female, 32 male, 36 male,
39 male), assuming the pick survives review. Week 25's current photo is probably
the female and week 40's is probably a female or immature — both need a Commons
check, not a guess.

**Net: about 10 new curated photographs.** Adding tier B would make it 16.

## 5. Decisions to settle before any code

### 5.1 Tier A only, or tier A plus tier B?

Recommend **tier A only** for v1. Tier B doubles the curation for differences
that a 200px strip is likely to crop out or blur.

### 5.2 What does the app say about the 21 unchanged weeks?

Recommend one sentence next to the setting itself, not on the cards. A per-card
"this species looks the same either way" note would put a negative on
twenty-one cards to explain eight.

### 5.3 Does the photo carry a "Male" / "Female" tag?

Recommend **yes**, only when a sexed variant is being shown. `PhotoFrame`
already takes a `tag` prop ("Photo coming" uses it), so this is free. Without
it, the picture changes and nothing says why.

### 5.4 Does anything besides the photograph change?

Recommend **no** for v1: no pronouns in the copy, no sexed facts, no change to
the comparison names or the app's voice. The facts already say "the male" and
"the female" where the biology calls for it, which is right regardless of the
setting.

### 5.5 Is the setting a display preference or something more?

It is stored data about an unborn child and it is more sensitive than units or
skin. ADR-006's direction is to share strictly less, so: stored locally with
everything else, **never added to the share link**, cleared by "Forget my data",
and default "not saying". Recommend a short note in ADR-006 rather than a new
ADR for the privacy half.

## 6. Design

### 6.1 Data

`data/comparisons.json` keeps `image` exactly as it is — it stays the photo
everyone sees by default — and dimorphic bird rows gain a sibling:

```jsonc
"image": { ...unchanged... },
"sexedImages": {
  "male":   { "provider": "commons", "file": "images/birds/wood-duck-male.jpg", ... },
  "female": { "provider": "commons", "file": "images/birds/wood-duck-female.jpg", ... }
}
```

Each variant is an ordinary `imageSchema` object, so the licence allowlist and
the required attribution fields apply unchanged, and the attribution is still
written by the script rather than typed.

Rejected alternative: nesting variants inside `image`. `image` is written
wholesale by `fetch-commons-images.ts`; giving it a field the script has to
merge rather than replace is how attribution starts getting hand-edited.

New validator rules (`src/lib/validateData.ts` + `schema.ts`):

- `sexedImages` is allowed only on `kind: "bird"` rows.
- Both keys or neither — a half-pair is an error, not a warning. A "boy" setting
  that silently falls back on some weeks and not others is worse than no feature.
- `referencedImageFiles()` must walk into `sexedImages`, or the missing-file
  check in `scripts/validate-data.ts` stops covering half the images.
- A new line in the validator's summary: how many weeks carry a sexed pair.

### 6.2 Selection

One pure function, one call site:

```ts
// src/lib/images.ts
export function imageFor(row: WeekRow, sex: BabySex): ComparisonImage | null;
```

Returns `row.sexedImages[sex]` when the row has a pair and `sex` is not
`unknown`, otherwise `row.image`. `ComparisonCard.renderPhoto()` calls it; the
component keeps deciding between `CommonsImage` and `PhotoComing` as it does
now.

### 6.3 Storage and settings

`Settings` gains `babySex: 'unknown' | 'male' | 'female'`, default `'unknown'`.

**No `STATE_VERSION` bump is needed.** `readSettings` already reads each field
defensively with a fallback, so a v2 record written before this change parses
into `babySex: 'unknown'` — which is the pre-feature behaviour exactly. This was
checked against `src/lib/storage.ts`, not assumed.

`buildShareLink` is untouched, and a test should assert that it stays untouched.

The control goes in `SettingsPanel`, below units. Recommend rendering it **only
when the comparison data actually contains a sexed pair**, which makes phases 1
and 2 shippable before any photograph is curated without inventing a feature
flag.

_The following copy is Claude-composed and needs the author's voice:_

> **If you know** — Some birds look different depending on whether they are
> male or female. Tell us and we will show the matching one. Most species look
> the same either way, so a lot of weeks will not change.
>
> `[ Not saying ] [ Boy ] [ Girl ]`

Open question for the author: "Boy / Girl" is the app's warm register and
matches how parents say it; "Male / Female" matches the birds and the photo tag.
Mixing them on one screen may be the honest choice — the parent picks "Boy", the
photo is tagged "Male" — or may read as clinical.

### 6.4 Service worker

`vite.config.ts` precaches `**/*.jpg`, so ten new photographs (~500 KB on top of
today's 2.8 MB) would be downloaded at install by every user, including everyone
who never sets the option. Recommend the ADR-007 font pattern instead: exclude
`*-male.jpg` / `*-female.jpg` from `globPatterns` and add a `CacheFirst` runtime
rule, so a chosen sex costs one download and then works offline. Needs the file
naming convention to be load-bearing, which is a reason to keep it.

## 7. Phases

**Phase 0 — verify the species list. Done, partly.** All 29 bird weeks have a
sourced verdict in `docs/research/dimorphism.md`, including the rejections, so
they are not re-litigated. Verified against Wikipedia, not Birds of the World,
which is paywalled — see that file for what that costs. Still open: the author's
sign-off on tier A, the five ⚠ tier B rows, week 40's photo identification, and
§5.

**Phase 1 — schema and selection, invisible.** `sexedImages` in the schema, the
four validator rules, `imageFor()`, unit tests. Ships with no data and changes
nothing.
Done when: `npm run validate-data`, `npm run lint`, `npm run typecheck` and
`npm test` pass, with tests covering the half-pair rejection, the
non-bird-row rejection, and the `imageFor` truth table.

**Phase 2 — storage, setting, card wiring.** `babySex` in settings, the
`SettingsPanel` control, `imageFor()` wired into `ComparisonCard`, the
`Male`/`Female` tag, the SW caching change. Still invisible in production
because no row has a pair yet.
Done when: a v2 localStorage record still parses; `buildShareLink` has a test
asserting it carries no sex; the control is hidden when no row carries a pair.

**Phase 3 — curate tier A.** Per `docs/CURATING-PHOTOS.md`, in two batches so
the pipeline is proved on a small one first. Suggest weeks 20, 36 and 39 first —
the three most obvious pairs, all with a usable male already. Then 14, 21, 25,
32, 40. Each variant: `survey-commons --prefer`, human pick, `crop-preview`,
`objectPosition`, alt text, `commons-images`.
Done when: eight weeks carry a valid pair, every file is on the licence
allowlist, and `crop-preview` has been looked at for all sixteen.

**Phase 4 — write it down and test it.** ADR-008 for the imagery decision
(including the tier C rejection), a note in ADR-006 for the privacy half, an
ADR-003 cross-reference, a `CURATING-PHOTOS.md` section on curating a pair, and
the e2e test. Existing skin screenshots should not move, because the default is
`unknown` — assert that rather than assuming it.
Done when: docs merged, e2e covers set-boy-see-male / set-girl-see-female /
non-dimorphic-week-unchanged, and the skin baselines are unchanged.

## 8. Risks

- **The photographs may not exist in pairs.** Female wood ducks and female
  mergansers are photographed far less than males. If a week cannot be paired to
  the same standard, it drops out of tier A rather than shipping a weak photo;
  the half-pair rule in §6.1 forces that choice rather than hiding it.
- **The feature is invisible on 21 of 29 weeks.** §5.2 is the mitigation and it
  may not be enough. Worth deciding up front whether eight weeks justifies a
  setting at all.
- **Sensitivity.** Sex is not always known, not always disclosed, and sometimes
  bound up with loss. Defaulting to "not saying" and never putting the value in
  a share link covers the mechanics; the copy in §6.3 carries the rest.

## 9. Explicitly not doing

Pronouns in the app's copy; sexed facts; a third "both/unknown" photograph;
sexing the egg weeks; changing which species a week uses in order to get more
dimorphic ones; and anything that puts the value on the network.
