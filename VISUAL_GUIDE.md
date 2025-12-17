# 🎨 Open Camp - Visual Guide

## What You Built

A complete, production-ready camp registration system with payments!

## 🖥️ User Flow

### 1. Registration Form (`/`)

```
┌─────────────────────────────────────────┐
│   🏕️ Open Camp Kids Camp Registration   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   📅 SELECT A CAMP                      │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Summer Camp 2025           ✅   │  │
│   │ Fun summer activities!          │  │
│   │ 📅 2025-07-01 - 2025-07-15     │  │
│   │ 👥 Ages 5-12  🟢 18 spots left │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Winter Camp (Coming Soon)       │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   💰 ADDITIONAL OPTIONS                 │
│                                         │
│   ☑️ Extended Care (+£10)              │
│   ☐ Lunch Package (+£25)               │
│   ☑️ T-Shirt (+£8)                     │
│   ☐ Early Bird Discount (-£5)          │
│                                         │
│   ─────────────────────────────────────│
│   TOTAL:                         £68.00│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   📝 REGISTRATION DETAILS               │
│                                         │
│   Child Information                     │
│   • Full Name                           │
│   • Age & Date of Birth                 │
│                                         │
│   Parent/Guardian Info                  │
│   • Name, Email, Phone, Address         │
│                                         │
│   Emergency Contacts                    │
│   • Contact 1 & 2 details               │
│                                         │
│   Medical Information                   │
│   • Conditions, Allergies, Meds         │
│   • (Shows only if "Yes" selected)      │
│                                         │
│   Permissions & Consent                 │
│   ☑️ Photos/Videos                     │
│   ☑️ Medical Treatment                 │
│   ☑️ Activities                        │
│   ☑️ Terms & Conditions                │
│                                         │
│   [Proceed to Payment - £68.00]         │
└─────────────────────────────────────────┘
```

### 2. Payment Page (Stripe)

```
┌─────────────────────────────────────────┐
│   💳 COMPLETE PAYMENT                   │
│                                         │
│   Total Amount:                  £68.00│
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  Card information               │  │
│   │  4242 4242 4242 4242           │  │
│   │  MM/YY  CVC                     │  │
│   │  12/25  123                     │  │
│   └─────────────────────────────────┘  │
│                                         │
│   OR                                    │
│                                         │
│   [ 🍎 Apple Pay ]  [ 📱 Google Pay ]  │
│                                         │
│   [Pay £68.00]                          │
│                                         │
│   🔒 Securely processed by Stripe       │
└─────────────────────────────────────────┘
```

### 3. Success Page

```
┌─────────────────────────────────────────┐
│                                         │
│               ✅                        │
│                                         │
│     REGISTRATION COMPLETE!              │
│                                         │
│   Thank you for registering!            │
│   A confirmation email has been         │
│   sent to your email address.           │
│                                         │
│   Payment confirmation: £68.00 paid     │
│                                         │
└─────────────────────────────────────────┘
```

## 🔐 Admin Dashboard (`/admin`)

### Login

```
┌─────────────────────────────────────────┐
│         🔒 ADMIN LOGIN                  │
│                                         │
│   Username: [________________]          │
│   Password: [________________]          │
│                                         │
│   [Login]                               │
└─────────────────────────────────────────┘
```

### Dashboard Tab

```
┌─────────────────────────────────────────┐
│   ADMIN DASHBOARD          [Logout]     │
│                                         │
│   [Dashboard] Camps Pricing Registrations│
│                                         │
│   ┌───────────┐ ┌───────────┐ ┌───────┐│
│   │     2     │ │    16     │ │   4   ││
│   │ Active    │ │ Spots     │ │ Total ││
│   │ Camps     │ │ Available │ │ Regs  ││
│   └───────────┘ └───────────┘ └───────┘│
└─────────────────────────────────────────┘
```

### Camps Tab

```
┌─────────────────────────────────────────┐
│   MANAGE CAMPS         [+ Create Camp]  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Summer Camp 2025       [Edit][X]│  │
│   │ Fun summer activities!          │  │
│   │ 📅 Jul 1-15  👥 5-12  🟢 18/20 │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Winter Camp 2025       [Edit][X]│  │
│   │ Winter break activities         │  │
│   │ 📅 Dec 20-30  👥 6-14  🟢 15/15│  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Pricing Tab

```
┌─────────────────────────────────────────┐
│   PRICING ITEMS                         │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Camp Base Fee            £50.00 │  │
│   │ Standard camp registration      │  │
│   │ (base_fee)                      │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Extended Care           +£10.00 │  │
│   │ Before and after care           │  │
│   │ (add_on)                        │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Early Bird              -£5.00  │  │
│   │ Register 2 weeks early          │  │
│   │ (discount)                      │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Registrations Tab

