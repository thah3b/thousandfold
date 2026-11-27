-- v3.0c — (1) ascension-friendly leaderboard speed check, (2) arena entry tolerant of a lagging
-- leaderboard row right after an ascension, (3) five fixed arena NPCs with set battle power and points.
-- (1) Auto-ascend lets strong characters climb ~200 levels an hour (A1 99 → A3 77 in ~50 minutes),
-- which the old 60 levels/hour rule rejected. Raised to 300/hour + 30 slack.
update public.tf_config set value = '300' where key = 'prog_per_hour';
update public.tf_config set value = '30' where key = 'prog_base';
-- How much rating a lost NPC fight costs, as a percent of that NPC's win points.
insert into public.tf_config (key, value) values ('pvp_npc_loss_pct', '20') on conflict (key) do update set value = excluded.value;


-- (4) v3.0c: rising ascension level. Ascend at 99 for A0–A4, then +50 every 5 ascensions
-- (A5–A9: 150, A10–A14: 200, …). Levels past 99 cost level 99's XP × 1.03 per level above it.
create or replace function tf_private.asc_need(a integer) returns integer
language sql immutable set search_path = public as $$ select case when a < 5 then 99 else 100 + 50 * (a / 5) end $$;
-- Levels climbed in all earlier ascensions (A0–A5 keep the old 99-per-ascension numbers).
create or replace function tf_private.lvls_before(a integer) returns integer
language sql immutable set search_path = public as $$ select coalesce(sum(tf_private.asc_need(k)), 0)::integer from generate_series(0, least(a, 1000) - 1) k $$;
create or replace function public.tf_level_cost(l integer) returns numeric
language sql immutable set search_path = public as $$
  select case when l < 99 then round(60 * power(l::numeric, 1.0) * power(1.17::numeric, l - 1))
              else round(round(60 * power(99::numeric, 1.0) * power(1.17::numeric, 98)) * power(1.03::numeric, l - 99)) end $$;
create or replace function public.tf_level_from_xp(xp numeric, lmax integer) returns integer
language plpgsql immutable set search_path = public as $$
declare l integer := 1; rest numeric := xp;
begin
  while l < lmax and rest >= public.tf_level_cost(l) loop rest := rest - public.tf_level_cost(l); l := l + 1; end loop;
  return l;
end $$;

CREATE OR REPLACE FUNCTION public.tf_validate(e jsonb, prev leaderboard DEFAULT NULL::leaderboard)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  prog := tf_private.lvls_before(asc_) + lvl;
  if lvl < 1 or lvl > tf_private.asc_need(asc_) then f := f || 'level out of range'::text; end if;
  if asc_ > 1000 or asc_ < 0 then f := f || 'ascension out of range'::text; end if;
  if public.tf_level_from_xp((e->>'xp')::numeric, tf_private.asc_need(asc_)) <> lvl then f := f || 'level does not match XP'::text; end if;
  if jsonb_typeof(e->'skills') = 'array' then
    for sk in select * from jsonb_array_elements(e->'skills') loop
      if jsonb_typeof(sk) <> 'array' or public.tf_level_from_xp((sk->>1)::numeric) <> (sk->>0)::integer then
        f := f || 'a skill level does not match its XP'::text; exit;
      end if;
    end loop;
  end if;
  if (e->>'alloc')::numeric + (e->>'unspent')::numeric
     > public.tf_cfg('stat_pts_per_level') * (tf_private.lvls_before(asc_) - asc_ + lvl - 1) + public.tf_cfg('stat_pts_slack') then
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
end $function$

;

