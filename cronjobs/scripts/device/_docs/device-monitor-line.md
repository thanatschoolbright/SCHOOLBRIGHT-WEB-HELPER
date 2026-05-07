# Device Monitor LINE Bot — Cronjob Scripts

## Scripts

| ไฟล์ | วัตถุประสงค์ |
|---|---|
| `device-monitor-line.ts` | Production script — รันโดย Kubernetes CronJob ทุก 1 นาที ส่งแจ้งเตือนไปทุกโรงเรียน |
| `device-monitor-line-test.ts` | Test script — ทดสอบเฉพาะโรงเรียน 849 (GroupType=test) ข้ามการตรวจสอบช่วงเวลา |

---

## วิธีรัน

### Production script — ส่งทุกโรงเรียน (ตามช่วงเวลาแต่ละโรงเรียน)
```bash
bun run cronjobs/scripts/device/device-monitor-line.ts
```

### Test mode — ส่งเฉพาะโรงเรียน 849 ข้ามช่วงเวลา
```bash
APP_INTERNAL_URL=http://localhost:3000 TEST_SCHOOL_ID=849 bun run cronjobs/scripts/device/device-monitor-line.ts
```

### Test script — debug แบบละเอียด 4 ขั้นตอน
```bash
APP_INTERNAL_URL=http://localhost:3000 bun run cronjobs/scripts/device/device-monitor-line-test.ts
```

> **หมายเหตุ**: ต้องรัน `bun dev` ก่อนเสมอเพราะ script เรียก API ผ่าน HTTP

---

## Environment Variables

| ตัวแปร | ค่า default | คำอธิบาย |
|---|---|---|
| `APP_INTERNAL_URL` | `http://sb-helper.schoolbright.co` | URL ของ Next.js app — ใช้ `http://localhost:3000` ตอน dev |
| `CRON_SECRET` | `""` | Bearer token สำหรับ authenticate กับ API |
| `TEST_SCHOOL_ID` | `null` | ถ้าตั้งค่า → เข้า test mode (ส่งแต่โรงเรียนนี้ ข้ามช่วงเวลา) |

---

## การทำงานของ Production Script (`device-monitor-line.ts`)

### Flow หลัก

```
1. เช็ก Bot Status (botSetting.line_bot_enabled ใน Timesheet DB)
   └─ ถ้าปิด → exit 0 ไม่ทำอะไร

2. โหลดการตั้งค่าของทุกโรงเรียนจาก DB ครั้งเดียว
   ├─ DeviceNotifyTimeWindow (ช่วงเวลาแจ้งเตือน ต่อโรงเรียน)
   └─ DeviceNotifyInterval   (ช่วงห่างแจ้งเตือน ต่อโรงเรียน)

3. ถ้ามี TEST_SCHOOL_ID → ส่งเฉพาะโรงเรียนนั้น → exit

4. ดึง LINE Groups ทั้งหมด (tLineGroup ใน JabjaiMaster DB)

5. วนลูปทุก group:
   ├─ getSchoolConfig(schoolId) → ได้ timeWindows + intervalRound1 + intervalRound2
   ├─ isWithinNotifyWindow(timeWindows) → ถ้านอกช่วง → skip
   └─ sendSchoolReport(schoolId, intervalRound1, intervalRound2)

6. สรุป: success N, failed N, skipped N
```

### Interval Threshold Logic

เงื่อนไขใน API (`cronjob/[school_id]/route.ts`) ก่อนส่ง LINE:

- **รอบแรก**: เครื่องออฟไลน์ ≥ `intervalRound1` นาที และ < `intervalRound2` นาที
- **รอบถัดไป**: เครื่องออฟไลน์ ≥ `intervalRound2` นาที และ `offlineMin % intervalRound2 < 1` (ตรง boundary ±1 นาที)

เหตุผล: cronjob รันทุก 1 นาที ต้องไม่ส่งซ้ำทุกนาที — ส่งเฉพาะตรง 5, 30, 60, 90, ... นาที

### Fallback (โรงเรียนที่ยังไม่มีข้อมูลใน DB)

| ค่า | Default |
|---|---|
| ช่วงเวลา รอบ 1 | 06:00–08:00 |
| ช่วงเวลา รอบ 2 | 15:00–17:00 |
| ช่วงห่าง รอบแรก | 5 นาที |
| ช่วงห่าง รอบถัดไป | 30 นาที |

---

## การทำงานของ Test Script (`device-monitor-line-test.ts`)

ส่งไปเฉพาะโรงเรียน 849 (GroupType=test) เสมอ ไม่ขึ้นกับเวลา

**4 ขั้นตอนที่แสดงใน log:**

```
[1/4] ตรวจสอบสถานะ LINE Bot
      → Bot Status, Updated At, Updated By

[2/4] ดึงการตั้งค่าของโรงเรียน 849 จาก DB
      → แหล่งข้อมูล (จาก DB หรือ default)
      → ช่วงเวลาทุกรอบ
      → ช่วงห่าง รอบ 1 / รอบ 2

[3/4] เรียก API
      → URL เต็มพร้อม query params
      → HTTP Status

[4/4] ผลลัพธ์
      → ชื่อโรงเรียน, จำนวนเครื่องทั้งหมด/ออนไลน์/ออฟไลน์
      → LINE: SUCCESS / FAILED / SKIPPED (พร้อมเหตุผล)
      → รายการเครื่องออฟไลน์: device_id, app_name, offline NNN นาที, สถานะแจ้งเตือน
```

---

## DB Tables ที่เกี่ยวข้อง

| Table | DB | คำอธิบาย |
|---|---|---|
| `bot_setting` | Timesheet (PostgreSQL) | key=`line_bot_enabled`, value=`"true"/"false"` |
| `device_notify_time_window` | JabjaiMaster (SQL Server) | ช่วงเวลาแจ้งเตือน ต่อโรงเรียน (`@@unique([school_id, round])`) |
| `device_notify_interval` | JabjaiMaster (SQL Server) | ช่วงห่างแจ้งเตือน ต่อโรงเรียน (`@@unique([school_id, round])`) |
| `tLineGroup` | JabjaiMaster (SQL Server) | LINE Group ของแต่ละโรงเรียน |

---

## API ที่ Script เรียก

```
GET /api/v2/hardware/school-device/cronjob/{school_id}
    ?interval_round1=5
    &interval_round2=30
Authorization: Bearer {CRON_SECRET}
```

Response:
```json
{
  "data": {
    "school_id": 849,
    "school_name": "...",
    "total": 10,
    "online": 8,
    "offline": 2,
    "devices": [...],
    "line": {
      "success": true,
      "skipped": false,
      "group_id": "Cxxx",
      "error": null
    }
  }
}
```

---

## การตั้งค่าช่วงเวลาและช่วงห่างต่อโรงเรียน

แก้ไขได้ที่หน้า **ตรวจสอบสถานะอุปกรณ์** → คลิกชื่อโรงเรียน → Drawer → แถบ "ตั้งค่าการแจ้งเตือน LINE"

API ที่รองรับ:
```
GET    /api/v2/hardware/device-notify-config?school_id=xxx
POST   /api/v2/hardware/device-notify-config?school_id=xxx        # เพิ่มรอบใหม่ (max 3)
PATCH  /api/v2/hardware/device-notify-config/time-windows/{id}?school_id=xxx
DELETE /api/v2/hardware/device-notify-config/time-windows/{id}?school_id=xxx
PATCH  /api/v2/hardware/device-notify-config/intervals/{id}?school_id=xxx
```
