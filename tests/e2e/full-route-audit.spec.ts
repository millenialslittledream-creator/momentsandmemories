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
    ({ key, value }) => {
      try {
        if (location.origin === 'http://localhost:5173') {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch {
        // The initial about:blank document can deny storage access. The script
        // runs again after navigation, where the test origin is available.
      }
    },
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
    rsvp_config: {
      enabled: true,
      responseOptions: { yes: true, no: true, maybe: false },
      collectGuestCount: true,
      collectKidsCount: true,
      collectFoodPreference: true,
      foodOptions: ['Vegetarian', 'Non-Vegetarian', 'Kids Meal'],
      collectAdditionalInfo: true,
      childAgeCutoff: 12,
    },
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
    if (path.endsWith('/events')) {
      if (request.method() === 'POST') return json(route, { id: 'event-created-audit' });
      return json(route, [event]);
    }
    if (path.endsWith('/drafts/my/claim-resume')) return json(route, null);
    if (path.endsWith('/drafts/my/mark-closed')) return route.fulfill({ status: 204, body: '' });
    if (path.endsWith('/drafts/my')) return request.method() === 'DELETE'
      ? route.fulfill({ status: 204, body: '' })
      : json(route, null);
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

async function finishFreeCheckout(page: Page) {
  const freeButton = page.getByRole('button', { name: /Send Invitation — Free/ });
  const skipUpsellButton = page.getByRole('button', { name: /No thanks, continue for free/ });
  await expect.poll(async () => (
    (await freeButton.isVisible()) || (await skipUpsellButton.isVisible())
  )).toBe(true);

  if (await freeButton.isVisible()) {
    await freeButton.click();
    return;
  }

  if (await skipUpsellButton.isVisible()) {
    await skipUpsellButton.click();
    const completePaymentButton = page.getByRole('button', { name: /Complete Payment/ });
    await expect.poll(async () => (
      (await freeButton.isVisible()) || (await completePaymentButton.isVisible())
    )).toBe(true);
    if (await freeButton.isVisible()) {
      await freeButton.click();
      return;
    }

    await page.getByPlaceholder('1234 5678 9012 3456').fill('4242 4242 4242 4242');
    await page.getByPlaceholder('John Doe').fill('Asha Ravi');
    await page.getByPlaceholder('MM/YY').fill('12/30');
    await page.getByPlaceholder('123', { exact: true }).fill('123');
    await completePaymentButton.click();
    return;
  }

  await freeButton.click();
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
  ['baby-preview', '/__baby-preview', 'Template tuning (13)'],
  ['not-found', '/definitely-not-a-page', 'Page not found'],
] as const;

const intentionallySingleScreenRoutes = new Set([
  'create',
  'create-design',
  'sign-in',
  'sign-up',
  'forgot-password',
  'reset-password',
  'verify-email',
  'admin-gate',
  'website-builder',
  'not-found',
]);

for (const device of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop-short', width: 1280, height: 580 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`every registered route renders cleanly on ${device.name}`, async ({ browser }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      reducedMotion: 'reduce',
    });
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
      // Wait for PageTransition's real completion rather than a fixed delay;
      // parallel screenshot runs can stretch the nominal 500 ms animation.
      const pageTransition = page.locator('[data-page-transition]').first();
      if (await pageTransition.count()) {
        await expect(pageTransition).toHaveCSS('transform', 'none', { timeout: 5_000 });
        await expect(pageTransition).toHaveCSS('opacity', '1', { timeout: 5_000 });
      } else {
        await page.waitForTimeout(700);
      }
      if (name === 'premium-site') await page.waitForTimeout(1_100);

      expect(pageErrors, `${name} page errors`).toEqual([]);
      expect(serverErrors, `${name} server errors`).toEqual([]);
      const metrics = await page.evaluate(() => ({
        textLength: document.body.innerText.trim().length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        verticalOverflow: document.documentElement.scrollHeight - window.innerHeight,
      }));
      expect(metrics.textLength, `${name} rendered content`).toBeGreaterThan(20);
      expect(metrics.overflow, `${name} horizontal overflow`).toBeLessThanOrEqual(8);
      if (intentionallySingleScreenRoutes.has(name)) {
        expect(metrics.verticalOverflow, `${name} avoidable page scroll`).toBeLessThanOrEqual(2);
      }
      const fitSelector =
        name === 'sign-in' || name === 'sign-up' || name === 'verify-email'
          ? '.auth-panel'
          : name === 'forgot-password'
            ? '.auth-glass-card'
            : name === 'reset-password'
              ? '.auth-reset-container'
              : null;
      if (fitSelector) {
        const box = await page.locator(fitSelector).first().boundingBox();
        expect(box, `${name} primary panel exists`).not.toBeNull();
        expect(box!.y, `${name} panel top is visible`).toBeGreaterThanOrEqual(-1);
        expect(box!.y + box!.height, `${name} panel bottom is visible`).toBeLessThanOrEqual(device.height + 1);
      }
      if (name === 'premium-site') {
        const frameBox = await page.getByTestId('template-phone-frame').boundingBox();
        expect(frameBox).not.toBeNull();
        for (const personName of ['Darshan', 'Dharal']) {
          const nameBox = await page.getByText(personName, { exact: true }).first().boundingBox();
          expect(nameBox, `${personName} is rendered`).not.toBeNull();
          expect(nameBox!.x, `${personName} stays inside the invitation`).toBeGreaterThanOrEqual(frameBox!.x);
          expect(nameBox!.x + nameBox!.width, `${personName} stays inside the invitation`).toBeLessThanOrEqual(frameBox!.x + frameBox!.width);
        }
      }
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
  await expect(page.getByRole('heading', { name: 'Overall RSVP Analytics' })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: /RSVPs/ }).click();
  await expect(page.getByText('Attendance Summary')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Adults' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Dietary notes' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Message' })).toBeVisible();
  const expandedLayout = await page.evaluate(() => ({
    pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(expandedLayout.pageOverflow).toBeLessThanOrEqual(8);
  const giftsBox = await page.getByTestId('dashboard-gifts-panel').boundingBox();
  expect(giftsBox).not.toBeNull();
  expect(giftsBox!.x + giftsBox!.width).toBeLessThanOrEqual(expandedLayout.viewportWidth + 1);
  const responseTable = page.getByRole('columnheader', { name: 'Dietary notes' }).locator('xpath=ancestor::table/parent::div');
  const tableOverflow = await responseTable.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(tableOverflow.scrollWidth).toBeGreaterThan(tableOverflow.clientWidth);
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-event-analytics.png', fullPage: true });

  await page.getByRole('button', { name: 'Messages' }).click();
  await expect(page.getByText(/No messages yet|Messages/).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-messages.png' });

  await page.getByRole('button', { name: /Add Guests/ }).click();
  await expect(page.getByText('Add Guests').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/dashboard-add-guests.png' });
  await context.close();
});

test('create-flow chrome stays fully visible in compact browser windows', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 553, height: 555 } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);
  await page.goto('/create');
  await expect(page.getByText('What are we celebrating today?')).toBeVisible({ timeout: 20_000 });

  const closeButton = page.getByRole('button', { name: 'Close', exact: true });
  await expect(closeButton).toBeVisible();
  const closeBox = await closeButton.boundingBox();
  expect(closeBox).not.toBeNull();
  expect(closeBox!.x).toBeGreaterThanOrEqual(0);
  expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(553);
  expect(closeBox!.x).toBeGreaterThan(490);
  expect(await closeButton.evaluate((node) => getComputedStyle(node).position)).toBe('absolute');

  const logo = page.getByRole('button', { name: /Moments & Memories/ });
  const logoBox = await logo.boundingBox();
  expect(logoBox).not.toBeNull();
  expect(logoBox!.x).toBeGreaterThanOrEqual(0);
  expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(553);
  expect(await logo.evaluate((node) => getComputedStyle(node).position)).toBe('absolute');

  await page.screenshot({ path: 'test-results/release-route-audit/compact/create.png' });
  await context.close();
});

test('create flow fills the complete widescreen viewport', async ({ browser }) => {
  const width = 1904;
  const height = 870;
  const context = await browser.newContext({ viewport: { width, height } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);
  await page.goto('/create');
  await expect(page.getByText('What are we celebrating today?')).toBeVisible({ timeout: 20_000 });

  const measurements = await page.evaluate(() => {
    const root = document.getElementById('root')?.getBoundingClientRect();
    const flow = document.querySelector('.hero-bokeh-bg.product-light-shell.fixed')?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      rootLeft: root?.left,
      rootRight: root?.right,
      flowLeft: flow?.left,
      flowRight: flow?.right,
    };
  });
  expect(measurements).toEqual({
    viewportWidth: width,
    rootLeft: 0,
    rootRight: width,
    flowLeft: 0,
    flowRight: width,
  });
  await page.screenshot({ path: 'test-results/release-route-audit/widescreen/create.png' });
  await context.close();
});

test('shop product list responds to the mouse wheel', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 700 } });
  const page = await context.newPage();
  await installApiMocks(page);
  await page.goto('/shop');
  const productScroll = page.getByTestId('shop-product-scroll');
  await expect(productScroll).toBeVisible();
  const before = await productScroll.evaluate((node) => ({
    top: node.scrollTop,
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
  await productScroll.hover();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => productScroll.evaluate((node) => node.scrollTop)).toBeGreaterThan(before.top);
  await context.close();
});

