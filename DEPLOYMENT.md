# Deploying GripCafe

GripCafe is a static React SPA for Cloudflare Pages. It uses Supabase directly
from the browser for public data, Discord auth, proof storage, and staff-gated
challenge/admin writes. If Supabase env vars are missing, it falls back to the
local mock data in `src/data/mock.js`.

## Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
3. After deploy, add a custom domain: Cloudflare dashboard -> Pages -> your project -> Custom domains -> Add `gripcafe.com` and `www.gripcafe.com`.
4. Use:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 20
5. Add these Cloudflare Pages environment variables for Production and Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAX_PROOF_UPLOAD_MB` (optional, defaults to `10`)

Use Supabase's browser-safe publishable key (`sb_publishable_...`) when
available. A legacy anon public key also works. Do not use or share a
`service_role` key or `sb_secret_...` key in this app.

## Supabase Setup

1. Create a Supabase project.
2. In the SQL Editor, run migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_members_and_cosmetics.sql`
   - `supabase/migrations/0003_backend_ready.sql`
   - `supabase/migrations/0004_fix_challenge_rls.sql`
   - `supabase/migrations/0005_club_beta_limits.sql`
   - `supabase/migrations/0006_challenge_lifecycle_automation.sql`
   - `supabase/migrations/0007_one_submission_per_user.sql`
   - `supabase/migrations/0008_set_primary_club_rpc.sql`
   - `supabase/migrations/0009_submission_self_service.sql`
   - `supabase/migrations/0010_sponsored_challenges.sql`
   - `supabase/migrations/0011_fix_lifecycle_rls.sql`
   - `supabase/migrations/0012_seed_horizon_heatwave.sql`
   - `supabase/migrations/0013_fix_pi_classes.sql`
   - `supabase/migrations/0014_migrate_users_to_gripcafe.sql`
   - `supabase/migrations/0015_strip_pi_numbers.sql`
   - `supabase/migrations/0016_fix_prizes.sql`
   - `supabase/migrations/0017_rename_challenges.sql`
   - `supabase/migrations/0018_fix_set_primary_club_rpc.sql`
   - `supabase/migrations/0019_series_points.sql`
   - `supabase/migrations/0020_fix_prizes_again.sql`
   - `supabase/migrations/0021_fix_set_primary_club_security.sql`
   - `supabase/migrations/20260603025756_admin_tools_permissions.sql`
   - `supabase/migrations/20260603030000_profile_flair.sql`
   - `supabase/migrations/20260603030100_restrict_proof_uploads_to_images.sql`
   - `supabase/migrations/20260603032723_exclusive_badge_limits.sql`
   - `supabase/migrations/20260603033503_admin_role_management.sql`
   - `supabase/migrations/20260609015314_alpha_v01_security_hardening.sql`
   - `supabase/migrations/sponsored_staff_only.sql`
   - `supabase/migrations/beta_season_01_data.sql`
   - `supabase/migrations/beta_season_02_standings.sql`
3. Optionally run `supabase/seed.sql` for starter clubs and one challenge.
4. Enable Authentication -> Providers -> Discord.
5. Add the Supabase callback URL to the Discord app:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. In Supabase Authentication -> URL Configuration, set:
   - Site URL: `https://gripcafe.com`
   - Redirect URLs: `https://gripcafe.com`, `https://*.pages.dev` (preview), and `http://localhost:5173`

## First Admin

After signing in once with Discord, promote your profile from the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_ID';
```

You can find your auth user ID in Authentication -> Users. Do this from the SQL
Editor only; browser users cannot update their own `role`.

## Security Notes

- Never expose a Supabase `service_role` key or `sb_secret_...` key in the
  frontend or Cloudflare Pages environment variables.
- RLS must be enabled before production. The migrations enable RLS and add
  policies for profile, club, challenge, submission, membership, and review
  access.
- The V1 `proofs` Storage bucket is public. Uploaded proof files may be
  viewable by anyone with the file URL.

## What Is Wired

- Public clubs, challenges, challenge detail pages, archive, and stats read from Supabase.
- Discord auth creates a profile row automatically.
- Profile cosmetics update only safe profile columns.
- Club join/leave uses `club_members`.
- Challenge create/update is staff-gated by RLS.
- Submissions require a signed-in user, insert `user_id`, and can upload proof to the `proofs` Storage bucket.
- Admin review updates submission status and reviewer metadata, gated by staff RLS.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```
