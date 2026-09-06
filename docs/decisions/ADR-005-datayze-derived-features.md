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

## Build-session addendum (2026-09-06): the third constraint cannot be met

The build prompt asked for three calibration constraints at once: median 283
days, `P(D < 259)` equal to the cited CDC preterm share, and `P(D > 294)`
around 6%. **No skew-normal satisfies all three.** This is a property of the
family, not of the optimiser. `scripts/fit-labor-model.ts` prints the proof and
`tests/unit/laborProbability.test.ts` asserts it:

- Hold the median at 283 and the post-term share at 6% exactly, then sweep α.
  The implied preterm share rises monotonically with |α| and **saturates at
  4.75%** as α → −∞, where the skew-normal degenerates into a half-normal.
  4.75% is below both the CDC all-births figure (10.4%) and the spontaneous
  singleton figure the model uses (6.7%), so no member of the family reaches
  either.
- From the other direction, holding the median and the CDC share forces a
  post-term share above 18.8%.

The tension is partly in the published numbers themselves. Any distribution
with `F(259) = 0.104` and `F(294) = 0.94` puts 83.6% of its mass into the 35
days between them, which drags the median to roughly 276 rather than 283. A
sufficiently peaked unimodal density could still be made to fit; the
skew-normal's shape is too rigid.

### The deviation taken

This ADR names exactly two constraints and their tolerances: the median within
one day of 283, and `P(<37w)` within 0.5 points of *the CDC figure used*. Both
are met exactly. The post-term figure appears only in the build prompt, is
stated there as an approximation, and is described in `docs/research/` as a
range of roughly 5 to 7 per cent, so it is the one that yields.

Two things follow, and both are recorded in `src/lib/laborProbability.ts`:

1. **The preterm figure used is not 10.4%.** That figure counts all US births,
   including multiples and deliveries that were induced or scheduled. This model
   is singleton-only and spontaneous-onset-only, so it is fitted to
   `0.093 × 0.72 ≈ 0.067`: the singleton preterm rate, times the share of
   preterm births that begin spontaneously. **Both adjustment factors are round
   numbers from general literature and are the least well-sourced input to the
   model.** They are the first thing to check on review.
2. **The fitted post-term share is 12.5%, against a target near 6%.** There is a
   substantive reading under which this is less wrong than it looks: the model
   contains no induction at all, while the observed 6% comes from a population
   where most pregnancies past 41 weeks are induced. That argues for the
   direction of the gap, not its size. It is reported on the labor screen
   itself, not buried.

### Verification status

The build session could not open cdc.gov, ncbi.nlm.nih.gov or datayze.com; its
egress proxy refuses them. Every figure above is as recorded in
`docs/research/datayze-features.md` during planning, plus the two adjustment
factors. **Confirm all of them against live sources before release.**

Fitted parameters: `ξ = 296.9889, ω = 20.74, α = −6.75`. α is chosen as the
value whose post-term share comes closest to 6% while still leaving at least
0.5% of pregnancies past 43 weeks; a curve that called 43 weeks impossible would
be a worse error than missing a published percentage.