test('create flow keeps only shareable link active and reveals it after final send', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);
  const resumableDraft = {
    id: 'draft-audit',
    step: 4,
    event_type: 'birthday',
    form_data: {
      celebrantName: 'Asha', eventDate: '2027-03-12', eventTime: '18:00',
      timezone: 'ET', venue: 'Garden Hall',
      __mmDraft: { pendingPhase: 'guests', resumePromptOnReturn: true, rsvpSettings: { enabled: true } },
    },
    selected_template: 'bday-c1',
    guests: [{ id: 'guest-seed', name: '', email: '', phone: '' }],
    delivery_preference: 'link' as const,
    updated_at: new Date().toISOString(),
  };
  let markClosedCalls = 0;
  let deleteCalls = 0;
  await page.route('**/drafts/my/claim-resume', (route) => json(route, resumableDraft));
  await page.route('**/drafts/my/mark-closed', (route) => {
    markClosedCalls += 1;
    return route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/drafts/my', (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalls += 1;
      return route.fulfill({ status: 204, body: '' });
    }
    return json(route, resumableDraft);
  });
  await page.goto('/create');

  await page.getByRole('button', { name: /Continue editing/i }).click();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(100);
  expect(markClosedCalls, 'switching tabs must not arm the resume prompt').toBe(0);
  await expect(page.getByText('Share your invitation')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Delivery', { exact: true }).first()).toBeVisible();
  for (const label of ['Email', 'SMS', 'Email + SMS']) {
    const option = page.locator('button').filter({ hasText: label }).filter({ hasText: 'Coming soon' }).first();
    await expect(option).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: /Shareable Link/ })).toBeEnabled();
  await page.getByRole('button', { name: /Continue to Preview/ }).click();
  await expect(page.getByRole('heading', { name: 'Preview & Send' })).toBeVisible();
  await page.getByRole('button', { name: /^Continue/ }).click();
  await expect(page.getByRole('button', { name: /Send Invitation — Free/ })).toBeVisible();
  await page.getByRole('button', { name: /Send Invitation — Free/ }).click();

  await expect(page.getByText('Your invitation is live')).toBeVisible();
  expect(deleteCalls, 'completion removes the most recent draft').toBe(1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await page.waitForTimeout(100);
  expect(markClosedCalls, 'completed invitations must not be recreated on close').toBe(0);
  await expect(page.getByText(`${new URL(page.url()).origin}/event/event-created-audit`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'content_copy Copy', exact: true })).toBeVisible();
  await context.close();
});

