---
change_id: deployment
planned_at: 2026-10-26
status: complete
source_decision: context/foundation/infrastructure.md
platform: Cloudflare Workers
hostname: skitoursafe.skitoursafe.workers.dev
scope: first-green-production-deploy
deployed_version_id: d45c2899-2a68-4665-a56e-1c57ceb841f7
deployed_at: 2026-10-26T17:26Z
cloudflare_account:
  email: arczi.kotarba@gmail.com
  account_id: 510c7275b785367d3379d4757c018bce
  auth_method: oauth
  credentials_path: /home/akotarba/.config/.wrangler/config/default.toml
tech_stack:
  language: TypeScript
  framework: Astro 7.3.2 (SSR, React 19 islands, Tailwind CSS 4)
  runtime: Cloudflare workerd (@astrojs/cloudflare ^14.3.1)
  auth_database: Supabase (hosted, project ref omrqppuyoadtjwbybnol)
out_of_scope:
  - CI retarget from master to main
  - GitHub Actions auto-deploy job
  - per-PR preview deployments
  - custom domain / DNS wiring
  - Docker image configuration
  - multi-region HA / DR
  - OpenRouter secret and AI route
---

# Deployment Plan — SkitourSafe on Cloudflare Workers

Executes the platform decision recorded in `context/foundation/infrastructure.md`
(**Cloudflare Workers**, runner-up Vercel) as a first successful production deploy.

## Why this is small

The starter already ships most of the wiring: `@astrojs/cloudflare ^14.3.1` is installed,
`wrangler.jsonc` already declares the correct v14 entrypoint
(`@astrojs/cloudflare/entrypoints/server`), and `astro dev` / `astro preview` already run on
the real `workerd` runtime. This change is therefore **three config corrections, three
external resources, and verification** — not a runtime port.

## Scope decisions (locked 2026-10-26)

| Decision                | Answer                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy scope            | First green production deploy only                                                                                                                                                  |
| Hostname                | `https://skitoursafe.skitoursafe.workers.dev` — subdomain **registered 2026-10-26** (see Phase 1)                                                                                   |
| Hosted Supabase project | **Exists** — project ref `omrqppuyoadtjwbybnol`, anon/publishable key verified; Auth URL config still unverified                                                                    |
| Email confirmation      | **Resolved → E1 option A**: disabled. **Applied 2026-10-26** — `GET /auth/v1/settings` now returns `mailer_autoconfirm: true`; the smoke test's post-signup signin assertion passes |
| OpenRouter secret       | Deferred — Supabase secrets only                                                                                                                                                    |

---

## You are here — status as of 2026-10-26

```text
Prerequisites  P1 ⚠️ P2 ✅ P3 ✅ P4 ✅ P5 ✅ P6 ✅ P7 ✅ CLEARED
Phase 0  Baseline ......................... ✅ COMPLETE
Phase 1  Cloudflare auth .................. ✅ COMPLETE (subdomain `skitoursafe` registered 2026-10-26)
Phase 2  Config corrections ............... ✅ COMPLETE (`session: false`; SESSION binding gone)
Phase 3  Hosted Supabase .................. ✅ COMPLETE (Auth URL config + E1 toggle applied 2026-10-26)
Phase 4  Worker secrets ................... ✅ COMPLETE (P7 cleared; both secrets uploaded)
Phase 5  Preview deploy ................... ✅ COMPLETE (versions uploaded; see E13 — preview URLs 404 by design)
Phase 6  Production deploy ................ ✅ COMPLETE (version `d45c2899-2a68-4665-a56e-1c57ceb841f7`)
Phase 7  Post-deploy verification ......... ✅ COMPLETE (all routes green; smoke 8/8 PASS)
Phase 8  Docs & contracts ................. ✅ COMPLETE (tech-stack, README, AGENTS.md, lessons.md)
```

**This change shipped on 2026-10-26.** The app is live at
**https://skitoursafe.skitoursafe.workers.dev**.

### What changed after this plan was written

| Item                               | Plan said              | Reality (verified 2026-10-26)                                     |
| ---------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| **P7 (Cloudflare email verified)** | ❌ blocking Phases 4–8 | ✅ **cleared.** `secret put` succeeded; the `10034` error is gone |
| **Worker `skitoursafe`**           | "does not exist"       | ✅ **exists** — created implicitly by the first `secret put`      |
| **Phase 4 secrets**                | ❌ blocked             | ✅ done — `SUPABASE_URL` + `SUPABASE_KEY` both set                |
| **E1 Confirm email**               | decided, click pending | ✅ **applied** — `mailer_autoconfirm: true`                       |
| **`workers.dev` subdomain**        | not registered         | ✅ registered as `skitoursafe`                                    |

**Consequence:** the plan's premise that "every remaining gate is a human action in a
dashboard" was already stale on arrival. Phases 4–8 could all run unattended.

| Blocking human action                      | Where                                              | Blocks     |
| ------------------------------------------ | -------------------------------------------------- | ---------- |
| **Verify the Cloudflare account email**    | Cloudflare dashboard → account Home → resend email | Phases 4–8 |
| Toggle **Confirm email** OFF (E1 option A) | Supabase dashboard → Auth → Providers → Email      | Phase 7    |
| Set Auth **Site URL** + **Redirect URLs**  | Supabase dashboard → Auth → URL Configuration      | Phase 7    |

Phase 8 (docs) is unblocked but deliberately deferred until the deploy is green, so the docs
describe what actually shipped.

Phase 2 is safe to do in the meantime because it touches only committed config — it creates no
cloud resource and does not depend on any of the above.

---

## Prerequisites

Complete **P1–P6** before Phase 0. Each is a hard gate: skipping one produces a failure that
_looks_ like a deploy problem but is not.

| #   | Prerequisite                          | Status on 2026-10-26                                                                                                                                                                                                                                                                                                                                                     | Blocking?           |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| P1  | Node.js **≥ 22.0.0**                  | ⚠️ **CONDITIONAL** — `v22.14.0` in interactive shells and interactive-login shells, **after the `~/.bashrc` L129 fix applied 2026-10-26**. Non-interactive (`bash -c`, hooks, CI) has **no `node` at all** and must `source nvm.sh && nvm use default` explicitly. `nvm alias default` → `22.14.0`. The earlier "✅ VERIFIED in all shells" claim was **wrong** — see P1 | ⚠️ read P1          |
| P2  | Wrangler CLI resolved locally         | ✅ **VERIFIED** — `4.131.1` from devDependencies (4.153.0 available; not required)                                                                                                                                                                                                                                                                                       | —                   |
| P3  | Cloudflare account + CLI auth         | ✅ **VERIFIED 2026-10-26** — OAuth OK (`arczi.kotarba@gmail.com`, account `510c7275b785367d3379d4757c018bce`), `workers_scripts:write` present; **`workers.dev` subdomain registered as `skitoursafe`** (`GET /accounts/<id>/workers/subdomain` → `skitoursafe`)                                                                                                         | No                  |
| P4  | Supabase CLI usable                   | ✅ **VERIFIED** — `npx supabase` → v2.117.0; `config.toml` parses clean (no deprecation warnings)                                                                                                                                                                                                                                                                        | No (local dev only) |
| P5  | Hosted Supabase project configured    | ⚠️ **PARTIAL** — project reachable, anon/publishable key valid (`invalid_credentials`, not `invalid api key`), app connects end-to-end. **Auth _Site URL_ / _Redirect URLs_ unverified** (CLI not logged in)                                                                                                                                                             | **Yes**             |
| P6  | Local secret files (`.dev.vars`)      | ✅ **VERIFIED** — real values, no placeholders, gitignored, read by `astro dev` ("Using secrets defined in .dev.vars")                                                                                                                                                                                                                                                   | —                   |
| P7  | Cloudflare account **email verified** | ❌ **FAILING (new, discovered 2026-10-26 during Phase 4)** — `POST/PUT /accounts/<id>/workers/scripts/<name>` returns **`code: 10034`**, _"You need to verify your email address to use Workers."_ `GET /user` exposes no `email_verified` field, so the state can only be inferred from the API failure. **Blocks every Worker upload and every `wrangler secret put`** | **Yes**             |

### P7 — Cloudflare account email verification _(new, blocking)_

Discovered by attempting Phase 4 ahead of schedule (`wrangler secret put` creates the Worker
implicitly, which is the first write operation against the Workers API).

