# Fact-check: weeks 2–12

Opened and read the full pre-downloaded corpus (`.fc/corpus/week-02.json` … `week-12.json`) for every source that wasn't blocked: `en.wikipedia.org` articles for all 11 weeks, the Audubon Field Guide page for weeks 4–12, and the Birds of the World introduction page for weeks 7–12 (BOW's actual content sections are subscriber-only; only the nav/intro text came through). `www.allaboutbirds.org` returned empty text (HTTP 403) for every week that cited it — 21 of the 33 facts in this range — and was never opened or quoted. Where the corpus didn't settle a claim, live `WebSearch`/`WebFetch` reached `en.wikipedia.org` (including the live API for articles not in the corpus, e.g. `Papaver`, `Pine_siskin`, `Northern_house_wren`), `www.audubon.org`, `dec.ny.gov`, `menunkatuck.org` (a local Audubon chapter), `pennington.com`, `riverrefugeseed.com`, `agmrc.org`, `todayshomeowner.com`, `wild-bird-watching.com`, `gardenorganic.org.uk`, and `northernwoodlands.org`. `mgnv.org`, `ruffedgrousesociety.org`, `birdsandblooms.com`, `academy.allaboutbirds.org`, and `familyhandyman.com` returned 403/429 and were not used.

## Summary table

| Week | Comparison | Claim (truncated) | Verdict | Evidence source |
|---|---|---|---|---|
| 2 | Poppy seed | Finches work seeds out through a ring of pores under the cap | Partly supported | Wikipedia (Papaver, uncited) |
| 2 | Poppy seed | A capsule holds thousands of seeds, each ~1mm | Partly supported | Wikipedia (Poppy seed); Garden Organic |
| 2 | Poppy seed | Seeds shake loose once the stem is dry and moved | Supported | Wikipedia (Papaver, uncited) |
| 3 | Grain of grit | Birds have no teeth, gizzard grinds grit against food | Supported | Wikipedia (Gizzard) |
| 3 | Grain of grit | Gizzard does the work mammal molars do | Supported | Wikipedia (Gizzard) |
| 3 | Grain of grit | Grouse and doves visit roadsides/shorelines to restock grit | Partly supported | NY DEC; Menunkatuck Audubon; Wikipedia (Grit) |
| 4 | Thistle (nyjer) | Goldfinches/siskins cling to feeders, empty one in a week | Partly supported | Wikipedia (American goldfinch, Pine siskin) |
| 4 | Thistle (nyjer) | Nyjer is an African daisy for oil, heat-treated so it can't sprout | Partly supported | Wikipedia (Guizotia abyssinica) |
| 4 | Thistle (nyjer) | Goldfinches nest in midsummer, later than most songbirds | Supported | Audubon; Wikipedia |
| 5 | Millet | White proso millet is what juncos/doves/sparrows want first | Supported | Pennington (substitute) |
| 5 | Millet | Proso millet ripens in 60–90 days | Supported | riverrefugeseed.com; AgMRC (substitute) |
| 5 | Millet | Mourning Dove swallows millet, digests later somewhere safer | Supported | Wikipedia; Audubon (Mourning dove) |
| 6 | Sunflower seed | Black oil has thin shell, more fat, so chickadees/finches take it first | Supported | TodaysHomeowner (substitute); Wikipedia |
| 6 | Sunflower seed | Chickadee carries seed to branch, wedges into bark, hammers open | Partly supported | Wikipedia (Black-capped chickadee) |
| 6 | Sunflower seed | Sunflower head is hundreds of small flowers, each leaves one seed | Supported | Wikipedia (Helianthus annuus) |
| 7 | House Wren egg | Lays 5–8 heavily speckled eggs that can look solid | Partly supported | Audubon (House wren) |
| 7 | House Wren egg | Male fills cavities with sticks, female picks one and lines it | Supported | Audubon (House wren) |
| 7 | House Wren egg | Incubation ~12 days, young leave ~2 weeks after hatching | Partly supported | Wikipedia (Northern house wren); Audubon |
| 8 | Barn Swallow egg | Cup built from 1,000+ mud pellets carried in the bill | Unverifiable | — (likely Cliff Swallow figure) |
| 8 | Barn Swallow egg | Eggs white w/ reddish spotting, female does most of 2wk incubation | Partly supported | Wikipedia (Barn swallow) |
| 8 | Barn Swallow egg | Early-brood young often help feed the next brood | Partly supported | Wikipedia; Audubon (Barn swallow) |
| 9 | Wood Thrush egg | Plain turquoise-blue unmarked eggs, cup bound with mud | Supported | Audubon; Wikipedia (Wood thrush) |
| 9 | Wood Thrush egg | Fluted song is two notes at once, both sides of syrinx | Supported | Wikipedia; Audubon (substitute, syrinx detail) |
| 9 | Wood Thrush egg | Cowbirds parasitize nests, thrush raises foster chick alongside own | Partly supported | Audubon (Wood thrush) |
| 10 | American Robin egg | Robin's egg blue is biliverdin, laid into shell as it forms | Supported | Wikipedia (Biliverdin) |
| 10 | American Robin egg | 3–4 eggs incubated ~2wk, young fledge ~2wk later | Supported | Wikipedia; Audubon (American robin) |
| 10 | American Robin egg | Female shapes mud cup pressing breast in, turning | Partly supported | wild-bird-watching.com (substitute) |
| 11 | Black Tern egg | Nests on floating mats of dead marsh plants | Supported | Audubon; BOW (Black tern) |
| 11 | Black Tern egg | Eggs olive, heavily blotched, hidden against reed litter | Partly supported | Audubon (Black tern) |
| 11 | Black Tern egg | Chicks leave nest within days, stay close, fed by both parents | Supported | Audubon (Black tern) |
| 12 | Great Blue Heron egg | Colonies high in dead trees, a pair reuses same platform for years | **Contradicted** | Wikipedia (Great blue heron) |
| 12 | Great Blue Heron egg | Pale blue unmarked eggs, ~4 weeks shared incubation | Supported | Wikipedia; Audubon (Great blue heron) |
| 12 | Great Blue Heron egg | Male carries sticks to female, who builds the nest | Supported | Audubon (Great blue heron) |

