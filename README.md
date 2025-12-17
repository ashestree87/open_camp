# 🏕️ Open Camp - Kids Camp Registration

An open-source, production-ready kids camp registration system. Built for clubs, gyms, community organizations, and anyone running youth programs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare](https://img.shields.io/badge/deploy-Cloudflare-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

> **💼 Need a hosted solution?** Custom hosted and branded versions available – [contact the developer](mailto:developer@example.com) for pricing.

---

## ✨ Features

### Registration Form
- 📝 Comprehensive form with 25+ fields
- ✅ Client-side validation (React Hook Form + Zod)
- 🔄 Conditional fields (medical info shows only when needed)
- 📊 Real-time "Spots Remaining" counter
- 🚫 Auto-disable when sold out
- ✉️ Email confirmation on submission

### Admin Dashboard
- 🔐 Secure login (username + password with SHA-256 hashing)
- 📋 View all registrations in expandable table
- 🔍 Search/filter by name or email
- 📈 Stats: registered count, spots left, max capacity
- ⚙️ Update max spots on the fly
- 📥 Export all data to CSV

### Technical
- ⚡ Serverless (Cloudflare Workers) - scales to thousands of requests
- 🗄️ SQLite database (Cloudflare D1) - no server management
- 💾 KV storage for configuration
- 📱 Mobile-first responsive design
- 🎨 Easily rebrandable (colors, logo, text)
- 🌐 CORS configured for your domain

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
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
# Copy the database_id from output

# Create KV namespace
npx wrangler kv:namespace create KV
# Copy the namespace id from output
```

### 3. Configure wrangler.toml

Update `wrangler.toml` with your IDs:

```toml
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
npx wrangler d1 execute open-camp-db --file=./migrations/001_init.sql
```

### 5. Set Admin Credentials

```bash
# Generate password hash (replace 'your-secure-password')
echo -n 'your-secure-password' | shasum -a 256 | cut -d' ' -f1

# Set credentials in KV
npx wrangler kv:key put --binding=KV "admin_username" "admin"
npx wrangler kv:key put --binding=KV "admin_password_hash" "YOUR_HASH_HERE"
npx wrangler kv:key put --binding=KV "max_spots" "20"
```

### 6. Set Email API Key (Optional)

```bash
npx wrangler secret put RESEND_API_KEY
# Enter your Resend API key
```

### 7. Deploy

```bash
# Deploy backend (Worker)
npm run deploy:worker

# Deploy frontend (Pages)
npm run deploy:pages
```

---

## 📖 Deployment Guide (Cloudflare)

### Option A: CLI Deployment

1. Build and deploy Worker:
   ```bash
   npm run deploy:worker
   ```

2. Build and deploy Pages:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=open-camp
   ```

### Option B: GitHub Integration

1. Push code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
3. Create Application → Pages → Connect to Git
4. Select your repository
5. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Add environment variable bindings for D1 and KV

### Custom Domain

1. In Cloudflare Pages settings → Custom Domains
2. Add your domain (e.g., `register.yourclub.com`)
3. Update `ALLOWED_ORIGIN` in wrangler.toml and redeploy Worker

---

## 🎨 Rebranding Guide

### Step 1: Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  brand: {
    primary: '#YOUR_PRIMARY_COLOR',   // Main brand color
    dark: '#YOUR_DARKER_SHADE',       // Darker variant
    black: '#111111',                 // Background
    gray: '#1F1F1F',                  // Cards
  }
}
```

### Step 2: Logo

Replace logo in `src/components/Header.tsx`:

```tsx
{/* Replace the O logo with your image */}
<img src="/your-logo.png" alt="Your Organization" className="w-12 h-12" />
```

### Step 3: Text Content

Update text in:
- `src/components/Header.tsx` - Organization name
- `src/pages/RegistrationForm.tsx` - Form instructions
- `src/worker.ts` - Contact emails (CLUB_EMAIL, FROM_EMAIL constants)

### Step 4: Fonts

Update `index.html` Google Fonts import and `tailwind.config.js`:

```javascript
fontFamily: {
  heading: ['Your-Heading-Font', 'sans-serif'],
  body: ['Your-Body-Font', 'sans-serif'],
}
```

### Step 5: Meta Tags

Update `index.html`:
- Title and description
- Open Graph image (`/og-image.png`)
- Theme colors

---

## 📁 Project Structure

```
open-camp/
├── migrations/
│   └── 001_init.sql          # Database schema
├── public/
│   ├── favicon.svg           # Site favicon
│   └── og-image.png          # Social share image
├── scripts/
│   ├── setup-admin.sh        # Admin setup helper
│   └── setup-kv.ts           # KV configuration
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx # Error handling
│   │   ├── Header.tsx        # Site header
│   │   └── Layout.tsx        # Page layout
│   ├── pages/
│   │   ├── Admin.tsx         # Admin dashboard
│   │   └── RegistrationForm.tsx
│   ├── schemas/
│   │   └── registration.ts   # Zod validation
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── worker.ts             # Cloudflare Worker API
│   ├── main.tsx              # React entry
│   └── index.css             # Tailwind styles
├── env.example               # Environment template
├── wrangler.toml             # Cloudflare config
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/status` | No | Get registration status |
| POST | `/api/submit` | No | Submit registration |
| POST | `/api/auth` | No | Admin login |
| GET | `/api/registrations` | Yes | List all registrations |
| GET | `/api/admin-config` | Yes | Get configuration |
| POST | `/api/admin-config` | Yes | Update max spots |

---

## 🧪 Local Development

```bash
# Terminal 1: Frontend dev server
npm run dev

# Terminal 2: Worker dev server (with local D1)
npm run dev:worker
```

Visit `http://localhost:5173`

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:worker` | Start Worker locally |
| `npm run build` | Build for production |
| `npm run deploy:pages` | Deploy to Cloudflare Pages |
| `npm run deploy:worker` | Deploy Worker |
| `npm run db:create` | Create D1 database |
| `npm run db:migrate` | Run migrations |
| `npm run typecheck` | Type-check all code |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 💼 Custom Hosting

Don't want to self-host? **Custom branded and hosted solutions available.**

- ✅ Full setup and configuration
- ✅ Custom domain
- ✅ Your branding
- ✅ Email notifications configured
- ✅ Ongoing support

[Contact the developer](mailto:developer@example.com) for pricing and availability.

---

Built with ❤️ for youth programs everywhere.
