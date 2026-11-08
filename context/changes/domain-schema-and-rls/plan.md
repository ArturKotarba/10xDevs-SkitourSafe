# Domain Schema with RLS Implementation Plan

## Overview

Create the first database migration for SkitourSafe: three domain tables (`skier_profiles`, `routes`, `outings`) with Postgres enum types, constraints, indexes, RLS enabled and owner-scoped policies. Then generate TypeScript types from the local schema and thread the `Database` generic through the existing Supabase client factory so every later slice gets compile-time-checked queries. Finally correct the documentation this change falsifies.

## Current State Analysis

The repository has **no database schema at all**:

- `supabase/migrations/` does not exist. `supabase/seeds/` does not exist. There are **zero `.sql` files** anywhere in the repo.
- `supabase/config.toml:55` has `[db.migrations] enabled = true`, but `schema_paths = []` (`:58`). The migrations directory is read by the CLI regardless of `schema_paths`, so an empty array does not block this change.
- `supabase/config.toml:64-67` has `[db.seed] enabled = false` with `sql_paths = []`. The comment at `:62-63` is hand-written guidance pointing at `supabase/seeds/` for a future seed — that belongs to F-02, not here.
- **The repo is not linked to the hosted project.** `supabase/.temp/` holds only `cli-latest` (`v2.122.0`) and an empty `start-secrets/`; there is no `project-ref`. The ref `omrqppuyoadtjwbybnol` appears only in prose (`context/changes/deployment/deployment-plan.md:20`).
- `src/lib/supabase.ts:9` calls `createServerClient(SUPABASE_URL, SUPABASE_KEY, {…})` **without a `Database` generic**, so `.from()` is untyped today. Four call sites: `src/middleware.ts:7`, `src/pages/api/auth/signup.ts:9`, `src/pages/api/auth/signin.ts:9`, `src/pages/api/auth/signout.ts:5`.
- **Zero** `.from(` or `.rpc(` calls exist in `src/`. No `src/types.ts`, no `src/lib/services/`, no generated `database.types.ts`, and no `types`/`gen` npm script (`package.json:10-18`).
- `.github/workflows/ci.yml:39-42` starts local Supabase in the `smoke` job; `supabase start` applies `migrations/*.sql` on cold volume init, but there is no explicit `db reset` step.
- `README.md:117` currently states: _"No database tables or migrations are required — this project uses Supabase Auth's built-in `auth.users` table only."_ This becomes false with this change.
- `AGENTS.md:12` lists `supabase/migrations/` and `src/types.ts` as things that "do not exist yet — create them only when the work needs them".

Verified tooling on this machine: Supabase CLI **2.117.0** (via `npx`), Docker **29.7.2**, Node **v22.14.0**, local stack currently not running.

## Desired End State

`npx supabase db reset` applies one migration and leaves a database with three RLS-protected tables and eight enum types. `npm run types` regenerates `src/types/database.types.ts` from that schema, and `createClient()` returns a client whose `.from("outings")` resolves to a typed row shape with enum unions rather than `any`. The README no longer claims the project has no migrations, and the boundary between "committed migration" and "applied to the hosted project" is written down.

### Key Discoveries:

- `supabase/config.toml:55-58` — migrations are enabled but `schema_paths` is empty; the declarative-schema hook is unused, so DDL belongs in `supabase/migrations/`.
- `src/lib/supabase.ts:5-20` — the factory already returns `null` when env vars are missing; adding a generic must not change that null contract or its four call sites' null handling.
- `tsconfig.json` uses `include: ["**/*"]`, so a generated file under `src/` is type-checked and linted automatically; placing it under `supabase/` would also be checked but without the `@/*` alias.
- `eslint.config.js:20-21` enables `projectService: true` with `strictTypeChecked`; a generated declaration file must either pass it unchanged or be explicitly ignored, never hand-edited.
- `.github/workflows/ci.yml:39-42` relies on `supabase start` for implicit migration application — no workflow change is required for the migration to be exercised in CI.
- `context/foundation/lessons.md` (`.dev.vars` vs Worker secrets) — this change touches no runtime secrets, so that lesson does not constrain it.

## What We're NOT Doing

