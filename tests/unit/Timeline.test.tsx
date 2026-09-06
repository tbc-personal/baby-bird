import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TimelineScreen } from '../../src/screens/Timeline';
import { WeekScreen } from '../../src/screens/Week';
import { AppStateProvider } from '../../src/state';
import { STORAGE_KEY } from '../../src/lib/storage';
import { parseIsoDate } from '../../src/lib/gestation';
import { COMPARISON_WEEKS } from '../../src/data/comparisons';

function day(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad fixture date: ${iso}`);
  return parsed;
}

function renderTimeline(today = '2026-09-06') {
  return render(
    <AppStateProvider>
      <TimelineScreen today={day(today)} />
    </AppStateProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  // jsdom has no layout, so scrollIntoView is not implemented.
  Element.prototype.scrollIntoView = () => undefined;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-03-29' }),
  );
});

describe('Timeline (mockup 3)', () => {
  it('lists all 41 comparison rows, weeks 2 through 42', () => {
    renderTimeline();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(41);
    expect(COMPARISON_WEEKS).toHaveLength(41);
    expect(screen.getByText('All 41 weeks')).toBeInTheDocument();
  });

  it('marks the current week and says so', () => {
    renderTimeline();
    const current = document.querySelector('[data-current-week="true"]');
    expect(current).not.toBeNull();
    expect(current).toHaveTextContent('Atlantic Puffin');
    expect(current).toHaveTextContent('this week');
    expect(current).toHaveAttribute('aria-current', 'true');
    // Exactly one row is current.
    expect(document.querySelectorAll('[data-current-week="true"]')).toHaveLength(1);
  });

  it('puts the convention divider between weeks 20 and 21', () => {
    renderTimeline();
    const divider = screen.getByText(/crown to rump · ▼ head to heel/);
    const item = divider.closest('li');
    expect(item).not.toBeNull();
    // The divider sits inside the week 21 item, above its row.
    expect(within(item as HTMLElement).getByRole('link')).toHaveTextContent(
      'American Kestrel',
    );
    expect(screen.getAllByText(/crown to rump · ▼ head to heel/)).toHaveLength(1);
  });

  it('links every row to its week card', () => {
    renderTimeline();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(41);
    expect(links[0]).toHaveAttribute('href', '#/week/2');
    expect(links.at(-1)).toHaveAttribute('href', '#/week/42');
  });

  it('shows a kind silhouette per row, not a photo', () => {
    const { container } = renderTimeline();
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
    expect(container.querySelectorAll('.row__mark svg')).toHaveLength(41);
  });

  it('has no current row before week 2', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-09-01' }),
    );
    renderTimeline();
    expect(document.querySelector('[data-current-week="true"]')).toBeNull();
  });

  it('follows the unit preference', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        method: 'lmp',
        inputDate: '2026-03-29',
        settings: { units: 'metric' },
      }),
    );
    const { container } = renderTimeline();
    expect(screen.getByText('cm / g')).toBeInTheDocument();
    // The size cell holds length and weight separated by a <br>.
    const sizes = [...container.querySelectorAll('.row__size')].map((n) => n.textContent);
    expect(sizes).toContain('28.9 cm499 g');
    expect(sizes.some((s) => s?.includes(' in'))).toBe(false);
  });
});

describe('Week screen', () => {
  function renderWeek(week: number) {
    return render(
      <AppStateProvider>
        <WeekScreen week={week} today={day('2026-09-06')} />
      </AppStateProvider>,
    );
  }

  it('renders the same card as Today for any week 2–42', () => {
    renderWeek(23);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Atlantic Puffin');
    expect(screen.getByText('Your baby is roughly the size of an')).toBeInTheDocument();
    expect(screen.getByText('week 23')).toBeInTheDocument();
  });

  it.each([2, 3, 7, 20, 21, 42])('renders week %i', (week) => {
    const view = renderWeek(week);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    view.unmount();
  });

  it.each([1, 0, 43, 99, -1])('shows an empty state for week %i', (week) => {
    const view = renderWeek(week);
    expect(screen.getByText(`No comparison for week ${week}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the timeline' })).toBeInTheDocument();
    view.unmount();
  });
});
