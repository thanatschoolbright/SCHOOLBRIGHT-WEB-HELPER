# /new-api — สร้าง API Route ครบ Pattern

สร้าง API endpoint เดี่ยวพร้อม service, schema และ spec doc ในคำสั่งเดียว

## วิธีใช้

```
/new-api
```

Claude จะถามข้อมูล:

1. **domain** (เช่น `timesheet`, `backlog`, `hardware`, `mobile`)
2. **resource** (เช่น `overtime-entries`, `school-devices`) — kebab-case plural noun
3. **HTTP method**: GET / POST / PATCH / DELETE
4. **เป็น collection หรือ item**: collection (`/resource`) หรือ item (`/resource/[id]`) หรือ non-CRUD action (`/resource/toggle`)
5. **คำอธิบาย API (Thai)** (เช่น `อัปเดตสถานะการทำงานล่วงเวลา`)
6. **ต้องการ auth check?** (yes/no)
7. **ต้องการ permission check?** (ถ้า yes ระบุ PERMISSIONS constant)
8. **ฟิลด์ request** พร้อม type และ optional/required
9. **ฟิลด์ response** พร้อม type
10. **ใช้ DB ไหน**: main (`prisma.ts`) / timesheet (`prisma-timesheet.ts`) / none (proxy เท่านั้น)
11. **ต้องการ transaction?** (ถ้าเขียนหลาย table)

## ไฟล์ที่จะถูกสร้าง

```
src/app/api/v2/{domain}/{resources}/
├── route.ts                          # GET (list) / POST (create)
├── [id]/
│   └── route.ts                      # GET (one) / PATCH (update) / DELETE
├── {action}/                         # เฉพาะ non-CRUD เท่านั้น เช่น toggle, seed, export
│   └── route.ts
├── {resource}.service.ts             # Business logic
├── {resource}.repository.ts          # Prisma queries
├── {resource}.schema.ts              # Zod schema + DTO type
└── _docs/
    └── {action}-spec.md              # API documentation (create/update เท่านั้น)
```

**กฎ URL segment:**
- ✅ `POST /school-devices` (create), `GET /school-devices` (list)
- ✅ `PATCH /school-devices/[id]` (update), `DELETE /school-devices/[id]`
- ✅ `POST /school-devices/toggle` (non-CRUD action)
- ❌ ห้ามใช้ `/create`, `/read`, `/update`, `/delete` เป็น URL segment

## Template มาตรฐาน

### route.ts
```ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { handleError } from "@/helpers/controller/handle-error.params";
import { {resource}Schema } from "../{resource}.schema";
import { {action}Service } from "../{resource}.service";

// {Thai description}
export async function {METHOD}(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "ไม่มีสิทธิ์เข้าถึง", message_en: "Unauthorized" }),
      { status: 401 }
    );
  }

  const validation = await validateRequest(request, {resource}Schema);
  if ("error" in validation) return validation.error;

  try {
    const result = await {action}Service(validation.data);
    return NextResponse.json(
      successResponse({ data: result, message_th: "สำเร็จ", message_en: "Success" }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[{RESOURCE}_{ACTION}_ERROR]");
  }
}
```

### {resource}.schema.ts
```ts
import { z } from "zod";

// schema สำหรับตรวจสอบข้อมูล {Thai description}
export const {resource}Schema = z.object({
  field_name: z.string().min(1, "กรุณาระบุ field_name"),
  // ... fields in snake_case
});

export type {Resource}Payload = z.infer<typeof {resource}Schema>;
```

### {resource}.repository.ts
```ts
import prisma from "@helpers/prisma";                             // main DB
// หรือ
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";    // timesheet DB

// ดึงข้อมูล {Thai description}
export async function find{Resource}(payload: {Resource}Payload) {
  return prisma.{model}.findMany({ where: { ... } });
}
```

### {resource}.service.ts
```ts
import { AppError } from "@/helpers/api/app-error";
import { find{Resource} } from "./{resource}.repository";

// {Thai description of what this service does}
export async function {action}Service(payload: {Resource}Payload) {
  const result = await find{Resource}(payload);
  if (!result) throw new AppError(404, "ไม่พบข้อมูลที่ระบุ");
  return result;
}
```

### _docs/{action}-spec.md
```markdown
# {Action} API Specification

## Purpose
{Thai description}

## Endpoint
{METHOD} /api/v1/{domain}/{resource}/{action}

## Request Schema
| Field | Type | Required | Description |
|---|---|---|---|
| field_name | string | yes | ... |

## Response Schema
| Field | Type | Description |
|---|---|---|
| ... | ... | ... |

## Logic Notes
- {จุดสำคัญหรือข้อควรระวัง}
```

## กฎที่บังคับใช้อัตโนมัติ

- `message_th` และ `message_en` ต้องมีทุก response
- ใช้ `validateRequest()` ก่อน service เสมอ
- ใช้ `await auth()` ถ้าต้องการ session
- API payload fields ทั้งหมด **snake_case**
- ตัวแปร/ฟังก์ชัน **camelCase**
- ไฟล์/โฟลเดอร์ **kebab-case**
- comment ภาษาไทยบนทุกฟังก์ชัน ห้ามใช้ emoji
- ถ้าเขียน DB หลาย table ต้องใช้ `$transaction`
- สร้าง `_docs/{action}-spec.md` ทุกครั้งสำหรับ create/update (underscore prefix เสมอ)