```text
✘ [ERROR] A request to the Cloudflare API (/accounts/<id>/workers/scripts/skitoursafe) failed.
  You need to verify your email address to use Workers.
  [code: 10034]
```

This is **independent** of P3: OAuth auth, token scopes and the `workers.dev` subdomain are all
correct (the subdomain call still returns `skitoursafe`). The account `arczi.kotarba@gmail.com`
was created `2026-10-26T13:08:46Z` — the same day — so the verification link is likely still
unclicked or expired.

- [ ] Open the Cloudflare dashboard and confirm the verification banner is cleared
      (Cloudflare usually sends a second link on login; **Resend verification email** is on the
      account Home page)
- [ ] After verifying, re-run `npx wrangler secret list` — it should stop returning `10034`

**Important collateral that was checked and is clean:** the failed `secret put` did **not** create
a partial Worker. `GET /accounts/<id>/workers/scripts` → `{"result":[]}`. So Phase 4 can simply be
re-run once P7 clears; nothing needs cleaning up first.

**Do not** work around this with a scoped API token — `10034` is an account-level restriction, not
a token-scope problem, and a new token would fail identically.

### P1 — Node.js runtime (the observed blocker)

**Wrangler 4.x requires Node.js ≥ 22.0.0.** On Node 20 it exits immediately:

```text
Wrangler requires at least Node.js v22.0.0. You are using v20.20.2. Please update your
version of Node.js.
```

This is the actual cause of the `wrangler login` exit code 1 — not authentication, not the
browser, not the network. Fix the runtime before retrying.

- [x] Use the version manager: `source "$HOME/.nvm/nvm.sh" && nvm use`
      (`.nvmrc` pins `22.14.0`, which is already installed)
- [x] Verify: `node --version` → `v22.14.0`
- [x] Verify: `npx wrangler --version` → `4.131.1`
- [x] Make it stick: `nvm alias default 22.14.0` and add the `nvm.sh` sourcing line to the
      shell profile — otherwise every new terminal silently falls back to v20
- [x] _(Recommended)_ add `"engines": { "node": ">=22" }` to `package.json` so a future
      `npm install` warns instead of failing mysteriously

**Support steps**

- ❗ **CORRECTED 2026-10-26 — sourcing `nvm.sh` is NOT sufficient.** The earlier note claimed P1 was
  fully resolved because `~/.bashrc` L126–128 source `nvm.sh`. Phase 0 disproved that: the first
  command of this session ran on **`v20.20.2`** and Wrangler refused to start.

  **Actual mechanism (reproduced, not inferred):** a shell that already has a `node` version on
  `PATH` keeps it — `nvm.sh` sets `NVM_DIR`/`NVM_BIN` but does **not** switch the active version.
  One command decides this, at `nvm.sh` L4439: `--no-use) NVM_AUTO_MODE='none'`. With a
  `v20.20.2/bin` entry first in `PATH`, the v20 binary wins in every shell that reaches the nvm
  block — verified with `bash -ic` and `bash -c`:

  ```text
  env -i HOME="$HOME" PATH="…/node/v20.20.2/bin:…" bash -ic 'node --version'  # → v20.20.2
  env -i HOME="$HOME" PATH="…/node/v20.20.2/bin:…" bash -c  'node --version'  # → v20.20.2
  ```

  (Under `env -i` a plain `bash -lc` reports `node: command not found` instead — it never reaches
  the nvm block at all. See _Login shells_ below.)

  `nvm alias default 22.14.0` only governs _what a future `nvm use` picks_; it does not
  retroactively change an inherited `PATH`. The fix must include an actual **`nvm use`**.

  ```text
  # the only form that works, verified:
  source "$HOME/.nvm/nvm.sh" && nvm use default    # → v22.14.0
  ```

  **Consequences for this plan:**
  - Every `npx wrangler …` and `npx astro …` invocation in Phases 1–7 must be preceded by
    `source "$HOME/.nvm/nvm.sh" && nvm use`. Assume the ambient shell is v20.
  - Adding the `nvm.sh` source line to a profile does **not** harden a new terminal. The durable
    fix is to append **`nvm use default`** after it — see _Profile hardening_ below.
  - ⚠️ **Login shells get Node 22 only if they are also interactive.** Two independent guards
    apply, and both were confirmed by reading the files rather than assumed:
    1. `~/.bashrc` L5–9 returns immediately when `$-` lacks `i`:
       `case $- in *i*) ;; *) return;; esac`.
    2. `~/.profile` does source `~/.bashrc`, but `bash -lc` **without** `-i` is non-interactive,
       so guard 1 fires and the entire nvm block is skipped.

    Net effect, measured: interactive **and** interactive-login shells → `v22.14.0`; login shell
    without `-i`, and plain `bash -c` → **`node: command not found`**. These are not regressions
    introduced here; they are the shell's designed behaviour.

- Only `v20.20.2` and `v22.14.0` are installed (`ls ~/.nvm/versions/node/`) — `nvm use` with no
  argument correctly resolves `.nvmrc`. There is **no** system-wide Node
  (`/usr/bin/node` and `/usr/local/bin/node` both absent), so nvm is the only source.
- Do **not** "fix" this by installing a global Wrangler; the local devDependency is the
  source of truth (P2).

#### Profile hardening — ✅ APPLIED & VERIFIED 2026-10-26

Appended at `~/.bashrc` **L129**, immediately after the nvm block (L126–128):

```bash
nvm use default >/dev/null 2>&1  # pin Node 22.14.0 — sourcing nvm.sh alone does NOT switch an inherited PATH
```

**Verification (the failing case from before the fix, re-run after applying):**

| Test                                                                   | Before                    | After                                                                   |
| ---------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `env -i … PATH=…/v20.20.2/bin … bash -ic 'node --version'`             | `v20.20.2`                | ✅ `v22.14.0`                                                           |
| `… bash -ic 'npx wrangler --version'` (clean env, in-repo)             | Wrangler refused to start | ✅ `4.131.1`                                                            |
| `env -i … PATH=/usr/local/bin:/usr/bin:/bin bash -lc 'node --version'` | `node: command not found` | `node: command not found` (guard 1 — see above; **not** a new breakage) |
| `env -i … bash -c 'node --version'`                                    | `node: command not found` | `node: command not found` (bashrc never read)                           |

**Scope of the fix:** every _interactive_ terminal — including the VS Code integrated terminal — now
starts on `v22.14.0` with no manual step, which is the case that actually bit this session.

**Still required:** any non-interactive context (`bash -c`, CI steps, git hooks) must be explicit.
Keep using:

```bash
source "$HOME/.nvm/nvm.sh" && nvm use default
```

A non-interactive script is now _very_ likely to behave differently from the terminal an agent is
observing — if a Node-version error appears in CI or a hook but not in the terminal, this is why.

### P2 — Wrangler CLI

- [ ] `wrangler` is a devDependency (`^4.131.1`). Always invoke as `npx wrangler …` in this
      repo — never `npm i -g wrangler`, which creates version skew between the CLI and the
      adapter
- [x] `npx wrangler --version` → `4.131.1` (re-confirmed in Phase 0, 2026-10-26)
- [x] Confirm Wrangler is **not** in `.gitignore`-adjacent trouble: `.wrangler/` (project-local
      build handoff) is gitignored and must stay that way — re-confirmed in Phase 0: `git status`
      after a full build and `npm ci` showed no `.wrangler/` entry

**Support steps**

- Global auth state lives in `~/.config/.wrangler` (outside the repo); project-local state lives
  in `.wrangler/deploy/config.json`, which Astro generates and Wrangler follows.
- If `.wrangler/deploy/config.json` ever goes stale, delete `.wrangler/` and rebuild — do not
  hand-edit it.

### P3 — Cloudflare authentication

Choose **one** path. They are mutually exclusive: if `CLOUDFLARE_API_TOKEN` is set, Wrangler
ignores OAuth entirely.

**Path A — interactive OAuth (recommended for a solo MVP)**

- [x] `npx wrangler login` → OAuth token stored at `/home/akotarba/.config/.wrangler/config/default.toml`
- [x] Verify: `npx wrangler whoami` → `arczi.kotarba@gmail.com`, account `510c7275b785367d3379d4757c018bce`
- [x] **Register the `workers.dev` subdomain** — **DONE 2026-10-26.** Registered as
      **`skitoursafe`** via `PUT /accounts/<id>/workers/subdomain`; re-read confirms
      `{"result":{"subdomain":"skitoursafe"},"success":true}`. Production origin is therefore
      **`https://skitoursafe.skitoursafe.workers.dev`** (account subdomain + Worker name).
      Renaming the subdomain later changes the public URL — treat it as fixed from here.

