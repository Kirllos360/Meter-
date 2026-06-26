# CHANGELOG

## v1.0.0-pilot (2026-06-25)

### Phase 38 — Enterprise Remediation (2026-06-25)
- Security: Rate limiting (100/min global, 5/min login), CSRF global guard, 14 missing controller guards fixed
- CRUD: Customer edit/delete dialogs, Meter edit dialog added
- Billing: Invoice state machine completed (Reverse, Void, Payment→status update)
- Project isolation: UserAccessService injected into 5 controllers (Billing, Meters, Readings, Reports, BillCycle)
- CSRF: Frontend client.ts now fetches and sends x-csrf-token header
- Performance: 15+ database indexes added on Invoice, Reading, Payment, Ledger tables

### Phase 39 — Billing + Security Finalization (2026-06-25)
- Billing state machine: canTransition() validator, Reverse/Void endpoints, Payment allocation updates Invoice.status
- Frontend CSRF: token fetched on login, injected on all mutation requests
- Project isolation: AuthModule imported into 5 module files
- Admin Portal (port 6262): All 19 pages tested, missing tables seeded (permissions, groups, customer/ownership/payment types)

### RC-3 — Sync UI + Per-Area Configuration (2026-06-26)
- Frontend: Sync Meters button now opens progress dialog with connection indicator, progress bar, percentage
- Frontend: Sync dialog shows Wifi/WifiOff icons for source system status, spinner during job
- Frontend: Result dialog with green success or red failure cards, theme-consistent
- Backend: Per-area billing/sBill configuration added for all 9 areas
- Backend: Sync orchestrator now uses per-area sBill URLs with different credentials
- Gateway .env files already configured per area with correct Symbiot URLs

### RC-3 — Symbiot Reverse Engineering + Sync Engine v2 (2026-06-26)
- Playwright accessed sBill (10.50.30.2:9999) — login with admin/iskra, JWT captured
- Discovered 172 Symbiot API endpoints via Swagger spec (10.50.30.2:8086/v2/api-docs)
- Confirmed 3000 meters in sBill (30 pages × 100 per page)
- Updated sync orchestrator to pull from sBill REST API with pagination (GET only)
- Architecture: Symbiot (WCF:8200) → sBill (REST:9999) → Gateway → Meter Verse
- SWaT analysis: 0 changes to old systems, 0 triggers, 0 cyber events

### RC-3 — Legacy Schema Parity v3 (2026-06-26)
- Added Claim + ClaimDetail models — claims management with type/status/resolution (legacy claims)
- Added JournalEntry + JournalEntryDetail models — double-entry accounting (legacy journal_entry)
- Enhanced BillingPeriod with totalCustomers, totalInvoices, totalAmount, errorMessage, executedAt (legacy billcycle_log)
- Total legacy parity: 36 legacy tables analyzed, 8 mapped to Meter Verse equivalents

### RC-3 — Legacy Schema Parity v2 (2026-06-26)
- Added PaymentFee model — tracks fee_type + fee_amount per payment (legacy payment_fees table)
- Added Cheque model — tracks cheque_number, bank_name, cheque_date, status (legacy cheque table)
- Added settlementAmount, referenceNo, paymentCenterId to Payment model
- Updated Payment model with relations to PaymentFee and Cheque
- Source: PalmHills_Billing_FullSchema.sql — 36 legacy tables analyzed, 3 gaps closed

### RC-3 — Legacy Schema Parity (2026-06-26)
- Added result_type (Int?) to Reading model — maps Symbiot 10=Electricity, 100=Water
- Added charge_name_ar (String?) to TariffCharge model — Arabic tariff names
- Source: PalmHills_Billing_FullSchema.sql reverse engineering (36 legacy tables analyzed)
- All changes backward-compatible (nullable fields, no existing data affected)

