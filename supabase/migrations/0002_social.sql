-- ============================================================
-- Thousandfold — Phase 10 (game v0.11): profiles, friends, chat,
-- mailbox and gifts, secure trading.
-- Every table is locked (RLS on, no policies, no grants). Players use
-- the SECURITY DEFINER functions below, which check the caller, the
-- friendship, blocks, limits and the data on every call.
-- ============================================================

insert into public.tf_config (key, value) values
  ('chat_min_ms', 1500),        -- one chat message per 1.5 s
  ('chat_max_len', 200),
  ('chat_page', 60),            -- messages returned per fetch
  ('gifts_per_day', 20),
  ('gift_max_stacks', 5),
  ('gift_gold_floor', 1000),    -- any player may gift this much gold
  ('gift_gold_share', 0.25),    -- ...or a quarter of their verified lifetime gold, if more
  ('trade_max_stacks', 8),
  ('trades_open_max', 5),
  ('friends_max', 100),
  ('mail_keep_days', 30)
on conflict (key) do update set value = excluded.value;

create schema if not exists tf_private;
grant usage on schema tf_private to anon, authenticated;

-- ---------- Tables ----------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  name_key   text not null unique,
  code       text not null unique,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

create table if not exists public.friendships (
  a          uuid not null references auth.users (id) on delete cascade,
  b          uuid not null references auth.users (id) on delete cascade,
  requester  uuid not null,
  status     text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);