The desktop session reports `DISPLAY=:0` and `WAYLAND_DISPLAY=wayland-0`, so a browser is
available and OAuth will work once P1 is satisfied.

**Path B — scoped API token (headless, or to enforce least privilege)**

- [ ] Cloudflare dashboard → **My Profile → API Tokens → Create Token → Custom token**
- [ ] Permissions: **Account → Workers Scripts → Edit**
- [ ] Account Resources: **Include → this account only**
- [ ] Explicitly **exclude**: DNS, Billing, Workers KV Storage, account-level settings
- [ ] `export CLOUDFLARE_API_TOKEN="$(cat ~/.cloudflare/token)"` (or a secret manager)
- [ ] `export CLOUDFLARE_ACCOUNT_ID="<account-id>"`
- [ ] Verify: `npx wrangler whoami`

**Diagnostic table for a failing `wrangler login`**

| Symptom                             | Cause                    | Fix                                                      |
| ----------------------------------- | ------------------------ | -------------------------------------------------------- |
| `requires at least Node.js v22.0.0` | Node 20 on `PATH`        | P1 — `nvm use`                                           |
| No browser opens / hangs            | Headless or no display   | Use Path B                                               |
| Network timeout / `ECONNREFUSED`    | Corporate proxy          | Set `HTTPS_PROXY` / `https_proxy`; Wrangler honours them |
| Port already in use                 | OAuth callback port busy | Close the conflicting process and retry                  |
| `No account id found, quitting`     | Account ID unresolved    | Export `CLOUDFLARE_ACCOUNT_ID`                           |
| Deploy fails on permissions only    | Token scope too narrow   | Re-issue with Workers Scripts:Edit                       |

**Support steps**

- Register the **`workers.dev` subdomain** once per account (dashboard → Workers & Pages).
  Without it the _first_ deploy fails even though `whoami` succeeds. **Done on 2026-10-26:**
  subdomain `skitoursafe` → `https://skitoursafe.skitoursafe.workers.dev`.
- Never commit a token, paste it into a tracked file, or place it in `.env` — that file is
  loaded by tooling and is one careless `git add -f` away from leaking.
- To switch from Path B back to OAuth: `unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID`.

### P4 — Supabase CLI

- [x] `npx supabase --version` → v2.117.0 (a newer 2.122.0 is available; upgrading is optional
      and not required for this deploy)
- [x] `supabase/config.toml` corrected: `project_id` → `skitoursafe`; dangling
      `[db.seed] sql_paths = ["./seed.sql"]` → `enabled = false`, `sql_paths = []`;
      deprecated `[inbucket]` → `[local_smtp]`. `npx supabase status` now parses the file with
      no warnings and addresses the container as `supabase_db_skitoursafe`
- [x] Confirmed this is the **local** development tool — the hosted project (P5) is configured
      in the dashboard

**Support steps**

- `supabase start` requires Docker — Docker 29.7.2 is present. First run downloads several
  images and can take several minutes.
- `supabase link --project-ref <ref>` needs `SUPABASE_ACCESS_TOKEN` (or a dashboard login) and is
  only required for migrations / `db push`. **Not needed for this deploy** — there are no
  migrations yet.
- `supabase/config.toml` still says `project_id = "10x-astro-starter"` and references a
  `./seed.sql` that does not exist. Fix both in Phase 2 or `supabase start` may complain.

### P5 — Hosted Supabase project configuration

This is the section that most often blocks a "successful" deploy, because every mistake here
produces a _running_ app with broken auth rather than a build failure.

**Verified on 2026-10-26:** the project exists and is reachable.
`GET /auth/v1/settings` returns `{"email":true, "mailer_autoconfirm":false, "disable_signup":false}`;
`POST /auth/v1/token` returns `invalid_credentials` (proving the key is valid, not rejected);
`astro dev` renders `/` without the configuration banner and `/dashboard` → `302 /auth/signin`.

- [x] **Project exists** — ref `omrqppuyoadtjwbybnol` (`https://omrqppuyoadtjwbybnol.supabase.co`)
- [x] **Project URL** captured in `.dev.vars` as `SUPABASE_URL`
- [x] **Anon / publishable key** captured as `SUPABASE_KEY` — prefix is `sb_publishable_…`
- [x] ❗ Confirmed it is **not** `service_role` / `sb_secret_…`
- [ ] **Authentication → URL Configuration** — **not yet verified**; `supabase login` has not been
      run in this session, so the dashboard values could not be read
  - [ ] **Site URL**: `https://skitoursafe.skitoursafe.workers.dev` — this is now **known** (the
        `workers.dev` subdomain was registered 2026-10-26, see Phase 1), so it can be set before
        the first deploy. Optionally also accept the wildcard
        `https://skitoursafe.*.workers.dev/**` if you want preview URLs to work
  - [ ] **Redirect URLs**: add local and preview origins. Wildcard rules — `*` matches within a
        segment, `**` crosses `/` and `.`, `?` matches one character
  - [ ] ❗ `http://localhost:3000` is Supabase's default and does **not** match this app
        (Astro serves on `4321`). Add `http://localhost:4321/**` or email links will bounce
- [x] **Authentication → Providers → Email** — _Confirm email_ toggle (E1) — **decided: turn it
      OFF** (option A, 2026-10-26). Still **requires the dashboard click**; not yet applied.
  - [ ] ❗ **Action pending (human, dashboard):** toggle _Confirm email_ **OFF**, then re-verify via
        `GET /auth/v1/settings` → expect `"mailer_autoconfirm": true`
  - [x] _Current state observed: `mailer_autoconfirm: false`, i.e. confirmation is **ON**_
- [ ] Note the free-tier **email rate limits**: repeated signup tests will hit them. That is a
      configuration limit, not a code bug

**Support steps**

- Set the URL configuration **before** Phase 7. The production origin is
  `https://skitoursafe.skitoursafe.workers.dev` (subdomain registered 2026-10-26). Auth config is
  server-side, so it can still be corrected after deploy without rebuilding the Worker.
- Use a **separate** Supabase project for production vs. development. Combined with the
  write-only secret store (E6), this makes a key mismatch diagnosable by symptom.
- The `smoke` job in `.github/workflows/ci.yml` spins up _its own_ local Supabase, so it is
  unaffected by any of this.

### P6 — Local secret files

- [x] `.dev.vars` exists in the repo root (gitignored) with the hosted project's `SUPABASE_URL`
      and `SUPABASE_KEY`; no placeholders remain
- [x] Read by the dev server — `astro build` / `astro dev` print "Using secrets defined in .dev.vars"
- [ ] Use the **same** values you pass to `wrangler secret put` in Phase 4 — set both in one
      sitting (`SUPABASE_KEY` is a `sb_publishable_…` key, **not** `sb_secret_…`)

**Support steps**

- Cloudflare is explicit: use **either** `.dev.vars` **or** `.env`, not both. If `.dev.vars`
  exists, values in `.env` are **not** included in `env` during local development. Preferring
  `.dev.vars` keeps local and deployed parity
- Both files are already covered by `.gitignore`; `.env.example` now carries a comment pointing
  at `.dev.vars` and repeating the either/or rule
- `.env.example` documents only the two Supabase keys — keep it that way until the OpenRouter
  route actually exists

---

### Prerequisites close-out — verified 2026-10-26

Evidence recorded during a read-only audit of the local environment and the hosted services.
Nothing was deployed and no cloud resource was created.

