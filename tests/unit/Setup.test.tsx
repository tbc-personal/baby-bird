import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupScreen } from '../../src/screens/Setup';
import { AppStateProvider } from '../../src/state';
import { STORAGE_KEY } from '../../src/lib/storage';
import { parseIsoDate } from '../../src/lib/gestation';

function day(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad fixture date: ${iso}`);
  return parsed;
}

function renderSetup(shared: Parameters<typeof SetupScreen>[0]['shared'] = null) {
  return render(
    <AppStateProvider>
      <SetupScreen today={day('2026-09-06')} shared={shared} />
    </AppStateProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
});

describe('Setup screen (mockup 1)', () => {
  it('offers the three dating methods', () => {
    renderSetup();
    const select = screen.getByLabelText('Count from');
    const options = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual([
      'Last menstrual period',
      'Conception date',
      'Enter my due date',
    ]);
  });

  it('shows the due date and progress live, on separate lines', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText('Date of last period'), '2026-03-29');

    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('January 3, 2027')).toBeInTheDocument();
    expect(screen.getByText('Today you are')).toBeInTheDocument();
    expect(screen.getByText('23 weeks, 0 days')).toBeInTheDocument();
  });

  it('carries no privacy copy', () => {
    renderSetup();
    expect(screen.queryByText(/privacy|your data|on your device/i)).toBeNull();
  });

  it('hides the calculation details until the info button is pressed', async () => {
    const user = userEvent.setup();
    renderSetup();
    const info = screen.getByRole('button', { name: 'How each method is calculated' });

    expect(info).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(info.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveAttribute('hidden');

    await user.click(info);
    expect(info).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(screen.getByText('due = date + 280 d')).toBeVisible();
    expect(screen.getByText('due = date + 266 d')).toBeVisible();
    expect(screen.getByText('as given')).toBeVisible();
  });

  it('closes the details on Escape and on an outside click', async () => {
    const user = userEvent.setup();
    renderSetup();
    const info = screen.getByRole('button', { name: 'How each method is calculated' });

    await user.click(info);
    await user.keyboard('{Escape}');
    expect(info).toHaveAttribute('aria-expanded', 'false');

    await user.click(info);
    expect(info).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByText(/size, week by week/));
    expect(info).toHaveAttribute('aria-expanded', 'false');
  });

  it('relabels the date field and derives the period date in due-date mode', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText('Date of last period'), '2026-03-29');
    await user.selectOptions(screen.getByLabelText('Count from'), 'dueDate');

    // The stored date converts with the method, so the same pregnancy stays selected.
    expect(screen.getByLabelText('Due date')).toHaveValue('2027-01-03');
    expect(screen.getByText('Counting from')).toBeInTheDocument();
    expect(screen.getByText('March 29, 2026')).toBeInTheDocument();
    expect(screen.getByText('23 weeks, 0 days')).toBeInTheDocument();
  });

  it('blocks the button on an empty, future, or too-old date', async () => {
    const user = userEvent.setup();
    renderSetup();
    const button = screen.getByRole('button', { name: 'Start counting' });
    const date = screen.getByLabelText('Date of last period');

    expect(button).toBeDisabled();

    await user.type(date, '2026-09-07');
    expect(button).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('That date is in the future.');

    await user.clear(date);
    await user.type(date, '2025-11-09');
    expect(button).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('more than 300 days ago');

    await user.clear(date);
    await user.type(date, '2026-03-29');
    expect(button).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('saves the date to storage on submit', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText('Date of last period'), '2026-03-29');
    await user.click(screen.getByRole('button', { name: 'Start counting' }));

    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(stored).toMatchObject({ version: 1, method: 'lmp', inputDate: '2026-03-29' });
  });
});

describe('a shared link (ADR-006)', () => {
  it('pre-fills setup when there is nothing saved', () => {
    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });
    expect(screen.getByLabelText('Date of last period')).toHaveValue('2026-03-29');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before overwriting a different saved date', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-01-05' }),
    );

    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });

    const sheet = screen.getByRole('dialog');
    expect(sheet).toHaveTextContent('Replace your saved date with the shared one?');
    // The button is blocked while the question stands.
    expect(screen.getByRole('button', { name: 'Start counting' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Date of last period')).toHaveValue('2026-01-05');
  });

  it('takes the shared date when asked to replace', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-01-05' }),
    );

    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });
    await user.click(screen.getByRole('button', { name: 'Use the shared date' }));
    expect(screen.getByLabelText('Date of last period')).toHaveValue('2026-03-29');
  });

  it('does not ask when the shared date matches what is saved', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-03-29' }),
    );
    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
