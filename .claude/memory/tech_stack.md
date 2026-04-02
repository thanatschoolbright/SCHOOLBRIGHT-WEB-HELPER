---
name: Tech Stack
description: Full technology stack, key dependencies, and architecture for SchoolBright Web Helper
type: project
---

## Core Framework
- **Next.js**: 16.2.1 (App Router, Turbopack primary / Webpack fallback)
- **React**: 19.2.4
- **TypeScript**: 5.x
- **Node**: 22.9.0 (ESM module)

## UI & Styling
- **Ant Design**: 5.27.3
- **Tailwind CSS** (config in `config/tailwind.config.ts`)
- **Framer Motion**: 12.4.10
- **React Icons**: 5.5.0

## Database & ORM
- **Prisma**: 6.8.2
- **Database**: SQL Server (400+ models)
- **Output**: `generated/prisma`
- **Dual config**: `prisma/` (main) + `prisma-master/` (secondary)
- **Prisma helpers**: `src/helpers/prisma.ts`, `src/helpers/prisma-timesheet.ts`

## Auth
- **NextAuth**: v5 beta.30
- Config: `auth.ts`, `auth.config.ts`
- Middleware: disabled (`middleware.ts.disabled`)

## State Management
- **Redux Toolkit**: 2.2.7 + Redux Thunk
- **Zustand**: 5.0.12
- **React Redux**: 9.1.2
- Store: `src/stores/store.ts`, `src/stores/store-provider.tsx`

## HTTP / API
- **Axios**: 1.7.7
  - Main instance: `src/services/axios-instance/sb-helper.axios.ts`
  - Refresh token: `src/services/axios-instance/sb-refresh-token.axios.ts`
- **API Gateway**: `src/services/api-gateway.tsx`
- **API Docs**: swagger-jsdoc + @scalar/api-reference-react 0.8.6

## AI Integration
- **ChatGPT**: `/api/v1/ai/chatgpt/`
- **Gemini**: `/api/v1/ai/gemini/`
- AI Chat Widget: `src/components/ai-chat-widget/`

## Data Export
- **ExcelJS**: 4.4.0
- **jsPDF**: 4.0.0 + jspdf-autotable + html2canvas 1.4.1
- **docx**: 9.5.1
- **XLSX**: via CDN

## Charts / Visualization
- **Chart.js**: 4.5.0 + react-chartjs-2
- **@ant-design/plots**: 2.6.6

## i18n
- **i18next**: 23.15.1
- **next-intl**: 3.20.0
- Language: Thai + English

## Validation
- **Zod**: 4.1.5
- **AJV**: 8.17.1

## Notifications / Alerts
- **Sonner**: 2.0.7 (toast)
- **SweetAlert2**: 11.21.2

## Date / Time
- **dayjs**: 1.11.18

## External Storage
- **Huawei OBS**: esdk-obs-nodejs 3.25.6
- Service: `src/services/backend/huawei/obs.service.ts`
- Client service: `src/services/huawei-bucket-storage.service.ts`

## Email
- **Nodemailer**: 7.0.10
- Mailer API: `/api/v1/mailer/`

## Security
- **bcryptjs**: 3.0.3

## Logging
- **Winston**: 3.18.3
- Server logger: `src/helpers/logger.server.ts`
- Client logger: `src/helpers/logger.ts`
- API log middleware: `src/helpers/api-log.middleware.ts`

## Integrations
- **Discord**: `/api/v1/integrations/discord/`
- **LINE Chat**: `/api/v1/line-chat/`
- **Kubernetes**: `kubernetes.kubeconfig`

## Dev Tools
- ESLint (eslint.config.js)
- PostCSS
- Terser
- TypeScript ESLint

## Build Scripts
```
dev              → next dev --turbopack
dev-webpack      → next dev --webpack
build            → next build
start            → next start
lint             → eslint .
tailwind         → tailwindcss -c config/tailwind.config.ts
bun-benchmark    → bash benchmark-build.sh
```

## next.config.mjs Highlights
- Strict Mode: enabled
- Image formats: AVIF/WebP, remote patterns for Huawei OBS
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Console removal in production
- Server actions body limit: 5mb
- TypeScript build errors: ignored
