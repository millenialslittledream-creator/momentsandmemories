import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

import { api } from '@/lib/api';

const smallPhoto = () => new File([new Uint8Array(200_000)], 'p.jpg', { type: 'image/jpeg' });

describe('guest gallery upload', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('sends a normal photo as-is to the public gallery endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'photo-1' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.uploadGalleryPhoto('evt-1', smallPhoto(), 'Jamie')).resolves.toEqual({ id: 'photo-1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/public\/events\/evt-1\/gallery$/);
    expect((init.body as FormData).get('uploaded_by_name')).toBe('Jamie');
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('never sends a photo that Vercel would reject (over ~4.5 MB) and cannot be shrunk', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const huge = new File([new Uint8Array(6 * 1024 * 1024)], 'big.gif', { type: 'image/gif' });

    await expect(api.uploadGalleryPhoto('evt-1', huge, 'Jamie')).rejects.toThrow('too large');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a readable message when the gateway rejects with a non-JSON body (413/429)', async () => {
    const plain = (status: number) => ({ ok: false, status, json: () => Promise.reject(new SyntaxError('not json')) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(plain(413)).mockResolvedValueOnce(plain(429)).mockResolvedValueOnce(plain(502)));

    await expect(api.uploadGalleryPhoto('e', smallPhoto(), 'J')).rejects.toThrow('too large');
    await expect(api.uploadGalleryPhoto('e', smallPhoto(), 'J')).rejects.toThrow('Too many uploads');
    await expect(api.uploadGalleryPhoto('e', smallPhoto(), 'J')).rejects.toThrow('Upload failed. Please try again.');
  });

  it('passes through the server message for ordinary rejections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: () => Promise.resolve({ detail: 'Only JPEG, PNG, GIF or WebP images can be shared to the gallery' }),
    }));
    await expect(api.uploadGalleryPhoto('e', smallPhoto(), 'J')).rejects.toThrow('Only JPEG');
  });
});
