# 💳 Stripe Integration Setup Guide

## Overview
Open Camp now supports payments via Stripe with Apple Pay and Google Pay built-in!

## ✅ What's Been Built

### Database (Complete)
- ✅ `camps` table - Multiple camp sessions
- ✅ `pricing_items` table - Flexible pricing & add-ons
- ✅ `registration_items` - Track purchased items per registration
- ✅ Payment tracking fields in `registrations`

### Backend API (Complete)
- ✅ **Camps API**: GET, POST, PUT, DELETE `/api/camps`
- ✅ **Pricing API**: GET, POST, PUT, DELETE `/api/pricing`
- ✅ **Payment Intent**: POST `/api/create-payment-intent`
- ✅ **Enhanced Registration**: Updated with payment support

### Frontend (In Progress)
- 🚧 Admin UI for camps management
- 🚧 Admin UI for pricing management
- 🚧 Registration form with Stripe checkout
- 🚧 Camp selection interface

## 🔑 Required: Stripe API Keys

### Step 1: Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Complete account setup
3. Activate your account

### Step 2: Get API Keys
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable Key** (starts with `pk_test_` for test mode)

### Step 3: Set Keys in Cloudflare

**For Worker (Backend):**
```bash
cd /Users/ashes/Projects/eighty7/open_camp
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your sk_test_... key when prompted
```

**For Pages (Frontend - Environment Variable):**
1. Go to Cloudflare Dashboard → Pages → open-camp → Settings → Environment Variables
2. Add variable: `VITE_STRIPE_PUBLISHABLE_KEY`
3. Value: Your `pk_test_...` key
4. Save

### Step 4: Enable Payment Methods
1. In Stripe Dashboard, go to: Settings → Payment Methods
2. Enable:
   - ✅ Card payments
   - ✅ Apple Pay
   - ✅ Google Pay
   - ✅ Link (Stripe's one-click checkout)

### Step 5: Set Webhook (Optional - for production)
```bash
# Create webhook secret
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your webhook signing secret from Stripe
```

## 💰 Pricing Configuration

### Currency
Default: GBP (£). To change, update in worker:
```typescript
const currency = 'gbp' // or 'usd', 'eur', etc.
```

### Test Mode
- Use test keys (`sk_test_...` and `pk_test_...`) during development
- Test cards: https://stripe.com/docs/testing#cards
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

### Production Mode
1. Activate your Stripe account fully
2. Replace test keys with live keys (`sk_live_...` and `pk_live_...`)
3. Set up webhook endpoints
4. Enable required payment methods

## 🎯 Sample Data Already Created

The database already has:
- **1 Camp**: "Summer Camp 2025" (July 1-5, ages 5-15, 20 spots)
- **5 Pricing Items**:
  - Camp Fee: £150 (base_fee, required)
  - Sibling Discount: -£15 (discount)
  - Lunch Package: £25 (add_on)
  - Extended Hours: £30 (add_on)
  - Camp T-Shirt: £12 (add_on)

## 🔐 Security Notes

- ✅ Secret keys never exposed to frontend
- ✅ Payment intents created server-side
- ✅ Amount validation on backend
- ✅ Webhook signature verification
- ✅ CORS properly configured

## 📱 Apple Pay / Google Pay

These work automatically with Stripe's Payment Element:
- Apple Pay: Available on Safari/iOS when user has cards in Apple Wallet
- Google Pay: Available on Chrome/Android when user has cards in Google Pay
- No extra configuration needed!

## 🧪 Testing Workflow

1. Visit registration form
2. Select a camp
3. Choose pricing items
4. See live price calculation
5. Click "Pay Now"
6. Stripe checkout modal opens
7. Use test card `4242 4242 4242 4242`
8. Complete registration

## 📊 Tracking Payments

View in Stripe Dashboard:
- All payments: https://dashboard.stripe.com/payments
- Customer data automatically synced
- Metadata includes: camp_id, email, child_name

## 🆘 Troubleshooting

**"Stripe not configured" error:**
- Ensure `STRIPE_SECRET_KEY` is set via `wrangler secret put`

**Payment button doesn't appear:**
- Check `VITE_STRIPE_PUBLISHABLE_KEY` in Pages environment variables

**Apple/Google Pay not showing:**
- These only appear when the browser/device supports them
- Test on actual iOS/Android devices

## Next Steps

1. Get Stripe keys (instructions above)
2. Set secrets in Cloudflare
3. I'll finish building the UI components
4. Test the complete flow
5. Deploy!

