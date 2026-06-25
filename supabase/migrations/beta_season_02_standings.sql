-- beta_season_02_standings.sql
-- Master migration 2: Rewrite series_standings view for season-based scoring.
-- Consolidates: 0023_beta_series_standings
-- Run this AFTER beta_season_01_data.sql

-- Series standings now filter by season (not sponsored = true).
-- Photo/build events are showcase entries: flat 10 participation points.
-- Timed/score events are ranked: 1st=50, 2nd=49, ... 50th=1.

drop view if exists public.series_standings;
create view public.series_standings
with (security_invoker = true) as
  with ranked as (
    select
      s.challenge_id,
      s.user_id,
      c.type_id,
      c.club_id,
      c.season,
      row_number() over (
        partition by s.challenge_id
        order by
          case when c.type_id in ('time_trial', 'drag_time') then s.value end asc nulls last,
          case when c.type_id = 'drift_score' then s.value end desc nulls last,
          s.created_at asc
      ) as rank,
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
