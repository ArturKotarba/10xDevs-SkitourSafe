# Domain Schema with RLS — Plan Brief

> Full plan: `context/changes/domain-schema-and-rls/plan.md`

## What & Why

SkitourSafe has authentication wired and no domain data at all — zero tables, zero migrations, zero `.sql` files. Every later slice (profile form, deterministic filter, AI justification, journal) needs somewhere to persist state. This change creates that foundation: three tables with closed-value fields enforced by Postgres enums and access control enforced by RLS, plus generated TypeScript types so the app cannot drift from the schema.

## Starting Point

`supabase/migrations/` does not exist and `supabase/config.toml:55-58` has migrations enabled with an empty `schema_paths`. `createClient()` in `src/lib/supabase.ts:9` builds a **untyped** client — there are no `.from()` calls anywhere in `src/` yet, so nothing breaks when the generic is added. The repo is not linked to the hosted Supabase project, and `README.md:117` explicitly claims no migrations are required.

## Desired End State

`npx supabase db reset` produces a database with `skier_profiles`, `routes` and `outings`, each with RLS on and owner-scoped policies; a logged-in user can read only their own profile and journal, can read but never write the catalogue, and the database rejects a typo'd avalanche level. `npm run types` regenerates `src/types/database.types.ts`, and `.from("outings")` resolves to a typed row with enum unions. The README describes the real setup and the manual production-push step.

## Key Decisions Made

| Decision                      | Choice                                                                                                                     | Why (1 sentence)                                                                                                                                      | Source |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Where current conditions live | Profile holds last-used values **and** journal snapshots them per entry                                                    | Satisfies roadmap S-01 ("save conditions to the profile") and PRD FR-003 ("each entry records its conditions") without either contradicting the other | Plan   |
| Journal entry fidelity        | Conditions + route snapshot + justification text, with `route_id` FK alongside                                             | Staleness stays computable and old entries stay renderable even if the catalogue is reseeded or a route retired                                       | Plan   |
| Catalogue region dimension    | Flat `region text` column, no lookup table                                                                                 | Matches the roadmap's lean toward a flat list; ~15-20 routes in one area need no normalization                                                        | Plan   |
| Profile cardinality           | Exactly one row per user (`user_id` is the PK)                                                                             | Makes "the user's profile" a database invariant, so reads never resolve ambiguity and saving is a plain upsert                                        | Plan   |
| Closed-value representation   | Postgres enum types (8 of them)                                                                                            | Generated TS types become real unions, so the S-03 filter cannot compare against a typo                                                               | Plan   |
| Catalogue read access         | `authenticated` only, no write policy for any user role                                                                    | Matches the PRD access boundary; a compromised session cannot alter data that feeds a safety decision                                                 | Plan   |
| Type generation               | `supabase gen types --local` → committed `src/types/database.types.ts`, `Database` generic threaded through `createClient` | Compiler enforces schema agreement across all four existing call sites, with no behavior change                                                       | Plan   |
| Migration delivery            | Local verification only; `link` + `db push` documented as a manual step                                                    | Keeps the change reproducible and CI-verifiable without a DB password or assumed hosted access                                                        | Plan   |
| Route attribute surface       | Full filter input: gear, difficulty, duration, max slope, aspect, above-treeline, region                                   | FR-007's filter can run right after F-02 seeds, with no second `ALTER` on an already-seeded table                                                     | Plan   |
| Documentation scope           | Fix the false README claim only; leave `[db.seed]` to F-02                                                                 | Removes actively wrong prose without pre-empting the slice that owns seed mechanics                                                                   | Plan   |

## Scope

**In scope:**

- One migration: 8 enum types, `skier_profiles`, `routes`, `outings`, constraints, indexes
- RLS enabled on all three tables with a full per-operation, per-role policy matrix and explicit grants
- `npm run types` script, generated `src/types/database.types.ts`, `Database` generic on the client
- README correction plus the local-vs-hosted migration runbook; AGENTS.md inventory fix

**Out of scope:**

- Any seed data (F-02 owns it, along with `[db.seed]` in `config.toml`)
- Running `supabase link` / `db push` (documented, not executed)
- Persisting alternative routes, FR-009 rejection reasons, filtering logic, services, API routes
- `updated_at` triggers, `pgTAP`, any test runner

## Architecture / Approach

Enums are declared first and `avalanche_level` is ordered ascending (`low` → `very_high`) so Postgres enum comparison matches the product's meaning — this is what lets S-03 say "level 4 or 5 blocks everything" as a comparison rather than a mapping table. Tables follow in dependency order. RLS encodes the PRD's flat role model: profile and journal are owner-scoped CRUD via `(select auth.uid()) = user_id`, `routes` is authenticated-read-only with no user write policy, and grants are explicit so intent survives a local reset. Types are generated from the applied schema, never hand-written, and the single factory gains the generic so no call site changes.

## Phases at a Glance

| Phase                               | What it delivers                                         | Key risk                                                                                           |
| ----------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. Domain schema migration          | Three RLS-protected tables with enum-typed closed values | A policy gap that leaks another user's journal — verified by an explicit cross-user read assertion |
| 2. Generated types and typed client | `npm run types`, committed types, typed `createClient`   | Generating before the migration is applied yields types for an empty schema                        |
| 3. Documentation sync               | Corrected README and AGENTS.md, production-push runbook  | Documenting a command sequence that was never actually executed                                    |

**Prerequisites:** Docker running locally; `npx supabase start` available (CLI 2.117.0 verified, Docker 29.7.2 verified). No requirement to reach the hosted Supabase project.
**Estimated effort:** ~1-2 sessions across 3 phases. Phase 1 carries nearly all the thinking; phases 2 and 3 are mechanical.

## Open Risks & Assumptions

- **Route columns may not all be used.** Slope/aspect/treeline are included because S-03's open unknown ("how to map declared experience onto allowed slope and exposure") implies them, but S-03 has not fixed its threshold logic. Some columns may prove unused — acceptable versus altering an already-seeded table.
- **Aspect encoding is chosen before the filter exists.** `aspect_octant` is an 8-value compass enum; if S-03 needs finer granularity or sector ranges, this becomes a migration.
- **The hosted database stays empty until someone runs the documented commands.** Later slices cannot be exercised against production data until then.
- **Enum ordering is a breaking change if altered.** Inserting or reordering `avalanche_level` silently changes the meaning of every stored comparison; this is documented as a constraint rather than prevented by a mechanism.
- **CI relies on implicit migration application.** `supabase start` applies migrations on cold volume init (`ci.yml:39-42`); there is no explicit `db reset`, so a _modified_ migration would not be re-verified in CI. Passing CI is not proof the migration is idempotent.
- **Assumes no local data to lose.** `supabase db reset` is destructive; the plan notes `db dump` as a precaution rather than automating it.

## Success Criteria (Summary)

- A database admin can `db reset` and see three tables with RLS on, enum-typed closed values, and a policy matrix matching the PRD's flat access model.
- A second authenticated user cannot read the first user's profile or journal, and no user role can write to `routes`.
- `npm run types` produces a committed declaration file that makes `.from("outings")` a typed query, with `npm run lint`, `npx astro check` and `npm run build` all green.
