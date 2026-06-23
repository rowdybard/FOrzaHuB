-- 0010_sponsored_challenges.sql
-- Adds sponsorship fields to challenges for monetization path.

alter table public.challenges add column if not exists sponsor text;
alter table public.challenges add column if not exists sponsored boolean not null default false;
