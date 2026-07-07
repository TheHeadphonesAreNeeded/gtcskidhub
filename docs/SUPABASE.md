# Supabase Setup

SkidHub uses Supabase (PostgreSQL) for all data. The Netlify Functions talk to
Supabase with the **service-role key**, so all authorization is enforced in the
application layer.

## 1. Create a project

1. Sign in at <https://supabase.com> and create a **New project**.
2. Choose a name, a strong database password, and a region close to your users.
3. Wait for the project to finish provisioning.

## 2. Run the schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](../supabase/schema.sql).
3. Click **Run**. This creates the `roles`, `users`, `projects`, `favorites`,
   and `download_logs` tables, indexes, an `updated_at` trigger, and enables
   row-level security.

## 3. Get your keys

Open **Project Settings → API**:

- **Project URL** → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
- **`service_role` secret** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server-side only, never expose to the browser)
- **`anon` public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Data model

| Table           | Purpose                                                        |
| --------------- | ------------------------------------------------------------- |
| `roles`         | Reference table: `user`, `moderator`, `owner` with ranks.     |
| `users`         | Discord ID, username, display name, avatar, role, join date.  |
| `projects`      | Name, description, version, thumbnail, Drive URL, category, tags, downloads, file size, download permission, author. |
| `favorites`     | Join table linking users to favorited projects.               |
| `download_logs` | One row per download for analytics.                           |

## 5. Row-Level Security (RLS)

RLS is enabled on all tables as defence-in-depth. The service-role key used by
the functions bypasses RLS, while the public `anon` key is denied direct access.
If you later want client-side reads of the catalogue, uncomment the sample
`public can read projects` policy at the bottom of `schema.sql`.

## Notes

- The **first Owner** is whoever's Discord ID is listed in `OWNER_DISCORD_IDS`; they get the Owner role automatically on login. Additional owners/moderators are promoted from the Admin Panel.
- Deleting a user cascades to their favorites; their uploaded projects remain but with the author reference nulled.
