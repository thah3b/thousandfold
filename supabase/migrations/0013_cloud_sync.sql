-- ============================================================
-- Thousandfold — v2.0c: cloud sync across devices.
-- tf_put_save2 refuses to overwrite a newer save written by a
-- different device since this device last synced (p_base),
-- unless the player chose "keep this device" (p_force).
-- The device column now holds "id:label" (e.g. "dk3j2a9:Phone · Safari").
-- ============================================================
create or replace function public.tf_put_save2(p_code text, p_saved_at timestamptz, p_version text, p_device text, p_summary jsonb, p_base timestamptz, p_force boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := tf_private.me(); last timestamptz; ldev text; lsaved timestamptz;
begin
  if p_code is null or char_length(p_code) > public.tf_cfg('save_max_chars') then raise exception 'Save is too large.'; end if;
  if p_code !~ '^(TF2\.[A-Za-z0-9_-]+|[A-Za-z0-9+/=]+)$' then raise exception 'That is not a save code.'; end if;
  if jsonb_typeof(coalesce(p_summary, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_summary, '[]'::jsonb)) > 4 then raise exception 'Bad summary.'; end if;
  select updated_at, device, saved_at into last, ldev, lsaved from public.cloud_saves where user_id = uid;
  if not coalesce(p_force, false) and ldev is not null and split_part(ldev, ':', 1) <> split_part(coalesce(p_device, ''), ':', 1)
     and lsaved > coalesce(p_base, '-infinity'::timestamptz) + interval '1 second' then
    raise exception 'NEWER_SAVE_ELSEWHERE';
  end if;
  if last is not null and now() - last < make_interval(secs => public.tf_cfg('save_min_seconds')::double precision) then
    raise exception 'Saving too often; try again in a few seconds.';
  end if;
  insert into public.cloud_saves (user_id, code, saved_at, version, device, summary, updated_at)
  values (uid, p_code, least(p_saved_at, now()), left(p_version, 16), left(p_device, 32), coalesce(p_summary, '[]'::jsonb), now())
  on conflict (user_id) do update set code = excluded.code, saved_at = excluded.saved_at, version = excluded.version,
    device = excluded.device, summary = excluded.summary, updated_at = now();
  perform tf_private.housekeeping();
end $$;
revoke all on function public.tf_put_save2(text, timestamptz, text, text, jsonb, timestamptz, boolean) from public, anon;
grant execute on function public.tf_put_save2(text, timestamptz, text, text, jsonb, timestamptz, boolean) to authenticated;
