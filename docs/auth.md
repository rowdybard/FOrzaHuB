# Discord Login Setup

GripCafe uses Supabase Auth with the Discord provider. No passwords are stored in
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
supabase/migrations/0004_fix_challenge_rls.sql
supabase/migrations/0005_club_beta_limits.sql
supabase/migrations/0006_challenge_lifecycle_automation.sql
supabase/migrations/0007_one_submission_per_user.sql
supabase/migrations/0008_set_primary_club_rpc.sql
supabase/migrations/0009_submission_self_service.sql
supabase/migrations/0010_sponsored_challenges.sql
supabase/migrations/0011_fix_lifecycle_rls.sql
supabase/migrations/0012_seed_horizon_heatwave.sql
supabase/migrations/0013_fix_pi_classes.sql
supabase/migrations/0014_migrate_users_to_gripcafe.sql
supabase/migrations/0015_strip_pi_numbers.sql
supabase/migrations/0016_fix_prizes.sql
supabase/migrations/0017_rename_challenges.sql
supabase/migrations/0018_fix_set_primary_club_rpc.sql
supabase/migrations/0019_series_points.sql
supabase/migrations/0020_fix_prizes_again.sql
supabase/migrations/0021_fix_set_primary_club_security.sql
supabase/migrations/20260603025756_admin_tools_permissions.sql
supabase/migrations/20260603030000_profile_flair.sql
supabase/migrations/20260603030100_restrict_proof_uploads_to_images.sql
supabase/migrations/20260603032723_exclusive_badge_limits.sql
supabase/migrations/20260603033503_admin_role_management.sql
supabase/migrations/20260609015314_alpha_v01_security_hardening.sql
supabase/migrations/0022_sponsored_staff_only.sql
supabase/migrations/0023_beta_season_01_data.sql
supabase/migrations/0024_beta_season_02_standings.sql
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

Keep RLS enabled before production. The app depends on RLS for staff-only
challenge/admin writes and submission review.

The V1 `proofs` Storage bucket is public. Uploaded proof files may be viewable
by anyone with the file URL.

## 5. Promote Your First Admin

Sign in once, then promote your user from the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_ID';
```
