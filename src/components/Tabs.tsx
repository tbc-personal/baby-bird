import { activeTab, hrefFor, type Route } from '../lib/router';
import { SlidersIcon } from './SlidersIcon';
import '../styles/tabs.css';

/*
 * Today first: it is where the app opens and where you spend your time. Setup
 * sits last, on the right, which is where a settings affordance is looked for
 * and the furthest from a thumb about to tap something it uses every day.
 */
const TABS = [
  { id: 'today', label: 'Today', href: hrefFor({ name: 'today' }), icon: false },
  { id: 'timeline', label: 'Timeline', href: hrefFor({ name: 'timeline' }), icon: false },
  { id: 'setup', label: 'Setup', href: hrefFor({ name: 'setup' }), icon: true },
] as const;

/**
 * The three bottom tabs. Today and Timeline are disabled until a date is saved
 * (mockup state table), and a disabled tab is rendered as a span so it is not
 * focusable rather than as a link that goes nowhere.
 *
 * Setup shows the sliders mark instead of a word. It absorbed About, so it now
 * covers the date, the display settings and the credits, and no single label
 * covered all three; the icon carries its name in `aria-label` and `title`.
 */
export function Tabs({ route, hasDate }: { route: Route; hasDate: boolean }) {
  const current = activeTab(route);
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((tab) => {
        const disabled = !hasDate && (tab.id === 'today' || tab.id === 'timeline');
        const content = tab.icon ? <SlidersIcon /> : tab.label;
        const naming = tab.icon ? { 'aria-label': tab.label, title: tab.label } : {};

        if (disabled) {
          return (
            <span key={tab.id} aria-disabled="true" {...naming}>
              {content}
            </span>
          );
        }
        return (
          <a
            key={tab.id}
            href={tab.href}
            className={tab.icon ? 'tabs__icon' : undefined}
            {...naming}
            {...(current === tab.id ? { 'aria-current': 'page' as const } : {})}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
