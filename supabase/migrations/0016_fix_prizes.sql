-- 0016_fix_prizes.sql
-- Daily events: $5 Gift Card + Series points
-- Grand Finale: $50 Gift Card

update public.challenges set prize = '$5 Gift Card + Series points' where title = 'A-Class Festival Circuit' and sponsored = true;
update public.challenges set prize = '$5 Gift Card + Series points' where title = 'S2 Drift Zone Trial' and sponsored = true;
update public.challenges set prize = '$5 Gift Card + Series points' where title = 'R-Class Drag Sprint' and sponsored = true;
update public.challenges set prize = '$5 Gift Card + Series points' where title = 'B-Class Street Build' and sponsored = true;
update public.challenges set prize = '$5 Gift Card + Series points' where title = 'Photo Challenge: Rally Theme' and sponsored = true;
update public.challenges set prize = '$5 Gift Card + Series points' where title = 'S1 Road Circuit Trial' and sponsored = true;
