# T013 Validation Report — Core Org Prisma Migration

> **Task**: T013 [P] Migration — Project, LocationNode, Customer, CustomerUnitAssignment
> **Date**: 2026-05-27
> **Branch**: `feature/t012-contract-harness`
> **Migration**: `20260527080245_core_org`
> **Verdict**: ✅ **PASS**

---

## Implementation Summary

### Models Added

| Model | Fields | Key Constraints |
|-------|--------|-----------------|
| **Project** | `id`, `code` (unique), `name`, `status` (enum), `tax_enabled`, `tax_rate?`, `reading_threshold_profile_id?`, `water_difference_mode` (enum), `created_at`, `updated_at`, `created_by`, `updated_by` | `@@unique([code])` |
| **LocationNode** | `id`, `project_id` (FK), `parent_id?` (self-FK), `node_type` (enum), `code`, `name`, `status` (enum), `created_at`, `updated_at`, `created_by`, `updated_by` | `@@unique([projectId, nodeType, code])`, `@@index([parentId])` |
| **Customer** | `id`, `project_id` (FK), `customer_code`, `name`, `phone`, `email`, `customer_type` (enum), `national_or_commercial_id`, `status` (enum), `created_at`, `updated_at`, `created_by`, `updated_by` | `@@unique([projectId, customerCode])` |
| **CustomerUnitAssignment** | `id`, `customer_id` (FK), `unit_id` (FK), `start_at`, `end_at?`, `reason`, `created_at`, `updated_at`, `created_by`, `updated_by` | Partial unique `(customer_id, unit_id) WHERE end_at IS NULL` |

### Enums Added

| Enum | Values | Schema |
|------|--------|--------|
| `ProjectStatus` | `active`, `inactive` | `sim_system` |
| `WaterDifferenceMode` | `billable`, `report_only` | `sim_system` |
| `NodeType` | `zone`, `building`, `floor`, `unit` | `sim_system` |
| `CustomerType` | `individual`, `company`, `tenant`, `owner` | `sim_system` |
| `EntityStatus` | `active`, `inactive` | `sim_system` |

### Constraints Created

1. **Uniq `projects_code_key`** — unique project code
2. **Uniq `location_nodes_project_id_node_type_code_key`** — `(project_id, node_type, code)` uniqueness (acceptance)
3. **Index `location_nodes_parent_id_idx`** — B-tree on `parent_id` for hierarchy traversal (risk mitigation)
4. **Uniq `customers_project_id_customer_code_key`** — customer code unique per project
5. **Partial unique `customer_unit_assignments_customer_id_unit_id_active_key`** — `(customer_id, unit_id) WHERE end_at IS NULL` (acceptance, via raw SQL)

---

## Validation Steps

| Step | Command | Result |
|------|---------|--------|
| 1 | `npx prisma validate` | ✅ Schema valid |
| 2 | `npx prisma migrate dev --name core_org` | ✅ Migration applied |
| 3 | `npx prisma migrate status` | ✅ Database schema up to date |
| 4 | `npm run build` (tsc) | ✅ Clean |
| 5 | `npm test` | ✅ 110/110 passing |

---

## Architecture Review

- **Maintainability**: Models follow existing conventions — `@map()` for snake_case, `@@schema("sim_system")`, `TEXT` UUIDs
- **Scalability**: `parent_id` indexed for recursive hierarchy queries; partial unique index is efficient (small active set vs full table)
- **Auditability**: All mutable entities include `created_at`, `updated_at`, `created_by`, `updated_by` per data model spec
- **Billing integrity**: One-active-assignment constraint prevents double-billing; historical rows preserved via `end_at`

---

## Risk Review

| Risk | Rating | Mitigation |
|------|--------|------------|
| Hierarchy self-FK | 🟢 Low | `parent_id` nullable + indexed; `ON DELETE SET NULL` |
| Partial unique concurrency | 🟢 Low | PostgreSQL unique index is atomic; P2002 on conflict handles race |
| Migration replay | 🟢 Low | Idempotent; `prisma migrate reset` drops/recreates |
| Billing hazard | 🟢 Low | No double-active-assignment possible with partial unique index |

---

## SpecKit Compliance

- ✅ Tables created with enums
- ✅ `(project_id, node_type, code)` uniqueness
- ✅ One-active-row-per `(customer_id, unit_id)` where `end_at IS NULL`
- ✅ Project includes `tax_enabled`, `tax_rate`, `reading_threshold_profile_id`, `water_difference_mode`
- ✅ `parent_id` nullable + indexed

**Overall: ✅ PASS — All acceptance criteria satisfied**