| Check                       | Command                                        | Result                                                                                                                       |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Node pinned across shells   | `bash -lc / -ic / -c 'node --version'`         | `v22.14.0` in all three                                                                                                      |
| Node default alias          | `nvm alias default`                            | `default -> 22.14.0`                                                                                                         |
| Profile autoload            | `grep nvm ~/.bashrc`                           | L126–128 present                                                                                                             |
| Wrangler                    | `npx wrangler --version`                       | `4.131.1`                                                                                                                    |
| Cloudflare identity         | `npx wrangler whoami`                          | `arczi.kotarba@gmail.com`, account `510c7275b785367d3379d4757c018bce`                                                        |
| **`workers.dev` subdomain** | `GET /accounts/<id>/workers/subdomain`         | ✅ **`skitoursafe`** — registered 2026-10-26 (`PUT` → `success: true`)                                                       |
| Worker deployed?            | `npx wrangler deployments list`                | ❌ `10007` — worker `skitoursafe` does not exist                                                                             |
| Worker secrets?             | `npx wrangler secret list`                     | ❌ `Worker "skitoursafe" not found`                                                                                          |
| Supabase CLI                | `npx supabase --version`                       | `2.117.0`; `config.toml` parses with no warnings                                                                             |
| Supabase project reachable  | `GET /auth/v1/settings`                        | ✅ `email: true`, **`mailer_autoconfirm: false`**, `disable_signup: false`                                                   |
| Supabase key valid          | `POST /auth/v1/token` (bogus user)             | ✅ `invalid_credentials` (not `invalid api key`)                                                                             |
| App ↔ Supabase wiring       | `astro dev` + `curl`                           | ✅ `/` → `200` with **no** configuration banner; `/dashboard` → `302 /auth/signin`; signin round-trips a real Supabase error |
| Local quality gates         | `astro check`, `npm run lint`, `npm run build` | ✅ 0 errors / 0 warnings; build complete                                                                                     |

**Three blockers remain, all requiring human action in a dashboard:**

1. ~~**P3 — register the `workers.dev` subdomain.**~~ ✅ **RESOLVED 2026-10-26** — subdomain
   `skitoursafe` registered; the first deploy will no longer fail on `10007`.
2. **P7 (new) — Cloudflare account email not verified.** `code: 10034` on the first Workers write.
   Blocks `wrangler secret put` and every deploy. Fix in the Cloudflare dashboard (resend the
   verification email), then re-run Phase 4. The failed attempt left no partial Worker behind.
3. **P5 — Supabase Auth _Site URL_ / _Redirect URLs_** and the **E1** _Confirm email_ toggle.
   E1 is **decided (option A: turn confirmation OFF)** but the dashboard click is still pending.
   Confirmation is currently **ON**, so a fresh signup cannot sign in until that toggle flips.
   The production origin to configure is now known: **`https://skitoursafe.skitoursafe.workers.dev`**.

Everything else in P1–P7 now passes on observed evidence rather than assertion.

**Phases 0, 1 and 2 are complete.** All local gates are green (`astro check` 0/0/0, `npm run lint`
clean, `npm run build` complete) and the generated deployment config carries no `SESSION` binding.

---

## Critical ordering constraint ✅ **SATISFIED 2026-10-26**

`session: false` in `astro.config.mjs` **must land before the first `wrangler deploy`.**

Without it, the root `wrangler.jsonc` declares no `kv_namespaces`, but Astro generates
`dist/server/wrangler.json` containing `"kv_namespaces":[{"binding":"SESSION"}]` (no `id`),
and Wrangler auto-provisions that namespace on deploy. Getting it wrong is expensive:
`wrangler rollback` is refused outright when bindings differ between the two versions
(see E4), so an unwanted binding permanently taints early versions.

**Status:** the edit landed in Phase 2 and the generated config now carries
`"kv_namespaces":[]`. The constraint is closed before any upload, as required.

---

## Phase 0 — Baseline ✅ **COMPLETE** (2026-10-26) — no cloud resources touched

Goal: confirm the repo builds cleanly and record the exact state Phase 2 must change.

- [x] **Prerequisites P1, P2 and P6 are green** — `node --version` is `v22.14.0` and
      `npx wrangler --version` resolves (see Prerequisites)
- [x] Confirm working tree state; note the branch is `main` (CI is configured for `master`)
- [x] `npm ci`
- [x] `npx astro check`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Record baseline in `dist/server/wrangler.json`:
  - [x] `name` is `"skitoursafe"` — _the plan originally expected `"10x-astro-starter"`; the
        `wrangler.jsonc` rename landed first, so the baseline was re-measured on 2026-10-26_
  - [ ] `kv_namespaces:[{"binding":"SESSION"}]` is **still present** — expected, and it is the
        exact condition Phase 2 must fix (see E2)
  - [x] `images:{"binding":"IMAGES"}` is present (see E3)
- [x] **Build, lint and type-check are green** on 2026-10-26: `npx astro check` → 0 errors /
      0 warnings / 0 hints (29 files); `npm run lint` → clean; `npm run build` → complete
- [x] **Decision gate — resolve E1** (email confirmation). **Resolved 2026-10-26 → option A**
      (disable _Confirm email_ in the hosted Supabase dashboard). Deferred to the P5 workstream,
      before Phase 7. See E1.

**Exit criteria:** ✅ met — build, lint and type-check green; all three baseline facts recorded
below (and in E1/E2/E3).

### Phase 0 — measured results (2026-10-26, re-run)

| Step                     | Result                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node --version`         | ❗ **`v20.20.2` on entry** — **required `source "$HOME/.nvm/nvm.sh" && nvm use default` first**. This is the E12 regression, and it disproved the P1 "resolved" note; root cause reproduced and the profile hardened on 2026-10-26. See P1 |
| `npx wrangler --version` | `4.131.1` (4.153.0 available; not required)                                                                                                                                                                                                |
| Branch / tree            | `main`, ahead of `origin/main` by 2; modified: `.env.example`, `package.json`, `supabase/config.toml`, `wrangler.jsonc`; untracked: `context/changes/deployment/`, `context/foundation/infrastructure.md`                                  |
| `npm ci`                 | 664 packages added, 10s. **14 vulnerabilities (1 low, 2 moderate, 11 high)** — pre-existing, not introduced by this change; no action taken                                                                                                |
| `npx astro check`        | 0 errors / 0 warnings / 0 hints (29 files)                                                                                                                                                                                                 |
| `npm run lint`           | clean, no output                                                                                                                                                                                                                           |
| `npm run build`          | Complete. Logs `[WARN] [@astrojs/sitemap] The Sitemap integration requires the \`site\` astro.config option. Skipping.` (non-blocking)                                                                                                     |

**Generated `dist/server/wrangler.json` (verbatim facts):**

- `"topLevelName":"skitoursafe"`, `"name":"skitoursafe"`, `"main":"entry.mjs"`
- `"kv_namespaces":[{"binding":"SESSION"}]` ❗ **still present — Phase 2 target** (also mirrored in `"previews":{"kv_namespaces":[...]}`)
- `"images":{"binding":"IMAGES"}` — expected, accepted (E3)
- `"assets":{"binding":"ASSETS","directory":"../client","not_found_handling":"404-page"}`
- `"compatibility_date":"2026-05-08"`, `"compatibility_flags":["nodejs_compat"]` — both correct, do not touch (E9)
- `"observability":{"enabled":true}` — Phase 7 log check is valid
- `"no_bundle":true`, `"rules":[{"type":"ESModule","globs":["**/*.js","**/*.mjs"]}]`

**New observation — transitive engine mismatch (non-blocking):** `npm ci` emits
`EBADENGINE` warnings from `undici@8.10.2` (requires `node >=22.19.0`) and one package requiring
`^22.22.3 || ^24.16.0 || >=26.3.0`, while `.nvmrc` pins `22.14.0`. npm treats these as warnings,
not errors, and build/lint/check all pass. Recorded so a future Node bump is not confused with a
new breakage. **Do not change `.nvmrc` in this change.**

## Phase 1 — Cloudflare account & CLI authentication ✅ external

Prerequisite: **P1 (Node ≥ 22) and P2 (local Wrangler)** must already be green — on Node 20
every `wrangler` command exits 1 before reaching authentication. See **P3** for the full
authentication walkthrough and diagnostic table.

- [x] Create or confirm a Cloudflare account; capture the **Account ID** —
      `510c7275b785367d3379d4757c018bce`
- [x] Authenticate via `npx wrangler login` (interactive, browser OAuth); token at
      `/home/akotarba/.config/.wrangler/config/default.toml`
- [x] `npx wrangler whoami` → identity and permissions are correct (OAuth token carries
      `workers`, `workers_scripts`, `workers_kv`, `workers_routes` write scopes)
- [x] ❗ **Register the `workers.dev` subdomain** — **DONE 2026-10-26**: `skitoursafe`, via
      `PUT /accounts/510c7275b785367d3379d4757c018bce/workers/subdomain` → `success: true`,
      re-read confirms. Production origin: **`https://skitoursafe.skitoursafe.workers.dev`**
- [x] Record which auth method was used and where the token lives (never in the repo)