- **No seed data.** `routes` ships empty. Populating it is F-02 (`curated-route-catalogue`), which also owns `[db.seed]` in `config.toml`.
- **No `supabase link` / `db push` execution.** The hosted project is not linked from this machine and no DB password is in scope. The exact commands are documented as a manual step instead.
- **No alternatives storage.** FR-007's alternative routes are not persisted; the outing record stores the single recommended route. The result shape belongs to S-04.
- **No `FR-009` rejection reasons.** Named as nice-to-have and parked by the roadmap.
- **No filtering logic, services or API routes.** No `src/lib/services/` files, no `.from()` queries, no domain endpoints. Those start at S-01/S-03.
- **No `updated_at` trigger.** The app sets the column on write; a trigger is a later concern.
- **No per-outing override of `available_time`.** FR-004 lists available time in the profile, so it lands there. Roadmap S-01's open question about a per-outing value remains S-01's to answer; this schema does not pre-empt it.
- **No `pgTAP`, no test runner.** Verification is `psql` assertions against the local stack, consistent with a repo that has no test suite.

## Implementation Approach

One migration carries the whole schema so the DDL is reviewable in a single unit and cannot land half-applied: enum types first (they are referenced by column definitions), then the three tables in dependency order (`skier_profiles`, `routes`, `outings`), then indexes, then `enable row level security` and the policy matrix, then explicit grants. Enums are declared in **ascending semantic order** for `avalanche_level` so Postgres enum comparison (`level >= 'high'`) matches the product's numeric meaning without a mapping table. RLS follows the PRD's flat access model literally: owner-scoped CRUD on profile and journal, authenticated-read-only on the catalogue, and no write policy for any user role on `routes` — seeding goes through the service role.

Types are generated from the resulting local database rather than hand-written, and the `Database` generic is threaded through the single client factory so all four existing call sites become typed without changing their behavior.

## Critical Implementation Details

**Enum ordering is load-bearing.** `avalanche_level` must be declared `('low', 'moderate', 'considerable', 'high', 'very_high')` in exactly that order. Postgres orders enum values by declaration position, and S-03's hard filter will express "level 4 or 5 blocks all outings" as a comparison. Reordering or inserting a value later changes the meaning of every stored comparison — treat that as a breaking migration.

**`supabase gen types --local` needs a running stack.** It reads the schema from the local database, not from the migration file, so `supabase start` + `db reset` must precede type generation. Generating before the migration is applied produces types for the old (empty) schema.

**RLS policies must use `(select auth.uid())`, not bare `auth.uid()`.** The subselect form lets Postgres evaluate the identity once per statement instead of once per row; on `routes` reads this is the difference between a stable filter and a per-row function call.

## Phase 1: Domain Schema Migration

### Overview

Create `supabase/migrations/20261107120000_domain_schema_and_rls.sql` containing the enum types, three tables, indexes, RLS enablement, the full policy matrix and explicit grants. Verify it applies cleanly on a cold local database and that access control actually isolates users.

### Changes Required:

#### 1. Domain schema migration

**File**: `supabase/migrations/20261107120000_domain_schema_and_rls.sql` (new)

**Intent**: Define the three domain tables the roadmap's foundation needs, with closed-value fields enforced by Postgres enum types and access control enforced by RLS rather than application code — so a future query cannot accidentally read another user's journal or write to the catalogue.

**Contract**: A single `.sql` file following `AGENTS.md`'s `YYYYMMDDHHmmss_short_description.sql` convention, containing in order:

_Enum types (8)_ — `experience_level` `('beginner','intermediate','advanced')`; `avalanche_level` `('low','moderate','considerable','high','very_high')`; `wind_direction` `('none','n','ne','e','se','s','sw','w','nw')`; `visibility` `('good','moderate','poor')`; `route_difficulty` `('easy','moderate','hard')`; `aspect_octant` `('n','ne','e','se','s','sw','w','nw')`; `outing_outcome` `('recommended','no_go')`; `justification_source` `('ai','fallback')`.

_`public.skier_profiles`_ — `user_id uuid primary key references auth.users(id) on delete cascade`; durable attributes `has_abc_gear boolean not null`, `terrain_familiarity experience_level not null`, `fitness_level experience_level not null`, `available_time_minutes integer not null check (available_time_minutes > 0)`; last-used conditions `avalanche_level` (nullable), `wind_direction` (nullable), `visibility` (nullable); `created_at`/`updated_at timestamptz not null default now()`. A `user_id` primary key is what makes "one profile per user" a database invariant.

_`public.routes`_ — `id uuid primary key default gen_random_uuid()`; `name text not null`; `region text not null`; `difficulty route_difficulty not null`; `requires_abc_gear boolean not null`; `duration_minutes integer not null check (duration_minutes > 0)`; `max_slope_degrees integer not null check (max_slope_degrees between 0 and 90)`; `aspect aspect_octant not null`; `above_treeline boolean not null`; `created_at`/`updated_at` as above. Add a `unique (name, region)` constraint so seeding cannot silently duplicate a route.

