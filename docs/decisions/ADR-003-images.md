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

## Finding, 2026-09-08: the embed endpoint is behind a bot challenge

The template was right. The route is blocked anyway.

`MACAULAY_EMBED_TEMPLATE` (`https://macaulaylibrary.org/asset/{id}/embed`) is the
correct pattern — search engines have long-indexed pages at exactly that shape,
titled `ML<id> - <Species> - Macaulay Library`. It was never the problem.

What is: Cornell has put **Anubis**, a proof-of-work bot challenge, in front of
`macaulaylibrary.org`. Every request to an asset or embed URL now answers with
the challenge page rather than the media. Verified against three different
networks (this repo's CI sandbox, an Anthropic egress, and the author's own home
connection), and against both a brand-new asset id and ML6050, indexed for
years. It is the endpoint, not the id.

An `<iframe>` cannot get past it. Anubis works by handing the visitor a
JavaScript challenge and setting a cookie on success; in a third-party frame that
cookie is cross-site, which browsers block by default, so the challenge can never
persist. The card shows "Loading photo", then the offline goose at the six-second
timeout — the failure is graceful, but it is total.

The image CDN (`cdn.download.ams.birds.cornell.edu/api/v2/asset/<id>/1200`) is
**not** behind the challenge and returns the JPEG directly. That is hotlinking,
not embedding: it bypasses the credit line the embed renders, and the
non-commercial permission this ADR rests on is written about embedding. Using it
would need its own licensing decision, not an assumption.

The alternative this ADR already named — Wikimedia Commons for every week — is
proven: weeks 2, 4, 5 and 6 ship it, and `image.provider` was designed so the
swap is a data change. See `docs/CURATING-PHOTOS.md`.

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
