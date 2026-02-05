# ✨ Documentation: Get Migration Data (READ)

ใช้สำหรับดึงข้อมูลต่างๆ ที่จำเป็นในการทำ Migration เช่น รายชื่อโปรเจกต์, รายชื่อพนักงาน และรายการ Timesheet

## API Information

- **Endpoint:** `/api/v1/timesheet/migration/read`
- **Method:** `GET`

## Request Query Parameters

| Parameter    | Type      | Required | Description                                                     |
| ------------ | --------- | -------- | --------------------------------------------------------------- |
| `action`     | `string`  | Yes      | การทำงานที่ต้องการ (`projects`, `features`, `users`, `entries`) |
| `project_id` | `number`  | No       | จำเป็นเมื่อ `action=features`                                   |
| `admin_id`   | `number`  | No       | กรองตามพนักงาน (ใช้เมื่อ `action=entries`)                      |
| `has_issues` | `boolean` | No       | กรองเฉพาะรายการที่มีปัญหา (ใช้เมื่อ `action=entries`)           |

## Response Body

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลสำเร็จ",
  "message_en": "Data retrieved successfully",
  "data": [ ... ]
}
```

## Logic Note

- **Projects:** ดึงเฉพาะโปรเจกต์ที่ `is_deleted: false`
- **Entries:** ระบบจะทำการคำนวณ `hasIssue` ให้อัตโนมัติ (เช่น กรณีไม่มี description) เพื่อให้ Frontend แสดงผลได้ง่ายขึ้น
