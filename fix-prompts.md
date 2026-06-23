# ForzaHub — Fix Prompts

Individual prompts for each issue identified in the core challenge loop audit. Copy-paste each one into Cascade (Code mode) to implement the fix.

---

## Prompt 1: Challenge Lifecycle Automation (pg_cron)

```
Create a new Supabase migration file in supabase/migrations/ that automates challenge status transitions using pg_cron. The migration should:

1. Enable the pg_cron extension if not already enabled.
2. Create a PL/pgSQL function `app_private.transition_challenge_statuses()` that:
   - Updates challenges with status='upcoming' to 'live' where start_date <= now()
   - Updates challenges with status='live' to 'closed' where end_date <= now()
3. Schedules the function to run every 5 minutes via pg_cron.
4. Also run the function once immediately so existing stale challenges are corrected on deploy.

Make the migration idempotent (use IF NOT EXISTS, DROP IF EXISTS patterns). Name the file with a descriptive name like `0006_challenge_lifecycle_automation.sql`.
```

---

## Prompt 2: Manual "Close Challenge" Button

```
In src/pages/CommunityPage.jsx, add a "Close now" button to the AdminTools component for each challenge that has status 'live' or 'upcoming'. The button should:

1. Call updateChallenge(challenge.id, { status: 'closed' }) from src/data/api.js
2. Show a confirm dialog: "Close '{title}'? This will lock all submissions."
3. Disable the button while the request is in flight (use the existing busyId pattern)
4. Call onChanged() on success to reload the page data
5. Show an error message in the existing error display if it fails
6. Only show the button for challenges where status is 'live' or 'upcoming' (not already closed)

Place the button next to the existing Edit and Delete buttons in the challenge row.
```

---

## Prompt 3: One-Submission-Per-User Constraint

```
Create a new Supabase migration file in supabase/migrations/ that adds a unique constraint to prevent users from submitting more than once per challenge:

1. Create a unique index: CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_per_user ON submissions (challenge_id, user_id) WHERE status IN ('pending', 'approved');
   - This allows rejected submissions to not block re-submission, but prevents duplicate active submissions.
2. Add a helpful error message hint by adding a comment on the index.

Then update src/pages/SubmitScorePage.jsx:
1. Before rendering the submission form, check if the user already has a pending or approved submission for the selected challenge.
   - Add a function in src/data/api.js called `getUserSubmission(challengeId, userId)` that queries submissions where challenge_id and user_id match and status is 'pending' or 'approved', returns the first match or null.
2. If an existing submission is found, show a notice instead of the form:
   - "You already have a {status} submission for this challenge." with a link to view the challenge page.
   - If status is 'pending', show "Your submission is awaiting review."
   - If status is 'approved', show "Your result is on the leaderboard."
3. Do NOT block the form load while checking — show the form skeleton/loading state, then swap to the notice if a submission exists.
```

---

## Prompt 4: Wire Up Prerequisite/Qualifier Gate

```
In src/pages/SubmitScorePage.jsx, replace the hardcoded placeholder values for the prerequisite gate system. Currently lines ~92-94 have:

  const prereqSubmitted = false
  const prereqApproved = false
  const willBeHeld = false

Replace these with real logic:

1. Add a function in src/data/api.js called `getUserSubmissions(challengeIds, userId)` that queries submissions for the given challenge IDs and user ID, returning all matches (any status).
2. In SubmitScorePage, when a challenge has a prerequisite_id (check challenge.prerequisiteId or fetch the prerequisite challenge):
   - Fetch the user's submission for the prerequisite challenge
   - Set prereqSubmitted = true if a submission exists (any status)
   - Set prereqApproved = true if the submission status is 'approved'
   - Set willBeHeld = true if prereqSubmitted is true but prereqApproved is false
3. Update the canSubmit logic so that if a prereq exists and the user has NOT submitted to it, the submit button is disabled and the PrereqGate shows the "Qualifier required" state.
4. If prereqSubmitted but not approved, allow submission but mark it as held (willBeHeld = true) — the UI for this already exists in the SuccessView component.
5. Make sure this works correctly when switching between challenges in the dropdown — re-fetch prereq state when the selected challenge changes.
```

