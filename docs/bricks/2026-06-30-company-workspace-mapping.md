# ADR: Company ↔ workspace_id mapping

**Status:** accepted
**Task:** PA-P2d
**Date:** 2026-06-30

## Decision

**1:1 identity mapping:** `workspace_id = companyId` (UUID string).

Paperclip `Company` is the sole tenant boundary. Atlas legacy `workspace_id` fields map directly to Paperclip `company_id` with no indirection table.

## Rules

- All `atlas_*` tables scope by `company_id` FK → `companies.id`.
- Routes live under `/api/companies/:companyId/atlas/...`.
- Cross-company access uses `assertCompanyAccess(req, companyId)` — returns 403 on mismatch.
- Legacy string workspace ids (`workspace_personal`, `workspace_operational_dogfood`) become **bootstrap fixtures** that create/link companies on first run (PA-P2M5), not parallel tenants.

## Non-goals

- Separate workspace table duplicating Company.
- Cross-company knowledge graph queries.
