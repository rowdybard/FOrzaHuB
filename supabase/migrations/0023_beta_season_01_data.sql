-- 0023_beta_season_01_data.sql
-- Master migration 1: Rename finale, set season='beta-1', fix prizes & sponsored flags.
-- Consolidates: 0021_rename_finale_challenge + 0022_beta_season
-- Run this BEFORE 0024_beta_season_02_standings.sql
-- NOTE: Disables the sponsored_staff_only trigger temporarily because the
-- Supabase SQL Editor has no auth context, so is_staff() returns false.

alter table public.challenges disable trigger trg_sponsored_staff_only;

-- ── Step 1: Rename day 7 finale ──────────────────────────────────────────────
update public.challenges
  set title = 'Finale: Clean Lap Challenge'
  where title = 'R-Class Festival Finale' and sponsored = true;

-- ── Step 2: Set season='beta-1' on all beta event slugs ──────────────────────
update public.challenges
  set season = 'beta-1'
  where sponsored = true
    and (slug like 'opening-hot-lap-%'
      or slug like 'drift-after-dark-%'
      or slug like 'quarter-mile-kings-%'
      or slug like 'build-battle-showcase-%'
      or slug like 'photo-mode-masters-%'
      or slug like 'grand-prix-heat-%'
      or slug like 'grand-finale-showdown-%');

-- Also catch any that were already unsponsored by a prior migration
-- but still match the beta slug pattern and have no season yet.
update public.challenges
  set season = 'beta-1'
  where season is null
    and (slug like 'opening-hot-lap-%'
      or slug like 'drift-after-dark-%'
      or slug like 'quarter-mile-kings-%'
      or slug like 'build-battle-showcase-%'
      or slug like 'photo-mode-masters-%'
      or slug like 'grand-prix-heat-%'
      or slug like 'grand-finale-showdown-%');

-- ── Step 3: Days 1-3, 6 — scoring events: unsponsor, prize = Series points ──
update public.challenges
  set sponsored = false,
      prize = 'Series points'
  where season = 'beta-1'
    and type_id in ('time_trial', 'drift_score', 'drag_time')
    and slug not like 'grand-finale-showdown-%';

-- ── Step 4: Days 4-5 — showcase events: unsponsor, participation-only ───────
update public.challenges
  set sponsored = false,
      prize = 'Series points (showcase)'
  where season = 'beta-1'
    and type_id in ('photo_contest', 'build_battle');

-- ── Step 5: Day 7 — finale: sponsored, $50 champion prize ───────────────────
update public.challenges
  set sponsored = true,
      prize = '$50 Gift Card (Beta Season Champion)',
      description = 'Final event of the Beta Race Series. The overall points champion wins the $50 gift card.'
  where season = 'beta-1'
    and slug like 'grand-finale-showdown-%';

alter table public.challenges enable trigger trg_sponsored_staff_only;
