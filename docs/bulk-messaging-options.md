# Bulk Messaging Options — US + India

## TL;DR Recommendation

| Channel | Provider | Why |
|---------|----------|-----|
| **Email** | AWS SES | $0.10/1,000 — cheapest at any scale |
| **SMS (India)** | MSG91 | ~₹0.16–0.20/SMS ($0.002) — India-specialized, DLT registered |
| **SMS (US)** | Plivo | ~$0.0050/SMS — consistently cheaper than Twilio |
| **WhatsApp** | Meta Cloud API (direct) | ~$0.0042–0.0066/conversation — skip the BSP markup |

---

## Email

| Provider | Price per 1,000 | Free Tier | Notes |
|----------|----------------|-----------|-------|
| **AWS SES** | $0.10 | 62k/month if sending from EC2/Lambda | Best price at scale; needs verified domain |
| Resend | ~$0.20 (after 3k/month free) | 3,000/month | Great DX, good deliverability |
| Mailgun | ~$0.80 | 100/day | Good deliverability tools |
| SendGrid | ~$0.40 (Essentials $19.95/50k) | 100/day | Widely used, reliable |

**Pick: AWS SES** — $0.10/1,000 is unbeatable. Downside: requires domain verification and a bit of setup. If you want zero-config, use Resend.

---

## SMS — India

India SMS requires **DLT (Distributed Ledger Technology) registration** — mandatory for commercial messages since 2021. Any provider you use must be DLT-compliant.

| Provider | Price/SMS (India) | DLT | Notes |
|----------|------------------|-----|-------|
| **MSG91** | ₹0.16–0.30 (~$0.002–0.004) | Yes | India-first, excellent delivery rates, OTP support |
| Plivo | ~₹0.35 (~$0.004) | Yes | Reliable, good API |
| AWS SNS | ~$0.00922 (~₹0.77) | Partial | High price for India, limited DLT support |
| Twilio | ~$0.0075 (~₹0.62) | Limited | Expensive for India, DLT compliance is patchy |
| Exotel | ₹0.20–0.50 | Yes | India-focused, great support, slightly pricier |
| TextLocal (now Vonage) | ₹0.18–0.25 | Yes | Good for bulk, decent rates |

**Pick: MSG91** — cheapest DLT-compliant provider for India. Has a transactional + promotional split. OTP SMS is ~₹0.16.

DLT registration: ~₹5,000 one-time, takes 3–7 days via TRAI portal or through MSG91 directly.

---

## SMS — US

| Provider | Price/SMS (US) | Notes |
|----------|---------------|-------|
| **Plivo** | $0.0050 | Consistently cheaper than Twilio, same reliability |
| AWS SNS | $0.00645 | Good price, limited 2-way capabilities |
| Twilio | $0.0079 | Most features but most expensive |
| Vonage | $0.0065 | Mid-range |
| Bandwidth | $0.0040–0.0045 | Cheapest but enterprise-focused, harder onboarding |

**Pick: Plivo** — near-Bandwidth prices with a developer-friendly API, no enterprise contract needed.

---

## WhatsApp — Best Channel for India

WhatsApp has 500M+ users in India. For event invites, WhatsApp > SMS.

Meta charges per **conversation** (24-hour window), not per message.

| Message Type | India (per conv) | US (per conv) |
|-------------|-----------------|---------------|
| Utility (transactional) | $0.0066 | $0.0042 |
| Marketing | $0.0132 | $0.0250 |
| Authentication (OTP) | $0.0066 | $0.0335 |

### Access options

| Option | Cost | Notes |
|--------|------|-------|
| **Meta Cloud API (direct)** | Only Meta's per-conversation fee | Free to use, but need Facebook Business verification |
| Twilio WhatsApp | Meta fee + Twilio markup (~$0.005 extra/conv) | Easiest setup, most expensive |
| Wati | Meta fee + $49/month | Good dashboard for bulk sends |
| Interakt | Meta fee + ₹999–2999/month | India-focused, good for events/ecommerce |
| 360dialog | Meta fee + €5/month | Developer-friendly, low markup |

**Pick: Meta Cloud API directly** — zero markup. Slightly more setup (need Business Manager + webhook), but saves money at scale.

---

## Combined Strategy (Recommended)

```
Transactional invites (receipts, confirmations):
  → Email via AWS SES ($0.10/1,000)

Event invites to Indian guests:
  → WhatsApp via Meta Cloud API ($0.0066/conversation)
  → Fallback: MSG91 SMS (₹0.16/SMS)

Event invites to US guests:
  → Email via AWS SES
  → Fallback: Plivo SMS ($0.0050/SMS)
```

### Cost example: 1,000 event invites

| Route | Cost |
|-------|------|
| Email (1,000) via SES | $0.10 |
| WhatsApp (1,000) via Meta API | $6.60 (India) / $4.20 (US) |
| SMS (1,000) via MSG91 | ~$2.00 (India) |
| SMS (1,000) via Plivo | $5.00 (US) |

---

## Implementation Notes

### Current backend
`backend/notifications/service.py` already has SendGrid + Twilio hooks. To switch:
- **SES**: replace SendGrid with `boto3` (`ses.send_email(...)`) — no new dependency if already using AWS
- **Plivo**: `pip install plivo`, same interface as Twilio
- **MSG91**: REST API, no SDK needed (`POST https://api.msg91.com/api/v5/flow/`)
- **WhatsApp Meta API**: `POST https://graph.facebook.com/v18.0/{phone_number_id}/messages` with Bearer token

### Environment variables to add
```
# SES
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_REGION=us-east-1
SES_FROM_EMAIL=noreply@momentsandmemories.com

# MSG91 (India SMS)
MSG91_API_KEY=
MSG91_SENDER_ID=      # 6-char DLT-registered sender ID

# Plivo (US SMS)
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=
PLIVO_FROM_NUMBER=

# WhatsApp Meta Cloud API
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
META_WHATSAPP_TEMPLATE_ID=   # pre-approved template for invites
```

---

## Microservices Note

**Not needed yet.** Current FastAPI monolith on Vercel serverless scales horizontally per request automatically. Extract a dedicated notification service only if:
- Sending volume exceeds ~100k/day (queue + worker pattern needed)
- Notification retries + dead-letter queues are required
- Team ownership splits (notifications team vs events team)

At current scale: keep it in `backend/notifications/`.
