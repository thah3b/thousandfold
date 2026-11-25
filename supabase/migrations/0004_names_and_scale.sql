-- Thousandfold v0.11b: open names, and keeping the free plan's 500 MB database lean.

-- Names: anything printable (any language, symbols, emoji, lenny faces), 1–24 characters,
-- no invisible or control characters, no slurs. Mirrors nameProblem() in the game.
create or replace function tf_private.name_problem(n text) returns text
language plpgsql immutable set search_path = public as $$
declare t text := btrim(coalesce(n, ''));
begin
  if char_length(t) = 0 then return 'Enter a name.'; end if;
  if char_length(t) > 24 then return 'Up to 24 characters.'; end if;
  if t ~ '[\u0001-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]' then return 'That name has hidden or control characters in it.'; end if;
  if tf_private.has_bad_word(translate(lower(t), '01345', 'oieas')) then return 'Please choose another name.'; end if;
  return null;
end $$;
grant execute on function tf_private.name_problem(text) to authenticated;

create or replace function public.tf_set_profile(p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); nm text := btrim(coalesce(p_name, '')); p public.profiles; c text; prob text;
begin
  prob := tf_private.name_problem(nm);
  if prob is not null then raise exception '%', prob; end if;
  if exists (select 1 from public.profiles where name_key = lower(nm) and user_id <> u) then raise exception 'That name is taken.'; end if;
  select * into p from public.profiles where user_id = u;
  if p.user_id is null then
    loop
      c := 'TF-' || upper(substr(md5(random()::text || clock_timestamp()::text || u::text), 1, 6));
      exit when not exists (select 1 from public.profiles where code = c);
    end loop;
    insert into public.profiles (user_id, name, name_key, code) values (u, nm, lower(nm), c) returning * into p;
  else
    update public.profiles set name = nm, name_key = lower(nm), last_seen = now() where user_id = u returning * into p;
  end if;
  return jsonb_build_object('name', p.name, 'code', p.code);
end $$;

-- Same leaderboard checks, with the open name rule.
create or replace function public.tf_validate(e jsonb, prev public.leaderboard default null) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  f text[] := '{}';
  k text;
  v numeric;
  lvl integer; asc_ integer; prog integer; hours numeric; created_ms numeric;
  sk jsonb;
  lmax integer := public.tf_cfg('level_max');
begin
  foreach k in array array['asc','level','xp','ach','gold','kills','species','coll','alloc','unspent','created'] loop
    if jsonb_typeof(e->k) is distinct from 'number' then f := f || ('bad ' || k); continue; end if;
    v := (e->>k)::numeric;
    if v < 0 then f := f || ('bad ' || k); end if;
  end loop;
  if array_length(f, 1) > 0 then return f; end if;
  lvl := (e->>'level')::integer; asc_ := (e->>'asc')::integer;
  prog := asc_ * lmax + lvl;
  if lvl < 1 or lvl > lmax then f := f || 'level out of range'::text; end if;
  if asc_ > 1000 then f := f || 'ascension out of range'::text; end if;
  if public.tf_level_from_xp((e->>'xp')::numeric) <> lvl then f := f || 'level does not match XP'::text; end if;
  if jsonb_typeof(e->'skills') = 'array' then
    for sk in select * from jsonb_array_elements(e->'skills') loop
      if jsonb_typeof(sk) <> 'array' or public.tf_level_from_xp((sk->>1)::numeric) <> (sk->>0)::integer then
        f := f || 'a skill level does not match its XP'::text; exit;
      end if;
    end loop;
  end if;
  if (e->>'alloc')::numeric + (e->>'unspent')::numeric
     > public.tf_cfg('stat_pts_per_level') * (asc_ * (lmax - 1) + lvl - 1) + public.tf_cfg('stat_pts_slack') then
    f := f || 'more stat points than levels give'::text;
  end if;
  created_ms := (e->>'created')::numeric;
  hours := greatest(0, (extract(epoch from now()) * 1000 - created_ms) / 3.6e6);
  if prog > public.tf_cfg('prog_base') + public.tf_cfg('prog_per_hour') * hours then f := f || 'levels gained faster than possible'::text; end if;
  if (e->>'ach')::numeric > public.tf_cfg('ach_max') then f := f || 'too many achievement points'::text; end if;
  if (e->>'species')::numeric > public.tf_cfg('species_max') or (e->>'coll')::numeric > 100 then f := f || 'collection out of range'::text; end if;
  if tf_private.name_problem(e->>'name') is not null then f := f || 'name not allowed'::text; end if;
  if prev.user_id is not null then
    hours := greatest(0, extract(epoch from (now() - prev.updated_at)) / 3600);
    if prog - prev.prog > public.tf_cfg('prog_base') + public.tf_cfg('prog_per_hour') * hours then
      f := f || 'levels gained faster than possible since the last post'::text;
    end if;
    if (e->>'kills')::numeric < prev.kills or (e->>'gold')::numeric < prev.gold then
      f := f || 'totals went backwards (an older save was posted)'::text;
    end if;
  end if;
  return f;
