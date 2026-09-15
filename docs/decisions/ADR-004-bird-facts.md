# ADR-004: Bird facts are original text

Status: accepted (2026-09-06)

## Decision

Each bird gets 2–3 short facts written specifically for this app, stored in `data/comparisons.json` (`facts[]`, each with `text` and `sources[]`). Each card links to the species' All About Birds page with the label "More at All About Birds". No text is copied from All About Birds, Audubon, or Birds of the World.

## Context

All About Birds "Cool Facts" are Cornell copyright with no reuse license. Wikipedia text is reusable under CC BY-SA but would put a share-alike obligation on the facts and reads encyclopedic. Original text is owned outright and can have any voice.

## Rules for writing facts

- Facts must be verifiable against at least one public reference (Birds of the World, Wikipedia, Audubon, a paper). Cite it in `sources[]` as a URL. The reference is consulted, not copied.
- Length: one sentence, ≤ 160 characters. Voice: warm, plain, no exclamation marks.
- Prefer facts that tie back to babies, eggs, nests, size, or growth when they exist (incubation length, clutch size, how the chick is fed), since that is the app's theme.
- Every generated fact is flagged for the author's review before release. The build session marks unreviewed facts with `"reviewed": false`.
- Seeds (weeks 3–6) get three facts each, at least one of them about which birds eat them. (Originally one fact each; the count grew to three to match the bird weeks.)

## Sign-off: what `reviewed: true` means

A fact carries `reviewed: false` until a person has checked it against its cited
source, edited it for voice, and set the flag by hand. **Setting it is the
author's act.** No script may set it, and `scripts/apply-fact-check.ts`
deliberately does not, because a script that flipped the flag would be
laundering a triage pass into a sign-off — the two are different things, and the
difference is the whole value of the flag.

`scripts/mark-reviewed.ts` is the one partial exception, and it is narrow on
purpose. It sets the flag only for facts a fact-check report calls plainly
supported, reading the verdicts back out of the reports rather than taking a
hand-typed list, and it holds back anything carrying an open question. Every
other verdict — partly supported, contradicted, unverifiable, and every fact
rewritten during a pass — is left alone.

Two rules keep it on the right side of this decision:

- **It never clears a flag.** Clearing a `reviewed: true` that a person set
  would be the same laundering in reverse. Where a report disagrees with a flag
  already set, the script reports the disagreement, changes nothing, and exits
  non-zero for a person to resolve.
- **It matches facts by comparison name, not week number.** The reports were
  written when the table began at week 2, and matching positionally mapped a
  dropped comparison's verdicts onto a different week's facts. Anything it
  cannot match by name is reported rather than guessed at.

`npm run validate-data` prints the outstanding count on every run. It reports
rather than fails: curation is allowed to trail the code, and a warning that
blocks CI would only invite someone to set the flags to clear it. **Release
requires the count to reach zero.** Nothing enforces that automatically, which
is deliberate — the gate is a person, not a script.

### Reviewing a fact

The procedure is in `docs/RUNNING-LOCALLY.md` under "Reviewing the bird facts".
In short: run the app with `?review=1`, which marks every unreviewed fact with a
draft chip, then work the timeline week by week against each fact's `sources[]`.

## Consequences

- Roughly 100 short sentences to write and review. This is the largest content task in v1 and is called out in the build prompt as a separate deliverable with its own checklist.
