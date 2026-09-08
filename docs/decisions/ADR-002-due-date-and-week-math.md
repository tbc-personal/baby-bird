# ADR-002: Due date and gestational-age math

Status: accepted (2026-09-06)

## Decision
The user picks one dating method from a dropdown and enters one date. Both methods reduce to a single canonical value stored in state: `lmpEquivalentDate` (the date that would be day 0 of gestational age).

| Method | Input | `lmpEquivalent` | Due date |
|---|---|---|---|
| Last menstrual period (LMP) | LMP date | LMP | LMP + 280 days |
| Conception date | conception date | conception − 14 days | conception + 266 days |
| Enter my due date | due date | due − 280 days | as entered |

Derived values, computed on every render from `lmpEquivalent` and today's local date:

- `gestationalDays = daysBetween(lmpEquivalent, today)` (local calendar days, not milliseconds / 86400000, to survive DST)
- `weeks = floor(gestationalDays / 7)`, `days = gestationalDays mod 7`, displayed as "23 weeks, 4 days"
- `comparisonWeek = clamp(weeks, 2, 42)`; the CSV row labeled "N Weeks" means completed weeks N, i.e. N w 0 d through N w 6 d.
- `daysUntilDue = 280 − gestationalDays`
- Trimester boundaries: 1st through 13w6d, 2nd 14w0d to 27w6d, 3rd from 28w0d.

## Edge states the UI must handle
- `gestationalDays < 14`: before conception on the LMP scale. Show a "too early to compare" state, not week 1/3 rows (which have no comparison).
- `weeks == 3`: the source CSV had no comparison; the data now carries a proposed one (`proposed: true`). Rows flagged proposed render normally.
- `weeks > 42`: clamp to the Osprey row and show "past 42 weeks".
- `gestationalDays < 0`: invalid input; block with a validation message.
- Week 20 → 21: length jumps from 6.46 in to 10.51 in because the measurement convention changes from crown-rump to crown-heel. Show a one-line note on weeks 20 and 21.

## Third method (accepted)
"Enter my due date": the user enters the due date they were given and `lmpEquivalent = dueDate − 280`. In this mode the date field is labeled "Due date" and future dates are valid.

## Consequences
- Changing the method after entry converts the stored date; the UI re-derives everything, nothing else is stored.
- All math lives in `src/lib/gestation.ts` with table-driven tests covering the edge states above and a DST-crossing date.

## Amendment (2026-09-08): cycle length

Naegele's rule, as recorded in the table above, adds 280 days to the first day
of the last period. That is correct only for a 28-day cycle. Ovulation sits
roughly 14 days before the *next* period rather than 14 days after the last one,
so a longer cycle means a later conception and a later due date:

```
EDD = LMP + 280 + (cycleLength − 28)
```

Setup therefore asks for cycle length in LMP mode, and only in LMP mode: in
conception and due-date modes the user has already given us something
downstream of ovulation, leaving nothing to correct. Range 21–45 days,
defaulting to 28, clamped rather than rejected.

Cycle length is not period duration. How many days the bleeding lasts does not
move the due date at all, because the count starts on its first day either way.
The Setup help text says so, because the two are easy to confuse and confusing
them silently produces a wrong date.

### How it is applied

The correction lands in `toLmpEquivalent`, the single point where a user's input
becomes the gestational scale. Everything downstream — due date, gestational
days, trimester, comparison week, the labor model in ADR-005 — inherits it
without knowing it exists.

`computeProgress` and `toLmpEquivalent` now take one `Dating { method,
inputDate, cycleLength }` object instead of positional arguments. That is a
deliberately breaking signature: a defaulted trailing parameter would have let a
screen quietly keep computing 28-day due dates, and the compiler would not have
said a word.

### Storage and share links

`SavedState` gains `cycleLength` and the version goes to 2. A v1 record reads
back as 28 days, which reproduces exactly the due date it already displayed —
an upgrade must never move someone's due date under them.

Share links (ADR-006) now always carry the derived due date, `?m=dueDate&d=…`,
whatever the sender counts from. An `?m=lmp` link would be ambiguous once cycle
length exists: the recipient's app would apply its own cycle length to the
sender's period date and land on a different due date. Sending the due date is
unambiguous and shares strictly less — the recipient learns the due date and
nothing about the sender's period date or cycle. Links written by earlier
versions still parse, and an `lmp` link predates the field, so reading it with
the default 28 reproduces what its sender saw.
