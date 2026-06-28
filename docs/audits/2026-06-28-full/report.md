# GripCafe — Full Code Audit, Visual QA & Flow Review (2026-06-28)

Code-first audit of the GripCafe repo plus live verification against production `gripcafe.com`. High + Medium findings (and one quick Low security fix) were implemented in a follow-up pass; see "Fixes applied".

## Method

- **Repo:** `c:\FOrzaHuB` — full read of `src/` (pages, components, lib, hooks, data), `functions/`, all 32 `supabase/migrations/`, build config.
- **Build:** `npm run build` — passed (exit 0).
- **Production:** `curl` checks of HTML/headers/sitemap/robots/404 on `gripcafe.com`.
- **Flows:** traced in code + verified against production where anon-observable. No automated tests added (per request). No authenticated production session, so gated writes are reasoned from RLS + triggers.
- **Visual QA:** structural/HTML + source review (pixel screenshots out of scope per the narrowed request).

## Severity legend

Critical = exploit/data loss/auth bypass · High = broken behavior users will hit · Medium = degraded UX/perf/consistency · Low = minor/cosmetic/hardening · Info = positive/no action.

## Executive summary

- **No Critical issues.** No exposed secrets, no RLS/auth bypass. RLS is well-built with defense-in-depth triggers.
- **2 High:** broken "My Submissions" links + dead Edit flow; blank "Winner" on every closed challenge. **Both fixed.**
- **6 Medium, 6 Low.** UX/permission mismatches, an SSR sanitization gap, a perf-heavy background image, client-only moderation. **5 Medium fixed; M4 (image) deferred. All 6 Low fixed.**
- **Several prior-audit findings already fixed** (sitemap, manifest, 404s, bundle size, search a11y, stale data).

| Sev | Count | Fixed this pass |
| --- | --- | --- |
| Critical | 0 | — |
| High | 2 | 2 |
| Medium | 6 | 5 (M4 deferred) |
| Low | 6 | 6 |

---

## High

### H1 — "My Submissions" challenge links broken + Edit flow is dead — FIXED
- **Where:** `src/data/api.js` (`normSubmission`, `getMySubmissions`), `src/components/common/MySubmissions.jsx`, `src/pages/SubmitScorePage.jsx`.
- **Evidence:** `getMySubmissions` joined `challenges(...slug...)`, but `normSubmission` never mapped the slug, so `MySubmissions` linked to `/c/` and `/submit/?edit=`. `SubmitScorePage` ignores `?edit=`; even if wired, `enforce_submission_limits` blocks non-staff `UPDATE`.
- **Fix applied:** added `challengeSlug` to `normSubmission` and passed it in both `getMySubmissions` branches; removed the non-functional Edit button (withdraw + resubmit remains). Full edit is a follow-up (needs trigger/grant changes).

### H2 — Closed challenges always show a blank "Winner" — FIXED
- **Where:** `src/pages/ChallengePage.jsx` `EventDetails`.
- **Evidence:** rendered `challenge.winner?.tag`, but `winner` is never set on any challenge object.
- **Fix applied:** compute the winner from the top approved entry/gallery item; show "No entries" when empty.

---

## Medium

### M1 — Owners offered "Close now" that the DB rejects — FIXED
- **Where:** `src/pages/CommunityPage.jsx` `AdminTools`. The owner-limits trigger lets non-staff owners change only the title.
- **Fix applied:** gated the "Close now" button to staff (`isStaff`). (Optional follow-up: an owner-allowed close RPC.)

### M2 — High-contrast first-paint flash — FIXED
- **Where:** `src/main.jsx` added `high-contrast` client-side only; `index.html` + SSR doc emitted `class="dark"`.
- **Fix applied:** served HTML now emits `class="dark high-contrast"` in `index.html` and `functions/[[path]].js` so first paint matches hydration.

### M3 — SSR did not sanitize club Discord URLs — FIXED
- **Where:** `src/data/server-api.js` returned raw `row.discord` (client sanitized).
- **Fix applied:** added `cleanExternalUrl` (Discord-only allowlist) to `server-api.js normClub`, mirroring `api.js`.

