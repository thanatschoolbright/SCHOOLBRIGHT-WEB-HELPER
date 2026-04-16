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
```

No test suite is configured. Type-checking is implicit via TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `noUnusedLocals`).

**Path aliases** (defined in `tsconfig.json`):

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
| `health-check/` | System heartbeat & server status monitoring |
| `mobile/` | In-app notifications, app statistics, leave letters |
| `hardware/` | Canteen, facial recognition, turnstile devices |
| `backlogs/` | Project management via Backlog OAuth integration |
| `timesheet/` | Time tracking and overtime management |
| `support/` | Support ticket management |
| `admin/` | User and system administration |
| `testing/` | Load testing and bypass utilities |

### API route conventions

All internal API routes live under `src/app/api/v1/`. The pattern is:

```
/api/v1/{domain}/{resource}/{action}
```

Within each feature, files are organized by operation:

```
{feature}/create/route.ts              # POST handler
{feature}/read/route.ts                # GET handler
{feature}/service/{feature}-service.ts # Business logic & Prisma queries
{feature}/validation/{feature}-schema.ts # Zod schema
{feature}/docs/{operation}-spec.md     # API documentation (required for create/update)
```

All files and folders use **kebab-case**. API payload fields (request/response) use **snake_case**. Variables and functions use **camelCase**.

Routes proxy to the external SchoolBright backend via `src/services/api-gateway.tsx`, which handles token injection and 401-triggered refresh. Response helpers live in `src/helpers/api/response.ts` (`successResponse`, `errorResponse`). Input validation uses Zod via `src/helpers/api/validate.request.ts`.

**Authentication in API routes**: Use `await auth()` from `@/auth` to verify session. Check `session.user` for `id`, `admin_id`, `role_id`, `role_name`, and `permissions[]`.

**Standard response format**:
```json
{ "status_code": 200, "message_th": "...", "message_en": "...", "data": {} }
```

### State management

Two patterns coexist:

1. **Redux Toolkit** (`src/stores/`) — for global cross-feature state (auth, school list, server status, notifications). Slice + `createAsyncThunk` pattern. The store is configured in `src/stores/store.ts` with 25+ reducers.
2. **Zustand** — for local feature-scoped state. Store files live alongside the feature, typically in `_state/use-*-store.ts`.

### Page component pattern

Pages prefer RSC (React Server Components) — push data fetching and logic server-side. Only extract `"use client"` components for interactive elements (forms, modals, buttons). Client components that do exist pull from Redux via `useAppSelector`, use local `useState`/`useCallback` for UI state, and call internal `/api/v1/...` endpoints via `callApiService` from `src/services/api-gateway.tsx`. Sub-components in `_components/` receive handlers as props.

### UI standards

- **Component library**: Ant Design v5 only. Use `Flex`, `Row`, `Col`, `Space` for layout — no inline CSS or custom stylesheets. Support both Light and Dark mode via Ant Design tokens.
- **Notifications**: Use `toast` from `sonner` only.
- **Status dialogs**: Use `src/components/modal/status-modal-component.tsx` for success/error/confirm modals.
- **Page titles**: Use `src/components/typhography/header-bar-component.tsx` only.
- **Summary cards**: Use `src/components/card/summary-card.tsx`. Always fetch raw data server-side and compute aggregates before passing to the component — never filter on the client via table.
- **Filter sections**: 2 columns per row (`Col`/`Row`), "ค้นหา" and "ล้างการค้นหา" buttons right-aligned with icons.
- **Tables**: Wrap content in `<Card styles={{ body: { padding: 16 } }}>`. Use `<UnorderedListOutlined />` (1rem) for table headings. Add sort to all sortable columns. Never use `maxWidth` on columns.
- **Font weight**: Maximum 600.
- **Language**: All UI text must be 100% Thai — no mixing Thai and English words in labels, buttons, or toast messages (e.g., "เตรียมส่งออกข้อมูล" not "เตรียมส่งออกข้อมูล (Excel)").
- **No emojis**: Strictly forbidden in code, comments, strings, and UI.

### Authentication

NextAuth v5 with a Credentials provider (`src/auth.ts`). Supports login by email, employee code, or username (case-insensitive). Passwords are verified with bcryptjs (with plain-text fallback for legacy accounts). Account lockout: 5 failed attempts → 15-minute lockout with auto-unlock.

The session JWT carries: `id`, `admin_id`, `username`, `employee_code`, `role_id`, `role_name`, `permissions[]`, Thai/English names, position, department, phone, email, profile image, employment status, and last-login timestamp.

### Databases

Two Prisma instances (singleton pattern, global cached in dev):

| Helper | DB | Schema | Models |
|---|---|---|---|
| `src/helpers/prisma.ts` | SQL Server (main) | `prisma/schema.prisma` | 400+ models — school, canteen, hardware, device, sales |
| `src/helpers/prisma-timesheet.ts` | PostgreSQL (timesheet) | `prisma/timesheet/schema.prisma` | User, Department, Position, Role, Permission, RolePermission, Project, Feature, ProjectAssignee, ProjectStatus, Group, TimesheetEntry, Overtime, OvertimeDescription, OvertimeStatusLog, ApiLog, CrmSupportAuthentication |

**Import pattern — สำคัญมาก, สองแบบนี้ต่างกัน:**
```ts
// Timesheet DB — named export (capital P)
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
await PrismaTimesheet.overtime.findMany({ ... });

// Main DB — default export
import prisma from "@helpers/prisma";
await prisma.userList.findMany({ ... });
```

Use `$transaction` when writing to multiple tables. Never mix models across instances (timesheet models do not exist in main DB and vice versa).

### Key services

| File | Purpose |
|---|---|
| `src/services/api-gateway.tsx` | Main API proxy, handles auth headers + token refresh |
| `src/services/api-url.tsx` | Centralized endpoint URL constants |
| `src/services/canteen-api.ts` | Hardware canteen device API |
| `src/helpers/logger.server.ts` | Winston server-side logging |
| `src/helpers/api-log.helper.ts` | Request/response logging middleware |

The gateway reads `school_id`, `user_id`, and `token` from the Redux store and injects a custom header (`JabjaiKey-{school_id}-{user_id}`). On 401, it auto-refreshes the token and retries the original request.

### Localization

i18next + next-intl with Thai as primary language. Locale files in `src/locales/`. Config at `config/next-i18next.config.js`.

### Notable constraints

- Console logs are stripped in production builds (except `error`/`warn`), configured in `next.config.mjs`.
- File uploads go to Huawei OBS (`esdk-obs-nodejs`); image remote pattern is configured in `next.config.mjs`.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — TypeScript errors surface during development, not at build time.
- The `BYPASS_USER_ID = "49"` constant in the timesheet/overtime page identifies the sole user with OT approval rights. This check **must** be enforced both on the frontend and at the API layer (`src/app/api/v1/timesheet/overtime/change-status/route.ts`) using `await auth()`.
- Never delete or overwrite existing functions — only extend or add alongside them.
- Use Axios for all HTTP calls (not `fetch`).
- Write a Thai-language comment above every function describing its purpose (no emojis in comments).
- Every Create/Update API route requires a `docs/{operation}-spec.md` documenting purpose, request/response schema, and key business logic notes.
