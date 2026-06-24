-- Fix PI class labels on already-seeded Horizon Heatwave challenges.
-- Class letters only — numbers are max thresholds, not requirements.

-- Day 1: Opening Hot Lap — Class A
update public.challenges
  set restriction = 'Class A — no assists except ABS',
      rules = array['Class A', 'ABS only — no TCS, no STM', 'Clean lap — no rewind', 'Screenshot or video proof required']
  where title = 'Opening Hot Lap' and sponsored = true;

-- Day 2: Drift After Dark — Class S2
update public.challenges
  set restriction = 'Class S2 — drift tune',
      rules = array['Class S2', 'Single drift zone run', 'No rewind', 'Screenshot or video proof required']
  where title = 'Drift After Dark' and sponsored = true;

-- Day 3: Quarter Mile Kings — Class R
update public.challenges
  set restriction = 'Class R — drag tune',
      rules = array['Class R', 'Standing start', 'No launch control assists', 'Video proof showing start and finish']
  where title = 'Quarter Mile Kings' and sponsored = true;

-- Day 4: Build Battle Showcase — Class B
update public.challenges
  set restriction = 'Class B — street legal',
      rules = array['Class B', 'Street legal body kit', 'Submit 3 photos: front, rear, tune sheet', 'Include build share code']
  where title = 'Build Battle Showcase' and sponsored = true;

-- Day 6: Grand Prix Heat — Class S1
update public.challenges
  set restriction = 'Class S1 — GP tune',
      rules = array['Class S1', '3 consecutive laps', 'No rewind', 'Video proof of full 3-lap run']
  where title = 'Grand Prix Heat' and sponsored = true;

-- Day 7: Grand Finale Showdown — Class R
update public.challenges
  set restriction = 'Class R — no restrictions',
      rules = array['Class R', 'Single flying lap', 'No assists except ABS', 'Screenshot or video proof required']
  where title = 'Grand Finale Showdown' and sponsored = true;
