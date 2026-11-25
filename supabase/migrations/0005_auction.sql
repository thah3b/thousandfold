-- ============================================================
-- Thousandfold — Phase 11 (game v0.12): Auction House.
-- Listings (sell), buy orders, instant buys, selling to orders,
-- price history. Everything settles on the server; goods and gold
-- are delivered through the Mailbox (claimable once), so a dropped
-- connection never loses anything. A 5% sales tax is the gold sink.
-- ============================================================

insert into public.tf_config (key, value) values
  ('ah_tax', 0.05),             -- taken from the seller's proceeds
  ('ah_max_listings', 20),
  ('ah_max_orders', 20),
  ('ah_hours', 48),             -- listings and orders last 2 days
  ('ah_max_price', 1e15),
  ('ah_history_days', 30),
  ('ah_min_ms', 1000)           -- one auction action per second per player
on conflict (key) do update set value = excluded.value;

create table if not exists public.ah_listings (
  id         bigserial primary key,
  seller     uuid not null references auth.users (id) on delete cascade,
  item       text not null check (item ~ '^[A-Za-z0-9_:\-]{1,64}$'),
  qty        numeric not null check (qty >= 0),
  price      numeric not null check (price >= 1),
  status     text not null default 'open' check (status in ('open', 'sold', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ah_listings_item_idx on public.ah_listings (item, price, id) where status = 'open';
create index if not exists ah_listings_seller_idx on public.ah_listings (seller, status);
create index if not exists ah_listings_exp_idx on public.ah_listings (expires_at) where status = 'open';

create table if not exists public.ah_orders (
  id         bigserial primary key,
  buyer      uuid not null references auth.users (id) on delete cascade,
  item       text not null check (item ~ '^[A-Za-z0-9_:\-]{1,64}$'),
  qty        numeric not null check (qty >= 0),
  price      numeric not null check (price >= 1),
  status     text not null default 'open' check (status in ('open', 'filled', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ah_orders_item_idx on public.ah_orders (item, price desc, id) where status = 'open';
create index if not exists ah_orders_buyer_idx on public.ah_orders (buyer, status);
create index if not exists ah_orders_exp_idx on public.ah_orders (expires_at) where status = 'open';

create table if not exists public.ah_sales (
  id    bigserial primary key,
  item  text not null,
  qty   numeric not null,
  price numeric not null,
  at    timestamptz not null default now()
);
create index if not exists ah_sales_item_idx on public.ah_sales (item, at desc);
create index if not exists ah_sales_at_idx on public.ah_sales (at);

create table if not exists public.ah_actions (user_id uuid primary key references auth.users (id) on delete cascade, at timestamptz not null default now());

alter table public.ah_listings enable row level security;
alter table public.ah_orders   enable row level security;
alter table public.ah_sales    enable row level security;
alter table public.ah_actions  enable row level security;
drop policy if exists "rpc only" on public.ah_listings; create policy "rpc only" on public.ah_listings for all using (false);
drop policy if exists "rpc only" on public.ah_orders;   create policy "rpc only" on public.ah_orders for all using (false);
drop policy if exists "rpc only" on public.ah_sales;    create policy "rpc only" on public.ah_sales for all using (false);
drop policy if exists "rpc only" on public.ah_actions;  create policy "rpc only" on public.ah_actions for all using (false);
revoke all on public.ah_listings, public.ah_orders, public.ah_sales, public.ah_actions from anon, authenticated;
revoke all on sequence public.ah_listings_id_seq, public.ah_orders_id_seq, public.ah_sales_id_seq from anon, authenticated;

-- ---------- Helpers ----------
create or replace function tf_private.ah_gate(u uuid) returns void
language plpgsql security definer set search_path = public as $$
declare last timestamptz;
begin
  perform tf_private.need_profile(u);
  if exists (select 1 from public.bans where user_id = u) then raise exception 'Your account can''t use the Auction House.'; end if;
  select at into last from public.ah_actions where user_id = u;
  if last is not null and now() - last < make_interval(secs => public.tf_cfg('ah_min_ms')::double precision / 1000) then
    raise exception 'One moment. Try again in a second.';
  end if;
  insert into public.ah_actions (user_id, at) values (u, now()) on conflict (user_id) do update set at = now();
end $$;

create or replace function tf_private.ah_check(p_item text, p_qty numeric, p_price numeric) returns void
language plpgsql immutable set search_path = public as $$
begin
  if p_item is null or p_item !~ '^[A-Za-z0-9_:\-]{1,64}$' then raise exception 'Unknown item.'; end if;
  if p_qty is null or p_qty < 1 or p_qty <> floor(p_qty) or p_qty > 1e9 then raise exception 'Quantity must be a whole number from 1 to 1,000,000,000.'; end if;
  if p_price is null or p_price < 1 or p_price <> floor(p_price) or p_price > 1e15 then raise exception 'Price must be a whole number of gold, at least 1.'; end if;
end $$;

create or replace function tf_private.ah_mail(u uuid, p_subject text, p_body text, p_gold numeric, p_items jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.mail (to_user, from_user, from_name, subject, body, gold, items, expires_at)
  values (u, null, 'Auction House', left(p_subject, 80), left(coalesce(p_body, ''), 500), greatest(0, floor(coalesce(p_gold, 0))), coalesce(p_items, '{}'::jsonb),
          now() + make_interval(days => public.tf_cfg('mail_keep_days')::integer))
$$;

-- Returns expired listings and orders to their owners (also run by housekeeping).
create or replace function tf_private.ah_expire() returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in update public.ah_listings set status = 'expired' where status = 'open' and expires_at <= now() and qty > 0 returning * loop
    perform tf_private.ah_mail(r.seller, 'Auction: listing expired', 'Your listing ended unsold. Here are your items back.', 0, jsonb_build_object(r.item, r.qty));
    n := n + 1;
  end loop;
  for r in update public.ah_orders set status = 'expired' where status = 'open' and expires_at <= now() and qty > 0 returning * loop
    perform tf_private.ah_mail(r.buyer, 'Auction: buy order expired', 'Your buy order ended. Here is the gold you set aside.', r.qty * r.price, '{}'::jsonb);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------- Browsing ----------
-- One row per item that has open listings or orders.
create or replace function public.tf_ah_browse() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  perform tf_private.ah_expire();
  return coalesce((select jsonb_agg(x order by x->>'item') from (
    select jsonb_build_object('item', i.item,
      'low', (select min(price) from public.ah_listings l where l.item = i.item and l.status = 'open' and l.qty > 0),
      'avail', (select coalesce(sum(qty), 0) from public.ah_listings l where l.item = i.item and l.status = 'open'),
      'listings', (select count(*) from public.ah_listings l where l.item = i.item and l.status = 'open' and l.qty > 0),
      'bid', (select max(price) from public.ah_orders o where o.item = i.item and o.status = 'open' and o.qty > 0),
      'wanted', (select coalesce(sum(qty), 0) from public.ah_orders o where o.item = i.item and o.status = 'open'),
      'last', (select price from public.ah_sales s where s.item = i.item order by id desc limit 1)) x
    from (select item from public.ah_listings where status = 'open' and qty > 0
          union select item from public.ah_orders where status = 'open' and qty > 0) i
  ) s), '[]'::jsonb);
end $$;

-- Everything for one item: order book, daily price history and recent sales.
create or replace function public.tf_ah_item(p_item text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  return jsonb_build_object(
    'listings', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'qty', qty, 'price', price, 'mine', seller = u, 'ends', expires_at) order by price, id)
      from (select * from public.ah_listings where item = p_item and status = 'open' and qty > 0 and expires_at > now() order by price, id limit 25) a), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'qty', qty, 'price', price, 'mine', buyer = u, 'ends', expires_at) order by price desc, id)
      from (select * from public.ah_orders where item = p_item and status = 'open' and qty > 0 and expires_at > now() order by price desc, id limit 25) b), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'avg', round(v / q), 'low', lo, 'high', hi, 'vol', q) order by d)
      from (select date_trunc('day', at) d, sum(qty * price) v, sum(qty) q, min(price) lo, max(price) hi
            from public.ah_sales where item = p_item and at > now() - interval '14 days' group by 1) h), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('qty', qty, 'price', price, 'at', at) order by id desc)
      from (select * from public.ah_sales where item = p_item order by id desc limit 10) r), '[]'::jsonb));
