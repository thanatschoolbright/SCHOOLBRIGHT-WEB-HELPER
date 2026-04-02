---
name: Project Overview
description: What SchoolBright Web Helper is, its purpose, key structure, and major features
type: project
---

SchoolBright Web Helper เป็น **back-office administrative dashboard** สำหรับทีม Developer/Support ของ SchoolBright ใช้จัดการระบบโรงเรียน ไม่ใช่ end-user tool

**Why:** แก้ pain point ทีม dev/support ให้จัดการ health check, mobile app, hardware, และ load testing ได้โดยไม่ต้องเข้าถึง production โดยตรง

**How to apply:** เวลา suggest feature/change ให้ frame ในแง่ developer/support workflow ไม่ใช่ student/teacher UX

## Key Details
- **Repo**: SCHOOLBRIGHT-WEB-HELPER
- **Branch**: release/production
- **Version**: 2.4.45
- **Language**: Thai + English (i18n via i18next + next-intl)
- **Deployment**: Vercel-compatible
- **Node**: 22.9.0
- **Type**: ESM module

## Source Structure
```
src/
  app/           → Next.js App Router pages + 170+ API routes
  components/    → Reusable UI components
  services/      → API integrations (gateway, axios, timesheet, OBS, etc.)
  helpers/       → Utility functions (api, controller, scripts, logging, etc.)
  hooks/         → Custom React hooks (4 hooks)
  stores/        → Redux Toolkit + Zustand state
  types/         → TypeScript type definitions
prisma/          → SQL Server schema (400+ models)
generated/       → Auto-generated Prisma client
config/          → Tailwind, ESLint configs
```

## Major Feature Areas

### 1. Health Check & Monitoring
- Pages: `/health-check/` (server status, heartbeats, online/offline sync, version control)
- APIs: `/api/v1/health-check/`, `/api/v2/server/status/`

### 2. Mobile App Management
- Pages: `/mobile/` (attendance, leave-letter, notification, qrcode, statistic)
- APIs: `/api/v1/mobile/`

### 3. Hardware Integration
- Pages: `/hardware/canteen/`
- APIs: `/api/v1/hardware/` (canteen, device check, facial scan)

### 4. Load/Rank Testing
- Pages: `/testing/load-test/`, `/testing/rank-test/`
- APIs: `/api/v1/load-test/`

### 5. Timesheet Management
- Pages: `/timesheet/` (entry, project, overtime, all/report)
- APIs: `/api/v1/timesheet/` (entry, project, sub-project, overtime, excel, reports)

### 6. Admin Management
- Pages: `/admin/` (user-profile, department, position, permission)
- APIs: `/api/v1/admin/`, `/api/v2/admin/`

### 7. Backlog/Project Management
- Pages: `/backlogs/` (projects, issues, milestones, report)
- APIs: `/api/v1/backlog/`

### 8. API Logging
- Pages: `/logger/api-log/`
- APIs: `/api/v1/logger/`

### 9. Support Tools
- Pages: `/support/bypass/`, `/support/test/cancel-sales/`, `/support/test/nfc/`
- APIs: `/api/v1/support/`

### 10. Integrations
- Discord notifications: `/api/v1/integrations/discord/`
- LINE Chat: `/api/v1/line-chat/`
- AI (ChatGPT + Gemini): `/api/v1/ai/`
- Email: `/api/v1/mailer/`
- Huawei OBS Storage: `src/services/backend/huawei/obs.service.ts`

## Authentication
- NextAuth v5 (beta.30) — `auth.ts`, `auth.config.ts`
- Multiple sign-in versions: v1, v2, v3 APIs
- Middleware: `middleware.ts.disabled` (currently disabled)
- Role-based permission: `use-has-permission.ts` hook

## API Versioning
- v1: Main feature APIs (170+ routes)
- v2: Admin management, server status, hardware check
- v3: Authentication