---

## Prompt 5: Filter Club-Only Challenges from Submit Dropdown

```
In src/data/api.js, update the `getSubmittableChallenges` function so that club-only (visibility='club') challenges are only included if the current user is a member of that club.

1. After fetching live challenges, fetch the current user's club memberships from the club_members table (user_id = current user).
2. Filter the challenge list: include a challenge if visibility='public' OR if visibility='club' AND the challenge's club_id is in the user's membership set.
3. If running in mock mode (isSupabaseEnabled is false), return all mock challenges as before.
4. Make sure the function still returns challenges with their club data attached.

Also add a visual indicator in src/pages/SubmitScorePage.jsx: in the challenge dropdown, append " (Members only)" to the option label for club-only challenges.
```

---

## Prompt 6: Add "My Submissions" View

```
Create a "My Submissions" view so users can track the status of their submissions after leaving the success screen.

1. In src/data/api.js, add a function `getMySubmissions()` that:
   - Gets the current user's ID via requireCurrentUserId()
   - Queries submissions where user_id = current user, joined with challenges (challenge_id) and profiles
   - Returns an array of submissions sorted by created_at descending, each with: id, status, value, title, challengeTitle, challengeSlug, challengeTypeId, proofUrl, proofType, submittedAt, reviewedAt, flag

2. Create a new component src/components/common/MySubmissions.jsx that:
   - Takes a list of submissions and renders them as a table or card list
   - Shows: challenge title (link to /c/{slug}), submitted result, status badge (pending=amber, approved=emerald, rejected=rose, flagged=orange), submission date, and a link to view the challenge
   - Shows an empty state if no submissions exist

3. In src/pages/ProfilePage.jsx, add a "My Submissions" section or tab that calls getMySubmissions() and renders the MySubmissions component. Use the existing useAsync hook pattern.

4. In src/pages/SubmitScorePage.jsx, in the SuccessView component, add a link to the profile page with text "Track your submissions" below the existing buttons.
```

---

## Prompt 7: Fix proof_type Derivation

```
In src/pages/SubmitScorePage.jsx, fix the proof_type field so it reflects the actual proof method rather than being hardcoded based on challenge type.

Currently line ~158: `proof_type: isGallery ? 'photo' : 'video'`

Replace with logic that determines proof_type from what the user actually provided:
1. If the user uploaded a file (form.file is set), the proof_type should be 'screenshot' for non-gallery challenges (since the upload only accepts image types: PNG, JPG, WEBP) and 'photo' for gallery challenges.
2. If the user provided a link (form.link is set), infer the proof_type:
   - If the link contains youtube.com, youtu.be, medal.tv, tiktok.com, streamable.com, or xbox.com → 'video'
   - Otherwise (image link) → 'screenshot' for non-gallery, 'photo' for gallery
3. Update the proofHint text in src/lib/challengeTypes.js for non-gallery types to clarify that users can upload a screenshot OR link a video, since the current proofHint only mentions video links.

Make sure the DB constraint (proof_type in 'video', 'photo', 'screenshot') is satisfied in all cases.
```

---

## Prompt 8: Leaderboard Tie-Breaking

```
In src/data/api.js, update the `buildBoard` function to add deterministic tie-breaking for leaderboard entries.

Currently (lines ~172-183), entries are sorted only by value. Update the sort to use a secondary sort key:

1. For time-based challenges (sort === 'asc'): sort by value ascending, then by submittedAt ascending (earliest submission wins ties).
2. For score-based challenges (sort === 'desc'): sort by value descending, then by submittedAt ascending (earliest submission wins ties).
3. For gallery challenges (votes): sort by votes descending, then by submittedAt ascending.

The submittedAt field is already available on the submission objects passed to buildBoard. Make sure the sort is stable.
```

---

## Prompt 9: Fix setPrimaryClub Race Condition

