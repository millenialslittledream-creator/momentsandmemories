import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_WEDDING } from '../../src/components/WebsiteTemplates/inviteContent';

const eventId = 'event-audit';
const inviteeId = 'invitee-audit';

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

async function installTestSession(context: BrowserContext) {
  const supabaseUrl = readEnvValue('VITE_SUPABASE_URL');
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is required for the route audit');
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const now = new Date().toISOString();
  await context.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key: `sb-${projectRef}-auth-token`,
      value: {
        access_token: 'route-audit-token',
        refresh_token: 'route-audit-refresh',
        token_type: 'bearer',
        expires_in: 7200,
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          aud: 'authenticated', role: 'authenticated', email: 'release-audit@example.com',
          email_confirmed_at: now, app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {}, identities: [], created_at: now, updated_at: now,
        },
      },
    },
  );
}

const json = (route: Route, value: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });

async function installApiMocks(page: Page) {
  const event = {
    id: eventId,
    title: 'Release Audit Celebration',
    description: 'A complete public-page release check.',
    event_date: '2027-02-12',
    event_time: '18:00',
    location: 'Garden Hall',
    cover_image_url: null,
    rsvp_enabled: true,
    invitee_count: 3,
    template_id: null,
    form_data: null,
    customization: null,
    status: 'published',
    created_at: new Date().toISOString(),
  };
  const stats = {
    total: 3, accepted: 2, declined: 1, pending: 0, maybe: 0, responded: 3,
    response_rate: 100, adults: 3, kids: 1, total_people: 4,
    food_preferences: { Vegetarian: 2, 'Non-Vegetarian': 1, 'Kids Meal': 1 },
    group_sizes: { '1': 2, '2': 1 },
    guests: [],
  };

  await page.route('**/*', async (route) => {
    const request = route.request();
    if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue();
    const path = new URL(request.url()).pathname;

    if (path.endsWith(`/public/events/${eventId}/rsvp/${inviteeId}`)) {
      if (request.method() === 'POST') return json(route, { invitee_id: inviteeId, status: 'accepted' });
      return json(route, {
        event: {
          ...event,
          rsvp_config: {
            enabled: true,
            responseOptions: { yes: true, no: true, maybe: true },
            collectGuestCount: true,
            collectKidsCount: true,
            collectFoodPreference: true,
            foodOptions: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Kids Meal'],
            collectAdditionalInfo: true,
            childAgeCutoff: 12,
          },
        },
        invitee: {
          id: inviteeId, name: 'Maya', email: 'maya@example.com', rsvp_status: 'pending',
          rsvp_message: null, dietary_requirements: null, party_size: null, kids_count: null,
          food_preference: null, meal_preferences: {},
        },
      });
    }
    if (path.endsWith(`/public/events/${eventId}/gallery`)) return json(route, []);
    if (path.endsWith(`/public/events/${eventId}/book`)) return json(route, { pages: [] });
    if (path.endsWith(`/public/events/${eventId}`)) return json(route, event);
    if (path.endsWith('/public/websites/audit-wedding')) {
      return json(route, {
        id: 'site-audit', slug: 'audit-wedding',
        theme: { primaryColor: '#9cb092', fontFamily: 'Cormorant Garamond' },
        sections: [
          { id: 'hero', type: 'hero', content: { heading: 'Asha & Ravi', subtitle: 'are getting married', date: 'February 12, 2027' } },
          { id: 'schedule', type: 'schedule', content: { heading: 'Schedule', items: [{ name: 'Ceremony', time: '6:00 PM', location: 'Garden Hall' }] } },
        ],
        event,
      });
    }
    if (path.endsWith('/public/premium-sites/audit-premium')) {
      return json(route, {
        slug: 'audit-premium', event_key: 'marriage', design_id: 'timeless',
        theme_id: 'emerald-ivory', content: DEFAULT_WEDDING, published: true,
      });
    }
    if (path.endsWith(`/events/${eventId}/rsvp-stats`)) return json(route, stats);
    if (path.endsWith(`/events/${eventId}/invitees`)) return json(route, []);
    if (path.endsWith('/events/rsvp-summary')) {
      return json(route, { totals: { ...stats, total_events: 1 }, events: [{ ...stats, event_id: eventId, event_title: event.title, event_date: event.event_date, status: 'published' }] });
    }
    if (path.endsWith(`/messaging/events/${eventId}/messages`)) return json(route, []);
    if (path.endsWith('/events')) return json(route, [event]);
    if (path.endsWith('/drafts/my')) return json(route, null);
    if (path.endsWith('/event-websites')) return json(route, []);
    if (path.endsWith('/invitation-books')) return json(route, []);
    if (path.endsWith('/shop/items')) return json(route, []);
    if (path.endsWith('/admin/stats')) {
      return json(route, { total_users: 10, total_events: 5, total_orders: 2, total_revenue: 5000, pending_orders: 1, notifications_sent: 20, notifications_failed: 0 });
    }
    if (path.endsWith('/admin/users')) return json(route, []);
    if (path.endsWith('/admin/shop/items')) return json(route, []);
    return route.continue();
  });
}