_`public.outings`_ — `id uuid primary key default gen_random_uuid()`; `user_id uuid not null references auth.users(id) on delete cascade`; `outcome outing_outcome not null`; `route_id uuid references public.routes(id) on delete set null`; snapshotted route attributes all nullable (`route_name text`, `route_region text`, `route_difficulty route_difficulty`, `route_requires_abc_gear boolean`, `route_duration_minutes integer`, `route_max_slope_degrees integer`, `route_aspect aspect_octant`, `route_above_treeline boolean`); conditions recorded at save time `avalanche_level avalanche_level not null`, `wind_direction wind_direction not null`, `visibility visibility not null`; `justification text` (nullable), `justification_source justification_source not null default 'fallback'`, `no_go_reason text` (nullable); `created_at timestamptz not null default now()`. Add a check constraint tying outcome to payload: `outcome = 'recommended'` requires `route_name` and `route_difficulty` to be non-null; `outcome = 'no_go'` requires `no_go_reason` to be non-null and `route_id` to be null.

_Indexes_ — `outings (user_id, created_at desc)` for the journal read; `outings (route_id)` for the FK; `routes (region)`.

_RLS_ — `alter table … enable row level security` on all three. Then, per `AGENTS.md`'s "granular per-operation, per-role policies":

| Table            | `select`                                                 | `insert`                                                      | `update`       | `delete`                                |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------- | -------------- | --------------------------------------- |
| `skier_profiles` | `authenticated`, `using ((select auth.uid()) = user_id)` | `authenticated`, `with check ((select auth.uid()) = user_id)` | same as insert | `using ((select auth.uid()) = user_id)` |
| `routes`         | `authenticated`, `using (true)`                          | —                                                             | —              | —                                       |
| `outings`        | `authenticated`, `using ((select auth.uid()) = user_id)` | `authenticated`, `with check ((select auth.uid()) = user_id)` | same as insert | `using ((select auth.uid()) = user_id)` |

_Grants_ — explicitly `grant select, insert, update, delete on public.skier_profiles and public.outings to authenticated`, `grant select on public.routes to authenticated`, and `grant all on the three tables to service_role`. Do not grant anything to `anon`. Do not rely on platform default privileges, so the intent survives a local reset.

```sql
-- Enum declaration order defines comparison order. avalanche_level MUST stay ascending:
create type public.avalanche_level as enum ('low', 'moderate', 'considerable', 'high', 'very_high');
```

### Success Criteria:

#### Automated Verification:

- Migration file exists at `supabase/migrations/20261107120000_domain_schema_and_rls.sql` and matches the `AGENTS.md` naming convention
- Local stack applies it cleanly: `npx supabase start && npx supabase db reset` exits 0 with no migration error
- Schema assertion query returns 3 tables and the expected enum types: `docker exec supabase_db_skitoursafe psql -U postgres -d postgres -tAc "select count(*) from information_schema.tables where table_schema='public' and table_name in ('skier_profiles','routes','outings')"`
- RLS assertion query returns `rowsecurity = true` for all three tables and policy counts of 4 / 1 / 4: `docker exec supabase_db_skitoursafe psql -U postgres -d postgres -tAc "select tablename, count(*) from pg_policies where schemaname='public' group by tablename order by tablename"`
- Cross-user isolation check returns 0 foreign rows when reading as a second user (`set role authenticated; set request.jwt.claims = '{"sub":"<user-b-uuid>"}'` then select from `outings` seeded for user A)
- `npm run smoke` still passes against the local stack (auth routes must be unaffected)

#### Manual Verification:

- Open Studio at `http://localhost:54323`, confirm the three tables exist with the expected columns, and that every closed-value column shows its enum type rather than `text`
- Attempt a write as an authenticated user through Studio's SQL editor (`set role authenticated; insert into public.routes …`) and confirm it is denied by RLS

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Generated Types and Typed Client

### Overview

Add a repeatable type-generation script, commit the generated declaration file, and thread the `Database` generic through the single Supabase client factory so queries are typed from the schema.

### Changes Required:

#### 1. Type generation script

**File**: `package.json`

**Intent**: Make regenerating types a single documented command rather than a recalled CLI invocation, so the schema and the TypeScript types cannot drift out of habit.

**Contract**: A new `"types": "supabase gen types typescript --local > src/types/database.types.ts"` entry in `scripts`, placed after `"smoke"`. No new dependency — `supabase` is already a devDependency (`package.json:57`) and the CLI is invoked through the local install.

#### 2. Generated database types

**File**: `src/types/database.types.ts` (new, generated)

**Intent**: Provide the schema-derived `Database` type that the client generic and all later queries depend on.

