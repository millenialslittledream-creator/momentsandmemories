import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ uploadPremiumImage: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { uploadPremiumImage: mocks.uploadPremiumImage } }));

import {
  hasLocalImages,
  isLocalImageUrl,
  prepareImageFile,
  resolveLocalImages,
  uploadLocalImage,
  IMAGE_UNAVAILABLE_MESSAGE,
} from '@/lib/premiumImages';

describe('isLocalImageUrl / hasLocalImages', () => {
  it('flags browser-only image URLs and nothing else', () => {
    expect(isLocalImageUrl('blob:http://localhost:5173/1234')).toBe(true);
    expect(isLocalImageUrl('  BLOB:https://x/1')).toBe(true);
    expect(isLocalImageUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isLocalImageUrl('https://abc.supabase.co/storage/v1/object/public/premium-site-media/u/1.jpg')).toBe(false);
    expect(isLocalImageUrl('/templates/default.jpg')).toBe(false);
    expect(isLocalImageUrl('data:text/plain;base64,AAAA')).toBe(false);
    expect(isLocalImageUrl(42)).toBe(false);
    expect(isLocalImageUrl(null)).toBe(false);
  });

  it('finds local images anywhere in nested content', () => {
    expect(hasLocalImages({ a: { b: [{ c: 'blob:x' }] } })).toBe(true);
    expect(hasLocalImages({ a: ['https://ok'], b: 'text' })).toBe(false);
  });
});

describe('resolveLocalImages', () => {
  const upload = vi.fn(async (url: string) => `https://cdn.example/${encodeURIComponent(url)}.jpg`);
  beforeEach(() => upload.mockClear());

  it('replaces blob and inline images everywhere and leaves permanent URLs and text alone', async () => {
    const content = {
      couple: 'Ana & Ben',
      hero: 'blob:http://localhost/hero',
      gallery: [{ src: 'blob:http://localhost/g1' }, { src: 'https://cdn.example/already.jpg' }],
      story: { photo: 'data:image/png;base64,iVBOR' },
      count: 3,
      flag: true,
      nothing: null,
    };
    const result = await resolveLocalImages(content, upload, new Map());

    expect(result.couple).toBe('Ana & Ben');
    expect(result.hero).toBe('https://cdn.example/blob%3Ahttp%3A%2F%2Flocalhost%2Fhero.jpg');
    expect(result.gallery[1].src).toBe('https://cdn.example/already.jpg');
    expect(result.story.photo.startsWith('https://cdn.example/')).toBe(true);
    expect(result.count).toBe(3);
    expect(result.nothing).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/blob:|data:image/);
    expect(content.hero).toBe('blob:http://localhost/hero'); // input is not mutated
  });

  it('uploads each distinct picture once, even when used twice or saved repeatedly', async () => {
    const cache = new Map<string, Promise<string>>();
    const content = { a: 'blob:same', b: 'blob:same', c: 'blob:other' };
    await resolveLocalImages(content, upload, cache);
    await resolveLocalImages(content, upload, cache); // e.g. the next autosave
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('does not remember a failed upload, so the next attempt retries', async () => {
    const cache = new Map<string, Promise<string>>();
    const flaky = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce('https://cdn/ok.jpg');
    await expect(resolveLocalImages({ a: 'blob:x' }, flaky, cache)).rejects.toThrow('network');
    await expect(resolveLocalImages({ a: 'blob:x' }, flaky, cache)).resolves.toEqual({ a: 'https://cdn/ok.jpg' });
    expect(flaky).toHaveBeenCalledTimes(2);
  });
});

describe('uploadLocalImage', () => {
  beforeEach(() => {
    mocks.uploadPremiumImage.mockReset();
    vi.restoreAllMocks();
  });

  it('fetches the local picture, uploads it and returns the public URL', async () => {
    const bytes = new Blob(['png-bytes'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(bytes) }));
    mocks.uploadPremiumImage.mockResolvedValue({ public_url: 'https://cdn/premium-site-media/u/1.png', storage_path: 'u/1.png' });

    await expect(uploadLocalImage('blob:http://localhost/1')).resolves.toBe('https://cdn/premium-site-media/u/1.png');
    const sent = mocks.uploadPremiumImage.mock.calls[0][0] as File;
    expect(sent.type).toBe('image/png');
    vi.unstubAllGlobals();
  });

  it('gives a clear message when the browser no longer has the picture', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(uploadLocalImage('blob:http://localhost/revoked')).rejects.toThrow(IMAGE_UNAVAILABLE_MESSAGE);
    expect(mocks.uploadPremiumImage).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('prepareImageFile', () => {
  it('passes small files through untouched', async () => {
    const small = new File([new Uint8Array(1024)], 'a.png', { type: 'image/png' });
    await expect(prepareImageFile(small)).resolves.toBe(small);
  });

  it('refuses a big file that cannot be shrunk instead of sending it to a gateway that would reject it', async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024)], 'huge.gif', { type: 'image/gif' });
    await expect(prepareImageFile(big)).rejects.toThrow('too large');
  });
});