for (const scenario of [
  {
    name: 'chosen template',
    eventType: 'birthday',
    selectedTemplate: 'bday-c1',
    uploadedTemplate: null,
    formData: {
      celebrantName: 'Asha', eventDate: '2027-03-12', eventTime: '18:00',
      timezone: 'ET', venue: 'Garden Hall',
    },
  },
  {
    name: 'uploaded single design',
    eventType: 'birthday',
    selectedTemplate: null,
    uploadedTemplate: {
      url: '/test-fixtures/page1.png', type: 'image', fileName: 'birthday-upload.png',
    },
    formData: {
      celebrantName: 'Asha', eventDate: '2027-03-12', eventTime: '18:00',
      timezone: 'ET', venue: 'Garden Hall',
    },
  },
  {
    name: 'build-your-own canvas design',
    eventType: 'birthday',
    selectedTemplate: null,
    uploadedTemplate: {
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+X9WZ5QAAAABJRU5ErkJggg==',
      type: 'image',
      fileName: 'custom-design.png',
    },
    formData: {
      celebrantName: 'Asha', eventDate: '2027-03-12', eventTime: '18:00',
      timezone: 'ET', venue: 'Garden Hall',
    },
  },
] as const) {
  test(`sign-in handoff resumes ${scenario.name} at delivery and publishes its link`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await installTestSession(context);
    const page = await context.newPage();
    await installApiMocks(page);

    const createdPayloads: Array<Record<string, unknown>> = [];
    await page.route('**/events', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      createdPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
      return json(route, { id: `event-${scenario.eventType}-${scenario.name.replace(/\W+/g, '-')}` });
    });
    await page.route('**/media/upload', (route) => json(route, {
      id: 'media-canvas-audit',
      public_url: '/uploads/custom-design.png',
      kind: 'image',
    }));

    await page.addInitScript((draft) => {
      sessionStorage.setItem('mm_evite_auth_handoff', JSON.stringify(draft));
    }, {
      step: 3,
      event_type: scenario.eventType,
      form_data: {
        ...scenario.formData,
        __mmDraft: {
          uploadedTemplate: scenario.uploadedTemplate,
          pendingPhase: 'guests',
          multipleInvitations: false,
        },
      },
      selected_template: scenario.selectedTemplate,
      guests: [{ id: 'guest-single', name: 'Maya', email: 'maya@example.com', phone: '' }],
      delivery_preference: 'link',
    });

    await page.goto('/create');
    await expect(page.getByText('Share your invitation')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Delivery', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: /Continue to Preview/ }).click();
    await expect(page.getByRole('heading', { name: 'Preview & Send' })).toBeVisible();
    await page.getByRole('button', { name: /^Continue/ }).click();
    await finishFreeCheckout(page);

    await expect(page.getByText('Your invitation is live')).toBeVisible({ timeout: 20_000 });
    const eventId = `event-${scenario.eventType}-${scenario.name.replace(/\W+/g, '-')}`;
    await expect(page.getByText(`${new URL(page.url()).origin}/event/${eventId}`, { exact: true })).toBeVisible();
    expect(createdPayloads).toHaveLength(1);
    expect(createdPayloads[0].template_id).toBe(scenario.selectedTemplate);
    await context.close();
  });
}

