# Build prompt: Baby Bird v1 (working title)

You are implementing the v1 of Baby Bird (working title; the final name is in the README if it has been chosen, otherwise use "Baby Bird" and keep the name in one constant), a static pregnancy-tracking PWA that compares fetal size each week to a bird, egg, or seed. All product and architecture decisions have already been made in this repository. Read these before writing any code, in this order:

1. `README.md`
2. `docs/PLAN.md` (scope, architecture, milestones, testing)
3. `docs/decisions/ADR-001` through `ADR-007`
4. `docs/mockups/screens.html` (open it in a browser; it is the visual spec)
5. `data/comparisons.json` (single source of truth for content)
6. `docs/research/datayze-features.md` (labor model sources and parameters)
7. `docs/CURATION.md` (what humans will fill in; your code must tolerate it being unfinished)

Do not re-litigate the ADRs. If you find one of them technically impossible, stop, explain, and propose the smallest deviation.

## Deliverables (all milestones in `docs/PLAN.md` §4)

Work milestone by milestone. Commit after each one with a message that names the milestone. Push to the branch you were given.

### M1 Scaffold and math
- Vite + React 18 + TypeScript, strict mode. ESLint + Prettier. Vitest. Playwright. `npm run` scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `typecheck`, `validate-data`, `check-links`.
- Hash routing (GitHub Pages friendly). Base path configurable via `VITE_BASE`.
- `src/lib/gestation.ts`: implement ADR-002 exactly. Functions take `today` as a parameter; never call `new Date()` inside `lib/`. Date arithmetic on local calendar days (use `date-fns` or hand-rolled y/m/d, not ms/86400000). Table-driven tests for every edge state in ADR-002, plus one case that crosses a US DST boundary.
- `scripts/validate-data.ts`: validate `data/comparisons.json` against a zod schema; fail on duplicate weeks, missing weeks 1–42, non-monotonic lengths except the documented 20→21 convention switch, and (warning only, for now) missing facts or image IDs. Run it in CI.

### M2 Setup and Today
- Setup screen per mockup 1: three methods (last menstrual period, conception date, enter my due date), live "Due date" and "Today you are" preview on separate lines, no privacy copy on this screen. The per-method calculation details are hidden behind an info button to the right of the "Count from" label (accessible: `aria-expanded`, closes on outside tap and Escape).
- Storage per ADR-006, including the `?m=&d=` share link and the "replace saved date?" confirmation.
- Today screen per mockup 2, using `ComparisonCard`. Header: trimester left, "due <date>" right; big line "23 weeks, 0 days · 119 days to go". Card heading, top to bottom: "Week N" in italics, small lead "Your baby is roughly the size of a/an", the comparison name large, then the scientific name. Article and "egg" suffix derived from the row (e.g. "an American Robin egg"). Button text: "Copy a shareable link". Units: imperial default; metric conversions rounded (cm to 1 decimal, g to whole); the toggle lives in About.
- Empty, too-early, week-3-gap, and past-42 states from the mockup's state table.

### M3 Images
- `MacaulayEmbed` component: builds the iframe from a single template constant and `mlAssetId`. Lazy-load (IntersectionObserver). Timeout of 6 s or `offline` → render `OfflineGoose` with the "Photo needs a connection" tag.
- `OfflineGoose`: inline SVG from `docs/mockups/goose-offline.svg` (a line-drawn goose wearing a hat with a no-wifi symbol), stroked in `currentColor` so it follows the skin. You may refine the drawing; keep it a line drawing, keep the hat and the no-wifi symbol, keep it under 40 path commands. Verify the real embed `src` pattern from a live Macaulay Library asset page's Embed dialog before hard-coding it; record what you found in a code comment and in `docs/decisions/ADR-003-images.md` under "Embed mechanics".
- `CommonsImage` for `provider: "commons"` rows: local file from `public/images/`, credit line with author, license name, and links to source and license.
- `Silhouette`: three simple inline SVG marks (seed, egg, bird) for timeline rows. Do not hand-author elaborate paths.
- Text credit line under every image per ADR-003.
- If you can fetch Macaulay Library search pages, populate `image.mlAssetId` and `image.credit` for as many weeks 7–42 as you can, choosing highly rated photos of the whole bird (egg photos for 7–13). If you cannot fetch them, leave `null`; a row with no ID renders the kind silhouette with the tag "Photo coming" (not the goose), and the app must be fully usable that way. Either way, do not block on curation.
- For weeks 2, 4, 5, 6 find CC0 or CC BY seed photos on Wikimedia Commons, download them to `public/images/seeds/`, and fill the `image` object including `author`, `license`, `licenseUrl`, `sourceUrl`. Skip any file whose license is not CC0 / CC BY / CC BY-SA.

