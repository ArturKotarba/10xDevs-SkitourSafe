---
change_id: domain-schema-and-rls
title: Domain schema with RLS for profile, routes, and outings
status: implemented
created: 2026-11-07
updated: 2026-11-07
archived_at: null
---

## Notes

F-01 from `context/foundation/roadmap.md` (Change ID: `domain-schema-and-rls`).

Roadmap foundation F-01 — prerequisites: none; unlocks: S-01 (`skier-profile-and-conditions`), S-03 (`deterministic-route-match`), S-04 (`ai-justification-and-save`), S-05 (`outing-journal-with-staleness`); PRD refs: `## Access Control`, `FR-004`, `FR-005`, `FR-008`.

Scope guardrail from the roadmap: three domain tables only — skier profile, route catalogue, outing journal — with RLS enabled and owner-scoped policies. Deliberately not a full domain model for future features; limit to the fields required by `FR-004`, `FR-005`, `FR-007` and `FR-008`.

Open question carried from the roadmap: does the route catalogue already need a region/area dimension in the MVP, or is a flat list with route attributes enough? Owner: user. Block: no.
