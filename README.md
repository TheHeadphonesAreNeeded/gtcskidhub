<div align="center">

# 🟣 SkidHub

**Download Exclusive Projects — a premium, role-gated project-sharing platform.**

Built with Next.js · React · TypeScript · Tailwind CSS · Framer Motion · Netlify Functions · Supabase · Discord OAuth2

</div>

---

SkidHub is a modern, dark-themed web app for sharing project downloads with a
verified community. Owners and Moderators upload projects (stored as Google
Drive links); Users browse, favorite, and download according to per-project
permissions. Every push to `main` auto-deploys to Netlify.

## ✨ Features

- **Animated landing page** — glassmorphism cards, Framer Motion, dark theme, fully responsive.
- **Discord OAuth2 login** — avatar, username, display name, and role badge.
- **Three roles** — Owner, Moderator, User, each with distinct permissions.
- **Dashboard** — sidebar navigation: Dashboard, Projects, Favorites, Profile, Settings (+ Admin for owners).
- **Projects** — cards with thumbnail, version, category, tags, author, date, size, download count. Search, filters, categories, and sort by newest / downloads / alphabetical.
- **Uploads** — validated forms for Owners & Moderators; per-project download permission.
- **Admin panel** — stats (users, projects, downloads, moderators) and tables for user, project, and download management.
- **Profile & Settings** — dark mode, accent color, animations, and compact-mode toggles (persisted per browser).
- **Netlify Functions backend** — Discord OAuth, projects CRUD, favorites, downloads, and admin APIs.
- **Optional Google AdSense** — enabled via environment variables; disabled cleanly when unset.
- **Security** — signed httpOnly session cookies, server-side role checks, input sanitization, protected admin routes, and secrets kept in environment variables.

## 🧱 Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Frontend      | Next.js (App Router), React, TypeScript |
| Styling       | Tailwind CSS, Framer Motion             |
| Backend       | Netlify Functions (TypeScript)          |
| Database      | Supabase (PostgreSQL)                    |
| Auth          | Discord OAuth2 + signed JWT sessions     |
| Hosting / CI  | Netlify (auto-deploy from GitHub)        |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in the values

# 3. Run locally with the Netlify dev server (serves the app + functions)
npm install -g netlify-cli
netlify dev
```

> Use `netlify dev` (not `npm run dev`) for local development so the
> `/.netlify/functions/*` backend runs alongside the Next.js frontend.

To build for production:

```bash
npm install
npm run build
```

## 📚 Documentation

Step-by-step setup guides live in [`docs/`](./docs):

- [Installation](./docs/INSTALLATION.md)
- [GitHub setup](./docs/GITHUB.md)
- [Discord OAuth setup](./docs/DISCORD_OAUTH.md)
- [Supabase setup](./docs/SUPABASE.md)
- [Netlify deployment](./docs/NETLIFY.md)

## 🔑 Environment Variables

All secrets are configured in the Netlify dashboard (and `.env.local` for local
dev). See [`.env.example`](./.env.example) for the full template. Summary:

| Variable | Description |
| --- | --- |
| `SITE_URL` | Canonical site URL (no trailing slash). |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth app credentials. |
| `DISCORD_REDIRECT_URI` | `<SITE_URL>/.netlify/functions/auth-callback`. |
| `OWNER_DISCORD_IDS` | Comma-separated Discord IDs granted Owner on login. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access (functions only). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase values (reserved). |
| `SESSION_SECRET` | Long random string used to sign session JWTs. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `NEXT_PUBLIC_ADSENSE_SLOT` | Optional Google AdSense config. |

## 🗂️ Project Structure

```
.
├── netlify/functions/       # Backend API (Netlify Functions)
│   ├── _shared/             # Shared auth, supabase, http, validation helpers
│   ├── auth-discord.ts      # OAuth step 1: redirect to Discord
│   ├── auth-callback.ts     # OAuth step 2: exchange code, set session
│   ├── auth-me.ts / auth-logout.ts
│   ├── projects.ts          # Projects CRUD
│   ├── favorites.ts         # Toggle & list favorites
│   ├── download.ts          # Permission-checked download + logging
│   ├── profile.ts           # Uploaded + favorited projects
│   └── admin-users.ts / admin-stats.ts   # Owner-only admin APIs
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Landing page
│   │   └── dashboard/       # Dashboard, projects, favorites, profile, settings, admin, upload
│   ├── components/          # UI components + providers
│   └── lib/                 # Types, API client, formatters
├── supabase/schema.sql      # Database schema
├── public/                  # ads.txt, robots.txt
├── netlify.toml             # Build, redirects, functions, headers
└── .env.example             # Environment variable template
```

## 🛡️ Roles & Permissions

| Capability          | User | Moderator | Owner |
| ------------------- | :--: | :-------: | :---: |
| Browse & favorite   |  ✅  |    ✅     |  ✅   |
| Download (per rule) |  ⚙️  |    ⚙️     |  ⚙️   |
| Upload projects     |  —   |    ✅     |  ✅   |
| Edit/delete own     |  —   |    ✅     |  ✅   |
| Edit/delete any     |  —   |    —      |  ✅   |
| Manage users/roles  |  —   |    —      |  ✅   |
| Analytics & logs    |  —   |    —      |  ✅   |

⚙️ = each project defines the minimum role required to download it.

## 📝 License

MIT — do what you like, no warranty.
