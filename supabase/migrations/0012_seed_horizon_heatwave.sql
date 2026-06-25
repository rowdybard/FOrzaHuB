-- 0012_seed_horizon_heatwave.sql
-- Seeds the 7 GripCafe Beta Race Series events as real challenges in the DB.
-- All events belong to season 'beta-1'. $50 prize is for the overall champion only.
-- Idempotent: uses ON CONFLICT (slug) DO NOTHING so re-running is safe.

-- Create a GripCafe club if none exists yet.
insert into public.clubs (slug, name, tag, region, members, verified, accent, tagline, about, discord)
select 'gripcafe', 'GripCafe', 'GC', 'Global', 0, true, '#ff6b2c',
        'Community-run event platform',
        'GripCafe is a community hub for Forza Horizon competitive events — time trials, drift scores, drag races, photo contests, and build battles.',
        'https://discord.gg/GJw3XRuCXr'
where not exists (select 1 from public.clubs where slug = 'gripcafe');

-- Insert the 7 daily events. Each runs for 24 hours starting next Sunday 6 PM UTC.
-- Dates are computed relative to now at insert time.

do $seed$
declare
  v_club_id uuid;
  v_sunday timestamptz;
  v_day1 timestamptz;
begin
  select id into v_club_id from public.clubs where slug = 'gripcafe' limit 1;
  if v_club_id is null then return; end if;

  -- Next Sunday 6 PM UTC
  v_sunday := date_trunc('week', now() at time zone 'UTC') + interval '7 days' + interval '18 hours';
  -- If today is Sunday, use today
  if extract(dow from now() at time zone 'UTC') = 0 then
    v_sunday := date_trunc('day', now() at time zone 'UTC') + interval '18 hours';
  end if;
  v_day1 := v_sunday;

  -- Day 1: A-Class Festival Circuit (Time Trial)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'opening-hot-lap-' || to_char(v_day1, 'YYYYMMDD'),
    'time_trial',
    'A-Class Festival Circuit',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1,
    v_day1 + interval '24 hours',
    'Festival Circuit',
    'Class A — no assists except ABS',
    'Festival Circuit',
    'Series points',
    'Single flying lap on the festival circuit. Fastest time sets the tone for the week.',
    array['Class A', 'ABS only — no TCS, no STM', 'Clean lap — no rewind', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 2: S2 Drift Zone Trial (Drift Score)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'drift-after-dark-' || to_char(v_day1 + interval '1 day', 'YYYYMMDD'),
    'drift_score',
    'S2 Drift Zone Trial',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '1 day',
    v_day1 + interval '2 days',
    'Festival Circuit',
    'Class S2 — drift tune',
    'Drift Zone — Night',
    'Series points',
    'Highest single drift score under the night sky.',
    array['Class S2', 'Single drift zone run', 'No rewind', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 3: R-Class Drag Sprint (Drag Time)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'quarter-mile-kings-' || to_char(v_day1 + interval '2 days', 'YYYYMMDD'),
    'drag_time',
    'R-Class Drag Sprint',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '2 days',
    v_day1 + interval '3 days',
    'Drag Strip',
    'Class R — drag tune',
    'Quarter Mile Drag Strip',
    'Series points',
    'Standing start to finish. Lowest elapsed time wins.',
    array['Class R', 'Standing start', 'No launch control assists', 'Video proof showing start and finish'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 4: B-Class Street Build (Build Battle — showcase event)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'build-battle-showcase-' || to_char(v_day1 + interval '3 days', 'YYYYMMDD'),
    'build_battle',
    'B-Class Street Build',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '3 days',
    v_day1 + interval '4 days',
    'Festival Circuit',
    'Class B — street legal',
    'Photo Mode + Share Code',
    'Series points (showcase)',
    'Build a car to the brief. Community vote decides the cleanest build. Showcase event — participation points only.',
    array['Class B', 'Street legal body kit', 'Submit 3 photos: front, rear, tune sheet', 'Include build share code'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 5: Photo Challenge: Rally Theme (Photo Contest — showcase event)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'photo-mode-masters-' || to_char(v_day1 + interval '4 days', 'YYYYMMDD'),
    'photo_contest',
    'Photo Challenge: Rally Theme',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '4 days',
    v_day1 + interval '5 days',
    'Festival Circuit',
    'Any car — any location',
    'Photo Mode',
    'Series points (showcase)',
    'Capture the perfect shot. Most votes takes the day. Showcase event — participation points only.',
    array['In-game Photo Mode only', 'No external overlays or watermarks', 'One submission per racer', 'PNG, JPG, or WEBP'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 6: S1 Road Circuit Trial (Time Trial)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'grand-prix-heat-' || to_char(v_day1 + interval '5 days', 'YYYYMMDD'),
    'time_trial',
    'S1 Road Circuit Trial',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '5 days',
    v_day1 + interval '6 days',
    'GP Circuit',
    'Class S1 — GP tune',
    'Grand Prix Circuit',
    'Series points',
    'Three-lap average on the GP circuit. Consistency is king.',
    array['Class S1', '3 consecutive laps', 'No rewind', 'Video proof of full 3-lap run'],
    'public',
    'GripCafe',
    false
  ) on conflict (slug) do nothing;

  -- Day 7: Finale: Clean Lap Challenge (Time Trial — sponsored, $50 champion prize)
  insert into public.challenges (slug, type_id, title, club_id, status, season, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'grand-finale-showdown-' || to_char(v_day1 + interval '6 days', 'YYYYMMDD'),
    'time_trial',
    'Finale: Clean Lap Challenge',
    v_club_id,
    'upcoming',
    'beta-1',
    v_day1 + interval '6 days',
    v_day1 + interval '7 days',
    'Festival Circuit',
    'Class R — no restrictions',
    'Festival Circuit — Full',
    '$50 Gift Card (Beta Season Champion)',
    'Final event of the Beta Race Series. The overall points champion wins the $50 gift card.',
    array['Class R', 'Single flying lap', 'No assists except ABS', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;
end
$seed$;

-- Run the lifecycle transition to set correct statuses based on dates.
select app_private.transition_challenge_statuses();
