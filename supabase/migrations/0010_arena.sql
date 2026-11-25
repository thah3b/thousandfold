-- ============================================================
-- Thousandfold — v1.3: the Arena (asynchronous PvP).
-- Players publish a combat snapshot (stats + 4 ordered skills).
-- The server checks it, then fights are simulated HERE, so the
-- result can't be decided by the client. Ratings are per monthly
-- season with a soft reset. Bots fill in when few players exist.
-- ============================================================

insert into public.tf_config (key, value) values
  ('pvp_tickets', 10), ('pvp_k', 32), ('pvp_snap_ms', 10000), ('pvp_hp_mult', 3), ('pvp_max_actions', 60), ('pvp_cap_mult_asc', 0.5)
on conflict (key) do update set value = excluded.value;
update public.tf_config set value = 2235 where key = 'ach_max';

-- 15x the power of a typical build at each level (checked against published snapshots).
create table if not exists public.pvp_cap (level integer primary key, cp numeric not null);
insert into public.pvp_cap (level, cp) values (1, 1000),(2, 1421),(3, 1850),(4, 2287),(5, 2733),(6, 3188),(7, 3652),(8, 4125),(9, 4607),(10, 5098),(11, 5599),(12, 6109),(13, 6628),(14, 7156),(15, 7895),(16, 8450),(17, 8952),(18, 9463),(19, 9980),(20, 10427),(21, 10879),(22, 11338),(23, 11802),(24, 12271),(25, 12747),(26, 13229),(27, 13717),(28, 14211),(29, 15161),(30, 15677),(31, 16198),(32, 16717),(33, 17241),(34, 17771),(35, 18306),(36, 18846),(37, 19393),(38, 19945),(39, 20502),(40, 21065),(41, 21634),(42, 22134),(43, 23512),(44, 24032),(45, 24557),(46, 25087),(47, 25621),(48, 26160),(49, 26704),(50, 27141),(51, 27582),(52, 28026),(53, 28473),(54, 28924),(55, 29379),(56, 29836),(57, 31846),(58, 32325),(59, 32808),(60, 33294),(61, 33784),(62, 34278),(63, 34776),(64, 35277),(65, 35781),(66, 36290),(67, 36802),(68, 37318),(69, 37838),(70, 38362),(71, 41543),(72, 42096),(73, 42654),(74, 43216),(75, 43781),(76, 44351),(77, 44924),(78, 45502),(79, 46084),(80, 46669),(81, 47259),(82, 47817),(83, 48344),(84, 48807),(85, 53718),(86, 54211),(87, 54706),(88, 55204),(89, 55703),(90, 56205),(91, 56709),(92, 57216),(93, 57725),(94, 58236),(95, 58749),(96, 59265),(97, 59783),(98, 60303),(99, 60826)
on conflict (level) do update set cp = excluded.cp;
alter table public.pvp_cap enable row level security;
drop policy if exists "rpc only" on public.pvp_cap; create policy "rpc only" on public.pvp_cap for all using (false);
revoke all on public.pvp_cap from anon, authenticated;

create table if not exists public.pvp_players (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  season      text not null,
  rating      integer not null default 1000,
  best        integer not null default 1000,
  wins        integer not null default 0,
  losses      integer not null default 0,
  snap        jsonb,
  snap_at     timestamptz,
  day         date,
  used        integer not null default 0,
  last_season text, last_best integer, last_rating integer,
  updated_at  timestamptz not null default now()
);
create index if not exists pvp_players_rank_idx on public.pvp_players (season, rating desc);
create table if not exists public.pvp_matches (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  season     text not null,
  attacker   uuid not null references auth.users (id) on delete cascade,
  defender   uuid references auth.users (id) on delete cascade,
  bot        integer,
  a_name     text, d_name text,
  winner     smallint not null,  -- 0 attacker, 1 defender
  da integer not null default 0, dd integer not null default 0
);
create index if not exists pvp_matches_a_idx on public.pvp_matches (attacker, at desc);
create index if not exists pvp_matches_d_idx on public.pvp_matches (defender, at desc);
alter table public.pvp_players enable row level security;
alter table public.pvp_matches enable row level security;
drop policy if exists "rpc only" on public.pvp_players; create policy "rpc only" on public.pvp_players for all using (false);
drop policy if exists "rpc only" on public.pvp_matches; create policy "rpc only" on public.pvp_matches for all using (false);
revoke all on public.pvp_players from anon, authenticated;
revoke all on public.pvp_matches from anon, authenticated;

