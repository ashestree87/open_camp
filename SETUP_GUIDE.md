# Open Camp - Complete Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Frontend (.env.local)
Create `.env.local` in the project root:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
```

Get your Stripe publishable key from: https://dashboard.stripe.com/apikeys

#### Worker Secrets (Cloudflare)
```bash
# Set Stripe secret key
npx wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_test_YOUR_STRIPE_SECRET_KEY

# Set Resend API key (optional, for email notifications)
npx wrangler secret put RESEND_API_KEY
# Enter: re_YOUR_RESEND_API_KEY

# Set allowed origin
npx wrangler secret put ALLOWED_ORIGIN
# Enter: https://camp.eighty7.uk
```

### 3. Configure wrangler.toml

Copy the example file and add your IDs:

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and replace:
- `YOUR_DATABASE_ID` with your D1 database ID
- `YOUR_KV_NAMESPACE_ID` with your KV namespace ID

**IMPORTANT:** Never commit `wrangler.toml` to version control!

### 4. Set Up Database

```bash
# Run migrations
npx wrangler d1 migrations apply open-camp-db

# This will create:
# - registrations table
# - camps table
# - pricing_items table
# - registration_items table
# Plus sample data (1 camp + 5 pricing items)
```

### 5. Set Up Admin Credentials

```bash
# Run the setup script
chmod +x scripts/setup-admin.sh
./scripts/setup-admin.sh

# Follow prompts to set:
# - Admin username
# - Admin password
# - Initial max spots (if needed)
```

### 6. Deploy

#### Deploy Worker
```bash
npx wrangler deploy src/worker.ts
```

#### Deploy Pages
```bash
npm run build
npx wrangler pages deploy dist --project-name=open-camp --branch=main
```

### 7. Test the Application

1. **Registration Form:** Visit your Pages URL (e.g., `https://camp.eighty7.uk`)
   - You should see the camp created by the migration
   - Select the camp
   - Choose pricing options
   - Fill out the form
   - Complete payment with Stripe test card: `4242 4242 4242 4242`

2. **Admin Dashboard:** Visit `/admin`
   - Login with credentials from step 5
   - View/create camps
   - View pricing items
   - View registrations

## 📝 Admin Tasks

### Creating a New Camp

1. Go to `/admin`
2. Click "Camps" tab
3. Click "+ Create Camp"
4. Fill in:
   - Camp name
   - Description
   - Start/end dates
   - Age range
   - Max spots
5. Click "Create Camp"

### Managing Pricing Items

The pricing items are managed via API. Use the sample data as a template:
- Base fee (e.g., £50)
- Add-ons (e.g., Extended care +£10)
- Discounts (e.g., Early bird -£5)

You can add UI for this later in the "Pricing" tab.

## 🧪 Testing Payments

### Stripe Test Cards

| Card Number | Result |
|------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |
| 4000 0025 0000 3155 | Requires authentication |

Use any future expiry date and any 3-digit CVC.

## 🔒 Security Checklist

- [ ] `wrangler.toml` is in `.gitignore`
- [ ] All secrets set via `wrangler secret put`
- [ ] Strong admin password configured
- [ ] `ALLOWED_ORIGIN` matches your domain
- [ ] Stripe webhook secret configured (if using webhooks)

## 📧 Email Configuration

If you want confirmation emails:

1. Sign up at https://resend.com
2. Verify your domain
3. Get API key
4. Set via `npx wrangler secret put RESEND_API_KEY`
5. Update email addresses in `src/worker.ts`:
   - `CLUB_EMAIL`
   - `FROM_EMAIL`

## 🐛 Troubleshooting

### "Camp not found" or "No active camps"
- Check migrations ran: `npx wrangler d1 execute open-camp-db --remote --command "SELECT * FROM camps"`
- Verify camp status is 'active'

### Payment fails
- Check Stripe publishable key in `.env.local`
- Check Stripe secret key: `npx wrangler secret list`
- Use test card `4242 4242 4242 4242`

### Admin login fails
- Re-run `./scripts/setup-admin.sh`
- Check KV namespace is correctly bound

### CORS errors
- Set `ALLOWED_ORIGIN` secret to match your Pages domain
- Check Worker is deployed

## 📚 Next Steps

1. **Customize branding:** Edit `tailwind.config.js` and `src/index.css`
2. **Add more camps:** Use admin UI
3. **Configure pricing:** Add UI or use API directly
4. **Set up production Stripe:** Replace test keys with live keys
5. **Configure domain:** Add custom domain in Cloudflare Pages

## 🆘 Need Help?

Check:
- `README.md` - Full documentation
- `STRIPE_SETUP.md` - Stripe configuration
- `SECURITY.md` - Security guidelines
- `STATUS.md` - Current implementation status

