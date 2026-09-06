# Puffin Baby: development plan

A pregnancy tracker that compares fetal size each week to a bird, a bird's egg, or a bird seed.
Decisions are recorded in `docs/decisions/`; research in `docs/research/`; the build prompt for the
implementation session is `prompts/opus-build-prompt.md`.

> "Puffin Baby" is taken from the title of the source spreadsheet. Confirm or rename.

## 1. Scope

### v1 (build session deliverable)
1. Setup screen: dating-method dropdown (LMP, conception date; ultrasound due date proposed), date input, validation.
2. Today screen: weeks + days, days to due date, trimester, progress bar, this week's comparison card
   (comparison name, fetal length and weight with unit toggle, Macaulay Library embed or Commons image,
   2–3 facts, All About Birds link), share-link and settings entry points.
3. Timeline screen: all 41 comparison rows (weeks 2–42) as a scrollable list; tapping opens that week's card.
4. Labor probability panel (from 34w0d): chance of spontaneous labor in the next 7 days given still pregnant, with daily curve and caveats.
5. About screen: sources, credits, non-commercial statement, limitations, "forget my data".
6. PWA: manifest, icons, app-shell service worker, offline placeholder for embeds.
7. Content: curated image IDs for every week; original facts for every week (flagged for review).
8. Tests: unit tests for gestation math and labor model; one Playwright smoke test (setup → today → timeline).
9. CI: GitHub Actions running lint, typecheck, tests; deploy to GitHub Pages on `main`.

### v1.1
- Miscarriage "chance of continuing" panel, opt-in (ADR-005).
- Week 3 comparison and any other data gaps filled by the author.
- Optional: metric/imperial preference, push-style "new week" notification via the PWA.

### Out of scope
Accounts, sync, kick counters, contraction timers, ads, anything commercial.

## 2. Architecture

```
src/
  main.tsx, App.tsx             routing (hash router keeps GitHub Pages simple)
  lib/gestation.ts              ADR-002 math, pure functions
  lib/laborProbability.ts       ADR-005 skew-normal model, pure functions
  lib/storage.ts                versioned localStorage + URL share params (ADR-006)
  data/comparisons.ts           typed import of ../data/comparisons.json + schema validation at build
  components/
    SetupForm, TodayCard, ComparisonCard, MacaulayEmbed, CommonsImage,
    Silhouette, FactList, Timeline, LaborPanel, About, UnitToggle
  screens/ Setup, Today, Timeline, Week, Labor, About
data/comparisons.json           single source of truth (see §3)
scripts/
  validate-data.ts              schema + gap check, runs in CI
  check-links.ts                quarterly: embed IDs still resolve, AAB slugs 200
docs/                           plans, ADRs, research, mockups
```

State model: `{ version: 1, method: 'lmp' | 'conception' | 'dueDate', inputDate: 'YYYY-MM-DD', units: 'imperial' | 'metric', laborPanelEnabled: boolean }`. Everything else derived.

## 3. Data model (`data/comparisons.json`)

One row per week 1–42. Fields: `week`, `lengthIn`, `lengthMeasure` (crown-rump ≤20, crown-heel ≥21), `weightOz`,
`weightIsUpperBound`, `kind` (seed | egg | bird), `comparison`, `scientificName`, `wikipediaTitle`,
`allAboutBirdsSlug`, `ebirdSpeciesCode`, `image { provider, mlAssetId, embedUrl, credit, altText }`, `facts[] { text, sources[], reviewed }`.

Known gaps: week 1 (no data, by design), week 3 (no comparison). Names, slugs and codes were filled during
planning and must be verified (see `docs/CURATION.md`).

## 4. Milestones for the build session

| # | Milestone | Done when |
|---|---|---|
| M1 | Scaffold + math | Vite app runs; `gestation.ts` tests pass incl. edge states; data validation script passes |
| M2 | Setup + Today | Enter a date, see correct weeks/days and the right comparison row; state survives reload |
| M3 | Images | `MacaulayEmbed` renders a curated ID; offline/failed state shows silhouette; seeds render Commons image with credit |
| M4 | Timeline + Week | All rows listed; deep link `#/week/23` works |
| M5 | Facts | Every week has ≥2 facts with sources, `reviewed: false` |
| M6 | Labor panel | Model tests pass calibration; panel appears at 34w |
| M7 | PWA + CI + deploy | Installable; Lighthouse PWA pass; Actions green; Pages URL live |

## 5. Key risks
1. Macaulay Library embed fragility (ADR-003). Mitigated by isolation, fallback, and link-check script.
2. Curating ~40 asset IDs requires a human with a browser; the build session may be unable to fetch Cornell pages. Curation checklist provided; the app must run with missing IDs (silhouette fallback) so curation can trail the code.
3. Fact accuracy. Every fact carries a source and a review flag.
4. Date math off-by-one and timezone bugs. Table-driven tests with fixed "today".

## 6. Testing strategy
- Vitest for `lib/*` (aim: 100% branch coverage on gestation math).
- Fixed-date tests: pass `today` explicitly; never call `new Date()` inside lib code.
- Playwright: one happy-path smoke test on the built site plus one test that a Macaulay embed iframe reaches `load`.
- `scripts/validate-data.ts` fails CI on schema errors, duplicate weeks, or missing facts for weeks 2–42 (week 3 exempted until filled).
