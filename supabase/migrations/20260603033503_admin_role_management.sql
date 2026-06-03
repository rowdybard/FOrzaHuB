-- Admin-only profile role management.
-- ----------------------------------------------------------------------------
-- Lets admins grant/revoke racer, steward, and admin access from the app while
-- keeping ordinary profile edits scoped to safe self-service columns.

create or replace function app_private.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function app_private.is_admin() from public, anon, authenticated;
grant execute on function app_private.is_admin() to authenticated;

grant update (role) on public.profiles to authenticated;

drop policy if exists "admins manage profile roles" on public.profiles;

create policy "admins manage profile roles"
  on public.profiles for update to authenticated
  using (
    app_private.is_admin()
    and id <> auth.uid()
  )
  with check (
    app_private.is_admin()
    and id <> auth.uid()
  );

create or replace function app_private.enforce_profile_role_limits()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  if not app_private.is_admin() then
    raise exception 'Only admins can change staff access.';
  end if;

  if old.id = auth.uid() then
    raise exception 'Admins cannot change their own access from the dashboard.';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_profile_role_limits() from public, anon, authenticated;

drop trigger if exists profile_role_limits on public.profiles;
create trigger profile_role_limits
  before update of role on public.profiles
  for each row execute function app_private.enforce_profile_role_limits();
