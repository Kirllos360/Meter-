# Graph Report - Frontend  (2026-05-28)

## Corpus Check
- 125 files · ~51,654 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1027 nodes · 2736 edges · 70 communities (61 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b73182a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 276 edges
2. `SmartTable()` - 49 edges
3. `Button()` - 48 edges
4. `StatusBadge()` - 45 edges
5. `PageHeader()` - 35 edges
6. `usePageStore` - 35 edges
7. `TicketsPage()` - 33 edges
8. `PaymentsPage()` - 32 edges
9. `Card()` - 32 edges
10. `CardContent()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `agent-ctx/4-layout-builder.md` --references--> `src/components/layout/AppShell.tsx`  [EXTRACTED]
  agent-ctx/4-layout-builder.md → src/components/layout/AppShell.tsx
- `dev.sh script` --calls--> `log_step_start()`  [EXTRACTED]
  /home/abady/Downloads/09/workspace-12a9edc7-18ef-424c-a245-17e0c2b89877/.zscripts/dev.sh → .zscripts/dev.sh
- `dev.sh script` --calls--> `log_step_end()`  [EXTRACTED]
  /home/abady/Downloads/09/workspace-12a9edc7-18ef-424c-a245-17e0c2b89877/.zscripts/dev.sh → .zscripts/dev.sh
- `dev.sh script` --calls--> `start_mini_services()`  [EXTRACTED]
  /home/abady/Downloads/09/workspace-12a9edc7-18ef-424c-a245-17e0c2b89877/.zscripts/dev.sh → .zscripts/dev.sh
- `dev.sh script` --calls--> `wait_for_service()`  [EXTRACTED]
  /home/abady/Downloads/09/workspace-12a9edc7-18ef-424c-a245-17e0c2b89877/.zscripts/dev.sh → .zscripts/dev.sh

## Communities (70 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (63): AlertsPage(), BalancesPage(), ConsumptionPage(), highConsumption, missingReadings, zeroConsumption, InvoiceDetailPage(), InvoicesPage() (+55 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (67): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (30): AppSidebar(), AppSidebarProps, hrefToPageKey, iconMap, pageKeyToHref, SidebarContentProps, SidebarItem(), SidebarItemProps (+22 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (17): activityColorMap, activityIconMap, ChartTooltip(), DashboardPage(), formatTime(), getAlertSummary(), getMeterStatusData(), iconMap (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (40): useIsMobile(), cn(), CardAction(), CardDescription(), CardFooter(), Separator(), Sheet(), SheetContent() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (38): mockBalances, mockWaterBalanceData, ActivityItem, Alert, AlertSeverity, AlertType, Balance, Building (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (36): geistMono, geistSans, metadata, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch() (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (40): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+32 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (13): 10) Current Frontend Status, 1) App Architecture, 2) State Management, 3) Type System and Mock Data, 5) Role-Based Access Model (Frontend), 6) UX and Interaction Capabilities, 8) Recent Stability Fixes Applied, 9) Commands for Frontend Workflow (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (14): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay() (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (34): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+26 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (11): 4) Implemented Frontend Modules and Pages, Alerts, Tickets, Support, Billing, Customers, Dashboard, Meters, Projects and Locations, Readings (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (10): scripts, build, db:generate, db:migrate, db:push, db:reset, dev, lint (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.32
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (11): createSystemMessage(), createUserMessage(), generateMessageId(), httpServer, io, joinMessage, leaveMessage, Message (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (16): __dirname, eslintConfig, __filename, __dirname, __filename, devDependencies, bun-types, eslint (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (67): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+59 more)

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (7): Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (12): PageHeader(), PageHeaderProps, pageHrefMap, parentMap, pageHrefMap, PagePlaceholder(), PagePlaceholderProps, allNavItems (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (12): ContextMenu(), ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuPortal(), ContextMenuRadioItem(), ContextMenuSeparator() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (9): agent-ctx/4-layout-builder.md, src/components/layout/AppShell.tsx, src/components/layout/AppSidebar.tsx, src/components/layout/TopNav.tsx, src/lib/mock-auth.ts, src/lib/mock-data.ts, src/lib/navigation.ts, src/lib/router-store.ts (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.52
Nodes (6): PORT, run(), sleep(), startAppServer(), stopAppServer(), waitForServer()

### Community 26 - "Community 26"
Cohesion: 0.64
Nodes (7): dev.sh script, dev.sh script, cleanup(), log_step_end(), log_step_start(), start_mini_services(), wait_for_service()

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (59): PaymentsPage(), SidebarContent(), RoleSwitcher(), TopNav(), getRoleColor(), getRoleLabel(), useAuthStore, mockCustomers (+51 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (11): devDependencies, bun-types, eslint, eslint-config-next, playwright, tailwindcss, @tailwindcss/postcss, tw-animate-css (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (22): clearToken(), getAuthHeaders(), getRefreshToken(), getToken(), hasToken(), refreshToken(), setRefreshToken(), setToken() (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 33 - "Community 33"
Cohesion: 0.60
Nodes (4): mini-services-start.sh script, mini-services-start.sh script, cleanup(), main()

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (6): API Contract Checklist (Frontend Needs), Definition of Done (Per Ticket), Meter Pulse Frontend Sprint Backlog, Ready-to-Run Developer Prompt Template, Validation Checklist (Forms), Meter Pulse Frontend

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (3): build.sh script, build.sh script, NEXT_TELEMETRY_DISABLED

### Community 36 - "Community 36"
Cohesion: 0.50
Nodes (3): start.sh script, start.sh script, cleanup()

### Community 37 - "Community 37"
Cohesion: 0.70
Nodes (3): mini-services-build.sh script, mini-services-build.sh script, main()

### Community 38 - "Community 38"
Cohesion: 0.70
Nodes (3): mini-services-install.sh script, mini-services-install.sh script, main()

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (4): Files Created, Key Decisions, Status, Task 4 - Layout Builder Work Record

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (5): FE-020: Meters + SIM cards API migration, FE-021: Meter assignment workflow hardening, FE-022: Meter replacement + termination workflow, FE-023: SIM cooldown + reuse eligibility UI, Sprint 2 - Metering Operations (2 weeks)

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (5): FE-040: Invoices API migration + state machine, FE-041: Payments allocation workflow, FE-042: Balances aging and collector tooling, FE-043: Customer statements v1, Sprint 4 - Billing and Statements (2-3 weeks)

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): 7) Frontend Quality and Validation, Build and lint, code:bash (bun run test:smoke), Full app smoke testing

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (4): FE-001: API client foundation, FE-002: React Query integration pattern, FE-003: Feature flag toggles for API migration, Sprint 0 - Foundations (1 week)

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (4): FE-010: Projects + Locations API migration, FE-011: Customers API migration, FE-012: Dashboard KPI backend wiring, Sprint 1 - Core Data Migration (1-2 weeks)

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (4): FE-030: Readings API migration, FE-031: Reading schema and business validation, FE-032: Anomaly review queue, Sprint 3 - Readings and Validation (2 weeks)

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (4): FE-050: Reports v2 with async exports, FE-051: Action-level permission gating, FE-052: Alerts -> Tickets linkage, Sprint 5 - Reports, Alerts, Support, Permissions (2 weeks)

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (4): FE-060: Contract and integration tests, FE-061: E2E coverage expansion, FE-062: Observability and UX resilience, Sprint 6 - Stabilization and Production Hardening (1-2 weeks)

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (10): scripts, build, db:generate, db:migrate, db:push, db:reset, dev, lint (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.36
Nodes (8): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationItem(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (15): HoverCard(), HoverCardContent(), HoverCardTrigger(), Progress(), RadioGroup(), RadioGroupItem(), ScrollArea(), ScrollBar() (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.36
Nodes (7): LoginPage(), AuthState, ROLES, mockUsers, User, UserRole, Label()

### Community 65 - "Community 65"
Cohesion: 0.32
Nodes (6): name, private, version, name, private, version

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (3): ResizableHandle(), ResizablePanel(), ResizablePanelGroup()

## Knowledge Gaps
- **371 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 10`, `Community 12`, `Community 15`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 27`, `Community 30`, `Community 31`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 66`, `Community 67`, `Community 68`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 19` to `Community 65`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 1` to `Community 65`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _372 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12894736842105264 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._