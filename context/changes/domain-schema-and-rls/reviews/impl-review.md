<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Domain Schema with RLS Implementation Plan

- **Plan**: context/changes/domain-schema-and-rls/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-11-08
- **Verdict**: NEEDS ATTENTION
- **Findings**: 1 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | FAIL |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | WARNING |

## Findings

### F1 — anon and authenticated hold TRUNCATE, which bypasses RLS

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20261107120000_domain_schema_and_rls.sql:133
- **Detail**: The migration grants explicit DML only, but Supabase's `postgres` role carries a `pg_default_acl` entry (`{postgres=arwdDxtm,anon=arwdDxtm,authenticated=arwdDxtm,service_role=arwdDxtm}`) that is applied to every object created in `public`. As a result `has_table_privilege('anon','public.routes','INSERT')` is true and `TRUNCATE` is held by `anon` and `authenticated` on all three tables. RLS does not apply to `TRUNCATE`, so it is enforced nowhere. Verified: `set role anon; truncate public.routes cascade;` succeeded and **zeroed `public.outings`** — the entire journal across all users. Likewise `DELETE`/`UPDATE`/`INSERT` are granted to `anon` on every table; they are currently only stopped by the absence of an `anon` RLS policy. The comment on line 133 ("nothing is granted to anon") is therefore false in the local stack. The plan's grant block is written as if defaults do not exist ("Do not rely on platform default privileges"), but `GRANT` alone cannot subtract a default privilege.
- **Fix**: Add an explicit revoke before the grants, e.g. `revoke all on public.skier_profiles, public.routes, public.outings from anon; revoke truncate, references, trigger on public.skier_profiles, public.routes, public.outings from authenticated;` then re-issue the intended `grant` statements below it. Re-verify with `has_table_privilege` for `anon`/`authenticated` × `{INSERT,UPDATE,DELETE,TRUNCATE}`.
- **Decision**: FIXED — revoke block added to the migration immediately before the grants; `anon` now holds zero privileges on all three tables and `TRUNCATE` is gone for `anon`/`authenticated` (verified via `has_table_privilege` and a failing `set role anon; truncate public.routes cascade;`). Extended during triage after a cold `db reset` re-applied the default ACLs: `authenticated` still held `INSERT`/`UPDATE`/`DELETE` on `routes` from `pg_default_acl`, so `revoke insert, update, delete on public.routes from authenticated` was added. Final verified matrix — `anon`: nothing; `authenticated`: full DML on `skier_profiles`/`outings`, `SELECT` only on `routes`, `TRUNCATE` nowhere. The plan's `_Grants_` contract now documents the revokes and the verified target state.

### F2 — `npm run types` truncates the committed file on failure

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: package.json:19
- **Detail**: The script is `mkdir -p src/types && supabase gen types typescript --local > src/types/database.types.ts`. Shell redirection truncates the target **before** the CLI runs, so any failure (stack not started, wrong CLI, network) leaves `src/types/database.types.ts` as a 0-byte file that still looks committed-clean in editors and only fails later at `astro check`. Verified: a non-zero-exit dry run produced a 0-byte target. The plan explicitly notes type generation "needs a running stack", making this a realistic failure path rather than a theoretical one.
- **Fix**: Write to a temp file and move on success, e.g. `supabase gen types typescript --local > /tmp/db.types.ts && mv /tmp/db.types.ts src/types/database.types.ts`.
- **Decision**: FIXED — script now writes to `/tmp/skitoursafe-db.types.ts` and `&& mv`s it into place. Re-ran `npm run types` against the local stack: output byte-identical to the committed file, and a simulated failing run leaves the previous destination content intact.

