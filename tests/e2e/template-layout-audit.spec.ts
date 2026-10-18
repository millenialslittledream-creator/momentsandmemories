import { expect, test } from '@playwright/test';

const EVENT_TYPES = [
  'marriage',
  'birthday',
  'babyshower',
  'bridetobe',
  'genderreveal',
  'housewarming',
] as const;

test('all invitation templates keep realistic long values inside their artwork', async ({ page }) => {
  test.setTimeout(120_000);
  let totalAudited = 0;

  for (const eventType of EVENT_TYPES) {
    await page.goto(`/__baby-preview?set=all&event=${eventType}&long=1&grid=1&w=260`);
    await expect(page.getByText(/Template tuning \(\d+\)/)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const result = await page.locator('[data-template-card]').evaluateAll((cards) => {
      const issues: string[] = [];
      for (const card of cards) {
        const id = card.getAttribute('data-template-card') || 'unknown';
        const renderer = card.querySelector<HTMLElement>('[data-template-render]');
        if (!renderer) {
          issues.push(`${id}: renderer missing`);
          continue;
        }
        const bounds = renderer.getBoundingClientRect();
        const image = renderer.querySelector<HTMLImageElement>('img');
        if (!image?.complete || !image.naturalWidth) issues.push(`${id}: artwork did not load`);

        const fields = renderer.querySelectorAll<HTMLElement>('[data-template-field], [data-template-event-field]');
        for (const field of fields) {
          const fieldBounds = field.getBoundingClientRect();
          const key = field.dataset.templateField || field.dataset.templateEventField || 'unknown-field';
          if (
            fieldBounds.left < bounds.left - 1 ||
            fieldBounds.right > bounds.right + 1 ||
            fieldBounds.top < bounds.top - 1 ||
            fieldBounds.bottom > bounds.bottom + 1
          ) {
            issues.push(`${id}/${key}: value crossed the artwork edge`);
          }
        }
      }
      return { count: cards.length, issues };
    });

    totalAudited += result.count;
    expect(result.count, `${eventType} should expose templates`).toBeGreaterThan(0);
    expect(result.issues, `${eventType} template fit failures`).toEqual([]);
  }

  expect(totalAudited).toBe(100);
});
