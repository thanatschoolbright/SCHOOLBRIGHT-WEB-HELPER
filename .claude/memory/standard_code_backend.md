---
name: Backend API Standard (3-Tier Flat Pattern)
description: โครงสร้าง Controller/Service/Repository, naming convention, response format, error handling, docs standard — อ้างอิงจาก CLAUDE.md และ skill /new-api ที่ใช้จริง
type: project
---

# Backend API Standard (Flat Pattern)

## โครงสร้างไฟล์ (Flat Pattern — ใช้กับงานใหม่ทั้งหมด)

```
{feature}/
├── route.ts                        # Controller: GET list, POST create
├── [id]/route.ts                   # Controller: GET one, PATCH, DELETE
├── {action}/route.ts               # Controller: non-CRUD (toggle, seed)
├── {feature}.service.ts            # Business logic — throws AppError
├── {feature}.repository.ts         # Prisma queries only
├── {feature}.schema.ts             # Zod schema + DTO type (z.infer)
└── _docs/{operation}-spec.md       # Required สำหรับ create/update routes
```

Flow: `route.ts → .service → .repository → Database`

**Legacy pattern** (มีในโค้ดเก่า — ห้ามใช้กับงานใหม่):
`{feature}/create/route.ts`, `{feature}/read/route.ts`, `{feature}/service/`, `{feature}/validation/`

## Naming Convention

- Files/Folders: kebab-case
- File names in feature: dot-separated (`feature.service.ts`, `feature.schema.ts`)
- API payload (req/res): snake_case
- Variables/Functions: camelCase
- Comments: Thai, 1 บรรทัด, รูปแบบ `// ✨ คำอธิบาย` (emoji เฉพาะ function comment)

## Response Format

```ts
// Standard response — ใช้ helpers จาก src/helpers/api/response.ts
return NextResponse.json(successResponse({ data, pagination? }), { status: 200 });
return NextResponse.json(errorResponse({ status: 404, message_th: "...", message_en: "..." }), { status: 404 });
// JSON shape: { status: 200, message_th: "...", message_en: "...", data: {} }
// หมายเหตุ: field ชื่อ "status" (ไม่ใช่ "status_code")
```

ต้องส่ง HTTP status เป็น argument ที่ 2 เสมอ — ไม่งั้น client เห็น 200 ทุกครั้ง

## Authentication & Permission

```ts
const session = await auth();
if (!session?.user) return NextResponse.json(errorResponse({ status: 401, ... }), { status: 401 });

const permissions: string[] = (session.user as any).permissions ?? [];
const isAdmin = (session.user as any).admin_id === 117;
if (!isAdmin && !permissions.includes(PERMISSIONS.SOME_CODE)) {
  return NextResponse.json(errorResponse({ status: 403, ... }), { status: 403 });
}
```

## Error Handling

```ts
// Service layer: throws AppError สำหรับ business rule violations
import { AppError } from "@/helpers/api/app-error";
if (!record) throw new AppError(404, "ไม่พบข้อมูล");

// Controller: ใช้ centralized helper
import { handleError } from "@/helpers/controller/handle-error.params";
catch (err) { return handleError(err, "[FEATURE_ACTION_ERROR]"); }
```

## Validation

```ts
// Body validation
import { validateRequest } from "@/helpers/api/validate.request";
const { data, error } = await validateRequest(request, CreateSchema);
if (error) return error;

// Query params validation
const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
const parsed = QuerySchema.safeParse(rawParams);
if (!parsed.success) return NextResponse.json(errorResponse({ status: 400, ... }), { status: 400 });
// ใช้ z.coerce.number() สำหรับ numeric query params
```

## Pagination

```ts
import { buildPagination } from "@/helpers/controller/build-pagination.params.ts";
const [items, total] = await Promise.all([repo.findMany(...), repo.count(...)]);
return NextResponse.json(successResponse({ data: items, pagination: buildPagination(offset, limit, total) }), { status: 200 });
```

## Logging

```ts
import logger from "@/helpers/logger.server.ts";
// ห้ามใช้ console.error ใน route handlers (ถูก strip ใน production)
// console.* อนุญาตเฉพาะใน cronjob scripts เท่านั้น
```

## URL Naming (งานใหม่)

- HTTP method คือ verb — ไม่ใช้ `/create`, `/read`, `/update`, `/delete` ใน URL
- Resource: kebab-case plural noun — `/school-devices`, `/overtime-entries`
- Pattern: `GET /api/v2/{domain}/{resources}`, `POST /api/v2/{domain}/{resources}`, `PATCH /api/v2/{domain}/{resources}/[id]`

## Hardcoded IDs (ห้ามลบ)

- `admin_id === 117` → super admin, bypass ทุก permission check
- `user_id === "49"` → sole OT approver (ตรวจสอบทั้ง frontend และ API layer)

**Why:** กำหนดมาตั้งแต่ระบบเริ่มต้น เปลี่ยนได้เฉพาะเมื่อมีการ migrate ระบบ permission ใหม่เท่านั้น
**How to apply:** อย่าลบหรือ refactor เงื่อนไขเหล่านี้ออก แม้จะดูเป็น magic number
