---
doc: task-github
project: SkitourSafe
repository: ArturKotarba/10xDevs-SkitourSafe
source_of_truth: context/foundation/roadmap.md
milestone: "M-1: Pierwsza bezpieczna rekomendacja end-to-end"
milestone_number: 1
created: 2026-11-08
updated: 2026-11-08
synced_at: 2026-11-08
---

# Task Management — GitHub Issues

How work items move from `context/foundation/roadmap.md` into GitHub, what the
labels and dependency graph mean, and what to run to keep the two in sync.

**The roadmap is canonical.** GitHub is a projection of it. When they disagree,
the roadmap wins and GitHub is re-synced — never the reverse.

---

## 1. Tracker configuration

| Setting            | Value                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Tracker            | GitHub Issues (no Projects board — it would duplicate the roadmap and invite estimation, which the roadmap forbids) |
| Repository         | `ArturKotarba/10xDevs-SkitourSafe` (public)                                                                         |
| Milestone          | `#1 M-1: Pierwsza bezpieczna rekomendacja end-to-end`                                                               |
| Milestone due date | **none** — the roadmap forbids invented dates                                                                       |
| Items              | 7 (`F-01`–`F-02`, `S-01`–`S-05`)                                                                                    |

### Labels

| Label              | Color     | Meaning                                                                   |
| ------------------ | --------- | ------------------------------------------------------------------------- |
| `foundation`       | `#5319e7` | Roadmap `F-NN` — enables later slices, no user-visible outcome on its own |
| `slice`            | `#1d76db` | Roadmap `S-NN` — end-to-end, user-visible outcome                         |
| `status: ready`    | `#0e8a16` | Roadmap `Status: ready` — prerequisites met, `/10x-plan` can start        |
| `status: proposed` | `#ededed` | Roadmap `Status: proposed` — not startable yet                            |
| `status: done`     | `#6e7781` | Roadmap `Status: done` — change archived; issue closed                    |

There is no milestone label: the milestone itself encodes `M-1`.

---

## 2. Item index

Titles follow `[<roadmap-id>] <Backlog Handoff title>` so an issue is identifiable
without opening it.

