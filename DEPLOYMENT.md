# Deploying Pitwall

Pitwall is a static React SPA. It deploys to **Cloudflare Pages** and (optionally)
talks directly to **Supabase** for data, auth and proof storage. With no Supabase
env vars set, the app runs entirely on local mock data — so you can deploy first and
wire the backend later.

---

## Phase 1 — Static deploy to Cloudflare Pages (no backend)

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo and set:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 18 or 20 (add env var `NODE_VERSION=20` if needed)
4. Deploy. SPA routing works because `public/_redirects` serves `/index.html` (200)
   for every path — refreshing `/archive` or `/c/:slug` won't 404.

Every push to `main` redeploys; pull requests get preview URLs automatically.

---

## Phase 2 — Supabase backend

### 2a. Create the project
1. [supabase.com](https://supabase.com) → **New project** (free tier).
2. **Project Settings → API** → copy the **Project URL** and **anon public key**.

### 2b. Apply the schema
Run `supabase/migrations/0001_init.sql` in the Supabase **SQL Editor** (or
`supabase db push` with the CLI). Optionally run `supabase/seed.sql` for starter data.

This creates: `profiles`, `clubs`, `challenges`, `submissions`, a `leaderboard`
view, the `proofs` storage bucket, and all Row-Level Security policies.

### 2c. Auth (optional but recommended)
- **Authentication → Providers → Discord**: enable and paste your Discord OAuth
  app's client ID/secret. Add the Supabase callback URL to the Discord app.
- New users get a `profiles` row with role `racer`. Promote yourself to `admin`:
  ```sql
  update public.profiles set role = 'admin' where gamertag = 'YOUR_TAG';
  ```

### 2d. Wire env vars
- Locally: copy `.env.example` → `.env.local` and fill in the two values.
- Cloudflare Pages: **Settings → Environment variables** → add
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production + Preview), then redeploy.

> The anon key is meant to be public. Security is enforced by RLS, not secrecy.

---

## Phase 3 — Swap mock data for Supabase (incremental)

The data layer is the single seam to change. `src/lib/supabase.js` exposes
`supabase` and `isSupabaseEnabled`. Migrate one page at a time; keep the mock as the
fallback so the app never breaks mid-migration.

Suggested order (low → high risk):

- [ ] `ArchivePage` + `ChallengesPage` — read closed/live challenges
- [ ] `ChallengePage` — read one challenge + its `leaderboard` rows
- [ ] `CommunityPage` — read club + its challenges
- [ ] `SubmitScorePage` — `insert` into `submissions` + upload proof to `proofs` bucket
- [ ] `AdminDashboard` — read pending/flagged, `update` status (staff only)
- [ ] `CreateChallengePage` — `insert`/`update` challenges (staff only)

Recommended pattern — a hook per resource (e.g. `src/hooks/useChallenges.js`):

```js
import { useEffect, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { challenges as mock } from '../data/mock'

export function useChallenges(filter = {}) {
  const [data, setData] = useState(isSupabaseEnabled ? null : mock)
  const [loading, setLoading] = useState(isSupabaseEnabled)

  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      let q = supabase.from('challenges').select('*, clubs(*)')
      if (filter.status) q = q.eq('status', filter.status)
      const { data } = await q.order('end_date', { ascending: false })
      if (active) { setData(data ?? []); setLoading(false) }
    })()
    return () => { active = false }
  }, [filter.status])

  return { data, loading }
}
```

Proof upload in `SubmitScorePage`:

```js
const path = `${challengeId}/${crypto.randomUUID()}-${file.name}`
await supabase.storage.from('proofs').upload(path, file)
const { data } = supabase.storage.from('proofs').getPublicUrl(path)
// store data.publicUrl as submissions.proof_url
```

---

## Free-tier ceilings (plenty for a launch)

| Service           | Free limit                        |
| ----------------- | --------------------------------- |
| Cloudflare Pages  | Unlimited static requests/bandwidth, 500 builds/mo |
| Supabase DB       | 500 MB Postgres                   |
| Supabase Storage  | 1 GB                              |
| Supabase Auth     | 50,000 monthly active users       |

If proof storage becomes the bottleneck, point uploads at Cloudflare **R2** (10 GB
free) and keep only the URL in Supabase.

---

## Local commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build locally
```
