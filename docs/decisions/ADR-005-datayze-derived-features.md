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
family, not of the optimizer. `scripts/fit-labor-model.ts` prints the proof and
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


## Follow-up addendum (2026-09-06): the family changes to a two-component mixture

**This addendum supersedes the build-session addendum above, which is left in
place as history.** The skew-normal is gone. The reason it had to go was not the
missed post-term figure but what the skew put on screen: a left-skewed density
has its mode to the right of its median, so the panel's "most likely single day"
read 41w4d, eight days after the due date. That is the first thing a reader who
knows their due date would check, and it looked wrong.

### The family

```
D ~ π · Preterm + (1 − π) · Term
Term    = Normal(μ_t, σ_t)
Preterm = Normal(μ_p, σ_p) truncated to [140, 259)
```

Preterm labor is a physiologically distinct process rather than the tail of the
term one, which is the honest reason to model it as its own component. It is
also what makes the fit possible: the preterm mass no longer has to be bought
with skew, so the term component can stay symmetric and keep the mode beside the
median.

### The four targets, all met

| Target | Value | Tolerance | Fitted | Source |
|---|---|---|---|---|
| Median of `D` | 283 d | ±1 d | 283.00 d | Smith 2001 |
| `P(D < 259)` | 0.067 | ±0.5 pt | 0.0670 | CDC/NCHS plus the two adjustments above |
| `P(D > 294)` | 0.06 | ±1.5 pt | 0.0600 | Smith 2001 survival curve |
| Mode of `D` | within 2 d of the median | | +0.60 d | on-screen requirement, not a published figure |

Fitted parameters: `π = 0.066852`, `μ_t = 283.6145`, `σ_t = 6.8341`, with
`μ_p = 245`, `σ_p = 14`. `P(D > 43w) = 0.0051`, so the curve still does not call
43 weeks impossible.

Because the whole preterm component sits below day 259, the three published
targets separate: the median and post-term targets give `μ_t` and `σ_t` in
closed form once `π` is known, and the preterm target gives `π` once they are.
`scripts/fit-labor-model.ts` iterates that pair to a fixed point and prints the
residuals.

### The two preterm-component assumptions

`μ_p = 245` (35w0d) and `σ_p = 14` are **assumptions, not fits**. The only
constraints on the preterm component are that it carries share `π` and that all
of it lands before 37 weeks, which leaves its shape free, and no source in
`docs/research/datayze-features.md` pins it. The chosen values put the bulk of
preterm onset in the late-preterm weeks, which is where most of it is observed.
Nothing past 37 weeks depends on the choice.

### What this costs: the 34–37 week readings

The panel's headline figure is **not monotonic between 34 and 37 weeks**. It
falls on 16 of those 21 days, from about 1.6% at 34w0d to 0.5% at 37w0d, then
jumps to 5.5% at 38w0d. The preterm component runs out at 37w0d before the term
component has begun.

This is a property of the four targets, not of `μ_p` and `σ_p`: 6.7% of onsets
have to fit below day 259 while the term component contributes almost nothing
there, so the hazard has to fall somewhere in the late preterm weeks. Sweeping
`μ_p` over [215, 245] and `σ_p` over [10, 26] moves the fall but never removes
it; the fit script prints this. The old skew-normal had no dip, so this is a
regression in on-screen behavior traded for a correct mode, and it is
**the model's main open question for review**. Two ways out, neither taken here
because both go beyond what the follow-up prompt asked for:

1. Widen `σ_t` and accept a post-term share above the 1.5-point tolerance, on
   the argument that the observed 6% is depressed by induction. This fills the
   trough and is the change to make if the dip matters more than the figure.
2. Start the panel at 37 weeks rather than 34, so the dip is never shown.

`tests/unit/laborProbability.test.ts` pins the dip's size rather than asserting
it away, and asserts monotonicity from 37 weeks on.

### Verification status

Unchanged, and still the first thing to check on review. The follow-up session
had no more network access than the build session did: cdc.gov,
ncbi.nlm.nih.gov and doi.org are all refused by the egress proxy, so no figure
above has been read at its source. In particular `0.093 × 0.72 ≈ 0.067` is still
two round numbers from general literature. **Confirm all of them before
release.**
