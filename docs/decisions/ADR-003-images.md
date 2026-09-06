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
| No offline support for embeds | Service worker does not cache cross-origin frames. Show a species silhouette SVG plus name when `navigator.onLine` is false or the frame fails to load within a timeout. |
| Third-party script weight on every screen | Lazy-load the iframe only for the current week's card; timeline thumbnails use the silhouette. |
| Contributor deletes an asset | Curate two IDs per species (primary, fallback). Quarterly link check script. |
| Commercial drift | README and LICENSE state the non-commercial constraint. Any monetization requires re-doing this ADR and filing a Macaulay Library license request. |

## Embed mechanics (verify during build)
- From an asset page such as `https://macaulaylibrary.org/asset/<ID>`, the "Embed" control yields an iframe. The expected form is `<iframe src="https://macaulaylibrary.org/asset/<ID>/embed" ...>`; confirm the exact `src` and any required size attributes from the live "Embed" dialog before templating it.
- The embed renders its own credit line. The app should still show "Photo: <photographer> / Macaulay Library ML<ID>" as text for accessibility and per Cornell's credit guidance.
- Each card also deep-links to `https://www.allaboutbirds.org/guide/<slug>/overview`.

## Alternatives rejected
- Wikimedia Commons for all weeks: no permission needed, offline-capable, but not Cornell's photos. Remains the fallback if the embed route breaks; the `image.provider` field is designed so the swap is a data change.
- Requesting a Cornell license for downloaded images: cheap to ask, uncertain timeline. Can be pursued in parallel; not a v1 dependency.
