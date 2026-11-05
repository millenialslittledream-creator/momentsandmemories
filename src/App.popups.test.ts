import { describe, expect, it } from 'vitest';
import appSource from './App.tsx?raw';

describe('popup notifications switch', () => {
  it('does not mount the popup host unless VITE_SHOW_TOASTS is "true"', () => {
    expect(appSource).toMatch(/VITE_SHOW_TOASTS === 'true' && <Toaster/);
    expect(appSource).not.toMatch(/^\s*<Toaster/m); // never mounted unconditionally
  });
});
