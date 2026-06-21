import { test, expect } from '@playwright/test';

test.describe('Public event website (/w/:slug)', () => {
  test('shows not-found state for a slug that does not exist', async ({ page }) => {
    await page.goto('/w/this-slug-does-not-exist-123');
    await expect(page.getByText(/not available|not been published|Page not found/)).toBeVisible();
  });

  test('renders a mocked published site with its sections', async ({ page }) => {
    await page.route('**/public/websites/alex-and-sam', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'site-1',
          slug: 'alex-and-sam',
          theme: { primaryColor: '#9cb092', fontFamily: 'Cormorant Garamond' },
          sections: [
            { id: 's1', type: 'hero', content: { heading: 'Alex & Sam', subtitle: 'are getting married', date: 'June 21, 2026' } },
            {
              id: 's2',
              type: 'schedule',
              content: { heading: 'Schedule', items: [{ name: 'Ceremony', time: '4:00 PM', location: 'Garden Hall' }] },
            },
            {
              id: 's3',
              type: 'faq',
              content: { heading: 'FAQ', items: [{ question: 'What should I wear?', answer: 'Garden formal.' }] },
            },
          ],
          event: { title: 'Alex & Sam Wedding', event_date: '2026-06-21', event_time: null, location: 'Garden Hall' },
        }),
      });
    });

    await page.goto('/w/alex-and-sam');
    await expect(page.getByRole('heading', { name: 'Alex & Sam' })).toBeVisible();
    await expect(page.getByText('are getting married')).toBeVisible();
    await expect(page.getByText('Ceremony')).toBeVisible();
    await expect(page.getByText('Garden Hall')).toBeVisible();
    await expect(page.getByText('What should I wear?')).toBeVisible();
  });
});

test.describe('Dashboard website-builder entry point (regression: still auth-gated)', () => {
  test('unauthenticated visit to /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });
});
