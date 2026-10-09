import { describe, expect, it } from 'vitest';
import { buildTemplateAssetUrl } from './templateAssets';

describe('buildTemplateAssetUrl', () => {
  it('moves template artwork to the configured public bucket', () => {
    expect(
      buildTemplateAssetUrl(
        '/templates/pre wedding/concepts/1-preview.jpg',
        'https://project.supabase.co/storage/v1/object/public/template-assets/',
      ),
    ).toBe(
      'https://project.supabase.co/storage/v1/object/public/template-assets/pre%20wedding/concepts/1-preview.jpg',
    );
  });

  it('leaves non-template and local-development paths alone', () => {
    expect(buildTemplateAssetUrl('/logo.png', 'https://cdn.example')).toBe('/logo.png');
    expect(buildTemplateAssetUrl('/templates/birthday/1.jpg', '')).toBe(
      '/templates/birthday/1.jpg',
    );
  });
});