### F3 — `.prettierignore` and the ESLint ignore were added without plan evidence

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: .prettierignore:2 ; eslint.config.js:82
- **Detail**: The plan's Phase 2 §4 contract was conditional: "Add an ignore entry for `src/types/database.types.ts` **only if** `npm run lint` flags it. If the file already passes `strictTypeChecked` unchanged, make no edit." Both ignore entries were added. The ESLint one is justified — running `eslint src/types/database.types.ts --no-ignore` reports 9 `strictTypeChecked`/`stylisticTypeChecked` errors — so only `.prettierignore` drifts from the contract's letter. That said, the `.prettierignore` entry **is** load-bearing: with the ignore disabled, `prettier --check` fails on the generated file, so the deviation is correct in substance and only the plan text is stale.
- **Fix**: Accept as implemented (both ignores are justified by measurement) and note in the plan that the Prettier ignore was needed too. Optionally add one sentence to AGENTS.md explaining *why* both are exempt.
- **Decision**: FIXED — plan text updated in place: Phase 2 §4 now records both exemptions with the measurements behind them, and Phase 2 §1 records the temp-file redirect. `AGENTS.md:50` already named both config files.
### F4 — `context/foundation/infrastructure.md` still says there are no migrations

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/foundation/infrastructure.md:187
- **Detail**: Phase 3's intent was "stop the documentation telling a contributor that no migrations exist." The README was fixed, but the same false statement survives in the rollback section: "Supabase schema changes do not roll back with the Worker — there are no migrations yet, but when they arrive, a Worker rollback and a DB rollback are separate operations." This is now factually wrong and it is the doc a future agent reads before a rollback decision. `supabase/config.toml:62` has a milder version ("There are no migrations or seed files yet") that is also stale — migrations exist, seed files do not.
- **Fix**: Rewrite the infra.md sentence to state that a Worker rollback does not revert the migration and that `supabase db push` is forward-only. Narrow config.toml:62 to "There are no seed files yet."
- **Decision**: FIXED — `infrastructure.md` now states that a Worker rollback reverts only deployed code while migrations stay applied, and that `supabase db push` is forward-only (undoing a schema change needs a compensating migration). `config.toml` narrowed to "There are no seed files yet."

### F5 — Plan's Phase 1 manual and automated checks were marked done but `npm run smoke` fails

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: context/changes/domain-schema-and-rls/plan.md:305
- **Detail**: Criterion 1.6 (`npm run smoke` still passes against the local stack) is checked `[x]` with commit `e2fbab4`. Today it fails 2 of 8 steps: "signup creates account" and "dashboard renders for signed-in user", both with `?error=internal%20error%3B%20reference%3D…`. I established this is **not a regression** — the identical two failures reproduce at `e2fbab4~1`, the pre-change commit, and the direct `POST /auth/v1/signup` to the local stack returns 200 with a valid token. The failure is environmental: `.dev.vars` points at the hosted project `omrqppuyoadtjwbybnol`, whose DNS does not resolve from this machine, so the built worker cannot reach auth. That makes 1.6 unverifiable as marked rather than falsely marked; but since it is checked and currently red, a future reader cannot distinguish "verified green" from "verified against an env that happens to be down".
- **Fix A ⭐ Recommended**: Fix the environment and re-verify: point `.dev.vars` at the local stack (`http://127.0.0.1:54321` + local anon key), rebuild, run `npm run smoke`, and record the real result against 1.6.
  - Strength: Turns a checked-but-unproven box into evidence, and `.dev.vars` pointing at a dead host will keep breaking every later slice's verification.
  - Tradeoff: Overwrites the user's local `.dev.vars`, which currently targets the hosted project on purpose.
  - Confidence: HIGH — the local auth endpoint returns 200 for the exact same signup payload.
  - Blind spot: The hosted project may be reachable from other networks; this may be a local DNS/network outage rather than a permanently dead ref.
- **Fix B**: Uncheck 1.6 with a note that it was not re-verified after the local stack configuration changed.
  - Strength: Makes the gap explicit without mutating a gitignored env file.
  - Tradeoff: Leaves a checked-in plan with an open criterion at `status: implemented`.
  - Confidence: MEDIUM — honest, but records the debt rather than clearing it.
  - Blind spot: None significant.
- **Decision**: FIXED via Fix A — `.dev.vars` repointed at `http://127.0.0.1:54321` with the local anon key (hosted-host copy preserved at `/tmp/skitoursafe-dev-vars.bak`), rebuilt, and `BASE_URL=http://127.0.0.1:8788 npm run smoke` passes **8/8**. Confirmed the hosted host still does not resolve from this machine (`getent hosts` empty, `curl` exit 000), so the failure was environmental, as diagnosed. Criterion 1.6 in the plan now records the re-verification.

