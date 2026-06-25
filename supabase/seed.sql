-- GripCafe — minimal seed for a fresh Supabase project.
-- Run after 0001_init.sql. This seeds two clubs and one live challenge so the
-- UI has something to render before real data exists. For the full demo data
-- set, port the arrays in `src/data/mock.js`.
-- ----------------------------------------------------------------------------

insert into public.clubs (slug, name, tag, region, members, verified, accent, tagline, founded)
values
  ('apex-collective', 'Apex Collective', 'APX', 'Europe', 1284, true, '#06b6d4',
    'Clean racing, fast laps, zero contact.', 'Mar 2024'),
  ('drift-republica', 'Drift República', 'DRP', 'Latin America', 967, true, '#e879f9',
    'Angle over everything.', 'Nov 2023')
on conflict (slug) do nothing;

insert into public.challenges
  (slug, type_id, title, club_id, status, season, featured, start_date, end_date,
   region, restriction, location, prize, description, rules)
select
  'sierra-verde-sprint', 'time_trial', 'Sierra Verde Clean Lap Sprint',
  c.id, 'live', 'Summer 2025', true,
  now() - interval '4 days', now() + interval '3 days',
  'Festival Circuit', 'A-Class (800 PI) · AWD only', 'Sierra Verde Circuit',
  '3-month GripCafe Pro + winner livery feature',
  'One clean flying lap of the Sierra Verde Circuit. Cut the track and the lap is void.',
  array[
    'A-Class, capped at 800 PI. AWD drivetrain only.',
    'No track cuts — all four wheels must stay on the surface.',
    'Submit a clip of the full lap ending on the results screen.'
  ]
from public.clubs c
where c.slug = 'apex-collective'
on conflict (slug) do nothing;
