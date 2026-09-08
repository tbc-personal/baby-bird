# ADR-003: Bird images via Macaulay Library embeds (non-commercial)

Status: accepted (2026-09-06). Chosen by the author over the recommended Wikimedia Commons option.

## Decision
For weeks 7–42 (eggs and birds), each screen embeds one Macaulay Library asset using the library's official share/embed iframe. Asset IDs are curated once and stored in `data/comparisons.json` (`image.mlAssetId`). The app must remain non-commercial: no ads, no paid tier, no for-profit ownership.

For weeks 2–6 (seeds), the Macaulay Library has no assets. Use Wikimedia Commons CC0 / CC BY photos, downloaded into the repo with attribution stored in the same JSON `image` object (`provider: "commons"`).

## Context
Cornell's help center states embedding and sharing Macaulay Library media is for non-commercial purposes only; any revenue-generating use needs a helpdesk ticket and license. All About Birds photos are Macaulay Library assets, so this is the closest permitted route to "the bird photo from All About Birds". See `docs/research/licensing.md`.

## Constraints and mitigations
| Risk | Mitigation |
|---|---|
| Iframe markup or URL pattern changes on Cornell's side | Isolate in one component (`MacaulayEmbed`). Store the asset ID, not the markup; build the iframe from a single template constant. Add a smoke test that loads one embed in CI via Playwright and fails if it renders empty. |
| No offline support for embeds | Service worker does not cache cross-origin frames. Show the offline goose (`docs/mockups/goose-offline.svg`: a line-drawn goose in a hat with a no-wifi symbol) with the tag "Photo needs a connection" when `navigator.onLine` is false or the frame fails to load within a timeout. |
| Third-party script weight on every screen | Lazy-load the iframe only for the current week's card; timeline rows use small kind silhouettes (seed / egg / bird), not photos. |
| No asset ID curated yet | Render the kind silhouette with the tag "Photo coming". Distinct from the offline goose. |
| Contributor deletes an asset | Curate two IDs per species (primary, fallback). Quarterly link check script. |
| Commercial drift | README and LICENSE state the non-commercial constraint. Any monetization requires re-doing this ADR and filing a Macaulay Library license request. |

## Finding, 2026-09-08: the embed route is unproven, not disproven

An earlier revision of this section claimed the embed endpoint was blocked and
cited the author's own home connection as evidence. **That was wrong, and the
correction matters more than the original claim.**

What is established:

- **The template is correct.** `https://macaulaylibrary.org/asset/{id}/embed` is
  the right shape; search engines have long-indexed pages at exactly it, titled
  `ML<id> - <Species> - Macaulay Library`.
- **`macaulaylibrary.org` is behind Anubis**, a proof-of-work bot challenge.
  Every non-JavaScript client — curl, a server-side fetcher — gets the challenge
  page instead of the media. That is precisely what Anubis is built to do, and
  it says nothing about a real browser, which runs the challenge and passes.
- **The first week-22 failure was ours, not Cornell's.** The card sat on
  "Loading photo" showing the kind silhouette, which is the branch taken when
  the IntersectionObserver never reports. No frame was created, so no request
  ever reached Cornell, and with no frame the six-second timeout never started,
  which is why no goose appeared either. Fixed by
  `EMBED_VISIBILITY_FALLBACK_MS`, with a regression test.

What is **not** established: whether a browser, having passed the challenge, can
render the embed inside a third-party iframe. The open question is whether the
Anubis cookie survives a cross-site frame; browsers block third-party cookies by
default, and if the challenge cannot persist there the embed cannot resolve. This
could not be tested from the build container — headless Chromium cannot reach
the host through the egress proxy, which drops its tunnels.

**Settle it before curating 36 ids.** In an ordinary browser:

1. Open `https://macaulaylibrary.org/asset/664524507/embed` as a normal tab. If
   the photo appears, the endpoint is fine for browsers and only the framed case
   is in doubt.
2. On the asset page, use **Embed** and copy the markup Cornell actually
   produces. If it is not a bare iframe to that URL — a script, a different
   host, extra parameters — then the hand-rolled iframe in `MacaulayEmbed` is
   the bug and the fix is that one template constant.
3. With week 22 curated, load the card and watch the network panel for a request
   to `macaulaylibrary.org`. A request that is made and refused is Cornell; no
   request at all is us.

The image CDN (`cdn.download.ams.birds.cornell.edu/api/v2/asset/<id>/1200`) is
not behind the challenge and returns the JPEG directly. That is hotlinking
rather than embedding: it bypasses the credit the embed renders, and the
non-commercial permission this ADR rests on is written about embedding. It would
need its own licensing decision, and is noted only so the option is on the record.

The fallback this ADR already named — Wikimedia Commons for every week — is
proven: weeks 2, 4, 5 and 6 ship it, and `image.provider` was designed so the
swap is a data change.

## Embed mechanics

**Status after the build session (2026-09-06): NOT VERIFIED. Do not ship a
curated asset id until someone with a browser confirms the pattern below.**

The build session was asked to confirm the exact `src` from a live asset page's
Embed dialog. It could not. The sandbox's egress proxy refuses `CONNECT` to
`macaulaylibrary.org` and `search.macaulaylibrary.org`, and the gateway answers
`HTTP 403` before any request leaves the machine. The same block applies to
`commons.wikimedia.org`, `upload.wikimedia.org`, `en.wikipedia.org` and
`www.allaboutbirds.org`. Nothing about Cornell's markup was observed; the note
below is unchanged from the planning guess and is recorded as a guess.

- Assumed form, templated in `src/components/macaulay.ts` as the single constant
  `MACAULAY_EMBED_TEMPLATE`: `https://macaulaylibrary.org/asset/<ID>/embed`,
  rendered as an `<iframe>` with `loading="lazy"` and a fixed 150px height.
  Required size attributes, if Cornell specifies any, are unknown.
- Verification step for whoever picks this up: open any asset page, use the
  **Embed** control, copy the iframe it produces, and compare it against
  `MACAULAY_EMBED_TEMPLATE`. If the `src` differs, that one constant is the only
  edit needed. `scripts/check-links.ts` will then confirm the asset ids resolve.
- The app is fully usable meanwhile. No row in `data/comparisons.json` carries an
  `mlAssetId`, so every card renders the kind silhouette tagged "Photo coming",
  and `MacaulayEmbed` is never mounted in the shipped build.
- The embed renders its own credit line. The app still shows
  "Photo: <photographer> / Macaulay Library at the Cornell Lab of Ornithology
  ML<ID>" as text, for accessibility and per Cornell's credit guidance.
- Each card also deep-links to `https://www.allaboutbirds.org/guide/<slug>/overview`.

### Failure handling as built
- `navigator.onLine` false, or no `load` within **6 seconds**: the offline goose,
  tagged "Photo needs a connection".
- No `mlAssetId` curated: the kind silhouette, tagged "Photo coming". Distinct
  from the offline state, as this ADR requires.
- The frame is created only when the card comes within 200px of the viewport,
  via a callback ref rather than a mount effect, so a card that first renders
  offline still attaches its observer when the connection returns.

## Alternatives rejected
- Wikimedia Commons for all weeks: no permission needed, offline-capable, but not Cornell's photos. Remains the fallback if the embed route breaks; the `image.provider` field is designed so the swap is a data change.
- Requesting a Cornell license for downloaded images: cheap to ask, uncertain timeline. Can be pursued in parallel; not a v1 dependency.
