-- Run after the migration, as postgres (SQL Editor or Supabase CLI).
-- Test users and rows exist only inside this transaction; no emails are sent.
begin;

do $$
begin
  perform set_config('yaan.test_user_a', gen_random_uuid()::text, true);
  perform set_config('yaan.test_user_b', gen_random_uuid()::text, true);
  insert into auth.users (id) values
    (current_setting('yaan.test_user_a')::uuid),
    (current_setting('yaan.test_user_b')::uuid);
  insert into public.saved_places (user_id, place_id)
  values (current_setting('yaan.test_user_b')::uuid, 'test-place-a');
  if not (select relrowsecurity from pg_class where oid = 'public.saved_places'::regclass) then
    raise exception 'RLS is not enabled';
  end if;
end $$;

set local role authenticated;
do $$
declare
  affected integer;
  rejected boolean;
begin
  perform set_config('request.jwt.claim.sub', current_setting('yaan.test_user_a'), true);
  insert into public.saved_places (user_id, place_id) values (auth.uid(), 'test-place-a');
  -- Retrying a save is idempotent; no UPDATE permission is needed.
  insert into public.saved_places (user_id, place_id) values (auth.uid(), 'test-place-a')
    on conflict (user_id, place_id) do nothing;
  if (select count(*) from public.saved_places) <> 1 then
    raise exception 'Owner read isolation or save deduplication failed';
  end if;

  delete from public.saved_places where user_id = current_setting('yaan.test_user_b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user deletion was allowed'; end if;

  rejected := false;
  begin
    insert into public.saved_places (user_id, place_id)
    values (current_setting('yaan.test_user_b')::uuid, 'cross-user-insert');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Cross-user insertion was allowed'; end if;

  rejected := false;
  begin
    update public.saved_places set user_id = current_setting('yaan.test_user_b')::uuid;
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Membership reassignment was allowed'; end if;

  rejected := false;
  begin
    insert into public.saved_places (user_id, place_id) values (auth.uid(), '');
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'Empty place IDs were allowed'; end if;

  delete from public.saved_places where place_id = 'test-place-a';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner deletion failed'; end if;
  delete from public.saved_places where place_id = 'test-place-a';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Repeated unsave was not idempotent'; end if;

  perform set_config('request.jwt.claim.sub', current_setting('yaan.test_user_b'), true);
  if (select count(*) from public.saved_places) <> 1 then
    raise exception 'User B lost their saved place';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  if (select count(*) from public.saved_places) <> 0 then
    raise exception 'Missing auth.uid could read user data';
  end if;
end $$;

set local role anon;
do $$
declare rejected boolean := false;
begin
  begin
    perform * from public.saved_places;
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Anonymous table access was allowed'; end if;
end $$;

reset role;
do $$
begin
  delete from auth.users where id = current_setting('yaan.test_user_b')::uuid;
  if exists (select 1 from public.saved_places where user_id = current_setting('yaan.test_user_b')::uuid) then
    raise exception 'User deletion did not cascade to saved places';
  end if;
end $$;

select 'Saved Places ownership, grants, deduplication, delete and cascade checks passed' as result;
rollback;
