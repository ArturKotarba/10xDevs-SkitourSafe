---
project: skitoursafe
researched_at: 2026-10-26
recommended_platform: Cloudflare Workers
runner_up: Vercel
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7.3.2 (SSR, React 19 islands, Tailwind CSS 4)
  runtime: Cloudflare workerd (via @astrojs/cloudflare ^14.3.1)
---

## Recommendation

**Deploy on Cloudflare Workers.**

The stack already ships wired for it: `@astrojs/cloudflare ^14.3.1` and `wrangler ^4.131.1` are
installed, `wrangler.jsonc` already declares the correct v14 entrypoint, and `astro dev` runs on the
real `workerd` runtime so local behaviour matches production. Every routine operation —
deploy, rollback, tail logs, manage secrets — has a documented non-interactive CLI command, and the
free tier covers this MVP's traffic (100k requests/day) at $0 with no commercial-use restriction.
All five agent-friendly criteria pass, the only platform in the pool to do so.

Important correction: `context/foundation/tech-stack.md` records
`deployment_target: cloudflare-pages`. Adapter v14 **removed Cloudflare Pages support** and targets
Workers only. The Pages commands (`wrangler pages deploy`, `wrangler pages dev`) do not apply. That
frontmatter hint should be read as `cloudflare-workers`.

## Platform Comparison

Hard filters applied first. Interview answer P1 was "no persistent connections", so serverless-only
platforms were not rejected. The stack requires either `workerd` (Cloudflare) or a Node.js server
(Vercel, Netlify, Railway, Fly.io, Render) — all six candidates can run it, so nothing was
disqualified on runtime grounds.

Criteria are scored Pass / Partial / Fail per `references/agent-friendly-criteria.md`.

| Platform | CLI-first | Managed/Serverless | Agent-accessible docs | Stable deployment API | MCP / integration | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Cloudflare Workers | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4 Pass, 1 Partial |
| Netlify | Partial | Pass | Pass | Partial | Pass | 3 Pass, 2 Partial |
| Railway | Partial | Pass | Pass | Partial | Pass | 3 Pass, 2 Partial |
| Fly.io | Partial | Pass | Pass | Partial | Pass | 3 Pass, 2 Partial |
| Render | Partial | Pass | Pass | Partial | Partial | 2 Pass, 3 Partial |

**Cloudflare Workers** — `wrangler deploy` / `wrangler rollback` / `wrangler tail` cover the full
operational loop unattended; `wrangler versions upload` gives an unreleased preview URL. Fully
managed serverless (no OS, TLS, or scaling surface). Docs publish `llms.txt` at both the root and
per-product level, plus per-page `.md`. MCP servers are GA. Deploy is a single command that returns a
URL; rollback is a single command (with caveats noted below). Only platform with no Partial.

**Vercel** — Mature CLI (`vercel deploy --prod`, `vercel rollback`, `vercel redeploy`, `vercel logs`)
and `llms.txt` + per-page `.md`. Fluid Compute is GA and WebSockets are in public beta, so it would
have handled the (unused) persistent-connection case. It loses the top spot on two counts: the Vercel
MCP server is still **public beta**, and the Hobby plan is restricted to **non-commercial personal
use** — a real blocker for a product with any commercial ambition, since it would force an upgrade
mid-MVP. Vercel Postgres and Vercel KV no longer exist as first-party products (replaced by
Marketplace integrations), which doesn't matter here because Supabase is external.

**Netlify** — Free tier is hard-capped (300 credits/month, never billed, no auto-recharge), which is
attractive, and `llms.txt` plus `.md` per page passes the docs criterion. Two Partials cost it:
`netlify deploy` creates a **draft by default** and requires `--prod` to publish (a silent-failure
trap for an agent), and no `netlify rollback` CLI command could be found — rollback is documented as
a dashboard "Publish Deploy" action. That breaks the unattended-operations requirement. Netlify Blobs
is still labelled **(Beta)**.

