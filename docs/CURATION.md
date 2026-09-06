# Content curation checklist

Two human tasks must happen alongside (or after) the code build. Both write into `data/comparisons.json`.

## A. Image IDs (weeks 7–42: Macaulay Library; weeks 2–6: Wikimedia Commons)

For each species row, open the search page, pick a well-rated photo showing the whole bird (or the egg for
weeks 7–13), open the asset, use **Embed**, and record the numeric asset ID (`ML` number) in `image.mlAssetId`
and the photographer credit in `image.credit`. Record a second ID in `image.fallbackMlAssetId` if possible.

Search URL pattern: `https://search.macaulaylibrary.org/catalog?taxonCode=<code>&mediaType=photo&sort=rating_rank_desc`
For eggs, add the age/behavior filter for eggs in the search UI (or search "egg" in the tag field).

| Week | Comparison | Code (verify) | Search |
|---|---|---|---|
| 7 | House Wren egg | houwre | https://search.macaulaylibrary.org/catalog?taxonCode=houwre&mediaType=photo&sort=rating_rank_desc |
| 8 | Barn Swallow egg | barswa | https://search.macaulaylibrary.org/catalog?taxonCode=barswa&mediaType=photo&sort=rating_rank_desc |
| 9 | Wood Thrush egg | woothr | https://search.macaulaylibrary.org/catalog?taxonCode=woothr&mediaType=photo&sort=rating_rank_desc |
| 10 | American Robin egg | amerob | https://search.macaulaylibrary.org/catalog?taxonCode=amerob&mediaType=photo&sort=rating_rank_desc |
| 11 | Black Tern egg | blkter | https://search.macaulaylibrary.org/catalog?taxonCode=blkter&mediaType=photo&sort=rating_rank_desc |
| 12 | Great Blue Heron egg | grbher | https://search.macaulaylibrary.org/catalog?taxonCode=grbher&mediaType=photo&sort=rating_rank_desc |
| 13 | Bald Eagle egg | baleag | https://search.macaulaylibrary.org/catalog?taxonCode=baleag&mediaType=photo&sort=rating_rank_desc |
| 14 | Ruby-throated Hummingbird | rthhum | https://search.macaulaylibrary.org/catalog?taxonCode=rthhum&mediaType=photo&sort=rating_rank_desc |
| 15 | Ruby-crowned Kinglet | ruckin | https://search.macaulaylibrary.org/catalog?taxonCode=ruckin&mediaType=photo&sort=rating_rank_desc |
| 16 | Black-capped Chickadee | bkcchi | https://search.macaulaylibrary.org/catalog?taxonCode=bkcchi&mediaType=photo&sort=rating_rank_desc |
| 17 | Carolina Wren | carwre | https://search.macaulaylibrary.org/catalog?taxonCode=carwre&mediaType=photo&sort=rating_rank_desc |
| 18 | Tufted Titmouse | tuftit | https://search.macaulaylibrary.org/catalog?taxonCode=tuftit&mediaType=photo&sort=rating_rank_desc |
| 19 | Cedar Waxwing | cedwax | https://search.macaulaylibrary.org/catalog?taxonCode=cedwax&mediaType=photo&sort=rating_rank_desc |
| 20 | Eastern Bluebird | easblu | https://search.macaulaylibrary.org/catalog?taxonCode=easblu&mediaType=photo&sort=rating_rank_desc |
| 21 | American Kestrel | amekes | https://search.macaulaylibrary.org/catalog?taxonCode=amekes&mediaType=photo&sort=rating_rank_desc |
| 22 | Blue Jay | blujay | https://search.macaulaylibrary.org/catalog?taxonCode=blujay&mediaType=photo&sort=rating_rank_desc |
| 23 | Atlantic Puffin | atlpuf | https://search.macaulaylibrary.org/catalog?taxonCode=atlpuf&mediaType=photo&sort=rating_rank_desc |
| 24 | Northern Flicker | norfli | https://search.macaulaylibrary.org/catalog?taxonCode=norfli&mediaType=photo&sort=rating_rank_desc |
| 25 | Belted Kingfisher | belkin1 | https://search.macaulaylibrary.org/catalog?taxonCode=belkin1&mediaType=photo&sort=rating_rank_desc |
| 26 | Common Tern | comter | https://search.macaulaylibrary.org/catalog?taxonCode=comter&mediaType=photo&sort=rating_rank_desc |
| 27 | Peregrine Falcon | perfal | https://search.macaulaylibrary.org/catalog?taxonCode=perfal&mediaType=photo&sort=rating_rank_desc |
| 28 | Cooper's Hawk | coohaw | https://search.macaulaylibrary.org/catalog?taxonCode=coohaw&mediaType=photo&sort=rating_rank_desc |
| 29 | American Barn Owl | brnowl | https://search.macaulaylibrary.org/catalog?taxonCode=brnowl&mediaType=photo&sort=rating_rank_desc |
| 30 | American Crow | amecro | https://search.macaulaylibrary.org/catalog?taxonCode=amecro&mediaType=photo&sort=rating_rank_desc |
| 31 | Pileated Woodpecker | pilwoo | https://search.macaulaylibrary.org/catalog?taxonCode=pilwoo&mediaType=photo&sort=rating_rank_desc |
| 32 | Hooded Merganser | hoomer | https://search.macaulaylibrary.org/catalog?taxonCode=hoomer&mediaType=photo&sort=rating_rank_desc |
| 33 | Green Heron | grnher | https://search.macaulaylibrary.org/catalog?taxonCode=grnher&mediaType=photo&sort=rating_rank_desc |
| 34 | Ring-billed Gull | ribgul | https://search.macaulaylibrary.org/catalog?taxonCode=ribgul&mediaType=photo&sort=rating_rank_desc |
| 35 | Red-tailed Hawk | rethaw | https://search.macaulaylibrary.org/catalog?taxonCode=rethaw&mediaType=photo&sort=rating_rank_desc |
| 36 | Wood Duck | wooduc | https://search.macaulaylibrary.org/catalog?taxonCode=wooduc&mediaType=photo&sort=rating_rank_desc |
| 37 | Red-shouldered Hawk | reshaw | https://search.macaulaylibrary.org/catalog?taxonCode=reshaw&mediaType=photo&sort=rating_rank_desc |
| 38 | Barred Owl | brdowl | https://search.macaulaylibrary.org/catalog?taxonCode=brdowl&mediaType=photo&sort=rating_rank_desc |
| 39 | Mallard | mallar3 | https://search.macaulaylibrary.org/catalog?taxonCode=mallar3&mediaType=photo&sort=rating_rank_desc |
| 40 | Snowy Owl | snoowl | https://search.macaulaylibrary.org/catalog?taxonCode=snoowl&mediaType=photo&sort=rating_rank_desc |
| 41 | Great Horned Owl | grhowl | https://search.macaulaylibrary.org/catalog?taxonCode=grhowl&mediaType=photo&sort=rating_rank_desc |
| 42 | Osprey | osprey | https://search.macaulaylibrary.org/catalog?taxonCode=osprey&mediaType=photo&sort=rating_rank_desc |

Seeds and grit (weeks 2–6): search Wikimedia Commons for "poppy seeds", "nyjer seed", "proso millet seed", "sunflower seed",
pick a CC0 or CC BY file, download it to `public/images/seeds/`, and record `provider: "commons"`, `sourceUrl`,
`author`, `license`, `licenseUrl` in `image`.

Week 3: proposed "Grain of grit" (`proposed: true` in the data). If accepted, source a Commons photo of gizzard grit or coarse sand alongside the seed photos.

## B. Facts review

The build session writes facts with `reviewed: false`. Review pass: check each against its cited source,
edit for voice, set `reviewed: true`. `scripts/validate-data.ts` reports the count of unreviewed facts;
the release checklist requires zero.

## C. Verify slugs and codes

For each row: `https://www.allaboutbirds.org/guide/<allAboutBirdsSlug>/overview` returns 200, and
`https://ebird.org/species/<ebirdSpeciesCode>` shows the expected species. `scripts/check-links.ts` automates this.
