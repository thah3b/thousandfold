-- ============================================================
-- Thousandfold v2.3b: players who are on the leaderboards but
-- haven't chosen a display name yet get a basic profile built
-- from their leaderboard rows, instead of "Player not found".
-- ============================================================
create or replace function public.tf_profile_get(p_code text default null, p_user uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.profiles; pc public.player_cards; g record; rows jsonb;
begin
  if p_user is not null then select * into p from public.profiles where user_id = p_user;
  else select * into p from public.profiles where upper(code) = upper(btrim(coalesce(p_code, ''))); end if;
  if p.user_id is null then
    if p_user is null or exists (select 1 from public.bans where user_id = p_user) then return null; end if;
    select jsonb_agg(jsonb_build_object('name', l.name, 'cls', l.cls, 'race', l.race, 'asc', l.ascn, 'level', l.level,
             'ach', l.ach, 'coll', l.coll, 'kills', l.kills, 'species', l.species, 'title', l.title, 'tstyle', l.tstyle) order by l.ascn desc, l.level desc),
           max(l.updated_at)
      into rows, pc.updated_at
      from public.leaderboard l where l.user_id = p_user and not l.flagged;
    if rows is null then return null; end if;
    return jsonb_build_object('id', p_user, 'basic', true, 'name', rows->0->>'name', 'me', p_user = me, 'rows', rows, 'updated', pc.updated_at);
  end if;
  if exists (select 1 from public.bans where user_id = p.user_id) then return null; end if;
  select * into pc from public.player_cards where user_id = p.user_id;
  select gl.name, gl.tag, gm.rank into g from public.guild_members gm join public.guilds gl on gl.id = gm.guild_id where gm.user_id = p.user_id;
  return jsonb_build_object(
    'id', p.user_id, 'name', p.name, 'code', p.code, 'joined', p.created_at, 'me', p.user_id = me,
    'online', p.last_seen > now() - interval '5 minutes',
    'guild', case when g.name is null then null else jsonb_build_object('name', g.name, 'tag', g.tag, 'rank', g.rank) end,
    'hidden', coalesce(pc.hidden, false),
    'card', case when pc.user_id is null or (pc.hidden and p.user_id is distinct from me) then null else pc.card end,
    'updated', pc.updated_at);
end $$;
revoke all on function public.tf_profile_get(text, uuid) from public;
grant execute on function public.tf_profile_get(text, uuid) to anon, authenticated;
