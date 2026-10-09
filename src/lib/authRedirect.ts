const DEFAULT_REDIRECT = '/';

/**
 * Only allow redirects that resolve back to this app. Query-string values are
 * user controlled, so using them directly would allow an external redirect
 * after sign-in and can also produce invalid Supabase OAuth callback URLs.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  origin = window.location.origin,
): string {
  if (!candidate) return DEFAULT_REDIRECT;

  try {
    const target = new URL(candidate, origin);
    if (target.origin !== origin) return DEFAULT_REDIRECT;

    const path = `${target.pathname}${target.search}${target.hash}`;
    return path.startsWith('/') && !path.startsWith('//') ? path : DEFAULT_REDIRECT;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

const OAUTH_REDIRECT_KEY = 'mm_oauth_redirect';

export function rememberOAuthRedirect(path: string): void {
  try {
    sessionStorage.setItem(OAUTH_REDIRECT_KEY, getSafeRedirectPath(path));
  } catch {
    // Storage can be unavailable in hardened/private browser contexts. The
    // Supabase redirectTo option remains the primary redirect mechanism.
  }
}

/**
 * Supabase falls back to its configured Site URL when an environment-specific
 * callback URL is missing from the allow-list. Remembering the intended route
 * in this tab lets a first-time Google user still resume the flow on return.
 */
export function consumeOAuthRedirect(): string | null {
  try {
    const saved = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
    if (!saved) return null;
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    return getSafeRedirectPath(saved);
  } catch {
    return null;
  }
}
