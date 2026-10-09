import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './authRedirect';

const origin = 'https://moments.example';

describe('getSafeRedirectPath', () => {
  it('keeps an internal route, query string, and hash', () => {
    expect(getSafeRedirectPath('/create?step=details#editor', origin)).toBe(
      '/create?step=details#editor',
    );
  });

  it('accepts an absolute URL only when it belongs to this app', () => {
    expect(getSafeRedirectPath(`${origin}/dashboard`, origin)).toBe('/dashboard');
    expect(getSafeRedirectPath('https://attacker.example/collect', origin)).toBe('/');
  });

  it('rejects protocol-relative, script, and malformed destinations', () => {
    expect(getSafeRedirectPath('//attacker.example/collect', origin)).toBe('/');
    expect(getSafeRedirectPath('javascript:alert(1)', origin)).toBe('/');
    expect(getSafeRedirectPath('https://%', origin)).toBe('/');
  });
});
