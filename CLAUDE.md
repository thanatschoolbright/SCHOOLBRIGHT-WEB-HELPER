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

No test suite is configured. Type-checking is implicit via TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`).

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

Routes proxy to the external SchoolBright backend via `src/services/api-gateway.tsx`, which handles token injection and 401-triggered refresh. Response helpers live in `src/helpers/api/response.ts` (`successResponse`, `errorResponse`). Input validation uses Zod via `src/helpers/api/validate.request.ts`.

**Authentication in API routes**: Use `await auth()` from `@/auth` to verify session. Check `session.user` for `id`, `admin_id`, `role_id`, `role_name`, and `permissions[]`.

### State management

Two patterns coexist:

1. **Redux Toolkit** (`src/stores/`) — for global cross-feature state (auth, school list, server status, notifications). Slice + `createAsyncThunk` pattern. The store is configured in `src/stores/store.ts` with 25+ reducers.
2. **Zustand** — for local feature-scoped state. Store files live alongside the feature, typically in `_state/use-*-store.ts`.

### Page component pattern

Pages are large client components (`"use client"`) that own all the feature logic. They pull from Redux via `useAppSelector`, use local `useState`/`useCallback` for UI state, and call internal `/api/v1/...` endpoints via `src/services/api-gateway.tsx` (`callApiService`). Sub-components in `_components/` receive handlers as props.

### Authentication

NextAuth v5 with a Credentials provider (`src/auth.ts`). The session JWT carries `id`, `admin_id`, `role_id`, `role_name`, `permissions`, and profile fields. Account lockout: 5 failed attempts → 15-minute lockout with auto-unlock.

### Databases

Two Prisma instances:
- `src/helpers/prisma.ts` — main SQL Server DB
- `src/helpers/prisma-timesheet.ts` — separate timesheet SQL Server DB

Prisma client output is at `/generated/prisma` (main) and `/generated/prisma-timesheet/` (timesheet).

### Key services

| File | Purpose |
|---|---|
| `src/services/api-gateway.tsx` | Main API proxy, handles auth headers + token refresh |
| `src/services/api-url.tsx` | Centralized endpoint URL constants |
| `src/services/canteen-api.ts` | Hardware canteen device API |
| `src/helpers/logger.server.ts` | Winston server-side logging |
| `src/helpers/api-log.helper.ts` | Request/response logging middleware |

### Localization

i18next + next-intl with Thai as primary language. Locale files in `src/locales/`. Config at `config/next-i18next.config.js`.

### Notable constraints

- Console logs are stripped in production builds (except `error`/`warn`), configured in `next.config.mjs`.
- File uploads go to Huawei OBS (configured via `esdk-obs-nodejs`).
- The `BYPASS_USER_ID = "49"` constant in the timesheet/overtime page identifies the sole user with OT approval rights. This check **must** be enforced both on the frontend and at the API layer (`src/app/api/v1/timesheet/overtime/change-status/route.ts`) using `await auth()`.
