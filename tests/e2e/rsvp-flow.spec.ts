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
  await expect(page.getByRole('heading', { name: 'Asha & Ravi' })).toBeVisible();
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

test('shareable event link requires a name and submits configured RSVP fields', async ({ page }) => {
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
  await expect(page.getByRole('heading', { name: 'First, tell us your name' })).toBeVisible();
  const continueButton = page.getByRole('button', { name: /Continue to RSVP/ });
  await expect(continueButton).toBeDisabled();
  await page.getByLabel('Guest name *').fill('Maya Shah');
  await continueButton.click();

  await expect(page.getByText('Responding as Maya Shah')).toBeVisible();
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
    status: 'accepted',
    adults_count: 1,
    children_count: null,
    meal_preferences: { Vegetarian: 1 },
    dietary_requirements: 'Nut-free please',
    message: 'Looking forward to it',
  });
});
