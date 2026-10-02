import { test, expect, type Locator } from '@playwright/test';

async function expectBokehBackground(element: Locator) {
  await expect(element).toBeVisible({ timeout: 60_000 });
  const backgroundImage = await element.evaluate(
    (node) => getComputedStyle(node).backgroundImage,
  );
  expect(backgroundImage).toContain('radial-gradient');
}

test('Create entry screens share the bokeh background', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/create');

  const entryOverlay = page.locator('.page-bokeh-bg.fixed.inset-0');
  await expectBokehBackground(entryOverlay);
  await expect(page.getByText('What are we celebrating today?')).toBeVisible();

  await page.locator('.picker-card').filter({ hasText: 'Birthday' }).click();
  await expect(page.getByText(/How would you like to design your/)).toBeVisible({
    timeout: 6_000,
  });
  await expectBokehBackground(entryOverlay);

  await page.getByRole('button', { name: 'Browse Templates' }).click();
  await expect(page.getByRole('heading', { name: /Choose your design/ })).toBeVisible();
  await expectBokehBackground(page.locator('.page-bokeh-bg.h-screen'));
});
