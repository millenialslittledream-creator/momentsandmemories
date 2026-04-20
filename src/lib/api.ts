import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getToken(): Promise<string | null> {
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
};
