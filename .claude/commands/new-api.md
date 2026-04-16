# /new-api — สร้าง API Route ครบ Pattern

สร้าง API endpoint เดี่ยวพร้อม service, schema และ spec doc ในคำสั่งเดียว

## วิธีใช้

```
/new-api
```

Claude จะถามข้อมูล:

1. **domain** (เช่น `timesheet`, `backlog`, `hardware`, `mobile`)
2. **resource** (เช่น `overtime`, `issues`, `device`)
3. **action** (เช่น `create`, `update-status`, `export`)
4. **HTTP method**: GET / POST / PATCH / PUT / DELETE
5. **คำอธิบาย API (Thai)** (เช่น `อัปเดตสถานะการทำงานล่วงเวลา`)
6. **ต้องการ auth check?** (yes/no — ถ้า yes จะใส่ `await auth()`)
7. **ต้องการ permission check?** (ถ้า yes ระบุ field ที่ check เช่น `role_id`, `user_id`)
8. **ฟิลด์ request** พร้อม type และ optional/required
9. **ฟิลด์ response** พร้อม type
10. **ใช้ DB ไหน**: main (`prisma.ts`) / timesheet (`prisma-timesheet.ts`) / none (proxy เท่านั้น)
11. **ต้องการ transaction?** (ถ้าเขียนหลาย table)

## ไฟล์ที่จะถูกสร้าง

```
src/app/api/v1/{domain}/{resource}/{action}/
├── route.ts                          # HTTP handler
├── service/
│   └── {action}-service.ts           # Business logic + Prisma/proxy
├── validation/
│   └── {action}-schema.ts            # Zod schema
└── docs/
    └── {action}-spec.md              # API documentation
```

## Template มาตรฐาน

### route.ts
```ts
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { {action}Schema } from "./validation/{action}-schema";
import { {action}Service } from "./service/{action}-service";

// {Thai description}
export async function {METHOD}(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return errorResponse({
      message_th: "ไม่มีสิทธิ์เข้าถึง",
      message_en: "Unauthorized",
      status: 401,
    });
  }

  const validation = await validateRequest(request, {action}Schema);
  if ("error" in validation) return validation.error;

  try {
    const result = await {action}Service(validation.data);
    return successResponse({
      data: result,
      message_th: "สำเร็จ",
      message_en: "Success",
    });
  } catch (error) {
    return errorResponse({
      message_th: "เกิดข้อผิดพลาดภายในระบบ",
      message_en: "Internal server error",
      status: 500,
      error,
    });
  }
}
```

### {action}-schema.ts
```ts
import { z } from "zod";

// schema สำหรับตรวจสอบข้อมูล {Thai description}
export const {action}Schema = z.object({
  field_name: z.string().min(1, "กรุณาระบุ field_name"),
  // ... fields in snake_case
});

export type {Action}Payload = z.infer<typeof {action}Schema>;
```

### {action}-service.ts
```ts
import { callApiGatewayService } from "@services/api-gateway";  // สำหรับ proxy
// หรือ
import prisma from "@helpers/prisma";                            // สำหรับ main DB
import prismaTimesheet from "@helpers/prisma-timesheet";        // สำหรับ timesheet DB

// {Thai description of what this service does}
export async function {action}Service(payload: {Action}Payload) {
  // business logic here
}
```

### docs/{action}-spec.md
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
- สร้าง `docs/{action}-spec.md` ทุกครั้งสำหรับ create/update
