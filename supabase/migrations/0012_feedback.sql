-- ============================================================
-- Thousandfold — v2.0b: in-game feedback.
-- Anyone (guest or signed in) can send a short message; only
-- admins can read it, in the Chat tab's Feedback inbox.
-- ============================================================
insert into public.tf_config (key, value) values ('fb_per_hour', 3), ('fb_global_per_hour', 300)
on conflict (key) do update set value = excluded.value;

create table if not exists public.feedback (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  user_id   uuid references auth.users (id) on delete set null,
  device    text not null,
  name      text,
  contact   text,
  category  text not null default 'other',
  body      text not null,
  meta      jsonb not null default '{}'::jsonb,
  done      boolean not null default false
);
create index if not exists feedback_at_idx on public.feedback (at desc);
create index if not exists feedback_device_idx on public.feedback (device, at desc);
alter table public.feedback enable row level security;
drop policy if exists "rpc only" on public.feedback; create policy "rpc only" on public.feedback for all using (false);
revoke all on public.feedback from anon, authenticated;

create or replace function public.tf_feedback_send(p_device text, p_name text, p_contact text, p_category text, p_body text, p_meta jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); d text := left(coalesce(p_device, ''), 64);
begin
  if length(b) < 3 then raise exception 'Please write a little more.'; end if;
  if length(b) > 1000 then raise exception 'Please keep it under 1,000 characters.'; end if;
  if d !~ '^[A-Za-z0-9_-]{6,64}$' then raise exception 'Bad device.'; end if;
  if u is not null and exists (select 1 from public.bans where user_id = u) then raise exception 'You can''t send feedback.'; end if;
  if (select count(*) from public.feedback where device = d and at > now() - interval '1 hour') >= public.tf_cfg('fb_per_hour') then raise exception 'Thanks! You''ve sent a lot recently. Please try again in an hour.'; end if;
  if (select count(*) from public.feedback where at > now() - interval '1 hour') >= public.tf_cfg('fb_global_per_hour') then raise exception 'Feedback is busy right now. Please try again later.'; end if;
  if p_meta is not null and octet_length(p_meta::text) > 2000 then raise exception 'Bad details.'; end if;
  insert into public.feedback (user_id, device, name, contact, category, body, meta)
  values (u, d, nullif(left(btrim(coalesce(p_name, '')), 40), ''), nullif(left(btrim(coalesce(p_contact, '')), 80), ''),
    case when p_category in ('bug', 'idea', 'other') then p_category else 'other' end, b, coalesce(p_meta, '{}'::jsonb));
  return true;
end $$;

create or replace function public.tf_feedback_list(p_all boolean default false) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not tf_private.is_admin() then raise exception 'Admins only.'; end if;
  return coalesce((select jsonb_agg(x order by (x->>'id')::bigint desc) from (
    select jsonb_build_object('id', f.id, 'at', f.at, 'name', f.name, 'contact', f.contact, 'category', f.category, 'body', f.body, 'meta', f.meta, 'done', f.done,
      'player', p.name, 'signedIn', f.user_id is not null) x
    from public.feedback f left join public.profiles p on p.user_id = f.user_id
    where p_all or not f.done order by f.id desc limit 200) q), '[]'::jsonb);
end $$;

create or replace function public.tf_feedback_done(p_id bigint, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not tf_private.is_admin() then raise exception 'Admins only.'; end if;
  update public.feedback set done = coalesce(p_done, true) where id = p_id;
end $$;

revoke all on function public.tf_feedback_send(text, text, text, text, text, jsonb) from public;
grant execute on function public.tf_feedback_send(text, text, text, text, text, jsonb) to anon, authenticated;
revoke all on function public.tf_feedback_list(boolean) from public, anon;
grant execute on function public.tf_feedback_list(boolean) to authenticated;
revoke all on function public.tf_feedback_done(bigint, boolean) from public, anon;
grant execute on function public.tf_feedback_done(bigint, boolean) to authenticated;
