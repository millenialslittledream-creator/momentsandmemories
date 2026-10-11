# End-to-end browser test checklist

Run this on **staging** (see `staging-setup.md`) or, for a quick smoke test, on production with
throw-away data you delete afterwards. Button labels may differ slightly from what is written here;
the routes and expected results are what matter. Tick each box and note anything that differs.

**You need:** two test accounts, **Alice** and **Bob** (create them yourself on `/sign-up`; use
`you+alice@gmail.com` style addresses), two browsers or one normal + one private window, a phone
(for the QR step), 2 small JPG/PNG photos, one MP4 under 50 MB, one `.svg` file, one `.txt` file
renamed to `.png`. Keep the browser DevTools **Network** tab open on the Alice window.

Tip: a failed step is only a bug if the expected result is not what you see. Copy the failing request's
URL, status code and response body from the Network tab into the issue.

---

## 1. Accounts and sign-in
| # | Steps | Expected |
|---|-------|----------|
| 1.1 | `/sign-up` as Alice with email + password (try an 8+ character password) | "verify your email" screen; confirmation email arrives; link lands you signed in |
| 1.2 | Sign out, `/sign-in` with wrong password | Clear error, no crash, not signed in |
| 1.3 | Sign in with the right password | Lands on `/` (or the page you came from) |
| 1.4 | Click **Continue with Google** on `/sign-in` | Google's popup (not a full-page redirect); text does **not** mention `supabase.co`; you land signed in |
| 1.5 | `/forgot-password`, then use the emailed link on `/reset-password` | Password changes; old password no longer works |
| 1.6 | Visit `/dashboard` while signed out | Redirected to sign-in, then back after login |
| 1.7 | Visit `/admin` | Asks for the admin secret; a wrong secret is rejected; 10 wrong tries in a row then says "too many attempts" |

## 2. Create an event (as Alice)
| # | Steps | Expected |
|---|-------|----------|
| 2.1 | `/create`, pick a template, fill title/date/location | Live preview updates |
| 2.2 | Leave halfway, reload the page | Offered to resume your draft |
| 2.3 | Finish the flow, publish (use the free option) | Event appears in `/dashboard`; share link `/event/<id>` works in a private window **without** signing in |
| 2.4 | Edit the event title in the dashboard | Change shows on the public page |
| 2.5 | Try changing status to something invalid (DevTools → resend `PATCH /api/events/<id>` with `{"status":"x"}`) | `400 Invalid status` |

## 3. Guests
| # | Steps | Expected |
|---|-------|----------|
| 3.1 | Add 3 guests manually (names, emails, phone numbers in `+1…` format) | All three listed |
| 3.2 | Add guests by **QR import**: scan the QR with your phone, share 2 contacts | Contacts appear on the dashboard within a few seconds (Realtime or the 2-second fallback) |
| 3.3 | Import a `.vcf` file on the phone page | Contacts imported; a file over 1 MB is refused |
| 3.4 | Delete one guest | Gone from the list and after refresh |
| 3.5 | Try pasting 600 contacts | Refused (limit is 500 per request) |

## 4. RSVP (as a guest, private window, signed out)
| # | Steps | Expected |
|---|-------|----------|
| 4.1 | Open `/rsvp/<eventId>/<inviteeId>` for guest 1 | Shows the event + the guest's name |
| 4.2 | Accept with 2 adults + 1 child and meal choices (if enabled) | Success message; dashboard analytics update live without refresh |
| 4.3 | Change to Declined | Counts and meal totals reset |
| 4.4 | Meal quantities that don't add up to the party size | Clear error, nothing saved |
| 4.5 | Party size 100000, or a 5,000-character message | Rejected |
| 4.6 | Open a made-up invitee id | "Not found" |
| 4.7 | Send a message to the host from the RSVP page | Appears in the host's messages; 11 messages in one minute → rate-limited |

## 5. Photo gallery
| # | Steps | Expected |
|---|-------|----------|
| 5.1 | `/gallery/<eventId>` signed out: upload a JPG and a PNG | Accepted (pending approval) |
| 5.2 | Upload the `.svg` file | Refused (only JPEG, PNG, GIF, WebP) |
| 5.3 | Upload the `.txt` renamed to `.png` | Refused |
| 5.4 | Upload an image over 10 MB | Refused |
| 5.5 | 11 uploads within a minute | The 11th is rate-limited |
| 5.6 | Alice: open gallery moderation, approve one photo, delete another | Approved photo is visible publicly; deleted photo's URL stops working |

