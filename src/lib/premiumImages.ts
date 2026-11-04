import { api } from '@/lib/api';

/**
 * Premium design editors let people pick pictures from their device. Until a picture is
 * uploaded it is only a browser-local `blob:` URL (or an inline `data:` image) that exists in
 * the author's tab, so a shared link would show broken images to everyone else. These helpers
 * upload such images to the `premium-site-media` Supabase bucket and swap in the permanent
 * public URL before a site is saved or published.
 */

// Vercel's gateway rejects request bodies above ~4.5 MB, so larger photos are shrunk first.
const MAX_DIRECT_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const JPEG_QUALITIES = [0.86, 0.72, 0.6];

export const IMAGE_UNAVAILABLE_MESSAGE = 'One of your images is no longer available. Please add it again.';

export function isLocalImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^blob:/i.test(trimmed) || /^data:image\//i.test(trimmed);
}

export function hasLocalImages(value: unknown): boolean {
  if (isLocalImageUrl(value)) return true;
  if (Array.isArray(value)) return value.some(hasLocalImages);
  if (value && typeof value === 'object') return Object.values(value).some(hasLocalImages);
  return false;
}

export type ImageUploader = (localUrl: string) => Promise<string>;

/**
 * Returns a copy of `content` with every local image replaced by the URL `upload` returns.
 * `cache` makes each distinct local URL upload once, even across repeated autosaves.
 */
export async function resolveLocalImages<T>(
  content: T,
  upload: ImageUploader,
  cache: Map<string, Promise<string>>,
): Promise<T> {
  const walk = async (value: unknown): Promise<unknown> => {
    if (isLocalImageUrl(value)) {
      let pending = cache.get(value);
      if (!pending) {
        pending = upload(value);
        cache.set(value, pending);
        // A failed upload must not be remembered, so the next attempt can retry.
        pending.catch(() => cache.delete(value));
      }
      return pending;
    }
    if (Array.isArray(value)) return Promise.all(value.map(walk));
    if (value && typeof value === 'object') {
      const entries = await Promise.all(
        Object.entries(value).map(async ([key, inner]) => [key, await walk(inner)] as const),
      );
      return Object.fromEntries(entries);
    }
    return value;
  };
  return (await walk(content)) as T;
}

async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the image for upload.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  for (const quality of JPEG_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_DIRECT_BYTES) {
      return new File([blob], 'image.jpg', { type: 'image/jpeg' });
    }
  }
  throw new Error('This image is too large. Please choose a smaller one.');
}

export async function prepareImageFile(file: File): Promise<File> {
  if (file.size <= MAX_DIRECT_BYTES) return file;
  try {
    return await shrinkImage(file);
  } catch (error) {
    if (error instanceof Error && error.message.includes('too large')) throw error;
    throw new Error('This image is too large. Please choose a smaller one.');
  }
}

/** Upload one browser-local image and return its permanent public URL. */
export async function uploadLocalImage(localUrl: string): Promise<string> {
  let blob: Blob;
  try {
    const response = await fetch(localUrl);
    if (!response.ok) throw new Error('unreadable');
    blob = await response.blob();
  } catch {
    throw new Error(IMAGE_UNAVAILABLE_MESSAGE);
  }
  const file = new File([blob], 'image', { type: blob.type || 'image/jpeg' });
  const { public_url } = await api.uploadPremiumImage(await prepareImageFile(file));
  return public_url;
}
