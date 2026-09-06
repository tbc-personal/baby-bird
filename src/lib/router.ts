/**
 * Hash routing (ADR-001/PLAN §2). A hash router needs no server rewrite rules,
 * which is what makes GitHub Pages viable for a deep-linkable app.
 *
 * Pure parsing here; the React hook that subscribes to `hashchange` lives in
 * `src/useRoute.ts`.
 */
export type Route =
  | { readonly name: 'setup' }
  | { readonly name: 'today' }
  | { readonly name: 'timeline' }
  | { readonly name: 'week'; readonly week: number }
  | { readonly name: 'labor' }
  | { readonly name: 'about' };

export const DEFAULT_ROUTE: Route = { name: 'today' };

/** Parse the part of a URL after `#`. Unknown paths fall back to Today. */
export function parseHash(hash: string): Route {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = (withoutHash.split('?')[0] ?? '').replace(/^\/+|\/+$/g, '');
  if (path === '') return DEFAULT_ROUTE;

  const segments = path.split('/');
  const [head, tail] = segments;

  switch (head) {
    case 'setup':
      return { name: 'setup' };
    case 'timeline':
      return { name: 'timeline' };
    case 'labor':
      return { name: 'labor' };
    case 'about':
      return { name: 'about' };
    case 'week': {
      const week = Number(tail);
      if (!Number.isInteger(week)) return DEFAULT_ROUTE;
      return { name: 'week', week };
    }
    default:
      return DEFAULT_ROUTE;
  }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/';
    case 'week':
      return `#/week/${route.week}`;
    default:
      return `#/${route.name}`;
  }
}

/** Which of the four bottom tabs is lit. Labor is reached from Today (mockup 4). */
export type TabId = 'setup' | 'today' | 'timeline' | 'about';

export function activeTab(route: Route): TabId {
  switch (route.name) {
    case 'setup':
      return 'setup';
    case 'timeline':
      return 'timeline';
    case 'about':
      return 'about';
    // A week card and the labor detail both keep the Today tab selected.
    case 'today':
    case 'week':
    case 'labor':
      return 'today';
  }
}
