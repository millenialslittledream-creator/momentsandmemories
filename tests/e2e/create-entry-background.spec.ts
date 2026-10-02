import { test, expect, type Locator } from '@playwright/test';

async function expectBokehBackground(element: Locator) {
  await expect(element).toBeVisible({ timeout: 60_000 });
  const backgroundImage = await element.evaluate(
    (node) => getComputedStyle(node).backgroundImage,
  );
  expect(backgroundImage).toContain('radial-gradient');
  expect(backgroundImage).not.toContain('url(');
}

async function backgroundImage(element: Locator) {
  await expect(element).toBeVisible({ timeout: 60_000 });
  return element.evaluate((node) => getComputedStyle(node).backgroundImage);
}

test('Create entry screens share the bokeh background', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const homeBackground = await backgroundImage(page.locator('section.hero-bokeh-bg'));

  await page.goto('/create');

  const entryOverlay = page.locator('.hero-bokeh-bg.fixed.inset-0');
  await expectBokehBackground(entryOverlay);
  expect(await backgroundImage(entryOverlay)).toBe(homeBackground);
  await expect(entryOverlay.locator('.mix-blend-multiply')).toHaveCount(0);
  await expect(page.getByText('What are we celebrating today?')).toBeVisible();

  await page.locator('.picker-card').filter({ hasText: 'Birthday' }).click();
  await expect(page.getByText(/How would you like to design your/)).toBeVisible({
    timeout: 6_000,
  });
  await expectBokehBackground(entryOverlay);

  await page.getByRole('button', { name: 'Browse Templates' }).click();
  await expect(page.getByRole('heading', { name: /Choose your design/ })).toBeVisible();
  await expectBokehBackground(page.locator('.hero-bokeh-bg.h-screen'));
});

test('public full-page screens use the exact homepage background', async ({ page }) => {
  await page.goto('/');
  const homeBackground = await backgroundImage(page.locator('section.hero-bokeh-bg'));

  for (const route of ['/sign-in', '/sign-up', '/forgot-password', '/shop']) {
    await page.goto(route);
    expect(await backgroundImage(page.locator('.page-bokeh-bg'))).toBe(homeBackground);
  }
});
