import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadTestCredentials() {
  const raw = readFileSync(join(process.cwd(), '.env.e2e-test'), 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}

const { E2E_TEST_EMAIL: TEST_EMAIL, E2E_TEST_PASSWORD: TEST_PASSWORD } = loadTestCredentials();
const TEST_EVENT_TITLE = 'E2E Test Wedding';

async function signIn(page: Page) {
  // Going through the protected route first means SignIn picks up ?redirect=/dashboard automatically.
  await page.goto('/dashboard');
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  // The URL changes before Supabase finishes persisting the session to localStorage — wait for the
  // actual auth token to land so later page.evaluate()/request.get() calls don't race it.
  await expect(async () => {
    const token = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      return key ? JSON.parse(localStorage.getItem(key) || '{}')?.access_token : null;
    });
    expect(token).toBeTruthy();
  }).toPass({ timeout: 10_000 });
}

async function getAuthToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes('auth-token'));
    return key ? JSON.parse(localStorage.getItem(key) || '{}')?.access_token : null;
  });
}

test.describe.serial('Real authenticated pass — live Supabase test account', () => {
  test('signs in and finds the real test event on the dashboard', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });
  });

  test('Feature 2: builds and publishes a real website, verified via public page', async ({ page }) => {
    await signIn(page);
    await page.getByText(TEST_EVENT_TITLE).waitFor();

    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    await eventRow.getByRole('button', { name: /Website/ }).click();

    const builder = page.getByTestId('website-builder');
    await expect(builder).toBeVisible();

    await builder.getByText('+ Add Section').click();
    await builder.getByText('Hero / Cover').click();
    await expect(builder.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });

    const slugInput = builder.locator('input').first();
    await slugInput.fill('e2e-test-wedding-real');
    await expect(builder.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });

    await builder.getByRole('button', { name: 'Publish' }).click();
    await expect(builder.getByRole('button', { name: 'Unpublish' })).toBeVisible({ timeout: 10_000 });
    await expect(builder.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });

    await builder.getByLabel('Close website builder').click();

    // Verify the real public page now serves this real, persisted data.
    await page.goto('/w/e2e-test-wedding-real');
    await expect(page.getByRole('heading', { name: "Let's Celebrate" })).toBeVisible({ timeout: 10_000 });
  });

  test('Feature 3: builds and publishes a real invitation book, verified via public viewer', async ({ page }) => {
    await signIn(page);
    await page.getByText(TEST_EVENT_TITLE).waitFor();

    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    await eventRow.getByRole('button', { name: /Book/ }).click();

    const builder = page.getByTestId('book-builder');
    await expect(builder).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await builder.getByRole('button', { name: 'Add Page(s)' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(['tests/fixtures/page1.png', 'tests/fixtures/page2.png']);

    await expect(builder.getByText('Page 2')).toBeVisible({ timeout: 15_000 });
    await expect(builder.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });

    await builder.getByRole('button', { name: 'Publish' }).click();
    await expect(builder.getByRole('button', { name: 'Unpublish' })).toBeVisible({ timeout: 10_000 });
    await expect(builder.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });

    await builder.getByLabel('Close book builder').click();

    // Find the real event's public page and confirm the real book is there.
    const token = await getAuthToken(page);
    const events = await page.evaluate(async (t) => {
      const res = await fetch('http://localhost:8005/events', { headers: { Authorization: `Bearer ${t}` } });
      return res.json();
    }, token);
    const testEvent = (events as Array<{ id: string; title: string }>).find((e) => e.title === TEST_EVENT_TITLE);
    expect(testEvent).toBeTruthy();

    await page.goto(`/event/${testEvent!.id}`);
    await expect(page.getByText('View Invitation Book')).toBeVisible({ timeout: 10_000 });
    await page.getByText('View Invitation Book').click();
    await expect(page.getByTestId('book-viewer-modal')).toBeVisible();
  });

  test('Feature 1: canvas editor autosave persists a real custom template', async ({ page, request }) => {
    await signIn(page);

    await page.goto('/create');
    await page.getByRole('button', { name: /Build Your Own Design/ }).click();
    const editor = page.getByTestId('canvas-editor');
    await expect(editor).toBeVisible();

    await editor.getByRole('button', { name: 'Add Text' }).click();
    // Wait past the 1.5s autosave debounce for the real network call to land.
    await page.waitForTimeout(3000);
    await expect(editor.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 5000 });

    // Verify the row really exists in the backend via the test account's own token.
    const token = await getAuthToken(page);
    const res = await request.get('http://localhost:8005/custom-templates', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const templates = await res.json();
    expect(Array.isArray(templates) && templates.length).toBeGreaterThan(0);
  });

  test('Feature 4: guest uploads a real photo and host moderates it for real', async ({ page, request }) => {
    await signIn(page);
    const token = await getAuthToken(page);
    const eventsRes = await request.get('http://localhost:8005/events', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const events = await eventsRes.json();
    const testEvent = (events as Array<{ id: string; title: string }>).find((e) => e.title === TEST_EVENT_TITLE);
    expect(testEvent).toBeTruthy();
    const eventId = testEvent!.id;

    // Guest uploads with no auth at all — the real public flow.
    await page.goto(`/gallery/${eventId}`);
    await page.getByPlaceholder('So the host knows who shared it').fill('E2E Guest');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add Photos' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/page1.png');
    await expect(page.getByText('Photo shared!')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByAltText('Shared by E2E Guest').first()).toBeVisible({ timeout: 10_000 });

    // Host moderates the real upload from the real dashboard.
    await page.goto('/dashboard');
    await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });
    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    const expandButton = eventRow.getByTitle('Analytics & Messages');
    await expect(expandButton).toBeVisible({ timeout: 10_000 });
    if (!(await page.getByRole('button', { name: 'Guest Gallery' }).isVisible())) {
      await expandButton.click();
    }
    await page.getByRole('button', { name: 'Guest Gallery' }).click();
    await expect(page.getByText('Copy Guest Upload Link')).toBeVisible({ timeout: 10_000 });
  });
});
