# ADR-006: Privacy and persistence

Status: accepted (2026-09-06)

## Decision
- State (`method`, `inputDate`, `settings`) lives in `localStorage` under a versioned key (`babybird.v1`). No cookies, no analytics, no error reporting service, no third-party scripts except the Macaulay Library embed frames (ADR-003).
- Shareable link: the Today screen offers "Copy link for your partner", producing `?m=lmp&d=2026-03-01`. Opening such a link pre-fills setup and asks before overwriting existing local state.
- A "Forget my data" control clears storage.

## Context
A pregnancy date is sensitive personal data. The app's value doesn't depend on collecting it. Keeping it entirely on-device avoids GDPR/CCPA obligations and the need for a privacy policy beyond one sentence.

## Consequences
- Multi-device sync is by re-entering the date or opening the shared link. Acceptable for v1.
- The service worker must not cache the URL with query parameters in a way that leaks between users on a shared machine (cache the app shell only).
