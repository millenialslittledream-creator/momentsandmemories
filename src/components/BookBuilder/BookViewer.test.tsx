import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BookViewer, { type BookPage } from './BookViewer';

describe('BookViewer', () => {
  it('shows the empty state when there are no pages', () => {
    const { getByText } = render(<BookViewer pages={[]} />);
    expect(getByText('No pages yet')).toBeInTheDocument();
  });

  it('renders a page with no frame field as a plain image with no overlay', () => {
    const pages: BookPage[] = [{ id: 'p1', image_url: '/photo.jpg' }];
    const { container } = render(<BookViewer pages={pages} />);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders a hairline frame overlay alongside the image when frame is set', () => {
    const pages: BookPage[] = [{ id: 'p1', image_url: '/photo.jpg', frame: 'sage-hairline' }];
    const { container } = render(<BookViewer pages={pages} />);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('.pointer-events-none')).not.toBeNull();
  });

  it('renders the botanical corner frame as SVG accents', () => {
    const pages: BookPage[] = [{ id: 'p1', image_url: '/photo.jpg', frame: 'botanical-corner' }];
    const { container } = render(<BookViewer pages={pages} />);
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('falls back to no overlay for an unknown/invalid frame id', () => {
    const pages: BookPage[] = [{ id: 'p1', image_url: '/photo.jpg', frame: 'does-not-exist' }];
    const { container } = render(<BookViewer pages={pages} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('.pointer-events-none')).toBeNull();
  });
});
