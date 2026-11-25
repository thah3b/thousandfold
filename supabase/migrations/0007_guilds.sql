-- ============================================================
-- Thousandfold — Phase 13 (game v0.14): guilds.
-- Create or join a guild, ranks (leader, officer, member), guild chat,
-- a shared gold bank, and a weekly guild goal with mailed rewards.
-- Locked like every other table: RLS on, no policies; players use the
-- SECURITY DEFINER functions below.
-- ============================================================

insert into public.tf_config (key, value) values
  ('guild_max_members', 30),
  ('guild_contrib_max', 5000),      -- most points one report can add
  ('guild_contrib_ms', 50000),      -- at most one report per 50 s
  ('guild_goal_1', 20000), ('guild_goal_2', 80000), ('guild_goal_3', 250000),
  ('guild_bank_max', 1e15),
  ('ach_max', 2165)                 -- v0.14 adds achievements (lore, events, streaks, guild, perks)
on conflict (key) do update set value = excluded.value;

create table if not exists public.guilds (
  id          bigserial primary key,
  name        text not null,
  name_key    text not null unique,
  tag         text not null,
  tag_key     text not null unique,
  descr       text not null default '',
  open        boolean not null default true,
  bank        numeric not null default 0 check (bank >= 0),
  week        text not null default '',
  week_points numeric not null default 0,
  total_points numeric not null default 0,
  tiers_paid  integer not null default 0,
  created_at  timestamptz not null default now()
);
create table if not exists public.guild_members (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  guild_id    bigint not null references public.guilds (id) on delete cascade,
  rank        text not null check (rank in ('leader', 'officer', 'member')),
  joined_at   timestamptz not null default now(),
  week        text not null default '',
  week_points numeric not null default 0,
  total_points numeric not null default 0,
  last_report timestamptz
);
create index if not exists guild_members_guild_idx on public.guild_members (guild_id);
create table if not exists public.guild_requests (
  user_id  uuid not null references auth.users (id) on delete cascade,
  guild_id bigint not null references public.guilds (id) on delete cascade,
  at       timestamptz not null default now(),
  primary key (user_id, guild_id)
);
create table if not exists public.guild_log (
  id       bigserial primary key,
  guild_id bigint not null references public.guilds (id) on delete cascade,
  at       timestamptz not null default now(),
  text     text not null
);
create index if not exists guild_log_idx on public.guild_log (guild_id, id desc);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_requests enable row level security;
alter table public.guild_log enable row level security;
drop policy if exists "rpc only" on public.guilds;         create policy "rpc only" on public.guilds for all using (false);
drop policy if exists "rpc only" on public.guild_members;  create policy "rpc only" on public.guild_members for all using (false);
drop policy if exists "rpc only" on public.guild_requests; create policy "rpc only" on public.guild_requests for all using (false);
drop policy if exists "rpc only" on public.guild_log;      create policy "rpc only" on public.guild_log for all using (false);
revoke all on public.guilds, public.guild_members, public.guild_requests, public.guild_log from anon, authenticated;
revoke all on sequence public.guilds_id_seq, public.guild_log_id_seq from anon, authenticated;

-- ---------- Helpers ----------
create or replace function tf_private.week_key() returns text
language sql stable set search_path = public as $$ select to_char(now() at time zone 'utc', 'IYYY-"W"IW') $$;

create or replace function tf_private.my_guild(u uuid) returns public.guild_members
language sql stable security definer set search_path = public as
$$ select * from public.guild_members where user_id = u $$;

create or replace function tf_private.need_guild(u uuid, min_rank text default 'member') returns public.guild_members
language plpgsql stable security definer set search_path = public as $$
declare m public.guild_members;
begin
  select * into m from public.guild_members where user_id = u;
  if m.user_id is null then raise exception 'You are not in a guild.'; end if;
  if min_rank = 'officer' and m.rank = 'member' then raise exception 'Only officers and the leader can do that.'; end if;
  if min_rank = 'leader' and m.rank <> 'leader' then raise exception 'Only the guild leader can do that.'; end if;
  return m;
end $$;

create or replace function tf_private.guild_log_add(g bigint, t text) returns void
language sql security definer set search_path = public as
$$ insert into public.guild_log (guild_id, text) values (g, left(t, 200)) $$;

