# Sexual dimorphism across the bird weeks

Phase 0 of `docs/plans/sexed-bird-photos.md`: does each bird week's species look
different enough, male to female, to carry a sexed photograph on a card?

Retrieved 2026-09-18. Claude-authored throughout; the verdicts are a reading of
the quoted evidence and want the author's eye before anything is curated.

## What this was verified against, and what it was not

**The author asked for Birds of the World. It could not be used.**
`birdsoftheworld.org` answers with HTTP 200 and then shows
"Full content is available exclusively to Birds of the World subscribers" —
the plumage and identification sections are behind the subscription. The 200 is
the trap ADR-003 warns about in a different form: a status code is not evidence
that content was retrieved.

**All About Birds was also unavailable from this container**, which is the
second-best free Cornell source and the one the cards already link to. Both
`curl` and the agent's fetch tool get a Cloudflare 403. A browser was tried, per
the CLAUDE.md rule that non-JS clients are not evidence, and did not get far
enough to test the question: the pre-installed Chromium does not trust this
session's egress proxy CA, so it failed at TLS before reaching Cornell.
**So this document records nothing about whether All About Birds is reachable
from an ordinary browser. It almost certainly is. Nothing here should be read
as a claim that Cornell blocks anyone.**

**What was actually used: English Wikipedia**, via the MediaWiki API, which
ADR-004 already names as an acceptable reference. Every verdict below quotes the
sentence it rests on and links the article.

Two consequences the author should weigh:

- **Wikipedia is thinner than BOW on exactly the question that matters here.**
  It reliably says whether the sexes differ; it is much less reliable about
  whether the difference is visible at a glance, which is the actual test for a
  200px strip. Tier B is where this bites.
- **The quotations below are CC BY-SA and must not migrate into `facts[]`.**
  ADR-004 keeps the shipped facts free of share-alike obligations. These are
  evidence in a research file, which is a different thing, but the line is one
  copy-paste wide.

Anything marked ⚠ below is a row where a BOW subscription would settle a
question Wikipedia left open. There are five, all in tier B.

## Tier A — plumage differs, and would read at card size (8 weeks)

These are the weeks the feature can actually be built on.

| Week | Species                   | Evidence                                                                                                                                                                                         |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 14   | Ruby-throated Hummingbird | "The species is sexually dimorphic." Male has "a gorget (throat patch) of iridescent ruby red"; the female "a white throat that may be plain or lightly marked".                                 |
| 20   | Eastern Bluebird          | "Male bluebirds have a bright head, back, and wings." "Females are lighter with gray on the head and back and some blue on their wings and tail."                                                |
| 21   | American Kestrel          | "It exhibits sexual dimorphism in size … and plumage". "In contrast to many other raptor species, the sexes differ more in plumage than in size." Males have "blue-gray wings with black spots". |
| 25   | Belted Kingfisher         | "The female features a rufous band across the upper belly that extends down the flanks." Otherwise "both sexes have a slate blue head, large white collar, large blue band on the breast".       |
| 32   | Hooded Merganser          | "The hooded merganser is a sexually dimorphic species." Male black-and-white in breeding plumage; "the adult female has a greyish-brown body".                                                   |
| 36   | Wood Duck                 | "The adult male has stunning multicolored iridescent plumage and red eyes". "The female, less colorful, has a white eye-ring and a whitish throat."                                              |
| 39   | Mallard                   | "Males (drakes) have green heads, while the females (ducks) have mainly brown-speckled plumage."                                                                                                 |
| 40   | Snowy Owl                 | "Females are almost invariably more duskily patterned than like-age males."                                                                                                                      |

