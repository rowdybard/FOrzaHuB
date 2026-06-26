# GripCafe

The community challenge hub for Forza Horizon 6 clubs and Discord communities.
Run weekly time trials, drift battles, drag shootouts, photo contests, and build
battles with verified proof and public leaderboards.

> Unofficial fan project. Not affiliated with or endorsed by Forza, Playground
> Games, Turn 10 Studios, or Microsoft.

GripCafe runs with local mock data when Supabase env vars are missing. Add
Supabase env vars and run the migrations to enable Discord auth, database reads
and writes, club membership, profile cosmetics, staff review, and proof storage.

## Tech Stack

- React 18 + Vite 5
- React Router 6
- Tailwind CSS 3
- Supabase Auth, Postgres, and Storage
- lucide-react icons

## Local Development

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to `.env.local` when wiring Supabase locally.

## Environment Variables

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_MAX_PROOF_UPLOAD_MB=10
```

Proof uploads are image-only (PNG, JPG/JPEG, WEBP). Video proof is link-only.
The V1 proofs Storage bucket is public — uploaded files may be viewable by
anyone with the file URL.

Use Supabase's browser-safe publishable key (`sb_publishable_...`) when
available. A legacy anon public key also works. Never put a `service_role` or
`sb_secret_...` key in this frontend.

## Pages

| Route | Page |
| --- | --- |
| `/` | Landing |
| `/challenges` | Browse challenges |
| `/archive` | Results archive |
| `/c/:slug` | Public challenge |
| `/clubs` | Browse communities |
| `/club/:slug` | Community / club |
| `/submit/:slug?` | Submit score or entry |
| `/admin` | Staff review dashboard |
| `/create/:slug?` | Create / edit challenge |
| `/me` | Profile cosmetics |

## Supabase

Apply all migrations in order:

```bash
supabase db push
```

The CLI handles migration ordering and tracks applied state automatically.

See `DEPLOYMENT.md` and `docs/auth.md` for Cloudflare Pages and Discord setup.

## Security Notes

- Never expose a Supabase `service_role` key or `sb_secret_...` key in Vite,
  Cloudflare Pages, browser code, or screenshots.
- RLS must be enabled and the migrations must be applied before production.
- The V1 `proofs` Storage bucket is public. Uploaded proof files may be
  viewable by anyone with the file URL.