**Railway** — Railpack auto-detects Node and the Astro SSR guide is accurate (`@astrojs/node`
standalone, `server.host = '0.0.0.0'`). Docs publish `llms.txt` and remote MCP is GA. Partial on
CLI-first and deploy API because **there is no rollback command** — rollback is a dashboard action
constrained by image retention (24h on Free/Trial, 72h on Hobby). Also requires swapping the adapter
to `@astrojs/node` and containerising, discarding the workerd-fidelity dev setup. Free plan still
exists ($0 + $1 credit/month); Hobby is $5/month including $5 usage.

**Fly.io** — Full VMs and GA WebSockets with autostop/autostart make it the most flexible option, and
`fly mcp server` is GA. Partial on rollback: there is **no rollback command**, you redeploy the prior
release's image. Also: **unmanaged Fly Postgres is archived/unmaintained** — only Managed Postgres
($38/month Basic) is supported, and Tigris/Upstash are third-party Extensions. No free tier for new
organisations. Requires the `@astrojs/node` + Dockerfile move.

**Render** — The CLI is credible (`deploys create/list`, `logs --tail`, JSON output) so "clearly
weaker" would be unfair, but rollback is Dashboard/API-only and the docs MCP is **experimental**,
making the two Partials that matter. Free web services spin down after 15 minutes idle with ~1 minute
cold starts; Free Postgres expires 30 days after creation. Requires the `@astrojs/node` move.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Won on all five criteria simultaneously and uniquely. The decisive factor is that it needs **zero
migration work**: the adapter, the wrangler config, and the workerd-fidelity dev server are already
in place, so the entire 3-week budget goes to FR-001 through FR-010 instead of a runtime port. Cost
is $0 at this scale with no commercial-use restriction. The one behaviour to internalise:
`astro dev` running on `workerd` means runtime incompatibilities surface immediately rather than at
deploy time — a net win, but it inverts the usual "it works locally" assumption.

#### 2. Vercel

Strongest fallback and the closest runner-up: mature CLI including a real `vercel rollback`, GA Fluid
Compute, and first-class docs for agents. The gap versus Cloudflare is a scoped MCP server in public
beta plus the Hobby plan's non-commercial restriction. If Cloudflare were blocked for an
organisational reason, Vercel is where to look — budget for the paid tier.

#### 3. Netlify

Chosen over Railway/Fly.io/Render for the third slot because it also needs only an adapter swap
(`@astrojs/netlify`) and has a genuinely agent-readable docs surface plus a free tier that cannot
generate a surprise bill. It ranks third rather than second because of the draft-by-default deploy
and the missing CLI rollback, both of which undermine unattended operations.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **Stale guidance on the adapter's own surface.** Adapter v14 removed Pages support, yet
   Cloudflare's Astro framework page and countless tutorials still show `platformProxy` and a
   `main` of `./dist/_worker.js/index.js`. The correct value for v14 is
   `@astrojs/cloudflare/entrypoints/server` — which `wrangler.jsonc` already has, but an agent
   copying from stale docs would break it.
2. **`astro dev` runs on real `workerd`, so dependency problems appear in development.** Workerd
   cannot execute CommonJS (`require` / `module.exports`). `@supabase/ssr` is safe (it needs only
   `fetch`, WebCrypto, and `AsyncLocalStorage`), but any Node-only package added later fails locally
   with a confusing error rather than at deploy. `node:net`, `node:tls`, `node:dns`, `node:os`, and
   `node:module` are only partially supported; `node:http2` and `node:worker_threads` are
   non-functional stubs.
3. **`wrangler rollback` is conditional.** It addresses only the ~100 most recent versions, and it is
   **refused outright if bindings changed** between the versions involved. A rollback is therefore not
   guaranteed to restore a working state after a release that added or altered a binding.
4. **Secrets are write-only.** `wrangler secret put` encrypts the value; it cannot be read back
   through Wrangler or the dashboard. An agent can set a secret but cannot verify the live value,
   which makes "is production using the right Supabase key?" unanswerable from inside a session.
5. **A pricing change lands on a setting that is already switched on.** `wrangler.jsonc` sets
   `observability.enabled: true`. Workers Logs move to Observability pricing around **2026-12-01**,
   and Durable Object SQLite storage billing started around **2026-01-07**. Neither is a large cost
   at this scale, but both are post-MVP-boundary changes to watch rather than discover.