const routes = [
  ['home', '/', 'Create Beautiful Evites'],
  ['shop', '/shop', 'Gifts'],
  ['about', '/about', 'About'],
  ['create', '/create', 'What are we celebrating today?'],
  ['create-design', '/create?stage=design&event=birthday', 'How would you like to design your'],
  ['dashboard', '/dashboard', 'Overall RSVP Analytics'],
  ['sign-in', '/sign-in?redirect=%2Fcreate', 'Sign In'],
  ['sign-up', '/sign-up?redirect=%2Fcreate', 'Create Account'],
  ['forgot-password', '/forgot-password', 'Retrieve Your Story'],
  ['reset-password', '/reset-password', 'Reset Password'],
  ['verify-email', '/verify-email?redirect=%2Fcreate', 'Verify Email'],
  ['public-event', `/event/${eventId}`, 'Release Audit Celebration'],
  ['rsvp', `/rsvp/${eventId}/${inviteeId}`, 'Will you be attending?'],
  ['admin-gate', '/admin', 'Admin Access'],
  ['public-website', '/w/audit-wedding', 'Asha & Ravi'],
  ['premium-site', '/site/audit-premium', 'Darshan'],
  ['guest-gallery', `/gallery/${eventId}`, 'Release Audit Celebration'],
  ['website-builder', '/website-builder?event=marriage', 'Choose your Wedding website'],
  ['baby-preview', '/__baby-preview', 'Baby tuning (13)'],
  ['not-found', '/definitely-not-a-page', 'Page not found'],
] as const;

for (const device of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`every registered route renders cleanly on ${device.name}`, async ({ browser }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height } });
    await installTestSession(context);
    const baselinePage = await context.newPage();
    await baselinePage.goto('/');
    const homeBackground = await baselinePage
      .locator('section.hero-bokeh-bg')
      .evaluate((node) => getComputedStyle(node).backgroundImage);
    await baselinePage.close();

    for (const [name, path, expectedText] of routes) {
      const page = await context.newPage();
      const pageErrors: string[] = [];
      const serverErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
      });
      await installApiMocks(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toContainText(expectedText, { timeout: 20_000 });
      await page.waitForTimeout(300);

      expect(pageErrors, `${name} page errors`).toEqual([]);
      expect(serverErrors, `${name} server errors`).toEqual([]);
      const metrics = await page.evaluate(() => ({
        textLength: document.body.innerText.trim().length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      }));
      expect(metrics.textLength, `${name} rendered content`).toBeGreaterThan(20);
      expect(metrics.overflow, `${name} horizontal overflow`).toBeLessThanOrEqual(8);
      const sharedBackdrop = page.locator('.page-bokeh-bg, .hero-bokeh-bg').first();
      if (await sharedBackdrop.count()) {
        expect(
          await sharedBackdrop.evaluate((node) => getComputedStyle(node).backgroundImage),
          `${name} shares the homepage background`,
        ).toBe(homeBackground);
      }
      await page.screenshot({ path: `test-results/release-route-audit/${device.name}/${name}.png`, fullPage: false });
      await page.close();
    }
    await context.close();
  });
}

test('protected dashboard nested surfaces render with test-only authentication', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Overall RSVP Analytics' })).toBeVisible();

  await page.getByRole('button', { name: /RSVPs/ }).click();
  await expect(page.getByText('Attendance Summary')).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-event-analytics.png' });

  await page.getByRole('button', { name: 'Messages' }).click();
  await expect(page.getByText(/No messages yet|Messages/).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-messages.png' });

  await page.getByRole('button', { name: /Add Guests/ }).click();
  await expect(page.getByText('Add Guests').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-add-guests.png' });
  await context.close();
});

test('all website-builder event families open their editor', async ({ page }) => {
  test.setTimeout(180_000);
  const eventFamilies = ['marriage', 'birthday', 'babyshower', 'bridetobe', 'genderreveal', 'housewarming', 'custom'];
  for (const family of eventFamilies) {
    await page.goto(`/website-builder?event=${family}`);
    await expect(page.getByText(/3 designs · 3 themes each/i)).toBeVisible({ timeout: 20_000 });
    await page.locator('button').nth(1).click();
    await expect(page.getByText('Design your shareable link')).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: `test-results/release-route-audit/builders/${family}.png` });
  }
});
