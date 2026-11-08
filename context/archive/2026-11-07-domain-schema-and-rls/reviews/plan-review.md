<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Domain Schema with RLS Implementation Plan

- **Plan**: context/changes/domain-schema-and-rls/plan.md
- **Mode**: Deep
- **Date**: 2026-11-07
- **Verdict**: REVISE
- **Findings**: 0 critical, 2 warnings, 1 observation

## Verdicts

| Dimension              | Verdict |
| ---------------------- | ------- |
| End-State Alignment    | PASS    |
| Lean Execution         | PASS    |
| Architectural Fitness  | PASS    |
| Blind Spots            | WARNING |
| Plan Completeness      | WARNING |

## Grounding

9/9 paths ✓, 4/4 symbols ✓, brief↔plan ✓

## Findings

### F1 — `npm run types` fails on first run: `src/types/` absent

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Change #1 (types script), criterion 2.1
- **Detail**: The contract `"types": "supabase gen types typescript --local > src/types/database.types.ts"` relies on a shell redirect, which does NOT create parent directories. `src/types/` does not exist today (verified: no src/types/** anywhere in the repo), so the very first run of criterion 2.1 fails with "No such file or directory" until someone mkdirs by hand. Nothing in the phase contract creates the directory.
- **Fix**: Make the script self-sufficient — `"types": "mkdir -p src/types && supabase gen types typescript --local > src/types/database.types.ts"` (or note in the Phase 2 contract that the directory is committed together with the generated file).
- **Decision**: PENDING

### F2 — Prettier/eslint --fix can mutate the generated file, breaking 2.7

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — Change #4 (lint boundary), criterion 2.7
- **Detail**: `eslint.config.js` includes `eslintPluginPrettier/recommended`, so prettier violations are lint errors — and lint-staged runs `eslint --fix` on `*.{ts,tsx,astro}`, which WILL reformat the generated file at commit time if the CLI output deviates from prettier (generated types commonly exceed the 80-col printWidth). Separately, `npm run format` runs `prettier --write .` over everything. Any of these mutating the file makes criterion 2.7 ("second `npm run types` produces an empty diff") fail. The plan's conditional eslint-ignore covers lint but not `npm run format`.
- **Fix**: When adding the eslint ignore (or proactively), also add `src/types/database.types.ts` to `.prettierignore` so no formatter ever touches generated output.
- **Decision**: PENDING

### F3 — Stale version fact in Current State Analysis

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Current State Analysis
- **Detail**: Plan states `supabase/.temp/cli-latest` holds `v2.122.0`; the file actually contains `v3.0.0` (an upstream-latest marker, not the installed version). The operative claim — installed CLI 2.117.0 via npx — is correct, so this has zero implementation impact.
- **Fix**: Correct the version string during triage, or leave as-is.
- **Decision**: PENDING

## Verification Evidence

- `createServerClient<Database>` is a valid overload — `node_modules/@supabase/ssr/dist/main/createServerClient.d.ts:9` (`Database = any` default), so the Phase 2 generic threading is type-safe.
- All four `createClient()` call sites (`src/middleware.ts:7`, `src/pages/api/auth/signup.ts:9`, `signin.ts:9`, `signout.ts:5`) null-guard via truthiness and annotate no client type — zero edits needed, as the plan claims.
- `scripts/smoke.mjs:33-50` hits only `/`, `/dashboard` and the four auth routes — new RLS-protected tables cannot break it.
- `supabase gen types typescript --local` is valid syntax for the installed CLI 2.117.0 (verified against `node_modules/.bin/supabase gen types --help`).
- `eslint.config.js:88-97` — only ignore source is `includeIgnoreFile(gitignorePath)`; no existing `src/types/**` exemption. `.gitignore` excludes nothing relevant to `src/types/` or `supabase/migrations/`.
- Progress section is mechanically consistent: single `## Progress` at the bottom, every phase and every success criterion maps 1:1 to a Progress entry (6+2 / 5+2 / 4+2), no stray checkboxes in phase blocks.
