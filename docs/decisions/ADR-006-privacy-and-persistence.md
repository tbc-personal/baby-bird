# ADR-006: Privacy and persistence

Status: accepted (2026-09-06)

## Decision

- State (`method`, `inputDate`, `settings`) lives in `localStorage` under a versioned key (`nestling.v1`). No cookies, no analytics, no error reporting service, no third-party scripts. (The original decision here carved out an exception for the Macaulay Library embed frames of ADR-003; that route was abandoned and its code removed, so the exception no longer applies and the privacy claim is now stronger than originally written: the app makes no third-party requests at all.)
- Shareable link: Setup offers "Copy a shareable link". As built, the link is always converted to due-date mode before it is copied, producing `?m=dueDate&d=2026-03-01` regardless of which method you entered the date by (`src/lib/storage.ts`, `buildShareLink`), not the `?m=lmp&...` this ADR originally showed. Opening such a link pre-fills setup and asks before overwriting existing local state.
- A "Forget my data" control clears storage.

## Context

A pregnancy date is sensitive personal data. The app's value doesn't depend on collecting it. Keeping it entirely on-device avoids GDPR/CCPA obligations and the need for a privacy policy beyond one sentence.

## Consequences

- Multi-device sync is by re-entering the date or opening the shared link. Acceptable for v1.
- The service worker must not cache the URL with query parameters in a way that leaks between users on a shared machine (cache the app shell only).
