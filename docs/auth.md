# Discord Login Setup

Pitwall uses Supabase Auth with the Discord provider. No passwords are stored in
the app; Discord handles identity. Without Supabase env vars, the app falls
back to local mock data.

## 1. Create A Discord Application

1. Go to the Discord Developer Portal and create a new application.
2. Open OAuth2 and copy the Client ID and Client Secret.
3. Add your Supabase callback URL under OAuth2 redirects:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

## 2. Enable Discord In Supabase

1. Supabase dashboard -> Authentication -> Providers -> Discord.
2. Enable it and paste the Discord Client ID and Client Secret.
3. Supabase dashboard -> Authentication -> URL Configuration:
   - Site URL: your Cloudflare Pages production URL
   - Redirect URLs: production URL, preview URLs if needed, and `http://localhost:5173`

## 3. Run Migrations

Run these in order from the Supabase SQL Editor:

```text
supabase/migrations/0001_init.sql
supabase/migrations/0002_members_and_cosmetics.sql
supabase/migrations/0003_backend_ready.sql
```

The final migration hardens RLS, restricts profile updates, adds explicit Data
API grants, secures proof uploads, and keeps privileged helper functions out of
the exposed `public` schema.

## 4. Set Frontend Env Vars

Use Cloudflare Pages -> Settings -> Environment variables:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Use Supabase's browser-safe publishable key (`sb_publishable_...`) when
available. A legacy anon public key also works. Never use a `service_role` or
`sb_secret_...` key in this frontend.

## 5. Promote Your First Admin

Sign in once, then promote your user from the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_ID';
```