end $$;

create or replace function public.tf_ah_mine() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me();
begin
  perform tf_private.ah_expire();
  return jsonb_build_object(
    'listings', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item', item, 'qty', qty, 'price', price, 'ends', expires_at) order by id desc)
      from public.ah_listings where seller = u and status = 'open' and qty > 0), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item', item, 'qty', qty, 'price', price, 'ends', expires_at) order by id desc)
      from public.ah_orders where buyer = u and status = 'open' and qty > 0), '[]'::jsonb));
end $$;

-- ---------- Selling ----------
-- The game removes the items from the seller's bag after this succeeds.
create or replace function public.tf_ah_list(p_item text, p_qty numeric, p_price numeric) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); n integer; nid bigint;
begin
  perform tf_private.ah_check(p_item, p_qty, p_price);
  perform tf_private.ah_gate(u);
  select count(*) into n from public.ah_listings where seller = u and status = 'open' and qty > 0;
  if n >= public.tf_cfg('ah_max_listings') then raise exception 'You can have % listings at once.', public.tf_cfg('ah_max_listings'); end if;
  insert into public.ah_listings (seller, item, qty, price, expires_at)
  values (u, p_item, p_qty, p_price, now() + make_interval(hours => public.tf_cfg('ah_hours')::integer)) returning id into nid;
  return nid;