-- Skills: [unlock level, cooldown]. Kept in step with PVP_SKILLS in src/arena.js.
create or replace function tf_private.pvp_skills() returns jsonb language sql immutable set search_path = public as $$
  select '{"power":[1,3],"flurry":[5,4],"guard":[8,4],"heal":[10,5],"bash":[12,6],"rend":[15,5],"focus":[18,4],"drain":[20,4],"haste":[25,6],"hex":[28,5],"sunder":[30,5],"execute":[35,4],"barrier":[40,6],"blast":[45,5]}'::jsonb
$$;
create or replace function tf_private.pvp_affinity(cls text) returns text language sql immutable set search_path = public as $$
  select coalesce(('{"warrior":"power","archer":"flurry","mage":"blast","rogue":"rend","necromancer":"drain","healer":"heal","farmer":"guard","merchant":"execute","beastmaster":"bash","alchemist":"hex","bard":"haste","monk":"focus","summoner":"barrier","runesmith":"sunder","tidecaller":"heal","wayfinder":"flurry"}'::jsonb)->>cls, 'power')
$$;
create or replace function tf_private.pvp_tier(r integer) returns integer language sql immutable set search_path = public as $$
  select case when r >= 1800 then 5 when r >= 1600 then 4 when r >= 1400 then 3 when r >= 1250 then 2 when r >= 1100 then 1 else 0 end
$$;
create or replace function tf_private.pvp_season() returns text language sql stable set search_path = public as $$
  select to_char(now() at time zone 'utc', 'YYYY-MM')
$$;

-- The player's arena row, created on first use and rolled over at a new season or day.
create or replace function tf_private.pvp_row(u uuid) returns public.pvp_players
language plpgsql security definer set search_path = public as $$
declare r public.pvp_players; s text := tf_private.pvp_season(); d date := (now() at time zone 'utc')::date; soft integer;
begin
  select * into r from public.pvp_players where user_id = u for update;
  if r.user_id is null then insert into public.pvp_players (user_id, season, day) values (u, s, d) returning * into r; return r; end if;
  if r.season <> s then
    soft := 1000 + (r.rating - 1000) / 2;
    update public.pvp_players set last_season = r.season, last_best = r.best, last_rating = r.rating, season = s, rating = soft, best = soft, wins = 0, losses = 0 where user_id = u returning * into r;
  end if;
  if r.day is distinct from d then update public.pvp_players set day = d, used = 0 where user_id = u returning * into r; end if;
  return r;
end $$;

-- Publish your defence snapshot.
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
  if lvl is null or lvl < 1 or lvl > 99 or lvl > lb.level + 2 or asc_n < 0 or asc_n > lb.ascn then raise exception 'Arena entry doesn''t match your character.'; end if;
  pr := tf_private.name_problem(p_snap->>'name'); if pr is not null then raise exception 'That name can''t be shown: %', pr; end if;
  hp := (p_snap->>'hp')::numeric; atk := (p_snap->>'atk')::numeric; def := (p_snap->>'def')::numeric; spd := (p_snap->>'spd')::numeric;
  cr := (p_snap->>'crit')::numeric; cd := (p_snap->>'cdmg')::numeric; dg := (p_snap->>'dodge')::numeric;
  if hp is null or hp < 1 or atk is null or atk < 0 or def is null or def < 0 or spd is null or spd < 50 or spd > 600
     or cr is null or cr < 0 or cr > 0.8 or cd is null or cd < 1 or cd > 6 or dg is null or dg < 0 or dg > 0.6 then raise exception 'Bad arena stats.'; end if;
  cp := sqrt(atk * (1 + cr * (cd - 1)) * (spd / 100) * hp * (1 + def / 200) / (1 - dg));
  select c.cp into cap from public.pvp_cap c where c.level = lvl;
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

-- The battle. a and b are snapshots; returns {"win":0|1,"log":[...]}.
create or replace function tf_private.pvp_sim(a jsonb, b jsonb) returns jsonb
language plpgsql volatile set search_path = public as $$
declare
  sk jsonb := tf_private.pvp_skills(); hm numeric := public.tf_cfg('pvp_hp_mult'); maxn integer := public.tf_cfg('pvp_max_actions');
  snaps jsonb[] := array[a, b];
  mx numeric[] := array[0,0]; hp numeric[] := array[0,0]; atk numeric[] := array[0,0]; df numeric[] := array[0,0]; spd numeric[] := array[0,0];
  cr numeric[] := array[0,0]; cd numeric[] := array[0,0]; dg numeric[] := array[0,0]; g numeric[] := array[0,0];
  guard integer[] := array[0,0]; stun boolean[] := array[false,false]; bleed integer[] := array[0,0]; bleedd numeric[] := array[0,0];
  focus boolean[] := array[false,false]; haste integer[] := array[0,0]; weak integer[] := array[0,0]; sunder integer[] := array[0,0]; shield numeric[] := array[0,0];
  aff text[] := array['','']; cds integer[] := array[0,0,0,0,0,0,0,0];
  log jsonb := '[]'::jsonb; i integer; t integer; o integer; k integer; n integer := 0; nsk integer; s text; chosen text; ck integer;
  mult numeric; ign numeric; hits integer; d numeric; tot numeric; crit boolean; miss boolean; heal numeric; note text; pot numeric; win integer; h integer;
