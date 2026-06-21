import { test, expect } from '@playwright/test';

test('visual snapshot of public website page', async ({ page }) => {
  await page.route('**/public/websites/visual-check', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'site-1',
        slug: 'visual-check',
        theme: { primaryColor: '#9cb092', fontFamily: 'Cormorant Garamond' },
        sections: [
          { id: 's1', type: 'hero', content: { heading: 'Alex & Sam', subtitle: 'are getting married', date: 'June 21, 2026' } },
          {
            id: 's2',
            type: 'schedule',
            content: { heading: 'Schedule', items: [{ name: 'Ceremony', time: '4:00 PM', location: 'Garden Hall' }] },
          },
          { id: 's3', type: 'rsvp', content: { heading: 'RSVP', body: 'Check your invitation for your personal link.' } },
        ],
        event: { title: 'Alex & Sam Wedding', event_date: '2026-06-21', event_time: null, location: 'Garden Hall' },
      }),
    });
  });
  await page.goto('/w/visual-check');
  await expect(page.getByRole('heading', { name: 'Alex & Sam' })).toBeVisible();
  await page.screenshot({ path: 'test-results/manual-10-public-website.png', fullPage: true });
});
