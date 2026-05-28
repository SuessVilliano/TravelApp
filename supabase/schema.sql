-- TravelApp database schema (Supabase / Postgres)
-- Paste this into the Supabase SQL editor to provision the production backend.
-- The app runs in local demo mode until NEXT_PUBLIC_SUPABASE_* are set.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Traveler',
  email text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  cover_color text not null default 'ocean',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trip members
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','maybe')),
  role text not null default 'member' check (role in ('host','member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Itinerary items (votes stored inline as jsonb for MVP simplicity)
-- ---------------------------------------------------------------------------
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  type text not null check (type in ('restaurant','activity','lodging','transport','other')),
  title text not null,
  location text,
  day int not null default 1,
  time text,
  category text not null
    check (category in ('lodging','flights','food','activities','transportation','misc')),
  estimate jsonb not null default '{}'::jsonb,
  estimated_cost numeric not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  votes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_trip on public.itinerary_items (trip_id);
create index if not exists idx_members_trip on public.trip_members (trip_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- A user can see/edit a trip if they are a member of it.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.itinerary_items enable row level security;

-- helper: is the current user a member of this trip?
create or replace function public.is_trip_member(tid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = tid and m.user_id = auth.uid()
  );
$$;

-- profiles
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (true);
drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles
  for update using (id = auth.uid());

-- trips: members can read; anyone authenticated can read by invite code lookup;
-- host can update/delete; any authed user can insert (becomes host).
drop policy if exists "trips read" on public.trips;
create policy "trips read" on public.trips
  for select using (public.is_trip_member(id) or true);
drop policy if exists "trips insert" on public.trips;
create policy "trips insert" on public.trips
  for insert with check (host_id = auth.uid());
drop policy if exists "trips update" on public.trips;
create policy "trips update" on public.trips
  for update using (host_id = auth.uid());
drop policy if exists "trips delete" on public.trips;
create policy "trips delete" on public.trips
  for delete using (host_id = auth.uid());

-- trip_members: members can read; a user can insert/update their own row.
drop policy if exists "members read" on public.trip_members;
create policy "members read" on public.trip_members
  for select using (public.is_trip_member(trip_id) or user_id = auth.uid());
drop policy if exists "members upsert" on public.trip_members;
create policy "members upsert" on public.trip_members
  for insert with check (user_id = auth.uid());
drop policy if exists "members update" on public.trip_members;
create policy "members update" on public.trip_members
  for update using (user_id = auth.uid());

-- itinerary_items: trip members can do everything.
drop policy if exists "items read" on public.itinerary_items;
create policy "items read" on public.itinerary_items
  for select using (public.is_trip_member(trip_id));
drop policy if exists "items insert" on public.itinerary_items;
create policy "items insert" on public.itinerary_items
  for insert with check (public.is_trip_member(trip_id));
drop policy if exists "items update" on public.itinerary_items;
create policy "items update" on public.itinerary_items
  for update using (public.is_trip_member(trip_id));
drop policy if exists "items delete" on public.itinerary_items;
create policy "items delete" on public.itinerary_items
  for delete using (public.is_trip_member(trip_id));
