-- v3.1 — The Pioneers: the first 10 accounts to reach the leaderboards keep a permanent rank.
-- Seeded from today's leaderboard (earliest first_seen per account), then filled as new
-- accounts post their first (unflagged) score, until there are 10.
create table if not exists public.pioneers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rank    integer not null unique check (rank between 1 and 10),
  at      timestamptz not null default now()
);
alter table public.pioneers enable row level security;
-- No direct access; read through tf_pioneer_rank().

insert into public.pioneers (user_id, rank, at)
select user_id, row_number() over (order by first) as rank, first from (
  select l.user_id, min(l.first_seen) as first from public.leaderboard l
  where not l.flagged and not exists (select 1 from public.bans b where b.user_id = l.user_id)
  group by l.user_id order by first limit 10) q
on conflict do nothing;

create or replace function tf_private.pioneer_fill() returns trigger
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if new.flagged then return new; end if;
  if exists (select 1 from public.pioneers p where p.user_id = new.user_id) then return new; end if;
  lock table public.pioneers in share row exclusive mode;
  select count(*) into n from public.pioneers;
  if n < 10 then insert into public.pioneers (user_id, rank) values (new.user_id, n + 1) on conflict do nothing; end if;
  return new;
end $$;
drop trigger if exists leaderboard_pioneer on public.leaderboard;
create trigger leaderboard_pioneer after insert or update of flagged on public.leaderboard
  for each row execute function tf_private.pioneer_fill();

create or replace function public.tf_pioneer_rank() returns integer
language sql stable security definer set search_path = public as $$
  select rank from public.pioneers where user_id = tf_private.me() $$;
revoke all on function public.tf_pioneer_rank() from public;
grant execute on function public.tf_pioneer_rank() to authenticated;

-- v3.1 adds 20 pet species (69 in all, plus hybrids).
update public.tf_config set value = 100 where key = 'species_max';
