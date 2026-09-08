import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayScreen } from '../../src/screens/Today';
import { ComparisonCard } from '../../src/components/ComparisonCard';
import { AppStateProvider } from '../../src/state';
import { STORAGE_KEY } from '../../src/lib/storage';
import { parseIsoDate } from '../../src/lib/gestation';
import { weekRow } from '../../src/data/comparisons';

function day(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad fixture date: ${iso}`);
  return parsed;
}

function saveLmp(inputDate: string) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, method: 'lmp', inputDate }),
  );
}

function renderToday(today: string) {
  return render(
    <AppStateProvider>
      <TodayScreen today={day(today)} />
    </AppStateProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Today screen (mockup 2)', () => {
  it('shows the header, the big line and the card', () => {
    saveLmp('2026-03-29');
    renderToday('2026-09-06');

    expect(screen.getByText('Second trimester')).toBeInTheDocument();
    expect(screen.getByText('due Jan 3')).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('23 weeks, 0 days');
    expect(heading).toHaveTextContent('119 days to go');

    expect(screen.getByText('Week 23')).toBeInTheDocument();
    expect(screen.getByText('Your baby is roughly the size of an')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Atlantic Puffin');
    expect(screen.getByText('Fratercula arctica')).toBeInTheDocument();
    expect(screen.getByText('11.4 in')).toBeInTheDocument();
    expect(screen.getByText('length, head to heel')).toBeInTheDocument();
    expect(screen.getByText('1 lb 1.6 oz')).toBeInTheDocument();
    expect(screen.getByText('weight (17.6 oz)')).toBeInTheDocument();
  });

  it('no longer carries the share button, which now lives on Setup', () => {
    saveLmp('2026-03-29');
    renderToday('2026-09-06');
    expect(
      screen.queryByRole('button', { name: 'Copy a shareable link' }),
    ).not.toBeInTheDocument();
  });

  it('shows the too-early state before week 2', () => {
    saveLmp('2026-09-01');
    renderToday('2026-09-06');
    expect(screen.getByText('Too early for a comparison')).toBeInTheDocument();
    expect(
      screen.getByText(/the first two weeks are before conception/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Your baby is roughly the size of/)).toBeNull();
  });

  it('renders the proposed week 3 row normally', () => {
    saveLmp('2026-08-16'); // 21 days before 2026-09-06 → 3w0d
    renderToday('2026-09-06');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Grain of grit');
    expect(screen.getByText(/proposal, not yet signed off/)).toBeInTheDocument();
  });

  it('clamps past 42 weeks to the Osprey row', () => {
    saveLmp('2026-03-29');
    renderToday('2027-01-24');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('42+ weeks');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Osprey');
    expect(screen.getByText(/Past 42 weeks/)).toBeInTheDocument();
  });

  it('shows the invalid state for a date that has not arrived', () => {
    saveLmp('2026-09-20');
    renderToday('2026-09-06');
    expect(screen.getByText('That date has not arrived yet')).toBeInTheDocument();
  });
});

describe('ComparisonCard', () => {
  function card(
    week: number,
    units: 'imperial' | 'metric' = 'imperial',
    reviewMode = false,
  ) {
    const row = weekRow(week);
    if (!row) throw new Error(`no row for week ${week}`);
    return render(
      <ComparisonCard row={row} units={units} reviewMode={reviewMode} base="/" />,
    );
  }

  it('derives the article and keeps the egg suffix from the row', () => {
    card(10);
    expect(screen.getByText('Your baby is roughly the size of an')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'American Robin egg',
    );
  });

  it('uses "a" where the name starts with a consonant', () => {
    card(22);
    expect(screen.getByText('Your baby is roughly the size of a')).toBeInTheDocument();
  });

  it('converts to metric, rounding cm to one decimal and grams to whole', () => {
    card(23, 'metric');
    expect(screen.getByText('28.9 cm')).toBeInTheDocument();
    expect(screen.getByText('499 g')).toBeInTheDocument();
  });

  it('notes the measurement convention on weeks 20 and 21 only', () => {
    const twenty = card(20);
    expect(screen.getByText(/crown to rump through week 20/)).toBeInTheDocument();
    twenty.unmount();

    const twentyOne = card(21);
    expect(screen.getByText(/crown to rump through week 20/)).toBeInTheDocument();
    twentyOne.unmount();

    card(19);
    expect(screen.queryByText(/crown to rump through week 20/)).toBeNull();
  });

  it('shows the crown-to-rump label before the switch', () => {
    card(20);
    expect(screen.getByText('length, crown to rump')).toBeInTheDocument();
  });

  it('links out to All About Birds for bird and egg rows', () => {
    card(23);
    expect(screen.getByRole('link', { name: /More at All About Birds/ })).toHaveAttribute(
      'href',
      'https://www.allaboutbirds.org/guide/Atlantic_Puffin/overview',
    );
  });

  it('falls back to Wikipedia for seed rows, which have no All About Birds page', () => {
    card(2);
    expect(screen.getByRole('link', { name: /More on Wikipedia/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Poppy_seed',
    );
  });

  it('shows the "Photo coming" silhouette when no asset is curated', () => {
    card(23);
    expect(screen.getByText('Photo coming')).toBeInTheDocument();
  });

  it('says the seed weights are an upper bound', () => {
    card(2);
    expect(screen.getByText('weight, under 0.04 oz')).toBeInTheDocument();
  });
});
