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
  test.setTimeout(120_000);
  await page.goto('/');
  const homeBackground = await backgroundImage(page.locator('section.hero-bokeh-bg'));

  for (const route of [
    '/about',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/shop',
    '/admin',
  ]) {
    await page.goto(route);
    expect(await backgroundImage(page.locator('.page-bokeh-bg').first())).toBe(homeBackground);
  }
});

test('identity fields remain visible when a design does not print the name', async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  for (const scenario of [
    { event: 'Baby Shower', template: 'Sweet Dreams Elephant', field: /Celebrant's name/i, slug: 'baby-shower' },
    { event: 'Birthday', template: 'Party Hat & Confetti', field: /Celebrant's name/i, slug: 'birthday' },
    { event: 'Others', template: 'Confetti Pop', field: /Event name/i, slug: 'custom' },
  ]) {
    await page.goto('/create');
    await page.locator('.picker-card').filter({ hasText: scenario.event }).click();
    await page.getByRole('button', { name: 'Browse Templates' }).click();
    await page.getByRole('button', { name: new RegExp(scenario.template) }).first().click();
    await expect(page.getByRole('textbox', { name: scenario.field })).toBeVisible();
    await expect(page.getByText(/Used in the public evite heading and share message/)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`identity-${scenario.slug}.png`),
      fullPage: false,
    });
  }
});
