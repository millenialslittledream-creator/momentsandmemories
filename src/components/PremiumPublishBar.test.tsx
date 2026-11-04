import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  createPremiumSite: vi.fn(),
  updatePremiumSite: vi.fn(),
  uploadLocalImage: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: { createPremiumSite: mocks.createPremiumSite, updatePremiumSite: mocks.updatePremiumSite },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), info: vi.fn(), error: mocks.toastError }),
}));
vi.mock('@/lib/premiumImages', async () => {
  const actual = await vi.importActual<typeof import('@/lib/premiumImages')>('@/lib/premiumImages');
  return { ...actual, uploadLocalImage: mocks.uploadLocalImage };
});

import PremiumPublishBar from '@/components/PremiumPublishBar';

const content = {
  couple: 'Ana & Ben',
  hero: 'blob:http://localhost:5173/hero-photo',
  gallery: [{ src: 'blob:http://localhost:5173/g1' }, { src: 'https://cdn.example/default.jpg' }],
};

function renderBar(props: Partial<React.ComponentProps<typeof PremiumPublishBar>> = {}) {
  return render(
    <PremiumPublishBar eventKey="marriage" designId="d1" themeId="t1" content={content} slugSeed="ana-ben" {...props} />,
  );
}

describe('PremiumPublishBar image handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createPremiumSite.mockResolvedValue({ id: 's1', slug: 'ana-ben', published: true });
    mocks.uploadLocalImage.mockImplementation(async (url: string) => `https://cdn.example/uploaded/${url.split('/').pop()}.jpg`);
  });

  it('uploads device pictures first and publishes only permanent URLs, so shared links show the images', async () => {
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: /publish & share/i }));

    await waitFor(() => expect(mocks.createPremiumSite).toHaveBeenCalledTimes(1));
    const sent = mocks.createPremiumSite.mock.calls[0][0];
    expect(sent.content.hero).toBe('https://cdn.example/uploaded/hero-photo.jpg');
    expect(sent.content.gallery[0].src).toBe('https://cdn.example/uploaded/g1.jpg');
    expect(sent.content.gallery[1].src).toBe('https://cdn.example/default.jpg');
    expect(JSON.stringify(sent.content)).not.toContain('blob:');
    expect(mocks.uploadLocalImage).toHaveBeenCalledTimes(2);
  });

  it('does not publish a link with missing images when an upload fails', async () => {
    mocks.uploadLocalImage.mockRejectedValue(new Error('One of your images is no longer available. Please add it again.'));
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: /publish & share/i }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('no longer available')));
    expect(mocks.createPremiumSite).not.toHaveBeenCalled();
  });

  it('publishes straight away when there is nothing to upload', async () => {
    renderBar({ content: { couple: 'Ana & Ben', hero: 'https://cdn.example/hero.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: /publish & share/i }));

    await waitFor(() => expect(mocks.createPremiumSite).toHaveBeenCalledTimes(1));
    expect(mocks.uploadLocalImage).not.toHaveBeenCalled();
  });
});
