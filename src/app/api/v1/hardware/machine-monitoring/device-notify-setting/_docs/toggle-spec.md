# POST /api/v1/hardware/machine-monitoring/device-notify-setting/toggle

## Purpose
เปิด/ปิดการแจ้งเตือนผ่าน LINE สำหรับอุปกรณ์รายเครื่อง ค่าที่บันทึกไว้จะถูก Cronjob ตรวจสอบก่อนส่งการแจ้งเตือน

## Authentication
Session-based (NextAuth) — ต้องเข้าสู่ระบบก่อน

## Request Body
```json
{
  "school_id": 101,
  "device_id": "DEVICE-ABC-001",
  "notify_enabled": false
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| school_id | number | Yes | รหัสโรงเรียน |
| device_id | string | Yes | รหัสอุปกรณ์ |
| notify_enabled | boolean | Yes | true = เปิดแจ้งเตือน, false = ปิดแจ้งเตือน |

## Response (200 OK)
```json
{
  "status_code": 200,
  "message_th": "ปิดการแจ้งเตือนอุปกรณ์ DEVICE-ABC-001 สำเร็จ",
  "message_en": "Device notification disabled successfully",
  "data": {
    "school_id": 101,
    "device_id": "DEVICE-ABC-001",
    "notify_enabled": false
  }
}
```

## Logic Note
- ใช้ Prisma `upsert` กับ `@@unique([school_id, device_id])` — ไม่มี record ก็จะ create อัตโนมัติ
- ไม่มี record ใน `device_monitor_setting` = แจ้งเตือนตามค่า default (true) จาก schema
- Phase 1: Cronjob จะแจ้งเตือนเฉพาะช่วง 18:00-06:00 ตามเวลาประเทศไทย และเฉพาะอุปกรณ์ที่ `notify_enabled = true`
