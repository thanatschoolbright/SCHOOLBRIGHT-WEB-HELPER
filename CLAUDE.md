# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev           # Dev server with Turbopack (default)
bun dev-webpack   # Dev server with Webpack

# Production
bun build
bun start

# Code quality
bun lint          # ESLint

# Misc
bun bun-benchmark # Build benchmark via benchmark-build.sh

# Prisma — three separate schemas, must target each explicitly
bunx prisma generate                                                         # Main DB (SQL Server)
bunx prisma generate --schema=prisma/timesheet/schema.prisma                # Timesheet DB (PostgreSQL)
bunx prisma generate --schema=prisma/jabjai-master-single-db/schema.prisma  # Jabjai-master DB (SQL Server)

bunx prisma migrate dev --schema=prisma/timesheet/schema.prisma             # Run/create migrations (timesheet only — main DB uses db push)
bunx prisma db push                                                          # Sync main DB schema without migrations
bunx prisma studio --schema=prisma/timesheet/schema.prisma                  # Browse timesheet DB
```

No test suite is configured. Type-checking is implicit via TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `noUnusedLocals`). Note: `typescript.ignoreBuildErrors: true` — TS errors surface during dev, not at build time.

## Slash Commands

Project-specific scaffolding commands in `.claude/commands/`:

| Command | Purpose |
|---|---|
| `/new-feature` | Scaffold a full feature page (frontend + backend) |
| `/new-api` | Create a single API endpoint with service, schema, and spec doc |
| `/export-feature` | Add Excel/PDF export to an existing table |
| `/db-query` | Generate a typed Prisma query with Thai comments |
| `/review-feature` | Audit a feature against project standards |
| `/commit` | Create a git commit in the project's Thai-language format |

## Path Aliases (defined in `tsconfig.json`)

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@api/*` | `src/app/api/*` |
| `@services/*` | `src/services/*` |
| `@stores/*` | `src/stores/*` |
| `@helpers/*` | `src/helpers/*` |
| `@hooks/*` | `src/hooks/*` |
| `@types/*` | `src/types/*` |
| `@constants/*` | `src/constants/*` |
| `@config/*` | `config/*` |
| `@locales/*` | `src/locales/*` |
| `@data/*` | `src/data/*` |

## Architecture

This is a **Next.js 16 (App Router) back-office admin tool** for SchoolBright, covering system health monitoring, hardware integration (canteen/facial recognition/gates), mobile app management, HR timesheets, and project backlog tracking.

### Feature areas under `src/app/`

| Directory | Purpose |
|---|---|
| `main/` | Dashboard / home page |
| `health-check/` | System heartbeat & server status monitoring |
| `mobile/` | In-app notifications, app statistics, leave letters |
| `hardware/` | Canteen, facial recognition, turnstile devices |
| `backlogs/` | Project management via Backlog OAuth integration |
| `timesheet/` | Time tracking and overtime management |
| `support/` | Support ticket management |
| `admin/` | User, role, department, position management + OT admin |
| `testing/` | Load testing and bypass utilities |
| `logger/` | API log viewer (wraps `/api/v1/logger/*`) |
| `backend/` | Internal server-to-server utilities |
| `profile/` | User profile and password change |
| `ant/` | Ant Design theme token API (serves theme config to client) |
| `api-spec/` | Interactive Swagger UI at `/api-spec` |
| `docs/` | Static documentation pages |

### API route conventions

API routes are versioned under `src/app/api/`:

- **`v1/`** — primary internal routes (timesheet, backlog, hardware, mobile, health-check, admin, support, ai, integrations/discord, logger, mailer, load-test, school, proxy, application/line, etc.)
- **`v2/`** — newer routes (admin user/role/department/position management, hardware device status, server status, authentication v2, profile)
- **`v3/`** — latest authentication endpoint

URL pattern: `/api/{version}/{domain}/{resource}/{action}`

Within each feature, files are organized by operation:

```
{feature}/create/route.ts              # POST handler
{feature}/read/route.ts                # GET handler
{feature}/service/{feature}-service.ts # Business logic & Prisma queries
{feature}/validation/{feature}-schema.ts # Zod schema
{feature}/docs/{operation}-spec.md     # Required for create/update routes
```

