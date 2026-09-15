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
one day of 283, and `P(<37w)` within 0.5 points of _the CDC figure used_. Both
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

At build time, the egress proxy refused cdc.gov, ncbi.nlm.nih.gov and
datayze.com, so every figure above was recorded from
`docs/research/datayze-features.md` during planning, plus the two adjustment
factors, without opening a live source.

**Update (2026-09-14):** network access has since been opened. A prior session
recorded that `www.cdc.gov`, `pmc.ncbi.nlm.nih.gov` and `datayze.com` return
real content from this environment, checked with `curl` through the agent
proxy — not the browser check this repo's CLAUDE.md asks for, so treat even
that as provisional. Either way, reachability is not verification: no figure
above has actually been read at its source, and every one of them, plus the
two adjustment factors, **still needs to be confirmed before release.**

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

| Target        | Value                    | Tolerance | Fitted   | Source                                        |
| ------------- | ------------------------ | --------- | -------- | --------------------------------------------- |
| Median of `D` | 283 d                    | ±1 d      | 283.00 d | Smith 2001                                    |
| `P(D < 259)`  | 0.067                    | ±0.5 pt   | 0.0670   | CDC/NCHS plus the two adjustments above       |
| `P(D > 294)`  | 0.06                     | ±1.5 pt   | 0.0600   | Smith 2001 survival curve                     |
| Mode of `D`   | within 2 d of the median |           | +0.60 d  | on-screen requirement, not a published figure |

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

Still the first thing to check on review. At the time of the follow-up
session, cdc.gov, ncbi.nlm.nih.gov and doi.org were all refused by the egress
proxy, same as during the build session, so no figure above had been read at
its source.

**Update (2026-09-14):** network access has since been opened, and a prior
session recorded `www.cdc.gov` and `pmc.ncbi.nlm.nih.gov` as returning real
content from this environment (checked with `curl`, not a browser — see the
first Verification status section above for the caveat that follows from
that). `doi.org` itself is not among the hosts checked. None of this amounts
to verification: no figure above has actually been read at its source, and in
particular `0.093 × 0.72 ≈ 0.067` **remains** two round numbers from general
literature. **Confirm all of them before release.**

## Third addendum (2026-09-14): the dip was the truncation, not the targets

**The 34–37 week trough is fixed.** The preterm component is no longer truncated
to `[140, 259)`. Everything else about the family is unchanged, all four targets
are still met to the same tolerances, and the fitted parameters move only
slightly.

### What the second addendum got wrong

That addendum diagnosed the trough as "a property of the four targets, not of
`μ_p` and `σ_p`", and reported a sweep of `μ_p` over [215, 245] and `σ_p` over
[10, 26] that moved the fall but never removed it. The sweep was real and its
conclusion about `μ_p`/`σ_p` was correct. The diagnosis was not.

The truncation was never in the swept space. It was doing the damage on its own:
cutting the preterm component off at day 259 exactly meant the density fell
**eighteenfold in a single day** at 37w0d — from 1.520 to 0.083 per thousand —
and the weekly figure read **0.48% at 37 weeks against 1.56% at 34**, displayed
as "under 1%". A reader at 37 weeks was told they were less likely to go into
labor in the next week than they had been three weeks earlier.

The second addendum offered two ways out, and rejected both as out of scope:
widen `σ_t` past the post-term tolerance, or start the panel at 37 weeks so the
trough is never shown. There was a third it did not consider, which costs
nothing: remove the truncation.

### Why the truncation was wrong anyway

It encoded "labor by the preterm process cannot happen at or after 37 weeks",
which is not true of the thing being modelled. Preterm and term labor are
distinct processes, which is the honest reason for two components, but the
boundary between them is a definition about gestational age, not a fact about
onset mechanics. A process centred at 35w0d with a two-and-a-half week spread
should be expected to contribute a little onset after 37 weeks, and now does:
about 1.9 points of the 8.6% weight lands there.

`π` rises from 0.0669 to 0.0856 as a result. It is the share following the
preterm _process_, which the truncation had forced to coincide with the share
_delivering_ preterm; untruncated the two come apart, and the 6.7% target is met
by the part of the component that lands below day 259.

### What it costs on screen

| Week  | Truncated | Untruncated |
| ----- | --------- | ----------- |
| 34w0d | 1.56%     | 1.33%       |
| 35w0d | 1.58%     | 1.35%       |
| 36w0d | 1.28%     | 1.19%       |
| 37w0d | **0.48%** | **1.30%**   |
| 38w0d | 5.55%     | 5.69%       |

A shallow trough remains, and should: a gap between a preterm process centred
near 35 weeks and a term one near 40.5 is a real feature, not an artifact. What
has gone is the cliff. The largest single-day fall in density between 34 and 40
weeks is now **2.8%**, against 94.5% before, and 37 weeks is no longer the low
point of the band. `tests/unit/laborProbability.test.ts` pins both the 2.8% and
the requirement that no reading in the band sits below four fifths of the
highest.

### Datayze's own approach was evaluated and not taken

Their published methodology (read at
`https://datayze.com/labor-probability-calculator`, 2026-09-14) uses a **single
skew-normal**, calibrated to roughly 10% preterm and a median at the due date,
citing Kieler 1995 (SD 9 days) and Bergsjø 1990 (SD 13). It notably does **not**
constrain the post-term share, and it explicitly treats a mode later than the
median as correct — "in prior studies the mode date is typically after the
median", "conventional wisdom is that the most common day to go into labor is
around 41 weeks". That is the behaviour the first follow-up session rejected the
skew-normal for.

