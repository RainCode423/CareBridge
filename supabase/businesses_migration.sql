-- Private saved Nearby locations for older adult accounts.
-- Google Maps display uses an iframe; no Google Places API data is stored here.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  category text not null default 'other' check (category in ('pharmacy','clinic','groceries','parks','library','community','cafe','other')),
  address text,
  lat double precision,
  long double precision,
  created_at timestamptz not null default now(),
  constraint business_location_present check (nullif(btrim(coalesce(address,'')),'') is not null or (lat is not null and long is not null)),
  constraint business_valid_coordinates check ((lat is null and long is null) or (lat between -90 and 90 and long between -180 and 180))
);
create index if not exists businesses_user_name_idx on public.businesses(user_id,name);
alter table public.businesses enable row level security;
revoke all on public.businesses from public, anon;
grant select, insert, update, delete on public.businesses to authenticated;
create policy "Owners can read saved locations" on public.businesses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can create saved locations" on public.businesses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners can update saved locations" on public.businesses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can delete saved locations" on public.businesses for delete to authenticated using ((select auth.uid()) = user_id);