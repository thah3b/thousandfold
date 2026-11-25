-- Applied after 0001: moves the policy helpers out of the API-exposed schema
-- (Supabase security advisor), and documents admins/bans as dashboard-only.
create schema if not exists tf_private;
grant usage on schema tf_private to anon, authenticated;

create or replace function tf_private.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
create or replace function tf_private.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.bans where user_id = u) $$;
revoke all on function tf_private.is_admin(), tf_private.is_banned(uuid) from public;
grant execute on function tf_private.is_admin(), tf_private.is_banned(uuid) to anon, authenticated;

drop policy if exists "read leaderboard" on public.leaderboard;
create policy "read leaderboard" on public.leaderboard for select using (
  (not flagged and not tf_private.is_banned(user_id))
  or (select auth.uid()) = user_id
  or tf_private.is_admin()
);
create or replace view public.tf_leaderboard with (security_invoker = on) as
  select user_id, cid, name, cls, race, ascn as "asc", level, prog, ach, gold, kills, species, coll, ver, updated_at
  from public.leaderboard
  where not flagged and not tf_private.is_banned(user_id);
grant select on public.tf_leaderboard to anon, authenticated;

drop function if exists public.tf_is_admin();
drop function if exists public.tf_is_banned(uuid);

drop policy if exists "no client access" on public.admins;
create policy "no client access" on public.admins for all using (false);
drop policy if exists "no client access" on public.bans;
create policy "no client access" on public.bans for all using (false);
