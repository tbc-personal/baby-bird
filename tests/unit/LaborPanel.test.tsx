import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LaborScreen } from '../../src/screens/Labor';
import { TodayScreen } from '../../src/screens/Today';
import { AppStateProvider } from '../../src/state';
import { parseSavedState, STORAGE_KEY } from '../../src/lib/storage';
import { parseIsoDate } from '../../src/lib/gestation';
import { formatPercent } from '../../src/lib/percent';
import { LABOR_PANEL_FROM_DAY } from '../../src/lib/laborProbability';

function day(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad fixture date: ${iso}`);
  return parsed;
}

/** LMP 2026-03-29, so gestational day N is 2026-03-29 + N. */
const LMP = '2026-03-29';

function save(settings: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      method: 'lmp',
      inputDate: LMP,
      settings: { units: 'imperial', laborPanelEnabled: true, skin: 'puffin', ...settings },
    }),
  );
}

function dayOfGestation(n: number): Date {
  const start = day(LMP);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('the labor card on Today', () => {
  function renderToday(gestationalDay: number) {
    return render(
      <AppStateProvider>
        <TodayScreen today={dayOfGestation(gestationalDay)} />
      </AppStateProvider>,
    );
  }

  it('is absent the day before 34w0d', () => {
    save();
    renderToday(LABOR_PANEL_FROM_DAY - 1);
    expect(screen.queryByText(/chance labor starts on its own/)).toBeNull();
  });

  it('appears exactly at 34w0d', () => {
    save();
    renderToday(LABOR_PANEL_FROM_DAY);
    expect(screen.getByText(/chance labor starts on its own/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See the daily curve/ })).toHaveAttribute(
      'href',
      '#/labor',
    );
  });

  it('stays visible later in the third trimester', () => {
    save();
    renderToday(280);
    expect(screen.getByText(/chance labor starts on its own/)).toBeInTheDocument();
  });

  it('is hidden when the setting is off', () => {
    save({ laborPanelEnabled: false });
    renderToday(280);
    expect(screen.queryByText(/chance labor starts on its own/)).toBeNull();
  });
});

describe('the labor screen (mockup 4)', () => {
  function renderLabor(gestationalDay: number) {
    return render(
      <AppStateProvider>
        <LaborScreen today={dayOfGestation(gestationalDay)} />
      </AppStateProvider>,
    );
  }

  it('leads with the conditional probability', () => {
    save();
    renderLabor(261); // 37w2d, the mockup's example
    expect(
      screen.getByText(/chance labor starts on its own in the next 7 days/),
    ).toBeInTheDocument();
    expect(screen.getByText(/given you’re still\s+pregnant today/)).toBeInTheDocument();
  });

  it('shows the two summary tiles and the curve', () => {
    save();
    renderLabor(261);
    expect(screen.getByText('by your due date')).toBeInTheDocument();
    expect(screen.getByText('most likely single day')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Daily chance of spontaneous labor/ }),
    ).toBeInTheDocument();
  });

  it('names its sources and states the caveats', () => {
    save();
    renderLabor(261);
    expect(screen.getByRole('link', { name: 'Smith 2001' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'CDC preterm birth rate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jukic 2013' })).toBeInTheDocument();
    expect(
      screen.getByText(/singleton pregnancies with spontaneous onset/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not medical\s+advice/)).toBeInTheDocument();
  });

  it('states the known limitation rather than burying it', () => {
    save();
    renderLabor(261);
    expect(screen.getByText(/One known limitation/)).toBeInTheDocument();
    expect(screen.getByText(/past 42 weeks/)).toBeInTheDocument();
  });

  it('hides the panel and persists that choice', async () => {
    const user = userEvent.setup();
    save();
    renderLabor(261);
    await user.click(screen.getByRole('button', { name: 'Hide this panel' }));

    const stored = parseSavedState(window.localStorage.getItem(STORAGE_KEY));
    expect(stored?.settings.laborPanelEnabled).toBe(false);
  });
});

describe('formatPercent', () => {
  it.each([
    [0, '0%'],
    [0.004, 'under 1%'],
    [0.01, '1%'],
    [0.084, '8%'],
    [0.5, '50%'],
    [0.996, 'over 99%'],
    [1, '100%'],
  ] as const)('%f → %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
});