test('sign-in handoff resumes multi-invite delivery and publishes one link per design', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);

  const createdEventIds = ['event-family', 'event-friends', 'event-colleagues'];
  const createdPayloads: Array<Record<string, unknown>> = [];
  const inviteesByEvent = new Map<string, Array<Record<string, unknown>>>();
  const directUploadPaths: string[] = [];
  await page.route('**/events', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    createdPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { id: createdEventIds[createdPayloads.length - 1] });
  });
  await page.route('**/events/*/invitees', async (route) => {
    const match = new URL(route.request().url()).pathname.match(/\/events\/([^/]+)\/invitees$/);
    if (!match || route.request().method() !== 'POST') return route.fallback();
    inviteesByEvent.set(match[1], route.request().postDataJSON() as Array<Record<string, unknown>>);
    return json(route, []);
  });
  await page.route('**/storage/v1/object/user-uploads/**', async (route) => {
    const storagePath = new URL(route.request().url()).pathname.split('/user-uploads/')[1];
    directUploadPaths.push(storagePath);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ Key: `user-uploads/${storagePath}` }),
    });
  });
  await page.route('**/media/register', async (route) => {
    const { storage_path: storagePath } = route.request().postDataJSON() as { storage_path: string };
    return json(route, {
      id: `media-${directUploadPaths.length}`,
      public_url: `https://storage.example/user-uploads/${storagePath}`,
      kind: 'image',
    });
  });

  await page.addInitScript((draft) => {
    const makeLargePngUrl = () => {
      const bytes = new Uint8Array(4 * 1024 * 1024 + 1);
      bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    };
    draft.form_data.__mmDraft.invitationSlots[0].url = makeLargePngUrl();
    draft.form_data.__mmDraft.invitationSlots[1].url = makeLargePngUrl();
    draft.form_data.__mmDraft.invitationSlots[2].url = makeLargePngUrl();
    sessionStorage.setItem('mm_evite_auth_handoff', JSON.stringify(draft));
  }, {
    step: 3,
    event_type: 'marriage',
    form_data: {
      brideName: 'Asha', groomName: 'Ravi', eventDate: '2027-03-12', eventTime: '18:00',
      timezone: 'IST', venue: 'Garden Hall',
      __mmDraft: {
        multipleInvitations: true,
        pendingPhase: 'guests',
        invitationSlots: [
          { id: 'slot-family', url: '/templates/wedding/concepts/1-preview.jpg', type: 'image', fileName: 'family.jpg', name: 'Family' },
          { id: 'slot-friends', url: '/templates/wedding/concepts/2-preview.jpg', type: 'image', fileName: 'friends.jpg', name: 'Friends' },
          { id: 'slot-colleagues', url: '/templates/wedding/concepts/3-preview.jpg', type: 'image', fileName: 'colleagues.jpg', name: 'Colleagues' },
        ],
      },
    },
    selected_template: null,
    guests: [
      { id: 'guest-family', name: 'Maya', email: 'maya@example.com', phone: '', invitationSetId: 'slot-family' },
      { id: 'guest-friends', name: 'Noah', email: 'noah@example.com', phone: '', invitationSetId: 'slot-friends' },
      { id: 'guest-colleagues', name: 'Ira', email: 'ira@example.com', phone: '', invitationSetId: 'slot-colleagues' },
    ],
    delivery_preference: 'link',
  });

  await page.goto('/create');
  await expect(page.getByText('Share your invitation')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: /Continue to Preview/ }).click();
  await page.getByRole('button', { name: /^Continue/ }).click();
  await finishFreeCheckout(page);

  await expect(page.getByText('Your invitations are live')).toBeVisible();
  await expect(page.getByText(`${new URL(page.url()).origin}/event/event-family`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`${new URL(page.url()).origin}/event/event-friends`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`${new URL(page.url()).origin}/event/event-colleagues`, { exact: true }).first()).toBeVisible();
  expect(createdPayloads).toHaveLength(3);
  expect(directUploadPaths).toHaveLength(3);
  expect(new Set(createdPayloads.map((payload) => payload.cover_image_url)).size).toBe(3);
  expect((createdPayloads[0].form_data as Record<string, unknown>).invitationSetName).toBe('Family');
  expect((createdPayloads[1].form_data as Record<string, unknown>).invitationSetName).toBe('Friends');
  expect((createdPayloads[2].form_data as Record<string, unknown>).invitationSetName).toBe('Colleagues');
  expect(inviteesByEvent.get('event-family')?.map((guest) => guest.name)).toEqual(['Maya']);
  expect(inviteesByEvent.get('event-friends')?.map((guest) => guest.name)).toEqual(['Noah']);
  expect(inviteesByEvent.get('event-colleagues')?.map((guest) => guest.name)).toEqual(['Ira']);
  await context.close();
});