### Pre-Mortem — How This Could Fail

Team ships SkitourSafe on Workers. Two weeks in, someone adds a PDF-export package to print a route
card; it works in a throwaway Node script, then throws in `astro dev`. The error mentions `require`
and a module that "wasn't found on the file system but is built into node" — nobody recognises it as
a workerd constraint, so they pin the package and disable the failing route. A release then adds a KV
binding, and when the next deploy regresses the recommendation filter, `wrangler rollback` is refused
because bindings changed between the two versions. Nobody can see the old value of the Supabase key
either, so the team cannot rule out an env mismatch, and `observability` startup noise plus shifted
log retention makes the failing request hard to reconstruct. Meanwhile `SUPABASE_KEY` was updated in
`.dev.vars` but not via `wrangler secret put`, so auth passes locally and fails in production. The
three weeks run out on runtime archaeology instead of on the route filter.

### Unknown Unknowns

- **`Astro.locals.runtime` no longer exists.** Env access is now
  `import { env } from "cloudflare:workers"`, request metadata is `Astro.request.cf`, and the
  execution context is `Astro.locals.cfContext`. Any snippet using `Astro.locals.runtime.env` is
  wrong for this adapter version.
- **Adapter v14 removed `platformProxy`, `cloudflareModules`, and the `workerEntryPoint` option**, and
  `wrangler.jsonc` is now optional for simple projects. The `main`, `assets`, and
  `compatibility_flags` block in this repo is already v14-correct — don't "fix" it toward older docs.
- **`compatibility_date: 2026-05-08` predates `nodejs_compat` becoming default** (2026-08-04). The
  flag is currently required and correct; a future `compatibility_date` bump would make it redundant
  but harmless.
- **Sessions auto-provision a KV namespace.** If Astro sessions are enabled, the adapter creates a
  `SESSION` KV binding on deploy. This project uses Supabase cookie sessions, so setting
  `session: false` in `astro.config.mjs` avoids an unused binding — which also keeps future
  `wrangler rollback` calls unblocked.
- **Cloudflare's Auto Minify can cause React hydration mismatches**, surfacing as
  "Hydration completed but contains mismatches". Disable Auto Minify if islands misbehave.
- **`wrangler tail` is sampled under load** and real-time logs are unavailable on the China Network,
  so tail output is diagnostic rather than authoritative for a full request census.

## Operational Story

- **Preview deploys**: Build per environment (`CLOUDFLARE_ENV=<env> astro build`) since Astro 6 —
  a single build artifact can no longer be promoted across environments with `--env`. For an
  unreleased preview URL use `npx wrangler versions upload`, which publishes a version without making
  it live; `npx wrangler deploy` promotes to production. Note the repo-specific catch: CI triggers on
  `master` while the working branch is `main`, so **no preview is built on push today** — previews
  must be run manually from the CLI until that branch mismatch is fixed.
- **Secrets**: `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_KEY` store
  encrypted, write-only values on the Worker. Local development reads `.dev.vars` (gitignored), which
  must be updated separately — this duplication is the most likely source of dev/prod drift. Anyone
  with Workers access on the Cloudflare account can overwrite them but not read them. Rotation =
  re-run `secret put` then deploy.
- **Rollback**: `npx wrangler deployments list` to read version IDs, then
  `npx wrangler rollback [VERSION_ID]`. Takes seconds. Two caveats: only the ~100 most recent versions
  are addressable, and the command is **refused if bindings changed** between the versions involved.
  Supabase schema changes do not roll back with the Worker — there are no migrations yet, but when
  they arrive, a Worker rollback and a DB rollback are separate operations.
- **Approval**: human-only actions are rotating the Supabase service key or database password,
  deleting the Worker, dropping Supabase tables, and any Cloudflare account-level change. An agent may
  run the build, `wrangler deploy`, `wrangler tail`, and read-only deployment listings unattended,
  provided its API token is scoped to Workers for this one project (no DNS, no billing, no unrelated
  Workers Secrets).
