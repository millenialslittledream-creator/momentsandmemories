import { test, expect } from '@playwright/test';

test('visual snapshots for manual review', async ({ page }) => {
  await page.goto('/create');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/manual-01-gallery.png', fullPage: false });

  await page.locator('.picker-card').filter({ hasText: 'Birthday' }).click();
  await page
    .locator('.design-card')
    .filter({ hasText: 'Build from Scratch' })
    .getByRole('button', { name: 'Start Designing' })
    .click();
  const editor = page.getByTestId('canvas-editor');
  await expect(editor).toBeVisible();
  await page.screenshot({ path: 'test-results/manual-02-editor-empty.png' });

  await editor.getByRole('button', { name: 'Add Text' }).click();
  await page.screenshot({ path: 'test-results/manual-03-editor-text-added.png' });

  await editor.getByRole('button', { name: 'B', exact: true }).click();
  await editor.locator('input[type="number"]').fill('72');
  await editor.locator('button[aria-label="Set color #c47a55"]').click();
  await page.screenshot({ path: 'test-results/manual-04-editor-styled.png' });

  await editor.getByRole('button', { name: 'Add Text' }).click();
  await editor.getByRole('button', { name: 'Add Text' }).click();
  await page.screenshot({ path: 'test-results/manual-05-editor-layers.png' });

  await editor.getByRole('button', { name: 'Done' }).click();
  await expect(editor).toBeHidden({ timeout: 10_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/manual-06-handoff-to-editor.png' });
});

test('regression: existing template picker flow still works', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('button', { name: /^Wedding\b/ }).click();
  await page.getByRole('button', { name: 'Browse Templates' }).click();
  const firstTemplate = page.locator('.template-card').first();
  await firstTemplate.click();
  await expect(page.locator('text=Continue').first()).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'test-results/manual-07-existing-template-flow.png' });
});

test('regression: existing upload-your-own flow still works', async ({ page }) => {
  await page.goto('/create');
  await page.locator('.picker-card').filter({ hasText: 'Birthday' }).click();
  await page
    .locator('.design-card')
    .filter({ hasText: 'Upload Your Own Design' })
    .getByRole('button', { name: 'Choose This' })
    .click();
  await expect(page.getByText(/Choose a file|Upload/).first()).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'test-results/manual-08-existing-upload-flow.png' });
});