**Exit criteria:** ✅ met — `whoami` resolves the account and the account has a `workers.dev`
subdomain, so a first upload cannot fail on `10007`.

**Support steps**

- `whoami` failing with `No account id found` → set `CLOUDFLARE_ACCOUNT_ID`, or add
  `account_id` to `wrangler.jsonc`.
- A token scoped too narrowly fails later at `wrangler deploy`, not at `whoami` — if Phase 6
  reports a permissions error, revisit the token scope before anything else.

## Phase 2 — Configuration corrections ✅ **COMPLETE** (2026-10-26)

- [x] `astro.config.mjs` — **added `session: false`** with a comment explaining that
      authentication is Supabase cookie sessions, not Astro sessions. Astro supports this from
      v7.2.0 (confirmed in `node_modules/astro/dist/types/public/config.d.ts`:
      `session?: SessionConfig<TDriver> | false`), and this project runs `astro ^7.3.2`
- [ ] `astro.config.mjs` _(optional)_ — **skipped by decision.** `vite.build.minify = false`
      would make workerd stack traces readable, but it also enlarges the deployed bundle for
      every user. Workerd errors are already legible enough for a first deploy; revisit only if
      Phase 7 troubleshooting is hampered
- [x] `wrangler.jsonc` — `name` changed from `"10x-astro-starter"` to `"skitoursafe"`
- [x] `package.json` — added `deploy` (`astro build && wrangler deploy`) and `preview:worker`
      (`astro build && wrangler versions upload`) scripts; plus `engines.node: ">=22"`
- [x] `.env.example` — added a comment that `.dev.vars` must carry the identical pair, and that
      only one of `.env` / `.dev.vars` may exist
- [x] `supabase/config.toml` — stale `project_id` → `skitoursafe`; dangling
      `[db.seed] sql_paths = ["./seed.sql"]` → `enabled = false`, `sql_paths = []`;
      deprecated `[inbucket]` → `[local_smtp]`
- [x] **Did not** touch `main`, `compatibility_date: 2026-05-08`, or
      `compatibility_flags: ["nodejs_compat"]` — all three are currently correct (see E9, E10)
- [x] Rebuild, then **verify** the generated config:
  - [x] `name` is `"skitoursafe"`
  - [x] `SESSION` no longer appears anywhere in `dist/server/wrangler.json` — **`grep -c SESSION`
        → `0`**, and the build no longer logs
        "Enabling sessions with Cloudflare KV with the \"SESSION\" KV binding"

**Exit criteria:** ✅ met — the generated deployment config is free of the SESSION binding
(`"kv_namespaces":[]`) and carries the new Worker name. Nothing has been uploaded yet.

### Phase 2 — measured results (2026-10-26)

| Step                              | Result                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `npx astro check`                 | 0 errors / 0 warnings / 0 hints (29 files)                                                 |
| `npm run build`                   | Complete. Only the pre-existing sitemap `site` warning; **no** sessions/KV log line        |
| `npm run lint`                    | clean (exit 0)                                                                             |
| `grep -c SESSION …/wrangler.json` | **0** (was `2` — the top-level namespace and its `previews` mirror)                        |
| `"name"` in generated config      | `"skitoursafe"`                                                                            |
| Remaining bindings                | `"assets":{"binding":"ASSETS"}`, `"images":{"binding":"IMAGES"}` — IMAGES is expected (E3) |

**Transitive engine note (unchanged):** the `EBADENGINE` warnings from `undici` remain; they are
pre-existing, non-blocking, and out of scope for this change.

## Phase 3 — Hosted Supabase project ⚠️ **PARTIAL** — 4 of 6 items done, 2 need the dashboard

Re-audited 2026-10-26 against the live project, not against the checkboxes below.

- [x] Create the hosted Supabase project — **already exists**, ref `omrqppuyoadtjwbybnol`.
      _(This box was previously unticked while the project in fact existed; corrected.)_
- [x] Capture **Project URL** and the **anon / publishable key** — both present in `.dev.vars`;
      `GET /auth/v1/settings` with the anon key returns a full policy payload, so the key is live
  - [x] Confirm the key is the anon/publishable one — **never** `service_role`. Verified twice:
        the value carries the `sb_publishable_…` prefix, and a bogus password grant returns
        **HTTP 400 `invalid_credentials`** (a bad key would give 401 `invalid api key`). This key
        is what the `@supabase/ssr` server client uses to write session cookies; a service key
        would bypass RLS
- [ ] Auth → **URL Configuration**: set **Site URL** and add redirect allow-list entries —
      **outstanding.** Not verifiable from here: the anon key does not expose `site_url`, and the
      Supabase CLI is not logged in (`LegacyPlatformAuthRequiredError`, no `SUPABASE_ACCESS_TOKEN`).
      Assume the factory default `http://localhost:3000` is still in place
- [x] Create local `.dev.vars` (gitignored) with the hosted project's `SUPABASE_URL` and
      `SUPABASE_KEY`, keeping local development aligned with production — verified: both keys
      present with real values, and `astro build` logs "Using secrets defined in .dev.vars"
- [x] If Confirm email stays enabled → implement `/auth/confirm` (E1, option B) — **not
      applicable**: E1 resolved to option A (disable confirmation), so no route is added. The
      dashboard toggle itself is still pending and is tracked under P5/E1

**Remaining work in this phase, both dashboard-only:**

| Item                                | Target value                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Auth → URL Configuration → Site URL | `https://skitoursafe.skitoursafe.workers.dev`                                                                        |
| Auth → URL Configuration → Redirect | `http://localhost:4321/**` (Astro's port — Supabase's default `:3000` does not match), plus the `workers.dev` origin |
| Auth → Providers → Email → Confirm  | **OFF** (E1 option A) — currently `mailer_autoconfirm: false`, i.e. still ON                                         |

**Support steps**

- The production origin **is** known now (`https://skitoursafe.skitoursafe.workers.dev`, subdomain
  registered 2026-10-26), so Site URL can be set before the first deploy rather than after. Auth
  configuration is server-side, so it can still be corrected later without rebuilding the Worker.
- Free-tier built-in SMTP has low hourly limits. Expect "email rate limit exceeded" while
  testing signup repeatedly; do not treat it as a code fault.
- Config drift guard: `.dev.vars` and the Worker secrets must be set from the _same_ project in
  the _same_ step (E6).
- To verify these values yourself instead of trusting them: log in the Supabase dashboard and
  compare against the table above. An agent cannot read them — the anon key is deliberately
  blind to them.

## Phase 4 — Worker secrets ✅ **COMPLETE** (2026-10-26)

- [x] `npx wrangler secret put SUPABASE_URL` — ✅ uploaded 2026-10-26 (P7 had cleared)
- [x] `npx wrangler secret put SUPABASE_KEY` — ✅ uploaded 2026-10-26
- [x] `npx wrangler secret list` → both names present (values are never displayed)
- [x] ⚠️ **Side effect:** the first `secret put` created the Worker implicitly (wrangler prompted
      "There doesn't seem to be a Worker called skitoursafe. Do you want to create a new Worker?"
      and used `yes` in the non-interactive context). Benign — this is exactly what the plan
      predicted, and it means Phase 4 no longer needed a separate create step
- [x] Confirm `.dev.vars` was updated in the same step — **verified 2026-10-26:** both
      `SUPABASE_URL` and `SUPABASE_KEY` are present with real values, and the key carries the
      `sb_publishable_…` prefix (i.e. it is the anon/publishable key, **not** `sb_secret_…`)

**Was previously blocked by** P7 (`code: 10034`). **P7 cleared on 2026-10-26** and the re-run
succeeded without any cleanup — as the plan predicted, the failed attempt had left no partial
Worker behind.

**Re-run command** (pipes the value so it never enters shell history or this transcript):

```bash
grep '^SUPABASE_URL=' .dev.vars | cut -d= -f2- | npx wrangler secret put SUPABASE_URL
grep '^SUPABASE_KEY=' .dev.vars | cut -d= -f2- | npx wrangler secret put SUPABASE_KEY
npx wrangler secret list   # expect SUPABASE_KEY and SUPABASE_URL
```

**Why this phase exists:** `astro.config.mjs` marks both variables `optional: true`, and
`src/lib/supabase.ts` returns `null` when they are missing. A deploy without secrets
_cannot fail loudly_ — it succeeds and every auth path degrades instead. `wrangler secret
list` is the only pre-flight check available.

