# 🏕️ Open Camp - Kids Camp Registration

A production-ready, open-source camp registration system with payments, multi-camp support, and a full admin dashboard. Built for clubs, gyms, community organizations, and anyone running youth programs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare](https://img.shields.io/badge/deploy-Cloudflare-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Stripe](https://img.shields.io/badge/payments-Stripe-blueviolet.svg)

> **💼 Need a hosted solution?** Custom hosted and branded versions available – [contact us](mailto:developer@example.com) for pricing.

---

## ✨ Features

### Public Registration
- 📝 Comprehensive multi-child registration form
- 💳 **Stripe payments** with Apple Pay & Google Pay support
- 🎫 Multiple pricing tiers and add-ons per camp
- 👨‍👩‍👧‍👦 **Sibling discounts** (fixed amount or percentage)
- 📊 Real-time spots remaining counter
- 📋 Waitlist support when camps are full
- 💾 Auto-save form progress (survives page refresh)
- ✉️ Email confirmation on registration
- 🌓 **Dark/Light mode** toggle
- 📱 Fully mobile responsive

### Admin Dashboard
- 🔐 Secure token-based authentication
- 🏕️ **Multi-camp management** - create, edit, duplicate, archive camps
- 💰 **Flexible pricing** - base fees, add-ons, discounts per camp
- 📋 **Registration management** with status tracking:
  - Confirmed, Pending, Waitlist, Cancelled, Attended, No-show
- 💳 Payment status tracking (Pending, Paid, Free)
- 📝 **Admin notes** - timestamped notes chain per registrant
- 📞 One-click contact (email/call parent, emergency contacts)
- ✏️ Edit any registration field inline
- 🗑️ Soft delete with data anonymization
- 🔍 Advanced filtering (by camp, search, date range, status, capacity)
- 📥 Export registrations to CSV
- ⏸️ **Camp controls** - Open, Pause, or Close registrations
- 📋 Waitlist messaging when camp is paused

### Technical
- ⚡ **Serverless** - Cloudflare Workers + Pages
- 🗄️ **SQLite database** - Cloudflare D1
- 💾 KV storage for configuration
- 🎨 Tailwind CSS with custom theming
- 📱 Mobile-first responsive design
- 🔒 CORS protection
- 🌐 Custom domain support

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Payments | Stripe (Cards, Apple Pay, Google Pay) |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Config | Cloudflare KV |
| Email | Resend API |
| Hosting | Cloudflare Pages |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account ([free tier](https://dash.cloudflare.com/sign-up) works)
- Stripe account ([sign up](https://dashboard.stripe.com/register))
- Wrangler CLI: `npm install -g wrangler`

### 1. Clone & Install

```bash
git clone https://github.com/your-org/open-camp.git
cd open-camp
npm install
```

### 2. Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
npx wrangler d1 create open-camp-db
# Note the database_id from output

# Create KV namespace
npx wrangler kv namespace create open-camp-kv
# Note the namespace id from output
```

### 3. Configure wrangler.toml

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` with your IDs:

```toml
name = "open-camp"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "open-camp-db"
database_id = "YOUR_DATABASE_ID_HERE"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"

[vars]
ALLOWED_ORIGIN = "https://your-project.pages.dev"
```

### 4. Run Database Migration

```bash
npx wrangler d1 execute open-camp-db --file=./migrations/001_schema.sql
```

### 5. Set Admin Credentials

```bash
# Generate password hash
echo -n 'your-secure-password' | shasum -a 256 | cut -d' ' -f1

# Set credentials in KV
npx wrangler kv key put --binding=KV "admin_username" "admin"
npx wrangler kv key put --binding=KV "admin_password_hash" "YOUR_HASH_HERE"
```

### 6. Configure Stripe

1. Get your keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

2. Update `src/config/stripe.ts` with your **publishable key**:
```typescript
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_KEY_HERE'
```

3. Set your **secret key** as a secret:
```bash
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=open-camp
# Enter your sk_live_... key when prompted
```

4. (Optional) Enable Apple Pay & Google Pay in [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods)

### 7. Set Email API Key (Optional)

```bash
npx wrangler pages secret put RESEND_API_KEY --project-name=open-camp
# Enter your Resend API key
```

### 8. Deploy

```bash
# Build and deploy to Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=open-camp
```

### 9. Configure Pages Bindings

In [Cloudflare Dashboard](https://dash.cloudflare.com):
1. Go to **Workers & Pages** → **open-camp** → **Settings** → **Functions**
2. Add D1 binding: `DB` → `open-camp-db`
3. Add KV binding: `KV` → `open-camp-kv`

---

## 📁 Project Structure

```
open-camp/
├── migrations/
│   └── 001_schema.sql           # Complete database schema
├── public/
│   └── favicon.svg
├── scripts/
│   ├── setup-admin.sh           # Admin setup helper
│   └── setup-kv.ts              # KV configuration
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx    # Error handling
│   │   ├── Header.tsx           # Site header + theme toggle
│   │   ├── Layout.tsx           # Page layout
│   │   ├── ThemeContext.tsx     # Dark/light mode context
│   │   └── Toast.tsx            # Toast notifications
│   ├── config/
│   │   └── stripe.ts            # Stripe configuration
│   ├── pages/
│   │   ├── AdminEnhanced.tsx    # Full admin dashboard
│   │   └── RegistrationFormEnhanced.tsx # Registration form
│   ├── schemas/
│   │   └── registration.ts      # Zod validation schemas
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── worker.ts                # Cloudflare Worker API
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind styles
├── functions/
│   └── api/
│       └── _middleware.ts       # Pages middleware
├── wrangler.toml.example        # Cloudflare config template
├── tailwind.config.js
└── package.json
```

---

## 🔌 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get registration status (legacy) |
| GET | `/api/camps` | List active camps |
| GET | `/api/camps/:id` | Get camp details |
| GET | `/api/pricing?campId=:id` | Get pricing for a camp |
| POST | `/api/create-payment-intent` | Create Stripe payment intent |
| POST | `/api/submit` | Submit registration |

### Admin Endpoints (require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Admin login |
| GET | `/api/registrations` | List all registrations |
| GET | `/api/registrations/:id` | Get single registration |
| PUT | `/api/registrations/:id` | Update registration |
| DELETE | `/api/registrations/:id` | Soft delete registration |
| POST | `/api/camps` | Create camp |
| PUT | `/api/camps/:id` | Update camp |
| DELETE | `/api/camps/:id` | Archive camp |
| POST | `/api/pricing` | Create pricing item |
| PUT | `/api/pricing/:id` | Update pricing item |
| DELETE | `/api/pricing/:id` | Delete pricing item |
| GET | `/api/admin-config` | Get configuration |
| POST | `/api/admin-config` | Update configuration |

---

## 🧪 Local Development

```bash
# Start frontend dev server
npm run dev

# In another terminal, start Worker dev server
npm run dev:worker
```

Visit `http://localhost:5173`

For local D1 database:
```bash
npx wrangler d1 execute open-camp-db --local --file=./migrations/001_schema.sql
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:worker` | Start Worker locally |
| `npm run build` | Build for production |
| `npm run deploy:pages` | Build & deploy to Pages |
| `npm run deploy:worker` | Deploy Worker |
| `npm run db:create` | Create D1 database |
| `npm run db:migrate` | Run initial migration |
| `npm run typecheck` | Type-check all code |

---

## 🎨 Customization

### Branding

1. **Colors** - Edit `tailwind.config.js`:
```javascript
colors: {
  brand: {
    primary: '#8B1538',  // Your primary color
    dark: '#6B0F2B',
    black: '#111111',
    gray: '#1F1F1F',
  }
}
```

2. **Logo** - Update `src/components/Header.tsx`

3. **Fonts** - Update `index.html` and `tailwind.config.js`

4. **Email template** - Edit email HTML in `src/worker.ts`

### Theme

The app supports dark/light mode. Customize colors in:
- `src/index.css` - Base styles and component classes
- `tailwind.config.js` - Color palette

---

## 🔒 Security

- Passwords hashed with SHA-256
- Token-based auth with expiry
- CORS protection configured
- Soft delete preserves audit trail
- Personal data anonymized on deletion

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 💼 Custom Hosting

Don't want to self-host? **Custom branded and hosted solutions available:**

- ✅ Full setup and configuration
- ✅ Custom domain
- ✅ Your branding
- ✅ Stripe payments configured
- ✅ Email notifications
- ✅ Ongoing support

[Contact us](mailto:developer@example.com) for pricing.

---

Built with ❤️ for youth programs everywhere.
