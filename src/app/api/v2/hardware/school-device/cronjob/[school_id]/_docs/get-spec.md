# GET /api/v2/hardware/school-device/cronjob/[school_id]

## วัตถุประสงค์
ดึงสถานะเครื่องฮาร์ดแวร์ทุกเครื่องของโรงเรียนเดียว พร้อมส่งรายงานไปยัง LINE Group ของโรงเรียนนั้น และคืน response รวมทั้งข้อมูลเครื่องและสถานะการส่ง LINE

ออกแบบสำหรับ Kubernetes CronJob ที่รันทีละโรงเรียน — caller วนซ้ำตาม `school_id` จาก `tLineGroup`

## Authentication
`Authorization: Bearer {CRON_SECRET}` — หากไม่มีค่า `CRON_SECRET` ใน env จะข้ามการตรวจสอบ

## Path Parameter
| Parameter | Type | Required | Description |
|---|---|---|---|
| `school_id` | integer | ✅ | รหัสโรงเรียน (ต้องมากกว่า 0) |

## Query Parameter (optional)
| Parameter | Type | Description |
|---|---|---|
| `group_id` | string | กำหนด LINE Group ID โดยตรง (override ค่าจาก tLineGroup และ env) |

## LINE Group Priority
1. `tLineGroup.GroupId` ของโรงเรียน (จาก JabjaiMaster DB)
2. Query param `group_id`
3. `LINE_MONITORING_GROUP_ID` env var
4. ถ้าไม่มีเลย — ไม่ส่ง LINE แต่ยังคืนข้อมูลเครื่อง (line.success = false, line.group_id = null)

## Online Logic
เครื่อง online = `OnlineTime` อยู่ภายใน 10 นาทีล่าสุด
`offline_reason` = `"device_or_network"` หรือ `"server_down"` (ขึ้นอยู่กับ hardware server health check)

## Response 200
```json
{
  "status": 200,
  "message_th": "ดึงข้อมูลสถานะเครื่องของ โรงเรียนประทีปศาสน์ สำเร็จ",
  "message_en": "School device status retrieved successfully",
  "data": {
    "school_id": 387,
    "school_name": "โรงเรียนประทีปศาสน์",
    "online": 27,
    "offline": 5,
    "total": 32,
    "offline_reason": "device_or_network",
    "devices": [
      {
        "device_id": "04407907080014240b11",
        "app_name": ".SB Canteen",
        "app_version": "2.4.7",
        "note": null,
        "is_online": true,
        "is_login": true,
        "online_time": "2026-05-06T15:36:19.136Z",
        "offline_reason": null,
        "notify_enabled": true
      }
    ],
    "line": {
      "success": true,
      "group_id": "C1548b911edec29f067e2c39fbf435a19"
    }
  }
}
```

## Response 400
```json
{ "status": 400, "message_th": "รหัสโรงเรียนไม่ถูกต้อง กรุณาระบุตัวเลขที่มากกว่า 0" }
```

## Response 401
```json
{ "status": 401, "message_th": "ไม่มีสิทธิ์เข้าถึง" }
```

## Response 404
```json
{ "status": 404, "message_th": "ไม่พบข้อมูลโรงเรียน รหัส 999" }
```

## หมายเหตุ
- LINE push ใช้ `buildSchoolDeviceReport` จาก `@services/line/line-push.service` (reuse logic เดิม)
- `notify_enabled` มาจาก `DeviceMonitorSetting` (Timesheet DB) — ถ้าไม่มี record ให้ default = `true`
- เครื่องทุกประเภท app รวมทั้ง `.SB Canteen` ถูกนับ (ต่างจาก `buildSchoolDeviceReport` ที่กรอง `.SB Canteen` ออก)
