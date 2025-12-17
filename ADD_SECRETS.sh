#!/bin/bash

# ============================================================================
# Add Secrets to Open Camp Cloudflare Worker
# ============================================================================

echo "🔐 Adding secrets to Cloudflare Worker..."
echo ""

cd /Users/ashes/Projects/eighty7/open_camp

# ============================================================================
# RESEND API KEY (for email notifications)
# ============================================================================

echo "📧 Step 1: Resend API Key"
echo "----------------------------------------"
echo "Get your Resend API key from: https://resend.com/api-keys"
echo ""
echo "Adding RESEND_API_KEY..."
npx wrangler secret put RESEND_API_KEY

echo ""
echo "✅ Resend API key added!"
echo ""

# ============================================================================
# STRIPE SECRET KEY (for payments)
# ============================================================================

echo "💳 Step 2: Stripe Secret Key"
echo "----------------------------------------"
echo "Get your Stripe secret key from: https://dashboard.stripe.com/apikeys"
echo "Use the SECRET KEY (starts with sk_test_ or sk_live_)"
echo ""
echo "Adding STRIPE_SECRET_KEY..."
npx wrangler secret put STRIPE_SECRET_KEY

echo ""
echo "✅ Stripe secret key added!"
echo ""

# ============================================================================
# STRIPE WEBHOOK SECRET (optional - for production webhooks)
# ============================================================================

echo "🔔 Step 3: Stripe Webhook Secret (Optional)"
echo "----------------------------------------"
echo "Only needed if you're setting up Stripe webhooks"
echo "Get from: Stripe Dashboard > Webhooks > Add endpoint"
echo ""
read -p "Do you want to add webhook secret now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Adding STRIPE_WEBHOOK_SECRET..."
    npx wrangler secret put STRIPE_WEBHOOK_SECRET
    echo ""
    echo "✅ Webhook secret added!"
else
    echo "⏭️  Skipping webhook secret (you can add it later)"
fi

echo ""
echo "============================================================================"
echo "✨ All secrets configured!"
echo "============================================================================"
echo ""
echo "📝 Summary:"
echo "  ✅ RESEND_API_KEY - for sending emails"
echo "  ✅ STRIPE_SECRET_KEY - for processing payments"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  ✅ STRIPE_WEBHOOK_SECRET - for webhook verification"
fi
echo ""
echo "🚀 Next steps:"
echo "  1. Redeploy your Worker: npm run deploy:worker"
echo "  2. Add Stripe publishable key to Pages (see below)"
echo ""
echo "📱 For Stripe Publishable Key (Frontend):"
echo "  Go to: https://dash.cloudflare.com/dcdd49ae1196504c4cb909eeab9ed21c/pages/view/open-camp/settings/environment-variables"
echo "  Add variable: VITE_STRIPE_PUBLISHABLE_KEY"
echo "  Value: Your pk_test_... or pk_live_... key"
echo ""

