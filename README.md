# Nestling

A pregnancy tracker. Enter your last menstrual period, conception date, or due date and see each week's
fetal size as a seed, an egg, then a bird: poppy seed at week 2, Atlantic Puffin at week 23, Osprey at week 42.

Name: **Nestling** (chosen 2026-09-06; alternates listed under "Naming").

Status: **v1 built**. All seven milestones in `docs/PLAN.md` §4 are implemented and tested.
Two things are deliberately unfinished and do not block the app running: the image curation in
`docs/CURATION.md` (no asset IDs, no seed photos) and the review pass on the 123 bird facts. The
build session had no network access to Macaulay Library, Wikimedia Commons, Wikipedia or the CDC,
so none of it could be fetched or checked; see "Known gaps" below.

## Running it

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # production build; VITE_BASE=/repo/ for a project Pages URL
npm run test         # unit tests
npm run test:e2e     # Playwright, against the preview build
npm run lint         # ESLint plus the ADR-007 no-literal-colors rule
npm run typecheck
npm run validate-data
```

The per-skin screenshot baselines in `tests/e2e/__screenshots__` are pixel comparisons of text, so
they have to be generated on the machine that checks them, which is the GitHub runner. Do not
regenerate them locally: run the **Update the skin screenshots** workflow, either from the Actions
tab or by pushing a commit whose message contains `[update-screenshots]`, and review the images it
commits.

`npm run fonts` re-downloads the self-hosted woff2 subsets, `npm run icons` regenerates the PWA
icons from `public/favicon.svg`, `npm run fit-labor-model` re-derives the labor parameters, and
`npm run check-links` verifies every outbound URL in the data (needs network).

## Known gaps

| Gap | Where |
|---|---|
| No Macaulay Library asset IDs; every card shows a kind silhouette tagged "Photo coming" | `docs/CURATION.md` |
| No Commons seed photos for weeks 2-6 | `docs/CURATION.md` |
| The Macaulay embed `src` is an unverified guess, isolated in one constant | `docs/decisions/ADR-003-images.md` |
| All 123 facts are `reviewed: false` and were written without opening their sources | `docs/CURATION.md` |
| The labor model's weekly figure dips between 34 and 37 weeks, where the preterm component runs out | `docs/decisions/ADR-005-datayze-derived-features.md` |

## What it will do (v1)
- Choose how to count (last menstrual period, conception date, or a known due date) and enter the date.
- See progress as weeks and days, days remaining, and trimester.
- See this week's comparison with fetal length and weight, a Cornell Lab Macaulay Library photo embed,
  two or three short original bird facts, and a link to the species on All About Birds.
- Browse the full week-by-week timeline.
- From 34 weeks, see the chance of going into labor in the next week, re-derived from published studies.
- Seven skins named for birds: Puffin, Kingfisher, Bluebird, Green Heron, Oriole, Goldfinch, Cardinal.
- Works as an installable web app. Data stays on your device.

## Naming
| Candidate | Why |
|---|---|
| Nestling | A chick still in the nest. One word, literal for the theme, reads as a noun for the baby. |
| Featherweight | The lightest weight class; the app's weekly weight readout. Warm without being cute. |
| Hatch Day | The due date, reframed. Puns on birthday; works as a countdown ("47 days to hatch day"). |

## Not medical advice
Fetal sizes are population averages. Probability features are population statistics, not predictions
about any individual pregnancy. Talk to your clinician.

## Non-commercial
This project uses Macaulay Library media embeds, which the Cornell Lab permits for non-commercial use only.
The project has no ads, no paid tier, and must not be used commercially. See
`docs/decisions/ADR-003-images.md`.

## Repository map
| Path | What |
|---|---|
| `docs/PLAN.md` | Scope, architecture, milestones, risks, testing |
| `docs/decisions/` | Architecture decision records (ADR-001 … 007) |
| `docs/research/` | Licensing findings; Datayze feature feasibility and sources |
| `docs/CURATION.md` | Human checklist: image IDs, fact review, slug verification |
| `docs/mockups/` | Static HTML mockups of the main screens and skins; offline goose SVG |
| `data/comparisons.json` | Single source of truth for weeks, sizes, species, images, facts |
| `data/size-comparisons.source.csv` | The original spreadsheet export |
| `prompts/opus-build-prompt.md` | The prompt for the implementation session |

## Sources and credits
- Fetal length and weight table: the author's spreadsheet, drawn from datayze.com.
- Bird comparisons: the author's own pairings.
- Photos: Macaulay Library at the Cornell Lab of Ornithology (embedded, non-commercial); seed photos from Wikimedia Commons contributors (credited per image).
- Labor probability model: Smith 2001, Jukic et al. 2013, CDC/NCHS natality data. See `docs/research/datayze-features.md`.