## Detail

## Week 2 — Poppy seed

### Fact 2.1
> Small finches work poppy seeds out of the dried pod through a ring of pores that opens under the cap.

**Verdict:** Partly supported

**Evidence:**
> The stigmatic disc rests on top of the capsule, and beneath it are dehiscent pores or valves.

**Source:** https://en.wikipedia.org/wiki/Papaver (Wikipedia, "Papaver" genus article — live)

**Cited source status:** Cited to `en.wikipedia.org/wiki/Papaver_somniferum`, which was read in full (corpus and live) and contains no mention of pores, dehiscence, or finches at all. The pore/cap mechanism is real botany but lives on the genus-level Wikipedia article, not the cited species article.

**Note:** No source I could open — cited or otherwise — supports the "small finches work them out" half of the claim specifically. The documented dispersal mechanism (below, 2.3) is wind shaking the dry stem, not birds manipulating the pores. Web search turns up gardening-blog claims that goldfinches/finches eat garden poppy seeds generally, but nothing about extraction-through-pores behavior. Tighten to the pore mechanism (cite the genus page) and drop or soften the finch-extraction detail as unconfirmed.

### Fact 2.2
> A single poppy capsule can hold thousands of seeds, each about a millimeter across.

**Verdict:** Partly supported

**Evidence:**
> Poppy seeds are less than a millimeter in length, kidney-shaped, and have a pitted surface. It takes about 3,300 poppy seeds to make up a gram, and between 1 and 2 million seeds to make up a pound.

**Source:** https://en.wikipedia.org/wiki/Poppy_seed (Wikipedia)

**Cited source status:** Cited correctly for seed size ("less than a millimeter," which the fact rounds up to "about a millimeter" — a minor overstatement). The cited page gives no per-capsule seed count for *Papaver somniferum*.

**Note:** For "thousands per capsule" I could only find a quotable number for a different species — Garden Organic (gardenorganic.org.uk, read live): "The mean number of seeds per capsule is 1,360" for *Papaver rhoeas* (common poppy), not the opium poppy in this comparison. Order of magnitude is plausible but not confirmed for this species. Tighten "about a millimeter" to "just under a millimeter," and either find an *P. somniferum*-specific capsule count or soften to "thousands" without implying precision.

### Fact 2.3
> The seeds only shake loose once the stem is dry and something moves it.

**Verdict:** Supported

**Evidence:**
> The ovary later develops into a dehiscing capsule, capped by the dried stigmas. The opened capsule scatters its numerous, tiny seeds as air movement shakes it, due to the long stem.

**Source:** https://en.wikipedia.org/wiki/Papaver (Wikipedia, "Papaver" genus article — live)

**Cited source status:** Cited to `Papaver_somniferum`, which does not contain this. The genus-level "Papaver" article does, in almost identical terms.

**Note:** Solid claim, wrong citation. Swap the citation to the genus page (or find a *P. somniferum*-specific statement); as written the fact is accurate.

## Week 3 — Grain of grit

### Fact 3.1
> Birds have no teeth, so seed eaters swallow grit and let the gizzard grind it against the food.

**Verdict:** Supported

**Evidence:**
> In layman's terms, the gizzard 'chews' the food for the bird because it does not have teeth to chew food the way humans and other mammals do.
>
> A bird swallows small bits of gravel that act as 'teeth' in the gizzard, breaking down hard food such as seeds and thus helping digestion.

**Source:** https://en.wikipedia.org/wiki/Gizzard (Wikipedia)

**Cited source status:** Cited and confirmed directly.

**Note:** Leave as is.

### Fact 3.2
> The gizzard is a muscular chamber that does the work molars do in a mammal.

**Verdict:** Supported

**Evidence:**
> This specialized stomach constructed of thick muscular walls is used for grinding up food, often aided by particles of stone or grit.