All files and folders use **kebab-case**. API payload fields (request/response) use **snake_case**. Variables and functions use **camelCase**.

**Authentication in API routes**: Use `await auth()` from `@/auth` to verify session. Check `session.user` for `id`, `admin_id`, `role_id`, `role_name`, and `permissions[]`.

**Standard response format**:
```json
{ "status_code": 200, "message_th": "...", "message_en": "...", "data": {} }
```

Response helpers: `successResponse` / `errorResponse` from `src/helpers/api/response.ts`.

### API helper utilities (`src/helpers/controller/`)

Use these in route handlers instead of writing custom logic:

| File | Function | Purpose |
|---|---|---|
| `handle-error.params.ts` | `handleError(err, context?)` | Catches unknown errors → returns `NextResponse` with correct status code + Thai message |
| `build-pagination.params.ts` | `buildPagination(offset, limit, total)` | Returns `{ page, page_size, total, total_pages }` |
| `validate.params.ts` | `validateParams(schema, body)` | Zod parse + throws `{ status: 400, validationErrors }` on failure |
| `safe-parse.params.ts` | `safeParseRequestBody(request)` | `request.json()` with empty-object fallback |
| `format-date.params.ts` | `formatDate(date)` | Any date → ISO string or `null` |

Input validation uses Zod via `src/helpers/api/validate.request.ts`. Use `validateRequest(request, schema)` in route handlers — it parses the body and returns `{ error: NextResponse }` on failure or `{ data: T }` on success. The `validate.params.ts` / `safe-parse.params.ts` helpers in `helpers/controller/` are lower-level utilities; prefer `validateRequest` at the route layer.

### State management

Two patterns coexist:

1. **Redux Toolkit** (`src/stores/`) — for global cross-feature state (auth, school list, server status, notifications). Slice + `createAsyncThunk` pattern. The store is configured in `src/stores/store.ts` with 25+ reducers.
2. **Zustand** — for local feature-scoped state. Store files live alongside the feature in `_state/use-*-store.ts`.

### Page component pattern

Pages prefer RSC (React Server Components) — push data fetching and Prisma queries server-side to minimize client JS bundle. Only extract `"use client"` components for interactive elements (forms, modals, buttons with event handlers). Client components pull from Redux via `useAppSelector`, use local `useState`/`useCallback` for UI state, and call internal API endpoints via `callApiService` from `src/services/axios-instance/sb-helper.axios.ts`. Sub-components in `_components/` receive handlers as props.

All pages must be wrapped in `<BackendLayout>` from `@components/layouts/backend-layout`.

Feature frontend layout:
```
src/app/{domain}/{feature}/
├── page.tsx                   # Orchestrator (RSC or client)
├── _components/               # Feature-scoped components
├── _state/
│   └── use-{feature}-store.ts # Zustand store (preferred location)
├── _stores/                   # Alternative Zustand store location (some features)
└── _api/
    └── {feature}-service.ts   # callApiService wrapper
```

### UI standards

