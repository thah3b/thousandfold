-- ============================================================
-- Thousandfold v2.5c: two new leaderboards.
--   Richest: gold the character holds right now (held).
--   Casino losses: lifetime net gold result at the casino (casino_net,
--   negative = lost). Characters that never played stay null and are
--   left off that board; the view exposes casino_lost = -casino_net so
--   the biggest losers sort first and players in profit sit at the bottom.
-- ============================================================
alter table public.leaderboard add column if not exists held numeric;
alter table public.leaderboard add column if not exists casino_net numeric;

-- A JSON number inside [lo, hi], or null.
create or replace function public.tf_num_or_null(v jsonb, lo numeric, hi numeric) returns numeric
language sql immutable as $$
  select case when jsonb_typeof(v) = 'number' and (v #>> '{}')::numeric between lo and hi then floor((v #>> '{}')::numeric) else null end
$$;

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
      insert into public.leaderboard as l (user_id, cid, name, cls, race, ascn, level, prog, xp, ach, gold, kills, species, coll, ver, flagged, flags, updated_at, held, casino_net)
      values (uid, cid_, left(e->>'name', 64), left(e->>'cls', 24), left(e->>'race', 24), (e->>'asc')::integer, (e->>'level')::integer,
              (e->>'asc')::integer * lmax + (e->>'level')::integer, (e->>'xp')::numeric, (e->>'ach')::integer, (e->>'gold')::numeric,
              (e->>'kills')::numeric, (e->>'species')::integer, (e->>'coll')::integer, left(e->>'ver', 16), false, '{}', now(),
              public.tf_num_or_null(e->'held', 0, 1e18), public.tf_num_or_null(e->'casino_net', -1e18, 1e18))
      on conflict (user_id, cid) do update set name = excluded.name, cls = excluded.cls, race = excluded.race, ascn = excluded.ascn,
        level = excluded.level, prog = excluded.prog, xp = excluded.xp, ach = excluded.ach, gold = excluded.gold, kills = excluded.kills,
        species = excluded.species, coll = excluded.coll, ver = excluded.ver, flagged = false, flags = '{}', updated_at = now(),
        held = excluded.held, casino_net = excluded.casino_net;
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

create or replace view public.tf_leaderboard with (security_invoker = on) as
  select user_id, cid, name, cls, race, ascn as "asc", level, prog, ach, gold, kills, species, coll, ver, updated_at, title, tstyle,
         held, -casino_net as casino_lost
  from public.leaderboard
  where not flagged and not tf_private.is_banned(user_id);
grant select on public.tf_leaderboard to anon, authenticated;
