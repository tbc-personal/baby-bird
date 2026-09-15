# Fact-check: adjudication summary

> **Week numbers here are the old ones**, as in the range reports: the table began
> at week 2 when this pass ran and begins at week 3 now. The 123 facts it covered
> include three for the "grain of grit" comparison, since dropped; the data holds 120. Read the Comparison column rather than the Week column.

Rollup of the four range reports (`fact-check-2-12.md`, `-13-22`, `-23-32`, `-33-42`),
which cover all 123 facts in `data/comparisons.json`. Run 2026-09-08.

**Applied 2026-09-08.** 94 changes — 85 citation swaps and the 9 text fixes below — have
been written into `data/comparisons.json` by `npm run apply-fact-check`, which reads
`fact-check-changeset.json`. That file records every change and why it was made, so the
content decisions can be reviewed apart from the diff, and the application re-run.

94 is more than the 62 rows in the reports' own swap tables because several rows named
two or three facts at once, one row covered seven weeks in a single line, and two facts
(13.1, 18.1) were listed as needing no change when they in fact still cited All About
Birds.

**Every fact is still `reviewed: false`,** and the apply script deliberately cannot set
it. Per ADR-004 that is the author's act; a script that flipped it would be
laundering a triage pass into a sign-off. No All About Birds URL remains in any
`sources[]`. The `allAboutBirdsSlug` on each row is untouched — that drives the card's
"More at All About Birds" link, which ADR-004 asks for, and is not a citation.

## Result

| Verdict          | Facts |
| ---------------- | ----- |
| Supported        | 99    |
| Partly supported | 21    |
| Contradicted     | 2     |
| Unverifiable     | 1     |

Separately, **85 facts had their `sources[]` changed** — mostly because they pointed at
All About Birds, which cannot be opened from this environment and whose text ADR-004
forbids reusing anyway. A dozen or so cited a real, readable page that simply does not
contain the claim: week 22 cited `Structural_coloration`, which never mentions blue jays;
week 30's crow face-recognition fact cited a Wikipedia article with no mention of faces,
masks or Marzluff. Every replacement URL was checked to return HTTP 200.

## What changed since the work order was written

The work order for this pass assumed `WebFetch` and `curl` were blocked
and that agents could only confirm a fact _appeared_ in search snippets. That is no
longer true — network access was opened for this session. Reachability now:

| Source                                                       | Status                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `en.wikipedia.org` (incl. the action API, full article text) | open                                                                                                                          |
| `www.audubon.org` field guides                               | open                                                                                                                          |
| `birdsoftheworld.org`                                        | open; free introduction only, the rest paywalled                                                                              |
| `commons.wikimedia.org`, `upload.wikimedia.org`              | open                                                                                                                          |
| `www.allaboutbirds.org`                                      | **403** — Cornell's own Cloudflare rule against datacenter IPs, not the egress proxy. Not fixable by changing network policy. |
| `web.archive.org`                                            | unreachable through the proxy, so archived copies are not a way round the above                                               |

So this pass is stronger than the work order anticipated — verdicts rest on full article
text, not snippets — with one hole: the single most-cited source (74 of 123 facts) is the
one that stayed shut. Those facts were checked against Wikipedia, Audubon, Birds of the
World and primary literature instead, and the reports say per fact which source was
actually read.

## Fix these first

Nine facts need their **text** changed, not just their citation. In rough priority order:

