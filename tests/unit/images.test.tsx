import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MacaulayEmbed, PhotoComing } from '../../src/components/MacaulayEmbed';
import {
  EMBED_TIMEOUT_MS,
  MACAULAY_EMBED_TEMPLATE,
  macaulayAssetUrl,
  macaulayEmbedUrl,
} from '../../src/components/macaulay';
import { CommonsImage } from '../../src/components/CommonsImage';
import { ImageCredit } from '../../src/components/ImageCredit';
import { OfflineGoose } from '../../src/components/OfflineGoose';
import { Silhouette } from '../../src/components/Silhouette';

/** jsdom has no IntersectionObserver; this one fires immediately. */
class ImmediateObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** One that never fires, to prove the frame is not created until it is seen. */
class NeverObserver extends ImmediateObserver {
  override observe(): void {}
}

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => online,
  });
}

beforeEach(() => {
  setOnline(true);
  vi.stubGlobal('IntersectionObserver', ImmediateObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('embed URL construction (ADR-003)', () => {
  it('builds every URL from the single template constant', () => {
    expect(MACAULAY_EMBED_TEMPLATE).toContain('{id}');
    expect(macaulayEmbedUrl('633445471')).toBe(
      'https://macaulaylibrary.org/asset/633445471/embed',
    );
    expect(macaulayAssetUrl('633445471')).toBe(
      'https://macaulaylibrary.org/asset/633445471',
    );
  });

  it('escapes anything unexpected in the id', () => {
    expect(macaulayEmbedUrl('1 2/3')).toBe(
      'https://macaulaylibrary.org/asset/1%202%2F3/embed',
    );
  });
});

describe('MacaulayEmbed', () => {
  it('renders an iframe once the card is in view', async () => {
    render(<MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />);
    const frame = await screen.findByTitle('A puffin');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', 'https://macaulaylibrary.org/asset/123/embed');
    expect(frame).toHaveAttribute('loading', 'lazy');
  });

  it('does not create the iframe until the card is near the viewport', () => {
    vi.stubGlobal('IntersectionObserver', NeverObserver);
    render(<MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />);
    expect(screen.queryByTitle('A puffin')).toBeNull();
  });

  it('shows the goose, not the silhouette, when offline', () => {
    setOnline(false);
    render(<MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />);
    expect(screen.getByText('Photo needs a connection')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /goose wearing a hat/ })).toBeInTheDocument();
    expect(screen.queryByTitle('A puffin')).toBeNull();
  });

  it('shows the goose when the frame has not loaded within the timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />);
    expect(await screen.findByTitle('A puffin')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(EMBED_TIMEOUT_MS + 10);
    });

    await waitFor(() => {
      expect(screen.getByText('Photo needs a connection')).toBeInTheDocument();
    });
    expect(screen.queryByTitle('A puffin')).toBeNull();
  });

  it('the timeout is the 6 seconds ADR-003 specifies', () => {
    expect(EMBED_TIMEOUT_MS).toBe(6000);
  });

  /*
   * The component also has an `onError` handler on the frame, which is not
   * asserted here: React's `onError` for an <iframe> does not fire under jsdom,
   * so a test for it would pass or fail for reasons unrelated to the app. The
   * six-second timeout above is the guarantee that actually matters, since a
   * cross-origin frame that is blocked or slow usually fires neither load nor
   * error. ADR-003's Playwright check (one real embed reaching `load`) is the
   * place to cover the browser behavior.
   */

  it('goes back to the frame when the connection returns', async () => {
    setOnline(false);
    const { rerender } = render(
      <MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />,
    );
    expect(screen.getByText('Photo needs a connection')).toBeInTheDocument();

    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    rerender(<MacaulayEmbed assetId="123" kind="bird" altText="A puffin" />);
    await waitFor(() => {
      expect(screen.getByTitle('A puffin')).toBeInTheDocument();
    });
  });
});

describe('placeholders are distinct (ADR-003)', () => {
  it('an uncurated row shows "Photo coming" with the kind silhouette', () => {
    render(<PhotoComing kind="egg" />);
    expect(screen.getByText('Photo coming')).toBeInTheDocument();
    expect(screen.queryByText('Photo needs a connection')).toBeNull();
    expect(screen.queryByRole('img', { name: /goose/ })).toBeNull();
  });
});

describe('OfflineGoose', () => {
  it('keeps the hat and the no-wifi symbol, in currentColor, under 40 commands', () => {
    const { container } = render(<OfflineGoose />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('aria-label', expect.stringContaining('hat'));
    expect(svg?.getAttribute('aria-label')).toMatch(/wifi/i);

    // Count path commands across every <path d="...">.
    const commands = [...container.querySelectorAll('path')]
      .map((path) => path.getAttribute('d') ?? '')
      .join(' ')
      .match(/[a-zA-Z]/g);
    expect(commands?.length ?? 0).toBeLessThan(40);
    expect(commands?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('Silhouette', () => {
  it.each(['seed', 'egg', 'bird'] as const)('draws a %s in currentColor', (kind) => {
    const { container } = render(<Silhouette kind={kind} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg?.querySelectorAll('path, circle').length).toBeGreaterThan(0);
  });

  it('is hidden from the accessibility tree unless given a title', () => {
    const { container, rerender } = render(<Silhouette kind="bird" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Silhouette kind="bird" title="A bird" />);
    expect(screen.getByRole('img', { name: 'A bird' })).toBeInTheDocument();
  });
});

describe('CommonsImage and credits', () => {
  const commons = {
    provider: 'commons' as const,
    mlAssetId: null,
    fallbackMlAssetId: null,
    embedUrl: null,
    credit: null,
    altText: 'A pile of poppy seeds',
    file: 'images/seeds/poppy.jpg',
    author: 'A. Photographer',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Poppy.jpg',
  };

  it('renders a local file under the configured base path', () => {
    render(<CommonsImage image={commons} base="/nestling/" />);
    const img = screen.getByRole('img', { name: 'A pile of poppy seeds' });
    expect(img).toHaveAttribute('src', '/nestling/images/seeds/poppy.jpg');
  });

  it('credits the author, the license by name with a link, and the source', () => {
    render(<ImageCredit image={commons} />);
    expect(screen.getByText(/A\. Photographer/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      commons.licenseUrl,
    );
    expect(screen.getByRole('link', { name: 'Wikimedia Commons' })).toHaveAttribute(
      'href',
      commons.sourceUrl,
    );
  });

  it('credits a Macaulay asset with photographer, library and ML number', () => {
    render(
      <ImageCredit
        image={{
          provider: 'macaulay',
          mlAssetId: '633445471',
          fallbackMlAssetId: null,
          embedUrl: null,
          credit: 'R. Photographer',
          altText: null,
          file: null,
          author: null,
          license: null,
          licenseUrl: null,
          sourceUrl: null,
        }}
      />,
    );
    expect(screen.getByText(/R\. Photographer/)).toBeInTheDocument();
    expect(screen.getByText(/Macaulay Library at the Cornell Lab/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ML633445471' })).toBeInTheDocument();
  });

  it('renders nothing when there is no image', () => {
    const { container } = render(<ImageCredit image={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
