# ADR-001: Platform and stack

Status: accepted (2026-09-06)

## Decision
Static progressive web app. React 18 + TypeScript + Vite. No backend, no accounts. Hosted on GitHub Pages from this repo. Installable via a web manifest and a minimal service worker.

## Context
The app's whole state is two values (a date and a method). Everything else is derived from bundled JSON. A server adds cost and a privacy liability (pregnancy data) for no v1 benefit.

## Consequences
- All computation is client-side pure functions, which makes the due-date and probability math trivially unit-testable.
- Offline works for everything except the Macaulay Library embeds (see ADR-003), which need a placeholder when offline.
- Sharing between partners is by URL (see ADR-006), not by account.
- Native app-store presence is out of scope. Revisit only if push notifications become a requirement.

## Alternatives rejected
- Plain TypeScript without a framework: fewer dependencies but more hand-written state and routing for a build session to get right.
- Expo / React Native: store accounts, signing, and review cycles before anyone can use it.
- Next.js with a database: only justified by accounts or sync, which are not v1 requirements.