```
In src/data/api.js, fix the `setPrimaryClub` function to use a single atomic operation instead of two separate UPDATE calls.

Currently the function does:
1. UPDATE club_members SET is_primary = false WHERE user_id = current user
2. UPDATE club_members SET is_primary = true WHERE club_id = X AND user_id = current user

Replace with a single SQL approach. Create a new Supabase migration that defines a PL/pgSQL RPC function `app_private.set_primary_club(p_club_id uuid, p_user_id uuid)` that:
1. Sets is_primary = false for all of the user's memberships
2. Sets is_primary = true for the specified club membership
3. Returns void
4. Is marked SECURITY DEFINER with search_path = public
5. Has EXECUTE granted to authenticated users

Then update setPrimaryClub in api.js to call supabase.rpc('set_primary_club', { p_club_id: clubId, p_user_id: currentUserId }) instead of the two separate updates.

Name the migration file `0007_set_primary_club_rpc.sql`.
```

---

## Prompt 10: Add Submission Edit/Withdraw

```
Add the ability for users to edit or withdraw a pending submission.

1. In src/data/api.js, add two functions:
   - `updateSubmission(id, payload)`: Updates a submission's value, title, share_code, proof_url, proof_type, and note. Only allowed when status='pending'. The DB trigger already blocks non-staff updates, so add a new migration that allows users to update their OWN pending submissions (add an RLS policy or modify the enforce_submission_limits trigger to allow self-updates when status='pending').
   - `withdrawSubmission(id)`: Deletes a submission. Add an RLS policy allowing users to delete their own submissions when status='pending'.

2. Create a new Supabase migration `0008_submission_self_service.sql`:
   - Add RLS policy: users can DELETE their own submissions where status='pending'
   - Update the enforce_submission_limits trigger: on UPDATE, allow if the user is the submission owner AND the current status is 'pending' (only allow updating value, title, share_code, proof_url, proof_type, note fields)

3. In the "My Submissions" view (from Prompt 6), add "Edit" and "Withdraw" buttons for submissions with status='pending':
   - Edit: link to a pre-filled submit form (add an optional submissionId param to SubmitScorePage that loads the existing submission data into the form)
   - Withdraw: confirm dialog, then call withdrawSubmission, then refresh the list

4. In src/App.jsx, add a route for editing: /submit/:slug/edit/:submissionId (or reuse /submit/:slug with a query param).
```

---

## Prompt 11: Fix StandingsCard Season Filtering

```
In src/pages/CommunityPage.jsx, fix the StandingsCard so it only aggregates results from the current season rather than all challenges ever.

1. The `clubStandings` function (lines ~56-73) currently takes all challenges. Update it to accept a season filter parameter.
2. In the main CommunityPage component, determine the "current season" — either from the most recent challenge's `season` field, or default to the current year.
3. Filter the challenges passed to clubStandings to only those matching the current season.
4. If no challenges have a season set, fall back to all challenges (backward compatible).
5. Update the StandingsCard label to show the actual season name: "Season standings — {season}" instead of just "Season standings".
6. If there are multiple seasons with results, add a small season selector dropdown above the standings list.
```

---

## Prompt 12: Wire or Remove Admin Export Button

```
In src/pages/AdminDashboard.jsx, the "Export" button (around line 175) and "All events" button have no onClick handlers. Either wire them up or remove them:

1. Export button: Implement a CSV export of the currently filtered submissions. On click:
   - Generate a CSV string from the filtered submissions list with columns: challenge, user, result, status, proof_url, submitted_at
   - Create a Blob and trigger a download as `submissions-export-{date}.csv`
   - Use a try/catch to handle errors

2. "All events" button: Link it to /challenges with a query param like ?staff=1 that could show all challenges regardless of visibility. Or simply link to /challenges.

If you prefer to keep it simple, remove both buttons entirely to avoid demo-only UI confusion.
```

---

## Prompt 13: Add Mock Challenge for Demo Mode