Sources: [Ruby-throated hummingbird](https://en.wikipedia.org/wiki/Ruby-throated_hummingbird),
[Eastern bluebird](https://en.wikipedia.org/wiki/Eastern_bluebird),
[American kestrel](https://en.wikipedia.org/wiki/American_kestrel),
[Belted kingfisher](https://en.wikipedia.org/wiki/Belted_kingfisher),
[Hooded merganser](https://en.wikipedia.org/wiki/Hooded_merganser),
[Wood duck](https://en.wikipedia.org/wiki/Wood_duck),
[Mallard](https://en.wikipedia.org/wiki/Mallard),
[Snowy owl](https://en.wikipedia.org/wiki/Snowy_owl).

The draft list in the plan named these same eight. That list was a guess, and it
happened to be right; the three corrections the evidence forced are all in the
tiers below.

### Four curation hazards this turned up

None of these were in the plan, and all four are ways a curated photograph could
be labelled with the wrong sex.

1. **Eclipse plumage, weeks 32, 36 and 39.** The merganser's description is
   explicitly "in breeding plumage", and male ducks in eclipse resemble females.
   A "male" pick must be a breeding-plumage bird or the two cards show nearly
   the same duck.
2. **Juvenile kingfishers, week 25.** "Juveniles of this species are similar to
   adults, but **both sexes** feature the rufous band on the upper belly." The
   rufous band does not by itself mean female. This is the one week where the
   obvious visual shortcut is wrong.
3. **Snowy owl overlap, week 40.** The split is a cline, not a line: "the very
   darkest males and the lightest females are nearly indistinguishable by
   plumage," and juvenile plumage "resembles that of adult females". Week 40
   stays in tier A only because we choose the individual — the pick has to be a
   clear example of each, not a median one.
4. **The existing week 40 photo is unidentified.** Its alt text reads "white
   with fine dark barring", which given the above could be a male, a female or
   an immature. It cannot be promoted into a pair without checking the Commons
   file's own identification.

**The rule these imply:** a sexed pick is only valid if the Commons file itself
states the sex — in its categories, title or description. We do not sex a bird
by looking at it. That belongs in ADR-008 and in `CURATING-PHOTOS.md`, and it is
stricter than the rest of the curation, which is aesthetic judgement rather than
a factual claim the card then makes.

## Tier B — a real difference, but probably not at 200px (5 weeks)

| Week | Species              | Evidence                                                                                                                                                                            | Verdict                                                       |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 24   | Northern Flicker     | "Males have a black mustache." / "Males have a red mustache." (the two differ by subspecies; females lack it)                                                                       | Malar stripe only, and subspecies-dependent ⚠                 |
| 31   | Pileated Woodpecker  | "Adult males have a red line from the bill to the throat; in adult females, these are black."                                                                                       | Malar stripe only ⚠                                           |
| 42   | Osprey               | "The breast band of the male is … weaker than that of the female or is nonexistent, and the underwing coverts of the male are more uniformly pale."                                 | Real, but a tendency, not a mark ⚠                            |
| 29   | American Barn Owl    | No plumage-dimorphism statement in its own article; the snowy owl article notes "in … the barn owl (Tyto alba), the sexual dimorphism of spotting appears to be driven by genetics" | Corroborated only second-hand ⚠                               |
| 15   | Ruby-crowned Kinglet | "The sexes are identical apart from the crown", and the crown patch "is usually concealed by the surrounding feathers"                                                              | **Drop.** A mark the male himself hides cannot carry the card |

Sources: [Northern flicker](https://en.wikipedia.org/wiki/Northern_flicker),
[Pileated woodpecker](https://en.wikipedia.org/wiki/Pileated_woodpecker),
[Osprey](https://en.wikipedia.org/wiki/Osprey),
[American barn owl](https://en.wikipedia.org/wiki/American_barn_owl),
[Ruby-crowned kinglet](https://en.wikipedia.org/wiki/Ruby-crowned_kinglet).

**Two of these the plan got wrong**, both by understating the difference: the
osprey and the barn owl were filed as monomorphic on the grounds that their
differences "do not survive being pointed at". For the osprey that was simply
incorrect — the breast band is a described field mark. For the barn owl it was a
half-memory that turned out to be real but which Wikipedia only corroborates
sideways, through the snowy owl's article. Recording the error because the next
session cannot otherwise tell it from a verified call.

Tier B is where the paywall costs us most. Whether a flicker's malar stripe or
an osprey's necklace reads in a wide letterbox crop is exactly what BOW's
identification sections would answer and Wikipedia does not.

## Size-only or negligible — out (16 weeks)

Weeks 16, 17, 18, 19, 22, 23, 26, 27, 28, 30, 33, 34, 35, 37, 38, 41.

The strongest statements against, quoted so this is not re-litigated:

- **Blue Jay (22):** "Males and females are similar in size and plumage."
- **Atlantic Puffin (23):** "The external appearances of the adult male and female are identical."
- **Carolina Wren (17):** "both sexes similar in appearance."
- **Peregrine Falcon (27):** "The male and female have similar markings and plumage but … marked sexual dimorphism in size."
- **Barred Owl (38):** "the female is larger than the male … sometimes described as reverse sexual dimorphism."

Eight of the sixteen — Peregrine, Cooper's Hawk, Red-tailed Hawk,
Red-shouldered Hawk, Barred Owl, Great Horned Owl, Atlantic Puffin, Common Tern
— differ only in size. **A single photograph cannot show relative size**, so
these are out on a structural ground rather than a factual one, and no future
source will change it. That is the durable reason, written down so the question
is not reopened.

Three carry a real but sub-threshold difference:

- **Green Heron (33):** "Female adults tend to be smaller than males, and have
  duller and lighter plumage, particularly in the breeding season." The plan
  called this monomorphic, which was wrong; "duller and lighter" is still not
  something a parent could see.
- **Black-capped Chickadee (16):** "males have a larger bib."
- **Cooper's Hawk (28):** "Adult females typically are slightly more brownish or
  grayish above, while some adult males can range rarely into almost a powder
  blue color."

Cedar Waxwing (19), Tufted Titmouse (18), American Crow (30), Ring-billed Gull
(34) and Common Tern (26) have no sex-linked plumage difference described at
all.

## Where this leaves the feature

Unchanged in shape: **8 of 29 bird weeks**, the same eight the plan proposed. The
verification did not expand the feature; it hardened the reasons, found four
ways a pick could be mis-sexed, and produced the rule that the Commons file must
state the sex itself.

Open for the author, in priority order:

1. **The five ⚠ rows** need a BOW subscription or a field guide to settle. None
   of them change the tier A list; they decide whether tier B is ever worth
   building.
2. **Week 40's existing photo** needs its Commons identification checked before
   it is reused.
3. Whether Wikipedia is an acceptable basis for this at all, or whether tier A
   should be re-checked against BOW before curation starts.

## How to redo this

The extracts came from the MediaWiki API, one article per bird week, keyed off
`wikipediaTitle` in `data/comparisons.json`. There is no script in `scripts/`
for it — it was a one-off, and a second pass should probably use a real source
rather than reproduce this one.
