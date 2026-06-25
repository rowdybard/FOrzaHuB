-- sponsored_staff_only.sql
-- Prevent non-staff users from setting sponsored=true or sponsor != null.
-- Enforced via trigger before INSERT/UPDATE on challenges.

create or replace function app_private.enforce_sponsored_staff_only()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not app_private.is_staff() then
    if new.sponsored = true then
      raise exception 'Only staff can mark challenges as sponsored.';
    end if;
    if new.sponsor is not null then
      raise exception 'Only staff can set a sponsor name.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function app_private.enforce_sponsored_staff_only() from public, anon;
grant execute on function app_private.enforce_sponsored_staff_only() to authenticated;

drop trigger if exists trg_sponsored_staff_only on public.challenges;
create trigger trg_sponsored_staff_only
  before insert or update of sponsored, sponsor on public.challenges
  for each row
  execute function app_private.enforce_sponsored_staff_only();
