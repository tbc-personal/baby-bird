# Nestling

A pregnancy tracker. Enter your last menstrual period, conception date, or due date and see each week's
fetal size as a seed, an egg, then a bird: a poppy seed at week 3, Atlantic Puffin at week 23, Osprey at week 42.

Name: **Nestling** (chosen 2026-09-06; alternates listed under "Naming").

Status: **v1 built**, and revised since. Every photo is a Wikimedia Commons file downloaded into
the repo, so the app makes no third-party request at runtime and works fully offline (ADR-003
records why the planned Macaulay Library embeds were abandoned). Two things are deliberately
unfinished and neither blocks the app running: four weeks have no photo yet
(`docs/CURATING-PHOTOS.md`), and 24 of the 120 bird facts are unreviewed. See "Known gaps".

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

| Gap                                                                                                                                                | Where                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Weeks 7, 9, 12 and 13 have no Commons photo yet; those cards show a kind silhouette tagged "Photo coming"                                          | `docs/CURATING-PHOTOS.md`                            |
| 24 of 120 bird facts are still `reviewed: false`                                                                                                   | `docs/research/fact-check-summary.md`, ADR-004       |
| The labor model's preterm target rests on two unverified adjustment factors, and it puts more pregnancies past 42 weeks than delivery records show | `docs/decisions/ADR-005-datayze-derived-features.md` |

## What it does

- Choose how to count (last menstrual period, conception date, or a known due date) and enter the
  date. Counting from a period also asks your typical cycle length, because Naegele's 280 days
  assumes a 28-day cycle and a longer one means later ovulation and a later due date (ADR-002).
- See progress as weeks and days, days remaining, and trimester.
- Look ahead or back a week at a time from Today, with the calendar dates that week covers.
- Tap either measurement to see that measure plotted across weeks 3-42, this week marked.
- See this week's comparison with fetal length and weight, a locally-served Wikimedia Commons photo
  (or a silhouette for the four weeks not yet curated), two or three short original bird facts, and
  a link to the species on All About Birds.
- Browse the full week-by-week timeline.
- From 34 weeks, see the chance of going into labor in the next week, re-derived from published studies.
- Seven skins named for birds: Puffin, Kingfisher, Bluebird, Green Heron, Oriole, Goldfinch, Cardinal.
- Setup and About are one page, reached from the sliders tab: the date first, then display settings,
  sources, credits and "Forget my data".
- Works as an installable web app. Data stays on your device.

## Naming

| Candidate     | Why                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------- |
| Nestling      | A chick still in the nest. One word, literal for the theme, reads as a noun for the baby. |
| Featherweight | The lightest weight class; the app's weekly weight readout. Warm without being cute.      |
| Hatch Day     | The due date, reframed. Puns on birthday; works as a countdown ("47 days to hatch day").  |

## Not medical advice

Fetal sizes are population averages. Probability features are population statistics, not predictions
about any individual pregnancy. Talk to your clinician.

## Non-commercial

The project has no ads, no paid tier, and must not be used commercially. This is a project choice,
not a licensing constraint on the images shipped today: photos come from Wikimedia Commons under
licenses that permit commercial use, credited per image. The commercial restriction dates from when
the app was planned around Macaulay Library embeds, which the Cornell Lab permits for
non-commercial use only; that route was abandoned and its code removed (see
`docs/decisions/ADR-003-images.md`), but the project's non-commercial posture has not changed.

## Repository map

| Path                               | What                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `docs/decisions/`                  | Architecture decision records (ADR-001 … 007)                   |
| `docs/research/`                   | Licensing findings; Datayze feature feasibility and sources     |
| `docs/mockups/`                    | Static HTML mockups of the main screens and skins               |
| `docs/research/font-audit.md`      | Typography inventory; what is deliberately inconsistent         |
| `data/comparisons.json`            | Single source of truth for weeks, sizes, species, images, facts |
| `data/size-comparisons.source.csv` | The original spreadsheet export                                 |

## Sources and credits

- Fetal length and weight table: the author's spreadsheet, drawn from datayze.com.
- Bird comparisons: the author's own pairings.
- Photos: Wikimedia Commons contributors, credited and licensed per image.
- Labor probability model: Smith 2001, Jukic et al. 2013, CDC/NCHS natality data. See `docs/research/datayze-features.md`.