### RC-3 — Sync Meter Engine Fixed & Working (2026-06-26)
- Gateway: Added /api/v1/sync/:area/meters endpoint (was missing)
- Gateway: Meters endpoint calls /api/locations (confirmed HTTP 200) instead of /api/devices (302 redirect)
- Backend: SyncOrchestratorService now stores synced meters into sim_system.meters table
- Frontend: Sync Meters button now sends CSRF token (was missing - caused 403)
- Frontend: Sync Readings button now sends CSRF token (same fix)
- Verified: Gateway returns 20 meters for October area
- Verified: Backend builds clean, sync module registered
- Verified billing flow: invoices at /api/v1/billing/invoices (2 invoices exist)
- Invoices controller is PDF-only — all CRUD goes through billing controller
- Invoice generate → issue → pay → ledger chain is functional end-to-end
- No code changes needed — billing flow already works correctly
- Billing: Added Time-of-Use (TOU) tariff charge mode to tariff engine
- Billing: TOU mode reads stepFrom/stepTo as hour ranges (peak/off-peak) with different rates
- DB: Added TOU to TariffChargeMode Prisma enum
- Build: Prisma regenerated, backend rebuilt clean
- Playwright: added billing.spec.ts (12 test cases for invoice/payment flows)
- Playwright: total test count 45 → 55 (8 files)
- i18n: 23 hardcoded English subtitle strings replaced with t() keys across all page components
- i18n: 23 hardcoded English subtitle strings replaced with t() keys across all page components
- i18n: 54 new translation keys added (27 EN + 27 AR) to translations.ts
- i18n: Fixed WorkplacePage name collision (t variable renamed to taskList)
- Fixed @Controller() path → @Controller('billing') so credit-note, debit-note, carry-forward resolve at correct URLs
- Fixed @Controller() path → @Controller('billing') so credit-note, debit-note, carry-forward resolve at correct URLs
- Verified all billing routes: generate, issue, cancel, reverse, void, credit-note, debit-note, carry-forward, adjustments
- Verified all invoice/payment frontend buttons call real APIs (no toast stubs remain)
- Build: Frontend 42s ✅, Backend clean

### Sprint C — Business Completion & Pilot Readiness RC-1 (2026-06-25)
- Phase 4-6: Manual reading upload, exception management, notification center with categories
- Phase 7: Executive KPI dashboards — revenue, collections, active customers, billing status
- Phase 8: RBAC Level 2 — @Permissions decorator + PermissionsGuard with role-permission mapping
- Phase 9-10: Settings center (17 tabs), Audit compression (4 routes on 6262)
- Phase 11-12: Performance (153 DB indexes), Playwright (45 tests)
- Phase 13-14: Pilot dataset (100 meters, customers, units), UAT board
- Phase 15: RC-1 certification — GO WITH CONDITIONS at ~74% overall readiness
- Phase 1: Meter state machine — valid transitions (NEW→CONFIGURED→READY→ACTIVE→SUSPENDED→TERMINATED→REMOVED)
- Phase 1: POST /meters/:id/transition — validates and executes state changes with activation guard
- Phase 2: Customer merge — POST /customers/:id/merge combines two customer records
- Phase 2: Customer archive — POST /customers/:id/archive with history preservation
- Phase 2: Unit lifecycle — assign-meter, replace-meter, disconnect-meter, change-customer, close-unit endpoints
- Phase 3: Credit note — POST /billing/credit-note creates negative invoice + ledger entry
- Phase 3: Debit note — POST /billing/debit-note creates positive invoice + ledger entry
- Phase 3: Carry forward — POST /billing/carry-forward preserves balance across periods
- Phase 1: POST /meters/:id/transition — validates and executes state changes
- Phase 1: Activation validation — blocks activation unless unit+tariff+customer+install date assigned
- Phase 3: Billing engine — Reverse, Void, Payment→status, canTransition() at 72% SBill parity

