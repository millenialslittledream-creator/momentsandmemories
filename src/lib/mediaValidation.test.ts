import { describe, expect, it } from 'vitest';
import {
  getEviteUploadError,
  MAX_EVITE_IMAGE_BYTES,
  MAX_EVITE_VIDEO_BYTES,
} from './mediaValidation';

const fileOfSize = (size: number, type: string) => new File([new Uint8Array(size)], 'invite', { type });

describe('getEviteUploadError', () => {
  it('accepts images and videos at their exact limits', () => {
    expect(getEviteUploadError(fileOfSize(MAX_EVITE_IMAGE_BYTES, 'image/png'), 'image')).toBeNull();
    expect(getEviteUploadError(fileOfSize(MAX_EVITE_VIDEO_BYTES, 'video/mp4'), 'video')).toBeNull();
  });

  it('rejects oversized images before they enter the create flow', () => {
    expect(
      getEviteUploadError(fileOfSize(MAX_EVITE_IMAGE_BYTES + 1, 'image/jpeg'), 'image'),
    ).toBe('File too large — max 10MB for image. Please choose a smaller file.');
  });

  it('rejects oversized videos before they enter the create flow', () => {
    expect(
      getEviteUploadError(fileOfSize(MAX_EVITE_VIDEO_BYTES + 1, 'video/quicktime'), 'video'),
    ).toBe('File too large — max 50MB for video. Please choose a smaller file.');
  });

  it('rejects media types the backend does not support', () => {
    expect(getEviteUploadError(fileOfSize(100, 'image/svg+xml'), 'image')).toMatch(/Unsupported image type/);
    expect(getEviteUploadError(fileOfSize(100, 'video/webm'), 'video')).toMatch(/Unsupported video type/);
  });
});
