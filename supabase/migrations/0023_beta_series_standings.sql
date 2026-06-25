-- 0023_beta_series_standings.sql
-- Rewrite series_standings view to filter by season instead of sponsored.
-- Photo/build events are showcase entries: participation gives a flat 10 points
-- (not ranked by score). Timed/score events are ranked normally.

create or replace view public.series_standings
with (security_invoker = true) as
  with ranked as (
    select
      s.challenge_id,
      s.user_id,
      c.type_id,
      c.club_id,
      c.season,
      -- Rank within each challenge: asc for time-based, desc for score-based
      -- Photo/build events get rank 1 for everyone (participation-only)
      row_number() over (
        partition by s.challenge_id
        order by
          case when c.type_id in ('time_trial', 'drag_time') then s.value end asc nulls last,
          case when c.type_id = 'drift_score' then s.value end desc nulls last,
          s.created_at asc
      ) as rank,
      -- Whether this is a showcase event (photo/build)
      (c.type_id in ('photo_contest', 'build_battle')) as is_showcase
    from public.submissions s
    join public.challenges c on c.id = s.challenge_id
    where s.status = 'approved'
      and c.season is not null
  )
  select
    r.user_id,
    r.club_id,
    r.season,
    p.gamertag,
    p.display_name,
    p.avatar_url,
    p.platform,
    count(*) as events_entered,
    -- Showcase events: flat 10 participation points
    -- Ranked events: max(1, 50 - (rank - 1)) → 1st=50, 2nd=49, ... 50th=1
    sum(
      case when r.is_showcase then 10
           else greatest(1, 50 - (r.rank - 1))
      end
    ) as total_points,
    max(
      case when r.is_showcase then 10
           else greatest(1, 50 - (r.rank - 1))
      end
    ) as best_finish_points,
    min(r.rank) as best_finish
  from ranked r
  join public.profiles p on p.id = r.user_id
  group by r.user_id, r.club_id, r.season, p.gamertag, p.display_name, p.avatar_url, p.platform
  order by total_points desc, best_finish asc;