create table if not exists public.blocks (
  blocker    uuid not null references auth.users (id) on delete cascade,
  blocked    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

create table if not exists public.chat_messages (
  id         bigserial primary key,
  channel    text not null,
  sender     uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  deleted    boolean not null default false
);
create index if not exists chat_channel_idx on public.chat_messages (channel, id desc);
create index if not exists chat_sender_idx on public.chat_messages (sender, created_at desc);

create table if not exists public.mail (
  id         bigserial primary key,
  to_user    uuid not null references auth.users (id) on delete cascade,
  from_user  uuid,
  from_name  text not null default 'Thousandfold',
  subject    text not null default '',
  body       text not null default '',
  gold       numeric not null default 0 check (gold >= 0),
  items      jsonb not null default '{}'::jsonb,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists mail_to_idx on public.mail (to_user, id desc);
create index if not exists mail_from_idx on public.mail (from_user, created_at desc);

create table if not exists public.trades (
  id         bigserial primary key,
  a          uuid not null references auth.users (id) on delete cascade,
  b          uuid not null references auth.users (id) on delete cascade,
  a_offer    jsonb not null default '{"gold":0,"items":{}}'::jsonb,
  b_offer    jsonb not null default '{"gold":0,"items":{}}'::jsonb,
  a_ok       boolean not null default false,
  b_ok       boolean not null default false,
  version    integer not null default 1,
  status     text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  a_settled  boolean not null default false,
  b_settled  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (a <> b)
);
create index if not exists trades_a_idx on public.trades (a, status);
create index if not exists trades_b_idx on public.trades (b, status);

alter table public.profiles      enable row level security;
alter table public.friendships   enable row level security;
alter table public.blocks        enable row level security;
alter table public.chat_messages enable row level security;
alter table public.mail          enable row level security;
alter table public.trades        enable row level security;
drop policy if exists "rpc only" on public.profiles; create policy "rpc only" on public.profiles for all using (false);
drop policy if exists "rpc only" on public.friendships; create policy "rpc only" on public.friendships for all using (false);
drop policy if exists "rpc only" on public.blocks; create policy "rpc only" on public.blocks for all using (false);
drop policy if exists "rpc only" on public.chat_messages; create policy "rpc only" on public.chat_messages for all using (false);
drop policy if exists "rpc only" on public.mail; create policy "rpc only" on public.mail for all using (false);
drop policy if exists "rpc only" on public.trades; create policy "rpc only" on public.trades for all using (false);
revoke all on public.profiles, public.friendships, public.blocks, public.chat_messages, public.mail, public.trades from anon, authenticated;
revoke all on sequence public.chat_messages_id_seq, public.mail_id_seq, public.trades_id_seq from anon, authenticated;

-- ---------- Private helpers ----------
create or replace function tf_private.me() returns uuid
language plpgsql stable set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Sign in first.' using errcode = '28000'; end if;
  return u;
end $$;

create or replace function tf_private.friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.friendships where a = least(x, y) and b = greatest(x, y) and status = 'accepted') $$;

create or replace function tf_private.blocked_either(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.blocks where (blocker = x and blocked = y) or (blocker = y and blocked = x)) $$;

create or replace function tf_private.need_profile(u uuid) returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where user_id = u;
  if p.user_id is null then raise exception 'Choose a display name first.'; end if;
  return p;
end $$;

-- Mask unfriendly words (kept in step with the game's name filter).
create or replace function tf_private.clean_text(t text) returns text
language plpgsql immutable set search_path = public as $$
declare w text; r text := t;
begin
  foreach w in array array['fuck','shit','cunt','bitch','nigg','fag','rape','whore','slut','dick','cock','pussy','nazi','retard','twat','wank'] loop
    r := regexp_replace(r, w, repeat('*', length(w)), 'gi');
  end loop;
  return r;
end $$;

create or replace function tf_private.has_bad_word(t text) returns boolean
language sql immutable set search_path = public as
$$ select tf_private.clean_text(regexp_replace(lower(t), '[^a-z]', '', 'g')) <> regexp_replace(lower(t), '[^a-z]', '', 'g') $$;

-- An offer or gift: {"gold": n, "items": {"key": qty, ...}}. Returns a clean copy or raises.
create or replace function tf_private.clean_offer(o jsonb, max_stacks integer) returns jsonb
language plpgsql immutable set search_path = public as $$
declare g numeric := 0; items jsonb := '{}'::jsonb; k text; v jsonb; n integer := 0;
begin
  if o is null then return jsonb_build_object('gold', 0, 'items', '{}'::jsonb); end if;
  if jsonb_typeof(o) <> 'object' then raise exception 'Bad offer.'; end if;
  if o ? 'gold' then
    if jsonb_typeof(o->'gold') <> 'number' then raise exception 'Bad gold amount.'; end if;
    g := floor((o->>'gold')::numeric);
    if g < 0 or g > 1e15 then raise exception 'Bad gold amount.'; end if;
  end if;
  if o ? 'items' then
    if jsonb_typeof(o->'items') <> 'object' then raise exception 'Bad items.'; end if;
    for k, v in select * from jsonb_each(o->'items') loop
      if k !~ '^[A-Za-z0-9_:\-]{1,64}$' or jsonb_typeof(v) <> 'number' or (v::text)::numeric <> floor((v::text)::numeric)
         or (v::text)::numeric < 1 or (v::text)::numeric > 1e9 then
        raise exception 'Bad item in offer.';
      end if;
      n := n + 1;
      items := items || jsonb_build_object(k, (v::text)::numeric);
    end loop;
  end if;
  if n > max_stacks then raise exception 'Too many different items (max %).', max_stacks; end if;
  return jsonb_build_object('gold', g, 'items', items);
end $$;

-- ---------- Profiles ----------
create or replace function public.tf_set_profile(p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); nm text := btrim(coalesce(p_name, '')); p public.profiles; c text;
begin
  nm := regexp_replace(nm, '\s+', ' ', 'g');
  if nm !~ '^[A-Za-z0-9][A-Za-z0-9 _\-]{2,15}$' then raise exception 'Use 3 to 16 letters, numbers, spaces, - or _.'; end if;
  if tf_private.has_bad_word(nm) then raise exception 'Please choose another name.'; end if;
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

-- Everything the Social tabs need in one call; also marks the caller online.
create or replace function public.tf_social() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); p public.profiles; fr jsonb; bl jsonb; mail_n integer; tr_n integer;
begin
  update public.profiles set last_seen = now() where user_id = u returning * into p;
  if p.user_id is null then return jsonb_build_object('me', null); end if;
  select coalesce(jsonb_agg(x order by x->>'status', lower(x->>'name')), '[]'::jsonb) into fr from (
    select jsonb_build_object(
      'id', o.user_id, 'name', o.name, 'code', o.code,
      'status', case when f.status = 'accepted' then 'friend' when f.requester = u then 'outgoing' else 'incoming' end,
      'online', o.last_seen > now() - interval '5 minutes', 'last_seen', o.last_seen,
      'last_dm', (select max(id) from public.chat_messages m where m.channel = 'dm:' || f.a || ':' || f.b and not m.deleted),
      'last_dm_mine', (select m.sender = u from public.chat_messages m where m.channel = 'dm:' || f.a || ':' || f.b and not m.deleted order by id desc limit 1)
    ) x
    from public.friendships f
    join public.profiles o on o.user_id = case when f.a = u then f.b else f.a end
    where f.a = u or f.b = u
  ) s;
  select coalesce(jsonb_agg(jsonb_build_object('id', o.user_id, 'name', o.name)), '[]'::jsonb) into bl
    from public.blocks k join public.profiles o on o.user_id = k.blocked where k.blocker = u;
  select count(*) into mail_n from public.mail where to_user = u and claimed_at is null and expires_at > now();
  select count(*) into tr_n from public.trades t where (t.a = u or t.b = u) and (t.status = 'open'
    or (t.status <> 'open' and ((t.a = u and not t.a_settled) or (t.b = u and not t.b_settled))));
  return jsonb_build_object('me', jsonb_build_object('id', u, 'name', p.name, 'code', p.code,
    'admin', exists (select 1 from public.admins where user_id = u)),
    'friends', fr, 'blocked', bl, 'mail', mail_n, 'trades', tr_n,
    'global_last', (select max(id) from public.chat_messages where channel = 'global' and not deleted));
end $$;

-- ---------- Friends ----------
create or replace function public.tf_friend_add(p_target text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.profiles; f public.friendships; n integer; q text := btrim(coalesce(p_target, ''));
begin
  perform tf_private.need_profile(u);
  select * into t from public.profiles where code = upper(q) or name_key = lower(q) limit 1;
  if t.user_id is null then raise exception 'No player with that name or friend code.'; end if;
  if t.user_id = u then raise exception 'That''s you!'; end if;
  if tf_private.blocked_either(u, t.user_id) then raise exception 'You can''t add that player.'; end if;
  select count(*) into n from public.friendships where (a = u or b = u);
  if n >= public.tf_cfg('friends_max') then raise exception 'Your friends list is full.'; end if;
  select * into f from public.friendships where a = least(u, t.user_id) and b = greatest(u, t.user_id);
  if f.a is not null then
    if f.status = 'accepted' then return 'already'; end if;
    if f.requester <> u then
      update public.friendships set status = 'accepted', updated_at = now() where a = f.a and b = f.b;
      return 'accepted';
    end if;
    return 'pending';
  end if;
  insert into public.friendships (a, b, requester, status) values (least(u, t.user_id), greatest(u, t.user_id), u, 'pending');
  return 'sent';
end $$;

create or replace function public.tf_friend_respond(p_other uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  if p_accept then
    update public.friendships set status = 'accepted', updated_at = now()
      where a = least(u, p_other) and b = greatest(u, p_other) and status = 'pending' and requester <> u;
    if not found then raise exception 'That request is no longer there.'; end if;
  else
    delete from public.friendships where a = least(u, p_other) and b = greatest(u, p_other) and status = 'pending';
  end if;
end $$;

create or replace function public.tf_friend_remove(p_other uuid) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  delete from public.friendships where a = least(u, p_other) and b = greatest(u, p_other);
  update public.trades set status = 'cancelled', updated_at = now()
    where status = 'open' and ((a = u and b = p_other) or (a = p_other and b = u));
end $$;

create or replace function public.tf_block(p_other uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  if p_other = u then raise exception 'You can''t block yourself.'; end if;
  if p_on then
    insert into public.blocks (blocker, blocked) values (u, p_other) on conflict do nothing;
    perform public.tf_friend_remove(p_other);
  else
    delete from public.blocks where blocker = u and blocked = p_other;
  end if;
end $$;

-- ---------- Chat ----------
create or replace function tf_private.channel_for(u uuid, p_channel text) returns text
language plpgsql stable security definer set search_path = public as $$
declare other uuid;
begin
  if p_channel = 'global' then return 'global'; end if;
  if p_channel !~ '^dm:[0-9a-f-]{36}$' then raise exception 'Unknown chat channel.'; end if;
  other := substr(p_channel, 4)::uuid;
  if not tf_private.friends(u, other) then raise exception 'You can only message friends.'; end if;
  return 'dm:' || least(u, other) || ':' || greatest(u, other);
end $$;

create or replace function public.tf_chat_send(p_channel text, p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); ch text; b text := btrim(coalesce(p_body, '')); last timestamptz; nid bigint;
begin
  perform tf_private.need_profile(u);
  ch := tf_private.channel_for(u, p_channel);
  b := regexp_replace(b, '[\r\n\t]+', ' ', 'g');
  if length(b) = 0 then raise exception 'Type a message first.'; end if;
  if length(b) > public.tf_cfg('chat_max_len') then raise exception 'Messages can be up to % characters.', public.tf_cfg('chat_max_len'); end if;
  select max(created_at) into last from public.chat_messages where sender = u;
  if last is not null and now() - last < make_interval(secs => public.tf_cfg('chat_min_ms')::double precision / 1000) then
    raise exception 'Slow down a little.';
  end if;
  insert into public.chat_messages (channel, sender, body) values (ch, u, tf_private.clean_text(b)) returning id into nid;
  return nid;
end $$;

create or replace function public.tf_chat_get(p_channel text, p_after bigint default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); ch text; r jsonb;
begin
  ch := tf_private.channel_for(u, p_channel);
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'from', sender, 'name', name, 'body', body, 'at', created_at, 'mine', sender = u) order by id), '[]'::jsonb) into r
  from (
    select m.id, m.sender, coalesce(p.name, '?') name, m.body, m.created_at
    from public.chat_messages m left join public.profiles p on p.user_id = m.sender
    where m.channel = ch and m.id > coalesce(p_after, 0) and not m.deleted
      and not exists (select 1 from public.blocks k where k.blocker = u and k.blocked = m.sender)
    order by m.id desc limit public.tf_cfg('chat_page')::integer
  ) s;
  return r;
end $$;

-- Admins can remove a message from everyone's view.
create or replace function public.tf_chat_delete(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  update public.chat_messages set deleted = true
    where id = p_id and (sender = u or exists (select 1 from public.admins where user_id = u));
end $$;

-- ---------- Mailbox and gifts ----------
create or replace function public.tf_mail_list() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'from', from_user, 'from_name', from_name, 'subject', subject, 'body', body,
      'gold', gold, 'items', items, 'claimed', claimed_at is not null, 'at', created_at, 'expires', expires_at) order by id desc)
    from (select * from public.mail where to_user = u and expires_at > now() order by id desc limit 50) s), '[]'::jsonb);
