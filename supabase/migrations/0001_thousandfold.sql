-- ============================================================
-- Thousandfold — Supabase schema (Phase 9, game v0.10)
-- Cloud saves, leaderboards, server-side validation, RLS.
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Players never write tables directly: every write goes through the
-- SECURITY DEFINER functions below, which check the caller and the data.
-- ============================================================

-- ---------- Game constants (keep in step with the game; see README) ----------
create table if not exists public.tf_config (
  key   text primary key,
  value numeric not null
);
insert into public.tf_config (key, value) values
  ('level_max', 99),            -- BALANCE.level.max
  ('level_a', 60),              -- BALANCE.level.a
  ('level_p', 1.0),             -- BALANCE.level.p
  ('level_g', 1.17),            -- BALANCE.level.g
  ('stat_pts_per_level', 20),   -- BALANCE.level.statPointsPerLevel
  ('stat_pts_slack', 60),
  ('ach_max', 1925),            -- sum of all achievement points (v0.10)
  ('species_max', 50),          -- Object.keys(SPECIES).length (v0.10)
  ('prog_base', 15),            -- free levels before the rate check bites
  ('prog_per_hour', 60),        -- max levels (asc*99 + level) gained per hour
  ('save_max_chars', 300000),
  ('save_min_seconds', 10),
  ('score_min_seconds', 20),
  ('max_chars_per_post', 4)
on conflict (key) do update set value = excluded.value;

create or replace function public.tf_cfg(k text) returns numeric
language sql stable security definer set search_path = public as
$$ select value from public.tf_config where key = k $$;

-- ---------- Tables ----------
create table if not exists public.cloud_saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  code       text not null,
  saved_at   timestamptz not null,
  version    text,
  device     text,
  summary    jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard (
  user_id    uuid not null references auth.users (id) on delete cascade,
  cid        text not null,
  name       text not null,
  cls        text,
  race       text,
  ascn       integer not null default 0,  -- ascension count ("asc" is reserved)
  level      integer not null default 1,
  prog       integer not null default 1,
  xp         numeric not null default 0,
  ach        integer not null default 0,
  gold       numeric not null default 0,
  kills      numeric not null default 0,
  species    integer not null default 0,
  coll       integer not null default 0,
  ver        text,
  flagged    boolean not null default false,
  flags      text[] not null default '{}',
  first_seen timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, cid)
);
create index if not exists leaderboard_prog_idx on public.leaderboard (prog desc) where not flagged;

create table if not exists public.submissions (
  id      bigserial primary key,
  user_id uuid not null,
  cid     text not null,
  at      timestamptz not null default now(),
  prog    integer,
  ach     integer,
  gold    numeric,
  flags   text[]
);

create table if not exists public.admins (user_id uuid primary key references auth.users (id) on delete cascade);
create table if not exists public.bans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason  text,
  at      timestamptz not null default now()
);

-- ---------- Helpers used by the policies (definer, so players need no access to bans/admins) ----------
create or replace function public.tf_is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
create or replace function public.tf_is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.bans where user_id = u) $$;
grant execute on function public.tf_is_admin(), public.tf_is_banned(uuid) to anon, authenticated;

-- ---------- Row-level security ----------
alter table public.tf_config   enable row level security;
alter table public.cloud_saves enable row level security;
alter table public.leaderboard enable row level security;
alter table public.submissions enable row level security;
alter table public.admins      enable row level security;
alter table public.bans        enable row level security;

drop policy if exists "read config" on public.tf_config;
create policy "read config" on public.tf_config for select using (true);

-- A player reads only their own cloud save. No insert/update/delete policies:
-- writes go through tf_put_save.
drop policy if exists "own save" on public.cloud_saves;
create policy "own save" on public.cloud_saves for select to authenticated using (auth.uid() = user_id);

-- Everyone reads clean, unbanned rows; players also see their own flagged rows; admins see all.
drop policy if exists "read leaderboard" on public.leaderboard;
create policy "read leaderboard" on public.leaderboard for select using (
  (not flagged and not public.tf_is_banned(user_id))
  or auth.uid() = user_id
  or public.tf_is_admin()
);

drop policy if exists "own submissions" on public.submissions;
create policy "own submissions" on public.submissions for select to authenticated using (auth.uid() = user_id);
-- admins and bans: no policies → only the service role (dashboard) can touch them.

-- Public ranking view (security_invoker so the RLS above applies).
create or replace view public.tf_leaderboard with (security_invoker = on) as
  select user_id, cid, name, cls, race, ascn as "asc", level, prog, ach, gold, kills, species, coll, ver, updated_at
  from public.leaderboard
  where not flagged and not public.tf_is_banned(user_id);

grant select on public.tf_leaderboard to anon, authenticated;
grant select on public.leaderboard, public.cloud_saves, public.submissions, public.tf_config to authenticated;
grant select on public.leaderboard, public.tf_config to anon;

