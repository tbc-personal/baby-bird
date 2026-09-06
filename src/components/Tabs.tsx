import { activeTab, hrefFor, type Route } from '../lib/router';
import '../styles/tabs.css';

const TABS = [
  { id: 'setup', label: 'Setup', href: hrefFor({ name: 'setup' }) },
  { id: 'today', label: 'Today', href: hrefFor({ name: 'today' }) },
  { id: 'timeline', label: 'Timeline', href: hrefFor({ name: 'timeline' }) },
  { id: 'about', label: 'About', href: hrefFor({ name: 'about' }) },
] as const;

/**
 * The four bottom tabs. Today and Timeline are disabled until a date is saved
 * (mockup state table), and a disabled tab is rendered as a span so it is not
 * focusable rather than as a link that goes nowhere.
 */
export function Tabs({ route, hasDate }: { route: Route; hasDate: boolean }) {
  const current = activeTab(route);
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((tab) => {
        const disabled = !hasDate && (tab.id === 'today' || tab.id === 'timeline');
        if (disabled) {
          return (
            <span key={tab.id} aria-disabled="true">
              {tab.label}
            </span>
          );
        }
        return (
          <a
            key={tab.id}
            href={tab.href}
            {...(current === tab.id ? { 'aria-current': 'page' as const } : {})}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
