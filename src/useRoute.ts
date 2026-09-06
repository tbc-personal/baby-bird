import { useEffect, useState } from 'react';
import { parseHash, type Route } from './lib/router';

/** Subscribes to `hashchange` and hands back the parsed route. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return route;
}

export function navigate(href: string): void {
  window.location.hash = href.startsWith('#') ? href.slice(1) : href;
}
