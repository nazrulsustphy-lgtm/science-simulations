# ⚛ SciSim — Interactive Science Simulations (v2.0 — 10/10 Edition)

Production-ready website with all 30+ improvements applied:
- ✅ Mobile hamburger menu
- ✅ Admin check via `is_admin` DB column (not hardcoded)
- ✅ Monthly counter auto-reset
- ✅ Rate limiting on comments (5/hour)
- ✅ Users can delete own comments
- ✅ GDPR: Data export + account deletion
- ✅ Single Supabase client instance
- ✅ localStorage cache (30 min)
- ✅ Favorites/bookmarks system
- ✅ Share buttons (Twitter, Facebook, WhatsApp, Copy)
- ✅ Cookie consent banner
- ✅ Unique meta descriptions per page
- ✅ Improved empty states with CTAs
- ✅ Global error handlers
- ✅ Currency detection (IP-based)
- ✅ 7-day free trial messaging
- ✅ Legal pages (Privacy, Terms, Cookies)
- ✅ Schema.org markup on simulations
- ✅ Difficulty level badges
- ✅ Consistent skeleton loaders

## 🚀 Setup Steps

### Step 1: Database Migration
Open Supabase SQL Editor → Run `database_migration_v2.sql`
This adds `is_admin`, `monthly_reset_at` columns + DELETE policies + comment likes RPC.

### Step 2: Make Yourself Admin
In Supabase SQL Editor run (replace with your email):
```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

### Step 3: Configure Keys
Open `assets/js/config.js` and replace:
```
SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_ANON_KEY'
```

After Lemon Squeezy setup, also replace:
```
monthly_url: 'REPLACE_WITH_LEMON_SQUEEZY_MONTHLY_URL'
yearly_url:  'REPLACE_WITH_LEMON_SQUEEZY_YEARLY_URL'
credits_url: 'REPLACE_WITH_LEMON_SQUEEZY_CREDITS_URL'
```

### Step 4: Enable Google OAuth
Supabase Dashboard → Authentication → Providers → Google → Enable

### Step 5: Upload to GitHub
Upload all files to your `science-simulations` repository.

## 📁 Complete File Structure
```
science-simulations/
├── index.html              Homepage
├── browse.html             Browse + filter + search
├── simulation.html         Viewer + quiz + comments + share + favorites
├── auth.html               Login page (7-day trial messaging)
├── pricing.html            Plans + currency detection + FAQ
├── request.html            Custom request form
├── dashboard.html          Stats + requests + quizzes + favorites + settings
├── privacy.html            GDPR privacy policy
├── terms.html              Terms of service
├── cookies.html            Cookie policy
├── llms.txt                AI crawlers
├── robots.txt              SEO
├── database_migration_v2.sql  Run in Supabase SQL Editor
├── admin/
│   └── queue.html          Admin panel (is_admin DB check)
├── assets/
│   ├── css/styles.css      Shared styles (hamburger, cookie banner, etc)
│   └── js/
│       ├── config.js       ⚠️ Add your keys here
│       ├── auth.js         Singleton client, admin check, GDPR export/delete
│       ├── freemium.js     Access control
│       ├── comments.js     Rate limit + delete own
│       └── shared.js       Nav component, cookie banner, share functions
├── data/
│   └── index.json          Simulation index (starts empty, Cowork fills)
└── simulations/            HTML simulation files (13 subject folders)
```

## 🔑 Keys Needed
1. Supabase URL: `https://oufdahkeygqyjocdkzbp.supabase.co` (already set)
2. Supabase Anon Key (from Supabase dashboard)
3. Lemon Squeezy URLs (after Step 4 of main setup)

## ✨ Key Features
- **Freemium gate** with daily view limits
- **Comment system** with rate limiting and self-delete
- **Favorites** via localStorage (no DB needed)
- **Share buttons** — Twitter, Facebook, WhatsApp, Copy link
- **Cookie banner** — GDPR compliant
- **Admin panel** — Protected by server-side `is_admin` check
- **Data export + account deletion** — GDPR right to erasure
- **Schema.org markup** — Each simulation gets LearningResource schema
- **Mobile navigation** — Hamburger menu on small screens
- **Currency awareness** — Detects user country via IP
