# school-report-spec.md

## วัตถุประสงค์ (Purpose)

ส่ง LINE message รายงานสถานะเครื่องฮาร์ดแวร์ (POS) ของโรงเรียนเดียวไปยัง LINE Group
ใช้สำหรับ CS / QA ที่ต้องการตรวจสอบสถานะเครื่องของโรงเรียนนั้นๆ โดยตรงผ่าน LINE

---

## Endpoint

```
GET /api/v1/hardware/machine-monitoring/channel/line/{school_id}
```

---

## Request

### Path Parameters

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| school_id | number | Yes      | รหัสโรงเรียน (nCompany) |

### Query Parameters

| Parameter | Type   | Required | Description                                                            |
| --------- | ------ | -------- | ---------------------------------------------------------------------- |
| group_id  | string | No       | LINE Group ID ปลายทาง ถ้าไม่ระบุ จะใช้ env var หรือ active group ใน DB |

---

## Response

### Success (200)

```json
{
  "status_code": 200,
  "message_th": "ส่งรายงานสถานะเครื่องของ {school_name} ไปยัง LINE สำเร็จ",
  "message_en": "School device status report sent to LINE successfully",
  "data": {
    "school_id": 1234,
    "school_name": "โรงเรียนตัวอย่าง",
    "group_id": "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "total_devices": 10,
    "online_devices": 7,
    "offline_devices": 3
  }
}
```

### Error (400) — school_id ไม่ใช่ตัวเลข

```json
{
  "status_code": 400,
  "message_th": "รหัสโรงเรียนไม่ถูกต้อง กรุณาระบุตัวเลขที่มากกว่า 0",
  "message_en": "Invalid school_id parameter"
}
```

### Error (503) — ไม่มี LINE Group ที่ตั้งค่าไว้

```json
{
  "status_code": 503,
  "message_th": "ยังไม่ได้ตั้งค่า LINE Group เป้าหมาย กรุณาเลือกกลุ่มก่อนส่งรายงาน",
  "message_en": "LINE target group is not configured"
}
```

### Error (500) — เกิดข้อผิดพลาดภายใน

```json
{
  "status_code": 500,
  "message_th": "เกิดข้อผิดพลาดขณะส่งรายงานไปยัง LINE",
  "message_en": "<error message>"
}
```

---

## LINE Message Format

```
สวัสดี {school_name} {school_id}
รายงานสถานะเครื่องฮาร์ดแวร์
วันที่ dd/mm/yyyy เวลา hh:mm น.
━━━━━━━━━━━━━━━━━━━━━━━━
1. {Note} รหัสเครื่อง : {AppName} ({AppVersion})
   สถานะ : Online ✅
2. {Note} รหัสเครื่อง : {AppName} ({AppVersion})
   สถานะ : Offline ❎ (โปรดตรวจสอบ)
...
```

- `Note` มาจาก field `Note` ใน `DeviceDailyStatus` ถ้าว่างจะใช้ `DeviceID` แทน
- เรียงลำดับอุปกรณ์ตาม `DeviceID` ascending

---

## Business Logic Notes

1. **Online detection** — อุปกรณ์ถือว่า Online ถ้า `Online = true` หรือ `OnlineTime` อยู่ภายใน 15 นาทีล่าสุด
2. **School lookup** — ค้นหาจาก `activeSchoolList` ด้วย `nCompany = school_id` ถ้าไม่พบจะแสดงข้อความแจ้งเตือน (ไม่ throw error)
3. **Group ID fallback** — `query param group_id` → `LINE_MONITORING_GROUP_ID` env var → `lineGroup` table (where `is_active = true`)
4. **LINE message splitting** — ถ้าข้อความยาวเกิน 5,000 ตัวอักษร จะแบ่งเป็นหลาย message (สูงสุด 5 messages)
5. **ไม่มี Auth check** — endpoint นี้สามารถเรียกได้โดยตรง (ไม่ต้องผ่าน `CRON_SECRET`) เพราะออกแบบมาสำหรับการใช้งาน manual

---

## DB Models ที่ใช้

| DB                     | Model               | Fields ที่ใช้                                                                   |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Main (MSSQL)           | `DeviceDailyStatus` | `Online`, `OnlineTime`, `DeviceID`, `AppName`, `AppVersion`, `Note`, `SchoolID` |
| Main (MSSQL)           | `activeSchoolList`  | `nCompany`, `sCompany`                                                          |
| Timesheet (PostgreSQL) | `lineGroup`         | `group_id`, `is_active`, `updated_at`                                           |