| Week | Fact                                                 | Problem                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21   | Kestrels see UV, so vole urine trails show up        | Two failures. The UV/vole-urine work is on the **Eurasian** kestrel (_Falco tinnunculus_); this card is the **American** kestrel, and its cited Wikipedia article contains no mention of UV or urine. And the mechanism was tested and rejected — Lind et al. 2013, _J. Exp. Biol._ 216:1819, found vole urine unlikely to give raptors a usable visual cue. Rewrite or drop. |
| 12   | A pair adds to the same platform for years           | Contradicted by its own cited source: nests are reused for years, but herons re-mate annually and "most males choose a different nest each year." Rewrite.                                                                                                                                                                                                                    |
| 8    | Cup built from 1,000+ mud pellets                    | The 1,000 figure is a **Cliff Swallow** statistic (BirdNote), not Barn Swallow. Drop the number or find a Barn-Swallow-specific source.                                                                                                                                                                                                                                       |
| 34   | Chicks peck the parent's bill to make it regurgitate | Right species and right behavior, wrong mechanism. Miller & Conover 1979 (_Auk_ 96:284) found pecking is neither necessary nor sufficient; chick _calls_ trigger feeding. Rewrite the causal clause.                                                                                                                                                                          |
| 4    | Nyjer is heat-treated so it cannot sprout            | The cited source says treated seed "may germinate but would typically be stunted," and that the treatment targets contaminant weed seeds. Wording fix.                                                                                                                                                                                                                        |
| 28   | Many Cooper's Hawks carry healed fractures           | The qualitative claim is fine; the widely repeated "23% of 300+ skeletons" has no traceable primary source. Keep the claim, never restate the number.                                                                                                                                                                                                                         |
| 15   | Weighs about two paperclips                          | Off by roughly half against the bird's 5–10 g. A nickel (5 g) is closer.                                                                                                                                                                                                                                                                                                      |
| 40   | Clutch of 3 to 11 with the lemming supply            | Neither endpoint matches a single source statement, and the documented maximum is higher (15–16). Tighten or widen deliberately.                                                                                                                                                                                                                                              |
| 24   | Digs into ant nests with a long barbed tongue        | "Barbed" may be drift from another woodpecker; one source explicitly contrasts the flicker's smooth sticky tongue with a barbed one. Confirm or cut the word.                                                                                                                                                                                                                 |

Week 3 ("Grain of grit") is a separate call: the whole comparison is `proposed: true`, and
its only citation is the Wikipedia "Gizzard" article, which mentions neither grouse, doves
nor roadsides. The substance checks out against sources that could be read; the comparison
still needs your sign-off before its citation is worth fixing.

## How this was produced

`npm run fact-sources` downloads the evidence corpus — every cited Wikipedia article as
full plain text, plus Audubon and Birds of the World for each species, plus (for each
blocked All About Birds URL) the Audubon and Wikipedia pages for the species _named in
that URL_. It then ranks candidate passages per fact by term overlap. Four Sonnet agents,
one per week range, adjudicated claim against evidence and wrote the range reports.

`npm run verify-fact-check` audits the reports mechanically: that every fact in range is
covered, that verdicts come from the fixed vocabulary, that no evidence block cites All
About Birds, and — the point of the exercise — that every quoted piece of evidence
actually appears in the downloaded corpus. A fabricated quote reads exactly like a real
one, so it has to be caught by string match rather than by review. All four reports pass.
The audit lists 42 quotes not found in the corpus; those are the agents' own live lookups
(BirdNote, NestWatch, PMC, sialis.org and similar), which is expected and allowed.

Five of the highest-stakes findings were then re-checked by hand against primary sources:
the kestrel UV literature, the heron nest-fidelity text, the Cliff Swallow mud-pellet
attribution, Miller & Conover on gull begging, and Cornell & Marzluff 2011 on crow face
recognition (_Proc. R. Soc. B_ 279:1728 — correct paper, and the quoted passages match).

## Still open after this pass

Three facts were re-cited but not rewritten, and are the next thing worth your attention:

| Week | Fact                                                                     | What is unresolved                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 10.3 | The female shapes the mud cup by pressing her breast into it and turning | The behaviour is real and well documented, but every good source for it is Cornell's own (All About Birds, Bird Academy), which are blocked here and reuse-restricted. Now cited to Wikipedia, which supports the mud cup but not the breast-pressing. |
| 34.1 | Ring-billed Gulls return to within a few meters of where they hatched    | Natal return is documented; "within a few meters" traces to adult nest-site fidelity across years, which is not the same claim.                                                                                                                        |
| 13.1 | A Bald Eagle nest can reach two meters across and weigh a tonne          | Supported, but those are the record nest's figures (2.5 m, 1 tonne), not a typical one. Whether the sentence should read as a record is a framing call, not a correctness one.                                                                         |

## Caveat worth keeping

These reports are a triage pass, not the sign-off ADR-004 describes. They
narrow your review to the disputed rows; they do not replace it. The 99 "supported"
verdicts are the ones nobody has independently re-read — they are the most likely place
for a wrong verdict to be sitting quietly.

---

_Composed rather than transcribed, flagged for your voice review: the "Fix these first"
problem descriptions, the "How this was produced" section, and the closing caveat. The
verdicts and evidence are the agents' and are quoted in the range reports._
