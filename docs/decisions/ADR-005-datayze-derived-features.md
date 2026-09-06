# ADR-005: Probability features are re-derived from primary literature

Status: accepted (2026-09-06)

## Decision
- v1 includes **spontaneous labor probability**: a skew-normal model of labor-onset day, calibrated to published constraints (Smith 2001 median, CDC preterm share). Shown from 34 weeks onward as "chance of labor in the next 7 days, given you're still pregnant today" plus a small daily curve.
- **Miscarriage probability** is deferred to v1.1. The model sketch and sources are in `docs/research/datayze-features.md`. When built it is opt-in, framed as "chance of continuing", never shown on the daily screen by default, and permanently hideable.
- Nothing is scraped from Datayze. Datayze is credited in the About screen as the source of the fetal size table the author used and as the inspiration for the probability features.

## Context
Datayze has no API and no reuse license, but documents its methodology in prose. The underlying studies are public. See the research doc for parameters and sources.

## Consequences
- `src/lib/laborProbability.ts` is a pure module with a fitted parameter triple and tests asserting the calibration constraints (P(<37w) within ±0.5pt of the CDC figure used, median within ±1 day of 283).
- The About screen carries a plain-language limitations note: population averages, singleton pregnancies, spontaneous onset only, not medical advice.