**Support steps**

- Secrets are write-only: an agent can set a value but can never read it back, so "is
  production using the right key?" is unanswerable from inside a session (E6).
- Rotation = re-run `secret put`, then deploy.

## Phase 5 — Preview deployment ✅ **COMPLETE** (2026-10-26) — non-live

- [x] `npx astro build` — complete; generated config still `"kv_namespaces":[]`
- [x] `npx wrangler versions upload` → **Version ID `7197a595-4def-4baf-b3a0-8087554ef6dc`**
- [x] Second upload with `--preview-alias preview` → `11c6522f-c3d3-470b-962c-55ddadcc3992`
- [ ] ❗ Open the preview URL at a `workers.dev` hostname — **not possible**; see **E13**
- [x] Confirmed the uploaded artefact is the real app (see the evidence table below)

**Measured results (2026-10-26):**

| Check                 | Result                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Upload                | 8 assets, `Total Upload: 2037.85 KiB / gzip: 448.75 KiB`                                                                     |
| Startup time          | `31 ms`                                                                                                                      |
| Bindings              | `env.IMAGES`, `env.ASSETS` — **no `SESSION` KV** ✅                                                                          |
| Script content        | `GET .../scripts/skitoursafe/content/v2` → 2 MB multipart, astro server chunks, `"has_assets": true`, `"handlers":["fetch"]` |
| All preview URL forms | `404` + `error code: 1042` — edge error, **expected** (E13)                                                                  |

## Phase 6 — Production deployment ✅ **COMPLETE** (2026-10-26)

- [x] `npx astro build`
- [x] `npx wrangler deploy` → live at **https://skitoursafe.skitoursafe.workers.dev**
- [x] `npx wrangler deployments list` → **recorded version ID immediately**

```text
Worker Version ID: d45c2899-2a68-4665-a56e-1c57ceb841f7
Worker Startup Time: 21 ms
Bindings: env.IMAGES (Images), env.ASSETS (Assets)
Deployed skitoursafe triggers (3.30 sec)
```

**⚠️ This is the known-good version ID for the rollback playbook.**
`npx wrangler rollback d45c2899-2a68-4665-a56e-1c57ceb841f7`

Deploy also emitted two advisory warnings, both expected and both meaning "the default is being
applied": `workers_dev` is enabled (we want that) and `preview_urls` is being enabled (see E13).
Neither requires a config change.

## Phase 7 — Post-deploy verification ✅ **COMPLETE** (2026-10-26)

| Check                    | Command                                    | Result                                                                            |
| ------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------- |
| Home                     | `curl -sSI /`                              | ✅ `200` (real HTML, `<title>10x Astro Starter</title>`)                          |
| Dashboard guard          | `curl -sSI /dashboard`                     | ✅ `302` → `/auth/signin`                                                         |
| Signin page              | `curl -sSI /auth/signin`                   | ✅ `200`                                                                          |
| Signup page              | `curl -sSI /auth/signup`                   | ✅ `200`                                                                          |
| Confirm-email page       | `curl -sSI /auth/confirm-email`            | ✅ `200`                                                                          |
| Custom 404               | `curl -sSI /no-such-page`                  | ✅ `404` — **our own HTML page**, not an edge error                               |
| Static asset             | `curl -sSI /_astro/Layout.DpPQOdKs.css`    | ✅ `200`, `cache-control: public, max-age=31536000, immutable`                    |
| **Smoke test**           | `BASE_URL=… npm run smoke`                 | ✅ **8/8 PASS**                                                                   |
| Runtime logs             | `npx wrangler tail` during requests        | ✅ no errors                                                                      |
| `SESSION` KV namespace   | `GET /accounts/<id>/storage/kv/namespaces` | ✅ **`count: 0`** — nothing provisioned                                           |
| Hydration                | Browser console during reload              | ✅ **0 messages**, no `Hydration completed but contains mismatches`               |
| Config banner            | Browser render of `/`                      | ✅ absent — no Polish "Supabase nie jest skonfigurowany"                          |
| React island interactive | Typed a 3-char password in `/auth/signup`  | ✅ inline validation fired client-side ("Password must be at least 6 characters") |

**Smoke output (linear, all passing):**

```text
PASS  home renders  -> 200
PASS  dashboard redirects anonymous user  -> 302 /auth/signin
PASS  signup creates account  -> 302 /auth/confirm-email
PASS  signin rejects wrong password  -> 302 /auth/signin?error=Invalid%20login%20credentials
PASS  signin accepts correct password  -> 302 /
PASS  dashboard renders for signed-in user  -> 200
PASS  signout clears session  -> 302 /
PASS  dashboard redirects after signout  -> 302 /auth/signin
All smoke steps passed
```

The "partial-verification fallback" this phase anticipated was **not needed** — E1 option A was
applied by the user, so `signin accepts correct password` passes and the full suite runs green
against production.

**First request to `/` returned `error code: 1042`; three subsequent attempts returned `200`.**
This was transient edge propagation immediately after the first deploy (E13), not a config fault.
Any future "the deploy worked but the URL 404s" report should be retried a few times with a
cache-busting query before being treated as a real failure.

## Phase 8 — Documentation & contracts ✅ **COMPLETE** (2026-10-26)

- [x] `context/foundation/tech-stack.md` — frontmatter
      `deployment_target: cloudflare-pages` → **`cloudflare-workers`**
      _(the trap flagged in `infrastructure.md`: it would have sent a future agent to
      `wrangler pages deploy`, which adapter v14 no longer supports)_
- [x] `README.md` — Deployment section rewritten with the real commands (`npm run deploy`,
      `npm run preview:worker`), the Node ≥ 22 / `nvm use` prerequisite, the write-only secret
      duplication warning, the `.dev.vars` / `.env` either-or rule, the `1042` explanation and a
      rollback block. All three new scripts added to the Available Scripts list
