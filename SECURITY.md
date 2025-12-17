# 🔒 Security Guidelines for Open Camp

## What NOT to Commit to Public Repositories

### ❌ Never Commit These Files:
- `wrangler.toml` - Contains account IDs, database IDs, namespace IDs
- `.env` or `.dev.vars` - Contains API keys and secrets
- Any file with actual credentials or IDs

### ✅ Safe to Commit:
- `wrangler.toml.example` - Template with placeholders
- `env.example` - Environment variable template
- Documentation and setup guides

## Sensitive Information in This Project

### 🔴 Critical (Never Expose)
- `RESEND_API_KEY` - Email API key
- `STRIPE_SECRET_KEY` - Payment processing key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- Admin password hashes in KV

### 🟡 Moderate (Keep Private)
- Cloudflare Account ID
- D1 Database ID
- KV Namespace ID
- Your domain names

### 🟢 Public (Safe to Share)
- Stripe Publishable Key (`pk_test_...` or `pk_live_...`)
- Project structure and code
- Documentation

## How We Protect Secrets

### 1. **Wrangler Secrets**
Stored encrypted in Cloudflare, never in code:
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
```

### 2. **Environment Variables**
Set in Cloudflare Dashboard for Pages:
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 3. **KV Storage**
Sensitive config stored in Cloudflare KV:
- Admin credentials (hashed)
- Configuration values

### 4. **Git Ignore**
`.gitignore` prevents committing:
- `wrangler.toml`
- `.env` files
- `.dev.vars`

## Setup for New Developers

1. **Copy example files:**
   ```bash
   cp wrangler.toml.example wrangler.toml
   cp env.example .env
   ```

2. **Get credentials from team lead:**
   - Cloudflare account access
   - API keys for Resend and Stripe
   - Database and KV IDs

3. **Configure locally:**
   - Fill in `wrangler.toml` with your IDs
   - Set secrets via `wrangler secret put`
   - Never commit these files!

## If Credentials Are Exposed

### Immediate Actions:
1. **Rotate all exposed keys immediately**
2. **Revoke the exposed API keys:**
   - Resend: https://resend.com/api-keys
   - Stripe: https://dashboard.stripe.com/apikeys
3. **Generate new keys and update:**
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put STRIPE_SECRET_KEY
   ```
4. **For public repo exposure:**
   - Remove from git history: `git filter-branch` or use BFG Repo-Cleaner
   - Force push to remote (if needed)
   - Inform all collaborators

### For Database/KV IDs:
While less critical than API keys, if exposed:
1. Consider creating new resources
2. Migrate data if necessary
3. Update wrangler.toml
4. Redeploy

## Best Practices

- ✅ Use `.example` files as templates
- ✅ Document what needs to be filled in
- ✅ Review `.gitignore` before every commit
- ✅ Use `git status` to verify what's being committed
- ✅ Set up pre-commit hooks to prevent secret leaks
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically
- ❌ Never hardcode secrets in code
- ❌ Never commit actual credentials
- ❌ Never share secrets in chat or email
- ❌ Never screenshot configuration with secrets visible

## Automated Secret Scanning

Consider adding tools like:
- **git-secrets** - Prevents committing secrets
- **gitleaks** - Scans for secrets in git history
- **truffleHog** - Finds secrets in repositories

## Questions?

If unsure whether something should be committed, **ask first!**
When in doubt, keep it private.