end $$;
revoke all on function public.tf_validate(jsonb, public.leaderboard) from public, anon, authenticated;

-- Score posts: only refused posts are logged (a row per accepted post every 5 minutes
-- from 1,000 players would fill the free database within weeks). The rate limit now
-- reads the player's last post time from a small per-player table.
create table if not exists public.score_posts (user_id uuid primary key references auth.users (id) on delete cascade, at timestamptz not null default now());
alter table public.score_posts enable row level security;
drop policy if exists "rpc only" on public.score_posts; create policy "rpc only" on public.score_posts for all using (false);
revoke all on public.score_posts from anon, authenticated;

create or replace function public.tf_submit_scores(p_entries jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := tf_private.me();
  e jsonb; prev public.leaderboard; fl text[]; out jsonb := '[]'::jsonb; lastpost timestamptz; cid_ text;
  lmax integer := public.tf_cfg('level_max');
begin
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > public.tf_cfg('max_chars_per_post') then raise exception 'Bad scores.'; end if;
  select at into lastpost from public.score_posts where user_id = uid;
  if lastpost is not null and now() - lastpost < make_interval(secs => public.tf_cfg('score_min_seconds')::double precision) then
    raise exception 'Posting scores too often; try again shortly.';
  end if;
  insert into public.score_posts (user_id, at) values (uid, now()) on conflict (user_id) do update set at = now();
  for e in select * from jsonb_array_elements(p_entries) loop
    cid_ := left(coalesce(e->>'cid', ''), 40);
    if cid_ = '' then continue; end if;
    select * into prev from public.leaderboard where user_id = uid and cid = cid_;
    fl := public.tf_validate(e, prev);
    if array_length(fl, 1) is null then
      insert into public.leaderboard as l (user_id, cid, name, cls, race, ascn, level, prog, xp, ach, gold, kills, species, coll, ver, flagged, flags, updated_at)
      values (uid, cid_, left(e->>'name', 64), left(e->>'cls', 24), left(e->>'race', 24), (e->>'asc')::integer, (e->>'level')::integer,
              (e->>'asc')::integer * lmax + (e->>'level')::integer, (e->>'xp')::numeric, (e->>'ach')::integer, (e->>'gold')::numeric,
              (e->>'kills')::numeric, (e->>'species')::integer, (e->>'coll')::integer, left(e->>'ver', 16), false, '{}', now())
      on conflict (user_id, cid) do update set name = excluded.name, cls = excluded.cls, race = excluded.race, ascn = excluded.ascn,
        level = excluded.level, prog = excluded.prog, xp = excluded.xp, ach = excluded.ach, gold = excluded.gold, kills = excluded.kills,
        species = excluded.species, coll = excluded.coll, ver = excluded.ver, flagged = false, flags = '{}', updated_at = now();
    else
      insert into public.submissions (user_id, cid, prog, ach, gold, flags)
      values (uid, cid_, coalesce((e->>'asc')::integer, 0) * lmax + coalesce((e->>'level')::integer, 1), (e->>'ach')::integer, (e->>'gold')::numeric, fl);
      if prev.user_id is not null then
        update public.leaderboard set flags = fl where user_id = uid and cid = cid_;
      else
        insert into public.leaderboard (user_id, cid, name, flagged, flags) values (uid, cid_, left(coalesce(e->>'name', '?'), 64), true, fl)
        on conflict (user_id, cid) do update set flagged = true, flags = excluded.flags;
      end if;
    end if;
    out := out || jsonb_build_array(jsonb_build_object('cid', cid_, 'flags', to_jsonb(fl)));
  end loop;
  return out;
end $$;
revoke all on function public.tf_submit_scores(jsonb) from public, anon;
grant execute on function public.tf_submit_scores(jsonb) to authenticated;

-- Housekeeping: old chat, expired mail, finished trades and old refused-post logs.
-- Runs at most once an hour, piggy-backing on cloud saves (no scheduler needed).
create index if not exists chat_created_idx on public.chat_messages (created_at);
create index if not exists mail_expires_idx on public.mail (expires_at);
create index if not exists submissions_at_idx on public.submissions (at);
create table if not exists public.housekeeping (id integer primary key default 1 check (id = 1), last_run timestamptz not null default '-infinity');
insert into public.housekeeping (id) values (1) on conflict do nothing;
alter table public.housekeeping enable row level security;
drop policy if exists "rpc only" on public.housekeeping; create policy "rpc only" on public.housekeeping for all using (false);
revoke all on public.housekeeping from anon, authenticated;
insert into public.tf_config (key, value) values ('chat_keep_days', 14), ('trade_keep_days', 30), ('log_keep_days', 30)
on conflict (key) do update set value = excluded.value;

create or replace function tf_private.housekeeping() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.housekeeping set last_run = now() where id = 1 and last_run < now() - interval '1 hour';
  if not found then return; end if;
  delete from public.chat_messages where created_at < now() - make_interval(days => public.tf_cfg('chat_keep_days')::integer);
  delete from public.mail where expires_at < now();
  delete from public.trades where status <> 'open' and a_settled and b_settled and updated_at < now() - make_interval(days => public.tf_cfg('trade_keep_days')::integer);
  delete from public.submissions where at < now() - make_interval(days => public.tf_cfg('log_keep_days')::integer);
end $$;
revoke all on function tf_private.housekeeping() from public, anon, authenticated;

create or replace function public.tf_put_save(p_code text, p_saved_at timestamptz, p_version text, p_device text, p_summary jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := tf_private.me(); last timestamptz;
begin
  if p_code is null or char_length(p_code) > public.tf_cfg('save_max_chars') then raise exception 'Save is too large.'; end if;
  if p_code !~ '^(TF2\.[A-Za-z0-9_-]+|[A-Za-z0-9+/=]+)$' then raise exception 'That is not a save code.'; end if;
  if jsonb_typeof(coalesce(p_summary, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_summary, '[]'::jsonb)) > 4 then raise exception 'Bad summary.'; end if;
  select updated_at into last from public.cloud_saves where user_id = uid;
  if last is not null and now() - last < make_interval(secs => public.tf_cfg('save_min_seconds')::double precision) then
    raise exception 'Saving too often; try again in a few seconds.';
  end if;
  insert into public.cloud_saves (user_id, code, saved_at, version, device, summary, updated_at)
  values (uid, p_code, least(p_saved_at, now()), left(p_version, 16), left(p_device, 32), coalesce(p_summary, '[]'::jsonb), now())
  on conflict (user_id) do update set code = excluded.code, saved_at = excluded.saved_at, version = excluded.version,
    device = excluded.device, summary = excluded.summary, updated_at = now();
  perform tf_private.housekeeping();
end $$;
revoke all on function public.tf_put_save(text, timestamptz, text, text, jsonb) from public, anon;
grant execute on function public.tf_put_save(text, timestamptz, text, text, jsonb) to authenticated;