end $$;

-- Atomically takes the attachments: the second claim of the same mail gets nothing.
create or replace function public.tf_mail_claim(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); m public.mail;
begin
  update public.mail set claimed_at = now()
    where id = p_id and to_user = u and claimed_at is null and expires_at > now()
    returning * into m;
  if m.id is null then raise exception 'Already collected or expired.'; end if;
  return jsonb_build_object('gold', m.gold, 'items', m.items);
end $$;

create or replace function public.tf_mail_delete(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  delete from public.mail where id = p_id and to_user = u
    and (claimed_at is not null or (gold = 0 and items = '{}'::jsonb));
  if not found then raise exception 'Collect the gift before deleting the letter.'; end if;
end $$;

create or replace function public.tf_gift_send(p_to uuid, p_gift jsonb, p_note text default '') returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); me_p public.profiles; g jsonb; sent integer; cap numeric; best numeric; nid bigint; note text := btrim(coalesce(p_note, ''));
begin
  me_p := tf_private.need_profile(u);
  if not tf_private.friends(u, p_to) or tf_private.blocked_either(u, p_to) then raise exception 'You can only send gifts to friends.'; end if;
  g := tf_private.clean_offer(p_gift, public.tf_cfg('gift_max_stacks')::integer);
  if (g->>'gold')::numeric = 0 and g->'items' = '{}'::jsonb then raise exception 'Add gold or an item to the gift.'; end if;
  select count(*) into sent from public.mail where from_user = u and created_at > now() - interval '1 day';
  if sent >= public.tf_cfg('gifts_per_day') then raise exception 'You can send % gifts a day.', public.tf_cfg('gifts_per_day'); end if;
  select coalesce(max(gold), 0) into best from public.leaderboard where user_id = u and not flagged;
  cap := greatest(public.tf_cfg('gift_gold_floor'), floor(best * public.tf_cfg('gift_gold_share')));
  if (g->>'gold')::numeric > cap then raise exception 'You can gift up to % gold at once (a quarter of your verified gold earned).', cap; end if;
  if length(note) > 200 then note := left(note, 200); end if;
  insert into public.mail (to_user, from_user, from_name, subject, body, gold, items, expires_at)
  values (p_to, u, me_p.name, 'A gift from ' || me_p.name, tf_private.clean_text(note), (g->>'gold')::numeric, g->'items',
          now() + make_interval(days => public.tf_cfg('mail_keep_days')::integer))
  returning id into nid;
  return nid;
