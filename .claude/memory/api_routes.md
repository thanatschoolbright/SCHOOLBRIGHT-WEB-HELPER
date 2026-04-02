---
name: API Routes Map
description: Complete map of 170+ API routes organized by feature area and version
type: project
---

## API Versioning Pattern
- **v1**: Feature APIs (majority)
- **v2**: Admin management, server status, hardware check
- **v3**: Authentication only

## Authentication
- `/api/auth/[...nextauth]/` — NextAuth callback
- `/api/v1/authentication/refresh-token/`
- `/api/v1/admin/authentication/sign-in/`
- `/api/v2/authentication/sign-in/`
- `/api/v3/authentication/sign-in/`

## Admin Management
### v1
- `/api/v1/admin/user/` — CRUD + route
- `/api/v1/admin/user/read/[id]/`
- `/api/v1/admin/user/constants/position/`

### v2
- `/api/v2/admin/department-management/` — CRUD, seed
- `/api/v2/admin/position-management/` — CRUD, seed
- `/api/v2/admin/permission-management/` — CRUD, seed
- `/api/v2/admin/role-management/` — CRUD
- `/api/v2/admin/user-management/` — CRUD, detail, export, upload, sync, reset-password, bulk-update, unlock

## AI Services
- `/api/v1/ai/chatgpt/summarize/`
- `/api/v1/ai/gemini/chat/`
- `/api/v1/ai/gemini/summarize/`
- `/api/v1/ai/gemini/auto-category/`
- `/api/v1/ai/gemini/chat/cancel-sales/`

## Backlog / Project Management
- `/api/v1/backlog/projects/` — list, create, metadata, milestones
- `/api/v1/backlog/issues/` — list, create, update, bulk-update, timeline
- `/api/v1/backlog/issues/[issueKey]/attachments/[attachmentId]/`
- `/api/v1/backlog/statuses/`, `/api/v1/backlog/project-statuses/`
- `/api/v1/backlog/priorities/`
- `/api/v1/backlog/issue-types/`
- `/api/v1/backlog/users/`
- `/api/v1/backlog/oauth/token/`
- `/api/v1/backlog/dashboard/analytics/`

## Hardware
- `/api/v1/hardware/canteen/` — application, version, check, create, update, delete, export
- `/api/v1/hardware/check-online/`, `/api/v1/hardware/check-offline/`
- `/api/v1/hardware/register-device/`
- `/api/v1/hardware/facial/scan/`
- `/api/v1/hardware/facial/scan/scan-light/`
- `/api/v2/hardware/check-device-status/`

## Health Check
- `/api/v1/health-check/server/heartbeats/` — read, create, update, discord notify
- `/api/v1/health-check/server/system/` — status, export
- `/api/v1/health-check/version-control/`
- `/api/v1/health-check/transaction-log/payment-slip/list/`

## Integrations
- `/api/v1/integrations/discord/push/`
- `/api/v1/integrations/discord/push-release/`
- `/api/v1/integrations/discord/deploy-automate-report/`
- `/api/v1/integrations/discord/check-deployment-status/`
- `/api/v1/integrations/discord/workflow-run/`
- `/api/v1/line-chat/`

## Logging
- `/api/v1/logger/create/`
- `/api/v1/logger/[id]/`
- `/api/v1/logger/[id]/archive/`
- `/api/v1/logger/example/`
- `/api/v1/logger/test/`
- `/api/v1/logger/find-service/`
- `/api/v1/logger/search/`
- `/api/v1/logger/search-example/`

## Mobile App
- `/api/v1/mobile/check-in-attendance/`
- `/api/v1/mobile/check-in-subject/`
- `/api/v1/mobile/leave-letter/` — read, create, update
- `/api/v1/mobile/notification/` — today, week, read-message
- `/api/v1/mobile/qrcode-health-check/`
- `/api/v1/mobile/statistic/`

## School
- `/api/v1/school/` — list, detail, user info

## Server Status
- `/api/v1/server/status/`
- `/api/v2/server/status/`

## Support
- `/api/v1/support/bypass/`
- `/api/v1/support/cancel-sales/`
- `/api/v1/support/check-nfc/`

## Testing
- `/api/v1/load-test/`

## Timesheet
- `/api/v1/timesheet/entry/` — CRUD, check, condition, automate-fill, delete
- `/api/v1/timesheet/project/` — CRUD, stats, timeline, status management
- `/api/v1/timesheet/project/sub-project/` — CRUD, search, assignee
- `/api/v1/timesheet/migration/` — CRUD, automate
- `/api/v1/timesheet/overtime/` — CRUD, analytics, export, email, upload
- `/api/v1/timesheet/report/capturable-report/`
- `/api/v1/timesheet/report/capturable-details/`
- `/api/v1/timesheet/report/timeline-chart/`
- `/api/v1/timesheet/excel/template_[1-4]/`
- `/api/v1/timesheet/find-ranking/`
- `/api/v1/timesheet/my-work/`
- `/api/v1/timesheet/department/list/`
- `/api/v1/timesheet/timeline/`
- `/api/v1/timesheet/calculate-summary-month/`

## Mailer
- `/api/v1/mailer/timesheet/notify-missing/`

## Misc
- `/api/v1/proxy/image/`
- `/api/docs/`
- `/api/version/`
- `/api/v2/profile/change-password/`
