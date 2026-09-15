import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoComing, PhotoFrame } from '../../src/components/PhotoFrame';
import { CommonsImage } from '../../src/components/CommonsImage';
import { ImageCredit } from '../../src/components/ImageCredit';
import { Silhouette } from '../../src/components/Silhouette';

describe('PhotoFrame', () => {
  it('renders a corner tag when given one', () => {
    render(
      <PhotoFrame tag="Loading photo">
        <span>content</span>
      </PhotoFrame>,
    );
    expect(screen.getByText('Loading photo')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders no tag when given null', () => {
    render(
      <PhotoFrame tag={null}>
        <span>content</span>
      </PhotoFrame>,
    );
    expect(screen.queryByText('Loading photo')).toBeNull();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders the credit alongside the children', () => {
    render(
      <PhotoFrame tag={null} credit={<span>credit here</span>}>
        <span>content</span>
      </PhotoFrame>,
    );
    expect(screen.getByText('credit here')).toBeInTheDocument();
  });
});

describe('placeholders are distinct (ADR-003)', () => {
  it('an uncurated row shows "Photo coming" with the kind silhouette', () => {
    render(<PhotoComing kind="egg" />);
    expect(screen.getByText('Photo coming')).toBeInTheDocument();
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
    objectPosition: null,
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

  it('crops from the centre when no objectPosition is curated', () => {
    render(<CommonsImage image={commons} base="/" />);
    expect(screen.getByRole('img', { name: 'A pile of poppy seeds' })).not.toHaveStyle({
      objectPosition: 'center 30%',
    });
  });

  it('crops from the curated objectPosition when one is set', () => {
    // The card is a wide, short strip, so a bird high in its frame loses its
    // head to a centred crop. This is the escape hatch for that.
    render(<CommonsImage image={{ ...commons, objectPosition: 'center 30%' }} base="/" />);
    expect(screen.getByRole('img', { name: 'A pile of poppy seeds' })).toHaveStyle({
      objectPosition: 'center 30%',
    });
  });

  it('credits the author, the license by name with a link, and the source', async () => {
    const user = userEvent.setup();
    render(<ImageCredit image={commons} />);

    // The credit is disclosed, not omitted: hidden until the corner "i" is
    // pressed, but always reachable, which is what CC BY attribution needs.
    expect(screen.getByText(/A\. Photographer/)).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show photo credit' }));

    expect(screen.getByText(/A\. Photographer/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      commons.licenseUrl,
    );
    expect(screen.getByRole('link', { name: 'Wikimedia Commons' })).toHaveAttribute(
      'href',
      commons.sourceUrl,
    );
  });

  it('keeps the credit button on the photo even before it is opened', () => {
    render(<ImageCredit image={commons} />);
    const button = screen.getByRole('button', { name: 'Show photo credit' });
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders nothing when there is no image', () => {
    const { container } = render(<ImageCredit image={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