- **Logs**: `npx wrangler tail` streams live runtime logs, read-only. `observability.enabled: true` in
  `wrangler.jsonc` turns on Workers Logs for the dashboard. For structured queries prefer
  `docs.mcp.cloudflare.com/mcp` (read-only docs) over the Workers Observability MCP server, which is
  now **deprecated**.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| Stale Pages-era guidance applied to a v14 adapter (`platformProxy`, `dist/_worker.js/index.js`) | Devil's advocate | H | M | Treat `docs.astro.build/en/guides/integrations-guide/cloudflare/` as the source of truth; the local `wrangler.jsonc` is already v14-correct — do not "fix" it toward older tutorials. |
| `tech-stack.md` says `deployment_target: cloudflare-pages`, which no longer exists | Research finding | H | L | Edit the frontmatter hint to `cloudflare-workers` so future agents do not reach for `wrangler pages deploy`. |
| A later dependency uses CommonJS / unsupported Node API and fails in `workerd` | Devil's advocate | M | H | Before adding a server-side package, check it for `require` / `node:fs` / `node:net` usage; `prerenderEnvironment: 'node'` is the escape hatch for prerendered routes only. |
| `wrangler rollback` refused because bindings changed between versions | Devil's advocate | M | H | Avoid adding bindings in the same release as risky logic; keep a known-good version ID from `wrangler deployments list` before each deploy. |
| Supabase env drift between `.dev.vars` and Workers secrets | Pre-mortem | M | H | Set both in the same step; never infer that production holds the same key as local (`wrangler secret put` is write-only). |
| Secrets cannot be read back, so live values are unverifiable from a session | Devil's advocate | H | M | Keep Supabase development and production projects separate so a key mismatch is diagnosable by symptom rather than by reading the secret. |
| Astro sessions auto-provision an unused `SESSION` KV binding | Unknown unknowns | M | L | Set `session: false` in `astro.config.mjs` since authentication is cookie-based via Supabase. |
| React hydration mismatches from Cloudflare Auto Minify | Unknown unknowns | L | M | Disable Auto Minify if islands misbehave. |
| Workers Logs move to Observability pricing ~2026-12-01 with `observability.enabled: true` | Devil's advocate | M | L | Re-check pricing before the deadline; at MVP traffic the cost is negligible, and the setting can be turned off. |
| Node compat flag becomes redundant after a `compatibility_date` bump past 2026-08-04 | Unknown unknowns | L | L | Leave `nodejs_compat` in place — harmless either way. |
| CI runs on `master` while the working branch is `main`, so no preview or gate is built on push | Research finding | H | M | Either retarget `ci.yml` to `main` or accept manual CLI deploys; do not assume a push has been validated. |
| Adapter v13+ major-version churn (removed APIs) breaks future upgrade work | Unknown unknowns | M | M | Pin the adapter version; read the adapter's own upgrade guide before any major bump rather than inferring from general Cloudflare docs. |

## Getting Started

Version-checked against `@astrojs/cloudflare` v14.x and Astro 7.3.x as pinned in `package.json`.

1. **Rename the Worker.** `wrangler.jsonc` currently has `"name": "10x-astro-starter"` — change it to
   `"name": "skitoursafe"` so the deployed Worker matches the project.

2. **Authenticate.** `npx wrangler login`, or set `CLOUDFLARE_API_TOKEN` for non-interactive use.
   Scope the token to Workers for this project only — no DNS, no billing.

3. **Disable unused Astro sessions** (authentication is Supabase cookies, not Astro sessions) by
   adding `session: false` to `astro.config.mjs`. This prevents an unused `SESSION` KV namespace from
   being provisioned, which also keeps future rollbacks unblocked.

4. **Set production secrets**: `npx wrangler secret put SUPABASE_URL` and
   `npx wrangler secret put SUPABASE_KEY`, using the values from the hosted Supabase project. Keep
   `.dev.vars` in sync for local development.

5. **Deploy and verify**:
   ```bash
   npx astro build && npx wrangler deploy
   npx wrangler tail
   ```
   For a non-live preview first, use `npx wrangler versions upload` and inspect the returned URL.

Local development needs no change: `npm run dev` already runs on `workerd` via the Cloudflare Vite
plugin, so it mirrors production. Note that `npm run preview` also runs on `workerd`, which is why
the CI smoke job exercises a faithful production path.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
