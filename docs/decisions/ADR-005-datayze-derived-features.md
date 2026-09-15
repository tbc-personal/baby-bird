# ADR-005: Probability features are re-derived from primary literature

Status: accepted (2026-09-06)

## Decision

- v1 includes **spontaneous labor probability**, calibrated to published constraints rather than taken from anyone's implementation. Shown from 34 weeks onward as "chance of labor in the next 7 days, given you're still pregnant today" plus a small daily curve. The family is a two-component mixture; see "The model as it stands" below. (This bullet originally specified a skew-normal, which was tried and abandoned — see "Routes already tried".)
- **Miscarriage probability** is deferred to v1.1. The model sketch and sources are in `docs/research/datayze-features.md`. When built it is opt-in, framed as "chance of continuing", never shown on the daily screen by default, and permanently hideable.
- Nothing is scraped from Datayze. Datayze is credited in the About screen as the source of the fetal size table the author used and as the inspiration for the probability features.

## Context

Datayze has no API and no reuse license, but documents its methodology in prose. The underlying studies are public. See the research doc for parameters and sources.

## Consequences

- `src/lib/laborProbability.ts` is a pure module with fitted parameters and tests asserting every calibration target. `scripts/fit-labor-model.ts` reproduces the parameters and prints the residuals and the weekly shape.
- The About screen carries a plain-language limitations note: population averages, singleton pregnancies, spontaneous onset only, not medical advice.

## The model as it stands

```
D ~ π · Preterm + (1 − π) · Term
Term    = Normal(μ_t, σ_t)
Preterm = Normal(μ_p, σ_p)
```

Preterm labor is modelled separately because it is a physiologically distinct
process, not the tail of the term one. Neither component is truncated.

Fitted: `π = 0.078461`, `μ_t = 284.0318`, `σ_t = 10`. Assumed, not fitted:
`μ_p = 245` (35w0d) and `σ_p = 18`. The preterm component's only real
constraints are that it carries share π and that most of it lands before 37
weeks, which leaves its shape free; 35w0d with a two-and-a-half week spread puts
the bulk of onset in the late-preterm weeks, where most of it is observed.

Note that π (0.078) exceeds the preterm share (0.067). It is the share following
the preterm _process_; a little of that component lands after 37 weeks, which is
the point — labor by that process does not become impossible the instant 37
weeks is reached.

### The targets, and how far each can be trusted

| Target                | Value        | Source             | Verified?                                                                                                        |
| --------------------- | ------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Median of `D`         | 283 d ±1     | Smith 2001         | **Yes** — abstract read via Europe PMC. Jukic's LMP-scale median of ~282 d corroborates it.                      |
| `P(D < 259)`, preterm | 0.067 ±0.005 | CDC/NCHS, adjusted | **Partly.** The CDC figure (10.4%, 2022) is confirmed on cdc.gov. The two adjustments to it are not — see below. |
| `σ_t`, term spread    | 10 d         | Jukic 2013         | **Yes** — confirmed on PMC: SD 10 for ovulation-based gestation, 14 for LMP-based.                               |

`σ_t` is taken from the ovulation-based figure rather than the LMP one because
the difference between them is cycle-length variation, which this app removes by
asking for cycle length (ADR-002).

**The weakest input, and the first thing to check on review:** the preterm
target is `0.093 × 0.72 ≈ 0.067` — the singleton preterm rate times the share of
preterm births that begin spontaneously. Both factors are round numbers from
general obstetric literature, neither has been read at a source, and they are
the only wholly unsourced numbers in the model. Smith 2001's full text is
paywalled to this environment (OUP serves 403), so anything attributed to it
beyond the abstract is second-hand.

`P(D > 294)` is **an output, not a target**: 14.7%, against roughly 6% in
delivery records. That gap is expected rather than a defect — the model contains
no induction at all, while the observed figure comes from a population where
most pregnancies past 41 weeks are induced. The labor screen states this.

## Routes already tried, and why they failed

Three of these were shipped before they were understood to be wrong. They are
recorded so nobody walks them again.

**A single skew-normal** (the original family). Holding the median at 283 and
hitting the preterm target forces `P(D > 294)` to between 12% and 27% depending
on the shape parameter — against ~6% observed. Its left skew also puts the mode
about eight days after the due date; Datayze, whose published methodology uses a
skew-normal, treats a late mode as correct, but it reads as broken to anyone who
knows their due date. Refitting one reproduces this ADR's earlier skew-normal
almost exactly (ω 20.74, ξ 296.99), which is a useful check that two independent
calculations agree.

**Truncating the preterm component to `[140, 259)`.** This made the three
targets separate in closed form, and cut the density off at 37w0d exactly: it
fell eighteenfold in a single day there, and the weekly figure read 0.48% at 37
weeks against 1.56% at 34 — the panel told a reader three weeks further along
that labor had become less likely. Sweeping `μ_p` and `σ_p` moves that fall but
never removes it, which was once mistaken for proof that the dip was a property
of the targets. It was a property of the truncation, which was not in the swept
space.

**Fitting `P(D > 294) = 0.06`.** This forces `σ_t` to 6.8 days. At 37w0d that is
3.66 SD below the term mean, so the term component contributes almost nothing
and the week-37 mass is leftover preterm: 1.2% of pregnancies against the 5.6%
Jukic's measured distribution implies, while week 40 alone absorbed 36%. The 6%
was read off a survival curve during planning and never confirmed; Smith's
abstract states no post-term figure. His cohort also argues against borrowing
any spread from it — 1514 women whose menstrual dating and first-trimester
crown-rump length agreed within one day, far better dated than someone typing a
remembered period date into this app.

## The check that would have caught all three

Each of those fits met every stated target and printed "met" on every residual.
The targets described the _tails_ — a median, a preterm share, a post-term share
— and nothing described the _middle_, which is the part nearly every reader
looks at. **A target set that pins only the ends of a distribution will let the
middle go anywhere.**

So the test is not the residuals. It is: what share of pregnancies does this put
in each week, and does that rise the way a hazard should? `npm run
fit-labor-model` prints that table on every run.
`tests/unit/laborProbability.test.ts` asserts the weekly figure rises every day
from 34 weeks to 43 and that the density never falls between 34 and 40 weeks.

## Miscarriage probability

Still deferred, unbuilt, and not announced in the interface. When built it is
opt-in, framed as "chance of continuing", never on the daily screen by default,
and permanently hideable. Model sketch and sources in
`docs/research/datayze-features.md`.
