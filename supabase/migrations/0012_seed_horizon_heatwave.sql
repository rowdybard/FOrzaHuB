-- 0012_seed_horizon_heatwave.sql
-- Seeds the 7 Horizon Heatwave daily events as real challenges in the DB.
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

  -- Day 1: Opening Hot Lap (Time Trial)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'opening-hot-lap-' || to_char(v_day1, 'YYYYMMDD'),
    'time_trial',
    'Opening Hot Lap',
    v_club_id,
    'upcoming',
    v_day1,
    v_day1 + interval '24 hours',
    'Festival Circuit',
    'Class A 800 — no assists except ABS',
    'Festival Circuit',
    '$50 Gift Card',
    'Single flying lap on the festival circuit. Fastest time sets the tone for the week.',
    array['Class A 800', 'ABS only — no TCS, no STM', 'Clean lap — no rewind', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 2: Drift After Dark (Drift Score)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'drift-after-dark-' || to_char(v_day1 + interval '1 day', 'YYYYMMDD'),
    'drift_score',
    'Drift After Dark',
    v_club_id,
    'upcoming',
    v_day1 + interval '1 day',
    v_day1 + interval '2 days',
    'Festival Circuit',
    'Class S 900 — drift tune',
    'Drift Zone — Night',
    '$50 Gift Card',
    'Highest single drift score under the night sky.',
    array['Class S 900', 'Single drift zone run', 'No rewind', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 3: Quarter Mile Kings (Drag Time)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'quarter-mile-kings-' || to_char(v_day1 + interval '2 days', 'YYYYMMDD'),
    'drag_time',
    'Quarter Mile Kings',
    v_club_id,
    'upcoming',
    v_day1 + interval '2 days',
    v_day1 + interval '3 days',
    'Drag Strip',
    'Class S2 998 — drag tune',
    'Quarter Mile Drag Strip',
    '$50 Gift Card',
    'Standing start to finish. Lowest elapsed time wins.',
    array['Class S2 998', 'Standing start', 'No launch control assists', 'Video proof showing start and finish'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 4: Build Battle Showcase (Build Battle)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'build-battle-showcase-' || to_char(v_day1 + interval '3 days', 'YYYYMMDD'),
    'build_battle',
    'Build Battle Showcase',
    v_club_id,
    'upcoming',
    v_day1 + interval '3 days',
    v_day1 + interval '4 days',
    'Festival Circuit',
    'Class B 700 — street legal',
    'Photo Mode + Share Code',
    '$50 Gift Card',
    'Build a car to the brief. Community vote decides the cleanest build.',
    array['Class B 700', 'Street legal body kit', 'Submit 3 photos: front, rear, tune sheet', 'Include build share code'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 5: Photo Mode Masters (Photo Contest)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'photo-mode-masters-' || to_char(v_day1 + interval '4 days', 'YYYYMMDD'),
    'photo_contest',
    'Photo Mode Masters',
    v_club_id,
    'upcoming',
    v_day1 + interval '4 days',
    v_day1 + interval '5 days',
    'Festival Circuit',
    'Any car — any location',
    'Photo Mode',
    '$50 Gift Card',
    'Capture the perfect shot. Most votes takes the day.',
    array['In-game Photo Mode only', 'No external overlays or watermarks', 'One submission per racer', 'PNG, JPG, or WEBP'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 6: Grand Prix Heat (Time Trial)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'grand-prix-heat-' || to_char(v_day1 + interval '5 days', 'YYYYMMDD'),
    'time_trial',
    'Grand Prix Heat',
    v_club_id,
    'upcoming',
    v_day1 + interval '5 days',
    v_day1 + interval '6 days',
    'GP Circuit',
    'Class S1 900 — GP tune',
    'Grand Prix Circuit',
    '$50 Gift Card',
    'Three-lap average on the GP circuit. Consistency is king.',
    array['Class S1 900', '3 consecutive laps', 'No rewind', 'Video proof of full 3-lap run'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;

  -- Day 7: Grand Finale Showdown (Time Trial)
  insert into public.challenges (slug, type_id, title, club_id, status, start_date, end_date, region, restriction, location, prize, description, rules, visibility, sponsor, sponsored)
  values (
    'grand-finale-showdown-' || to_char(v_day1 + interval '6 days', 'YYYYMMDD'),
    'time_trial',
    'Grand Finale Showdown',
    v_club_id,
    'upcoming',
    v_day1 + interval '6 days',
    v_day1 + interval '7 days',
    'Festival Circuit',
    'Class S2 998 — no restrictions',
    'Festival Circuit — Full',
    '$50 Gift Card',
    'Winner-takes-all final race. Champion crowned, gift card awarded.',
    array['Class S2 998', 'Single flying lap', 'No assists except ABS', 'Screenshot or video proof required'],
    'public',
    'GripCafe',
    true
  ) on conflict (slug) do nothing;
end
$seed$;

-- Run the lifecycle transition to set correct statuses based on dates.
select app_private.transition_challenge_statuses();
