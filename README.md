# Puffin Baby

A small, private pregnancy tracker. Enter your last menstrual period or conception date and see, each
week, how big the baby is compared with a bird, a bird's egg, or a bird seed: from a poppy seed at
week 2 to an Osprey at week 42, with an Atlantic Puffin at week 23.

Status: **planning**. No application code yet. This repository currently holds the plan, decision
records, research, mockups, data, and the build prompt for the implementation session.

## What it will do (v1)
- Choose how the due date is calculated (last menstrual period or conception date) and enter the date.
- See progress as weeks and days, days remaining, and trimester.
- See this week's comparison with fetal length and weight, a Cornell Lab Macaulay Library photo embed,
  two or three short original bird facts, and a link to the species on All About Birds.
- Browse the full week-by-week timeline.
- From 34 weeks, see the chance of going into labor in the next week, re-derived from published studies.
- Works as an installable web app. Data stays on your device.

## Not medical advice
Fetal sizes are population averages. Probability features are population statistics, not predictions
about any individual pregnancy. Talk to your clinician.

## Non-commercial
This project uses Macaulay Library media embeds, which the Cornell Lab permits for non-commercial use only.
The project has no ads, no paid tier, and must not be used commercially. See
`docs/decisions/ADR-003-images.md`.

## Repository map
| Path | What |
|---|---|
| `docs/PLAN.md` | Scope, architecture, milestones, risks, testing |
| `docs/decisions/` | Architecture decision records (ADR-001 … 006) |
| `docs/research/` | Licensing findings; Datayze feature feasibility and sources |
| `docs/CURATION.md` | Human checklist: image IDs, fact review, slug verification |
| `docs/mockups/` | Static HTML mockups of the main screens |
| `data/comparisons.json` | Single source of truth for weeks, sizes, species, images, facts |
| `data/size-comparisons.source.csv` | The original spreadsheet export |
| `prompts/opus-build-prompt.md` | The prompt for the implementation session |

## Sources and credits
- Fetal length and weight table: the author's spreadsheet, drawn from datayze.com.
- Bird comparisons: the author's own pairings.
- Photos: Macaulay Library at the Cornell Lab of Ornithology (embedded, non-commercial); seed photos from Wikimedia Commons contributors (credited per image).
- Labor probability model: Smith 2001, Jukic et al. 2013, CDC/NCHS natality data. See `docs/research/datayze-features.md`.
