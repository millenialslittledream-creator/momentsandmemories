export type EviteUploadKind = 'image' | 'video';

export const MAX_EVITE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_EVITE_VIDEO_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);

export function getEviteUploadError(file: File, kind: EviteUploadKind): string | null {
  const allowedTypes = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  if (!allowedTypes.has(file.type)) {
    return kind === 'image'
      ? 'Unsupported image type. Please use JPEG, PNG, GIF, or WebP.'
      : 'Unsupported video type. Please use MP4 or MOV.';
  }

  const maxBytes = kind === 'image' ? MAX_EVITE_IMAGE_BYTES : MAX_EVITE_VIDEO_BYTES;
  if (file.size > maxBytes) {
    const maxMegabytes = maxBytes / (1024 * 1024);
    return `File too large — max ${maxMegabytes}MB for ${kind}. Please choose a smaller file.`;
  }

  return null;
}