```
┌─────────────────────────────────────────┐
│   REGISTRATIONS (4)        [Search]     │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Emma Johnson            £68.00  │  │
│   │ Parent: Sarah Johnson           │  │
│   │ 📧 sarah@email.com 📱 07700...  │  │
│   │ 🏕️ Summer Camp 2025             │  │
│   │ ✅ PAID                         │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Jack Smith              £50.00  │  │
│   │ Parent: John Smith              │  │
│   │ 📧 john@email.com 📱 07700...   │  │
│   │ 🏕️ Winter Camp 2025             │  │
│   │ ⏳ PENDING                      │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 🎨 Color Scheme

**Current Theme:** Open Camp (Red & Black)

```
Primary:   #dc2626 (red-600)  - Accents, CTAs
Secondary: #991b1b (red-800)  - Hover states
Background:#0a0a0a (near black) - Main bg
Cards:     #1a1a1a (dark gray) - Card bg
Text:      #ffffff (white)     - Headings
Muted:     #9ca3af (gray-400)  - Secondary text
Success:   #10b981 (green-400) - Available spots
Warning:   #f59e0b (yellow-500)- Warnings
Error:     #ef4444 (red-500)   - Errors
```

## 📱 Responsive Design

### Desktop (1024px+)
- Registration form: centered, max-width 768px
- Admin: full width with sidebar navigation
- Cards in grid layout (2-3 columns)

### Tablet (768px - 1023px)
- Forms: full width with padding
- Admin: stacked layout
- Cards in 2 columns

### Mobile (< 768px)
- Single column layout
- Touch-friendly buttons (48px+ height)
- Simplified navigation
- Collapsible sections

## 🔄 Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Select camp & pricing
       ↓
┌─────────────┐
│  React Form │ ← Zod validation
└──────┬──────┘
       │
       │ 2. Create Stripe Payment Intent
       ↓
┌─────────────┐      ┌─────────────┐
│ CF Worker   │ ←───→│   Stripe    │
└──────┬──────┘      └─────────────┘
       │
       │ 3. Confirm payment
       ↓
┌─────────────┐
│  D1 Database│ ← Save registration
└──────┬──────┘
       │
       │ 4. Send emails
       ↓
┌─────────────┐
│   Resend    │ → Parent + Admin
└─────────────┘
```

## 🗄️ Database Structure

```
camps
├── id
├── name
├── description
├── start_date
├── end_date
├── age_min / age_max
├── max_spots
├── spots_taken
└── status

pricing_items
├── id
├── camp_id (null = all camps)
├── name
├── amount (+ or -)
├── item_type
└── is_active

registrations
├── id
├── camp_id
├── child_full_name
├── parent_email
├── all form fields...
├── total_amount
└── payment_status

registration_items
├── registration_id
├── pricing_item_id
├── quantity
└── amount
```

## 🔌 API Endpoints

```
PUBLIC:
GET  /api/camps              - List active camps
GET  /api/pricing            - List pricing items
POST /api/create-payment-intent - Create Stripe payment
POST /api/submit             - Submit registration

ADMIN (requires Bearer token):
POST   /api/auth             - Login
GET    /api/registrations    - List all registrations
POST   /api/camps            - Create camp
PUT    /api/camps/:id        - Update camp
DELETE /api/camps/:id        - Archive camp
POST   /api/pricing          - Create pricing item
PUT    /api/pricing/:id      - Update pricing item
DELETE /api/pricing/:id      - Delete pricing item
GET    /api/admin-config     - Get config
POST   /api/admin-config     - Update config
```

## ✨ Key Features

### For Parents
✅ Simple, intuitive registration
✅ Mobile-friendly design
✅ Real-time pricing calculator
✅ Secure Stripe payments
✅ Apple Pay / Google Pay support
✅ Email confirmation
✅ All medical/permission forms in one place

### For Admins
✅ Easy camp creation
✅ Flexible pricing management
✅ View all registrations
✅ Search and filter
✅ Track payment status
✅ Dashboard statistics
✅ Secure authentication

### Technical
✅ TypeScript throughout
✅ Cloudflare edge deployment
✅ Zod validation
✅ React Hook Form
✅ Tailwind CSS
✅ D1 SQLite database
✅ KV for config
✅ Stripe integration
✅ Email notifications
✅ CORS protection
✅ Error boundaries

## 🚀 Performance

- **Global CDN**: Served from 200+ locations
- **Edge Computing**: Worker runs on Cloudflare edge
- **Fast DB**: D1 SQLite with automatic replication
- **Optimized Build**: Vite production build
- **Lazy Loading**: Routes code-split
- **Image Optimization**: SVG favicon, minimal assets

## 📦 What's Included

```
open_camp/
├── src/
│   ├── pages/
│   │   ├── RegistrationFormEnhanced.tsx  ← Main form
│   │   └── AdminEnhanced.tsx             ← Admin UI
│   ├── worker.ts                         ← Backend API
│   └── ... (components, types, schemas)
├── migrations/
│   ├── 001_init.sql
│   └── 002_add_camps_and_pricing.sql
├── scripts/
│   └── setup-admin.sh
├── wrangler.toml.example
├── SETUP_GUIDE.md
├── DEPLOYMENT_STATUS.md
├── NEXT_STEPS.md
└── README.md
```

You're all set! 🎉

