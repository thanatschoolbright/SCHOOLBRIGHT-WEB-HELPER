---
name: Components & Services Map
description: Key components, services, hooks, stores structure for quick navigation
type: project
---

## Custom Hooks (src/hooks/)
- `use-auth.ts` — authentication state & login
- `use-dark-mode.ts` — dark mode toggle
- `use-has-permission.ts` — role-based permission check
- `use-timesheet-data.ts` — timesheet data management

## Services (src/services/)
### Axios Instances
- `axios-instance/sb-helper.axios.ts` — main instance
- `axios-instance/sb-refresh-token.axios.ts` — token refresh interceptor

### API Config
- `api-gateway.tsx` — main gateway
- `api-header.ts`, `api-url.tsx`, `api-method.tsx`, `api-log.ts`

### Backend Services
- `backend/huawei/obs.service.ts` — Huawei OBS storage
- `backend/timesheet/entry.service.ts` — timesheet entry
- `backend/timesheet/project.service.ts` — timesheet project
- `backend/timesheet/summary.service.ts` — timesheet summary
- `backend/timesheet/overtime/*.ts` — overtime
- `backend/server-status/export-server-status.report.service.ts`
- `backend/api-log/api-log.service.ts`
- `backend/user-management/legacy-user.service.ts`

### Client Services
- `timesheet/find-ranking.service.ts`
- `timesheet/my-work.service.ts`
- `overtime/overtime.service.ts`
- `canteen-api.ts`
- `huawei-bucket-storage.service.ts`
- `progressive-web-app.ts`

## State (src/stores/)
- `store.ts` — Redux store config
- `store-provider.tsx` — Redux provider
- `api-log.reducer.ts`

### Redux Slices/Actions by Module
- `authentication/` — login, admin login, token refresh
- `hardware/` — device status, canteen
- `health-check/` — heartbeats, version control
- `mobile/` — leave letters, notifications, stats
- `school/` — school list/user
- `server/` — server status
- `support/` — bypass token, school list
- `timesheet/project/` — CRUD
- `k6/` — load testing
- `issues-slice.ts`, `timesheet-slice.ts`

## Key Components (src/components/)
### Layouts
- `layouts/auth-layout.tsx`
- `layouts/permission-layout.tsx`
- `layouts/backend/` (content, dashboard-header, task-overview, time-chart)

### Providers
- `providers/auth-provider.tsx`
- `providers/i18n-provider.tsx`
- `providers/school-list-provider.tsx`
- `providers/force-logout-provider.tsx`
- `providers/chartjs-provider.tsx`
- `providers/storage-provider.tsx`

### Tables
- `table/base-table-component.tsx`
- `table/minimal-table-component.tsx`
- `table/timesheet-table.tsx`

### Modals
- `modal/modal-component.tsx`
- `modal/delete-confirmation-modal.tsx`
- `modal/ai-processing-modal.tsx`
- `modal/timesheet-export-modal-template4.tsx`

### Input Fields
- `input-field/date-picker-component.tsx`
- `input-field/searchable-select-component.tsx`
- `input-field/school_id/reuse-dropdown-school-component.tsx`

### Misc
- `ai-chat-widget/ai-chat-widget.tsx`
- `navbar.tsx`
- `language-switcher.tsx`
- `button/timesheet-actions.tsx`

## Helpers (src/helpers/)
- `api/` — response handling, validation, logging, curl conversion
- `controller/` — param validation, error handling, pagination, date format
- `local_storage/` — user, project, sub-project client storage
- `project/` — project utilities, code conversion
- `scripts/` — load testing, auth, login testing
- `prisma.ts` — DB connection
- `prisma-timesheet.ts` — timesheet DB
- `logger.server.ts` — server logging
- `api-log.middleware.ts` — API log middleware
- `call-with-logging.ts` — logged API call wrapper
