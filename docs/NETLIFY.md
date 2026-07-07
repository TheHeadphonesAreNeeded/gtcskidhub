# Netlify Deployment Guide

Netlify hosts the frontend, runs the backend functions, and redeploys on every
push to `main`.

## 1. Connect the repository

1. Log in at <https://app.netlify.com> and click **Add new site → Import an existing project**.
2. Choose **GitHub** and authorize Netlify, then pick your SkidHub repo.
3. Netlify auto-detects the settings from [`netlify.toml`](../netlify.toml):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Functions directory:** `netlify/functions`
   - The **Next.js runtime plugin** is enabled automatically.

Click **Deploy site**. The first build will fail auth-dependent calls until you
add environment variables (next step).

## 2. Add environment variables

Go to **Site settings → Environment variables** and add every key from
[`.env.example`](../.env.example):

| Variable | Notes |
| --- | --- |
| `SITE_URL` | Your Netlify URL, e.g. `https://skidhub.netlify.app` (no trailing slash). |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` | From [Discord setup](./DISCORD_OAUTH.md). |
| `OWNER_DISCORD_IDS` | Your Discord ID(s), comma-separated. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | From [Supabase setup](./SUPABASE.md). |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase values. |
| `SESSION_SECRET` | Long random string. |
| `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` | Optional — leave blank to disable ads. |

> Set `DISCORD_REDIRECT_URI` to `https://<your-site>.netlify.app/.netlify/functions/auth-callback`
> and add the same URL to your Discord app's OAuth redirects.

## 3. Redeploy

After adding variables, trigger a redeploy: **Deploys → Trigger deploy → Deploy site**
(or just push a commit). Environment variables are only applied to new builds.

## 4. Verify

- Visit your site — the animated landing page loads.
- Click **Login with Discord** — you should return to `/dashboard` logged in.
- If your Discord ID is in `OWNER_DISCORD_IDS`, you'll see the **Admin Panel**.
- Upload a project, then download it to confirm functions + Supabase work.

## Continuous deployment

Every push to `main` now triggers a fresh Netlify build and deploy. Pull
requests get **Deploy Previews** at their own URLs.

## Custom domain (optional)

**Site settings → Domain management → Add a custom domain.** After DNS
verification, update `SITE_URL` and `DISCORD_REDIRECT_URI` (and the Discord
redirect entry) to the new domain.

## Google AdSense (optional)

1. Get approved at <https://adsense.google.com> using your Netlify domain.
2. Set `NEXT_PUBLIC_ADSENSE_CLIENT` (`ca-pub-…`) and `NEXT_PUBLIC_ADSENSE_SLOT`.
3. Edit [`public/ads.txt`](../public/ads.txt) so the publisher ID matches your account.
4. Redeploy. Ads render once Google approves your site.

## Troubleshooting

- **Build fails on secret scanning** — `netlify.toml` already omits `.env.example`, `README.md`, and `docs/**`. Ensure no real secret is committed.
- **Functions return 500 "Missing required environment variable"** — a required env var isn't set for the deployed context; add it and redeploy.
- **OAuth `state_mismatch`** — cookies blocked or the redirect URI/host doesn't match `SITE_URL`.