create or replace function tf_private.guild_mail(u uuid, p_subject text, p_body text, p_gold numeric, p_items jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.mail (to_user, from_user, from_name, subject, body, gold, items, expires_at)
  values (u, null, 'Your Guild', left(p_subject, 80), left(coalesce(p_body, ''), 500), greatest(0, floor(coalesce(p_gold, 0))), coalesce(p_items, '{}'::jsonb),
          now() + make_interval(days => public.tf_cfg('mail_keep_days')::integer))
$$;

-- Start a new week for a guild when the calendar week has turned.
create or replace function tf_private.guild_roll(g bigint) returns void
language plpgsql security definer set search_path = public as $$
declare wk text := tf_private.week_key();
begin
  update public.guilds set week = wk, week_points = 0, tiers_paid = 0 where id = g and week <> wk;
  update public.guild_members set week = wk, week_points = 0 where guild_id = g and week <> wk;
end $$;

-- Weekly goal rewards: every member at the time gets the tier's reward by mail.
create or replace function tf_private.guild_pay_tiers(g bigint) returns void
language plpgsql security definer set search_path = public as $$
declare gl public.guilds; t integer; r record; gold numeric; items jsonb; nm text;
begin
  select * into gl from public.guilds where id = g for update;
  for t in (gl.tiers_paid + 1) .. 3 loop
    exit when gl.week_points < public.tf_cfg('guild_goal_' || t);
    gold := case t when 1 then 2000 when 2 then 10000 else 50000 end;
    items := case t when 1 then '{"egg_common":1}'::jsonb when 2 then '{"egg_rare":1}'::jsonb else '{"egg_epic":1}'::jsonb end;
    nm := case t when 1 then 'Bronze' when 2 then 'Silver' else 'Gold' end;
    for r in select user_id from public.guild_members where guild_id = g loop
      perform tf_private.guild_mail(r.user_id, 'Guild goal: ' || nm || ' reached!', 'Your guild ' || gl.name || ' reached its ' || nm || ' goal this week. Here is your share.', gold, items);
    end loop;
    perform tf_private.guild_log_add(g, 'Reached the ' || nm || ' weekly goal. Rewards sent to every member.');
    update public.guilds set tiers_paid = t where id = g;
  end loop;
end $$;

create or replace function tf_private.guild_check(p_name text, p_tag text) returns void
language plpgsql stable set search_path = public as $$
declare pr text;
begin
  pr := tf_private.name_problem(p_name); if pr is not null then raise exception '%', replace(pr, 'name', 'guild name'); end if;
  if char_length(btrim(p_name)) < 3 then raise exception 'Guild names need at least 3 characters.'; end if;
  if p_tag is null or p_tag !~ '^[A-Za-z0-9]{2,4}$' then raise exception 'Tags are 2 to 4 letters or numbers.'; end if;
  if tf_private.name_problem(p_tag) is not null then raise exception 'Pick a different tag.'; end if;
end $$;

-- ---------- Player functions ----------
create or replace function public.tf_guild_create(p_name text, p_tag text, p_descr text, p_open boolean) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); p public.profiles; gid bigint; nm text := btrim(coalesce(p_name, ''));
begin
  p := tf_private.need_profile(u);
  if exists (select 1 from public.bans where user_id = u) then raise exception 'Your account can''t create guilds.'; end if;
  if (tf_private.my_guild(u)).user_id is not null then raise exception 'Leave your guild first.'; end if;
  perform tf_private.guild_check(nm, p_tag);
  if exists (select 1 from public.guilds where name_key = lower(nm)) then raise exception 'That guild name is taken.'; end if;
  if exists (select 1 from public.guilds where tag_key = lower(p_tag)) then raise exception 'That tag is taken.'; end if;
  insert into public.guilds (name, name_key, tag, tag_key, descr, open, week)
  values (nm, lower(nm), upper(p_tag), lower(p_tag), left(tf_private.clean_text(coalesce(p_descr, '')), 300), coalesce(p_open, true), tf_private.week_key()) returning id into gid;
  insert into public.guild_members (user_id, guild_id, rank, week) values (u, gid, 'leader', tf_private.week_key());
  delete from public.guild_requests where user_id = u;
  perform tf_private.guild_log_add(gid, p.name || ' founded the guild.');
  return gid;
end $$;

create or replace function public.tf_guild_list(p_q text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); q text := lower(btrim(coalesce(p_q, '')));
begin
  return coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', g.id, 'name', g.name, 'tag', g.tag, 'descr', g.descr, 'open', g.open,
      'members', (select count(*) from public.guild_members m where m.guild_id = g.id),
      'week_points', case when g.week = tf_private.week_key() then g.week_points else 0 end, 'total_points', g.total_points,
      'requested', exists (select 1 from public.guild_requests r where r.guild_id = g.id and r.user_id = u)) x
    from public.guilds g
    where q = '' or g.name_key like '%' || q || '%' or g.tag_key = q
    order by case when g.week = tf_private.week_key() then g.week_points else 0 end desc, g.total_points desc, g.id
    limit 50) s), '[]'::jsonb);
