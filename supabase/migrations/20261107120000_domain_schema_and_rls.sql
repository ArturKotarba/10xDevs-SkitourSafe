-- SkitourSafe domain schema: skier profiles, route catalogue, outing journal.
-- Closed-value fields are Postgres enum types; access control is RLS, not application code.

-- Enum declaration order defines comparison order. avalanche_level MUST stay ascending:
create type public.avalanche_level as enum ('low', 'moderate', 'considerable', 'high', 'very_high');

create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.wind_direction as enum ('none', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw');
create type public.visibility as enum ('good', 'moderate', 'poor');
create type public.route_difficulty as enum ('easy', 'moderate', 'hard');
-- 'none' covers routes with no meaningful single exposure (broad faces, valley traverses).
-- Position matters: 'none' sorts first, so it never satisfies an octant comparison accidentally.
create type public.aspect_octant as enum ('none', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw');
create type public.outing_outcome as enum ('recommended', 'no_go');
create type public.justification_source as enum ('ai', 'fallback');

-- One profile per user: user_id as primary key makes it a database invariant.
create table public.skier_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  has_abc_gear boolean not null,
  terrain_familiarity public.experience_level not null,
  fitness_level public.experience_level not null,
  available_time_minutes integer not null check (available_time_minutes > 0),
  -- Last-used conditions, nullable until the user saves an outing.
  avalanche_level public.avalanche_level,
  wind_direction public.wind_direction,
  visibility public.visibility,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Route catalogue. Read-only for authenticated users; seeding goes through the service role.
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  difficulty public.route_difficulty not null,
  requires_abc_gear boolean not null,
  duration_minutes integer not null check (duration_minutes > 0),
  max_slope_degrees integer not null check (max_slope_degrees between 0 and 90),
  aspect public.aspect_octant not null,
  above_treeline boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, region)
);

-- Outing journal. Route attributes are snapshotted at save time so a later
-- catalogue edit or route deletion cannot rewrite history.
create table public.outings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome public.outing_outcome not null,
  route_id uuid references public.routes (id) on delete set null,
  -- Snapshotted route attributes (nullable; required for 'recommended' by the check below).
  route_name text,
  route_region text,
  route_difficulty public.route_difficulty,
  route_requires_abc_gear boolean,
  route_duration_minutes integer,
  route_max_slope_degrees integer,
  route_aspect public.aspect_octant,
  route_above_treeline boolean,
  -- Conditions recorded at save time.
  avalanche_level public.avalanche_level not null,
  wind_direction public.wind_direction not null,
  visibility public.visibility not null,
  justification text,
  justification_source public.justification_source not null default 'fallback',
  no_go_reason text,
  created_at timestamptz not null default now(),
  constraint outings_outcome_payload_check check (
    (
      outcome = 'recommended'
      and route_name is not null
      and route_difficulty is not null
    )
    or (
      outcome = 'no_go'
      and no_go_reason is not null
      and route_id is null
    )
  )
);

create index outings_user_created_at_idx on public.outings (user_id, created_at desc);
create index outings_route_id_idx on public.outings (route_id);
create index routes_region_idx on public.routes (region);

alter table public.skier_profiles enable row level security;
alter table public.routes enable row level security;
alter table public.outings enable row level security;

-- skier_profiles: owner-scoped CRUD.
create policy "skier_profiles_select_own" on public.skier_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "skier_profiles_insert_own" on public.skier_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "skier_profiles_update_own" on public.skier_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "skier_profiles_delete_own" on public.skier_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- routes: authenticated read-only; no insert/update/delete policy for any role.
create policy "routes_select_all" on public.routes
  for select to authenticated
  using (true);

-- outings: owner-scoped CRUD.
create policy "outings_select_own" on public.outings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "outings_insert_own" on public.outings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "outings_update_own" on public.outings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "outings_delete_own" on public.outings
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase's `postgres` role carries a pg_default_acl entry
-- ({postgres,anon,authenticated,service_role}=arwdDxtm) that is applied to every object
-- created in `public`. GRANT cannot subtract a default, so the unwanted privileges must be
-- revoked explicitly first. TRUNCATE is the dangerous one: it bypasses RLS entirely.
revoke all on public.skier_profiles, public.routes, public.outings from anon;

revoke truncate, references, trigger on public.skier_profiles, public.routes, public.outings
from authenticated;

-- routes is read-only for every user role; drop the default DML so the catalogue cannot be
-- written even if a write policy is ever added by mistake. Seeding uses service_role.
revoke insert, update, delete on public.routes from authenticated;

-- Explicit grants so intent survives a local reset; nothing is granted to anon.
grant select, insert, update, delete on public.skier_profiles to authenticated;
grant select, insert, update, delete on public.outings to authenticated;
grant select on public.routes to authenticated;

grant all on public.skier_profiles to service_role;
grant all on public.routes to service_role;
grant all on public.outings to service_role;