**Source:** https://en.wikipedia.org/wiki/Gizzard (Wikipedia)

**Cited source status:** Cited and confirmed for the muscular-grinding-chamber part; the source never uses the word "molars" (it says "teeth" generally), so the mammal-anatomy specificity is the fact's own gloss, not sourced, though it's a reasonable one.

**Note:** Leave as is; "molars" is an acceptable paraphrase of "teeth" but isn't itself in the source.

### Fact 3.3
> Grouse and doves visit gravel roadsides and shorelines to restock the grit they have worn down.

**Verdict:** Partly supported

**Evidence:**
> Grouse can often be seen along the sides of gravel roads near these young forest thickets where they pick up grit (small stones) to aid in digestion.

> [Doves] To aid the grinding process, doves will ingest bits of gravel and sand, called grit. Look for doves collecting grit along roadsides and gravel drives.

> Granivorous birds rely on insoluble grit to break down the tough outer casings of the seeds they consume. They may go to roadsides or trails to find grit.

**Source:** https://dec.ny.gov/nature/animals-fish-plants/ruffed-grouse (NY DEC, fetched live); https://menunkatuck.org/unique-feeding-habits-of-doves (Menunkatuck Audubon Society, fetched live); https://en.wikipedia.org/wiki/Grit_(supplement) (Wikipedia, live)