test('custom event multi-invite handoff publishes a distinct link for every uploaded design', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installTestSession(context);
  const page = await context.newPage();
  await installApiMocks(page);

  const createdEventIds = ['event-custom-vip', 'event-custom-general'];
  const createdPayloads: Array<Record<string, unknown>> = [];
  await page.route('**/events', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    createdPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { id: createdEventIds[createdPayloads.length - 1] });
  });

  await page.addInitScript((draft) => {
    sessionStorage.setItem('mm_evite_auth_handoff', JSON.stringify(draft));
  }, {
    step: 3,
    event_type: 'custom',
    form_data: {
      eventTitle: 'Founders Dinner', eventDate: '2027-04-10', eventTime: '19:00',
      timezone: 'IST', venue: 'Courtyard',
      __mmDraft: {
        multipleInvitations: true,
        pendingPhase: 'guests',
        invitationSlots: [
          { id: 'slot-vip', url: '/templates/wedding/concepts/1-preview.jpg', type: 'image', fileName: 'vip.jpg', name: 'VIP' },
          { id: 'slot-general', url: '/templates/wedding/concepts/2-preview.jpg', type: 'image', fileName: 'general.jpg', name: 'General' },
        ],
      },
    },
    selected_template: null,
    guests: [],
    delivery_preference: 'link',
  });

  await page.goto('/create');
  await expect(page.getByText('Share your invitation')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /Continue to Preview/ }).click();
  await page.getByRole('button', { name: /^Continue/ }).click();
  await finishFreeCheckout(page);

  await expect(page.getByText('Your invitations are live')).toBeVisible();
  for (const eventId of createdEventIds) {
    await expect(page.getByText(`${new URL(page.url()).origin}/event/${eventId}`, { exact: true }).first()).toBeVisible();
  }
  expect(createdPayloads).toHaveLength(2);
  expect((createdPayloads[0].form_data as Record<string, unknown>).invitationSetName).toBe('VIP');
  expect((createdPayloads[1].form_data as Record<string, unknown>).invitationSetName).toBe('General');
  await context.close();
});

