import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FactList } from '../../src/components/FactList';
import { isReviewMode } from '../../src/lib/storage';
import { COMPARISON_WEEKS } from '../../src/data/comparisons';

describe('every comparison week carries facts that follow ADR-004', () => {
  it.each(COMPARISON_WEEKS.map((row) => [row.week, row] as const))(
    'week %i',
    (_week, row) => {
      expect(row.facts.length).toBeGreaterThanOrEqual(2);
      expect(row.facts.length).toBeLessThanOrEqual(3);
      for (const fact of row.facts) {
        expect(fact.text.length).toBeLessThanOrEqual(160);
        expect(fact.text).not.toContain('!');
        expect(fact.text.trim()).toBe(fact.text);
        expect(fact.sources.length).toBeGreaterThanOrEqual(1);
        for (const source of fact.sources) {
          expect(source).toMatch(/^https:\/\//);
        }
      }
    },
  );

  it('leaves every fact flagged for the author to review', () => {
    const all = COMPARISON_WEEKS.flatMap((row) => row.facts);
    expect(all).toHaveLength(123);
    expect(all.every((fact) => fact.reviewed === false)).toBe(true);
  });

  it('has no duplicate sentences across the whole table', () => {
    const all = COMPARISON_WEEKS.flatMap((row) => row.facts.map((f) => f.text));
    expect(new Set(all).size).toBe(all.length);
  });

  it('gives every seed week a fact about the birds that eat it (ADR-004)', () => {
    const seeds = COMPARISON_WEEKS.filter((row) => row.kind === 'seed' && row.week !== 3);
    expect(seeds.length).toBeGreaterThan(0);
    for (const row of seeds) {
      const mentionsBirds = row.facts.some((fact) =>
        /finch|siskin|dove|junco|sparrow|chickadee|bird/i.test(fact.text),
      );
      expect(mentionsBirds, `week ${row.week}`).toBe(true);
    }
  });

  it('gives week 3 a fact about gizzard grit', () => {
    const week3 = COMPARISON_WEEKS.find((row) => row.week === 3);
    expect(week3?.facts.some((fact) => /gizzard|grit/i.test(fact.text))).toBe(true);
  });
});

describe('the draft chip (ADR-004)', () => {
  const facts = [
    { text: 'An unreviewed sentence.', sources: ['https://example.com'], reviewed: false },
    { text: 'A reviewed sentence.', sources: ['https://example.com'], reviewed: true },
  ];

  it('shows only on unreviewed facts, and only in review mode', () => {
    const { rerender } = render(<FactList facts={facts} reviewMode />);
    expect(screen.getAllByText('draft')).toHaveLength(1);
    expect(screen.getByText('An unreviewed sentence.')).toBeInTheDocument();

    rerender(<FactList facts={facts} reviewMode={false} />);
    expect(screen.queryByText('draft')).toBeNull();
    // The facts themselves still render outside review mode.
    expect(screen.getByText('A reviewed sentence.')).toBeInTheDocument();
  });

  it('renders nothing when a week has no facts', () => {
    const { container } = render(<FactList facts={[]} reviewMode />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('review mode is on in dev and behind ?review=1 in production', () => {
  it.each([
    ['https://x.dev/nestling/', false, false],
    ['https://x.dev/nestling/', true, true],
    ['https://x.dev/nestling/?review=1', false, true],
    ['https://x.dev/nestling/#/week/23?review=1', false, true],
    ['https://x.dev/nestling/?review=2', false, false],
  ] as const)('%s dev=%s → %s', (url, dev, expected) => {
    expect(isReviewMode(url, dev)).toBe(expected);
  });
});
