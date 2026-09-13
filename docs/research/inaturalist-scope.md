# Scoping iNaturalist as a second image source

Written 2026-09-13, after weeks 7, 9, 12 and 13 were parked on "Photo coming"
because Wikimedia Commons has no usable egg photograph for any of them.

**Verdict up front: it solves week 7, probably not weeks 9 and 12, and
definitely not week 13.** Week 13 — Bald Eagle, the one that prompted this — has
**zero** CC-licensed egg observations on iNaturalist. If the goal is to fill all
four gaps, this is not the answer. If the goal is to fill week 7 and open a
second source for the future, it is worth the build.

Every number below was measured against the live API on 2026-09-13, not
estimated.

---

## Why it fits the gap at all

Commons is a media library: people upload photographs they are pleased with.
iNaturalist is an observation log: people photograph what they find, where they
find it. For "an egg in a natural context" — the thing Commons could not
supply — an observation log is structurally the better source, because a clutch
in a nest is exactly what a naturalist stops to record.

It also annotates. Observations carry controlled terms, so egg photographs can be
asked for directly rather than inferred from captions:

- `term_id=22` (Evidence of Presence), `term_value_id=30` (Egg)
- `term_id=22`, `term_value_id=35` (Construction — i.e. nests)
- `term_id=1` (Life Stage), `term_value_id=7` (Egg)

That is a real improvement over the Commons pipeline, which had to guess an egg
week's subject from titles and categories and got it wrong twice.

## The licence situation

iNaturalist's default is **CC BY-NC**, which this project cannot ship — a
non-commercial licence would put the app back under the constraint that killed
the Macaulay route. But the licence is per-photo and the API filters on it:
`photo_license=cc0,cc-by,cc-by-sa` returns only the shippable slice. Photo
licence and observation licence are separate fields; the photo one governs.

Attribution would be to the observer's iNaturalist login rather than a legal
name, which is the platform norm but differs from how the Commons rows read.

## Measured coverage, the four parked weeks

Observations with an Egg annotation and at least one CC0 / CC BY / CC BY-SA
photo. "Research grade" is iNaturalist's community-verified tier.

| Week | Species          | Egg, research grade | Egg, any grade | Nests (CC) |
| ---- | ---------------- | ------------------- | -------------- | ---------- |
| 7    | House Wren       | 16                  | 23             | 30         |
| 9    | Wood Thrush      | 1                   | 1              | 3          |
| 12   | Great Blue Heron | 1                   | 3              | 114        |
| 13   | Bald Eagle       | **0**               | **0**          | 160        |

The nest column is a trap. Great Blue Heron and Bald Eagle both have plenty of
nest observations and no egg ones, for the same reason Commons did: both species
nest high and out of sight, and an incubating adult covers the clutch. More nest
photographs will not produce an egg photograph.

## Quality, which is the real catch

The coverage numbers flatter it. Spot-checking the best-rated House Wren egg
observations:

- 769×537, CC BY — a good photograph of three eggs in a nest, well framed and
  legible, but **below the project's 1000px floor and its 900px target width**.
- 1536×2048, CC BY — portrait phone photo.
- 1536×2048, CC0 — portrait phone photo.
- 1536×2048, CC0 — portrait phone photo.

This is field documentation, not photography. Expect phone-camera output, mostly
portrait, frequently under a megapixel on the long edge, and no equivalent of
Commons' Featured/Quality badges to rank by. The `faves_count` field is the only
quality signal and it is sparse — the best House Wren egg observation has one
favourite.

Portrait is the specific problem: the card crops to a 150px-tall full-width
strip, and the Commons survey already penalises portrait files heavily for that
reason. A source that is mostly portrait phone photos fights the layout.

## What building it would involve

Roughly a day, most of it not in the fetching.

**Reusable as-is.** The shape of `scripts/survey-commons.ts` — shortlist to a
review sheet, human picks, mechanical applier — transfers directly, and so does
the split it encodes. The API is generous: no rate limiting worth the name, so
none of the backoff machinery that makes the Commons crawl take an hour.

**New work.**

1. `scripts/survey-inaturalist.ts` — query by taxon and annotation, filter on
   photo licence, rank on `faves_count`, dimensions and orientation, emit the
   same review-sheet format. Simpler than the Commons version: the annotations do
   the subject-matching the Commons scorer had to guess at.
2. **Schema change.** `IMAGE_PROVIDERS` is `['macaulay', 'commons']`; this adds a
   third. That touches `src/lib/schema.ts`, `scripts/validate-data.ts`, the
   `ImageCredit` component's provider branch, and their tests.
3. **A credit format.** Commons rows credit a named author; these would credit a
   username, and the licence link differs. One more branch in `ImageCredit`.
4. **Lower the width floor, or don't.** At 900px target and a 1000px floor, a
   good 769px photograph is rejected. Either the floor drops for this provider —
   and the strip is only 150px tall, so 769px is honestly fine — or week 7's best
   candidate is excluded on a technicality.

**Not needed.** No permission correspondence, no licence negotiation, no change
to the non-commercial posture. That is the whole argument for it over Audubon.

## Recommendation

Build it only if week 7 alone is worth a day, or if a second source is wanted for
reasons beyond these four weeks — for instance if any bird week later turns out
thin on Commons too.

If the goal is specifically Bald Eagle eggs, neither Commons nor iNaturalist has
one, and the remaining routes are all correspondence: a Macaulay Library licence
request (ADR-003 notes a helpdesk ticket for a non-commercial licence is cheap to
send), a state or federal wildlife agency's media library, or a nest-cam project
such as the Decorah eagles, whose operators can grant what their terms otherwise
reserve.
