import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('popup notifications switch', () => {
  const app = readFileSync('src/App.tsx', 'utf-8');

  it('does not mount the popup host unless VITE_SHOW_TOASTS is "true"', () => {
    expect(app).toMatch(/VITE_SHOW_TOASTS === 'true' && <Toaster/);
    expect(app).not.toMatch(/^\s*<Toaster/m); // never mounted unconditionally
  });
});
