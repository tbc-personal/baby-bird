import { useEffect, useMemo, useState } from 'react';
import { useRoute } from './useRoute';
import { useAppState } from './useAppState';
import { hrefFor } from './lib/router';
import { shareParamsFromUrl, type SharedDate } from './lib/storage';
import { Tabs } from './components/Tabs';
import { SetupScreen } from './screens/Setup';
import { TodayScreen } from './screens/Today';
import { TimelineScreen } from './screens/Timeline';
import { WeekScreen } from './screens/Week';
import { LaborScreen } from './screens/Labor';
import { AboutScreen } from './screens/About';
import './styles/app.css';

/**
 * Today's local date, read once per mount and refreshed when the tab is brought
 * back to the foreground so a session left open overnight rolls over. This is
 * the only place in the app that reads the clock; every derived value takes it
 * as a parameter (ADR-002).
 */
function useToday(): Date {
  const [today, setToday] = useState(() => startOfLocalDay(new Date()));

  useEffect(() => {
    const refresh = () => {
      const now = startOfLocalDay(new Date());
      setToday((previous) => (previous.getTime() === now.getTime() ? previous : now));
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function App() {
  const route = useRoute();
  const today = useToday();
  const { saved } = useAppState();
  const hasDate = saved !== null;

  // A shared ?m=&d= link (ADR-006). Held in state so Setup can offer to replace
  // an existing saved date rather than silently overwriting it.
  const shared = useMemo<SharedDate | null>(
    () => shareParamsFromUrl(window.location.href),
    [],
  );

  // With no saved date the only reachable screens are Setup and About.
  useEffect(() => {
    if (
      !hasDate &&
      (route.name === 'today' ||
        route.name === 'timeline' ||
        route.name === 'week' ||
        route.name === 'labor')
    ) {
      window.location.hash = hrefFor({ name: 'setup' }).slice(1);
    }
  }, [hasDate, route.name]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main className="app__main" id="main">
        {renderScreen()}
      </main>
      <Tabs route={route} hasDate={hasDate} />
    </div>
  );

  function renderScreen() {
    switch (route.name) {
      case 'setup':
        return <SetupScreen today={today} shared={shared} />;
      case 'timeline':
        return <TimelineScreen today={today} />;
      case 'week':
        return <WeekScreen week={route.week} today={today} />;
      case 'labor':
        return <LaborScreen today={today} />;
      case 'about':
        return <AboutScreen />;
      case 'today':
      default:
        return hasDate ? (
          <TodayScreen today={today} />
        ) : (
          <SetupScreen today={today} shared={shared} />
        );
    }
  }
}
