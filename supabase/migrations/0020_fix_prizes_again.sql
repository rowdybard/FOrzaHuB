-- 0020_fix_prizes_again.sql
-- 0016 used new titles but ran before 0017 renamed them.
-- Update prizes on all sponsored challenges regardless of title.

update public.challenges set prize = '$5 Gift Card + Series points'
  where sponsored = true and title != 'R-Class Festival Finale';

update public.challenges set prize = '$50 Gift Card'
  where sponsored = true and title = 'R-Class Festival Finale';