end $$;

create or replace function public.tf_ah_cancel_listing(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); l public.ah_listings;
begin
  update public.ah_listings set status = 'cancelled' where id = p_id and seller = u and status = 'open' returning * into l;
  if l.id is null then raise exception 'That listing is already gone.'; end if;
  if l.qty > 0 then perform tf_private.ah_mail(u, 'Auction: listing cancelled', 'Here are your items back.', 0, jsonb_build_object(l.item, l.qty)); end if;
end $$;

-- Sell to a buy order. The game removes the items after this succeeds.
create or replace function public.tf_ah_fill(p_order bigint, p_qty numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); o public.ah_orders; q numeric; gross numeric; net numeric;
begin
  perform tf_private.ah_check('x', p_qty, 1);
  perform tf_private.ah_gate(u);
  select * into o from public.ah_orders where id = p_order for update;
  if o.id is null or o.status <> 'open' or o.expires_at <= now() or o.qty <= 0 then raise exception 'That buy order is gone.'; end if;
  if o.buyer = u then raise exception 'You can''t sell to your own order.'; end if;
  q := least(p_qty, o.qty);
  gross := q * o.price; net := floor(gross * (1 - public.tf_cfg('ah_tax')));
  update public.ah_orders set qty = qty - q, status = case when qty - q <= 0 then 'filled' else 'open' end where id = o.id;
  insert into public.ah_sales (item, qty, price) values (o.item, q, o.price);
  perform tf_private.ah_mail(o.buyer, 'Auction: buy order filled', 'You bought ' || q || ' at ' || o.price || ' gold each.', 0, jsonb_build_object(o.item, q));
  perform tf_private.ah_mail(u, 'Auction: sold to a buy order', 'You sold ' || q || ' at ' || o.price || ' gold each. The Auction House kept a ' || round(public.tf_cfg('ah_tax') * 100) || '% fee.', net, '{}'::jsonb);
  return jsonb_build_object('item', o.item, 'sold', q, 'gross', gross, 'net', net);
end $$;

