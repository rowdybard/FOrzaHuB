-- 0019_series_points.sql
-- Series points system for sponsored challenge events.
-- Everyone gets points (Forza-style), less for lower positions.
-- Points formula: max(1, 50 - (rank - 1)) → 1st=50, 2nd=49, ... 50th=1
-- View aggregates across all sponsored challenges for a club.

create or replace view public.series_standings
with (security_invoker = true) as
  with ranked as (
    select
      s.challenge_id,
      s.user_id,
      c.type_id,
      c.club_id,
      c.sponsored,
      -- Rank within each challenge: asc for time-based, desc for score/vote-based
      row_number() over (
        partition by s.challenge_id
        order by
          case when c.type_id in ('time_trial', 'drag_time') then s.value end asc nulls last,
          case when c.type_id in ('drift_score', 'photo_contest', 'build_battle') then s.value end desc nulls last,
          s.created_at asc
      ) as rank
    from public.submissions s
    join public.challenges c on c.id = s.challenge_id
    where s.status = 'approved'
      and c.sponsored = true
  )
  select
    r.user_id,
    r.club_id,
    p.gamertag,
    p.display_name,
    p.avatar_url,
    p.platform,
    count(*) as events_entered,
    sum(greatest(1, 50 - (r.rank - 1))) as total_points,
    max(greatest(1, 50 - (r.rank - 1))) as best_finish_points,
    min(r.rank) as best_finish
  from ranked r
  join public.profiles p on p.id = r.user_id
  group by r.user_id, r.club_id, p.gamertag, p.display_name, p.avatar_url, p.platform
  order by total_points desc, best_finish asc;