-- ---------- Game maths ----------
create or replace function public.tf_level_cost(l integer) returns numeric
language sql immutable as
$$ select round(60 * power(l::numeric, 1.0) * power(1.17::numeric, l - 1)) $$;

create or replace function public.tf_level_from_xp(xp numeric) returns integer
language plpgsql immutable as $$
declare l integer := 1; rest numeric := xp; lmax integer := 99;
begin
  while l < lmax and rest >= public.tf_level_cost(l) loop
    rest := rest - public.tf_level_cost(l);
    l := l + 1;
  end loop;
  return l;
end $$;

-- Same checks as validateEntry() in the game (src/cloud.js), plus history checks.
create or replace function public.tf_validate(e jsonb, prev public.leaderboard default null) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  f text[] := '{}';
  k text;
  v numeric;
  lvl integer; asc_ integer; prog integer; hours numeric; created_ms numeric;
  sk jsonb;
  nm text := coalesce(e->>'name', '');
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
  if nm !~ '^[A-Za-z][A-Za-z '' -]{2,15}$' then f := f || 'name not allowed'::text; end if;

  -- History: the server remembers each character's last accepted progress.
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

-- ---------- RPC: cloud save ----------
create or replace function public.tf_put_save(p_code text, p_saved_at timestamptz, p_version text, p_device text, p_summary jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); last timestamptz;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '28000'; end if;
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
end $$;

-- ---------- RPC: leaderboard scores ----------
create or replace function public.tf_submit_scores(p_entries jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e jsonb; prev public.leaderboard; fl text[]; out jsonb := '[]'::jsonb; lastpost timestamptz; cid_ text;
  lmax integer := public.tf_cfg('level_max');
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '28000'; end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > public.tf_cfg('max_chars_per_post') then raise exception 'Bad scores.'; end if;
  select max(at) into lastpost from public.submissions where user_id = uid;
  if lastpost is not null and now() - lastpost < make_interval(secs => public.tf_cfg('score_min_seconds')::double precision) then
    raise exception 'Posting scores too often; try again shortly.';
  end if;
  for e in select * from jsonb_array_elements(p_entries) loop
    cid_ := left(coalesce(e->>'cid', ''), 40);
    if cid_ = '' then continue; end if;
    select * into prev from public.leaderboard where user_id = uid and cid = cid_;
    fl := public.tf_validate(e, prev);
    insert into public.submissions (user_id, cid, prog, ach, gold, flags)
    values (uid, cid_, coalesce((e->>'asc')::integer, 0) * lmax + coalesce((e->>'level')::integer, 1),
            (e->>'ach')::integer, (e->>'gold')::numeric, fl);
    if array_length(fl, 1) is null then
      insert into public.leaderboard as l (user_id, cid, name, cls, race, ascn, level, prog, xp, ach, gold, kills, species, coll, ver, flagged, flags, updated_at)
      values (uid, cid_, e->>'name', left(e->>'cls', 24), left(e->>'race', 24), (e->>'asc')::integer, (e->>'level')::integer,
              (e->>'asc')::integer * lmax + (e->>'level')::integer, (e->>'xp')::numeric, (e->>'ach')::integer, (e->>'gold')::numeric,
              (e->>'kills')::numeric, (e->>'species')::integer, (e->>'coll')::integer, left(e->>'ver', 16), false, '{}', now())
      on conflict (user_id, cid) do update set name = excluded.name, cls = excluded.cls, race = excluded.race, ascn = excluded.ascn,
        level = excluded.level, prog = excluded.prog, xp = excluded.xp, ach = excluded.ach, gold = excluded.gold, kills = excluded.kills,
        species = excluded.species, coll = excluded.coll, ver = excluded.ver, flagged = false, flags = '{}', updated_at = now();
    elsif prev.user_id is not null then
      -- Keep the last good numbers on the board; just record why this post was refused.
      update public.leaderboard set flags = fl where user_id = uid and cid = cid_;
    else
      insert into public.leaderboard (user_id, cid, name, flagged, flags) values (uid, cid_, left(coalesce(e->>'name', '?'), 16), true, fl)
      on conflict (user_id, cid) do update set flagged = true, flags = excluded.flags;
    end if;
    out := out || jsonb_build_array(jsonb_build_object('cid', cid_, 'flags', to_jsonb(fl)));
  end loop;
  return out;
end $$;

revoke all on function public.tf_put_save(text, timestamptz, text, text, jsonb) from public, anon;
revoke all on function public.tf_submit_scores(jsonb) from public, anon;
revoke all on function public.tf_validate(jsonb, public.leaderboard) from public, anon, authenticated;
grant execute on function public.tf_put_save(text, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.tf_submit_scores(jsonb) to authenticated;
