# ✨ Documentation: Migrate Timesheet Entries (CREATE)

ใช้สำหรับย้ายรายการ Timesheet หลายๆ รายการไปยังโปรเจกต์และ Feature ใหม่พร้อมกัน (Bulk Update)

## API Information

- **Endpoint:** `/api/v1/timesheet/migration/create`
- **Method:** `POST`

## Request Body (snake_case)

| Parameter           | Type       | Required | Description                            |
| ------------------- | ---------- | -------- | -------------------------------------- |
| `entry_ids`         | `number[]` | Yes      | รายการ ID ของ Timesheet ที่ต้องการย้าย |
| `target_project_id` | `number`   | Yes      | ID ของโปรเจกต์ปลายทาง                  |
| `target_feature_id` | `number`   | Yes      | ID ของ Feature ปลายทาง                 |

## Response Body

```json
{
  "status_code": 201,
  "message_th": "ย้ายข้อมูลสำเร็จจำนวน 5 รายการ",
  "message_en": "Successfully migrated 5 entries",
  "data": {
    "count": 5
  }
}
```

## Logic Note

- ใช้ `prisma.updateMany` ในการอัปเดตข้อมูลพร้อมกันหลายรายการเพื่อประสิทธิภาพสูงสุด
- มีการใช้ **Zod Validation** เพื่อตรวจสอบโครงสร้างข้อมูลก่อนบันทึกลงฐานข้อมูล
