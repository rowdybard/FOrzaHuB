# Discord login setup

Pitwall uses **Supabase Auth with the Discord provider**. No passwords are
stored — Discord handles identity. Until this is configured the app runs on
local mock data and the login button stays inert.

## 1. Create a Discord application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Open **OAuth2** → copy the **Client ID** and **Client Secret**.
3. Under **OAuth2 → Redirects**, add your Supabase callback URL:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

## 2. Enable the provider in Supabase
1. Supabase dashboard → **Authentication → Providers → Discord**.
2. Toggle it on, paste the **Client ID** and **Client Secret**, save.
3. **Authentication → URL Configuration**: set your **Site URL** (e.g.
   `https://your-pages-domain.dev`) and add it to the **Redirect URLs** list.
   Add `http://localhost:5173` too for local dev.

## 3. Run the database migrations
In the Supabase SQL editor (or `supabase db push`):
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_members_and_cosmetics.sql`

The `0002` migration adds the `club_members` table, profile cosmetic columns
(`accent`, `name_gradient`, `badges`, `avatar_url`), and a trigger that
auto-creates a `profiles` row from the user's Discord info on first login.

## 4. Set the frontend env vars
Copy `.env.example` to `.env.local` for dev, and add the same two vars in your
hosting dashboard (Cloudflare Pages → Settings → Environment variables):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

That's it — the **Sign in** button in the navbar will now run the Discord flow,
users get a profile automatically, and they can customize their nameplate at
`/me` and join clubs from the club page.