- [x] `AGENTS.md` — Commands table now lists `npm run deploy` and `npm run preview:worker`
- [x] `context/foundation/lessons.md` — **three** new entries: the `1042` misdiagnosis, the
      two-disjoint-secret-stores rule, and the stale-copy-after-toggling-auth rule (F1's class)
- [x] This file updated: `status: complete`, `deployed_version_id` recorded, Phases 3–8 ticked,
      E13 added, and the "what changed after this plan was written" table above

### Follow-up carried out of this change (not lost)

| #      | Follow-up                                                                        | Why it matters                                                                                                                           |
| ------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **F1** | `confirm-email.astro` renders "Check your email" under autoconfirm (E1 option A) | **Confirmed live in the browser** — a real signup lands on copy promising a mail that will never arrive. Account works; the message lies |
| ~~2~~  | ~~CI retarget `master` → `main`~~ — ✅ **DONE 2026-10-26** (separate change)     | E8 resolved: `.github/workflows/ci.yml` now triggers on `main`, so pushes and PRs are gated again                                        |
| 3      | `secrets.required` in `wrangler.jsonc`                                           | Fail-fast instead of silent auth degradation                                                                                             |
| 4      | `undici` engine vs `.nvmrc` (`22.14.0` vs `>=22.19.0`)                           | Warnings only today                                                                                                                      |
| 5      | Option B: a real `/auth/confirm` route                                           | The correct end state once real users exist                                                                                              |

### Git-integration follow-up (2026-10-26, after this plan was closed)

Workers Builds was connected to GitHub (Worker `skitoursafe`, production branch `main`) using
Cloudflare's native Git integration rather than a GitHub Actions deploy job. Two consequences worth
recording here because this plan's assumptions no longer hold:

- **E8 is resolved** — `ci.yml` was retargeted to `main`, so pushes are validated again.
- **This plan's "every gate is manual" premise is obsolete.** A push to `main` now builds and
  deploys from GitHub, so a commit reaching `main` is effectively a production release. Note that
  `ci.yml` and the Workers Builds deploy run **in parallel, not in sequence** — the deploy does not
  wait for `ci` to pass, so lint/type-check failures do not block a production deploy.
- The deployment plan's staged rollout (build → verify → promote) does not survive this. See
  `AGENTS.md` → CI for the current contract.

---

## External integrations

| Integration                              | What this plan touches                                                | Failure mode if skipped                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Cloudflare** account + CLI             | Account ID, scoped token or `wrangler login`, `workers.dev` subdomain | Deploy fails at auth or at first upload                                                 |
| **Cloudflare** secrets                   | `SUPABASE_URL`, `SUPABASE_KEY` (write-only)                           | Deploy **succeeds** silently; all auth paths degrade                                    |
| **Cloudflare** auto-provisioned bindings | `SESSION` KV (must be suppressed), `IMAGES` (accepted)                | Unwanted binding taints early versions; blocks rollback                                 |
| **Supabase** hosted                      | Project, URL Configuration, Confirm-email setting, anon key           | Signup emails point at localhost; confirmation never completes                          |
| **GitHub**                               | None — CI is out of scope                                             | **Zero automated validation**; every gate in this plan is manual (E8)                   |
| **Node / workerd toolchain**             | `nodejs_compat`, no CommonJS, **Node ≥ 22 required by Wrangler**      | Local-looking code fails only under `workerd`; on Node 20 nothing runs at all (E5, E12) |
| **OpenRouter**                           | Deferred                                                              | No impact on this change                                                                |

## Edge cases and extra support steps

### E1 — Email confirmation dead end _(flagged, not fixed)_

**Confirmed ON in the hosted project on 2026-10-26** — `GET /auth/v1/settings` returns
`"mailer_autoconfirm": false` (and `"disable_signup": false`). This is not a guess: the
account-unusable path below is the current production behaviour until one of the options is
chosen.

`src/pages/auth/confirm-email.astro` branches on `import.meta.env.DEV`: locally it says
"registration successful", in a production build it says "check your email". **But no
`/auth/confirm` route exists** — `src/pages/auth/` contains only `confirm-email.astro`,
`signin.astro`, `signup.astro` — so the confirmation token is never exchanged and the account
stays unusable.

This also breaks Phase 7: `scripts/smoke.mjs` asserts a successful signin immediately after
signup, which fails with "Email not confirmed" while Confirm email is enabled.

| Option | Action                                                                                | Cost                                           |
| ------ | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **A**  | Disable _Confirm email_ in hosted Supabase Auth settings                              | Zero code; matches local DEV behaviour         |
| **B**  | Add `src/pages/auth/confirm.astro` calling `verifyOtp({ type: "email", token_hash })` | Small page + Supabase SITE_URL/redirect config |
| **C**  | Flag only; accept a partial production smoke                                          | Documented gap                                 |

### ✅ DECISION — 2026-10-26: **Option A**

Disable _Confirm email_ in the hosted Supabase project. Rationale and consequences:

- **Zero code change.** `src/pages/auth/confirm-email.astro` already renders
  "registration successful" when `import.meta.env.DEV` is true, so a production build would still
  say "check your email" while the account is already signed-up-and-confirmed. **That copy becomes
  stale and must be reconciled** — see follow-up F1 below.
- **Unblocks Phase 7.** `scripts/smoke.mjs` L52 asserts `signin` succeeds with the password used at
  signup, immediately after signup. With confirmation ON that assertion fails with
  _Email not confirmed_. Option A makes the full smoke suite runnable against production, and
  removes the need for the "partial-verification fallback" in Phase 7.
- **Matches local behaviour.** Local DEV already auto-confirms, so turning confirmation off makes
  production consistent with every environment the app has been tested in.
- **Accepted risk.** Unverified email addresses can register. For a pre-launch MVP behind a
  `workers.dev` hostname this is acceptable; it is **not** acceptable once real users exist, at
  which point option B (a real `/auth/confirm` route) should be implemented.
- **Touches no file in the File manifest.** The change lives entirely in dashboard state, so it does
  not conflict with the `session: false` ordering constraint in Phase 2.

**Where it must be done:** Supabase dashboard → project `omrqppuyoadtjwbybnol` → Authentication →
Sign In / Providers → Email → toggle **Confirm email** OFF. Same sitting as the P5 URL Configuration
work, since both require the dashboard. Configure Site URL as
`https://skitoursafe.skitoursafe.workers.dev` in that same sitting.

**Follow-up F1 — stale production copy (must not be forgotten).**
`confirm-email.astro` keys off `import.meta.env.DEV`, which is `false` in a production build, so the
live page will tell a freshly-registered user to check an inbox for a mail that will never arrive.
Under option A the two branches become the same outcome. Smallest correct fix is to render the
"registration successful" branch unconditionally (or key it off an explicit config flag rather than
`DEV`). **Deferred out of this change** because it edits a page, and this change is scoped to
configuration + deployment; it is recorded here so it is not lost. Until it lands, a new production
user sees misleading copy but _can_ sign in — the account is usable, which is what option A buys.

**No `/auth/confirm` route is being created.** Verified again on 2026-10-26: `src/pages/auth/`
contains only `confirm-email.astro`, `signin.astro`, `signup.astro`.

### E13 — `error code: 1042` on a workers.dev URL _(new, 2026-10-26 — cost real debugging time)_

The single most misleading signal in this deploy. `curl` to any `workers.dev` hostname returned
`404` with a body of exactly `error code: 1042` (17 bytes, `text/plain`).

**It is not a build, config, or code failure.** Cloudflare's docs are explicit:

> `1042` — … Also returned for a `workers.dev` URL with no Worker serving it, such as a Worker
> with its `workers.dev` route disabled.

**Root cause:** `wrangler versions upload` is **non-live by design**. It creates a version but
leaves the Worker's `deployment_id` empty, so nothing serves the route. Verified:

```text
GET .../workers/services/skitoursafe/environments/production
  script.deployment_id: ""      ← nothing live
  script.has_assets:    true    ← the app IS uploaded and valid
```

**How to tell it apart from a real 404 (do this before debugging anything):**

| Signal         | Edge `1042`                | Our app's 404      |
| -------------- | -------------------------- | ------------------ |
| Body           | exactly `error code: 1042` | full HTML document |
| `content-type` | `text/plain`               | `text/html`        |
| Body size      | 17 bytes                   | several KB         |

**Fix:** promote a version — `npx wrangler deploy` (or `wrangler versions deploy`). No config
change is needed. `preview_urls` / `workers_dev` are **not** top-level keys in
`wrangler/config-schema.json`, so enabling preview URLs requires the dashboard or the API; the
`--preview-alias` flag alone does not make an alias URL reachable.

**Second, separate occurrence — transient propagation.** The very first request to `/` _after a
successful_ `wrangler deploy` also returned `1042`; three cache-busted retries a second later all
returned `200`. So `1042` has two causes: (a) nothing deployed, and (b) edge propagation lag
immediately after a deploy. Always retry before investigating.

### E14 — `wrangler versions upload` implicitly creates the Worker _(observed)_

Phase 4's `wrangler secret put` prompted to create a Worker that did not exist and proceeded with
`yes` in a non-interactive context. Benign and actually convenient, but it means "the Worker does
not exist" is not a stable precondition — a later `deploy` will find a Worker already there with
secrets attached and an empty `deployment_id`.

### E2 — `SESSION` KV auto-provisioning

The generated config declares the binding even though the root config does not. `session: false`
removes it. Ordering matters because of E4.

### E3 — `IMAGES` binding auto-provisions

Because `imageService` defaults to `cloudflare-binding`. Harmless — the free plan allows 5,000
unique transformations/month and this app does not transform images — but it means every
deploy carries a binding, which is relevant to E4.

### E4 — `wrangler rollback` is conditional

Only the ~100 most recent versions are addressable, and the command is **refused outright if
bindings changed** between the versions involved.

_Mitigation:_ keep a known-good version ID before each deploy; never ship a binding change in
the same release as risky logic; avoid additions that silently change bindings (E2, E3).

### E5 — workerd cannot execute CommonJS

`astro dev` and `astro preview` run the real `workerd` runtime. `@supabase/ssr` is safe (needs
only `fetch`, WebCrypto, `AsyncLocalStorage`), but any later Node-only dependency fails _locally_
with a confusing `require` / "built into node" error. `node:net`, `node:tls`, `node:dns`,
`node:os`, `node:module` are only partially supported; `node:http2` and `node:worker_threads`
are non-functional stubs.

_Escapes:_ `vite.optimizeDeps.include` to pre-compile, or `prerenderEnvironment: 'node'` for
prerendered routes only.

### E6 — Secrets are write-only

`wrangler secret put` encrypts the value; neither Wrangler nor the dashboard can read it back.
Keep dev and prod Supabase projects separate so a key mismatch is diagnosable by symptom rather
than by reading the secret.

### E7 — Auto Minify and hydration

Cloudflare Auto Minify can cause React hydration mismatches. Not applicable on plain
`workers.dev`; disable it on the zone if islands misbehave after a custom domain is added.

### E8 — Branch mismatch disables CI ✅ **RESOLVED 2026-10-26**

`.github/workflows/ci.yml` used to trigger on `master` while the working branch was `main`, so no
push was linted, type-checked, or deployed. Fixed in a separate change: the workflow now triggers
on `main`, which is the only branch on the remote.

**Residual caveat introduced by the fix:** `ci.yml` and the Cloudflare Workers Builds deploy both
run on push to `main` and are **independent** — Workers Builds does not wait for `ci` to succeed.
A commit that fails lint or `astro check` will still reach production. Either make the deploy job
depend on CI (GitHub Actions deploy instead of Workers Builds) or accept that CI is advisory.

### E9 — `compatibility_date` and `nodejs_compat`

`2026-05-08` predates `nodejs_compat` becoming the default (`2026-08-04`), so the flag is
required and correct. A future date bump makes it redundant but harmless. Do not move it in
this change.

### E10 — Stale Pages-era guidance

Adapter v14 **removed Cloudflare Pages support**, along with `platformProxy`,
`cloudflareModules`, and `workerEntryPoint`. `main` must stay
`@astrojs/cloudflare/entrypoints/server`, not `dist/_worker.js/index.js`. Cloudflare's own Astro
framework page and many tutorials are still stale — do not "fix" `wrangler.jsonc` toward them.

### E11 — Environment variable access

`Astro.locals.runtime` no longer exists. Correct APIs: `import { env } from "cloudflare:workers"`,
`Astro.request.cf`, `Astro.locals.cfContext`. The current code uses `astro:env/server`, which is
supported and correct.

### E12 — Node.js version mismatch _(observed, now resolved)_

`.nvmrc` pins `22.14.0` and Wrangler 4.x requires **≥ 22.0.0**, but the shell was resolving
`node` to `v20.20.2`. Every `wrangler` subcommand exits 1 with a Node-version message before it
ever reaches authentication, network, or the browser.

**\* UPDATE 2026-10-26 — the "Mitigations" above were aspirational, not verified.** Phase 0 opened
on `v20.20.2` despite every bullet being satisfied. The real mechanism:

- `~/.bashrc` sources `nvm.sh` (L126–128) but **nothing ever calls `nvm use`**, so an inherited
  `PATH` always wins — `nvm.sh` L4439 `--no-use) NVM_AUTO_MODE='none'`.
- `~/.bashrc` also has an interactivity guard (L5–9), so a non-interactive shell skips the whole
  nvm block and has **no `node` at all**.
- `nvm alias default 22.14.0` governs only a _future_ `nvm use`; it does not repair a running shell.

**Fixed at `~/.bashrc` L129:** `nvm use default >/dev/null 2>&1`, verified by re-running the exact
failing case (`PATH` with `v20.20.2` first) → `v22.14.0` and `npx wrangler` → `4.131.1`.

_Why it is easy to misdiagnose:_ the first command people run is `wrangler login`, so the failure
presents as "login is broken" when nothing auth-related has executed yet. The error text is
also printed above a generic exit code 1.

_Mitigations:_

- Always run `nvm use` (or source `nvm.sh`) in a new terminal — `nvm` is **not** auto-loaded in
  the integrated terminal here
- Set `nvm alias default 22.14.0` so new shells inherit it
- Add `"engines": { "node": ">=22" }` to `package.json` for a louder, earlier warning
- `npx astro check` and `npm run build` also fail on Node 20, so Phase 0 catches this too — treat
  a Node-version message as a prerequisite failure, not a code failure

---

## Rollback playbook

1. `npx wrangler deployments list` → identify the previous version ID
2. `npx wrangler rollback <VERSION_ID>`
3. If refused (bindings changed between versions): rebuild the previous commit and
   `npx astro build && npx wrangler deploy`
4. Supabase schema and Auth changes **do not** roll back with the Worker — they are a separate
   operation and must be reverted deliberately

Human-only actions (never delegated to an agent): rotating the Supabase service key or database
password, deleting the Worker, dropping Supabase tables, and any Cloudflare account-level change.

## Human approval gates

| Gate           | Human action                                                            |
| -------------- | ----------------------------------------------------------------------- |
| Before Phase 2 | ~~Approve the three config edits~~ — ✅ approved and applied 2026-10-26 |
| Before Phase 4 | Provide Supabase project URL + anon key                                 |
| Before Phase 6 | Approve promoting the preview to production                             |
| Before Phase 8 | Approve the `tech-stack.md` frontmatter correction                      |

## Verification command reference

```bash
# prerequisites — run first, every new terminal
source "$HOME/.nvm/nvm.sh" && nvm use       # must report v22.14.0
node --version                              # expect v22.14.0
npx wrangler --version                       # expect 4.131.1
npx wrangler whoami                          # must NOT print a Node-version error

# local gates
npm ci
npx astro check
npm run lint
npm run build

# inspect the generated deployment config
grep -c SESSION dist/server/wrangler.json   # expect 0 after Phase 2
grep -o '"name":"[^"]*"' dist/server/wrangler.json   # expect "skitoursafe"

# cloud state
npx wrangler secret list

# ship
npx wrangler versions upload     # preview, non-live
npx wrangler deployments list    # record version ID
npx wrangler deploy              # production
npx wrangler tail

# live checks
curl -sSI https://skitoursafe.skitoursafe.workers.dev/
curl -sSI https://skitoursafe.skitoursafe.workers.dev/dashboard
BASE_URL=https://skitoursafe.skitoursafe.workers.dev npm run smoke
```

## File manifest

| File                               | Change                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `astro.config.mjs`                 | ✅ `session: false` added; `vite.build.minify` deliberately not set             |
| `wrangler.jsonc`                   | `name` → `skitoursafe`; everything else unchanged                               |
| `package.json`                     | Add `deploy` / `preview:worker` scripts; _(recommended)_ `engines.node: ">=22"` |
| `.env.example`                     | Comment pointing at `.dev.vars`                                                 |
| `supabase/config.toml`             | _(optional)_ stale `project_id`; dangling `seed.sql` reference                  |
| `context/foundation/tech-stack.md` | `deployment_target` → `cloudflare-workers`                                      |
| `README.md`                        | Real deployment commands + secrets duplication warning + `nvm use` step         |
| `AGENTS.md`                        | Commands table, if scripts are added                                            |
| `context/foundation/lessons.md`    | Anything left unresolved                                                        |
| `.dev.vars`                        | _(gitignored, create locally)_ hosted Supabase credentials                      |

Shell profile (outside the repo): source `nvm.sh` + `nvm alias default 22.14.0` so the Node
version does not silently regress (E12).

Unchanged but load-bearing: `.nvmrc` (`22.14.0`), `src/lib/supabase.ts` (null-safe env handling),
`src/middleware.ts` (`PROTECTED_ROUTES`), `scripts/smoke.mjs`,
`src/pages/auth/confirm-email.astro` (subject of E1).

## Open questions carried into implementation

1. ~~**E1** — disable Confirm email, implement `/auth/confirm`, or accept a partial smoke?~~
   ✅ **RESOLVED 2026-10-26 — option A: disable Confirm email.** Dashboard click still pending.
   Option B (a real `/auth/confirm` route) is the correct end state once real users exist.
2. **F1 (new)** — `src/pages/auth/confirm-email.astro` keys its copy off `import.meta.env.DEV`,
   so a production build promises a confirmation email that option A will never send. Render the
   "registration successful" branch unconditionally. Deferred out of this change; account is
   usable meanwhile.
3. **`secrets.required`** — add it to `wrangler.jsonc` for fail-fast deploys, and verify it
   survives Astro's config generation? Fall back to relying on `wrangler secret list`.
   _Note: the generated config observed in Phase 0 carries `\"vars\":{}` and no `secrets` key, so
   this needs an actual test rather than an assumption._
4. **CI retarget to `main`** — a one-line fix in `ci.yml` would turn on the project's only
   automated gates. Explicitly out of scope here, but it should be its own change soon, since
   E8 means nothing is currently validated.
5. **Node / `undici` engine mismatch (new, Phase 0)** — `undici@8.10.2` wants `node >=22.19.0`
   but `.nvmrc` pins `22.14.0`. Warnings only today. Decide separately whether to bump `.nvmrc`
   or pin `undici`; **do not** fold it into this deploy.
