-- 0021_rename_finale_challenge.sql
-- Rename day 7 from "R-Class Festival Finale" to "Finale: Clean Lap Challenge"

update public.challenges
  set title = 'Finale: Clean Lap Challenge'
  where title = 'R-Class Festival Finale' and sponsored = true;