end $$;

-- Admin letters: to one player, or to everyone with a profile when p_to is null.
create or replace function public.tf_admin_mail(p_to uuid, p_subject text, p_body text, p_gift jsonb default null) returns integer
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); g jsonb; n integer;
begin
  if not exists (select 1 from public.admins where user_id = u) then raise exception 'Admins only.'; end if;
  g := tf_private.clean_offer(p_gift, 20);
  insert into public.mail (to_user, from_user, from_name, subject, body, gold, items, expires_at)
  select p.user_id, null, 'Thousandfold', left(coalesce(p_subject, ''), 80), left(coalesce(p_body, ''), 2000), (g->>'gold')::numeric, g->'items',
         now() + make_interval(days => public.tf_cfg('mail_keep_days')::integer)
  from public.profiles p where p_to is null or p.user_id = p_to;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Trades ----------
-- Flow: open → both sides set offers → both confirm the same version → done.
-- Any change to an offer resets both confirmations and bumps the version, so
-- nobody can swap an offer after the other side has agreed. Each side then
-- calls tf_trade_settle once to receive what it was given.
create or replace function tf_private.trade_json(t public.trades, u uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'side', case when t.a = u then 'a' else 'b' end,
    'with', case when t.a = u then t.b else t.a end,
    'with_name', (select name from public.profiles where user_id = case when t.a = u then t.b else t.a end),
    'mine', case when t.a = u then t.a_offer else t.b_offer end,
    'theirs', case when t.a = u then t.b_offer else t.a_offer end,
    'my_ok', case when t.a = u then t.a_ok else t.b_ok end,
    'their_ok', case when t.a = u then t.b_ok else t.a_ok end,
    'version', t.version, 'status', t.status,
    'settled', case when t.a = u then t.a_settled else t.b_settled end,
    'updated', t.updated_at)
