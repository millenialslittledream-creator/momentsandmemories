import { test, expect, type Page, type Route } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

function readEnvValue(name: string) {
  let value = '';
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match?.[1] === name) value = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return value;
}

async function installTestSession(page: Page) {
  const supabaseUrl = readEnvValue('VITE_SUPABASE_URL');
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is required for the test session key');

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const now = new Date().toISOString();
  const session = {
    access_token: 'theme-audit-token',
    refresh_token: 'theme-audit-refresh',
    token_type: 'bearer',
    expires_in: 7200,
    expires_at: Math.floor(Date.now() / 1000) + 7200,
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'theme-audit@example.com',
      email_confirmed_at: now,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: now,
      updated_at: now,
    },
  };

  await page.addInitScript(
    ({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)),
    { storageKey: key, value: session },
  );
}

const reply = (route: Route, value: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });

async function mockDashboardData(page: Page) {
  const now = new Date().toISOString();
  await page.route('**/events/event-theme/rsvp-stats', (route) =>
    reply(route, {
      total: 12,
      accepted: 8,
      declined: 2,
      pending: 1,
      maybe: 1,
      responded: 11,
      response_rate: 92,
      adults: 14,
      kids: 5,
      total_people: 19,
      food_preferences: { Vegetarian: 8, 'Non-Vegetarian': 7, Vegan: 2, 'Kids Meal': 2 },
      group_sizes: { '1': 4, '2': 3, '3-4': 4, '5+': 1 },
      guests: [],
    }),
  );
  await page.route('**/events/rsvp-summary', (route) =>
    reply(route, {
      totals: {
        total_events: 1,
        total: 12,
        accepted: 8,
        declined: 2,
        pending: 1,
        maybe: 1,
        responded: 11,
        response_rate: 92,
        adults: 14,
        kids: 5,
        total_people: 19,
        food_preferences: { Vegetarian: 8, 'Non-Vegetarian': 7, Vegan: 2, 'Kids Meal': 2 },
        group_sizes: { '1': 4, '2': 3, '3-4': 4, '5+': 1 },
        guests: [],
      },
      events: [{
        event_id: 'event-theme', event_title: 'Theme Audit Wedding', event_date: '2027-02-12', status: 'published',
        total: 12, accepted: 8, declined: 2, pending: 1, maybe: 1, responded: 11, response_rate: 92,
        adults: 14, kids: 5, total_people: 19, food_preferences: {}, group_sizes: {}, guests: [],
      }],
    }),
  );
  await page.route('**/events/event-theme/invitees', (route) => reply(route, []));
  await page.route('**/events', (route) =>
    reply(route, [
      {
        id: 'event-theme',
        title: 'Theme Audit Wedding',
        event_date: '2027-02-12',
        event_time: '18:00',
        location: 'Garden Hall',
        status: 'published',
        template_id: 'wedding',
        created_at: now,
      },
    ]),
  );
  await page.route('**/drafts/my', (route) => reply(route, null));
  await page.route('**/event-websites', (route) => reply(route, []));
  await page.route('**/invitation-books', (route) => reply(route, []));
}

test('protected dashboard and its nested panels keep the home theme', async ({ page }) => {
  await page.goto('/');
  const homeBackground = await page
    .locator('section.hero-bokeh-bg')
    .evaluate((node) => getComputedStyle(node).backgroundImage);

  await installTestSession(page);
  await mockDashboardData(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Theme Audit Wedding')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Overall RSVP Analytics' })).toBeVisible();

  const dashboard = page.locator('.page-bokeh-bg.product-light-shell').first();
  await expect(dashboard).toBeVisible();
  expect(await dashboard.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe(homeBackground);
  await expect(page.locator('nav')).toHaveCSS('color', 'rgb(42, 51, 40)');

  await page.getByRole('button', { name: /RSVPs/ }).click();
  await expect(page.getByText('Attendance Summary')).toBeVisible();

  await page.getByRole('button', { name: /Add Guests/ }).click();
  const modal = page.locator('.hero-bokeh-bg.product-light-shell.fixed.inset-0').last();
  await expect(modal).toBeVisible();
  expect(await modal.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe(homeBackground);
});
