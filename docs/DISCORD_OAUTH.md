# Discord OAuth2 Setup

SkidHub authenticates users with Discord. Users grant the `identify` scope,
and SkidHub stores their Discord ID, username, avatar, join date, and role.

## 1. Create a Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, name it "SkidHub", and create it.
3. Copy the **Application ID** — this is your `DISCORD_CLIENT_ID`.

## 2. Create a client secret

1. In the left sidebar, open **OAuth2**.
2. Under **Client Secret**, click **Reset Secret** and copy it — this is your `DISCORD_CLIENT_SECRET`.
3. Keep it private. Store it only in `.env.local` and Netlify env vars.

## 3. Add redirect URIs

Under **OAuth2 → Redirects**, add one entry per environment:

- Production: `https://<your-site>.netlify.app/.netlify/functions/auth-callback`
- Local dev:  `http://localhost:8888/.netlify/functions/auth-callback`

These must match `DISCORD_REDIRECT_URI` **exactly** (protocol, host, path).

## 4. Scopes

SkidHub requests only the **`identify`** scope — no email, no guild access.
The OAuth URL is built automatically by the `auth-discord` function; you don't
need to configure scopes in the portal.

## 5. Environment variables

```env
DISCORD_CLIENT_ID=your_application_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://<your-site>.netlify.app/.netlify/functions/auth-callback
OWNER_DISCORD_IDS=your_discord_user_id
```

### Finding your Discord user ID

Enable **Developer Mode** in Discord (Settings → Advanced), then right-click
your name and choose **Copy User ID**. Add it to `OWNER_DISCORD_IDS` so your
account becomes the first Owner on login.

## How login works

1. User clicks **Login with Discord** → `/.netlify/functions/auth-discord`.
2. That function redirects to Discord's consent screen with a random `state` (CSRF protection).
3. Discord redirects back to `/.netlify/functions/auth-callback`, which:
   - verifies `state`,
   - exchanges the code for an access token,
   - fetches the profile,
   - upserts the user in Supabase,
   - sets a signed, httpOnly session cookie,
   - redirects to `/dashboard`.

Roles are re-read from the database on every request, so promotions and
demotions take effect immediately.
