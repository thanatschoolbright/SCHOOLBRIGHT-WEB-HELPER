# POST /api/v1/timesheet/overtime/comment

## วัตถุประสงค์
บันทึก Comment / หมายเหตุจาก Admin ลงใน OvertimeStatusLog โดยไม่เปลี่ยนสถานะของ OT
ใช้สำหรับ Admin ต้องการฝากข้อความถึงพนักงานโดยตรงจากหน้า Detail Modal

## Request

```json
{
  "overtime_id": 123,
  "comment": "ข้อความหมายเหตุจาก Admin"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `overtime_id` | number | ใช่ | ID ของ OT request |
| `comment` | string (1–1000 chars) | ใช่ | ข้อความหมายเหตุ |

## Response (201)

```json
{
  "status_code": 201,
  "message_th": "บันทึกหมายเหตุสำเร็จ",
  "message_en": "Comment saved",
  "data": {
    "id": 99,
    "overtime_id": 123,
    "changed_by": 1,
    "from_status": "pending",
    "to_status": "comment",
    "note": "ข้อความหมายเหตุ",
    "created_at": "2026-04-27T10:00:00.000Z"
  }
}
```

## Business Logic

- บันทึกลง `OvertimeStatusLog` ด้วย `to_status = "comment"` — ไม่ใช่ status จริง เป็น pseudo-status เพื่อแยกออกจาก status change
- `from_status` เก็บสถานะปัจจุบันของ OT ณ เวลาที่ comment
- ต้องเข้าสู่ระบบก่อน — `changed_by` คือ `session.user.id`
- Frontend แยก render log ที่ `to_status === "comment"` ออกจาก status change ด้วยรูปแบบ UI ที่ต่างกัน (สีน้ำเงิน, ไม่แสดง arrow สถานะ)
- พนักงานฝั่ง User เห็น comment ได้เพราะ GET /status-log ไม่กรอง to_status
