import { test, expect } from '@playwright/test';

const mockEvent = {
  id: 'event-1',
  title: 'Alex & Sam Wedding',
  description: null,
  event_date: '2026-06-21',
  event_time: null,
  location: 'Garden Hall',
  cover_image_url: null,
  rsvp_enabled: true,
  invitee_count: 12,
};

test.describe('Guest photo gallery upload page', () => {
  test('shows not-available state for a missing event', async ({ page }) => {
    await page.route('**/public/events/event-404', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Event not found or not published' }) });
    });
    await page.goto('/gallery/event-404');
    await expect(page.getByText('This event is not available')).toBeVisible();
  });

  test('shows the event title and empty state with no photos yet', async ({ page }) => {
    await page.route('**/public/events/event-1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockEvent) });
    });
    await page.route('**/public/events/event-1/gallery', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto('/gallery/event-1');
    await expect(page.getByRole('heading', { name: 'Alex & Sam Wedding' })).toBeVisible();
    await expect(page.getByText('No photos yet')).toBeVisible();
  });

  test('requires a name before uploading', async ({ page }) => {
    await page.route('**/public/events/event-1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockEvent) });
    });
    await page.route('**/public/events/event-1/gallery', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/gallery/event-1');
    await page.evaluate(() => localStorage.removeItem('guestGalleryName'));
    await page.reload();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add Photos' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/page1.png');

    await expect(page.getByText('Add your name first')).toBeVisible();
  });

  test('uploads a photo and shows it in the masonry gallery', async ({ page }) => {
    await page.route('**/public/events/event-1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockEvent) });
    });
    let uploaded = false;
    await page.route('**/public/events/event-1/gallery', async (route) => {
      if (route.request().method() === 'POST') {
        uploaded = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'photo-1', event_id: 'event-1', public_url: '/test-fixtures/page1.png', uploaded_by_name: 'Jamie', approved: true }),
        });
        return;
      }
      const photos = uploaded
        ? [{ id: 'photo-1', public_url: '/test-fixtures/page1.png', uploaded_by_name: 'Jamie', approved: true, created_at: new Date().toISOString() }]
        : [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(photos) });
    });

    await page.goto('/gallery/event-1');
    await page.getByPlaceholder('So the host knows who shared it').fill('Jamie');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add Photos' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/page1.png');

    await expect(page.getByText('Photo shared!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByAltText('Shared by Jamie')).toBeVisible();
  });
});

test.describe('Guest gallery moderation entry point (regression: still auth-gated)', () => {
  test('unauthenticated visit to /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });
});