### M4 — `background.png` is ~2.3 MB on every page — DEFERRED
- **Where:** `src/components/layout/ParallaxBackground.jsx` (`public/background.png`).
- **Why deferred:** needs an image pipeline (WebP/AVIF + compression), not a code edit. Recommend converting to WebP/AVIF, target <300 KB, optional smaller mobile variant.

### M5 — Content moderation is client-only (bypassable) — FIXED
- **Where:** `src/lib/moderation.js` enforced only in JS before insert; no DB trigger.
- **Fix applied:** new migration `supabase/migrations/20260628213000_server_side_moderation.sql` adds `app_private.contains_banned_word()` (same word list + leet/collapse + light passes as the client) and `BEFORE INSERT/UPDATE` triggers on `public.clubs` (name/tag/tagline/about) and `public.profiles` (display_name/gamertag). System context (`auth.uid()` null, e.g. Discord signup) is bypassed so sign-ups never hard-fail.
- **Intentional deviation:** the normalized-substring check is skipped for banned words whose normalized form is <3 chars, because the client's collapse pass reduces `kkk`→`k` (which would otherwise match almost any text); `kkk` is still caught by the exact-letters pass. The DB filter is therefore never stricter than the client.
- **Word-boundary matching (L4):** both client and DB now split text into words and check exact equality per word (light + normalized), eliminating Scunthorpe false positives. Multi-word/dotted banned terms still use substring matching on the light text.

### M6 — `useAsync` effect ignored its cleanup — FIXED
- **Where:** `src/hooks/useAsync.js`.
- **Fix applied:** `return load()` from the effect so stale/unmounted responses are cancelled.

---

## Low

### L1 — CSV export formula injection — FIXED
- **Where:** `src/pages/AdminDashboard.jsx` export.
- **Fix applied:** cells starting with `= + - @ \t \r` are prefixed with `'` before quoting.

### L2 — Copy inconsistency: "sim racing" vs "Forza Horizon 6" — FIXED
- **Where:** `src/components/layout/Footer.jsx`, `src/pages/SubmitScorePage.jsx`.
- **Fix applied:** replaced "sim racing" with "Forza Horizon 6" in both the Footer description and the SubmitScorePage SEO meta description, aligning with the rest of the site.

### L3 — Two SEO sources can diverge on client navigation — FIXED
- **Where:** `src/components/Seo.jsx` (Helmet) vs `src/lib/seo-meta.js` (SSR).
- **Fix applied:** added `ogType` prop to `Seo` (defaults to `'website'`); `ChallengePage` now passes `ogType="article"` to match SSR `seo-meta.js` which sets `ogType: 'article'` for `/c/:slug` routes.

### L4 — Moderation false positives (Scunthorpe problem) — FIXED
- **Where:** `src/lib/moderation.js`, `supabase/migrations/20260628213000_server_side_moderation.sql`.
- **Fix applied:** replaced substring matching with word-boundary matching in both client and DB. Text is split into words; each word is checked for exact equality against banned words (light and normalized forms). Multi-word/dotted banned terms (e.g. "trailer trash", "k.k.k") still use substring matching on the light text (negligible false-positive risk). "grape" no longer matches "rape", "scunthorpe" no longer matches "cunt", etc.

### L5 — No CSP / HSTS headers — FIXED
- **Where:** `functions/[[path]].js`.
- **Fix applied:** added `SECURITY_HEADERS` constant with `Strict-Transport-Security` (HSTS: max-age 1 year, includeSubDomains, preload) and a pragmatic `Content-Security-Policy` (allows `'self'` + `'unsafe-inline'` for scripts/styles needed by inline GA/JSON-LD/Helmet, restricts `object-src`/`frame-src` to `'none'`, limits `connect-src` to Supabase + Google Analytics, `base-uri`/`form-action` to `'self'`). Applied to all HTML responses (200, 404, SPA shell, 500) and HSTS to 301 redirects.

### L6 — `withdrawSubmission` relies on an implicit DELETE grant — FIXED
- **Where:** `supabase/migrations/20260628220000_explicit_submission_delete_grant.sql`.
- **Fix applied:** new migration adds `grant delete on public.submissions to authenticated;` so the capability is explicit and doesn't depend on Supabase defaults.

---