end $$;

create or replace function public.tf_guild_info() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; g public.guilds;
begin
  m := tf_private.my_guild(u);
  if m.user_id is null then
    return jsonb_build_object('guild', null, 'requests', coalesce((select jsonb_agg(r.guild_id) from public.guild_requests r where r.user_id = u), '[]'::jsonb));
  end if;
  perform tf_private.guild_roll(m.guild_id);
  select * into g from public.guilds where id = m.guild_id;
  return jsonb_build_object(
    'guild', jsonb_build_object('id', g.id, 'name', g.name, 'tag', g.tag, 'descr', g.descr, 'open', g.open, 'bank', g.bank,
      'week', g.week, 'week_points', g.week_points, 'total_points', g.total_points, 'tiers_paid', g.tiers_paid,
      'goals', jsonb_build_array(public.tf_cfg('guild_goal_1'), public.tf_cfg('guild_goal_2'), public.tf_cfg('guild_goal_3')),
      'max_members', public.tf_cfg('guild_max_members')),
    'me', jsonb_build_object('rank', (select rank from public.guild_members where user_id = u)),
    'members', (select jsonb_agg(jsonb_build_object('id', mm.user_id, 'name', p.name, 'rank', mm.rank, 'week_points', mm.week_points, 'total_points', mm.total_points,
        'online', p.last_seen > now() - interval '5 minutes', 'me', mm.user_id = u) order by case mm.rank when 'leader' then 0 when 'officer' then 1 else 2 end, mm.week_points desc)
      from public.guild_members mm join public.profiles p on p.user_id = mm.user_id where mm.guild_id = g.id),
    'requests', case when (select rank from public.guild_members where user_id = u) in ('leader', 'officer') then
      coalesce((select jsonb_agg(jsonb_build_object('id', r.user_id, 'name', p.name, 'at', r.at) order by r.at) from public.guild_requests r join public.profiles p on p.user_id = r.user_id where r.guild_id = g.id), '[]'::jsonb) else '[]'::jsonb end,
    'log', coalesce((select jsonb_agg(jsonb_build_object('at', l.at, 'text', l.text) order by l.id desc) from (select * from public.guild_log where guild_id = g.id order by id desc limit 20) l), '[]'::jsonb));
end $$;

create or replace function public.tf_guild_join(p_guild bigint) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); p public.profiles; g public.guilds;
begin
  p := tf_private.need_profile(u);
  if (tf_private.my_guild(u)).user_id is not null then raise exception 'Leave your guild first.'; end if;
  select * into g from public.guilds where id = p_guild for update;
  if g.id is null then raise exception 'That guild no longer exists.'; end if;
  if not g.open then
    insert into public.guild_requests (user_id, guild_id) values (u, g.id) on conflict do nothing;
    return 'requested';
  end if;
  if (select count(*) from public.guild_members where guild_id = g.id) >= public.tf_cfg('guild_max_members') then raise exception 'That guild is full.'; end if;
  insert into public.guild_members (user_id, guild_id, rank, week) values (u, g.id, 'member', tf_private.week_key());
  delete from public.guild_requests where user_id = u;
  perform tf_private.guild_log_add(g.id, p.name || ' joined.');
  return 'joined';
end $$;

create or replace function public.tf_guild_cancel_request(p_guild bigint) returns void
language sql security definer set search_path = public as
$$ delete from public.guild_requests where user_id = tf_private.me() and guild_id = p_guild $$;

create or replace function public.tf_guild_respond(p_user uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; nm text;
begin
  m := tf_private.need_guild(u, 'officer');
  if not exists (select 1 from public.guild_requests where user_id = p_user and guild_id = m.guild_id) then raise exception 'That request is gone.'; end if;
  delete from public.guild_requests where user_id = p_user and guild_id = m.guild_id;
  if not p_accept then return; end if;
  if (tf_private.my_guild(p_user)).user_id is not null then raise exception 'They already joined another guild.'; end if;
  if (select count(*) from public.guild_members where guild_id = m.guild_id) >= public.tf_cfg('guild_max_members') then raise exception 'Your guild is full.'; end if;
  insert into public.guild_members (user_id, guild_id, rank, week) values (p_user, m.guild_id, 'member', tf_private.week_key());
  delete from public.guild_requests where user_id = p_user;
  select name into nm from public.profiles where user_id = p_user;
  perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' joined.');
