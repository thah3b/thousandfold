-- ============================================================
-- Thousandfold — v0.15: public player profiles.
-- Each signed-in player publishes a "card" (a snapshot of their
-- characters) that anyone can view by friend code or player id,
-- unless they hide it. Cards are a showcase, as trusted as the
-- leaderboards: the server checks their shape, sizes and names.
-- ============================================================

insert into public.tf_config (key, value) values
  ('card_min_ms', 60000),        -- one publish per minute
  ('card_max_bytes', 16000)
on conflict (key) do update set value = excluded.value;

create table if not exists public.player_cards (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  card       jsonb not null default '{}'::jsonb,
  hidden     boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.player_cards enable row level security;
drop policy if exists "rpc only" on public.player_cards; create policy "rpc only" on public.player_cards for all using (false);
revoke all on public.player_cards from anon, authenticated;

drop function if exists public.tf_profile_publish(jsonb, boolean);
create or replace function public.tf_profile_publish(p_card jsonb, p_hidden boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); last timestamptz; was_hidden boolean; c jsonb; pr text;
begin
  perform tf_private.need_profile(u);
  select updated_at, hidden into last, was_hidden from public.player_cards where user_id = u;
  -- Privacy changes always go through; other updates at most once a minute.
  if last is not null and was_hidden = coalesce(p_hidden, false) and now() - last < make_interval(secs => public.tf_cfg('card_min_ms') / 1000) then return false; end if;
  if p_card is null or jsonb_typeof(p_card) <> 'object' then raise exception 'Bad profile.'; end if;
  if octet_length(p_card::text) > public.tf_cfg('card_max_bytes') then raise exception 'Profile too large.'; end if;
  if jsonb_typeof(p_card->'chars') <> 'array' or jsonb_array_length(p_card->'chars') > 4 then raise exception 'Bad profile.'; end if;
  for c in select * from jsonb_array_elements(p_card->'chars') loop
    if jsonb_typeof(c) <> 'object' then raise exception 'Bad profile.'; end if;
    pr := tf_private.name_problem(c->>'name'); if pr is not null then raise exception 'A character name can''t be shown: %', pr; end if;
    if coalesce(c->>'title', '') <> '' and tf_private.name_problem(left(c->>'title', 24)) is not null then raise exception 'Bad title.'; end if;
  end loop;
  insert into public.player_cards (user_id, card, hidden, updated_at) values (u, p_card, coalesce(p_hidden, false), now())
  on conflict (user_id) do update set card = excluded.card, hidden = excluded.hidden, updated_at = now();
  return true;
end $$;

-- Anyone, signed in or not, can view a profile by friend code or player id.
create or replace function public.tf_profile_get(p_code text default null, p_user uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.profiles; pc public.player_cards; g record;
begin
  if p_user is not null then select * into p from public.profiles where user_id = p_user;
  else select * into p from public.profiles where upper(code) = upper(btrim(coalesce(p_code, ''))); end if;
  if p.user_id is null or exists (select 1 from public.bans where user_id = p.user_id) then return null; end if;
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

revoke all on function public.tf_profile_publish(jsonb, boolean) from public, anon;
grant execute on function public.tf_profile_publish(jsonb, boolean) to authenticated;
revoke all on function public.tf_profile_get(text, uuid) from public;
grant execute on function public.tf_profile_get(text, uuid) to anon, authenticated;
