# Follow-up 1: labor model, CI gate, font precache, spelling

You are continuing Nestling after its v1 build (merged as PR #2). The review of that build found four things to fix. Read `README.md`, `docs/decisions/ADR-005-datayze-derived-features.md` (including the build-session addendum), `docs/decisions/ADR-007-skins.md`, and `src/lib/laborProbability.ts` before starting.

Branch from `main`, work in the order below, one commit per item, and open a pull request when done. Do not merge it. Keep every check green (`npm run lint`, `typecheck`, `validate-data`, `test`, `build`, `test:e2e`).

## 1. Replace the skew-normal labor model with a two-component mixture

### Why
The build session proved no skew-normal meets the three calibration targets at once and chose to miss the post-term share (12.5% fitted against about 6%). The larger problem is on screen: a left-skewed distribution puts its mode to the right of its median, so "most likely single day" shows 41 weeks 4 days, eight days after the due date. That will read as wrong to anyone who knows their due date. The family was the planning session's mistake; change it.

### Model
The day of spontaneous onset `D` (days from LMP) is a mixture:

```
D ~ π · Preterm + (1 − π) · Term
Term    = Normal(μ_t, σ_t)              spontaneous term labor
Preterm = Normal(μ_p, σ_p) truncated to [140, 259)   spontaneous preterm labor
```

Preterm labor is a physiologically distinct process, which is the honest reason to model it as its own component rather than as a tail.

### Calibration targets (all four, with tolerances)
| Target | Value | Tolerance | Source |
|---|---|---|---|
| Median of D | 283 days | ±1 day | Smith 2001 |
| P(D < 259) | the spontaneous-singleton preterm share currently in `CALIBRATION.pretermShare` (0.067), unless you can verify a better figure | ±0.5 pt | CDC/NCHS plus the two adjustment factors documented in the addendum |
| P(D > 294) | 0.06 | ±1.5 pt | Smith 2001 survival curve; the tolerance is wide because the observed figure is depressed by induction |
| Mode of D | within 2 days of the median | | consequence of a symmetric term component; assert it so it cannot regress |

`π` is fixed by the preterm target once the term component is set, so the free parameters are `μ_t`, `σ_t`, `μ_p`, `σ_p`. Fit `μ_t` and `σ_t` to the median and post-term targets; choose `μ_p ≈ 245`, `σ_p ≈ 14` and document them as assumptions (the preterm component's shape barely affects anything the app shows, since the panel starts at 34 weeks and the conditional probability re-normalizes). Update `scripts/fit-labor-model.ts` so it fits this model and prints the residuals, and hard-code the result in `LABOR_MODEL`.

### Code
- Keep the public API of `src/lib/laborProbability.ts` unchanged: `pdf`, `cdf`, `probabilityInWindow`, `conditionalProbabilityInWindow`, `modeDay`, `mostLikelyDayFrom`, `LABOR_PANEL_FROM_DAY`, `CURVE_FIRST_DAY`, `CURVE_LAST_DAY`. Only the model type and parameters change. Owen's T and the skew-normal primitives go away.
- Replace `FIT_RESIDUALS` and the `INFEASIBILITY` comment with the new residuals. Delete the test that asserts the infeasibility of the skew-normal; add tests for all four targets above.
- Remove the caveat sentence on the labor screen and in About that reports the post-term miss. Keep the rest of the caveats.
- Sanity table to include in your final report, using the fitted model: for days 238, 259, 266, 273, 280, 287, 294 print `P(started by day)`, `P(next 7 days | still pregnant)`, and `mostLikelyDayFrom(day)`. Expected shape: roughly 40–45% started by 280, the conditional 7-day figure rising steadily through 42 weeks, and the most likely day within two days of 283 until it has passed.
- ADR-005: add a second addendum that supersedes the first, stating the new family, the four targets, the fitted parameters, and the two preterm-component assumptions. Leave the first addendum in place as history.

## 2. Make the per-skin visual regression a CI gate
The `Per-skin visual regression (ADR-007)` step in `.github/workflows/ci.yml` passed on the GitHub runner in the last run of the build branch. Remove `continue-on-error: true` and the comment that explains it. If the step then fails on your branch because of rasterization drift, regenerate the baselines with `npm run test:e2e:update` on the runner (a one-off workflow_dispatch job is acceptable) rather than locally, and say so in the PR.

## 3. Precache only the default skin's fonts
`vite.config.ts` precaches every woff2 in `public/fonts/` (27 files, about 800 KB) on first visit. ADR-007 asks for only the active skin's fonts up front.

- Precache: the Puffin skin's faces (Bricolage Grotesque, Atkinson Hyperlegible 400 and 700) and IBM Plex Mono 400 and 500. Exclude the other fonts from `globPatterns` and `includeAssets`.
- Runtime cache: a `CacheFirst` rule for `/fonts/*.woff2` with a long expiration, so a skin's fonts are cached the first time it is selected and stay available offline afterward.
- Test: extend `tests/e2e/pwa.spec.ts` with a case that selects the Cardinal skin online, waits for its two faces to load, goes offline, reloads, and asserts the Cardinal fonts still resolve (check `document.fonts.check` for the display face) and the Today card renders.
- ADR-007: one sentence under Implementation recording the precache/runtime split.

## 4. US spelling
Facts, interface copy, and code comments mix British and US spelling ("metres", "colours", "optimiser", "modelled"). Standardize on US spelling throughout `data/comparisons.json`, `src/`, `scripts/`, `tests/`, and the docs the build session wrote. Do not change quoted titles of papers or URLs. List every changed fact in the PR body so the author's review pass sees them.

## Ground rules
Same as `prompts/opus-build-prompt.md`: `lib/` stays pure and fully tested, tokens only in component CSS, no new dependencies unless unavoidable, no features beyond this list. If the repository's Pages deployment ran on merge of PR #2, include the live URL in your report; if it failed because Pages is not enabled, say that and stop there, it is the author's setting to change.

## Final report
The sanity table from item 1, the fitted parameters and residuals, the CI run link showing the visual step gating, the before/after precache size from the build output, the count of spelling changes, and any deviation from this prompt with the reason.