begin
  for i in 1..2 loop
    mx[i] := round((snaps[i]->>'hp')::numeric * hm); hp[i] := mx[i]; atk[i] := (snaps[i]->>'atk')::numeric; df[i] := (snaps[i]->>'def')::numeric;
    spd[i] := (snaps[i]->>'spd')::numeric; cr[i] := (snaps[i]->>'crit')::numeric; cd[i] := (snaps[i]->>'cdmg')::numeric; dg[i] := (snaps[i]->>'dodge')::numeric;
    aff[i] := tf_private.pvp_affinity(snaps[i]->>'cls'); g[i] := random() * 100;
  end loop;
  while n < maxn and hp[1] > 0 and hp[2] > 0 loop
    -- Advance the turn gauges until someone reaches 1000.
    while g[1] < 1000 and g[2] < 1000 loop
      g[1] := g[1] + spd[1] * (case when haste[1] > 0 then 1.4 else 1 end);
      g[2] := g[2] + spd[2] * (case when haste[2] > 0 then 1.4 else 1 end);
    end loop;
    t := case when g[1] >= g[2] then 1 else 2 end; o := 3 - t; g[t] := g[t] - 1000; n := n + 1;
    -- Start of turn: bleeding, debuffs wear off.
    if bleed[t] > 0 then
      d := round(bleedd[t]); hp[t] := greatest(0, hp[t] - d); bleed[t] := bleed[t] - 1;
      log := log || jsonb_build_object('t', t - 1, 'k', 'bleed', 'd', d, 'hp', jsonb_build_array(hp[1], hp[2]));
      if hp[t] <= 0 then exit; end if;
    end if;
    if weak[t] > 0 then weak[t] := weak[t] - 1; end if;
    if sunder[t] > 0 then sunder[t] := sunder[t] - 1; end if;
    if haste[t] > 0 then haste[t] := haste[t] - 1; end if;
    if stun[t] then
      stun[t] := false;
      log := log || jsonb_build_object('t', t - 1, 'k', 'stunned', 'hp', jsonb_build_array(hp[1], hp[2]));
      for k in 1..4 loop if cds[(t - 1) * 4 + k] > 0 then cds[(t - 1) * 4 + k] := cds[(t - 1) * 4 + k] - 1; end if; end loop;
      continue;
    end if;
    -- Pick the first ready skill in the player's order.
    chosen := 'atk'; ck := 0; nsk := coalesce(jsonb_array_length(snaps[t]->'skills'), 0);
    for k in 1..least(nsk, 4) loop
      s := snaps[t]->'skills'->>(k - 1);
      if cds[(t - 1) * 4 + k] = 0 and (s <> 'heal' or hp[t] < 0.6 * mx[t]) and (s <> 'barrier' or shield[t] = 0) then chosen := s; ck := k; exit; end if;
    end loop;
    for k in 1..4 loop if k <> ck and cds[(t - 1) * 4 + k] > 0 then cds[(t - 1) * 4 + k] := cds[(t - 1) * 4 + k] - 1; end if; end loop;
    if ck > 0 then cds[(t - 1) * 4 + ck] := (sk->chosen->>1)::integer; end if;
    pot := case when chosen = aff[t] then 1.2 else 1 end;
    mult := 0; ign := 0; hits := 1; heal := 0; note := null;
    if chosen = 'atk' then mult := 1;
    elsif chosen = 'power' then mult := 1.8 * pot;
    elsif chosen = 'flurry' then mult := 0.55 * pot; hits := 3;
    elsif chosen = 'bash' then mult := 0.8 * pot;
    elsif chosen = 'rend' then mult := 0.6 * pot;
    elsif chosen = 'drain' then mult := 1.1 * pot;
    elsif chosen = 'sunder' then mult := 1.0 * pot;
    elsif chosen = 'execute' then mult := 1.2 * pot * (case when hp[o] < 0.3 * mx[o] then 2.5 else 1 end);
    elsif chosen = 'blast' then mult := 2.2 * pot; ign := 0.5;
    elsif chosen = 'guard' then guard[t] := case when pot > 1 then 3 else 2 end; note := 'guard';
    elsif chosen = 'heal' then heal := round(mx[t] * 0.25 * pot);
    elsif chosen = 'focus' then focus[t] := true; note := 'focus';
    elsif chosen = 'haste' then haste[t] := case when pot > 1 then 4 else 3 end; note := 'haste';
    elsif chosen = 'hex' then weak[o] := case when pot > 1 then 4 else 3 end; note := 'hex';
    elsif chosen = 'barrier' then shield[t] := round(mx[t] * 0.2 * pot); note := 'barrier';
    end if;
    tot := 0; crit := false; miss := false;
    if mult > 0 then
      for h in 1..hits loop
        if not focus[t] and random() < dg[o] then miss := true; continue; end if;
        d := atk[t] * mult * (case when weak[t] > 0 then 0.75 else 1 end) * (200 / (200 + df[o] * (case when sunder[o] > 0 then 0.6 else 1 end) * (1 - ign))) * (0.9 + random() * 0.2);
        if focus[t] then d := d * (cd[t] + 0.5); crit := true; focus[t] := false;
        elsif random() < cr[t] then d := d * cd[t]; crit := true; end if;
        if guard[o] > 0 then d := d * 0.5; guard[o] := guard[o] - 1; end if;
        d := round(d);
        if shield[o] > 0 then if shield[o] >= d then shield[o] := shield[o] - d; d := 0; else d := d - shield[o]; shield[o] := 0; end if; end if;
        tot := tot + d; hp[o] := greatest(0, hp[o] - d);
        if hp[o] <= 0 then exit; end if;
      end loop;
      if tot > 0 or not miss then miss := false; end if;
      if chosen = 'bash' and tot > 0 then stun[o] := true; note := 'stun'; end if;
      if chosen = 'rend' and tot > 0 then bleed[o] := 3; bleedd[o] := atk[t] * 0.35 * pot; note := 'bleed'; end if;
      if chosen = 'sunder' and tot > 0 then sunder[o] := 3; note := 'sunder'; end if;
      if chosen = 'drain' and tot > 0 then heal := round(tot * 0.5); end if;
    end if;
    if heal > 0 then hp[t] := least(mx[t], hp[t] + heal); end if;
    log := log || jsonb_strip_nulls(jsonb_build_object('t', t - 1, 'k', chosen, 'd', case when mult > 0 then tot end, 'c', case when crit then 1 end,
      'm', case when mult > 0 and tot = 0 and miss then 1 end, 'h', case when heal > 0 then heal end, 'x', note, 'hp', jsonb_build_array(hp[1], hp[2])));
  end loop;
  if hp[2] <= 0 and hp[1] > 0 then win := 0; elsif hp[1] <= 0 and hp[2] > 0 then win := 1;
  elsif hp[1] / mx[1] >= hp[2] / mx[2] then win := 0; else win := 1; end if;
  return jsonb_build_object('win', win, 'log', log, 'max', jsonb_build_array(mx[1], mx[2]));
