-- Thousandfold v0.11a: admin letters addressed by display name (or to everyone).
create or replace function public.tf_admin_mail_to(p_name text, p_subject text, p_body text, p_gift jsonb default null) returns integer
language plpgsql security definer set search_path = public as $$
declare u uuid := tf_private.me(); target uuid;
begin
  if not exists (select 1 from public.admins where user_id = u) then raise exception 'Admins only.'; end if;
  if p_name is null or btrim(p_name) = '' then return public.tf_admin_mail(null, p_subject, p_body, p_gift); end if;
  select user_id into target from public.profiles where name_key = lower(btrim(p_name));
  if target is null then raise exception 'No player with that display name.'; end if;
  return public.tf_admin_mail(target, p_subject, p_body, p_gift);
end $$;
revoke all on function public.tf_admin_mail_to(text, text, text, jsonb) from public, anon;
grant execute on function public.tf_admin_mail_to(text, text, text, jsonb) to authenticated;
