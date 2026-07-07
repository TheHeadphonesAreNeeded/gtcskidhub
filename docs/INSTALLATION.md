# Installation Guide

This guide gets SkidHub running locally and prepares it for deployment.

## Prerequisites

- **Node.js 18.18+** (Node 20 recommended) and npm
- A **GitHub** account
- A **Netlify** account
- A **Supabase** project
- A **Discord** application (for OAuth)

## 1. Get the code

```bash
git clone https://github.com/<you>/skidhub.git
cd skidhub
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with values from the setup guides:

- [Discord OAuth setup](./DISCORD_OAUTH.md) → client id, secret, redirect
- [Supabase setup](./SUPABASE.md) → project URL + service-role key
- Generate a session secret:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

## 3. Set up the database

Open the Supabase SQL editor and run [`supabase/schema.sql`](../supabase/schema.sql).
See [Supabase setup](./SUPABASE.md) for details.

## 4. Run locally

Install the Netlify CLI and start the dev server (frontend **and** functions):

```bash
npm install -g netlify-cli
netlify dev
```

The app runs at `http://localhost:8888`. Set `SITE_URL=http://localhost:8888`
and add `http://localhost:8888/.netlify/functions/auth-callback` as a redirect
URI in your Discord app for local login to work.

> `npm run dev` starts only the Next.js frontend (port 3000) without the
> functions backend — use `netlify dev` for the full experience.

## 5. Build

```bash
npm run build
```

A successful build means you're ready to [deploy to Netlify](./NETLIFY.md).

## Troubleshooting

- **"Missing required environment variable"** — a function is missing a value; check `.env.local` / Netlify env vars.
- **Login redirect fails** — the Discord redirect URI must exactly match `<SITE_URL>/.netlify/functions/auth-callback`.
- **Empty catalogue** — confirm `supabase/schema.sql` ran and the service-role key is correct.