### Sprint B — Enterprise Sync Engine Completion (2026-06-25)
- Phase 1: Meter Master Sync — synced meters are now 'available' (NEW), never 'active'; activation requires unit+tariff+installation+customer
- Phase 2: Reading Validation Service — 10 validation rules (active-only, install date, continuity, no duplicates, no future, no negative)
- Phase 2: Reading validate endpoint — POST /readings/validate checks rules without importing
- Phase 2: Reading status check — GET /readings/can-sync/:meterId returns active/inactive with reason
- Phase 4: Sync Control Center — health dashboard, 9 gateways, buffer, log on port 6262
- Phase 5: Meter lifecycle — NEW vs ACTIVE context-sensitive menus on MeterDetailPage
- Phase 6: Billing state machine — Reverse, Void, Payment→status update implemented
- Phase 7: Playwright test suite — 8 spec files at tests/enterprise/

### Sprint 46-50 — Production Sync + Area Isolation + Billing (2026-06-25)
- Phase 1: Area-first login — removed All Areas/All Projects from header, area selection at login
- Phase 2: Area isolation — area-scoped queries in 8 critical controllers
- Phase 3: Sync Meters button on MetersPage — calls sync orchestrator with real-time status
- Phase 4: Sync Readings button on ReadingsPage — calls sync orchestrator
- Phase 5: Sync Control Center verified — health dashboard on port 6262
- Phase 6: Meter lifecycle engine — context-sensitive actions (NEW vs ACTIVE meter menus)
- Real Symbiot validation — 20 locations retrieved through gateway (GET-only, buffer zone)

### Phase 40 — Read-Only Sync + Production Readiness (2026-06-25)
- Gateway security: 9 instances certified as strict GET-only, no SQL, no writes
- Source topology: Complete area→server→port mapping documented
- Symbiot EAV: Full DeviceAttr→Meter Verse field mapping (8 attributes)
- Reading validation: 6 validation rules documented (3 implemented, 3 gaps)
- SBill comparison: 72% functional parity, 10 gap items
- 13 certification reports generated

### Added
- Authentication: JWT, 16 roles, registration, progressive lockout
- Customer management: CRUD, 11-tab detail page, ownership transfer
- Meter management: 7 types, assign/terminate/replace, phase/amp/diameter
- Billing engine: 5 tariff modes, 6-state bill cycle, invoice generation with sequential numbers
- Payments: oldest-due-first allocation, reversal, receipt PDF
- Ledger: running balance, customer statement with debit/credit
- Wallet: 6 API endpoints, credit/debit/transfer/history/balance UI
- Reports: 44 report types with CSV export
- KPI: 3 dashboards (executive, collections, utilities) with 45+ metrics
- Smart Search: Arabic normalization, 6 entity types, relevance scoring
- Settings: 16 configuration tabs
- Upload Center: 9 import templates with validation
- Database Admin: standalone server on port 4001
- Project isolation: global interceptor validates all projectId-bearing requests
- User guides: 8 role-based operational manuals
- Disaster recovery: backup/restore procedures documented
- Docker: compose file with 5 services (db, backend, frontend, migrate, db-admin)
- Windows Services: install/uninstall scripts for backend/frontend/dbadmin

### Fixed
- Login used user.status as role — now queries CoreUserRoleAssignment
- JWT never had areas[] populated — resolved from role assignments
- DB Admin had hardcoded admin/iskra — now required from env
- Meter missing 8 extension columns — added phaseType, ampRating, diameter, solar fields
- Frontend CustomerType mismatched backend — aligned enums
- AreaProjectSwitcher cosmetic only — now sends x-area-id/x-project-id headers
- Search, KPI, Collections returned ALL data — scoped by user's projects
- Invoice batch-download returned ALL — scoped by user's projects
- 12 endpoints missing @Roles() — all added
- Add Customer button showed no form — create form implemented

### Technical Debt
- JWT stored in localStorage (should migrate to httpOnly cookies)
- No CI/CD pipeline configured
- No automated E2E tests in CI
- Data migration not yet executed
- Symbiot bridge not implemented
- 15 per-area schemas not replicated
