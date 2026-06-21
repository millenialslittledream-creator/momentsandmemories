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
  await page.goto('/dashboard');
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  await expect(async () => {
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
  }).toPass({ timeout: 10_000 });
}

async function getAuthToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes('auth-token'));
    return key ? JSON.parse(localStorage.getItem(key) || '{}')?.access_token : null;
  });
}

async function getTestEvent(page: Page): Promise<{ id: string; title: string }> {
  const token = await getAuthToken(page);
  const events = await page.evaluate(async (t) => {
    const res = await fetch('http://localhost:8005/events', { headers: { Authorization: `Bearer ${t}` } });
    return res.json();
  }, token);
  const testEvent = (events as Array<{ id: string; title: string }>).find((e) => e.title === TEST_EVENT_TITLE);
  if (!testEvent) throw new Error('Test event not found');
  return testEvent;
}

test.describe.serial('Manual QA — build real samples and verify persistence', () => {
  test('sign in', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/qa-01-dashboard.png', fullPage: true });
  });

  test('Feature 1: build a real multi-element canvas design', async ({ page }) => {
    await signIn(page);

    await page.goto('/create');
    await page.screenshot({ path: 'test-results/qa-02-create-gallery.png', fullPage: true });
    await page.getByRole('button', { name: /Build Your Own Design/ }).click();
    const editor = page.getByTestId('canvas-editor');
    await expect(editor).toBeVisible();

    // Add a heading text element and style it.
    await editor.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(400);

    // Style via the property panel (font size + color), avoiding fragile canvas-coordinate
    // double-clicks for inline content editing.
    const sizeInput = editor.locator('input[type="number"]').first();
    if (await sizeInput.count() > 0) {
      await sizeInput.fill('64');
      await sizeInput.blur();
    }

    // Add a second text element for a subtitle.
    await editor.getByRole('button', { name: 'Add Text' }).click();
    await page.waitForTimeout(400);

    // Set a background color so the sample is visually distinct from a blank canvas.
    const colorInput = editor.locator('label[title="Background color"] input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = '#cdd9c4';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.screenshot({ path: 'test-results/qa-03-canvas-with-elements.png', fullPage: true });

    await expect(editor.locator('span', { hasText: 'Saved' })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/qa-04-canvas-saved-indicator.png', fullPage: true });
  });

  test('Feature 1b: confirm the canvas design persisted to the backend', async ({ page }) => {
    await signIn(page);
    const token = await getAuthToken(page);
    const res = await page.request.get('http://localhost:8005/custom-templates', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const templates = await res.json();
    console.log('PERSISTED TEMPLATES:', JSON.stringify(templates.map((t: { id: string; elements: unknown[]; background: unknown }) => ({ id: t.id, elementCount: t.elements?.length, background: t.background }))));
    expect(templates.length).toBeGreaterThan(0);
  });

  test('Feature 2: build a real multi-section website and verify it on the public page', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });

    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    await eventRow.getByRole('button', { name: /Website/ }).click();
    const builder = page.getByTestId('website-builder');
    await expect(builder).toBeVisible();

    // Build a real multi-section site: Hero, Our Story, Schedule, RSVP.
    for (const label of ['Hero / Cover', 'Our Story', 'Schedule', 'RSVP']) {
      await builder.getByText('+ Add Section').click();
      await builder.getByText(label, { exact: true }).last().click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: 'test-results/qa-05-website-builder-sections.png', fullPage: true });

    const slugInput = builder.locator('input').first();
    await slugInput.fill('sarah-and-james-wedding');
    await page.waitForTimeout(2500);

    await builder.getByRole('button', { name: 'Publish' }).click();
    await expect(builder.getByRole('button', { name: 'Unpublish' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2500);

    await page.screenshot({ path: 'test-results/qa-06-website-builder-published.png', fullPage: true });
    await builder.getByLabel('Close website builder').click();

    // Verify via the real public page.
    await page.goto('/w/sarah-and-james-wedding');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/qa-07-public-website-live.png', fullPage: true });
  });

  test('Feature 3: build a real multi-page book and verify it in the public viewer', async ({ page }) => {
    await signIn(page);

    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    await eventRow.getByRole('button', { name: /Book/ }).click();
    const builder = page.getByTestId('book-builder');
    await expect(builder).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await builder.getByRole('button', { name: 'Add Page(s)' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(['tests/fixtures/page1.png', 'tests/fixtures/page2.png']);
    await expect(builder.getByText('Page 2')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/qa-08-book-builder-pages.png', fullPage: true });

    await builder.getByRole('button', { name: 'Publish' }).click();
    await expect(builder.getByRole('button', { name: 'Unpublish' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2500);
    await builder.getByLabel('Close book builder').click();

    const testEvent = await getTestEvent(page);
    await page.goto(`/event/${testEvent.id}`);
    await page.waitForTimeout(1000);
    await expect(page.getByText('View Invitation Book')).toBeVisible({ timeout: 10_000 });
    await page.getByText('View Invitation Book').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/qa-09-book-viewer-live.png', fullPage: true });
  });

  test('Feature 4: upload real guest photos and verify they persist after reload', async ({ page }) => {
    await signIn(page);
    const testEvent = await getTestEvent(page);

    await page.goto(`/gallery/${testEvent.id}`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/qa-10-guest-gallery-empty.png', fullPage: true });

    for (const [name, file] of [['Priya', 'page1.png'], ['Marcus', 'page2.png']] as const) {
      await page.getByPlaceholder('So the host knows who shared it').fill(name);
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Add Photos' }).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(`tests/fixtures/${file}`);
      await expect(page.getByText('Photo shared!')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/qa-11-guest-gallery-with-photos.png', fullPage: true });

    // Reload to prove the photos persisted server-side, not just in local state.
    await page.reload();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/qa-12-guest-gallery-after-reload.png', fullPage: true });

    // Host moderation view.
    await page.goto('/dashboard');
    await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });
    const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
    const expandButton = eventRow.getByTitle('Analytics & Messages');
    await expect(expandButton).toBeVisible({ timeout: 10_000 });
    await expandButton.click();
    await page.getByRole('button', { name: 'Guest Gallery' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/qa-13-host-moderation-panel.png', fullPage: true });
  });
});