```
In src/data/mock.js, add at least one mock challenge with submissions so the core loop can be demonstrated without Supabase configured.

1. Add a mock challenge object to the challenges array with:
   - id: 'mock-tt-1'
   - slug: 'sierra-verde-time-trial'
   - typeId: 'time_trial'
   - title: 'Sierra Verde Clean Lap Sprint'
   - clubId: (reference the existing mock club's id)
   - status: 'live'
   - startDate: a date in the past
   - endDate: a date in the future
   - restriction: 'A-Class (800 PI) · RWD'
   - location: 'Sierra Verde Circuit'
   - region: 'Festival Circuit'
   - rules: ['No assists except ABS', 'Clean lap only — no wall riding', 'Stock tires']
   - visibility: 'public'
   - entries: 3-4 pre-built leaderboard entries with ranks, users, values (lap times), and proof
   - submissionCount: 4
   - participants: 4

2. Add a corresponding mock submissions array with 4 submissions (3 approved, 1 pending) referencing the mock challenge and mock users.

3. Update the mock helper functions (getChallengeBySlug, getChallenges, getChallengesByClub, getSubmittableChallenges, getClosedChallenges) to return this mock data appropriately.

4. Add a second mock challenge with status 'closed' so the archive page has content too.
```

---

## Prompt 14: Fix Site Stats racer Count

```
In src/data/api.js, fix the `getSiteStats` function so the `racers` count reflects distinct users rather than total submissions.

Currently (around line 572): `racers: submissions` with a comment "refined later via distinct user count."

Update to query the count of distinct user_id values from the submissions table:
1. Add a separate query: `supabase.from('submissions').select('user_id').not('user_id', 'is', null)` — or better, use a head request with a count if Supabase supports distinct counts. If not, fetch the data and count unique user_ids client-side.
2. Set `racers` to the distinct user count.
3. In mock mode, return a hardcoded realistic number like 3.
```

---

## Prompt 15: Add Sponsored Challenge Support

```
Add a lightweight sponsorship field to challenges so the app can support sponsored events as a monetization path.

1. Create a new Supabase migration `0009_sponsored_challenges.sql`:
   - ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS sponsor text;
   - ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS sponsored boolean NOT NULL DEFAULT false;
   - No RLS changes needed — sponsor is visible to everyone, writable by staff/club owners (same as other challenge fields).

2. In src/data/api.js, update normChallenge to include `sponsor` and `sponsored` in the normalized output.

3. In src/pages/CreateChallengePage.jsx, add an optional "Sponsor" field in the Details panel:
   - Text input for sponsor name (e.g., "Apex Tuning")
   - A checkbox or toggle for "This is a sponsored event"
   - Only visible to staff (isStaff) or club owners
   - Include sponsor and sponsored in the create/update payload

4. In src/components/common/ChallengeCard.jsx, add a small "Sponsored" badge (e.g., a star or dollar icon with the sponsor name) when challenge.sponsored is true. Style it subtly — a small amber/gold badge in the card header.

5. In src/pages/ChallengePage.jsx, show the sponsor name in the challenge header when sponsored is true, with a small "Sponsored by {sponsor}" label.
```

---

## Priority Order

If implementing sequentially, recommended order:

1. **Prompt 1** — Lifecycle automation (unblocks the entire loop)
2. **Prompt 2** — Manual close button (immediate control)
3. **Prompt 3** — One-submission constraint (data integrity)
4. **Prompt 5** — Filter club-only from submit dropdown (UX fix)
5. **Prompt 4** — Prerequisite gate (completes a feature)
6. **Prompt 6** — My submissions view (closes the loop)
7. **Prompt 8** — Tie-breaking (leaderboard correctness)
8. **Prompt 7** — Fix proof_type (data accuracy)
9. **Prompt 10** — Submission edit/withdraw (user experience)
10. **Prompt 9** — setPrimaryClub race condition (edge case)
11. **Prompt 11** — Season filtering (correctness)
12. **Prompt 12** — Admin export (polish)
13. **Prompt 13** — Mock challenge (demo mode)
14. **Prompt 14** — Stats racer count (polish)
15. **Prompt 15** — Sponsored challenges (monetization)
