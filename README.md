# Payment Gateway — AI Prompt Engineering Pack

Stack: Cloudflare Workers + Stripe + Resend. Minimal, serverless, no server maintenance.

## Setup

### 1. Stripe Account
1. Sign up: https://stripe.com
2. Get **Test Publishable Key**: `pk_test_...`
3. Get **Test Secret Key**: `sk_test_...`
4. Go to Developers → Webhooks → Add endpoint:
   - URL: `https://payment-gateway.YOUR_SUBDOMAIN.workers.dev/webhook`
   - Events: `checkout.session.completed`
   - Copy **Signing Secret**: `whsec_...`

### 2. Resend (Email)
1. Sign up: https://resend.com
2. Verify domain: `fardanista.com` (or use resend default)
3. Get API key: `re_...`

### 3. Cloudflare
1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Create KV namespace: `wrangler kv:namespace create "SALES_KV"`
4. Copy KV ID to `wrangler.toml`
5. Set secrets:
   ```
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   wrangler secret put RESEND_API_KEY
   wrangler secret put DOWNLOAD_SECRET
   ```
6. Deploy: `wrangler deploy`
7. Host static files on Cloudflare Pages:
   - Upload `public/` folder
   - Or use `wrangler pages deploy public`

### 4. Update Frontend
In `public/index.html`, replace:
- `payment-worker.YOUR_SUBDOMAIN.workers.dev` → your actual worker URL
- Optionally update `success_url`/`cancel_url` in worker.js

## Architecture

```
Customer
  ↓
Checkout Page (static HTML)
  ↓
POST /checkout → Cloudflare Worker → Stripe Checkout
  ↓
Customer pays on Stripe Hosted Page
  ↓
Stripe Webhook POST /webhook
  ↓
Worker sends email via Resend
  ↓
Customer gets download link
```

## Production Checklist

- [ ] Switch Stripe keys to live (`pk_live_`, `sk_live_`)
- [ ] Update webhook URL to production domain
- [ ] Set up proper file hosting (Cloudflare R2 / S3) for ZIP
- [ ] Add download token expiry (e.g., 7 days)
- [ ] Sales dashboard (read from KV or connect to DB)
- [ ] Add analytics (Plausible / Fathom)
- [ ] Terms of Service & Privacy Policy pages

## Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| Cloudflare Workers | 100k req/day | $0.50/million |
| Cloudflare Pages | Unlimited | Free |
| Cloudflare KV | 100k reads/day | $0.50/million |
| Stripe | — | 2.9% + 30¢ per transaction |
| Resend | 100 emails/day | $0.0001/email |

**Total fixed cost: $0/month** (as long as you stay under free tiers)

## Known Limitations (DIY tradeoffs)

- **No tax calculation** — Stripe Tax or manual per-country
- **No subscription** — one-time purchases only (Stripe Billing for subscriptions)
- **Basic download protection** — signed URL tokens, not DRM
- **No dispute portal** — handle via Stripe Dashboard
- **Manual refunds** — via Stripe Dashboard or API
- **No affiliate tracking** — build later if needed

For a product doing <$1000/month, this is fine. For serious scale, migrate to Paddle/LemonSqueezy (they handle tax + compliance).
