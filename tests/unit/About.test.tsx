import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupScreen } from '../../src/screens/Setup';
import { AppStateProvider } from '../../src/state';
import { parseSavedState, STORAGE_KEY } from '../../src/lib/storage';
import { SKIN_LIST } from '../../src/skins';

function save() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-03-29' }),
  );
}

/**
 * About is no longer a screen: it is the lower half of Setup. These cases still
 * live in their own file because what they cover — settings, credits, "Forget
 * my data" — is a distinct concern from the date form above it.
 */
function renderAbout() {
  return render(
    <AppStateProvider>
      <SetupScreen today={new Date(2026, 8, 6)} shared={null} />
    </AppStateProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('About, as the lower half of Setup', () => {
  it('offers every skin', () => {
    save();
    renderAbout();
    for (const skin of SKIN_LIST) {
      expect(
        screen.getByRole('radio', { name: new RegExp(skin.label) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: /Puffin/ })).toBeChecked();
  });

  it('persists a skin choice', async () => {
    const user = userEvent.setup();
    save();
    renderAbout();
    await user.click(screen.getByRole('radio', { name: /Green Heron/ }));
    expect(parseSavedState(window.localStorage.getItem(STORAGE_KEY))?.settings.skin).toBe(
      'heron',
    );
  });

  it('toggles units and persists the choice', async () => {
    const user = userEvent.setup();
    save();
    renderAbout();

    const imperial = screen.getByRole('button', { name: 'in / oz' });
    const metric = screen.getByRole('button', { name: 'cm / g' });
    expect(imperial).toHaveAttribute('aria-pressed', 'true');

    await user.click(metric);
    expect(metric).toHaveAttribute('aria-pressed', 'true');
    expect(imperial).toHaveAttribute('aria-pressed', 'false');
    expect(parseSavedState(window.localStorage.getItem(STORAGE_KEY))?.settings.units).toBe(
      'metric',
    );
  });

  it('toggles the labor panel and persists the choice', async () => {
    const user = userEvent.setup();
    save();
    renderAbout();
    const toggle = screen.getByRole('checkbox', {
      name: /Show the labor chances panel from 34 weeks/,
    });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(
      parseSavedState(window.localStorage.getItem(STORAGE_KEY))?.settings.laborPanelEnabled,
    ).toBe(false);
  });

  it('carries the required statements', () => {
    save();
    renderAbout();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
    expect(screen.getByText(/no ads and no paid tier/)).toBeInTheDocument();
    expect(screen.getByText(/must not be used commercially/)).toBeInTheDocument();
    expect(screen.getByText(/stored on this device only/)).toBeInTheDocument();
    expect(screen.getByText(/no accounts, no analytics/)).toBeInTheDocument();
    // ADR-005: the miscarriage panel is deferred, and says so.
    expect(screen.getByText(/coming later/)).toBeInTheDocument();
  });

  it('credits every source the project uses', () => {
    save();
    renderAbout();
    expect(screen.getByRole('link', { name: 'Macaulay Library' })).toBeInTheDocument();
    expect(screen.getByText(/Wikimedia Commons contributors/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Datayze' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jukic et al. 2013' })).toBeInTheDocument();
    expect(screen.getByText(/Smith 2001/)).toBeInTheDocument();
    expect(screen.getByText(/CDC\/NCHS preterm share/)).toBeInTheDocument();
    expect(screen.getByText(/original text written for this app/)).toBeInTheDocument();
  });

  it('asks before forgetting, then clears storage', async () => {
    const user = userEvent.setup();
    save();
    renderAbout();

    await user.click(screen.getByRole('button', { name: 'Forget my data' }));
    expect(screen.getByText('Forget your saved date and settings?')).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Forget my data' }));
    await user.click(screen.getByRole('button', { name: 'Forget it' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('disables the forget button when there is nothing saved', () => {
    renderAbout();
    expect(screen.getByRole('button', { name: 'Forget my data' })).toBeDisabled();
  });
});