end $$;

create or replace function public.tf_guild_leave() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; heir uuid; nm text;
begin
  m := tf_private.need_guild(u);
  select name into nm from public.profiles where user_id = u;
  delete from public.guild_members where user_id = u;
  if not exists (select 1 from public.guild_members where guild_id = m.guild_id) then delete from public.guilds where id = m.guild_id; return; end if;
  perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' left.');
  if m.rank = 'leader' then
    select user_id into heir from public.guild_members where guild_id = m.guild_id order by case rank when 'officer' then 0 else 1 end, joined_at limit 1;
    update public.guild_members set rank = 'leader' where user_id = heir;
    select name into nm from public.profiles where user_id = heir;
    perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' is the new leader.');
  end if;
end $$;

create or replace function public.tf_guild_kick(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; t public.guild_members; nm text;
begin
  m := tf_private.need_guild(u, 'officer');
  select * into t from public.guild_members where user_id = p_user and guild_id = m.guild_id;
  if t.user_id is null then raise exception 'They are not in your guild.'; end if;
  if t.user_id = u then raise exception 'Use Leave instead.'; end if;
  if t.rank = 'leader' or (t.rank = 'officer' and m.rank <> 'leader') then raise exception 'You can''t remove someone of equal or higher rank.'; end if;
  delete from public.guild_members where user_id = p_user;
  select name into nm from public.profiles where user_id = p_user;
  perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' was removed from the guild.');
end $$;

create or replace function public.tf_guild_rank(p_user uuid, p_rank text) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; nm text;
begin
  m := tf_private.need_guild(u, 'leader');
  if p_rank not in ('officer', 'member', 'leader') then raise exception 'Unknown rank.'; end if;
  if p_user = u then raise exception 'Pick another member.'; end if;
  if not exists (select 1 from public.guild_members where user_id = p_user and guild_id = m.guild_id) then raise exception 'They are not in your guild.'; end if;
  select name into nm from public.profiles where user_id = p_user;
  if p_rank = 'leader' then
    update public.guild_members set rank = 'officer' where user_id = u;
    update public.guild_members set rank = 'leader' where user_id = p_user;
    perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' is the new leader.');
  else
    update public.guild_members set rank = p_rank where user_id = p_user;
    perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' is now ' || (case p_rank when 'officer' then 'an officer' else 'a member' end) || '.');
  end if;
end $$;