$$;

create or replace function public.tf_trade_open(p_with uuid) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades; n integer;
begin
  perform tf_private.need_profile(u);
  if not tf_private.friends(u, p_with) or tf_private.blocked_either(u, p_with) then raise exception 'You can only trade with friends.'; end if;
  select * into t from public.trades where status = 'open' and ((a = u and b = p_with) or (a = p_with and b = u)) limit 1;
  if t.id is not null then return t.id; end if;
  select count(*) into n from public.trades where status = 'open' and (a = u or b = u);
  if n >= public.tf_cfg('trades_open_max') then raise exception 'Finish or cancel a trade first (max % open).', public.tf_cfg('trades_open_max'); end if;
  insert into public.trades (a, b) values (u, p_with) returning * into t;
  return t.id;
end $$;

create or replace function public.tf_trade_list() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  return coalesce((select jsonb_agg(tf_private.trade_json(t, u) order by t.updated_at desc) from public.trades t
    where (t.a = u or t.b = u) and (t.status = 'open' or not (case when t.a = u then t.a_settled else t.b_settled end)
      or t.updated_at > now() - interval '1 day')), '[]'::jsonb);
end $$;

create or replace function public.tf_trade_offer(p_id bigint, p_offer jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades; o jsonb;
begin
  o := tf_private.clean_offer(p_offer, public.tf_cfg('trade_max_stacks')::integer);
  select * into t from public.trades where id = p_id and (a = u or b = u) for update;
  if t.id is null or t.status <> 'open' then raise exception 'That trade is closed.'; end if;
  if t.a = u then update public.trades set a_offer = o, a_ok = false, b_ok = false, version = version + 1, updated_at = now() where id = p_id returning * into t;
  else update public.trades set b_offer = o, a_ok = false, b_ok = false, version = version + 1, updated_at = now() where id = p_id returning * into t; end if;
  return tf_private.trade_json(t, u);
end $$;

create or replace function public.tf_trade_confirm(p_id bigint, p_version integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades;
begin
  select * into t from public.trades where id = p_id and (a = u or b = u) for update;
  if t.id is null or t.status <> 'open' then raise exception 'That trade is closed.'; end if;
  if t.version <> p_version then raise exception 'The trade changed. Check it again before confirming.'; end if;
  if tf_private.blocked_either(t.a, t.b) or not tf_private.friends(t.a, t.b) then raise exception 'You can only trade with friends.'; end if;
  if t.a = u then t.a_ok := true; else t.b_ok := true; end if;
  update public.trades set a_ok = t.a_ok, b_ok = t.b_ok,
    status = case when t.a_ok and t.b_ok then 'done' else 'open' end, updated_at = now()
    where id = p_id returning * into t;
  return tf_private.trade_json(t, u);
end $$;

create or replace function public.tf_trade_unconfirm(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades;
begin
  update public.trades set a_ok = case when a = u then false else a_ok end, b_ok = case when b = u then false else b_ok end, updated_at = now()
    where id = p_id and (a = u or b = u) and status = 'open' returning * into t;
  if t.id is null then raise exception 'That trade is closed.'; end if;
  return tf_private.trade_json(t, u);
end $$;

create or replace function public.tf_trade_cancel(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades;
begin
  update public.trades set status = 'cancelled', updated_at = now()
    where id = p_id and (a = u or b = u) and status = 'open' returning * into t;
  if t.id is null then select * into t from public.trades where id = p_id and (a = u or b = u); end if;
  if t.id is null then raise exception 'No such trade.'; end if;
  return tf_private.trade_json(t, u);
end $$;

-- Once per side: returns what to give back (cancelled) or what was received (done).
create or replace function public.tf_trade_settle(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); t public.trades; was boolean;
begin
  select * into t from public.trades where id = p_id and (a = u or b = u) for update;
  if t.id is null then raise exception 'No such trade.'; end if;
  if t.status = 'open' then raise exception 'That trade is still open.'; end if;
  was := case when t.a = u then t.a_settled else t.b_settled end;
  if not was then
    if t.a = u then update public.trades set a_settled = true where id = p_id; else update public.trades set b_settled = true where id = p_id; end if;
  end if;
  return tf_private.trade_json(t, u) || jsonb_build_object('already', was);
end $$;

-- ---------- Grants ----------
revoke all on all functions in schema tf_private from public, anon, authenticated;
grant execute on all functions in schema tf_private to authenticated;
grant execute on function tf_private.is_admin(), tf_private.is_banned(uuid) to anon;

do $$
declare f text;
begin
  foreach f in array array[
    'tf_set_profile(text)', 'tf_social()', 'tf_friend_add(text)', 'tf_friend_respond(uuid, boolean)', 'tf_friend_remove(uuid)', 'tf_block(uuid, boolean)',
    'tf_chat_send(text, text)', 'tf_chat_get(text, bigint)', 'tf_chat_delete(bigint)',
    'tf_mail_list()', 'tf_mail_claim(bigint)', 'tf_mail_delete(bigint)', 'tf_gift_send(uuid, jsonb, text)', 'tf_admin_mail(uuid, text, text, jsonb)',
    'tf_trade_open(uuid)', 'tf_trade_list()', 'tf_trade_offer(bigint, jsonb)', 'tf_trade_confirm(bigint, integer)', 'tf_trade_unconfirm(bigint)',
    'tf_trade_cancel(bigint)', 'tf_trade_settle(bigint)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