**Cited source status:** **Wrong page.** The cited `en.wikipedia.org/wiki/Gizzard` article was read in full (it's short, ~10K characters) and contains zero mentions of grouse, doves, roadsides, gravel, or shorelines — it's entirely about gizzard anatomy and gizzards-as-food. This is exactly the fact flagged by the curation doc, and this week's whole comparison is `proposed:true` with only this one source. The claim's substance checks out against sources I could actually read; the citation does not support it at all.

**Note:** The behavior is real for both species and well documented once you look at species-specific sources, but "shorelines" specifically is not confirmed by anything I could quote (only by unquotable AI search summaries mentioning grouse visiting "stream sides, lakeshores"). Since this whole week is `proposed:true`, a human should decide whether to keep the fact (rewriting the citation to `Grit_(supplement)` plus a grouse/dove-specific source) or drop "shorelines" as unconfirmed embellishment.

## Week 4 — Thistle (nyjer)

### Fact 4.1
> Goldfinches and Pine Siskins cling to nyjer feeders and can empty one in a week.

**Verdict:** Partly supported

**Evidence:**
> It will eat at bird feeders provided by humans, particularly in the winter months, preferring Niger seed (commonly and erroneously called thistle seed).

> They flock to backyard feeders offering small seeds... In winter, they often feed in mixed flocks including American goldfinches and redpolls. Small seeds, especially thistle... make up the majority of the pine siskin's diet.

**Source:** https://en.wikipedia.org/wiki/American_goldfinch (Wikipedia); https://en.wikipedia.org/wiki/Pine_siskin (Wikipedia, fetched live — not in this week's corpus)

**Cited source status:** Cited to All About Birds (unopenable) and `Guizotia_abyssinica`, which only says nyjer "is a favourite of finches, especially the goldfinch and the greenfinch" (a European species) and "attract[s] finches and siskins" in the UK — it never mentions Pine Siskin or feeder-emptying rates.

**Note:** The species pairing (goldfinch + Pine Siskin at feeders) is well supported once you check each species' own Wikipedia page; "cling to feeders" and "empty one in a week" are common claims on gardening sites but I could not find or quote a source that states either specifically. Soften to the species pairing, or find a feeder-consumption-rate source.

### Fact 4.2
> Nyjer is not a thistle but an African daisy grown for oil, and it is heat-treated so it cannot sprout.

**Verdict:** Partly supported

**Evidence:**
> In the birdseed market, niger is often sold or referred to as thistle seed. This is a misnomer resulting from early marketing of the seed as "thistle" to take advantage of the finches' preference for thistle.
>
> Before it is imported, however, niger seed is sterilized by intense heat to prevent germination of any additional seeds that may be part of the mix. **Treated niger seed may germinate but would typically be stunted**, limiting its spread and offering less of a threat to native plants.

**Source:** https://en.wikipedia.org/wiki/Guizotia_abyssinica (Wikipedia)

**Cited source status:** Cited and mostly confirmed (not-a-thistle, grown for oil in Ethiopia/Eritrea, heat treatment does happen) — but the source directly says treated seed **can still germinate**, just stunted. It also says the heat treatment's stated purpose is killing *other* (weed) seeds mixed in with the batch, not sterilizing the niger seed itself.

**Note:** The "so it cannot sprout" clause is contradicted by the fact's own cited source. This is worth a human's attention: either rewrite to "heat-treated to kill weed seeds in the batch, though treated niger seed can still sprout (just stunted)," or drop the sprout claim entirely.

### Fact 4.3
> American Goldfinches nest in midsummer, later than most songbirds, when seeds like these are ripening.

**Verdict:** Supported

**Evidence:**
> In most regions, this is a late nester, beginning to nest in mid-summer, perhaps to assure a peak supply of late-summer seeds for feeding its young.
>
> Its breeding season is tied to the peak of food supply, beginning in late July, which is relatively late in the year for a finch.

**Source:** https://www.audubon.org/field-guide/bird/american-goldfinch (Audubon Field Guide); https://en.wikipedia.org/wiki/American_goldfinch (Wikipedia)

**Cited source status:** Cited to All About Birds (unopenable); both substitutes confirm it directly.

**Note:** Swap citation to Audubon and/or Wikipedia. Otherwise leave as is.

## Week 5 — Millet

### Fact 5.1
> White proso millet is what ground feeders want first: juncos, doves and native sparrows.

**Verdict:** Supported

**Evidence:**
> White millet, also known as proso millet or white proso millet, is a favorite with birds including quail, migratory native American sparrows, doves, towhees, juncos, and cardinals.

**Source:** https://www.pennington.com/all-products/wild-bird/resources/white-millet (Pennington, fetched live)

**Cited source status:** Cited to `en.wikipedia.org/wiki/Proso_millet`, which was read in full and only says the crop was "historically grown as animal and bird seed" — no species names at all. The specific species list needed a substitute.

**Note:** The species list is accurate per the substitute; the cited Wikipedia page simply doesn't go into this detail. Consider citing a wild-bird-seed resource alongside Wikipedia, or leave Wikipedia for the botany facts and accept this fact needs its own citation.

### Fact 5.2
> Proso millet ripens in about sixty to ninety days, which is why it fills out cheap seed mixes.

**Verdict:** Supported

**Evidence:**
> It matures in 60-90 days after planting.

**Source:** https://www.riverrefugeseed.com/wildlife/white-proso-millet (fetched live); corroborated by https://www.agmrc.org/commodities-products/grains-oilseeds/proso-millet ("capable of producing seed in 60 to 100 days after planting")

**Cited source status:** Cited to `en.wikipedia.org/wiki/Proso_millet`, which was read in full and states different numbers: "some varieties producing grain only 60 days after planting" (modern fast varieties) and "as little as 45 days" (early historic varieties) — it never states a 60–90 range.

**Note:** This was flagged in the brief as "quoted from memory, check it," and it checks out well against agricultural sources — the 60–90 figure is standard and correct — but not against the source actually cited. Swap in an ag-extension source (AgMRC, or the seed-vendor page) alongside or instead of Wikipedia.

### Fact 5.3
> A Mourning Dove swallows millet whole into its crop and digests it later, somewhere safer.

**Verdict:** Supported

**Evidence:**
> Mourning doves generally eat enough to fill their crops and then fly away to digest while resting.
>
> Eats quickly to fill its crop with seeds, then digests them while resting.

**Source:** https://en.wikipedia.org/wiki/Mourning_dove (Wikipedia); https://www.audubon.org/field-guide/bird/mourning-dove (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); both substitutes confirm the crop-filling and delayed-digestion behavior directly. "Somewhere safer" is the fact's own inference from "while resting" — plausible, not explicitly stated.

**Note:** Swap citation to Wikipedia or Audubon. Otherwise leave as is.

## Week 6 — Sunflower seed

### Fact 6.1
> Black oil sunflower has a thin shell and more fat per seed than striped, so chickadees and finches take it first.

**Verdict:** Supported

**Evidence:**
> The thin shell of black oil sunflower seeds allows even small birds with weak beaks to access the nutritious kernel inside... Black oil sunflower seeds attract a wide variety of birds, including: Cardinals, Chickadees, Finches, Nuthatches, Woodpeckers, Jays, Titmice.

**Source:** https://todayshomeowner.com/lawn-garden/guides/black-oil-sunflower-seeds-vs-striped-sunflower-seeds/ (fetched live)

**Cited source status:** Cited to `en.wikipedia.org/wiki/Sunflower_seed`, which confirms the black-oil-vs-striped classification (oil-pressed vs. snack food) but not shell-thickness or bird-preference specifics — those needed the substitute.

**Note:** Substance checks out; consider citing the substitute alongside Wikipedia for the bird-preference and shell-thickness claims specifically.

### Fact 6.2
> A chickadee carries one seed to a branch, wedges it into bark, and hammers it open there.

**Verdict:** Partly supported

**Evidence:**
> The birds take a seed in their beak and commonly fly from the feeder to a tree, where they proceed to hammer the seed on a branch to open it.
>
> [Audubon, describing a related but distinct behavior] ...where it may take sunflower seeds one at time and fly away to stuff them into bark crevices.

**Source:** https://en.wikipedia.org/wiki/Black-capped_chickadee (Wikipedia); https://www.audubon.org/field-guide/bird/black-capped-chickadee (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable). Wikipedia confirms "hammer... on a branch to open it" without mentioning bark-wedging; Audubon separately describes stuffing seeds into bark crevices (which reads as caching, not eating).

**Note:** The fact conflates two behaviors that the two sources describe separately — hammering open on a branch (Wikipedia) vs. wedging into bark crevices (Audubon, for caching). It's plausible a chickadee does both in sequence, but no single source says so. Tighten to one behavior or note both separately.

### Fact 6.3
> A sunflower head is hundreds of separate small flowers, each leaving one seed behind.

**Verdict:** Supported

**Evidence:**
> What is often called the "flower" of the sunflower is actually a "flower head" (pseudanthium)... of numerous small individual five-petaled flowers ("florets")... The spirally arranged flowers in the center of the head are called disk flowers. These mature into fruit (sunflower seeds).

**Source:** https://en.wikipedia.org/wiki/Helianthus_annuus (Wikipedia)

**Cited source status:** Cited and confirmed directly.

**Note:** Leave as is.

## Week 7 — House Wren egg

### Fact 7.1
> A House Wren lays five to eight eggs so heavily speckled in reddish brown that they can look solid.

**Verdict:** Partly supported

**Evidence:**
> 6-7, sometimes as few as 3, and occasionally up to 10. White, heavily dotted with reddish brown.

**Source:** https://www.audubon.org/field-guide/bird/house-wren (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable). Audubon confirms the speckling description closely but gives a typical range of 6–7 (occasionally 3–10), not "five to eight." Wikipedia's "Northern house wren" article gives "usually between two and eight," a wider range than the fact states.

**Note:** Color/speckling description is solid; egg-count range should be tightened to match a source (Audubon's 6–7 typical, or Wikipedia's 2–8 overall). "Can look solid" is the fact's own gloss on "heavily dotted," not stated outright anywhere, but plausible.

### Fact 7.2
> The male fills several cavities with sticks, and the female picks one and lines it.

**Verdict:** Supported

**Evidence:**
> The male builds incomplete "dummy" nests in several cavities; the female chooses one and finishes the nest by adding lining.

**Source:** https://www.audubon.org/field-guide/bird/house-wren (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); Audubon confirms this almost verbatim.

**Note:** Swap citation to Audubon. Otherwise leave as is.

### Fact 7.3
> Incubation runs about twelve days, and the young leave roughly two weeks after hatching.

**Verdict:** Partly supported

**Evidence:**
> Only the female incubates these, for around 12–19 days... The young... take another 15–19 days or so to fledge.
>
> Incubation is probably mostly or entirely by the female, about 12-15 days... Young leave the nest about 12-18 days after hatching.

**Source:** https://en.wikipedia.org/wiki/Northern_house_wren (Wikipedia, live); https://www.audubon.org/field-guide/bird/house-wren (Audubon Field Guide)

**Cited source status:** Cited to `en.wikipedia.org/wiki/House_wren`, which — because the house wren complex was split into eight species in the 2024 Clements update — is now essentially a redirect stub listing the eight new species names; the actual content lives at `Northern_house_wren`. Once found, both sources give ranges (12–19 / 12–15 days incubation; 15–19 / 12–18 days to fledge) whose *lower bounds* match the fact's "about twelve days" and "roughly two weeks," but whose *upper bounds* run notably longer (up to 18–19 days, nearly three weeks).

**Note:** Two issues: (1) the cited URL is stale post-taxonomy-split — repoint to `Northern_house_wren`; (2) "about twelve days" and "roughly two weeks" both understate the real range by citing only the low end. Consider "12 to 19 days" and "two to nearly three weeks."

## Week 8 — Barn Swallow egg

### Fact 8.1
> A Barn Swallow cup is built from a thousand or more mud pellets, each carried in the bill.

**Verdict:** Unverifiable

**Evidence:** No source I could open states a mud-pellet count for Barn Swallow (*Hirundo rustica*). Wikipedia confirms only the construction method: "constructed by both sexes... with mud pellets collected in their beaks." The specific "1,000 mouthfuls" figure that circulates online is attributed to a different species:
> After days of work, and 1000 mouthfuls of mud, your nest is complete.

**Source:** https://www.birdnote.org/podcasts/birdnote-daily/how-cliff-swallows-build-nest (BirdNote, fetched live) — **about Cliff Swallow (Petrochelidon pyrrhonota), not Barn Swallow**

**Cited source status:** Cited to All About Birds (unopenable); no substitute confirms the number for the correct species.

**Note:** This looks like species drift — the "1,000+ mud pellets" statistic belongs to Cliff Swallow, a different (colonial, gourd-nest-building) swallow species, not Barn Swallow. I could not find the figure stated for Barn Swallow anywhere, including a Barn-Swallow-specific nesting article (birdfact.com) that describes the mud-application technique but gives no pellet count. A human should verify against a Barn Swallow-specific primary source before keeping this number, or drop the count and keep just "built from mud pellets carried in the bill."

### Fact 8.2
> The eggs are white with reddish spotting, and the female does most of the two weeks of incubation.

**Verdict:** Partly supported

**Evidence:**
> The female lays two to seven, but typically four or five, reddish-spotted white eggs... In Europe, the female does almost all the incubation, but in North America the male may incubate up to 25% of the time. The incubation period is normally 14–19 days.

**Source:** https://en.wikipedia.org/wiki/Barn_swallow (Wikipedia)

**Cited source status:** Cited and confirmed for egg color; "two weeks" only captures the low end of the stated 14–19 day range (up to nearly 3 weeks). "Female does most" holds for Europe; in North America the male's up-to-25% share still leaves the female doing most, so this part is fine.

**Note:** Tighten "two weeks" to "two to nearly three weeks," or "roughly two-plus weeks."

### Fact 8.3
> Young from an early brood often stay to help feed the chicks of the next one.

**Verdict:** Partly supported

**Evidence:**
> Occasionally, first-year birds from the first brood will assist in feeding the second brood.
>
> One or two additional birds, the pair's offspring from previous broods, may attend the nest and sometimes feed the nestlings.

**Source:** https://en.wikipedia.org/wiki/Barn_swallow (Wikipedia); https://www.audubon.org/field-guide/bird/barn-swallow (Audubon Field Guide)

**Cited source status:** Cited and confirmed for the behavior itself; both sources hedge with "occasionally"/"sometimes," not "often."

**Note:** Textbook case of the missing hedge the brief warns about. Change "often" to "occasionally" or "sometimes" to match the sources.

## Week 9 — Wood Thrush egg

### Fact 9.1
> Wood Thrush eggs are plain turquoise-blue with no markings, laid in a cup the female binds with mud.

**Verdict:** Supported

**Evidence:**
> Usually 3-4. Pale greenish blue, unmarked.
>
> [Nest is] usually made of dead grasses, stems, and leaves, and lined with mud, and placed in a fork at a horizontal branch.

**Source:** https://www.audubon.org/field-guide/bird/wood-thrush (Audubon Field Guide); https://en.wikipedia.org/wiki/Wood_thrush (Wikipedia)

**Cited source status:** Cited to All About Birds (unopenable); both substitutes confirm color, "unmarked," and mud-lined cup.

**Note:** Swap citation. Otherwise leave as is.

### Fact 9.2
> The male's fluted song is two notes at once, made by both sides of the syrinx together.

**Verdict:** Supported

**Evidence:**
> The male is able to sing two notes at once, which gives its song an ethereal, flute-like quality.
>
> A fine singer like a thrush can voice notes independently and simultaneously from each half of its syrinx, notes which blend brilliantly as ethereal, harmonious tones.

**Source:** https://en.wikipedia.org/wiki/Wood_thrush (Wikipedia, cited); https://www.audubon.org/news/how-thrushes-produce-those-ethereal-flute-songs (Audubon, fetched live — not the field-guide page)

**Cited source status:** Cited source confirms "two notes at once" and "flute-like" but never mentions the syrinx; the syrinx mechanism needed the separate Audubon news article.

**Note:** Solid claim once combined; consider adding the Audubon syrinx article as a second citation.

### Fact 9.3
> Cowbirds often lay in Wood Thrush nests, and the thrush usually raises the foster chick alongside its own.

**Verdict:** Partly supported

**Evidence:**
> Cowbirds lay many eggs in their nests, so the thrushes often raise mainly cowbirds, with few young of their own.

**Source:** https://www.audubon.org/field-guide/bird/wood-thrush (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); Audubon confirms parasitism is common but describes a harsher outcome than the fact implies.

**Note:** "Raises the foster chick alongside its own" undersells it — the source says thrushes often end up raising *mainly* cowbirds, with *few* of their own young surviving alongside. Rewrite to reflect that cowbird chicks often crowd out the host's own brood rather than simply share the nest.

## Week 10 — American Robin egg

### Fact 10.1
> Robin's egg blue is a pigment called biliverdin, laid into the shell as the egg forms.

**Verdict:** Supported

**Evidence:**
> Biliverdin is an important pigment component in avian egg shells, especially blue and green shells. Blue egg shells have a significantly higher concentration of biliverdin than brown egg shells... the biliverdin of egg shells is produced from the shell gland, rather than from the breakdown of erythrocytes in the blood stream.

**Source:** https://en.wikipedia.org/wiki/Biliverdin (Wikipedia)

**Cited source status:** Cited and confirmed directly.

**Note:** Leave as is.

### Fact 10.2
> Three or four eggs are incubated about two weeks, and the young fledge about two weeks after that.

**Verdict:** Supported

**Evidence:**
> A clutch consists of three to five cyan-colored eggs, and is incubated by the female alone. The eggs hatch after 14 days, and the chicks leave the nest a further two weeks later.
>
> Usually 4, sometimes 3-7... Incubation by female, 12-14 days... Young leave the nest about 14-16 days after hatching.

**Source:** https://en.wikipedia.org/wiki/American_robin (Wikipedia); https://www.audubon.org/field-guide/bird/american-robin (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); both substitutes confirm the incubation/fledging timing closely. Clutch size is "usually 4" per Audubon, "three to five" per Wikipedia — "three or four" is a fair simplification of the common case, though the true range runs to 5 or (per Audubon) occasionally 7.

**Note:** Swap citation; consider "three to five" for the clutch size to match Wikipedia precisely.

### Fact 10.3
> The female shapes the mud cup by pressing her breast into it and turning.

**Verdict:** Partly supported

**Evidence:**
> The female robin presses her breast against the interior, molding it into a perfect bowl shape.

**Source:** https://www.wild-bird-watching.com/american-robin-nest.html (fetched live)

**Cited source status:** Cited to All About Birds (unopenable). Neither Wikipedia, Audubon, nor Birds of the World (in the corpus for this week) describes nest-shaping behavior at all — this fact needed an outside substitute.

**Note:** Breast-pressing is confirmed by a source I could read; "turning" is a commonly repeated detail elsewhere (Cornell's Bird Academy, which is on a blocked Cornell subdomain) but I could not confirm it against anything quotable. Substance is probably fine but rests on a single secondary source, not a primary one.

## Week 11 — Black Tern egg

### Fact 11.1
> Black Terns nest on floating mats of dead marsh plants, so the nest rises and falls with the water.

**Verdict:** Supported

**Evidence:**
> Nest site is low in marsh, on floating mat of plant material, on old muskrat house or debris, or on ground close to water... may be substantial platform of marsh plants... very close to water level; eggs often damp.
>
> Nests are flimsy, often floating, and are easily destroyed by wind or changing water levels.

**Source:** https://www.audubon.org/field-guide/bird/black-tern (Audubon Field Guide); https://birdsoftheworld.org/bow/species/blkter/cur/introduction (Birds of the World)

**Cited source status:** Cited to All About Birds (unopenable); both substitutes confirm floating-nest behavior and its vulnerability to water-level change.

**Note:** Swap citation. Otherwise leave as is.

### Fact 11.2
> The eggs are olive and heavily blotched, which hides them against wet reed litter.

**Verdict:** Partly supported

**Evidence:**
> A Black Tern generally lays 2-4 eggs. The eggs are pale buff to olive, blotched with brown and black.

**Source:** https://www.audubon.org/field-guide/bird/black-tern (Audubon Field Guide)

**Cited source status:** **Wrong page.** The cited `en.wikipedia.org/wiki/Black_tern` was read in full (it's short) and never describes egg color or pattern at all — only clutch size ("laying 2–4 eggs"). Audubon supplies the color/pattern.

**Note:** Color and blotching are confirmed by Audubon, not by the cited Wikipedia page. "Hides them against wet reed litter" is a plausible camouflage inference that no source states explicitly — reasonable, but flag it as inference, not fact.

### Fact 11.3
> Chicks leave the nest within days of hatching but stay close and are fed by both parents.

**Verdict:** Supported

**Evidence:**
> Develop rapidly; after 2-3 days, may leave nest but remain in vegetation nearby. Capable of flight 19-25 days after hatching; may be fed by parents for up to two more weeks.

**Source:** https://www.audubon.org/field-guide/bird/black-tern (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); Audubon confirms directly.

**Note:** Swap citation. Otherwise leave as is.

## Week 12 — Great Blue Heron egg

### Fact 12.1
> Great Blue Herons nest in colonies high in dead trees, and a pair adds to the same platform for years.

**Verdict:** Contradicted

**Evidence:**
> Trees of any type are used when available. When not, herons may nest on the ground, sagebrush, cacti, channel markers, artificial platforms, beaver mounds, and duck blinds.
>
> Although nests are often reused for many years and herons are socially monogamous within a single breeding season, **individuals usually choose new mates each year**. Males arrive at colonies first and settle on nests, where they court females; **most males choose a different nest each year**.

**Source:** https://en.wikipedia.org/wiki/Great_blue_heron (Wikipedia)

**Cited source status:** Cited, and it directly undercuts the fact as written. Nest *platforms* are reused across years by the colony (confirmed both here and by a substitute, northernwoodlands.org: "The same nest may be used for several years") — but the cited source explicitly says herons re-pair each year and most males pick a *different* nest each year. "A pair adds to the same platform for years" describes a continuity that the source says doesn't happen.

**Note:** This is the clearest contradiction in this range. Rewrite to something like "nests are reused for years, though not necessarily by the same pair — herons re-mate annually." Also: "dead trees" specifically isn't in the cited source ("trees of any type"), though it's well corroborated elsewhere (northernwoodlands.org, Mass Audubon) for typical rookery sites near beaver-flooded wetlands — that half is fine, just not from this citation.

### Fact 12.2
> The eggs are pale blue and unmarked, and both parents share about four weeks of incubation.

**Verdict:** Supported

**Evidence:**
> The female lays three to six pale-blue eggs... Eggs are usually laid at two-day intervals, incubated around 27 days... Males incubate for about 10.5 hours of each day, while females usually incubate for the remainder.
>
> 3-5, sometimes 2-7. Pale blue. Incubation is by both sexes, 25-30 days.

**Source:** https://en.wikipedia.org/wiki/Great_blue_heron (Wikipedia); https://www.audubon.org/field-guide/bird/great-blue-heron (Audubon Field Guide)

**Cited source status:** Cited and confirmed for egg color and shared incubation; ~27 days (Wikipedia) / 25–30 days (Audubon) both round sensibly to "about four weeks." "Unmarked" isn't stated in so many words but no source mentions any markings either.

**Note:** Leave as is.

### Fact 12.3
> The male carries sticks to the female, who works each one into the nest herself.

**Verdict:** Supported

**Evidence:**
> Nest (built mostly by females, with material gathered primarily by males) is a platform of sticks, sometimes quite large.

**Source:** https://www.audubon.org/field-guide/bird/great-blue-heron (Audubon Field Guide)

**Cited source status:** Cited to All About Birds (unopenable); Audubon confirms the male-gathers/female-builds division of labor directly.

**Note:** Swap citation. Otherwise leave as is.

## Recommended citation changes

| Week | Fact | Current citation | Replace/add with |
|---|---|---|---|
| 2 | 2.1, 2.3 | `Papaver_somniferum` | `en.wikipedia.org/wiki/Papaver` (genus page — has the pore/wind-shake mechanism the species page lacks) |
| 3 | 3.3 | `Gizzard` | `en.wikipedia.org/wiki/Grit_(supplement)` (roadside grit-seeking is there; `Gizzard` never mentions it) |
| 4 | 4.1, 4.3 | All About Birds (goldfinch) | `en.wikipedia.org/wiki/American_goldfinch`; add `en.wikipedia.org/wiki/Pine_siskin` for the siskin half of 4.1 |
| 5 | 5.2 | `Proso_millet` | Add an ag-extension source (e.g. `agmrc.org/commodities-products/grains-oilseeds/proso-millet`) — Wikipedia states different day-counts |
| 5 | 5.3 | All About Birds (Mourning Dove) | `en.wikipedia.org/wiki/Mourning_dove` |
| 6 | 6.2 | All About Birds (chickadee) | `en.wikipedia.org/wiki/Black-capped_chickadee` |
| 7 | 7.1, 7.2 | All About Birds (House Wren) | `www.audubon.org/field-guide/bird/house-wren` |
| 7 | 7.3 | `en.wikipedia.org/wiki/House_wren` | `en.wikipedia.org/wiki/Northern_house_wren` (species was split in 2024; old URL is now a stub) |
| 8 | 8.3 | All About Birds (Barn Swallow) — already also cites Wikipedia for 8.2 | Keep Wikipedia; for 8.1 do not swap in a Cliff Swallow source — verify against a Barn Swallow-specific one or drop the number |
| 9 | 9.1, 9.3 | All About Birds (Wood Thrush) | `www.audubon.org/field-guide/bird/wood-thrush` |
| 9 | 9.2 | `en.wikipedia.org/wiki/Wood_thrush` (keep) | Add `www.audubon.org/news/how-thrushes-produce-those-ethereal-flute-songs` for the syrinx detail |
| 10 | 10.2, 10.3 | All About Birds (Robin) | `en.wikipedia.org/wiki/American_robin` for 10.2; 10.3 has no strong reachable-source substitute found |
| 11 | 11.1, 11.3 | All About Birds (Black Tern) | `www.audubon.org/field-guide/bird/black-tern` |
| 11 | 11.2 | `en.wikipedia.org/wiki/Black_tern` | `www.audubon.org/field-guide/bird/black-tern` (Wikipedia never states egg color) |
| 12 | 12.3 | All About Birds (GBH) | `www.audubon.org/field-guide/bird/great-blue-heron` |

## Needs a human decision

- **Week 8, fact 8.1** — the "1,000+ mud pellets" figure could not be confirmed for Barn Swallow and appears to be a Cliff Swallow statistic (a different, related species). This is the single largest concern in this range: either find a Barn-Swallow-specific source for a pellet count, or rewrite without a number.
- **Week 12, fact 12.1** — the cited source directly contradicts "a pair adds to the same platform for years" (herons re-mate annually; most males pick a new nest each year). Needs a rewrite, not just a citation swap.
- **Week 3, fact 3.3** — whole comparison is `proposed:true` with a single, unrelated source. Substance holds up against sources I could read (grouse and doves do restock grit at gravel roadsides) but "shorelines" is unconfirmed, and this is the only week with just one (wrong) citation to begin with — worth deciding whether to keep, rewrite, or replace the comparison.
- **Week 4, fact 4.2** — cited source says treated nyjer seed "may germinate but would typically be stunted," directly conflicting with "so it cannot sprout." Needs a wording fix.
- **Week 2, facts 2.1/2.2** — the finch-extraction behavior (2.1) and per-capsule seed count for *P. somniferum* specifically (2.2) could not be confirmed anywhere I could read; both rest on adjacent-but-not-identical evidence (genus-level mechanism; a different poppy species' capsule count).
- **Week 6, fact 6.2** and **Week 10, fact 10.3** — each conflates two behaviors/details drawn from different sources (hammering-on-branch vs. bark-wedging; breast-pressing vs. turning) that no single source states together.
