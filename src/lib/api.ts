import { supabase } from '@/lib/supabase';

export interface BookPageDto {
  id: string;
  image_url: string;
  frame?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

// Public (no-auth) reads are idempotent GETs, so a brief retry on a transient
// server-side error (5xx) is safe and avoids surfacing a false "not found" to
// guests when the backend hiccups for a moment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publicGet<T = any>(path: string): Promise<T> {
  let lastError: Error = new Error('Request failed');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
    try {
      const res = await fetch(`${API_URL}${path}`);
      if (res.ok) return res.json();
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      lastError = new Error(err.detail || 'API error');
      if (res.status < 500) break; // not transient — don't retry 404s etc.
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('Network error');
    }
  }
  throw lastError;
}

export const api = {
  createEvent: (data: Record<string, unknown>) =>
    apiFetch<{ id: string }>('/events', { method: 'POST', body: JSON.stringify(data) }),

  addInvitees: (eventId: string, invitees: Array<{ name: string; email?: string; phone?: string; source: string }>) =>
    apiFetch<unknown>(`/events/${eventId}/invitees`, { method: 'POST', body: JSON.stringify(invitees) }),

  createQRSession: (eventId?: string) =>
    apiFetch<{ session_token: string; qr_code_base64: string; expires_in_seconds: number }>(
      '/qr/session',
      { method: 'POST', body: JSON.stringify({ event_id: eventId ?? null }) }
    ),

  pollQRSession: (token: string) =>
    apiFetch<{ status: string; contacts_json: Array<{ name: string; email?: string; phone?: string }> }>(
      `/qr/session/${token}`
    ),

  listShopItems: (category?: string) =>
    apiFetch<Array<{ id: string; name: string; price: number; category: string; image_url: string | null; stock: number }>>(
      `/shop/items${category ? `?category=${category}` : ''}`
    ),

  createOrder: (items: Array<{ shop_item_id: string; quantity: number }>, shipping_address?: Record<string, string>) =>
    apiFetch<{ id: string; total_amount: number; status: string }>(
      '/shop/orders',
      { method: 'POST', body: JSON.stringify({ items, shipping_address }) }
    ),

  getDraft: () =>
    apiFetch<{
      id: string;
      step: number;
      event_type: string | null;
      form_data: Record<string, string>;
      selected_template: string | null;
      guests: Array<{ id: string; name: string; email: string; phone: string }>;
      delivery_preference: 'email' | 'phone' | 'both';
      updated_at: string;
    } | null>('/drafts/my'),

  saveDraft: (data: {
    step: number;
    event_type: string | null;
    form_data: Record<string, string>;
    selected_template: string | null;
    guests: Array<{ id: string; name: string; email: string; phone: string }>;
    delivery_preference: string;
  }) =>
    apiFetch<unknown>('/drafts/my', { method: 'PUT', body: JSON.stringify(data) }),

  deleteDraft: async () => {
    const token = await getToken();
    return fetch(`${API_URL}/drafts/my`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  },

  getMyEvents: () =>
    apiFetch<Array<{
      id: string;
      title: string;
      event_date: string;
      event_time: string | null;
      location: string | null;
      status: string;
      template_id: string | null;
      created_at: string;
    }>>('/events'),

  getInvitees: (eventId: string) =>
    apiFetch<Array<{ id: string; name: string; email: string | null; phone: string | null; source: string }>>(
      `/events/${eventId}/invitees`
    ),

  // ── RSVP stats (auth required) ────────────────────────────────────────
  getEventRSVPStats: (eventId: string) =>
    apiFetch<{ total: number; accepted: number; declined: number; pending: number }>(
      `/events/${eventId}/rsvp-stats`
    ),

  // ── Public endpoints (no auth) ────────────────────────────────────────
  getPublicEvent: (eventId: string) => publicGet(`/public/events/${eventId}`),

  getRSVPPage: (eventId: string, inviteeId: string) => publicGet(`/public/events/${eventId}/rsvp/${inviteeId}`),

  submitRSVP: (eventId: string, inviteeId: string, data: { status: string; message: string; dietary_requirements: string }) =>
    fetch(`${API_URL}/public/events/${eventId}/rsvp/${inviteeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : r.json().then((e: { detail: string }) => Promise.reject(new Error(e.detail)))),

  // ── Messaging (auth required) ─────────────────────────────────────────
  getMessages: (eventId: string) =>
    apiFetch<Array<{ id: string; sender_type: string; sender_name: string; body: string; created_at: string }>>(
      `/messaging/events/${eventId}/messages`
    ),

  sendMessage: (eventId: string, body: string) =>
    apiFetch<{ id: string; body: string; created_at: string }>(
      `/messaging/events/${eventId}/messages`,
      { method: 'POST', body: JSON.stringify({ body }) }
    ),

  sendGuestMessage: (eventId: string, inviteeId: string, body: string, senderName: string) =>
    fetch(`${API_URL}/messaging/events/${eventId}/messages/guest/${inviteeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, sender_name: senderName }),
    }).then(r => r.ok ? r.json() : r.json().then((e: { detail: string }) => Promise.reject(new Error(e.detail)))),

  // ── Admin (X-Admin-Secret header) ─────────────────────────────────────
  adminGetStats: (secret: string) =>
    fetch(`${API_URL}/admin/stats`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminListUsers: (secret: string) =>
    fetch(`${API_URL}/admin/users`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminDeleteUser: (secret: string, userId: string) =>
    fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': secret },
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminListEvents: (secret: string) =>
    fetch(`${API_URL}/admin/events`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminModerateEvent: (secret: string, eventId: string, status: string) =>
    fetch(`${API_URL}/admin/events/${eventId}/moderate`, {
      method: 'PUT',
      headers: { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminGetUserProfile: (secret: string, userId: string) =>
    fetch(`${API_URL}/admin/users/${userId}`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load user'))),

  adminListShopItems: (secret: string) =>
    fetch(`${API_URL}/admin/shop/items`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminCreateShopItem: (secret: string, data: Record<string, unknown>) =>
    fetch(`${API_URL}/admin/shop/items`, {
      method: 'POST',
      headers: { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to create item'))),

  adminUpdateShopItem: (secret: string, itemId: string, data: Record<string, unknown>) =>
    fetch(`${API_URL}/admin/shop/items/${itemId}`, {
      method: 'PUT',
      headers: { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to update item'))),

  adminDeleteShopItem: (secret: string, itemId: string) =>
    fetch(`${API_URL}/admin/shop/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': secret },
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to delete item'))),

  // ── Media uploads (canvas editor) ───────────────────────────────────────
  uploadMedia: async (file: File): Promise<{ id: string; public_url: string; kind: 'image' | 'video' }> => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // ── Custom templates (canvas editor) ────────────────────────────────────
  createCustomTemplate: (data: Record<string, unknown>) =>
    apiFetch<{ id: string }>('/custom-templates', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomTemplate: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/custom-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getCustomTemplate: (id: string) =>
    apiFetch<{
      id: string;
      name: string | null;
      canvas_width: number;
      canvas_height: number;
      background: { type: string; value: string };
      elements: Array<Record<string, unknown>>;
    }>(`/custom-templates/${id}`),

  listCustomTemplates: () =>
    apiFetch<Array<{ id: string; name: string | null; updated_at: string }>>('/custom-templates'),

  deleteCustomTemplate: (id: string) =>
    apiFetch<unknown>(`/custom-templates/${id}`, { method: 'DELETE' }),

  // ── Event website builder ───────────────────────────────────────────────
  createEventWebsite: (data: { event_id: string; slug: string; sections?: Record<string, unknown>[]; theme?: Record<string, unknown>; published?: boolean }) =>
    apiFetch<{ id: string; slug: string }>('/event-websites', { method: 'POST', body: JSON.stringify(data) }),

  listEventWebsites: () =>
    apiFetch<Array<{ id: string; event_id: string; slug: string; published: boolean; updated_at: string }>>('/event-websites'),

  getEventWebsite: (id: string) =>
    apiFetch<{
      id: string;
      event_id: string;
      slug: string;
      sections: Array<Record<string, unknown>>;
      theme: Record<string, unknown>;
      published: boolean;
    }>(`/event-websites/${id}`),

  updateEventWebsite: (id: string, data: { slug?: string; sections?: Record<string, unknown>[]; theme?: Record<string, unknown>; published?: boolean }) =>
    apiFetch<unknown>(`/event-websites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteEventWebsite: (id: string) =>
    apiFetch<unknown>(`/event-websites/${id}`, { method: 'DELETE' }),

  getPublicWebsite: (slug: string) => publicGet(`/public/websites/${slug}`),

  // ── Invitation book (page-turn) ─────────────────────────────────────────
  createInvitationBook: (data: { event_id: string; title?: string; pages?: Array<BookPageDto>; published?: boolean }) =>
    apiFetch<{ id: string }>('/invitation-books', { method: 'POST', body: JSON.stringify(data) }),

  listInvitationBooks: () =>
    apiFetch<Array<{ id: string; event_id: string; title: string | null; published: boolean; updated_at: string }>>('/invitation-books'),

  getInvitationBook: (id: string) =>
    apiFetch<{
      id: string;
      event_id: string;
      title: string | null;
      pages: Array<BookPageDto>;
      published: boolean;
    }>(`/invitation-books/${id}`),

  updateInvitationBook: (id: string, data: { title?: string; pages?: Array<BookPageDto>; published?: boolean }) =>
    apiFetch<unknown>(`/invitation-books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteInvitationBook: (id: string) =>
    apiFetch<unknown>(`/invitation-books/${id}`, { method: 'DELETE' }),

  getPublicBook: (eventId: string) => publicGet(`/public/events/${eventId}/book`),

  // ── Guest photo gallery ──────────────────────────────────────────────────
  uploadGalleryPhoto: (eventId: string, file: File, uploadedByName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by_name', uploadedByName);
    return fetch(`${API_URL}/public/events/${eventId}/gallery`, { method: 'POST', body: formData })
      .then(r => r.ok ? r.json() : r.json().then((e: { detail: string }) => Promise.reject(new Error(e.detail))));
  },

  getGalleryPhotos: (eventId: string) =>
    publicGet<Array<{ id: string; public_url: string; uploaded_by_name: string | null; approved: boolean; created_at: string }>>(
      `/public/events/${eventId}/gallery`
    ),

  getOwnerGalleryPhotos: (eventId: string) =>
    apiFetch<Array<{ id: string; public_url: string; uploaded_by_name: string | null; approved: boolean; created_at: string }>>(
      `/gallery/${eventId}`
    ),

  setPhotoApproval: (photoId: string, approved: boolean) =>
    apiFetch<unknown>(`/gallery/photos/${photoId}/approval?approved=${approved}`, { method: 'PUT' }),

  deleteGalleryPhoto: (photoId: string) =>
    apiFetch<unknown>(`/gallery/photos/${photoId}`, { method: 'DELETE' }),

  // ── Evite template customizations (font/color/position overrides + photo) ──
  createEviteCustomization: (data: {
    event_id?: string;
    template_id: string;
    field_overrides?: Record<string, unknown>;
    photo_overlay?: Record<string, unknown> | null;
  }) =>
    apiFetch<{ id: string }>('/evite-customizations', { method: 'POST', body: JSON.stringify(data) }),

  getEviteCustomizationsByEvent: (eventId: string) =>
    apiFetch<Array<{
      id: string;
      event_id: string | null;
      template_id: string;
      field_overrides: Record<string, unknown>;
      photo_overlay: Record<string, unknown> | null;
    }>>(`/evite-customizations/by-event/${eventId}`),

  updateEviteCustomization: (
    id: string,
    data: {
      event_id?: string;
      field_overrides?: Record<string, unknown>;
      photo_overlay?: Record<string, unknown> | null;
    }
  ) => apiFetch<unknown>(`/evite-customizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