Refitting a skew-normal here confirms why it still cannot be used. Holding the
median at 283 and hitting the preterm target, it forces **P(D > 294) between
12% and 27%** depending on the shape parameter, against an observed 6%. At
`α = −4` the fit reproduces this ADR's own earlier skew-normal almost exactly
(ω 20.74, ξ 296.99), which is a useful check that the two calculations agree.
Trading a 0.5-point error at 37 weeks for a 6-to-21-point error past 42 weeks is
not an improvement, so the mixture stays.

### Verification status, at last partly discharged

Network access is open, and two figures have now been **read at their sources**
rather than recalled:

- **CDC preterm rate, 10.4% for 2022** — confirmed on `cdc.gov`: "The preterm
  birth rate declined 1% from 2021 to 2022, to 10.4%."
- **Jukic 2013** — confirmed on PMC: "The median time from ovulation to birth was
  268 days", and an LMP-based mean of 285 days with **SD 14**. On the LMP scale
  that median is ~282 days, which corroborates Smith's 283 to within a day.

**Smith 2001 is still unread.** OUP serves HTTP 403 to this environment, so the
median of 283 and the 6% post-term figure remain second-hand, now with Jukic as
independent support for the first.

**The two adjustment factors are still the weakest input and still unverified.**
`0.093 × 0.72 ≈ 0.067` remains two round numbers from general literature. They
are now the only wholly unsourced numbers in the model, and remain the first
thing to check.

## Fourth addendum (2026-09-15): the post-term target was starving the term weeks

The third addendum removed the truncation and called the trough fixed. It was
not. The author read the panel at 37w0d, saw **1.3% over a whole week**, and said
that must be wrong — that 1% sounds like a figure for the next _day_, not the
next seven. They were right, and the check that would have caught it was never
run: at no point had anyone asked what share of pregnancies the model puts in
each week, or compared that to a measured distribution.

Doing so is damning:

| Week | Model, as of addendum 3 | Jukic 2013, N(285, 14) on the LMP scale |
| ---- | ----------------------- | --------------------------------------- |
| 37w  | **1.2%**                | **5.6%**                                |
| 38w  | 5.2%                    | 10.8%                                   |
| 39w  | 21.6%                   | 16.5%                                   |
| 40w  | **36.2%**               | 19.6%                                   |
| 41w  | 23.0%                   | 18.3%                                   |

Week 37 was about a quarter of what the only measured distribution to hand
implies, and week 40 alone absorbed 36% of all pregnancies. The weekly sequence
ran 1.33, 1.35, 1.19, 1.30, then **5.69** — a fourfold step between consecutive
weeks. The hazard of spontaneous labor climbs into term; it does not sit flat
for a month and then quadruple.

### The cause, and what changes

`σ_t` was 6.8 days. At 37w0d that is 3.66 SD below the term mean, so the term
component contributed essentially nothing and the week-37 mass was leftover
preterm. `σ_t` was not chosen: it was **forced** by fitting `P(D > 294) = 0.06`.
Holding the median at 283 and that share at 6% admits no wider term component.

So the post-term share stops being a target, and the term spread becomes one:

- **`σ_t = 10` days**, from Jukic 2013, which measures the SD of ovulation-based
  gestation at 10 and of LMP-based at 14. The difference is cycle-length
  variation, which this app removes by asking for cycle length (ADR-002), so 10
  is the right scale for the population it addresses.
- **`P(D > 294)` is now an output**: 14.7%, against the ~6% previously fitted.

Fitted parameters: `π = 0.078461`, `μ_t = 284.0318`, `σ_t = 10`, with `μ_p = 245`
and `σ_p = 18` unchanged. Median 283.000, `P(D < 259)` 0.0670, mode 284.

### Why the 6% was the figure to give up

It was always the weakest of the four. Smith 2001's abstract has since been read
(via Europe PMC; the full text is still paywalled to this environment) and it
states the median of 283 days — which is now **verified** — and **no post-term
figure at all**. The 6% was read off a survival curve during planning and has
never been confirmed.

Smith's cohort also argues against transplanting any spread from it: he selected
1514 women whose menstrual dating and first-trimester crown-rump length agreed
**within one day**. That is a deliberately dating-accurate sample, narrower than
the population using this app, who type in a period date from memory.

A post-term share of 14.7% is higher than delivery records show, and that is
expected rather than embarrassing: this model contains no induction at all,
while the observed 6% comes from a population where most pregnancies past 41
weeks are induced. The labor screen says so in as many words now, rather than
quoting 6% as something the curve was fitted to.

### What it costs, and what it buys

| Week  | Addendum 3 | Now       |
| ----- | ---------- | --------- |
| 34w0d | 1.33%      | 1.22%     |
| 35w0d | 1.35%      | 1.30%     |
| 36w0d | 1.19%      | 1.61%     |
| 37w0d | 1.30%      | **3.73%** |
| 38w0d | 5.69%      | 10.73%    |
| 39w0d | 24.87%     | 24.29%    |

The weekly figure now **rises every single day from 34 weeks to 43**, and the
density never falls anywhere between 34 and 40 weeks. Both are asserted in
`tests/unit/laborProbability.test.ts`, replacing the test that pinned the flat
1–2% band as though it were correct.

### The lesson worth keeping

Two successive fits met every stated target and were still wrong on screen,
because the targets described the _tails_ — a median, a preterm share, a
post-term share — and nothing described the _middle_, which is the part almost
every reader looks at. A calibration target set that pins only the ends of a
distribution will let the middle go anywhere. The weekly table above is now
printed by `npm run fit-labor-model` on every run, so the shape is visible
rather than inferred from residuals that all say "met".