| #                                                                  | Roadmap | Change ID                       | Kind       | Roadmap status | GitHub state            |
| ------------------------------------------------------------------ | ------- | ------------------------------- | ---------- | -------------- | ----------------------- |
| [#1](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/1) | F-01    | `domain-schema-and-rls`         | foundation | **done**       | CLOSED — `status: done` |
| [#2](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/2) | F-02    | `curated-route-catalogue`       | foundation | proposed       | OPEN — **startable**    |
| [#3](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/3) | S-01    | `skier-profile-and-conditions`  | slice      | proposed       | OPEN — **startable**    |
| [#4](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/4) | S-02    | `disclaimer-and-confirmation`   | slice      | proposed       | OPEN — blocked by #3    |
| [#5](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/5) | S-03    | `deterministic-route-match`     | slice      | proposed       | OPEN — blocked by #2,#4 |
| [#6](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/6) | S-04    | `ai-justification-and-save`     | slice      | proposed       | OPEN — north star       |
| [#7](https://github.com/ArturKotarba/10xDevs-SkitourSafe/issues/7) | S-05    | `outing-journal-with-staleness` | slice      | proposed       | OPEN — blocked by #6    |

`Roadmap status` and `GitHub state` are intentionally different axes: the first
is what the roadmap says, the second is what a reader sees in GitHub. They are
kept aligned by the reconcile step in §6.

---

## 3. Dependency graph

Prerequisites are enforced natively by GitHub (`blockedBy`), not only written in
the body — a blocked issue is visibly blocked in the UI.

```
F-01 #1 ──┬──> F-02 #2 ──┐
          │               ├──> S-02 #4 ──> S-03 #5 ──> S-04 #6 ──> S-05 #7
          └──> S-01 #3 ──┘              ▲
                                F-02 #2 ┘
```

| Issue   | Blocked by | Unlocks |
| ------- | ---------- | ------- |
| #1 F-01 | —          | #2, #3  |
| #2 F-02 | #1         | #5      |
| #3 S-01 | #1         | #4      |
| #4 S-02 | #3         | #5      |
| #5 S-03 | #2, #4     | #6      |
| #6 S-04 | #5         | #7      |
| #7 S-05 | #6         | —       |

`S-03` has a genuine join: it needs both the form chain (`S-02`) and real
catalogue data (`F-02`).

---

## 4. Sync state

GitHub was reconciled with the roadmap on `2026-11-08`. Milestone: **6 open, 1
closed**.

Applied:

| Item            | Result                                                                |
| --------------- | --------------------------------------------------------------------- |
| Issue #1 (F-01) | closed as completed, `status: ready` → `status: done`, record comment |
| Issue #2 (F-02) | `status: proposed` → `status: ready`                                  |
| Issue #3 (S-01) | `status: proposed` → `status: ready`                                  |
| Label           | `status: done` created (`#6e7781`)                                    |

`F-01` archived to `context/archive/2026-11-07-domain-schema-and-rls/`; its
closure comment links that folder.

Remaining staleness is **in the roadmap, not in GitHub**:

- `## Backlog Handoff` still marks `F-01` as `yes` / "Run `/10x-plan`" (already
  archived) and `F-02`/`S-01` as `no`, though both are now unblocked.
- `## At a glance` and the `F-NN`/`S-NN` blocks still show `proposed` for `F-02`
  and `S-01`; the roadmap's `Status` column is only flipped by `/10x-archive`.

Per the source-of-truth rule these are roadmap edits, not GitHub edits — see §6
_Promote an item_ for the paired change.

---

## 5. What the shipped schema already gives you

`F-01` left the database further along than `F-02` and `S-01` assume, which
changes what those slices actually have to do. Migration:
`supabase/migrations/20261107120000_domain_schema_and_rls.sql`.

**Types already exist** — no new enum work needed:
`avalanche_level`, `experience_level`, `wind_direction`, `visibility`,
`route_difficulty`, `aspect_octant`, `outing_outcome`, `justification_source`.

**`public.skier_profiles`** already carries every field `FR-004` and `FR-005`
require: `has_abc_gear`, `terrain_familiarity`, `fitness_level`,
`available_time_minutes`, plus nullable current conditions (`avalanche_level`,
`wind_direction`, `visibility`). → **`S-01` is UI + API only, no migration.**

**`public.routes`** already has `region`, `difficulty`, `requires_abc_gear`,
`duration_minutes`, `max_slope_degrees`, `aspect`, `above_treeline`, with
`unique (name, region)` and an index on `region`. → **`F-02` is content + seed
wiring only, no schema work.** The roadmap's open question about a region
dimension is answered: `region` is a plain text column.

**`public.outings`** snapshots route attributes at save time (`route_name`,
`route_region`, `route_*`) so a later catalogue edit cannot rewrite history, and
a `check` constraint enforces exactly one of _recommended-with-route_ or
_no_go-with-reason_. → `S-05` gets staleness "for free": snapshot columns are
already the past conditions.

Still missing for `F-02`, and the only real blocker there:

```
supabase/config.toml
  [db.seed]
  enabled = false
  sql_paths = []
```

Seed files do not exist yet. Note the schema comment: _"seeding goes through the
service role"_ — `routes` has a `routes_select_all` read policy but no write
policy, which is intentional.

---

## 6. Operations

The reconcile step is **three edits, always in this order**: roadmap first (it is
canonical), then GitHub, then the index table in §2 and the sync state in §4.

### Close an item (after `/10x-archive`)

`/10x-archive` already flipped the roadmap's `Status` to `done`. Mirror it:

```bash
ID=1; CHANGE=domain-schema-and-rls; ARCH=context/archive/2026-11-07-domain-schema-and-rls

gh issue edit "$ID" --add-label "status: done" --remove-label "status: ready"
gh issue close "$ID" --reason completed \
  -c "Zrealizowane i zarchiwizowane w \`$ARCH/\` (plan → implement → impl-review → archive)."
```

### Promote an item (prerequisites just landed)

Find what the closed issue unblocks, then promote. Roadmap side first:

```bash
# 1. roadmap: flip Status + Backlog Handoff "Ready for /10x-plan" -> yes
# 2. GitHub:
gh issue edit 2 --remove-label "status: proposed" --add-label "status: ready"
```

Only promote an issue whose blockers are all closed — check §6 _Inspect state_.

### Inspect state

```bash
# milestone progress
gh api repos/ArturKotarba/10xDevs-SkitourSafe/milestones/1 \
  --jq '"\(.title): \(.open_issues) open / \(.closed_issues) closed"'

# issues with labels, in roadmap order
gh issue list --milestone "M-1: Pierwsza bezpieczna rekomendacja end-to-end" \
  --state all --limit 20 --json number,title,labels,state \
  --jq '.[] | "#\(.number) \(.state) [\(.labels|map(.name)|join(","))] \(.title)"'

# native dependency graph
gh api graphql -f query='
{ repository(owner:"ArturKotarba", name:"10xDevs-SkitourSafe") {
    issues(first:20, orderBy:{field:CREATED_AT, direction:ASC}) { nodes {
      number
      blockedBy(first:10) { nodes { number } } } } } }' \
  --jq '.data.repository.issues.nodes[]
        | "#\(.number) blocked by: \([.blockedBy.nodes[].number] | map("#\(.)") | join(", "))"'
```

### What is actually startable

The graph alone is not enough — a closed blocker only makes an issue _eligible_.
Count only **open** blockers:

```bash
gh api graphql -f query='
{ repository(owner:"ArturKotarba", name:"10xDevs-SkitourSafe") {
    issues(first:20, states:OPEN, orderBy:{field:CREATED_AT, direction:ASC}) { nodes {
      number
      blockedBy(first:10) { nodes { number state } } } } } }' \
  --jq '.data.repository.issues.nodes[]
        | "#\(.number): \(([.blockedBy.nodes[] | select(.state=="OPEN") | .number]
             | if length==0 then "STARTABLE" else "waiting on " + (map("#\(.)")|join(", ")) end))"'
```

### Add a dependency

```bash
gh api graphql -f query='
mutation($issue:ID!, $blocking:ID!) {
  addBlockedBy(input:{issueId:$issue, blockingIssueId:$blocking}) { issue { number } } }' \
  -f issue="$(gh api repos/ArturKotarba/10xDevs-SkitourSafe/issues/6 --jq .node_id)" \
  -f blocking="$(gh api repos/ArturKotarba/10xDevs-SkitourSafe/issues/5 --jq .node_id)"
```

---

## 7. Workflow per item

```
/10x-new <change-id>  →  /10x-plan <change-id>  →  /10x-implement
   →  /10x-impl-review  →  triage  →  /10x-archive
   →  close the issue + relabel
```

`/10x-archive` flips the roadmap's `Status` to `done` and appends to
`## Done`. It does **not** touch GitHub — step 3 of the sync is always manual.

### Issue body contract

| Section          | Content                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `Outcome`        | Roadmap outcome, verbatim                                                            |
| `Change ID`      | Kebab-case id + `Następny krok: /10x-plan <id>`                                      |
| `PRD references` | `US-`, `FR-`, `NFR`, `Guardrails` — each with a one-line gloss                       |
| `Dependencies`   | Blocked by / parallel with / unlocks, by issue number                                |
| `Open questions` | Roadmap unknowns with `Owner` and `Block`                                            |
| `Risk`           | Roadmap risk, verbatim                                                               |
| `Done when`      | Checklist incl. `npm run lint`, `npx astro check`, `npm run build`, `/10x-archive`   |
| footer           | `<sub>Roadmap M-1 · id S-03 · status proposed · context/foundation/roadmap.md</sub>` |

`Done when` deliberately does **not** reference a test command — the repo has no
test runner. See `AGENTS.md` → _Critical rules_.

---

## 8. Out of scope

Not tracked here, and not to be added back without a roadmap change:

- `FR-009` (show why other routes were rejected) — `nice-to-have`, parked
- External weather/avalanche integration, GIS slope analysis, navigation/GPS
  — PRD `## Non-Goals`
- Admin roles, social features, WCAG-AA, multilingualism — PRD `## Non-Goals`
- A test runner — not a PRD requirement; if filter correctness starts regressing
  it becomes an enabler, not a slice
- Story points, estimates, due dates, velocity — the roadmap forbids them
