import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  storageFrom: vi.fn(),
  storageUpload: vi.fn(),
  storageRemove: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    storage: { from: mocks.storageFrom },
  },
}));

import { api } from '@/lib/api';

describe('media upload transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getSession.mockReset();
    mocks.storageFrom.mockReset();
    mocks.storageUpload.mockReset();
    mocks.storageRemove.mockReset();
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 'user-large-upload' },
        },
      },
    });
    mocks.storageUpload.mockResolvedValue({ data: { path: 'stored' }, error: null });
    mocks.storageRemove.mockResolvedValue({ data: null, error: null });
    mocks.storageFrom.mockReturnValue({
      upload: mocks.storageUpload,
      remove: mocks.storageRemove,
    });
  });

  it('keeps small files on the multipart backend endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'media-small', public_url: '/small.png', kind: 'image',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const file = new File([new Uint8Array(1024)], 'small.png', { type: 'image/png' });

    await api.uploadMedia(file);

    expect(mocks.storageUpload).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/media\/upload$/),
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
  });

  it('bypasses Vercel body limits for large files and registers the stored object', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'media-large', public_url: 'https://storage.example/large.png', kind: 'image',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });

    const result = await api.uploadMedia(file);

    expect(result.id).toBe('media-large');
    expect(mocks.storageFrom).toHaveBeenCalledWith('user-uploads');
    expect(mocks.storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-large-upload\/[0-9a-f-]+\.png$/),
      file,
      { contentType: 'image/png', upsert: false },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/media\/register$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('removes a direct upload when backend verification fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ detail: 'Unsupported file type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }));
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });

    await expect(api.uploadMedia(file)).rejects.toThrow('Unsupported file type');
    expect(mocks.storageRemove).toHaveBeenCalledOnce();
  });
});