-- ---------- Buying ----------
-- Buys the cheapest listings (never your own) up to p_qty, paying at most p_max each.
-- Items go to the buyer's mailbox, gold to each seller's. The game removes the
-- returned `spent` from the buyer after this succeeds.
create or replace function public.tf_ah_buy(p_item text, p_qty numeric, p_max numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); l record; want numeric := p_qty; q numeric; bought numeric := 0; spent numeric := 0;
begin
  perform tf_private.ah_check(p_item, p_qty, p_max);
  perform tf_private.ah_gate(u);
  for l in select * from public.ah_listings where item = p_item and status = 'open' and qty > 0 and expires_at > now() and seller <> u and price <= p_max
           order by price, id for update skip locked loop
    exit when want <= 0;
    q := least(want, l.qty);
    update public.ah_listings set qty = qty - q, status = case when qty - q <= 0 then 'sold' else 'open' end where id = l.id;
    insert into public.ah_sales (item, qty, price) values (p_item, q, l.price);
    perform tf_private.ah_mail(l.seller, 'Auction: your items sold', 'Sold ' || q || ' at ' || l.price || ' gold each. The Auction House kept a ' || round(public.tf_cfg('ah_tax') * 100) || '% fee.',
      floor(q * l.price * (1 - public.tf_cfg('ah_tax'))), '{}'::jsonb);
    want := want - q; bought := bought + q; spent := spent + q * l.price;
  end loop;
  if bought = 0 then raise exception 'Nothing for sale at that price right now.'; end if;
  perform tf_private.ah_mail(u, 'Auction: purchase', 'You bought ' || bought || ' for ' || spent || ' gold.', 0, jsonb_build_object(p_item, bought));
  return jsonb_build_object('item', p_item, 'bought', bought, 'spent', spent);
end $$;

-- A standing offer to buy. The game sets aside qty × price gold after this succeeds;
-- unused gold comes back by mail when the order is cancelled or expires.
create or replace function public.tf_ah_order(p_item text, p_qty numeric, p_price numeric) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); n integer; nid bigint;
begin
  perform tf_private.ah_check(p_item, p_qty, p_price);
  perform tf_private.ah_gate(u);
  if p_qty * p_price > public.tf_cfg('ah_max_price') then raise exception 'That order is too large.'; end if;
  select count(*) into n from public.ah_orders where buyer = u and status = 'open' and qty > 0;
  if n >= public.tf_cfg('ah_max_orders') then raise exception 'You can have % buy orders at once.', public.tf_cfg('ah_max_orders'); end if;
  insert into public.ah_orders (buyer, item, qty, price, expires_at)
  values (u, p_item, p_qty, p_price, now() + make_interval(hours => public.tf_cfg('ah_hours')::integer)) returning id into nid;
  return nid;
end $$;

create or replace function public.tf_ah_cancel_order(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); o public.ah_orders;
begin
  update public.ah_orders set status = 'cancelled' where id = p_id and buyer = u and status = 'open' returning * into o;
  if o.id is null then raise exception 'That buy order is already gone.'; end if;
  if o.qty > 0 then perform tf_private.ah_mail(u, 'Auction: buy order cancelled', 'Here is the gold you set aside.', o.qty * o.price, '{}'::jsonb); end if;
end $$;

-- ---------- Housekeeping: also expire auctions and trim old price history ----------
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
end $$;
revoke all on function tf_private.housekeeping() from public, anon, authenticated;

-- ---------- Grants ----------
revoke all on function tf_private.ah_gate(uuid), tf_private.ah_check(text, numeric, numeric), tf_private.ah_mail(uuid, text, text, numeric, jsonb), tf_private.ah_expire() from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array['tf_ah_browse()', 'tf_ah_item(text)', 'tf_ah_mine()', 'tf_ah_list(text, numeric, numeric)', 'tf_ah_cancel_listing(bigint)',
    'tf_ah_fill(bigint, numeric)', 'tf_ah_buy(text, numeric, numeric)', 'tf_ah_order(text, numeric, numeric)', 'tf_ah_cancel_order(bigint)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
