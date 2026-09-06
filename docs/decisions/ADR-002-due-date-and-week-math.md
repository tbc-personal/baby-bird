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
- `weeks == 3`: the CSV has no comparison for week 3. Data gap flagged for the author; until filled, the UI falls back to the nearest earlier row and says so.
- `weeks > 42`: clamp to the Osprey row and show "past 42 weeks".
- `gestationalDays < 0`: invalid input; block with a validation message.
- Week 20 → 21: length jumps from 6.46 in to 10.51 in because the measurement convention changes from crown-rump to crown-heel. Show a one-line note on weeks 20 and 21.

## Third method (accepted)
"Enter my due date": the user enters the due date they were given and `lmpEquivalent = dueDate − 280`. In this mode the date field is labeled "Due date" and future dates are valid.

## Consequences
- Changing the method after entry converts the stored date; the UI re-derives everything, nothing else is stored.
- All math lives in `src/lib/gestation.ts` with table-driven tests covering the edge states above and a DST-crossing date.
