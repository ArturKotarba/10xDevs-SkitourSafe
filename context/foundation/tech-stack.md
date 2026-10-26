---
starter_id: 10x-astro-starter
package_manager: npm
project_name: skitoursafe
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-workers
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
---

## Why this stack

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