CREATE OR REPLACE FUNCTION public.tf_submit_scores(p_entries jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      insert into public.leaderboard as l (user_id, cid, name, cls, race, ascn, level, prog, xp, ach, gold, kills, species, coll, ver, flagged, flags, updated_at, held, casino_net)
      values (uid, cid_, left(e->>'name', 64), left(e->>'cls', 24), left(e->>'race', 24), (e->>'asc')::integer, (e->>'level')::integer,
              tf_private.lvls_before((e->>'asc')::integer) + (e->>'level')::integer, (e->>'xp')::numeric, (e->>'ach')::integer, (e->>'gold')::numeric,
              (e->>'kills')::numeric, (e->>'species')::integer, (e->>'coll')::integer, left(e->>'ver', 16), false, '{}', now(),
              public.tf_num_or_null(e->'held', 0, 1e18), public.tf_num_or_null(e->'casino_net', -1e18, 1e18))
      on conflict (user_id, cid) do update set name = excluded.name, cls = excluded.cls, race = excluded.race, ascn = excluded.ascn,
        level = excluded.level, prog = excluded.prog, xp = excluded.xp, ach = excluded.ach, gold = excluded.gold, kills = excluded.kills,
        species = excluded.species, coll = excluded.coll, ver = excluded.ver, flagged = false, flags = '{}', updated_at = now(),
        held = excluded.held, casino_net = excluded.casino_net;
    else
      insert into public.submissions (user_id, cid, prog, ach, gold, flags)
      values (uid, cid_, tf_private.lvls_before(least(1000, greatest(0, coalesce((e->>'asc')::integer, 0)))) + coalesce((e->>'level')::integer, 1), (e->>'ach')::integer, (e->>'gold')::numeric, fl);
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
end $function$

;

-- Arena: allow character levels above 99 (the power cap uses the level-99 row for those).
-- (2)
create or replace function public.tf_pvp_publish(p_snap jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); r public.pvp_players; lb record; sk jsonb := tf_private.pvp_skills(); s text; lvl integer; asc_n integer;
  hp numeric; atk numeric; def numeric; spd numeric; cr numeric; cd numeric; dg numeric; cp numeric; cap numeric; n integer := 0; seen text[] := '{}'; pr text;
begin
  perform tf_private.need_profile(u);
  r := tf_private.pvp_row(u);
  if r.snap_at is not null and now() - r.snap_at < make_interval(secs => public.tf_cfg('pvp_snap_ms') / 1000) and r.snap is not distinct from p_snap then return false; end if;
  if p_snap is null or jsonb_typeof(p_snap) <> 'object' or octet_length(p_snap::text) > 3000 then raise exception 'Bad arena entry.'; end if;
  select level, ascn, flagged into lb from public.leaderboard where user_id = u and cid = p_snap->>'cid';
  if lb.level is null then raise exception 'This character isn''t on the leaderboards yet. Play for a minute while signed in, then try again.'; end if;
  if lb.flagged then raise exception 'This character can''t enter the Arena.'; end if;
  lvl := (p_snap->>'level')::integer; asc_n := coalesce((p_snap->>'asc')::integer, 0);
  -- v3.0b: right after an ascension the leaderboard row can lag one ascension behind.
  if lvl is null or lvl < 1 or lvl > tf_private.asc_need(greatest(asc_n, 0)) or asc_n < 0 or asc_n > lb.ascn + 1 or (asc_n = lb.ascn and lvl > lb.level + 2) then raise exception 'Arena entry doesn''t match your character.'; end if;
  pr := tf_private.name_problem(p_snap->>'name'); if pr is not null then raise exception 'That name can''t be shown: %', pr; end if;
  hp := (p_snap->>'hp')::numeric; atk := (p_snap->>'atk')::numeric; def := (p_snap->>'def')::numeric; spd := (p_snap->>'spd')::numeric;
  cr := (p_snap->>'crit')::numeric; cd := (p_snap->>'cdmg')::numeric; dg := (p_snap->>'dodge')::numeric;
  if hp is null or hp < 1 or atk is null or atk < 0 or def is null or def < 0 or spd is null or spd < 50 or spd > 600
     or cr is null or cr < 0 or cr > 0.8 or cd is null or cd < 1 or cd > 6 or dg is null or dg < 0 or dg > 0.6 then raise exception 'Bad arena stats.'; end if;
  cp := sqrt(atk * (1 + cr * (cd - 1)) * (spd / 100) * hp * (1 + def / 200) / (1 - dg));
  select c.cp into cap from public.pvp_cap c where c.level = least(lvl, 99);
  if cp > cap * (1 + public.tf_cfg('pvp_cap_mult_asc') * asc_n) then raise exception 'Arena stats are out of range for your level.'; end if;
  if jsonb_typeof(p_snap->'skills') <> 'array' or jsonb_array_length(p_snap->'skills') > 4 then raise exception 'Bad skills.'; end if;
  for s in select jsonb_array_elements_text(p_snap->'skills') loop
    if sk->s is null or s = any(seen) then raise exception 'Bad skills.'; end if;
    if (sk->s->>0)::integer > lvl and s <> tf_private.pvp_affinity(p_snap->>'cls') then raise exception 'Skill % unlocks at level %.', s, sk->s->>0; end if;
    seen := seen || s;
  end loop;
  if p_snap->'look' is not null and (jsonb_typeof(p_snap->'look') <> 'object' or octet_length((p_snap->'look')::text) > 800) then raise exception 'Bad look.'; end if;
  update public.pvp_players set snap = p_snap || jsonb_build_object('cp', round(cp)), snap_at = now(), updated_at = now() where user_id = u;
  return true;
end $$;

-- (3) Fixed NPCs. Battle power (same formula as players' cp): 1k, 5k, 10k, 20k, 40k.
-- Stats: speed 300, crit 15% ×1.8, dodge 8%, HP = 2 × attack, defence = 0.35 × attack.
create or replace function tf_private.pvp_npc_pts(n integer) returns integer
language sql immutable set search_path = public as $$ select (array[15, 30, 60, 120, 250])[n] $$;

create or replace function tf_private.pvp_bot(me jsonb, n integer) returns jsonb
language plpgsql immutable set search_path = public as $$
declare names text[] := array['Hobo','City Guard','Street Mage','Royal Paladin','Demon King'];
  cls text[] := array['rogue','warrior','mage','warrior','mage'];
  lv integer[] := array[5, 25, 45, 70, 99];
  hp numeric[] := array[599, 2172, 3624, 5944, 9638];
  atk numeric[] := array[299.68, 1086.21, 1811.79, 2971.81, 4818.86];
  def numeric[] := array[104.89, 380.17, 634.13, 1040.13, 1686.6];
  bp integer[] := array[1000, 5000, 10000, 20000, 40000];
  sks text[][] := array[array['flurry','rend','heal'], array['guard','bash','power'], array['blast','hex','barrier'], array['guard','heal','power'], array['blast','drain','hex']];
  looks jsonb[] := array[
    '{"gender":"Male","outfit":"#7a6a52","accent":"#5a4a3a","hat":"beanie","hair":"#8a7a6a","beard":"stubble","prop":"lantern"}'::jsonb,
    '{"gender":"Male","outfit":"#2a4a8a","accent":"#c9a36a","hat":"helm","prop":"trident","cape":"#2a3a6a"}'::jsonb,
    '{"gender":"Female","outfit":"#6a2a8a","accent":"#e8c15a","hat":"wizard","robe":true,"prop":"staff"}'::jsonb,
    '{"gender":"Male","outfit":"#eef2f6","accent":"#e8c15a","hat":"greathelm","pattern":"tabard","pat2":"#2a4aa8","prop":"sword","cape":"#2a4aa8|#e8c15a"}'::jsonb,
    '{"gender":"Male","outfit":"#2a0a14","accent":"#c0302a","hat":"horns","skin":"#a83a3a","eyeC":"#ffd23a","cape":"#1a0a10|#c0302a","back":"batwings","prop":"staff","face":"fangs"}'::jsonb];
begin
  if n < 1 or n > 5 then return null; end if;
  return jsonb_build_object('name', names[n], 'bot', n, 'npc', true, 'cls', cls[n], 'race', 'human', 'level', lv[n], 'cp', bp[n], 'pts', tf_private.pvp_npc_pts(n),
    'hp', hp[n], 'atk', atk[n], 'def', def[n], 'spd', 300, 'crit', 0.15, 'cdmg', 1.8, 'dodge', 0.08,
    'skills', to_jsonb(array[sks[n][1], sks[n][2], sks[n][3]]), 'look', looks[n]);
end $$;

-- Players near your rating (up to 5), then the five NPCs, always.
create or replace function public.tf_pvp_opponents() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); r public.pvp_players; out jsonb; i integer;
begin
  r := tf_private.pvp_row(u);
  if r.snap is null then raise exception 'Publish your Arena entry first.'; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into out from (
    select jsonb_build_object('id', p.user_id, 'rating', p.rating, 'tier', tf_private.pvp_tier(p.rating), 'snap', p.snap - 'cid') x
    from public.pvp_players p
    where p.user_id <> u and p.snap is not null and p.season = r.season
      and not exists (select 1 from public.bans b where b.user_id = p.user_id)
      and not exists (select 1 from public.blocks bl where (bl.blocker = u and bl.blocked = p.user_id) or (bl.blocker = p.user_id and bl.blocked = u))
    order by abs(p.rating - r.rating) + random() * 60 limit 5) q;
  for i in 1..5 loop
    out := out || jsonb_build_array(jsonb_build_object('bot', i, 'pts', tf_private.pvp_npc_pts(i), 'rating', null, 'tier', 0, 'snap', tf_private.pvp_bot(r.snap, i)));
  end loop;
  return out;
end $$;

create or replace function public.tf_pvp_fight(p_opponent uuid default null, p_bot integer default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); me public.pvp_players; op public.pvp_players; opsnap jsonb; res jsonb; w integer; e numeric; k numeric := public.tf_cfg('pvp_k');
  da integer; dd integer := 0; myname text; opname text;
begin
  me := tf_private.pvp_row(u);
  if me.snap is null then raise exception 'Publish your Arena entry first.'; end if;
  if me.used >= public.tf_cfg('pvp_tickets') then raise exception 'No Arena tickets left today. They refill at midnight UTC.'; end if;
  if p_opponent is not null then
    if p_opponent = u then raise exception 'You can''t fight yourself.'; end if;
    op := tf_private.pvp_row(p_opponent);
    if op.snap is null or exists (select 1 from public.bans b where b.user_id = p_opponent) then raise exception 'That opponent isn''t in the Arena.'; end if;
    opsnap := op.snap;
    e := 1 / (1 + power(10, (op.rating - me.rating) / 400.0));
  elsif p_bot between 1 and 5 then
    opsnap := tf_private.pvp_bot(me.snap, p_bot);
  else raise exception 'Pick an opponent.'; end if;
  res := tf_private.pvp_sim(me.snap, opsnap); w := (res->>'win')::integer;
  if p_opponent is not null then da := round(k * ((case when w = 0 then 1 else 0 end) - e));
  else da := case when w = 0 then tf_private.pvp_npc_pts(p_bot) else -round(tf_private.pvp_npc_pts(p_bot) * public.tf_cfg('pvp_npc_loss_pct') / 100.0) end; end if;
  if p_opponent is not null then dd := -round(da / 2.0); end if;
  myname := me.snap->>'name'; opname := opsnap->>'name';
  update public.pvp_players set rating = greatest(0, rating + da), best = greatest(best, rating + da), used = used + 1,
    wins = wins + (case when w = 0 then 1 else 0 end), losses = losses + (case when w = 1 then 1 else 0 end), updated_at = now() where user_id = u returning * into me;
  if p_opponent is not null then
    update public.pvp_players set rating = greatest(0, rating + dd), best = greatest(best, rating + dd) where user_id = p_opponent;
  end if;
  insert into public.pvp_matches (season, attacker, defender, bot, a_name, d_name, winner, da, dd) values (me.season, u, p_opponent, p_bot, myname, opname, w, da, dd);
  if random() < 0.02 then delete from public.pvp_matches where at < now() - interval '30 days'; end if;
  return res || jsonb_build_object('me', me.snap - 'cid', 'op', opsnap - 'cid', 'delta', da, 'rating', me.rating, 'tier', tf_private.pvp_tier(me.rating), 'best', me.best,
    'left', greatest(0, public.tf_cfg('pvp_tickets') - me.used));
end $$;