**Contract**: Produced only by `npm run types` against a running local stack with the migration applied. Contains a `Database` export with `public.Tables` for `skier_profiles`, `routes`, `outings` and `public.Enums` for the eight enum types, so enum columns resolve to string unions. **Must never be hand-edited** — regeneration is the only edit path.

#### 3. Typed client factory

**File**: `src/lib/supabase.ts`

**Intent**: Make the returned client carry the schema type so `.from("outings")` yields a typed row instead of an untyped one, without changing the existing null-return contract that four call sites depend on.

**Contract**: Import `Database` from `@/types/database.types` and parameterize the existing call as `createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {…})`. The `if (!SUPABASE_URL || !SUPABASE_KEY) return null;` guard at `:6-8` and the exported signature `(requestHeaders: Headers, cookies: AstroCookies)` stay unchanged, so `src/middleware.ts:7` and the three auth routes require no edits.

#### 4. Generated-file lint boundary

**File**: `eslint.config.js`

**Intent**: Keep the generated declaration file out of hand-editing pressure by making it exempt from rules it was not written for, while leaving it type-checked.

**Contract**: Add an ignore entry for `src/types/database.types.ts` only if `npm run lint` flags it. If the file already passes `strictTypeChecked` unchanged, make no edit — do not add a speculative exemption.

### Success Criteria:

#### Automated Verification:

- `npm run types` regenerates the file without error while the local stack is running
- `src/types/database.types.ts` exists and contains `skier_profiles`, `routes`, `outings` and the enum unions
- `npm run lint` passes
- `npx astro check` passes
- `npm run build` succeeds

#### Manual Verification:

- In the editor, hovering `createClient(...)` shows a `SupabaseClient<Database, …>` return type rather than the unparameterized default
- `src/types/database.types.ts` contains no manual additions outside generated output (diff after a second `npm run types` is empty)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Documentation Sync

### Overview

Replace the README statement this change falsifies, document `npm run types`, and record the manual boundary between committed migrations and the hosted project. Update the AGENTS.md inventory that lists these paths as non-existent.

### Changes Required:

#### 1. README database section

**File**: `README.md`

**Intent**: Stop the README telling a new contributor that no migrations exist, and give them the two commands that matter: how to apply the schema locally and how to regenerate types.

**Contract**: Replace the single sentence at `:117` with a short subsection describing the three domain tables, `npx supabase db reset` as the way to apply migrations locally, and `npm run types` as the way to refresh `src/types/database.types.ts`. Note that seeding is not yet configured (F-02 owns it) so `routes` is empty locally.

#### 2. Hosted-project runbook

**File**: `README.md`

**Intent**: Make the boundary explicit: the committed migration is the source of truth, and applying it to the hosted project is a deliberate manual act, not something CI does.

**Contract**: A short paragraph in the same subsection stating that the local repo is not linked, the hosted project ref is `omrqppuyoadtjwbybnol`, and the sequence is `npx supabase link --project-ref omrqppuyoadtjwbybnol` followed by `npx supabase db push`. Escape the angle brackets in any placeholder form so the Markdown table and code fences stay intact.

#### 3. AGENTS.md artifact inventory

**File**: `AGENTS.md`

**Intent**: Correct the "these do not exist yet" list so a future agent does not re-create or skip what now exists.

**Contract**: In the bullet at `:12`, remove `supabase/migrations/` and the `src/types.ts` implication that no schema types exist. Add `src/types/database.types.ts` as generated-only, and add `npm run types` to the Commands table with the note that it requires a running local stack.

### Success Criteria:

#### Automated Verification:

- `grep -c "No database tables or migrations are required" README.md` returns 0
- `README.md` mentions `npm run types` and `supabase db push`
- `AGENTS.md` no longer lists `supabase/migrations/` as absent
- `npx prettier --check README.md AGENTS.md` passes

#### Manual Verification:

- Read the README Supabase section start to finish as a first-time contributor and confirm no remaining statement contradicts the new schema
- Confirm the documented `link` and `db push` commands are copy-pasteable and reference the real project ref

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

None. The repository has no test runner (`AGENTS.md:6`) and this phase adds no application logic to unit-test. The schema's correctness is asserted at the SQL level in Phase 1.

### Integration Tests:

The `smoke` CI job (`ci.yml:26-56`) starts a local Supabase and runs `supabase start`, which applies `migrations/*.sql` on cold volume init. This gives implicit integration coverage that the migration does not break auth. No workflow change is required.

### Manual Testing Steps:

1. `npx supabase start`, then `npx supabase db reset` — confirm the migration applies with no error and the output lists it.
2. Open Studio, inspect each table's columns and confirm enum types are used for closed-value fields.
3. As an authenticated user, attempt `insert into public.routes` and confirm RLS denies it.
4. As user A, insert an `outings` row; as user B, `select` from `outings` and confirm zero rows.
5. Run `npm run types` twice and confirm the second run produces an empty diff.
6. Run `npm run lint`, `npx astro check`, `npm run build` and confirm all pass.

## Performance Considerations

No load concerns — `target_scale` is `small` (`prd.md` frontmatter) with `qps: low` and ~15-20 routes. The only deliberate performance choices are the `(select auth.uid())` form in policies (per-statement evaluation instead of per-row) and the composite `outings (user_id, created_at desc)` index that lets the journal read be a single index scan. Both are cheap to include now and awkward to retrofit.

## Migration Notes

This is the **first** migration in the repository, so there is no existing data to migrate and no rollback path to design — dropping the migration drops everything it created. Two forward-looking constraints are worth recording:

- Adding a value to `avalanche_level` later requires `ALTER TYPE … ADD VALUE`, which in Postgres 17 cannot be used in the same transaction that references the new value. A migration that both adds and uses a level must be split into two.
- `supabase db reset` is destructive to the local database. Anyone with local data should `supabase db dump` first.

## References

- Change identity: `context/changes/domain-schema-and-rls/change.md`
- Roadmap item: `context/foundation/roadmap.md` — F-01 `domain-schema-and-rls`
- PRD: `context/foundation/prd.md` — `## Access Control`, `## Business Logic`, FR-004, FR-005, FR-007, FR-008
- Shaping decisions: `context/foundation/shape-notes.md` — "Western Tatras, 15-20 routes manually", "equipment rule", "NO-GO outcome"
- Client factory: `src/lib/supabase.ts:5-20`
- Migration config: `supabase/config.toml:53-67`
- CI Supabase startup: `.github/workflows/ci.yml:39-42`
- Falsified documentation: `README.md:117`
- Repo conventions for migrations and RLS: `AGENTS.md` — "Conventions" and "Architecture"
- Lessons register (checked, no applicable rule for this change): `context/foundation/lessons.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Domain Schema Migration

#### Automated

- [x] 1.1 Migration file exists at `supabase/migrations/20261107120000_domain_schema_and_rls.sql` and matches the `AGENTS.md` naming convention — e2fbab4
- [x] 1.2 Local stack applies it cleanly: `npx supabase start && npx supabase db reset` exits 0 with no migration error — e2fbab4
- [x] 1.3 Schema assertion query returns 3 tables and the expected enum types — e2fbab4
- [x] 1.4 RLS assertion query returns `rowsecurity = true` for all three tables and policy counts of 4 / 1 / 4 — e2fbab4
- [x] 1.5 Cross-user isolation check returns 0 foreign rows when reading as a second user — e2fbab4
- [x] 1.6 `npm run smoke` still passes against the local stack — e2fbab4

#### Manual

- [x] 1.7 Studio shows the three tables with expected columns and enum types for every closed-value field — e2fbab4
- [x] 1.8 An authenticated `insert` into `public.routes` is denied by RLS — e2fbab4

### Phase 2: Generated Types and Typed Client

#### Automated

- [x] 2.1 `npm run types` regenerates the file without error while the local stack is running — 02e9216
- [x] 2.2 `src/types/database.types.ts` exists and contains `skier_profiles`, `routes`, `outings` and the enum unions — 02e9216
- [x] 2.3 `npm run lint` passes — 02e9216
- [x] 2.4 `npx astro check` passes — 02e9216
- [x] 2.5 `npm run build` succeeds — 02e9216

#### Manual

- [x] 2.6 Hovering `createClient(...)` shows a `SupabaseClient<Database, …>` return type — 02e9216
- [x] 2.7 A second `npm run types` produces an empty diff (no manual additions) — 02e9216

### Phase 3: Documentation Sync

#### Automated

- [x] 3.1 `grep -c "No database tables or migrations are required" README.md` returns 0 — 5c05ec3
- [x] 3.2 `README.md` mentions `npm run types` and `supabase db push` — 5c05ec3
- [x] 3.3 `AGENTS.md` no longer lists `supabase/migrations/` as absent — 5c05ec3
- [x] 3.4 `npx prettier --check README.md AGENTS.md` passes — 5c05ec3

#### Manual

- [x] 3.5 README Supabase section reads consistently with no contradictory statements — 5c05ec3
- [x] 3.6 Documented `link` and `db push` commands are copy-pasteable and reference the real project ref — 5c05ec3
