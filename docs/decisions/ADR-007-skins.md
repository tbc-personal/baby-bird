# ADR-007: Skins

Status: accepted (2026-09-06)

## Decision
The user picks one of seven skins in About. A skin is a palette (five roles, each with light and dark values) and a display/body typeface pair. IBM Plex Mono is shared across skins for numbers. Default skin: Puffin.

| Skin | Bird | Ground / Ink / Accent / Secondary / Highlight (light) | Display / Body |
|---|---|---|---|
| Puffin | Atlantic Puffin | #F6F4EF / #1F2A33 / #E8632B / #2F6F73 / #F2B33D | Bricolage Grotesque / Atkinson Hyperlegible |
| Kingfisher | Belted Kingfisher | #F3F5F7 / #1C2E44 / #B5542D / #4A6B8A / #9DB9CE | DM Serif Display / Public Sans |
| Bluebird | Eastern Bluebird | #F7F5F0 / #23324A / #3B7DD8 / #C7643A / #D6E6F7 | Outfit / Nunito Sans |
| Green Heron | Green Heron | #F2F3EE / #1E2A22 / #7A4A2E / #2F4A3A / #D9A21B | Cormorant Garamond / Source Sans 3 |
| Oriole | Baltimore Oriole | #FBF7F1 / #141414 / #F28C1A / #3A3A3A / #FFD9A8 | Archivo / Karla |
| Goldfinch | American Goldfinch | #FCFBF4 / #1A1A1A / #C9A000 / #6B6F3A / #FBEC8C | Gabarito / Mulish |
| Cardinal | Northern Cardinal | #FAF5F2 / #1A1414 / #C41E3A / #8A6E4B / #F5D6D0 | Instrument Serif / Instrument Sans |

Light values are shown in `docs/mockups/screens.html`. Dark values are the build session's to derive, keeping the accent recognizable and text contrast at or above 4.5:1.

## Implementation
- Skins are data: `src/skins/<name>.ts` exporting `{ id, label, bird, light: Tokens, dark: Tokens, fonts: { display, body } }`. A single `applySkin()` sets CSS custom properties on `:root` and a `data-skin` attribute. Components use only the token names (`--ground`, `--paper`, `--ink`, `--ink-2`, `--line`, `--accent`, `--accent-soft`, `--secondary`, `--highlight`, `--egg`, `--note`, `--focus`).
- Fonts are self-hosted in `public/fonts/` (latin subset, woff2, weights actually used). Only the active skin's fonts are loaded; the others are preloaded lazily after first paint. Each skin declares fallback stacks.
- Selection persists in settings (ADR-006). Dark/light follows `prefers-color-scheme` within the chosen skin.
- The offline goose and the silhouettes use `currentColor`, so they follow the skin.
- Visual regression: one Playwright screenshot of Today per skin in light and dark, checked into `tests/__screenshots__`.
- Precache/runtime split: the service worker precaches only the default skin's faces (Bricolage Grotesque, Atkinson Hyperlegible 400 and 700) plus the shared IBM Plex Mono, and a `CacheFirst` runtime rule with a one-year expiration keeps any other skin's faces from the first time it is selected, so a chosen skin still renders offline.

## Consequences
- Adds fourteen font families to the repo (roughly 30–40 KB each subset). Acceptable for a PWA; the app shell caches them.
- Every new component must be written against tokens only. A lint rule (`stylelint-declaration-strict-value` on `color`, `background`, `border-color`) enforces it.
- The Goldfinch accent is darkened from true goldfinch yellow so it holds contrast on light ground; the highlight token carries the brighter yellow.
