-- Additional public profile cosmetics used by the nameplate editor.
-- Run after the base schema/policies are already installed.

alter table public.profiles
  add column if not exists name_effect text not null default 'clean',
  add column if not exists plate_frame text not null default 'none',
  add column if not exists profile_title text;

alter table public.profiles
  drop constraint if exists profiles_name_effect_check;

alter table public.profiles
  add constraint profiles_name_effect_check
  check (name_effect in ('clean', 'glow', 'chrome', 'stripe', 'terminal', 'sticker'));

alter table public.profiles
  drop constraint if exists profiles_plate_frame_check;

alter table public.profiles
  add constraint profiles_plate_frame_check
  check (plate_frame in ('none', 'forum', 'carbon', 'neon', 'chrome', 'ribbon'));

alter table public.profiles
  drop constraint if exists profiles_profile_title_length_check;

alter table public.profiles
  add constraint profiles_profile_title_length_check
  check (profile_title is null or char_length(profile_title) <= 28);

grant select (name_effect, plate_frame, profile_title) on public.profiles to anon, authenticated;
grant update (name_effect, plate_frame, profile_title) on public.profiles to authenticated;
