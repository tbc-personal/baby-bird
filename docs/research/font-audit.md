# Typography audit, v0.1.0

Every `.css` file under `src/`, excluding `tokens.css` and the generated `fonts.css`.

No literal font families exist anywhere — the three tokens (`--font-display`, `--font-body`,
`--font-mono`) are used throughout, and ADR-007's stylelint rule already prevents otherwise. So
the question was which token is used where, and whether the sizes form a scale.

## What was fixed

### 1. `.legend` was defined twice, in two files — a latent bug, not a style nit

`LaborCurve.css` and `MeasureChart.css` each carried their own identical copies of `.legend`,
`.legend i` and `.legend__today`. Component CSS here is plain global CSS, not modules, so the two
blocks were not scoped to their components: whichever bundled last applied to both charts, and
editing the wrong copy would have looked like it had no effect at all.

Extracted to `src/components/Legend.css`, imported by both. Only the swatch colours that differ
(`.legend__line`, `.legend__due`, `.legend__break`) stay with their chart.

### 2. Five distinct sizes inside a 2px band

The small end of the scale held 11, 11.5, 12, 12.5 and 13px. The 11.5s (`.caveat`,
`.info__panel`, `.pill`) and the single 12.5 (`ul.facts`) were one-off values, not tiers with a
job. 11.5 → 12, matching the `.small` class that is the app's established secondary size; 12.5 →
13, matching `.section p` and `.section ul`.

Distinct sizes: **18 before, 16 after.**

### 3. The info button's "i" was set in the numerals face

`--font-mono` is IBM Plex Mono, shared by every skin specifically for numbers. `.info__button`
was the only non-numeric glyph in it. Now `--font-body`, at 11px rather than 10px so the letter
holds its own inside the 17px circle.

## Deliberate — leave these alone

- **Two number faces is the rule, not a lapse.** Large display readouts (`.big`, `.kpi__figure`,
  `.labor-card__figure`, `.preview__value`) use `--font-display`; small inline data
  (`.dim b`, `.row__week`, `.row__size`, the due-date pill, chart axis labels) uses `--font-mono`
  via the `.mono` class. Every number in the app follows one or the other, consistently. Making
  it uniform would be worse: 32px monospace reads as a terminal, and 11px display-face numerals
  in a table do not align.

- **`.big small` sets `--font-body` inside a `--font-display` heading.** The subline is a
  different rank of information, not a smaller version of the heading. Deliberate.

- **`.section h2` is weight 700 where every other display heading is 800.** At 15px, 800 in the
  display faces is heavy enough to look cramped. Defensible as drawn; flagged in case you disagree.

- **`.segmented button` uses `--font-mono`** for "in / oz" and "cm / g". Unit labels, adjacent to
  the numbers they govern. Consistent with the mono-for-data rule.

- **`.card__lead` and `.card__sci` at 12px, below the 13px body copy.** They are captions around
  the 24px comparison name, not body text.

## Not fixed, deliberately deferred

**The display-face size ladder is ten one-offs, not a scale:** 15, 17, 18, 20, 22, 24, 25, 32, 34,
44px, one per place it appears. A real type scale would collapse these to five or six steps.

That is a whole-app visual change — every screen, every skin, and all fourteen pixel baselines —
and the sizes are individually well-judged even if collectively unsystematic. Not something to
do in the same pass as feature work, three items before a release. Worth doing once v0.1.0 is out.