## Flow review

| Flow | Status | Notes |
| --- | --- | --- |
| Discord auth | OK | `useAuth` + `signInWithOAuth`; profile auto-created by `handle_new_user`. |
| Submit score/entry | OK | Client validates type/size/result; trigger forces `pending`, validates ownership/window/visibility; image-only proof policy. |
| Create club | OK | One-owned-club index; owner auto-added primary; RLS `owner_id = auth.uid()`. |
| Join/leave/set-primary/kick | OK | 5-club cap; `set_primary_club(uuid)` derives user from `auth.uid()`; owner-scoped kick. |
| Create challenge | OK | Owner limited to live/upcoming, public/club, no featured/season. |
| Edit challenge (owner) | OK (title only) | UI limits owners to title; Close now gated to staff (M1 fix). |
| Admin review | OK | Optimistic + rollback; staff-only via RLS + trigger; role mgmt admin-only. |
| Profile cosmetics | OK | Self-service vs exclusive badges enforced by trigger. |
| My Submissions | FIXED | H1 — links now resolve; dead Edit removed. |
| Public closed challenge | FIXED | H2 — real winner shown. |

## Security / RLS

Solid. RLS enabled on `profiles`, `clubs`, `challenges`, `submissions`, `club_members`. Writes are `to authenticated` with `auth.uid()` checks; anon read-only. Defense-in-depth `SECURITY DEFINER` triggers enforce ownership, field limits, status forcing, badge/role limits. `set_primary_club` hardened. No `service_role`/`sb_secret` in frontend. `proofs` bucket intentionally public + image-only upload. Residual: M5, L5, L6.

## SEO / SSR

Strong. SSR with per-route meta, canonical, OG/Twitter, JSON-LD. Verified live: dynamic `sitemap.xml` lists only public + `/c/*` + `/club/*`; real 404 with `no-store`; `site.webmanifest` as `application/manifest+json`; `robots.txt` with sitemap. Minor: L3.

## Performance (build output)

`npm run build` passed; **no chunk exceeds 500 KB** (prior warning resolved by `manualChunks`). Largest JS: `supabase` 210 KB (55 KB gz), `react-vendor` 164 KB (53 KB gz), main 104 KB (33 KB gz). Biggest real cost is `background.png` ~2.3 MB (M4).

## Accessibility

Decent: `aria-label`s on icon buttons, focus-visible ring, high-contrast layer (now flash-free, M2), mobile min-font bump. Gaps: some color-only status chips; verify mobile-menu/dialog focus handling.

## Fixed since prior audit (2026-06-26)

Sitemap excludes auth routes; manifest content-type correct; real 404s; search input `aria-label`; bundle split under 500 KB; date-aware card status; stale "Alpha e2e" data removed.

## Fixes applied this pass

- H1, H2, M1, M2, M3, M5, M6, L1–L6 implemented across `src/data/api.js`, `src/data/server-api.js`, `src/components/common/MySubmissions.jsx`, `src/pages/ChallengePage.jsx`, `src/pages/CommunityPage.jsx`, `src/pages/AdminDashboard.jsx`, `src/pages/SubmitScorePage.jsx`, `src/hooks/useAsync.js`, `src/components/layout/Footer.jsx`, `src/components/Seo.jsx`, `src/lib/moderation.js`, `index.html`, `functions/[[path]].js`.
- M5 + L4 DB side via `supabase/migrations/20260628213000_server_side_moderation.sql`.
- L6 via `supabase/migrations/20260628220000_explicit_submission_delete_grant.sql`.
- Both SQL migrations are not yet applied to the remote DB — run via your normal migration flow.
- Verified the JS changes with `npm run build` (passing).

## Deferred / backlog

- **M4** image optimization (asset pipeline).
- No other open items — all L-severity findings resolved.

## Checks run

- `npm run build` → exit 0 (before and after fixes).
- `curl` live: `/`, `/sitemap.xml`, `/robots.txt`, `/site.webmanifest` (manifest type), `/zzz-not-a-real-route` (404 no-store).
- Static read of all 32 migrations + full `src/` + `functions/`.
- Not run: `npm audit` (network), Lighthouse/screenshots, authenticated write probes.