- **Component library**: Ant Design v5 only. Use `Flex`, `Row`, `Col`, `Space` for layout — no inline CSS or custom stylesheets. Support both Light and Dark mode via Ant Design tokens.
- **Notifications**: Use `toast` from `sonner` only.
- **Status dialogs**: Import from `@/components/modal/status-modal` (component file: `src/components/modal/status-modal-component.tsx`). Types: `"success" | "error" | "confirm" | "delete"`. Key props: `open`, `type`, `title?`, `message?`, `onClose`, `onConfirm?`, `loading?`, `confirmLabel?`, `cancelLabel?`.
- **Page titles**: Use `src/components/typhography/header-bar-component.tsx` only.
- **Summary cards**: Use `src/components/card/summary-card.tsx` (`title`, `value`, `unit?`, `subtitle?`, `icon?`, `color?`, `tooltip?`, `suffix?`, `isLoading?`). Always fetch raw data server-side and compute aggregates before passing to the component — never filter on the client via table.
- **Filter sections**: Heading "ตัวกรอง" uses `<FilterOutlined />` (`fontSize: 1rem, fontWeight: 600`) with `marginBottom: 16px`. Layout is 2 columns per row (`Col`/`Row`). "ค้นหา" and "ล้างการค้นหา" buttons right-aligned with icons.
- **Tables**: Wrap content in `<Card styles={{ body: { padding: 16 } }}>`. Use `<UnorderedListOutlined />` (1rem) for table headings. Action buttons (bulk actions, export, etc.) go top-right of the table section. Add sort to all sortable columns. Never use `maxWidth` on columns.
- **Font weight**: Maximum 600.
- **Dates**: Use `dayjs` for all date manipulation and formatting — it is the project standard.
- **Charts**: Use `@ant-design/plots` (preferred) or `react-chartjs-2` / `chart.js` for data visualizations.
- **Export**: Use `exceljs` for Excel, `jspdf` + `jspdf-autotable` for PDF, `docx` for Word, and `file-saver` to trigger browser downloads.
- **Naming**: Use full, descriptive identifiers — `requestUserByID` not `req`, `responseOvertimeList` not `res`. Write one Thai-language comment above every function (no emojis in comments).
- **Language**: All UI text must be 100% Thai — no mixing Thai and English words in labels, buttons, or toast messages.
- **No emojis**: Strictly forbidden in code, comments, strings, and UI. Exception: commit messages use `✨` prefix only.

### Authentication

NextAuth v5 with a Credentials provider (`src/auth.ts`). Supports login by email, employee code, or username (case-insensitive). Passwords are verified with bcryptjs (with plain-text fallback for legacy accounts). Account lockout: 5 failed attempts → 15-minute lockout with auto-unlock.

The session JWT carries: `id`, `admin_id`, `username`, `employee_code`, `role_id`, `role_name`, `permissions[]`, Thai/English names, position, department, phone, email, profile image, employment status, and last-login timestamp.

### Databases

Two Prisma instances (singleton pattern, global cached in dev):

| Helper | DB | Schema | Models |
|---|---|---|---|
| `src/helpers/prisma.ts` | SQL Server (main) | `prisma/schema.prisma` | 400+ models — school, canteen, hardware, device, sales |
| `src/helpers/prisma-timesheet.ts` | PostgreSQL (timesheet) | `prisma/timesheet/schema.prisma` | User, Department, Position, Role, Permission, RolePermission, Project, Feature, ProjectAssignee, ProjectStatus, Group, TimesheetEntry, Overtime, OvertimeDescription, OvertimeStatusLog, ApiLog, CrmSupportAuthentication, LineGroup |
| `src/helpers/prisma/prisma-jabjai-master-single-db.ts` | SQL Server (jabjai-master) | `prisma/jabjai-master-single-db/schema.prisma` | School/group master data (used by machine-monitoring LINE channel and LINE group routes) |

**Import pattern — สำคัญมาก, สามแบบนี้ต่างกัน:**
```ts
// Timesheet DB — named export (capital P)
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
await PrismaTimesheet.overtime.findMany({ ... });

// Main DB — default export
import prisma from "@helpers/prisma";
await prisma.userList.findMany({ ... });

// Jabjai-master DB — named export
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
await PrismaJabjaiMaster.someModel.findMany({ ... });
```

Use `$transaction` when writing to multiple tables. Never mix models across instances (timesheet models do not exist in main DB and vice versa).

### Key services

| File | Purpose |
|---|---|
| `src/services/api-gateway.tsx` | `callBackendAPI` — calls external SchoolBright backend; injects `JabjaiKey-{school_id}-{user_id}` header, handles 401 + auto-retry |
| `src/services/axios-instance/sb-helper.axios.ts` | `callApiService` — Axios instance for client→internal Next.js API routes; logs every request to `/api/v1/logger/create` |
| `src/services/api-url.tsx` | Centralized `API_URL` constants (reads from `NEXT_PUBLIC_*` env vars) |
| `src/services/canteen-api.ts` | Hardware canteen device API |
| `src/services/line/line-push.service.ts` | LINE Messaging API — push/broadcast messages, cron device-status reports, webhook event handling |
| `src/helpers/logger.server.ts` | Winston server-side logging |
| `src/helpers/api-log.helper.ts` | Request/response logging middleware |

