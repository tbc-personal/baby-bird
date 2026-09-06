# Datayze feature feasibility: miscarriage probability and spontaneous-labor probability

Question asked: can the app reproduce the two Datayze features (miscarriage
probability chart, labor probability calculator) given that Datayze data is
not licensed for reuse and there is no API?

Short answer: yes, both are reproducible from published primary sources.
Datayze publishes its methodology in prose on each page, and the underlying
studies are public. Neither feature needs Datayze data. Each one is a
self-contained pure function over (gestational day, optional risk factors).

## 1. Spontaneous labor probability

### What Datayze does
From the [Labor Probability Calculator](https://datayze.com/labor-probability-calculator) page text (as surfaced in search results):

- Prior research modeled spontaneous-labor onset as a normal distribution with SD of 9 or 13 days. A plain normal predicts far too few preterm births (0.03% to 2.7%).
- Datayze instead fits a **left-skewed normal distribution** so that P(labor before 37w0d) = **9.6%**, matching the CDC preterm birth rate.
- Outputs: probability of labor on each day; cumulative probability by a given date; "probability you go into labor this week"; a daily chart.

### Primary sources to build from
- Jukic AM et al. 2013, *Length of human pregnancy and contributors to its natural variation*, Hum Reprod. Median ovulation-to-birth 268 days (38w2d from ovulation, i.e. 40w2d LMP-equivalent), SD 10 days. [PMC3777570](https://pmc.ncbi.nlm.nih.gov/articles/PMC3777570/)
- Smith GCS 2001, *Use of time to event analysis to estimate the normal duration of human pregnancy*, Hum Reprod. Median non-elective delivery 283 days after LMP; 284 nulliparous vs 282 multiparous.
- CDC/NCHS natality: preterm (<37w) share of US births roughly 10.4% in recent years (was 9.6% around 2015, which is the figure Datayze cites). Use the latest NCHS Data Brief and document the year.
- Open-source precedent: [jehna/labour-calculator](https://github.com/jehna/labour-calculator) (MIT, archived) and Maggie Appleton's [birth probability](https://maggieappleton.com/birth-probability) write-up.

### Implementation sketch
- Model the day of spontaneous onset `D` (days from LMP) with a skew-normal distribution: location `ξ`, scale `ω`, shape `α < 0`.
- Fit the three parameters to three published constraints: median ≈ 283 days (Smith), P(D < 259) = preterm rate (CDC), and roughly P(D > 294) ≈ post-term share (~5–7% before induction, from Smith's Kaplan-Meier curve). Fit once offline; hard-code the parameters and the constraints in a unit test.
- Expose: `pdf(day)`, `cdf(day)`, `probabilityInWindow(fromDay, toDay)`, and **conditional** probability given "still pregnant today": `P(labor in [t, t+7] | D ≥ t)`. The conditional form is what the user actually wants and is what Datayze shows.
- Optional parity adjustment: shift median by ±1 day (Smith).
- Caveat text: model is for spontaneous onset in singleton pregnancies without induction or scheduled cesarean; shown probabilities are population averages.

### Feasibility: high. Roughly 60 lines of pure TypeScript plus tests.

## 2. Miscarriage probability

### What Datayze does
From the [Miscarriage Probability Chart](https://datayze.com/miscarriage-chart) page text:

- Shows probability of miscarriage (or of *not* miscarrying) by pregnancy day, built from a **meta-analysis of peer-reviewed papers**.
- Model accounts for maternal age, weight (BMI), number of previous miscarriages, number of previous live births, and can be conditioned on "fetal heartbeat seen".
- Also offers a "probability of loss in the next N days" and a reassurance framing ("probability of making it to term").

### Primary sources to build from
- Tong S et al. 2008, *Miscarriage risk for asymptomatic women after a normal first-trimester prenatal visit*, Obstet Gynecol 111(3):710-4. Risk after a viable scan: ~9.4% at 6w, 4.2% at 7w, 1.5% at 8w, 0.5% at 9w, 0.7% at 10w. (n=696.)
- Mukherjee S et al. 2013, *Risk of miscarriage among black women and white women in a US prospective cohort study*, Am J Epidemiol. Weekly hazard by gestational week from conception through 20 weeks.
- Magnus MC et al. 2019, *Role of maternal age and pregnancy history in risk of miscarriage*, BMJ 364:l869. Age curve (10% at 25–29, 53% at 45+) and prior-loss multipliers (RR 1.54 after one, 2.21 after two, 3.97 after three).
- Wilcox AJ 1988 (NEJM) for total early loss including pre-clinical.
- Cohain 2017, *Spontaneous first trimester miscarriage rates per woman among parous women with 1 or more pregnancies of 24 weeks or more*, BMC Pregnancy Childbirth, for parity effect.

### Implementation sketch
- Baseline daily hazard curve from Mukherjee (weekly hazards interpolated to days), rescaled so cumulative clinical loss from 5w to 20w ≈ 12–15%.
- Multiplicative risk factors from Magnus (age band, prior losses, prior live births). BMI effect is weaker and inconsistently reported; consider omitting in v1.
- Conditioning on "heartbeat seen at week W" replaces the baseline with the Tong curve from that week onward.
- Expose: `cumulativeLossFrom(day)`, `probabilityReachingTerm(day, factors)`, and per-week hazard.
- Product caveat: this is the one feature that can do harm. Show "chance of continuing" not "chance of loss", make it opt-in behind a clearly labeled control, never surface it on the main daily screen, and provide a "hide this permanently" switch. Include sources inline.

### Feasibility: moderate. Model is easy; the product decision (whether and how to show it) is the hard part. Model fidelity against Datayze's exact numbers is neither possible nor required.

## 3. Other Datayze pregnancy tools worth noting (not requested)

Datayze's [pregnancy category](https://datayze.com/?category=pregnancy) also lists a due-date calculator, a twin miscarriage chart, a fetal-size chart and a daily labor chart. Only the two above were asked about. The due-date arithmetic (LMP + 280 days; conception + 266 days) is standard and needs no source.
