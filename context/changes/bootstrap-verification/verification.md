---
bootstrapped_at: 2026-10-24T21:18:36Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: skitoursafe
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

# Bootstrap verification — skitoursafe

## Hand-off

Verbatim copy of `context/foundation/tech-stack.md` frontmatter:

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: skitoursafe
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
```

### Why this stack

A solo, after-hours web-app with a 3-week MVP window and a hard deadline needs a
batteries-included starter where auth and the database arrive wired, not
assembled. The recommended default for `(web-app, js)` is the 10x Astro Starter
(Astro + Supabase + Cloudflare), and the user took it on the standard path. It
clears all four agent-friendly gates: TypeScript with explicit Zod schemas at
boundaries, Astro's file-based routing and island conventions, mainstream
training-data presence, and current pinned docs. Auth is first-class —
Supabase Postgres + Auth satisfies FR-001/FR-002 with no extra wiring, and the
flat role model needs no admin surface. The AI justification step (FR-007) is
the one addition the starter does not carry: an outbound OpenRouter call from an
API route, with the PRD's static fallback covering model unavailability. No
registry starter in this cell ships AI first-class, so no fork was offered.
Payments, realtime and background jobs are out of scope per the PRD non-goals.
Scaffolding confidence is first-class, not verified.

## Pre-scaffold verification

| Signal      | Value                                             | Severity | Notes                                                       |
| ----------- | ------------------------------------------------- | -------- | ----------------------------------------------------------- |
| npm package | not run                                           | —        | `cmd_template` starts with `git clone`; npm step skipped     |
| GitHub repo | przeprogramowani/10x-astro-starter pushed 2026-09-12 | fresh    | resolved from card `docs_url`; `gh` absent, used REST API   |

Both signals resolved fresh. No heads-up warning emitted.

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone
**Exit code**: 0
**Files moved**: 50 (project files, excluding `node_modules/`)
**Conflicts (.scaffold siblings)**: none
**.gitignore handling**: moved silently (no pre-existing `.gitignore` in cwd)
**.bootstrap-scaffold cleanup**: deleted

### Notes on this run

- The cloned `.bootstrap-scaffold/.git/` was deleted before the move-up, so the
  upstream starter's history does not leak into this repository.
- `.github/` existed on both sides. The merge is recursive: the scaffold
  contributed only `.github/workflows/ci.yml` (a new file), while the cwd's
  10x tooling (`.github/skills/`, `.github/prompts/`, `.github/copilot-instructions.md`,
  `.github/.10x-cli-manifest.json`) was preserved untouched. No collision occurred.
- `context/**` was dropped by policy; the cwd `context/` tree is the source of truth.
- The first merge attempt was interrupted mid-run and partially recursed into
  `node_modules/`, leaving both trees incomplete. Both partial `node_modules/`
  directories were removed and a single clean `npm install` was run in the cwd
  (664 packages, exit 0). This is a run-mechanics note, not a project defect.
- Node toolchain: the local default (v20.20.2) does not satisfy the starter's
  `>=22.12.0` engine requirement. Node **22.14.0** (matching `.nvmrc`) was
  installed via nvm and used for install, audit, and the build check.
- Post-merge build check: `npm run build` → exit 0 (Astro 7 SSR via
  `@astrojs/cloudflare`, server output in `dist/`). One benign warning: the
  sitemap integration is skipped because `astro.config` sets no `site` option.

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 11 HIGH, 2 MODERATE, 1 LOW
**Direct vs transitive**: 2 direct (1 HIGH, 1 LOW) of 14 total. `npm audit`'s
per-advisory `isDirect` flag was used; `metadata.dependencies.direct` is not
emitted by this npm version.

### CRITICAL findings

None.

### HIGH findings

All 11 HIGH findings have a fix available; 10 are transitive, 1 is direct.

| Package                  | Direct | Range affected                          | Fix available |
| ------------------------ | ------ | --------------------------------------- | ------------- |
| `wrangler`               | yes    | 4.16.0 – 4.148.0                        | yes           |
| `@cloudflare/vite-plugin`| no     | 1.2.3 – 1.63.0                          | yes           |
| `brace-expansion`        | no     | <=1.1.20 \|\| 4.0.0 – 5.0.11             | yes           |
| `devalue`                | no     | <=5.9.2                                 | yes           |
| `http-cache-semantics`   | no     | <=4.2.0                                 | yes           |
| `miniflare`              | no     | 4.20250508.3 – 5.20261006.0-alpha       | yes           |
| `sharp`                  | no     | <0.35.5                                 | yes           |
| `source-map-js`          | no     | 1.0.0 – 1.2.1                           | yes           |
| `undici`                 | no     | 7.0.0 – 7.30.0 \|\| 8.0.0 – 8.12.1       | yes           |
| `vite`                   | no     | 8.3.0 – 8.3.2                           | yes           |
| `zod`                    | no     | <4.6.6                                  | yes           |

### MODERATE findings

| Package      | Direct | Range affected  | Fix available |
| ------------ | ------ | --------------- | ------------- |
| `fast-uri`   | no     | 3.0.0 – 3.1.8   | yes           |
| `smol-toml`  | no     | <=1.8.0         | yes           |

### LOW / INFO findings

| Package  | Direct | Range affected | Fix available |
| -------- | ------ | -------------- | ------------- |
| `astro`  | yes    | 7.1.0 – 7.3.2  | yes           |

### Interpretation

The single directly-actionable HIGH is `wrangler` (dev/deploy tooling, not
runtime). The other direct finding, `astro`, is LOW. Everything else is
transitive — advisory until the upstream package ships an update. All findings
report a fix available via `npm audit fix`. Bootstrapper does not auto-patch;
per the PRD non-goals and risk tolerance, the user decides.

## Hints recorded but not acted on

| Hint                       | Value              |
| -------------------------- | ------------------ |
| bootstrapper_confidence    | first-class        |
| quality_override           | false              |
| path_taken                 | standard           |
| self_check_answers         | null               |
| team_size                  | solo               |
| deployment_target          | cloudflare-pages   |
| ci_provider                | github-actions     |
| ci_default_flow            | auto-deploy-on-merge |
| has_auth                   | true               |
| has_payments               | false              |
| has_realtime               | false              |
| has_ai                     | true               |
| has_background_jobs        | false              |

v1 surfaces these but takes no automated action on them. In particular:
- `bootstrapper_confidence: first-class` (not `verified`) — scaffolding is
  expected to work but was not battle-tested end-to-end. Compensating steps, if
  any, belong to the future M1L4 skill.
- `has_ai: true` (FR-007, the outbound OpenRouter call) is not carried by the
  starter and must be added by the user.
- `ci_provider` / `ci_default_flow` — the starter ships
  `.github/workflows/ci.yml`, but wiring the auto-deploy-on-merge flow to
  Cloudflare is left to the user.

## Next steps

```
Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log.
```

Run-specific follow-ups for this bootstrapped project:

- Install and use Node 22.14.0 (`.nvmrc`) — the local default v20.20.2 does not
  satisfy the starter's engine requirement.
- Copy `.env.example` to `.env` (Node) / `.dev.vars` (Cloudflare local dev) and
  populate `SUPABASE_URL` and `SUPABASE_KEY`.
- Add the AI justification route (FR-007) with its static fallback.
- Wire the Cloudflare deploy step behind the existing CI workflow.
- `AGENTS.md` / `CLAUDE.md` shipped by the starter are present; an
  opinionated agent-context setup arrives with the future M1L4 skill.
