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

// Skipped: the dashboard's "Website" entry point button was intentionally hidden
// (website builder isn't polished enough to show yet — see PROGRESS.md). The underlying
// fix this test verifies (flushing pending autosave on close) was confirmed passing before
// the button was hidden. Re-enable once the Website button is back in the dashboard.
test.skip('closing the website builder immediately after an edit still saves it (no wait for debounce)', async ({ page }) => {
  await signIn(page);
  await expect(page.getByText(TEST_EVENT_TITLE)).toBeVisible({ timeout: 10_000 });
  const token = await getAuthToken(page);

  const sitesBefore = await page.evaluate(async (t) => {
    const res = await fetch('http://localhost:8005/event-websites', { headers: { Authorization: `Bearer ${t}` } });
    return res.json();
  }, token);
  const siteBefore = (sitesBefore as Array<{ id: string; sections: unknown[] }>)[0];
  const countBefore = siteBefore.sections.length;

  const eventRow = page.locator('div', { hasText: TEST_EVENT_TITLE }).first();
  await eventRow.getByRole('button', { name: /Website/ }).click();
  const builder = page.getByTestId('website-builder');
  await expect(builder).toBeVisible();

  // Add a section then close well before the 1.5s autosave debounce would fire.
  await builder.getByText('+ Add Section').click();
  await builder.getByText('FAQ', { exact: true }).last().click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-results/close-flush-before-close.png' });
  await builder.getByLabel('Close website builder').click();
  await page.waitForTimeout(800);

  const sitesAfter = await page.evaluate(async (t) => {
    const res = await fetch(`http://localhost:8005/event-websites/${t.id}`, { headers: { Authorization: `Bearer ${t.token}` } });
    return res.json();
  }, { id: siteBefore.id, token });
  const countAfter = (sitesAfter as { sections: unknown[] }).sections.length;
  expect(countAfter).toBe(countBefore + 1);

  // Clean up: restore the original section list via direct API call (no UI cruft left behind).
  await page.evaluate(async ({ id, token, sections }) => {
    await fetch(`http://localhost:8005/event-websites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sections }),
    });
  }, { id: siteBefore.id, token, sections: siteBefore.sections });
});
