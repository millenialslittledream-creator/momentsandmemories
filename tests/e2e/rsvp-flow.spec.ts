import { test, expect } from '@playwright/test';

const eventId = '11111111-1111-4111-8111-111111111111';
const inviteeId = '22222222-2222-4222-8222-222222222222';

test('guest allocates meals for every attendee and can update the RSVP', async ({ page }) => {
  let submitted: Record<string, unknown> | null = null;

  await page.route(`**/public/events/${eventId}/rsvp/${inviteeId}`, async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ invitee_id: inviteeId, status: 'accepted' }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        event: {
          id: eventId,
          title: 'Asha & Ravi',
          event_date: '2027-02-12',
          event_time: '18:00',
          location: 'Garden Hall',
          cover_image_url: null,
          template_id: 'wed-c1',
          form_data: { brideName: 'Asha', groomName: 'Ravi' },
          rsvp_enabled: true,
          rsvp_config: {
            enabled: true,
            responseOptions: { yes: true, no: true, maybe: false },
            collectGuestCount: true,
            collectKidsCount: true,
            collectFoodPreference: true,
            foodOptions: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Kids Meal'],
            collectAdditionalInfo: true,
            childAgeCutoff: 10,
          },
        },
        invitee: {
          id: inviteeId,
          name: 'Maya',
          email: 'maya@example.com',
          rsvp_status: 'pending',
          rsvp_message: null,
          dietary_requirements: null,
          party_size: null,
          kids_count: null,
          food_preference: null,
          meal_preferences: {},
        },
      }),
    });
  });

  await page.goto(`/rsvp/${eventId}/${inviteeId}`);
  await expect(page.getByRole('heading', { name: "You are invited to Asha and Ravi's wedding." })).toBeVisible({ timeout: 20_000 });
  await page.getByText('Yes, I’ll be there!').click();
  await expect(page.getByText('Under 10 years')).toBeVisible();

  await page.getByRole('button', { name: 'Increase Adults' }).click();
  await page.getByRole('button', { name: 'Increase Children' }).click();
  await expect(page.getByText('0 / 3')).toBeVisible();

  const submit = page.getByRole('button', { name: /Confirm RSVP/ });
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Vegetarian', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Non-Vegetarian', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Kids Meal', exact: true }).check();
  await expect(page.getByText('3 / 3')).toBeVisible();
  await expect(page.getByText('All attendees have a meal preference.')).toBeVisible();
  await page.getByLabel('Other / Special dietary needs (optional)').fill('One gluten-free vegetarian meal');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('Your RSVP has been recorded')).toBeVisible();
  expect(submitted).toMatchObject({
    status: 'accepted',
    adults_count: 2,
    children_count: 1,
    meal_preferences: { Vegetarian: 1, 'Non-Vegetarian': 1, 'Kids Meal': 1 },
    dietary_requirements: 'One gluten-free vegetarian meal',
  });

  await page.getByRole('button', { name: 'Update RSVP' }).click();
  await expect(page.getByText('Number of attendees')).toBeVisible();
});

