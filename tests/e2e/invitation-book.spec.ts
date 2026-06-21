import { test, expect } from '@playwright/test';

const mockPublicEvent = {
  id: 'event-1',
  title: 'Alex & Sam Wedding',
  description: 'Join us!',
  event_date: '2026-06-21',
  event_time: null,
  location: 'Garden Hall',
  cover_image_url: null,
  rsvp_enabled: true,
  invitee_count: 12,
};

test.describe('Invitation book on the public event page', () => {
  test('shows no book button when there is no book for the event', async ({ page }) => {
    await page.route('**/public/events/event-1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPublicEvent) });
    });
    await page.route('**/public/events/event-1/book', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Book not found' }) });
    });

    await page.goto('/event/event-1');
    await expect(page.getByRole('heading', { name: 'Alex & Sam Wedding' })).toBeVisible();
    await expect(page.getByText('View Invitation Book')).not.toBeVisible();
  });

  test('opens the page-turn book viewer when a published book exists', async ({ page }) => {
    await page.route('**/public/events/event-1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPublicEvent) });
    });
    await page.route('**/public/events/event-1/book', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'book-1',
          event_id: 'event-1',
          title: 'Alex & Sam Wedding',
          published: true,
          pages: [
            { id: 'p1', image_url: '/test-fixtures/page1.png' },
            { id: 'p2', image_url: '/test-fixtures/page2.png' },
          ],
        }),
      });
    });

    await page.goto('/event/event-1');
    await expect(page.getByText('View Invitation Book')).toBeVisible();
    await page.getByText('View Invitation Book').click();

    const modal = page.getByTestId('book-viewer-modal');
    await expect(modal).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/manual-11-book-viewer.png' });

    await page.getByLabel('Close book').click();
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Book builder entry point (regression: still auth-gated)', () => {
  test('unauthenticated visit to /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });
});
