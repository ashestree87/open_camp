# 🎯 Open Camp - Next Steps

## Immediate Actions (Required to Use)

### 1. Configure Stripe (5 minutes)

The payment system won't work until you add your Stripe keys:

```bash
# Frontend - create .env.local
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY" > .env.local

# Backend - set worker secret
npx wrangler secret put STRIPE_SECRET_KEY
# When prompted, enter: sk_test_YOUR_KEY
```

**Get your keys:** https://dashboard.stripe.com/test/apikeys

After adding keys, rebuild and redeploy:
```bash
npm run build
npx wrangler pages deploy dist --project-name=open-camp --branch=main
```

### 2. Set Admin Password (2 minutes)

```bash
chmod +x scripts/setup-admin.sh
./scripts/setup-admin.sh
```

Choose a strong password - this protects your admin dashboard!

### 3. Test Everything (10 minutes)

1. Visit your site: https://d1dcea61.open-camp.pages.dev
2. Try registering for "Summer Camp 2025"
3. Use test card: `4242 4242 4242 4242`
4. Login to `/admin` with your credentials
5. Create a new camp
6. View it on the registration form

## Optional but Recommended

### Configure Email Notifications

Get confirmation emails working:

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Verify your domain
3. Get API key
4. Set secret:
```bash
npx wrangler secret put RESEND_API_KEY
```

5. Update email addresses in `src/worker.ts`:
```typescript
const CLUB_EMAIL = 'your-actual-email@domain.com'
const FROM_EMAIL = 'Your Camp <noreply@yourdomain.com>'
```

6. Redeploy worker:
```bash
npx wrangler deploy src/worker.ts
```

### Set Up Custom Domain

Instead of `*.pages.dev`, use your own domain:

1. Go to Cloudflare Dashboard > Pages > open-camp
2. Click "Custom domains"
3. Add your domain (e.g., `register.yourcamp.com`)
4. Update ALLOWED_ORIGIN:
```bash
npx wrangler secret put ALLOWED_ORIGIN
# Enter: https://register.yourcamp.com
```

### Customize Branding

Make it yours:

1. **Logo:** Add to `public/` and update `src/components/Header.tsx`
2. **Colors:** Edit `tailwind.config.js` (search for `brand-*`)
3. **Fonts:** Change Google Fonts in `index.html`
4. **Title:** Update `index.html` and meta tags

## Before Going Live with Real Payments

### Switch to Production Stripe

1. Get live keys from Stripe dashboard
2. Update `.env.local` with `pk_live_...`
3. Update worker secret with `sk_live_...`
4. Rebuild and redeploy both

### Production Checklist

- [ ] Stripe live keys configured
- [ ] Domain email verified in Resend
- [ ] Real camp(s) created
- [ ] Pricing tested
- [ ] Test registration end-to-end
- [ ] Email notifications working
- [ ] Admin password is strong
- [ ] Privacy policy / Terms added to site
- [ ] Tested on mobile devices
- [ ] Sample/test camps archived

## Recommended Enhancements

### Phase 1: Polish Current Features

1. **Add Pricing Management UI**
   - Currently pricing items are managed via API
   - Build UI in admin "Pricing" tab (similar to Camps tab)

2. **CSV Export for Registrations**
   - Add export button to admin registrations tab
   - Include all form fields

3. **Enhanced Email Templates**
   - Convert to HTML emails
   - Add camp details, payment receipt
   - Include calendar invite

### Phase 2: New Features

1. **Parent Portal**
   - Parents can view their registrations
   - Email-based authentication
   - Download receipts

2. **Automated Notifications**
   - Reminder emails X days before camp
   - Waitlist notifications when spots open
   - Payment confirmations

3. **Reporting Dashboard**
   - Revenue by camp
   - Registration trends
   - Popular add-ons

### Phase 3: Advanced

1. **Multi-child Discounts**
   - Automatic sibling discounts
   - Bulk registration flow

2. **Partial Payments**
   - Deposit + balance due later
   - Payment plans

3. **Check-in System**
   - QR codes for daily check-in
   - Staff mobile app

## Need Help?

### Development Questions
- Check `README.md` for API docs
- Review `src/worker.ts` for backend logic
- Inspect `src/pages/` for frontend components

### Stripe Issues
- Read `STRIPE_SETUP.md`
- Use Stripe test mode first
- Check Stripe Dashboard logs

### Deployment Problems
- Review `SETUP_GUIDE.md`
- Check Cloudflare Dashboard > Workers & Pages
- View logs: `npx wrangler tail`

## Your Current Status

✅ **Frontend deployed** - https://d1dcea61.open-camp.pages.dev  
✅ **Worker deployed** - API endpoints active  
✅ **Database setup** - Sample camp ready  
⚠️ **Stripe config needed** - Add keys to activate payments  
⚠️ **Admin password needed** - Run setup script  
⚙️ **Optional: Email setup** - For notifications  

**You're 2 quick steps away from accepting registrations!**

