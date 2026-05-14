import type { Palette, TemplateLayout, Zone } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SECRET_STORAGE_KEY = '_studio_token';

export function getStoredSecret(): string | null {
  try {
    return window.localStorage.getItem(SECRET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSecret(secret: string): void {
  try {
    window.localStorage.setItem(SECRET_STORAGE_KEY, secret);
  } catch {
    /* ignore */
  }
}

export function clearStoredSecret(): void {
  try {
    window.localStorage.removeItem(SECRET_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const secret = getStoredSecret();
  if (!secret) throw new Error('No admin secret');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Secret': secret,
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 404) {
    // Stealth check: server returns 404 on bad secret. Treat as auth failure.
    throw new Error('Unauthorized or not found');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  verify: () => adminFetch<{ ok: boolean }>('/_studio/api/auth/verify', { method: 'POST' }),

  listLayouts: () =>
    adminFetch<{ layouts: Record<string, TemplateLayout> }>('/_studio/api/layouts'),

  getLayout: (templateId: string) =>
    adminFetch<TemplateLayout>(`/_studio/api/layouts/${encodeURIComponent(templateId)}`),

  saveLayout: (templateId: string, zones: Zone[], palette: Palette) =>
    adminFetch<TemplateLayout>(
      `/_studio/api/layouts/${encodeURIComponent(templateId)}`,
      { method: 'PUT', body: JSON.stringify({ zones, palette }) }
    ),

  deleteLayout: (templateId: string) =>
    adminFetch<void>(
      `/_studio/api/layouts/${encodeURIComponent(templateId)}`,
      { method: 'DELETE' }
    ),

  llmSuggest: (params: {
    provider: 'anthropic' | 'ollama';
    image_url: string;
    prompt: string;
    api_key?: string;
    ollama_url?: string;
  }) =>
    adminFetch<{ text: string }>('/_studio/api/llm/suggest', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
