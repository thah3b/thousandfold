\set ON_ERROR_STOP 0
insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x'),('22222222-2222-2222-2222-222222222222','b@x');
-- level maths matches the game: levelCost(10)=2465, levelCost(50)=6580039
select public.tf_level_cost(10) as c10, public.tf_level_cost(50) as c50, public.tf_level_from_xp(0) as l0, public.tf_level_from_xp(1e15) as lmax;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', false);
select public.tf_put_save('TF2.abc_-123', now(), 'v0.10', 'd1', '[{"name":"Ann","level":5}]');
select public.tf_put_save('TF2.abc', now(), 'v0.10', 'd1', '[]');   -- too soon: error expected
select public.tf_put_save('<script>', now(), 'v0.10', 'd1', '[]');  -- not a code: error expected
select user_id, left(code,12), version from public.cloud_saves;
-- honest entry (level 5 needs xp in [sum cost 1..4, ...))
select public.tf_submit_scores(jsonb_build_array(
  jsonb_build_object('cid','c1','name','Ann Smith','cls','warrior','race','human','asc',0,'level',5,'xp',
     (select sum(public.tf_level_cost(i)) from generate_series(1,4) i) + 10,
     'ach',20,'gold',500,'kills',10,'species',1,'coll',3,'alloc',40,'unspent',40,'created', (extract(epoch from now())*1000 - 3.6e6*5)::bigint,
     'skills', '[[1,0],[2,60]]'::jsonb, 'ver','v0.10'),
  jsonb_build_object('cid','c2','name','Cheater','asc',0,'level',99,'xp',5,'ach',99999,'gold',1,'kills',1,'species',1,'coll',1,'alloc',0,'unspent',0,'created',0)
));
select cid, name, level, flagged, flags from public.leaderboard order by cid;
select name, level from public.tf_leaderboard;
-- player 2 cannot see player 1's save, sees only clean leaderboard rows
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', false);
select count(*) as other_saves_visible from public.cloud_saves;
select cid, name from public.leaderboard order by cid;
-- direct writes are refused
insert into public.leaderboard (user_id, cid, name) values ('22222222-2222-2222-2222-222222222222','z','Hacker');
update public.leaderboard set level = 99;
select public.tf_validate('{}'::jsonb);
reset role;
set role anon;
select set_config('request.jwt.claim.sub','', false);
select name from public.tf_leaderboard;
select public.tf_put_save('TF2.x', now(), 'v', 'd', '[]');
reset role;
-- admin + ban flow (service role = superuser here)
insert into public.admins values ('22222222-2222-2222-2222-222222222222');
insert into public.bans values ('11111111-1111-1111-1111-111111111111', 'test');
set role anon; select count(*) as public_rows_after_ban from public.tf_leaderboard; reset role;
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', false);
select count(*) as admin_sees_rows from public.leaderboard; reset role;
delete from public.bans;
-- history check: second post 1 second later jumping 40 levels is refused, board keeps last good row
update public.submissions set at = now() - interval '1 minute';
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', false);
select public.tf_submit_scores(jsonb_build_array(jsonb_build_object('cid','c1','name','Ann Smith','asc',0,'level',45,'xp',
  (select sum(public.tf_level_cost(i)) from generate_series(1,44) i) + 1,'ach',20,'gold',500,'kills',10,'species',1,'coll',3,'alloc',0,'unspent',0,
  'created', (extract(epoch from now())*1000 - 3.6e6*500)::bigint)));
select cid, level, flagged, flags from public.leaderboard where cid='c1';
select public.tf_submit_scores('[]'::jsonb);  -- too soon
reset role;
