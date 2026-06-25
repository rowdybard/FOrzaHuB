-- 0017_rename_challenges.sql
-- Rename seeded challenges to grounded motorsport names.

update public.challenges set title = 'A-Class Festival Circuit' where title = 'Opening Hot Lap' and sponsored = true;
update public.challenges set title = 'S2 Drift Zone Trial' where title = 'Drift After Dark' and sponsored = true;
update public.challenges set title = 'R-Class Drag Sprint' where title = 'Quarter Mile Kings' and sponsored = true;
update public.challenges set title = 'B-Class Street Build' where title = 'Build Battle Showcase' and sponsored = true;
update public.challenges set title = 'Photo Challenge: Rally Theme' where title = 'Photo Mode Masters' and sponsored = true;
update public.challenges set title = 'S1 Road Circuit Trial' where title = 'Grand Prix Heat' and sponsored = true;
update public.challenges set title = 'Finale: Clean Lap Challenge' where title = 'Grand Finale Showdown' and sponsored = true;
