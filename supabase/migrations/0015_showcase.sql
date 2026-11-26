-- ============================================================
-- Thousandfold — v2.3: profile showcase.
-- A styled title (an earned title + a colour style) shows next to
-- the player's name in chat and under each character on the
-- leaderboards. Styles are a short allow-listed id.
-- ============================================================
alter table public.profiles add column if not exists title text;
alter table public.profiles add column if not exists title_style text;
alter table public.leaderboard add column if not exists title text;
alter table public.leaderboard add column if not exists tstyle text;
update public.tf_config set value = 24000 where key = 'card_max_bytes';

create or replace function tf_private.title_ok(t text) returns boolean
language sql immutable as $$ select t is null or (char_length(t) <= 40 and t !~ '[<>{}\\]') $$;
create or replace function tf_private.style_ok(s text) returns boolean
language sql immutable as $$ select s is null or s ~ '^[a-z0-9]{1,16}$' $$;

-- p_title/p_style: shown in chat. p_rows: [{cid, title, style}] for the leaderboard.
create or replace function public.tf_set_showcase(p_title text, p_style text, p_rows jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); r jsonb; t text; s text;
begin
  t := nullif(btrim(coalesce(p_title, '')), ''); s := nullif(p_style, '');
  if not tf_private.title_ok(t) or not tf_private.style_ok(s) then raise exception 'Bad title.'; end if;
  if t is not null and tf_private.name_problem(left(t, 24)) is not null then raise exception 'Bad title.'; end if;
  update public.profiles set title = t, title_style = case when t is null then null else s end where user_id = u;
  if p_rows is not null and jsonb_typeof(p_rows) = 'array' and jsonb_array_length(p_rows) <= 4 then
    for r in select * from jsonb_array_elements(p_rows) loop
      t := nullif(btrim(coalesce(r->>'title', '')), ''); s := nullif(r->>'style', '');
      if not tf_private.title_ok(t) or not tf_private.style_ok(s) then continue; end if;
      if t is not null and tf_private.name_problem(left(t, 24)) is not null then continue; end if;
      update public.leaderboard set title = t, tstyle = case when t is null then null else s end where user_id = u and cid = left(r->>'cid', 40);
    end loop;
  end if;
  return true;
end $$;
revoke all on function public.tf_set_showcase(text, text, jsonb) from public, anon;
grant execute on function public.tf_set_showcase(text, text, jsonb) to authenticated;

create or replace function public.tf_chat_get(p_channel text, p_after bigint default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); ch text; r jsonb;
begin
  ch := tf_private.channel_for(u, p_channel);
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'from', sender, 'name', name, 'body', body, 'at', created_at, 'mine', sender = u, 'title', title, 'tstyle', title_style) order by id), '[]'::jsonb) into r
  from (
    select m.id, m.sender, coalesce(p.name, '?') name, m.body, m.created_at, p.title, p.title_style
    from public.chat_messages m left join public.profiles p on p.user_id = m.sender
    where m.channel = ch and m.id > coalesce(p_after, 0) and not m.deleted
      and not exists (select 1 from public.blocks k where k.blocker = u and k.blocked = m.sender)
    order by m.id desc limit public.tf_cfg('chat_page')::integer
  ) s;
  return r;
end $$;

create or replace view public.tf_leaderboard with (security_invoker = on) as
  select user_id, cid, name, cls, race, ascn as "asc", level, prog, ach, gold, kills, species, coll, ver, updated_at, title, tstyle
  from public.leaderboard
  where not flagged and not tf_private.is_banned(user_id);
grant select on public.tf_leaderboard to anon, authenticated;
