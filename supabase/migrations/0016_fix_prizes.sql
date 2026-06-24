-- 0016_fix_prizes.sql
-- Daily events earn series points, not $50 each.
-- Only the Grand Finale awards the $50 gift card.

update public.challenges set prize = 'Series points' where title = 'Opening Hot Lap' and sponsored = true;
update public.challenges set prize = 'Series points' where title = 'Drift After Dark' and sponsored = true;
update public.challenges set prize = 'Series points' where title = 'Quarter Mile Kings' and sponsored = true;
update public.challenges set prize = 'Series points' where title = 'Build Battle Showcase' and sponsored = true;
update public.challenges set prize = 'Series points' where title = 'Photo Mode Masters' and sponsored = true;
update public.challenges set prize = 'Series points' where title = 'Grand Prix Heat' and sponsored = true;
