import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonCard } from '../../src/components/ComparisonCard';
import { weekRow } from '../../src/data/comparisons';

function renderCard(week: number) {
  const row = weekRow(week);
  if (!row) throw new Error(`no comparison row for week ${week}`);
  return render(<ComparisonCard row={row} units="imperial" reviewMode={false} base="/" />);
}

describe('ComparisonCard', () => {
  it('does not repeat the week number the screen header already shows', () => {
    renderCard(23);
    expect(screen.queryByText('Week 23')).toBeNull();
  });

  it('opens the length chart from the length inset', async () => {
    const user = userEvent.setup();
    renderCard(23);

    await user.click(screen.getByRole('button', { name: /length, head to heel/ }));

    const dialog = screen.getByRole('dialog', { name: 'Length by week' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: /^Length from week 2/ })).toBeInTheDocument();
  });

  it('opens the weight chart from the weight inset', async () => {
    const user = userEvent.setup();
    renderCard(23);

    await user.click(screen.getByRole('button', { name: /weight/ }));

    const dialog = screen.getByRole('dialog', { name: 'Weight by week' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: /^Weight from week 2/ })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the inset that opened it', async () => {
    const user = userEvent.setup();
    renderCard(23);

    const trigger = screen.getByRole('button', { name: /weight/ });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes on the close button', async () => {
    const user = userEvent.setup();
    renderCard(23);

    await user.click(screen.getByRole('button', { name: /length/ }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('marks the current week on the chart', async () => {
    const user = userEvent.setup();
    renderCard(23);

    await user.click(screen.getByRole('button', { name: /weight/ }));

    expect(
      screen.getByRole('img', { name: /This week, week 23, is 1 lb 1\.6 oz/ }),
    ).toBeInTheDocument();
  });

  it('marks the crown-rump / head-to-heel discontinuity on the length chart', async () => {
    const user = userEvent.setup();
    renderCard(21);

    await user.click(screen.getByRole('button', { name: /length, head to heel/ }));

    expect(
      screen.getByRole('img', {
        name: /line breaks between week 20 and week 21.*change of ruler, not growth/s,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ruler changes at week 20: crown to rump, then head to heel/),
    ).toBeInTheDocument();
  });

  it('does not mention a break on the weight chart', async () => {
    const user = userEvent.setup();
    renderCard(21);

    await user.click(screen.getByRole('button', { name: /weight/ }));

    const description = screen.getByRole('img').getAttribute('aria-label');
    expect(description).not.toMatch(/break/);
  });
});