test('three uploaded wedding invitations create two additional-event rows', async ({ page }) => {
  test.setTimeout(120_000);
  await installApiMocks(page);
  await page.goto('/create?stage=design&event=marriage');

  await page
    .locator('.design-card')
    .filter({ hasText: 'Upload Your Own Design' })
    .getByRole('button', { name: 'Choose This' })
    .click();
  await page.getByRole('button', { name: /Yes, send different invitations/ }).click();

  const multiFileInputs = page.locator('input[type="file"][accept="image/*,video/mp4,video/quicktime"]');
  const inviteNames = page.getByPlaceholder('Enter a name for this invitation');
  const uploadFixture = 'tests/fixtures/page1.png';

  await multiFileInputs.nth(0).setInputFiles(uploadFixture);
  await inviteNames.nth(0).fill('Wedding');
  await multiFileInputs.nth(1).setInputFiles(uploadFixture);
  await inviteNames.nth(1).fill('Sangeet');
  await page.getByRole('button', { name: /Add Another Invitation/ }).click();
  await multiFileInputs.nth(2).setInputFiles(uploadFixture);
  await inviteNames.nth(2).fill('Reception');

  await page.getByRole('button', { name: /^Continue/ }).click();

  await expect(page.getByText(/Invitation 1 of 3/i)).toBeVisible();
  await expect(page.getByPlaceholder('e.g. Mehendi, Sangeet')).toHaveCount(2);
});

test('oversized designs are rejected on the upload step in single and multi-invite flows', async ({ page }) => {
  test.setTimeout(120_000);
  await installApiMocks(page);
  await page.goto('/create?stage=design&event=marriage');

  await page
    .locator('.design-card')
    .filter({ hasText: 'Upload Your Own Design' })
    .getByRole('button', { name: 'Choose This' })
    .click();

  const oversizedImage = {
    name: 'too-large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  };
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles(oversizedImage);
  await expect(page.getByRole('alert')).toContainText('File too large — max 10MB for image');
  await expect(page.getByRole('button', { name: /^Continue/ })).toBeDisabled();

  await page.getByRole('button', { name: /Yes, send different invitations/ }).click();
  await page
    .locator('input[type="file"][accept="image/*,video/mp4,video/quicktime"]')
    .first()
    .setInputFiles(oversizedImage);
  await expect(page.getByRole('alert')).toContainText('File too large — max 10MB for image');
  await expect(page.getByRole('button', { name: /^Continue/ })).toBeDisabled();
});

test('all website-builder event families open their editor', async ({ page }) => {
  test.setTimeout(180_000);
  const eventFamilies = ['marriage', 'birthday', 'babyshower', 'bridetobe', 'genderreveal', 'housewarming', 'custom'];
  for (const family of eventFamilies) {
    await page.goto(`/website-builder?event=${family}`);
    await expect(page.getByText(/3 designs · 3 themes each/i)).toBeVisible({ timeout: 20_000 });
    await page.locator('button').nth(1).click();
    await expect(page.getByText('Design your shareable link')).toBeVisible({ timeout: 20_000 });
    const previewOverflow = await page.getByTestId('template-phone-frame').evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(previewOverflow.scrollWidth, `${family} preview horizontal overflow`).toBeLessThanOrEqual(previewOverflow.clientWidth + 1);
    await page.screenshot({ path: `test-results/release-route-audit/builders/${family}.png` });
  }
});