test('shareable event link requires contact details and submits configured RSVP fields', async ({ page }) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route(`**/public/events/${eventId}/book`, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.route(`**/public/events/${eventId}/rsvp`, async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ invitee_id: inviteeId, status: 'accepted' }) });
  });
  await page.route(`**/public/events/${eventId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: eventId,
        title: 'Garden Celebration',
        description: 'Please RSVP below.',
        event_date: '2027-02-12',
        event_time: '18:00',
        location: 'Garden Hall',
        cover_image_url: null,
        rsvp_enabled: true,
        invitee_count: 0,
        template_id: null,
        form_data: null,
        customization: null,
        rsvp_config: {
          enabled: true,
          responseOptions: { yes: true, no: true, maybe: false },
          collectGuestCount: true,
          collectKidsCount: false,
          collectFoodPreference: true,
          foodOptions: ['Vegetarian', 'Vegan'],
          collectAdditionalInfo: true,
          childAgeCutoff: 12,
        },
      }),
    });
  });

  await page.goto(`/event/${eventId}`);
  await expect(page.getByRole('heading', { name: 'First, your contact details' })).toBeVisible({ timeout: 20_000 });
  const continueButton = page.getByRole('button', { name: /Continue to RSVP/ });
  await expect(continueButton).toBeDisabled();
  await page.getByLabel('Guest name *').fill('Maya Shah');
  await expect(continueButton).toBeDisabled();
  await page.getByLabel('Phone number *').fill('+91 98765 43210');
  await continueButton.click();

  await expect(page.getByText(/Responding as Maya Shah/)).toBeVisible();
  await page.getByText('Yes, I’ll be there!').click();
  await expect(page.getByText('Adults')).toBeVisible();
  await expect(page.getByText('Children')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Vegan' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Kids Meal' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Vegetarian' }).check();
  await page.getByLabel('Other / Special dietary needs (optional)').fill('Nut-free please');
  await page.getByLabel('Message to host (optional)').fill('Looking forward to it');
  await page.getByRole('button', { name: /Confirm RSVP/ }).click();

  await expect(page.getByText('Your RSVP has been recorded for Maya Shah')).toBeVisible();
  expect(submitted).toMatchObject({
    name: 'Maya Shah',
    phone: '+91 98765 43210',
    status: 'accepted',
    adults_count: 1,
    children_count: null,
    meal_preferences: { Vegetarian: 1 },
    dietary_requirements: 'Nut-free please',
    message: 'Looking forward to it',
  });
});

test('public invitation is the first view and opens as a full preview', async ({ page }) => {
  const previewEventId = '33333333-3333-4333-8333-333333333333';
  const invitationImage = 'data:image/svg+xml,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%229%22 height=%2216%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%239cb092%22%2F%3E%3C%2Fsvg%3E';

  await page.route(`**/public/events/${previewEventId}/book`, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.route(`**/public/events/${previewEventId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: previewEventId,
        title: 'Preview Celebration',
        description: 'A celebration preview.',
        event_date: '2027-05-20',
        event_time: '18:00',
        location: 'Garden Hall',
        cover_image_url: invitationImage,
        rsvp_enabled: true,
        invitee_count: 0,
        template_id: null,
        form_data: null,
        customization: null,
        rsvp_config: { enabled: true, responseOptions: { yes: true, no: true, maybe: false }, collectGuestCount: true, collectKidsCount: false, collectFoodPreference: false, collectAdditionalInfo: true, childAgeCutoff: 12 },
      }),
    });
  });

  await page.goto(`/event/${previewEventId}`);
  await expect(page.getByTestId('public-invitation')).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/public-event-invitation.png' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.reload();
  await expect(page.getByTestId('public-invitation')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('button', { name: /Scroll down to RSVP/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share Event' })).toHaveCount(0);

  await page.getByTestId('public-invitation').click();
  await expect(page.getByTestId('invitation-lightbox')).toBeVisible();
  await page.screenshot({ path: 'test-results/release-route-audit/desktop/public-event-invitation-lightbox.png' });
  const preview = page.getByTestId('invitation-lightbox').locator('[data-preserve-theme]').first();
  const previewBox = await preview.boundingBox();
  const viewport = page.viewportSize();
  expect(previewBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(previewBox!.y).toBeGreaterThanOrEqual(0);
  expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(viewport!.height);
  await page.getByRole('button', { name: 'Close invitation preview' }).click();
  await expect(page.getByTestId('invitation-lightbox')).toHaveCount(0);
});

test('Lotus Palace restores its invitation copy and readable key details', async ({ page }) => {
  const weddingEventId = '44444444-4444-4444-8444-444444444444';
  await page.route(`**/public/events/${weddingEventId}/book`, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.route(`**/public/events/${weddingEventId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: weddingEventId,
      title: 'Lavanya & Jeevan',
      description: null,
      event_date: '2027-02-14',
      event_time: '18:30',
      location: 'The Grand Palace, Jaipur, Rajasthan',
      cover_image_url: null,
      rsvp_enabled: true,
      invitee_count: 0,
      template_id: 'wed-c1',
      form_data: {
        brideName: 'Lavanya',
        groomName: 'Jeevan',
        eventDate: '2027-02-14',
        eventTime: '18:30',
        venue: 'The Grand Palace, Jaipur, Rajasthan',
      },
      customization: null,
      rsvp_config: { enabled: true, responseOptions: { yes: true, no: true, maybe: false }, collectGuestCount: true, collectKidsCount: false, collectFoodPreference: false, collectAdditionalInfo: true, childAgeCutoff: 12 },
    }),
  }));

  await page.goto(`/event/${weddingEventId}`);
  await expect(page.getByTestId('invitation-heading')).toHaveText(
    "You are invited to Lavanya and Jeevan's wedding.",
  );
  await expect(page.getByTestId('invitation-heading-names')).toHaveText('Lavanya and Jeevan');
  await expect(page.getByTestId('invitation-heading-names')).toHaveCSS('font-style', 'normal');
  const headingFonts = await page.getByTestId('invitation-heading').evaluate((heading) => ({
    sentence: getComputedStyle(heading).fontFamily,
    names: getComputedStyle(heading.querySelector('[data-testid="invitation-heading-names"]')!).fontFamily,
  }));
  expect(headingFonts.names).not.toBe(headingFonts.sentence);
  const invitation = page.getByTestId('public-invitation');
  await expect(invitation.getByText('INVITE YOU TO CELEBRATE', { exact: false })).toBeVisible();
  await expect(invitation.locator('[data-template-field="brideName"]')).toHaveText('Lavanya');
  await expect(invitation.locator('[data-template-field="groomName"]')).toHaveText('Jeevan');
  await expect(invitation.locator('[data-template-field="venue"]')).toContainText('The Grand Palace');

  const sizes = await invitation.evaluate((node) => ({
    bride: parseFloat(getComputedStyle(node.querySelector('[data-template-field="brideName"]')!).fontSize),
    date: parseFloat(getComputedStyle(node.querySelector('[data-template-field="eventDate"]')!).fontSize),
    venue: parseFloat(getComputedStyle(node.querySelector('[data-template-field="venue"]')!).fontSize),
  }));
  expect(sizes.bride).toBeGreaterThan(25);
  expect(sizes.date).toBeGreaterThan(7);
  expect(sizes.venue).toBeGreaterThan(8);

  await page.screenshot({ path: 'test-results/release-route-audit/desktop/lotus-palace-public.png', fullPage: true });
});
