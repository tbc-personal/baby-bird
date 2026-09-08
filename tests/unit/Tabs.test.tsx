import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from '../../src/components/Tabs';
import { parseHash } from '../../src/lib/router';

function renderTabs(hash: string, hasDate = true) {
  return render(<Tabs route={parseHash(hash)} hasDate={hasDate} />);
}

describe('the bottom tab bar', () => {
  it('has three tabs now that Setup and About are one page', () => {
    renderTabs('#/');
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav.children).toHaveLength(3);
    expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
  });

  it('gives the icon-only Setup tab an accessible name', () => {
    renderTabs('#/');
    const setup = screen.getByRole('link', { name: 'Setup' });
    // The mark itself is decorative; the name has to come from the link.
    expect(setup).toHaveAttribute('href', '#/setup');
    expect(setup.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lights the Setup tab for the old #/about URL', () => {
    renderTabs('#/about');
    expect(screen.getByRole('link', { name: 'Setup' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps Today and Timeline unreachable until a date is saved', () => {
    renderTabs('#/setup', false);
    expect(screen.queryByRole('link', { name: 'Today' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Timeline' })).toBeNull();
    // Still named, still visible, just not focusable.
    expect(screen.getByText('Today')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Setup' })).toBeInTheDocument();
  });
});