**Two distinct HTTP clients — do not mix them:**
- `callApiService` (from `@services/axios-instance/sb-helper.axios`) — for client components calling `/api/v*/*` routes within this app
- `callBackendAPI` (from `@services/api-gateway`) — for server-side calls to external SchoolBright backend services

Use Axios for all HTTP calls — not `fetch`. Exception: the logger's axios interceptor itself uses `fetch` to post to `/api/v1/logger/create` to avoid circular calls.

### Permission system

**Frontend:**
```ts
const { can, isAdmin } = useHasPermission();   // src/hooks/use-has-permission.ts
can("PERMISSION_CODE")        // single check
can(["CODE_A", "CODE_B"])     // OR logic
```
- `isAdmin` is `true` when `session.user.admin_id === 117` — bypasses all permission checks.
- Use named constants from `src/constants/permission.constant.ts` (`PERMISSIONS.MENU_HEALTH_CHECK`, etc.) — pattern is `{module}.{resource}.{action}`.

**API routes:**
```ts
const session = await auth();
const permissions: string[] = (session?.user as any)?.permissions || [];
```

**Hardcoded IDs (do not remove):**
- `admin_id === 117` → super admin, bypasses all permissions
- `user_id === "49"` → sole OT approver (checked in overtime change-status route and page)

### Localization

i18next + next-intl with Thai as primary language. Locale files in `src/locales/`. Config at `config/next-i18next.config.js`.

### AI integration

Gemini and ChatGPT are available via internal API routes:
- `POST /api/v1/ai/gemini/chat` — general Gemini chat
- `POST /api/v1/ai/gemini/summarize` — text summarization
- `POST /api/v1/ai/gemini/auto-category` — auto-categorize support tickets
- `POST /api/v1/ai/chatgpt/summarize` — ChatGPT summarization
- `POST /api/v1/timesheet/entry/automate-fill` — AI-assisted timesheet entry fill (Gemini or ChatGPT)

These routes proxy to Google Generative AI / OpenAI — API keys are in env vars.

Swagger/OpenAPI spec is auto-generated from `/src/app/api` and served at `/api-doc` (OpenAPI 3.1.0 with bearer auth, via `lib/swagger.ts`).

### LINE integration

LINE Messaging API routes under `src/app/api/v1/application/line/`:

- `POST /api/v1/application/line/webhook` — receives LINE webhook events; validates HMAC-SHA256 signature before processing
- `POST /api/v1/application/line/cron-report` — cron-triggered; pushes device-status summary to LINE groups (no Authorization header required — called by cron only)
- `GET/POST /api/v1/application/line/groups` — manage LINE group registrations

Business logic lives in `src/services/line/line-push.service.ts`. The legacy `src/app/api/v1/line-chat/route.ts` handles raw webhook echoing (deprecated path — new logic uses `application/line/webhook` above).

### Notable constraints

- Console logs are stripped in production builds (except `error`/`warn`), configured in `next.config.mjs`.
- Server Actions body size limit is **5mb** (`experimental.serverActions.bodySizeLimit`).
- File uploads go to Huawei OBS (`esdk-obs-nodejs`); image remote pattern is configured in `next.config.mjs` and restricts image optimization to OBS domain.
- The `BYPASS_USER_ID = "49"` constant in the timesheet/overtime page identifies the sole user with OT approval rights. This check **must** be enforced both on the frontend and at the API layer (`src/app/api/v1/timesheet/overtime/change-status/route.ts`) using `await auth()`.
- Never delete or overwrite existing functions — only extend or add alongside them.
- Write a Thai-language comment above every function describing its purpose (no emojis in comments).
- Every Create/Update API route requires a `docs/{operation}-spec.md` documenting purpose, request/response schema, and key business logic notes.

### Commit message format

```
✨ ระบบ {SystemName} : {Thai description} ({รายการไฟล์ที่แก้ไข})
```

File list categories: `หน้าที่แก้ไข` for `src/app/` pages, `API ที่แก้ไข` for `src/app/api/`, `ไฟล์ที่แก้ไข` for services/helpers/stores. If more than 3 items per category, summarize as `และไฟล์ที่เกี่ยวข้อง`. Use `/commit` to generate this automatically.
