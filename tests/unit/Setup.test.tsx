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
    await user.type(screen.getByLabelText('First day of last period'), '2026-03-29');

    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('January 3, 2027')).toBeInTheDocument();
    expect(screen.getByText('Today you are')).toBeInTheDocument();
    expect(screen.getByText('23 weeks, 0 days')).toBeInTheDocument();
  });

  it('asks for cycle length in LMP mode only', async () => {
    const user = userEvent.setup();
    renderSetup();
    expect(screen.getByLabelText('Typical cycle length')).toHaveValue(28);

    await user.selectOptions(screen.getByLabelText('Count from'), 'conception');
    expect(screen.queryByLabelText('Typical cycle length')).toBeNull();

    await user.selectOptions(screen.getByLabelText('Count from'), 'dueDate');
    expect(screen.queryByLabelText('Typical cycle length')).toBeNull();
  });

  it('moves the due date by the cycle correction', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText('First day of last period'), '2026-03-29');
    expect(screen.getByText('January 3, 2027')).toBeInTheDocument();

    const cycle = screen.getByLabelText('Typical cycle length');
    await user.clear(cycle);
    await user.type(cycle, '35');
    // 35 − 28 = seven days later than plain Naegele.
    expect(screen.getByText('January 10, 2027')).toBeInTheDocument();
  });

  it('says cycle length is not period duration', () => {
    renderSetup();
    expect(screen.getByText(/not how long\s+the bleeding lasts/)).toBeInTheDocument();
  });

  it('keeps the privacy copy out of the date form, not off the page', () => {
    // Mockup 1 kept privacy copy off the date entry (ADR-006). Now that About
    // is the lower half of this page the copy is present, but it must still sit
    // below the form rather than inside it.
    const { container } = renderSetup();
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    expect(form?.textContent ?? '').not.toMatch(/privacy|your data|on your device/i);
    expect(screen.getByText(/stored on this device only/)).toBeInTheDocument();
  });

  it('hides the calculation details until the info button is pressed', async () => {
    const user = userEvent.setup();
    renderSetup();
    const info = screen.getByRole('button', { name: 'How each method is calculated' });

    expect(info).toHaveAttribute('aria-expanded', 'false');
    // jsdom does not apply stylesheets, so this can only check the attribute.
    // Whether the panel actually disappears is asserted in the e2e smoke spec.
    const panel = document.getElementById(info.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveAttribute('hidden');

    await user.click(info);
    expect(info).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(screen.getByText('due = date + 280 d + (cycle − 28)')).toBeVisible();
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
    await user.type(screen.getByLabelText('First day of last period'), '2026-03-29');
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
    const button = screen.getByRole('button', { name: 'Show me my nestling' });
    const date = screen.getByLabelText('First day of last period');

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
    await user.type(screen.getByLabelText('First day of last period'), '2026-03-29');
    await user.click(screen.getByRole('button', { name: 'Show me my nestling' }));

    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(stored).toMatchObject({
      version: 2,
      method: 'lmp',
      cycleLength: 28,
      inputDate: '2026-03-29',
    });
  });
});

describe('a shared link (ADR-006)', () => {
  it('pre-fills setup when there is nothing saved', () => {
    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });
    expect(screen.getByLabelText('First day of last period')).toHaveValue('2026-03-29');
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
    expect(screen.getByRole('button', { name: 'Show me my nestling' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('First day of last period')).toHaveValue('2026-01-05');
  });

  it('takes the shared date when asked to replace', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-01-05' }),
    );

    renderSetup({ method: 'lmp', inputDate: '2026-03-29' });
    await user.click(screen.getByRole('button', { name: 'Use the shared date' }));
    expect(screen.getByLabelText('First day of last period')).toHaveValue('2026-03-29');
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
