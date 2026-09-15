# ADR-003: Images

Status: accepted 2026-09-06 as "bird photos via Macaulay Library embeds";
that route was abandoned on 2026-09-08 and its code removed on 2026-09-14.
**Every photo now comes from Wikimedia Commons.**

## Decision

One photograph per comparison week, from Wikimedia Commons, **downloaded into
`public/images/` and served locally**. The app makes no third-party request at
runtime, so the cards work offline.

The licence must be on the allowlist in `src/lib/schema.ts`
(`ALLOWED_COMMONS_LICENSES`): CC0, CC BY 2.0/3.0/4.0, CC BY-SA 3.0/4.0, or
public domain. Anything else is rejected by the schema, not by judgement.

Attribution is never hand-typed. `npm run commons-images` reads the curated
picks from `docs/research/commons-images.json`, fetches each file's metadata
from the Commons API, refuses any licence off the list, downloads and resizes,
and writes `author`, `license`, `licenseUrl` and `sourceUrl` into the row's
`image` object. The card shows them behind an "i" disclosure in the corner of
the photo.

The project stays non-commercial: no ads, no paid tier. That is now a project
choice rather than a licence condition — the Commons licences above all permit
commercial use.

## Why not the Macaulay Library

Worth reading before anyone proposes it again, because the blocker is not
something a code change fixes.

`macaulaylibrary.org` sits behind **Anubis, a proof-of-work bot challenge, and
it runs inside the embed frame in real time**. Every visitor would watch a bot
check where the photo should be, on every card, before any image appeared. The
app would be putting a third party's anti-abuse interstitial in front of its own
content. Observed directly, once the frame was actually loading.

Two things that were _not_ the problem, recorded because both were once believed
to be and both wasted time:

- **The embed template was always correct.** Cornell's Embed dialog produces an
  iframe pointing at exactly the URL that had been predicted, at 640x552.
- **An earlier claim that the endpoint was blocked was our own bug.** The
  lazy-load gate could hang, so no frame was created, no request was made, and
  the load timeout never started — leaving the card on "Loading photo" for ever.
  That conclusion had also generalised from `curl` and a server-side fetcher,
  which are never evidence about what a browser gets.

If Cornell ever exempts the embed endpoint, the route has to be rebuilt; the
component, the URL template and the `mlAssetId` schema fields were all deleted.

**Audubon is not an alternative.** Their terms reserve all rights, apply no
Creative Commons licence, permit only personal non-commercial copying, and
forbid using materials "separate from the accompanying text".

## Finding and choosing files

`npm run survey-commons` walks each species' Commons category, rejects
everything unshippable (licence, no named author, under 1000px, engravings,
museum skins, maps, sound), scores what survives on signals the API reports —
Featured/Quality/Valued badges, aspect ratio against the strip crop, whether an
egg week's file actually shows an egg — and writes a six-candidate shortlist.

**It never picks.** Choosing between six photographs is a human act, the same
split as `reviewed` in ADR-004. The choice and the reason for it go in
`docs/research/commons-images.json`; to swap a photo, change its `commonsTitle`
there and re-run. `docs/CURATING-PHOTOS.md` is the walkthrough.

### Coverage

36 of the 40 comparison weeks have a photo. **Weeks 7, 9, 12 and 13 do not**,
and render the kind silhouette tagged "Photo coming" — a state the app is fully
usable in, and the only image state left now that nothing loads over the
network.

The bird weeks (14–42) all had 18 or more candidates. The egg weeks are thinner
and need per-week judgement: American Robin 52 and Bald Eagle 37 are
comfortable, Great Blue Heron 11 and Black Tern 19 are workable, and **Wood
Thrush has 3**. Some egg weeks will have to show a nest with a clutch, or a bird
on a nest, rather than a clean egg. One happy accident: a Commons file of a Wood
Thrush nest containing a cowbird egg would illustrate week 9's own cowbird fact
exactly. See `docs/research/inaturalist-scope.md` for whether a second source
helps — it solves week 7, probably not 9 and 12, and definitely not 13.

## The strip is 200px, and crops are curated

The card's photo window is a **200px-tall, full-width letterbox** (about 2.1:1)
with `object-fit: cover`. It was 150px, which showed roughly half of each
photograph's height and decapitated any bird sitting high in its frame.

Two things follow, and both are load-bearing for curation:

- **`image.objectPosition`** is curated per photograph. Which part of a
  photograph holds the bird is a judgement about that photograph, not something
  the code can derive, so it is data like everything else. Eleven weeks carry one.
  Week 10 is the clearest case: the robin's eggs sit in the bottom third, and
  the card had been showing an empty nest.
- **`npm run crop-preview`** draws each photograph whole with the card's real
  window marked on it and a percentage scale down the side. Use it before
  committing a pick. The review sheets cannot show this, because their
  thumbnails are 16:9. Measured across all 36 curated weeks, the share of each
  photograph's height that reaches the card is 52% at 150px and 69% at 200px.