create or replace function public.tf_guild_edit(p_descr text, p_open boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members;
begin
  m := tf_private.need_guild(u, 'officer');
  update public.guilds set descr = left(tf_private.clean_text(coalesce(p_descr, '')), 300), open = coalesce(p_open, open) where id = m.guild_id;
end $$;

-- Gold moves through the bank. Deposits come from the player's own (device-side) gold, like gifts.
create or replace function public.tf_guild_deposit(p_amount numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; nm text; b numeric;
begin
  m := tf_private.need_guild(u);
  if p_amount is null or p_amount < 1 or p_amount <> floor(p_amount) or p_amount > 1e15 then raise exception 'Enter a whole amount of gold.'; end if;
  update public.guilds set bank = least(public.tf_cfg('guild_bank_max'), bank + p_amount) where id = m.guild_id returning bank into b;
  select name into nm from public.profiles where user_id = u;
  perform tf_private.guild_log_add(m.guild_id, coalesce(nm, 'Someone') || ' deposited ' || to_char(p_amount, 'FM999,999,999,999,999') || ' gold.');
  return b;
end $$;

-- Officers pay out of the bank to any member (themselves included); the gold arrives by mail.
create or replace function public.tf_guild_pay(p_to uuid, p_amount numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; g public.guilds; nm text; to_nm text;
begin
  m := tf_private.need_guild(u, 'officer');
  if p_amount is null or p_amount < 1 or p_amount <> floor(p_amount) then raise exception 'Enter a whole amount of gold.'; end if;
  if not exists (select 1 from public.guild_members where user_id = p_to and guild_id = m.guild_id) then raise exception 'They are not in your guild.'; end if;
  select * into g from public.guilds where id = m.guild_id for update;
  if g.bank < p_amount then raise exception 'The guild bank only has % gold.', to_char(g.bank, 'FM999,999,999,999,999'); end if;
  update public.guilds set bank = bank - p_amount where id = g.id;
  select name into nm from public.profiles where user_id = u; select name into to_nm from public.profiles where user_id = p_to;
  perform tf_private.guild_mail(p_to, 'Guild bank payment', coalesce(nm, 'An officer') || ' sent you gold from the ' || g.name || ' bank.', p_amount, '{}'::jsonb);
  perform tf_private.guild_log_add(g.id, coalesce(nm, 'Someone') || ' paid ' || to_char(p_amount, 'FM999,999,999,999,999') || ' gold to ' || coalesce(to_nm, 'a member') || '.');
  return g.bank - p_amount;
end $$;

-- Members report their recent actions; points count toward the weekly goal.
create or replace function public.tf_guild_contribute(p_n numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.guild_members; n numeric;
begin
  m := tf_private.my_guild(u);
  if m.user_id is null then return null; end if;
  if m.last_report is not null and now() - m.last_report < make_interval(secs => public.tf_cfg('guild_contrib_ms') / 1000) then return jsonb_build_object('ok', false); end if;
  n := least(public.tf_cfg('guild_contrib_max'), greatest(0, floor(coalesce(p_n, 0))));
  perform tf_private.guild_roll(m.guild_id);
  update public.guild_members set week_points = week_points + n, total_points = total_points + n, last_report = now() where user_id = u;
  update public.guilds set week_points = week_points + n, total_points = total_points + n where id = m.guild_id;
  perform tf_private.guild_pay_tiers(m.guild_id);
  return jsonb_build_object('ok', true, 'added', n);
end $$;

-- Guild chat: the 'guild' channel maps to the caller's own guild.
create or replace function tf_private.channel_for(u uuid, p_channel text) returns text
language plpgsql stable security definer set search_path = public as $$
declare other uuid; g bigint;
begin
  if p_channel = 'global' then return 'global'; end if;
  if p_channel = 'guild' then
    select guild_id into g from public.guild_members where user_id = u;
    if g is null then raise exception 'You are not in a guild.'; end if;
    return 'g:' || g;
  end if;
  if p_channel !~ '^dm:[0-9a-f-]{36}$' then raise exception 'Unknown chat channel.'; end if;
  other := substr(p_channel, 4)::uuid;
  if not tf_private.friends(u, other) then raise exception 'You can only message friends.'; end if;
  return 'dm:' || least(u, other) || ':' || greatest(u, other);
end $$;

-- Keep guild logs short.
create or replace function tf_private.housekeeping() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.housekeeping set last_run = now() where id = 1 and last_run < now() - interval '1 hour';
  if not found then return; end if;
  delete from public.chat_messages where created_at < now() - make_interval(days => public.tf_cfg('chat_keep_days')::integer);
  delete from public.mail where expires_at < now();
  delete from public.trades where status <> 'open' and a_settled and b_settled and updated_at < now() - make_interval(days => public.tf_cfg('trade_keep_days')::integer);
  delete from public.submissions where at < now() - make_interval(days => public.tf_cfg('log_keep_days')::integer);
  perform tf_private.ah_expire();
  delete from public.ah_listings where status <> 'open' and expires_at < now() - interval '7 days';
  delete from public.ah_orders where status <> 'open' and expires_at < now() - interval '7 days';
  delete from public.ah_sales where at < now() - make_interval(days => public.tf_cfg('ah_history_days')::integer);
  delete from public.guild_log l where l.id < (select min(id) from (select id from public.guild_log x where x.guild_id = l.guild_id order by id desc limit 50) k);
  delete from public.guild_requests where at < now() - interval '30 days';
end $$;
revoke all on function tf_private.housekeeping() from public, anon, authenticated;

revoke all on function tf_private.week_key(), tf_private.my_guild(uuid), tf_private.need_guild(uuid, text), tf_private.guild_log_add(bigint, text), tf_private.guild_mail(uuid, text, text, numeric, jsonb),
  tf_private.guild_roll(bigint), tf_private.guild_pay_tiers(bigint), tf_private.guild_check(text, text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array['tf_guild_create(text, text, text, boolean)', 'tf_guild_list(text)', 'tf_guild_info()', 'tf_guild_join(bigint)', 'tf_guild_cancel_request(bigint)',
    'tf_guild_respond(uuid, boolean)', 'tf_guild_leave()', 'tf_guild_kick(uuid)', 'tf_guild_rank(uuid, text)', 'tf_guild_edit(text, boolean)',
    'tf_guild_deposit(numeric)', 'tf_guild_pay(uuid, numeric)', 'tf_guild_contribute(numeric)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
