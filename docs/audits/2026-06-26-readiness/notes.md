# GripCafe Readiness Audit - 2026-06-26

## Scope

Production site at https://gripcafe.com plus local repo checks in C:\FOrzaHuB.

## Captured Screens

- desktop-home.png: desktop homepage capture.
- mobile-home.png: narrow viewport homepage capture.
- mobile-challenges.png: narrow viewport challenges capture.

## Checks Run

- `npm run build`: passed. Vite still warns that the main JS chunk is over 500 kB.
- `npm audit --omit=dev`: passed with 0 vulnerabilities.
- Live routes checked: `/`, `/clubs`, `/challenges`, `/submit`, `/create`, `/archive`, `/robots.txt`, `/sitemap.xml`, `/og-image.png`.
- Live Supabase read probe with publishable key: public challenge and club rows are readable as expected.
- Live anon write probes:
  - Club insert blocked by RLS.
  - Submission insert blocked by trigger with "Submissions must be created by the signed-in user."
  - Old two-argument `set_primary_club` RPC not found.
  - New one-argument `set_primary_club` RPC denies anon.

## Main Findings

1. Production has stale test/live data: `Alpha e2e Test` is public and `live`, but its `end_date` has passed.
2. Challenge cards can render awkward ended copy when status and end date disagree.
3. Lifecycle status automation is not proven. `supabase migration list --linked` cannot run without `SUPABASE_ACCESS_TOKEN`.
4. SEO is good, but sitemap includes auth-gated or low-value routes such as `/me` and `/create`.
5. Missing asset paths fall through to the SPA as `200 text/html`; `/site.webmanifest` also returns HTML.
6. The challenge search input has no explicit accessible name beyond placeholder text.
7. Direct proof uploads are image-only while video proof is link-only. This is safe for V1, but should be documented as intentional launch policy.
8. Main JS bundle is still large enough to trigger Vite's chunk warning.

## Evidence Limits

The in-app browser control bridge failed in this session before attach. Live visual checks used Chrome/headless capture and DOM probes instead.
