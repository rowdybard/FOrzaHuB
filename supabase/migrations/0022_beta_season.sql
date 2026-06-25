-- 0022_beta_season.sql
-- Set season='beta-1' on existing seeded challenges and fix prizes/sponsored flags.
-- Days 1-6: season='beta-1', sponsored=false, prize='Series points' (or 'Series points (showcase)')
-- Day 7: season='beta-1', sponsored=true, prize='$50 Gift Card (Beta Season Champion)'

-- Set season on all currently-sponsored challenges that match the beta event slugs
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

-- Days 1-3, 6: scoring events — sponsored=false, prize='Series points'
update public.challenges
  set sponsored = false,
      prize = 'Series points'
  where season = 'beta-1'
    and type_id in ('time_trial', 'drift_score', 'drag_time')
    and slug not like 'grand-finale-showdown-%';

-- Days 4-5: showcase events — sponsored=false, prize='Series points (showcase)'
update public.challenges
  set sponsored = false,
      prize = 'Series points (showcase)'
  where season = 'beta-1'
    and type_id in ('photo_contest', 'build_battle');

-- Day 7: finale — sponsored=true (the $50 champion prize event)
update public.challenges
  set sponsored = true,
      prize = '$50 Gift Card (Beta Season Champion)',
      description = 'Final event of the Beta Race Series. The overall points champion wins the $50 gift card.'
  where season = 'beta-1'
    and slug like 'grand-finale-showdown-%';