### F6 — Route catalogue polymorphic aspect column forces a value on non-directional routes

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture
- **Location**: supabase/migrations/20261107120000_domain_schema_and_rls.sql:39
- **Detail**: `routes.aspect aspect_octant not null` requires every catalogue row to declare a single compass octant, but `wind_direction` and `aspect_octant` include no "variable"/"all" member while `wind_direction` does include `'none'`. A route whose exposure is not meaningfully one octant (a broad face, a valley traverse) has no honest value to store, and the column is `not null` on a table the plan explicitly says must be seedable without a follow-up `ALTER`. The plan's own risk register flags "Aspect encoding is chosen before the filter exists," so this is the predictable cost landing. It does not break today because `routes` is empty.
- **Fix A ⭐ Recommended**: Add `'none'` to `aspect_octant` in this migration while the table is still empty.
  - Strength: Costs one enum member now; adding it later is an `ALTER TYPE` against a seeded table, and the plan warns enum changes are breaking migrations.
  - Tradeoff: Widens the enum for S-03's filter, which must then decide whether `'none'` matches any aspect filter.
  - Confidence: HIGH — the table is provably empty (`select count(*) from public.routes` = 0), so this is the cheapest possible moment.
  - Blind spot: S-03's threshold semantics for a non-directional route are not yet defined.
- **Fix B**: Leave as-is and let S-03 define a sentinel via a nullable column change.
  - Strength: Does not guess at S-03's model.
  - Tradeoff: A future `set not null` / enum alteration against seeded data.
  - Confidence: MEDIUM — depends on whether any real route in the 15-20 route catalogue is non-directional.
  - Blind spot: The actual route list does not exist yet, so this may never bite.
- **Decision**: FIXED via Fix A — `aspect_octant` is now `('none', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw')` with `'none'` declared **first** so it can never satisfy an octant comparison by ordering. Migration re-applied on a cold `db reset` (exit 0), `enum_range` confirms the member, and `select count(*) from public.routes` was 0 at the time of the change. `npm run types` regenerated `src/types/database.types.ts` (2 lines: the union and the `Constants` array). The plan's Phase 1 contract now lists the new member with the rationale, and `## Critical Implementation Details` gained a paragraph stating that `wind_direction` and `aspect_octant` are deliberately non-assignable and that S-03 must define the direction→octant mapping explicitly. Gate results: `npx astro check` 0 errors, `npm run build` clean, `npm run smoke` 8/8.

### F7 — `eslint .` fails repo-wide on two pre-existing skill scripts

- **Severity**: ⚠️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: .github/skills/10x-plan/scripts/metadata-guard.mjs:0
- **Detail**: `npm run lint` exits non-zero on `metadata-guard.mjs` and `metadata-guard.test.mjs` ("was not found by the project service"). These files belong to `c622efe` (`m2l2 - init`), not to this change, and the failure reproduces identically at `e2fbab4~1`. Criterion 2.3 (`npm run lint` passes) is therefore only true for the change's own files. `npx astro check`, `npm run build`, `tsc --noEmit` and `prettier --check` all pass.
- **Fix**: Out of scope for this change — either add `.github/skills/**` to `eslint.config.js` ignores or exclude these two scripts from `projectService`. Worth a separate change so the CI `lint` job is green again.
- **Decision**: SKIPPED — confirmed still reproducing (`npx eslint .github/skills/10x-plan/scripts/metadata-guard.mjs` → "was not found by the project service"). Left for a separate change: the files are managed by `@przeprogramowani/10x-cli` and must not be hand-edited, and the fix belongs in `eslint.config.js`, which is outside this change's scope.

### F8 — Generated types file is correct but `wind_direction`/`aspect_octant` duplication invites drift

- **Severity**: ⚠️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/types/database.types.ts:207
- **Detail**: `wind_direction` (`none` + 8 octants) and `aspect_octant` (8 octants) duplicate the octant literals as two independent enum types. The plan specifies both, so this matches the contract — noting it only because S-03 will compare a route's `aspect_octant` against a profile's `wind_direction`, and the two types are not assignable to each other. That is desirable for correctness but will require an explicit mapping in the filter.
- **Fix**: No change now; S-03 should state how it maps a wind direction onto the aspect octants.
- **Decision**: SKIPPED (no code change) — the duplication matches the plan's contract. The requested plan note was added instead: `## Critical Implementation Details` in `plan.md` now states that the two enums are deliberately non-assignable, that `wind_direction.'none'` means calm while `aspect_octant.'none'` means no meaningful exposure, and that S-03 must define both the direction→octant mapping and what `'none'` matches on each side.