end $$;

-- A bot made from your own snapshot, a little weaker or stronger (n = 1..5).
create or replace function tf_private.pvp_bot(me jsonb, n integer) returns jsonb
language plpgsql immutable set search_path = public as $$
declare f numeric := 0.82 + 0.08 * n; names text[] := array['Sparring Golem','Arena Squire','Straw Champion','Brass Duellist','The Masked Regular'];
  cls text[] := array['warrior','archer','mage','rogue','monk']; sks text[][] := array[array['power','guard','atk'],array['flurry','power','guard'],array['blast','power','hex'],array['rend','power','heal'],array['focus','power','bash']];
  lvl integer := coalesce((me->>'level')::integer, 1);
begin
  return jsonb_build_object('name', names[n], 'bot', n, 'cls', cls[n], 'race', 'human', 'level', lvl,
    'hp', round((me->>'hp')::numeric * f), 'atk', round((me->>'atk')::numeric * f, 2), 'def', round((me->>'def')::numeric * f, 2), 'spd', round((me->>'spd')::numeric * (0.95 + 0.02 * n)),
    'crit', least(0.5, (me->>'crit')::numeric), 'cdmg', (me->>'cdmg')::numeric, 'dodge', least(0.3, (me->>'dodge')::numeric),
    'skills', to_jsonb(array_remove(array[sks[n][1], sks[n][2], sks[n][3]], 'atk')), 'look', jsonb_build_object('gender', case when n % 2 = 0 then 'Female' else 'Male' end));