### M4 Timeline and Week
- Timeline per mockup 3, opens scrolled to the current week, kind-based silhouettes, the convention-switch divider between 20 and 21.
- `#/week/:n` renders the same `ComparisonCard` for any week 2–42.

### M5 Facts
- Write 2–3 original facts for every week 2–42 (one for each seed, and one about gizzard grit for week 3) following the rules in ADR-004. Each fact: `{ "text": "...", "sources": ["https://..."], "reviewed": false }`. Never copy sentences from All About Birds, Audubon, Birds of the World, or Wikipedia; consult them, then write your own sentence. Prefer facts about eggs, chicks, nests, incubation, and size. One sentence, ≤160 characters, no exclamation marks.
- Add a `## Facts to review` section to `docs/CURATION.md` listing the count and how to review.
- Render a small "draft" chip next to any fact with `reviewed: false`, only when `import.meta.env.DEV` or when `?review=1` is in the URL.

### M6b Skins (ADR-007)
- Seven skins as data files, `applySkin()`, `SkinPicker` in About, persisted selection, default Puffin.
- Light tokens from the ADR table; derive dark tokens per skin and record them in the skin file with a comment on the contrast ratios you measured.
- Self-host the fourteen display/body families plus IBM Plex Mono (latin subset, woff2, only the weights used). Load only the active skin's fonts up front.
- Add the stylelint rule that forbids literal colors in component CSS.
- Playwright: screenshot Today in every skin, light and dark; commit the baselines.

### M6 Labor probability
- `src/lib/laborProbability.ts`: skew-normal model of spontaneous labor day (days from LMP). Fit `(ξ, ω, α)` offline to: median 283 days (Smith 2001), P(day < 259) equal to the CDC preterm share you cite (state year and value in a constant with a source URL), and P(day > 294) ≈ 6%. Hard-code the fitted parameters; include the fitting script under `scripts/fit-labor-model.ts` so it is reproducible. Export `pdf`, `cdf`, `probabilityInWindow`, and `conditionalProbabilityInWindow(fromDay, toDay)` = P(from ≤ D ≤ to | D ≥ from). Tests assert the three calibration constraints within tolerance and that the conditional probability is monotonically non-decreasing over the last trimester.
- Labor panel per mockup 4: card on Today from 34w0d, detail screen at `#/labor` with the Today tab still selected, daily curve as inline SVG drawn from the model, caveat text and sources, and a "Hide this panel" toggle stored in settings.
- Do not build the miscarriage feature. Leave a `docs/decisions/ADR-005` reference in the About screen ("coming later").

### M7 PWA, CI, deploy
- Web manifest, icons (generate a simple puffin mark as SVG, rasterize to PNG sizes at build), `vite-plugin-pwa` with an app-shell strategy that never caches cross-origin frames and never caches URLs with query strings.
- About screen: skin picker, unit toggle, labor panel toggle, sources, credits (Macaulay Library, Wikimedia Commons contributors, Datayze as the source of the size table the author used, the studies behind the labor model), non-commercial statement, "not medical advice", "Forget my data".
- GitHub Actions: `ci.yml` (lint, typecheck, unit tests, validate-data, build, Playwright smoke) on every push and PR; `deploy.yml` to GitHub Pages on `main`.
- Playwright smoke: setup → today shows "23 weeks, 0 days" for LMP 2026-03-29 with a mocked clock at 2026-09-06 → timeline highlights week 23 → week 23 card names the Atlantic Puffin.
- Lighthouse PWA installability passes on the preview build.

## Ground rules
- Keep `lib/` pure and fully tested. UI components can be lightly tested; the e2e smoke covers integration.
- No analytics, no third-party scripts other than Macaulay Library embeds, no network calls at runtime other than those embeds.
- Accessibility: every interactive element keyboard-reachable with a visible focus ring; images and embeds have alt text or an accessible label; color contrast ≥ 4.5:1 for text in both light and dark themes.
- Dark theme via `prefers-color-scheme` within the active skin. Components use skin tokens only (ADR-007).
- Fonts are self-hosted per skin in `public/fonts/` with fallback stacks; nothing is loaded from Google at runtime (the app must work offline).
- Copy: plain and short. No exclamation marks, no reassurance filler, no explaining how apps work.
- Anything you write that is content rather than code (facts, About text, error copy) gets listed at the end of your final report so the author can review voice and accuracy.
- Do not add features beyond this list. If something is ambiguous, pick the option closest to the mockups and note it in your final report.

## Final report
List: what shipped per milestone, test counts and coverage for `lib/`, the exact Macaulay embed markup you verified, how many image IDs and facts you filled, every content passage you authored, every deviation from the ADRs and why, and the live GitHub Pages URL if deploy succeeded.