## 6. Media library (Alice)
| # | Steps | Expected |
|---|-------|----------|
| 6.1 | Upload a photo and the MP4 | Both appear in the library |
| 6.2 | Upload `.txt` renamed to `.png`, and the `.svg` | Refused |
| 6.3 | Delete an upload | Removed |

## 7. Messaging and bulk send (Alice)
| # | Steps | Expected |
|---|-------|----------|
| 7.1 | Send a host message in the event | Shows with Alice as sender |
| 7.2 | Bulk email to the event's guests | Accepted; test inbox receives it; `{name}` is personalised; any `<b>` or links you type show as plain text |
| 7.3 | Bulk SMS (only after Telnyx is set up) to your own phone | Arrives; a `+44…` or malformed number is refused |
| 7.4 | Bulk send with more than 200 recipients | Refused |
| 7.5 | 11 bulk sends in an hour | Rate-limited |

## 8. Websites, books, templates
| # | Steps | Expected |
|---|-------|----------|
| 8.1 | Build an event website, publish, open `/w/<slug>` signed out | Renders |
| 8.2 | Reuse a slug that exists | "Link already taken" |
| 8.3 | Premium site → `/site/<slug>` | Renders |
| 8.4 | Unpublish | Public URL returns not-found |
| 8.5 | Customise a template (font/colour/position), save, reopen | Settings kept |

## 9. Shop
| # | Steps | Expected |
|---|-------|----------|
| 9.1 | `/shop` filters, sort, price range | Work |
| 9.2 | Add item, checkout | Order created as "pending"; stock decreases by the quantity |
| 9.3 | DevTools → resend `POST /api/shop/orders` with quantity `-5` or `0` | `422` |
| 9.4 | Order more than the stock | "Out of stock"; stock unchanged afterwards |
| 9.5 | **Known gap:** the card form never charges anything | Confirm and note: a real payment provider is still needed |

## 10. Security checks (Alice + Bob)
Do these with both accounts. Alice owns the event; Bob must get **nothing**.

| # | Steps (as Bob, using DevTools "Copy as fetch" with Bob's token on Alice's ids) | Expected |
|---|-------|----------|
| 10.1 | `GET /api/events/<AliceEvent>/invitees` | `404` |
| 10.2 | `POST` / `DELETE` invitees on Alice's event | `404`, Alice's list unchanged |
| 10.3 | `GET` / `POST /api/messaging/events/<AliceEvent>/messages` | `404` |
| 10.4 | `POST /api/notifications/bulk-send` with Alice's `event_id` | `404`, nothing sent |
| 10.5 | `GET /api/events/<AliceEvent>`, `PATCH`, `DELETE` | `404` |
| 10.6 | `GET /api/qr/session/<AliceToken>` and `POST /api/qr/session?event_id=<AliceEvent>` | `404` |
| 10.7 | `GET /api/gallery/<AliceEvent>` and the approve/delete endpoints | `404` |
| 10.8 | `GET /api/shop/orders/<AliceOrder>` | `404` |
| 10.9 | Signed out: any of the above | `401` |
| 10.10 | `GET /api/docs`, `/api/openapi.json`, `POST /api/auth/login` | `404` |
| 10.11 | Response headers of any `/api/*` call | `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-Frame-Options` |
| 10.12 | Supabase REST with the **anon key** only: `GET <supabase-url>/rest/v1/users?select=*` and `/rest/v1/event_invitees?select=*` | `401`/`403` or empty — never rows |
| 10.13 | Same for `/rest/v1/logs`, `/rest/v1/event_messages`, `/rest/v1/rpc/sum_revenue` | Denied |
| 10.14 | List the storage bucket as anon | Not listable (files still open by exact URL) |

## 11. Realtime and polling
| # | Steps | Expected |
|---|-------|----------|
| 11.1 | Dashboard open as Alice; a guest RSVPs in another window | Analytics refresh on their own within the polling interval (a few seconds to a minute). Realtime is only enabled for QR sessions, so this is polling, not instant |
| 11.2 | QR import (3.2) with the Realtime connection blocked in DevTools | Falls back to the 2-second polling and still delivers the contacts |

## 12. Responsiveness and basics
- Repeat 1.3, 2.3, 4.2 and 5.1 on a phone-width window (375 px) and on a real phone.
- Console: no red errors on `/`, `/create`, `/dashboard`, `/sign-up`.
- Refresh on a deep link (`/dashboard`, `/event/<id>`) works (no 404 page).

## Result
Record: date, environment (staging/prod), tester, failing step numbers with request URL / status /
response. Anything in section 10 that is not the expected status is a **security bug**: stop and report
it before continuing.
