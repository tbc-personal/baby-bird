# Fact-check: adjudication summary

Rollup of the four range reports (`fact-check-2-12.md`, `-13-22`, `-23-32`, `-33-42`),
which cover all 123 facts in `data/comparisons.json`. Run 2026-09-08.

**Nothing here has been applied.** `data/comparisons.json` is untouched and every fact
is still `reviewed: false`. Per `docs/CURATION.md`, setting `reviewed: true` is a human
act; this pass narrows what that human has to look at from 123 rows to about 30.

## Result

| Verdict | Facts |
|---|---|
| Supported | 99 |
| Partly supported | 21 |
| Contradicted | 2 |
| Unverifiable | 1 |

Separately, **62 facts are recommended for a citation swap** — mostly because their
`sources[]` points at All About Birds, which cannot be opened from this environment and
whose text ADR-004 forbids reusing anyway. A handful cite a real, readable page that
simply does not contain the claim.

## What changed since the work order was written

The work order (`docs/V0.1.0-TRIAGE.md` §P1) assumed `WebFetch` and `curl` were blocked
and that agents could only confirm a fact *appeared* in search snippets. That is no
longer true — network access was opened for this session. Reachability now:

| Source | Status |
|---|---|
| `en.wikipedia.org` (incl. the action API, full article text) | open |
| `www.audubon.org` field guides | open |
| `birdsoftheworld.org` | open; free introduction only, the rest paywalled |
| `commons.wikimedia.org`, `upload.wikimedia.org` | open |
| `www.allaboutbirds.org` | **403** — Cornell's own Cloudflare rule against datacenter IPs, not the egress proxy. Not fixable by changing network policy. |
| `web.archive.org` | unreachable through the proxy, so archived copies are not a way round the above |

So this pass is stronger than the work order anticipated — verdicts rest on full article
text, not snippets — with one hole: the single most-cited source (74 of 123 facts) is the
one that stayed shut. Those facts were checked against Wikipedia, Audubon, Birds of the
World and primary literature instead, and the reports say per fact which source was
actually read.

## Fix these first

Nine facts need their **text** changed, not just their citation. In rough priority order:

| Week | Fact | Problem |
|---|---|---|
| 21 | Kestrels see UV, so vole urine trails show up | Two failures. The UV/vole-urine work is on the **Eurasian** kestrel (*Falco tinnunculus*); this card is the **American** kestrel, and its cited Wikipedia article contains no mention of UV or urine. And the mechanism was tested and rejected — Lind et al. 2013, *J. Exp. Biol.* 216:1819, found vole urine unlikely to give raptors a usable visual cue. Rewrite or drop. |
| 12 | A pair adds to the same platform for years | Contradicted by its own cited source: nests are reused for years, but herons re-mate annually and "most males choose a different nest each year." Rewrite. |
| 8 | Cup built from 1,000+ mud pellets | The 1,000 figure is a **Cliff Swallow** statistic (BirdNote), not Barn Swallow. Drop the number or find a Barn-Swallow-specific source. |
| 34 | Chicks peck the parent's bill to make it regurgitate | Right species and right behavior, wrong mechanism. Miller & Conover 1979 (*Auk* 96:284) found pecking is neither necessary nor sufficient; chick *calls* trigger feeding. Rewrite the causal clause. |
| 4 | Nyjer is heat-treated so it cannot sprout | The cited source says treated seed "may germinate but would typically be stunted," and that the treatment targets contaminant weed seeds. Wording fix. |
| 28 | Many Cooper's Hawks carry healed fractures | The qualitative claim is fine; the widely repeated "23% of 300+ skeletons" has no traceable primary source. Keep the claim, never restate the number. |
| 15 | Weighs about two paperclips | Off by roughly half against the bird's 5–10 g. A nickel (5 g) is closer. |
| 40 | Clutch of 3 to 11 with the lemming supply | Neither endpoint matches a single source statement, and the documented maximum is higher (15–16). Tighten or widen deliberately. |
| 24 | Digs into ant nests with a long barbed tongue | "Barbed" may be drift from another woodpecker; one source explicitly contrasts the flicker's smooth sticky tongue with a barbed one. Confirm or cut the word. |

Week 3 ("Grain of grit") is a separate call: the whole comparison is `proposed: true`, and
its only citation is the Wikipedia "Gizzard" article, which mentions neither grouse, doves
nor roadsides. The substance checks out against sources that could be read; the comparison
still needs your sign-off before its citation is worth fixing.

## How this was produced

`npm run fact-sources` downloads the evidence corpus — every cited Wikipedia article as
full plain text, plus Audubon and Birds of the World for each species, plus (for each
blocked All About Birds URL) the Audubon and Wikipedia pages for the species *named in
that URL*. It then ranks candidate passages per fact by term overlap. Four Sonnet agents,
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
recognition (*Proc. R. Soc. B* 279:1728 — correct paper, and the quoted passages match).

## Caveat worth keeping

These reports are a triage pass, not the sign-off `docs/CURATION.md` describes. They
narrow your review to the disputed rows; they do not replace it. The 99 "supported"
verdicts are the ones nobody has independently re-read — they are the most likely place
for a wrong verdict to be sitting quietly.

---

*Composed rather than transcribed, flagged for your voice review: the "Fix these first"
problem descriptions, the "How this was produced" section, and the closing caveat. The
verdicts and evidence are the agents' and are quoted in the range reports.*
