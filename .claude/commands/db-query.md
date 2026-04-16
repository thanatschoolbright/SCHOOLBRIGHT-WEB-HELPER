# /db-query — เขียน Prisma Query พร้อม Type

สร้าง Prisma query function ที่ถูกต้องสำหรับ Project นี้ ซึ่งมี **2 DB instance** แยกกัน โดยอัตโนมัติใส่ Thai comment, typing และ transaction wrapper ถ้าจำเป็น

## วิธีใช้

```
/db-query
```

Claude จะถามข้อมูล:

1. **ใช้ DB ไหน?**
   - `main` → `src/helpers/prisma.ts` (generated/prisma)
   - `timesheet` → `src/helpers/prisma-timesheet.ts` (generated/prisma-timesheet)

2. **operation**: findMany / findFirst / findUnique / create / update / delete / upsert / aggregate / groupBy / count / transaction

3. **Model/Table** (เช่น `User`, `OvertimeRequest`, `TimesheetLog`)

4. **เงื่อนไข where** (เช่น `user_id = X`, `status IN [...]`, `date BETWEEN A AND B`)

5. **ฟิลด์ที่ต้องการ select** (ถ้าไม่ระบุ = select ทั้งหมด)

6. **ต้องการ include relation?** (เช่น include User, include Department)

7. **ต้องการ transaction?** ถ้า yes ระบุ operations ทั้งหมดที่ต้องทำพร้อมกัน

8. **ชื่อฟังก์ชัน** ที่ต้องการ (เช่น `getUserOvertimeByMonth`)

## Template ที่สร้าง

### Single Query (main DB)
```ts
import prisma from "@helpers/prisma";

// {Thai description ของ query นี้ทำอะไร}
export async function {functionName}({params}: {ParamType}): Promise<{ReturnType}> {
  return prisma.{model}.findMany({
    where: { ... },
    select: { ... },
    orderBy: { created_at: "desc" },
  });
}
```

### Single Query (timesheet DB)
```ts
import prismaTimesheet from "@helpers/prisma-timesheet";

// {Thai description}
export async function {functionName}({params}: {ParamType}): Promise<{ReturnType}> {
  return prismaTimesheet.{model}.findMany({
    where: { ... },
  });
}
```

### Transaction (เขียนหลาย table พร้อมกัน)
```ts
import prisma from "@helpers/prisma";

// {Thai description} — ใช้ transaction เพื่อรับประกันความสมบูรณ์ของข้อมูล
export async function {functionName}({params}: {ParamType}) {
  return prisma.$transaction(async (tx) => {
    const result1 = await tx.{model1}.create({ data: { ... } });
    const result2 = await tx.{model2}.update({
      where: { id: result1.id },
      data: { ... },
    });
    return { result1, result2 };
  });
}
```

### Aggregate / GroupBy
```ts
// สรุปข้อมูล {Thai description}
export async function {functionName}() {
  return prisma.{model}.groupBy({
    by: ["field1", "field2"],
    _count: { id: true },
    _sum: { amount: true },
    where: { ... },
    orderBy: { _count: { id: "desc" } },
  });
}
```

## ข้อควรระวังที่ระบบจะเตือนอัตโนมัติ

- ถ้าใช้ timesheet model ใน `prisma.ts` (ผิด DB) → แจ้งเตือนและแก้ไข
- ถ้าเขียนหลาย table โดยไม่ใช้ transaction → เตือนและเพิ่ม `$transaction`
- ถ้าไม่มี Thai comment บนฟังก์ชัน → เพิ่มให้อัตโนมัติ
- ถ้าไม่มี type annotation บน parameter/return → เพิ่มให้อัตโนมัติ
- ชื่อฟังก์ชัน camelCase เสมอ, ฟิลด์ใน payload snake_case เสมอ
