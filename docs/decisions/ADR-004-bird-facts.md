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
- Seeds (weeks 2–6) get one fact each about which birds eat them.

## Consequences
- Roughly 100 short sentences to write and review. This is the largest content task in v1 and is called out in the build prompt as a separate deliverable with its own checklist.
