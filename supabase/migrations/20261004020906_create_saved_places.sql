-- References the existing fixture IDs; no place snapshots or precise user location.
create table public.saved_places (
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 128),
  saved_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table public.saved_places enable row level security;

-- Override project default grants. Saved membership only needs these operations.
revoke all on table public.saved_places from public, anon, authenticated;
grant select, insert, delete on table public.saved_places to authenticated;

create policy "Read own saved places"
on public.saved_places for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Save own places"
on public.saved_places for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Unsave own places"
on public.saved_places for delete to authenticated
using ((select auth.uid()) = user_id);

-- No UPDATE grant or policy: membership is inserted/deleted, never reassigned.
-- The composite primary key also indexes owner-filtered reads and deduplicates saves.
