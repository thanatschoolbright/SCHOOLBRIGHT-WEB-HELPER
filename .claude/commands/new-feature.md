# /new-feature — Scaffold Feature Page ครบ Stack

สร้าง Feature Page ใหม่แบบ Modular Architecture ครบทั้ง Frontend และ Backend ในคำสั่งเดียว

## วิธีใช้

```
/new-feature
```

จากนั้น Claude จะถามข้อมูลที่จำเป็น:

1. **ชื่อ domain** (เช่น `timesheet`, `backlog`, `hardware`)
2. **ชื่อ feature** (เช่น `overtime-summary`, `daily-report`)
3. **ชื่อหน้า (Thai)** (เช่น `รายงานการทำงานล่วงเวลา`)
4. **คำอธิบายหน้า (Thai)** (เช่น `วิเคราะห์ชั่วโมง OT รายพนักงานในช่วงเวลาที่กำหนด`)
5. **ฟิลด์ filter** ที่ต้องการ (เช่น `dateRange, department, status`)
6. **ฟิลด์ summary card** (เช่น `ทั้งหมด, สำเร็จ, รอดำเนินการ`)
7. **columns ของ Table** (เช่น `ชื่อพนักงาน, วันที่, ชั่วโมง, สถานะ`)
8. **API method** ที่ต้องการ (GET / POST / PATCH)
9. **ฟิลด์ request/response** ของ API

## ไฟล์ที่จะถูกสร้าง

### Frontend
```
src/app/{domain}/{feature}/
├── page.tsx                          # Orchestrator (Server/Client)
├── _components/
│   ├── filter-section.tsx            # ส่วน filter 2-col layout
│   ├── summary-section.tsx           # Summary cards row
│   ├── {feature}-table.tsx           # Ant Design Table พร้อม sort
│   └── {feature}-modal.tsx           # Status modal (ถ้าต้องการ action)
├── _state/
│   └── use-{feature}-store.ts        # Zustand store
└── _api/
    └── {feature}-service.ts          # callApiService wrapper
```

### Backend
```
src/app/api/v1/{domain}/{feature}/
├── read/
│   └── route.ts                      # GET handler
├── create/
│   └── route.ts                      # POST handler (ถ้าต้องการ)
├── service/
│   └── {feature}-service.ts          # Business logic + Prisma
├── validation/
│   └── {feature}-schema.ts           # Zod schema
└── docs/
    └── read-spec.md                  # API documentation
```

## Pattern มาตรฐานที่ใช้

### page.tsx
```tsx
"use client";
import { useEffect, type JSX } from "react";
import BackendLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
// ... imports

export default function {Feature}Page(): JSX.Element {
  const { fetchData } = use{Feature}Store();
  useEffect(() => { fetchData(); }, []);

  return (
    <BackendLayout>
      <HeaderBar title="{Thai title}" subTitle="{Thai subtitle}" icon={<Icon />} />
      <div className="mt-6 flex w-full flex-col gap-6">
        <FilterSection />
        <SummarySection />
        <{Feature}Table />
      </div>
    </BackendLayout>
  );
}
```

### Zustand Store
```ts
// ดึงข้อมูลและจัดการ state ทั้งหมดของ feature
import { create } from "zustand";
interface {Feature}Store {
  data: {Type}[];
  isLoading: boolean;
  filters: {FilterType};
  fetchData: () => Promise<void>;
  setFilters: (filters: Partial<{FilterType}>) => void;
  resetFilters: () => void;
}
```

### API route.ts
```ts
// {Thai description of what this endpoint does}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return errorResponse({ message_th: "ไม่มีสิทธิ์เข้าถึง", message_en: "Unauthorized", status: 401 });

  const validation = await validateRequest(request, {feature}Schema);
  if ("error" in validation) return validation.error;

  try {
    const result = await {feature}Service(validation.data);
    return successResponse({ data: result, message_th: "ดึงข้อมูลสำเร็จ", message_en: "Success" });
  } catch (error) {
    return errorResponse({ message_th: "เกิดข้อผิดพลาด", message_en: "Internal server error", status: 500 });
  }
}
```

## กฎที่บังคับใช้อัตโนมัติ

- ข้อความ UI ทั้งหมดเป็น **ภาษาไทย 100%** (title, button, toast, placeholder)
- **ห้ามใช้ emoji** ในทุกส่วน (code, comment, string)
- comment ภาษาไทยบนทุกฟังก์ชัน
- ใช้ `toast` จาก `sonner` สำหรับ notification
- ใช้ `StatusModalComponent` สำหรับ confirm/success/error dialog
- Table columns ห้ามใช้ `maxWidth` — ให้ scale ตามหน้าจอ
- Filter layout: 2 columns ต่อ row, ปุ่มค้นหา/ล้าง ชิดขวา
- response format: `{ status_code, message_th, message_en, data }`
- ห้ามลบหรือแก้ไขฟังก์ชันที่มีอยู่เดิม
