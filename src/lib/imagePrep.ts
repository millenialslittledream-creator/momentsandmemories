/**
 * Photos from phones are often 3-12 MB, but Vercel's gateway rejects request bodies above ~4.5 MB
 * before our backend sees them. Shrink big photos in the browser before uploading them through
 * the API so they never hit that limit.
 */

// Vercel's gateway rejects request bodies above ~4.5 MB, so larger photos are shrunk first.
export const MAX_DIRECT_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const JPEG_QUALITIES = [0.86, 0.72, 0.6];

async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the image for upload.');
  // JPEG has no transparency: paint white first so transparent PNG areas don't turn black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
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