end $$;

create or replace function public.tf_pvp_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); r public.pvp_players; rank_n integer; hist jsonb;
begin
  r := tf_private.pvp_row(u);
  select count(*) + 1 into rank_n from public.pvp_players where season = r.season and rating > r.rating and snap is not null;
  select coalesce(jsonb_agg(x order by x->>'at' desc), '[]'::jsonb) into hist from (
    select jsonb_build_object('at', m.at, 'me', case when m.attacker = u then 0 else 1 end, 'vs', case when m.attacker = u then m.d_name else m.a_name end,
      'won', (m.attacker = u and m.winner = 0) or (m.defender = u and m.winner = 1), 'delta', case when m.attacker = u then m.da else m.dd end, 'bot', m.bot is not null) x
    from public.pvp_matches m where m.attacker = u or m.defender = u order by m.at desc limit 12) q;
  return jsonb_build_object('season', r.season, 'rating', r.rating, 'best', r.best, 'tier', tf_private.pvp_tier(r.rating), 'bestTier', tf_private.pvp_tier(r.best),
    'wins', r.wins, 'losses', r.losses, 'rank', rank_n, 'left', greatest(0, public.tf_cfg('pvp_tickets') - r.used), 'tickets', public.tf_cfg('pvp_tickets'),
    'published', r.snap is not null, 'snapAt', r.snap_at,
    'last', case when r.last_season is null then null else jsonb_build_object('season', r.last_season, 'best', r.last_best, 'rating', r.last_rating, 'tier', tf_private.pvp_tier(r.last_best)) end,
    'history', hist);
end $$;

-- Up to 5 players near your rating; bots fill the rest.
create or replace function public.tf_pvp_opponents() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); r public.pvp_players; out jsonb; n integer; i integer;
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
  n := jsonb_array_length(out);
  for i in 1..(5 - n) loop
    out := out || jsonb_build_array(jsonb_build_object('bot', i, 'rating', r.rating - 60 + 25 * i, 'tier', tf_private.pvp_tier(r.rating), 'snap', tf_private.pvp_bot(r.snap, i)));
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
    opsnap := tf_private.pvp_bot(me.snap, p_bot); k := k / 2;
    e := 1 / (1 + power(10, (-60 + 25 * p_bot) / 400.0));
  else raise exception 'Pick an opponent.'; end if;
  res := tf_private.pvp_sim(me.snap, opsnap); w := (res->>'win')::integer;
  da := round(k * ((case when w = 0 then 1 else 0 end) - e));
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

create or replace function public.tf_pvp_board() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s text := tf_private.pvp_season(); out jsonb;
begin
  select coalesce(jsonb_agg(x), '[]'::jsonb) into out from (
    select jsonb_build_object('id', p.user_id, 'name', pr.name, 'char', p.snap->>'name', 'cls', p.snap->>'cls', 'level', (p.snap->>'level')::integer, 'rating', p.rating, 'tier', tf_private.pvp_tier(p.rating), 'wins', p.wins, 'losses', p.losses) x
    from public.pvp_players p join public.profiles pr on pr.user_id = p.user_id
    where p.season = s and p.snap is not null and (p.wins + p.losses) > 0 and not exists (select 1 from public.bans b where b.user_id = p.user_id)
    order by p.rating desc, p.wins desc limit 50) q;
  return jsonb_build_object('season', s, 'rows', out);
end $$;

revoke all on function tf_private.pvp_sim(jsonb, jsonb) from public, anon, authenticated;
revoke all on function tf_private.pvp_bot(jsonb, integer) from public, anon, authenticated;
revoke all on function tf_private.pvp_row(uuid) from public, anon, authenticated;
revoke all on function public.tf_pvp_publish(jsonb) from public, anon;
revoke all on function public.tf_pvp_state() from public, anon;
revoke all on function public.tf_pvp_opponents() from public, anon;
revoke all on function public.tf_pvp_fight(uuid, integer) from public, anon;
revoke all on function public.tf_pvp_board() from public, anon;
grant execute on function public.tf_pvp_publish(jsonb) to authenticated;
grant execute on function public.tf_pvp_state() to authenticated;
grant execute on function public.tf_pvp_opponents() to authenticated;
grant execute on function public.tf_pvp_fight(uuid, integer) to authenticated;
grant execute on function public.tf_pvp_board() to authenticated;
