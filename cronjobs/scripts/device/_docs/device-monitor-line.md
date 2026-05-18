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

---

## Logic การแจ้งเตือน (State-Based — อัปเดต)

### ภาพรวม

ระบบใช้ **state per device** เก็บใน table `device_notify_state` เพื่อแก้ปัญหาเดิมที่คำนวณจาก `online_time` ตรงๆ ซึ่งทำให้เครื่องที่ online กลับมาแล้ว offline ใหม่อาจข้าม R1 ไป R2 ทันที

### เงื่อนไขก่อนส่ง LINE (ทุกข้อต้องผ่าน)

1. LINE Bot เปิดใช้งาน (`bot_setting.line_bot_enabled = "true"`)
2. เวลาปัจจุบัน (Bangkok) อยู่ในช่วงเวลาที่โรงเรียนกำหนด
3. มีเครื่องที่ `notify_enabled = true` และออฟไลน์ถึงเกณฑ์ตาม state

### รอบการแจ้งเตือน

| รอบ | เงื่อนไข | ตัวอย่าง (default) |
|---|---|---|
| **R1 — รอบแรก** | `r1_sent_at = null` และ offline นานกว่า `intervalRound1` นาที นับจาก `offline_since` | offline ครบ 5 นาที → แจ้งเตือนครั้งแรก |
| **R2 — รอบถัดไป** | `r1_sent_at != null` และ เวลาห่างจาก `last_notified_at` ≥ `intervalRound2` นาที | ทุก 30 นาทีหลังจากนั้น |

### State Transitions (DeviceNotifyState)

```
เครื่อง online
  → upsert: offline_since=null, r1_sent_at=null, last_notified_at=null  ← reset ทุกครั้ง

เครื่อง offline (ครั้งแรก / หลัง online กลับมา)
  → upsert: offline_since = online_time ของเครื่อง (เวลา ping ล่าสุด)

offline นาน ≥ intervalRound1 และ r1_sent_at=null
  → ส่ง R1
  → update: r1_sent_at=now, last_notified_at=now

offline ต่อเนื่อง และ (now - last_notified_at) ≥ intervalRound2
  → ส่ง R2
  → update: last_notified_at=now
```

### พฤติกรรมเมื่อเครื่อง Online กลับมาแล้ว Offline ใหม่

- `offline_since` และ `r1_sent_at` ถูก reset เป็น null ตอน online
- เมื่อ offline ใหม่ → นับรอบใหม่ตั้งแต่ต้น → ได้ R1 ก่อนเสมอ

### Fallback (โรงเรียนที่ยังไม่มีข้อมูลใน DB)

| ค่า | Default |
|---|---|
| ช่วงเวลา รอบ 1 | 06:00–08:00 |
| ช่วงเวลา รอบ 2 | 15:00–17:00 |
| ช่วงห่าง รอบแรก (R1) | 5 นาที |
| ช่วงห่าง รอบถัดไป (R2) | 30 นาที |

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
      → LINE: SUCCESS (พร้อม notify_round) / FAILED / SKIPPED
      → รายการเครื่องออฟไลน์: device_id, app_name, offline NNN นาที, สถานะแจ้งเตือน
```

---

## DB Tables ที่เกี่ยวข้อง

| Table | DB | คำอธิบาย |
|---|---|---|
| `bot_setting` | Timesheet (PostgreSQL) | key=`line_bot_enabled`, value=`"true"/"false"` |
| `device_notify_time_window` | JabjaiMaster (SQL Server) | ช่วงเวลาแจ้งเตือน ต่อโรงเรียน (`@@unique([school_id, round])`) |
| `device_notify_interval` | JabjaiMaster (SQL Server) | ช่วงห่างแจ้งเตือน ต่อโรงเรียน (`@@unique([school_id, round])`) |
| `device_notify_state` | JabjaiMaster (SQL Server) | State รายเครื่อง — track `offline_since`, `r1_sent_at`, `last_notified_at` (`@@unique([school_id, device_id])`) |
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
      "notify_round": 1,
      "group_id": "Cxxx",
      "error": null
    }
  }
}
```

`notify_round`: `1` = รอบแรก, `2` = รอบถัดไป, `null` = skipped หรือไม่ได้ใช้ interval check

---

## การตั้งค่าช่วงเวลาและช่วงห่างต่อโรงเรียน

แก้ไขได้ที่หน้า **ตรวจสอบสถานะอุปกรณ์** → คลิกชื่อโรงเรียน → Drawer → แถบ "ตั้งค่าการแจ้งเตือน LINE"

กดปุ่ม "วิธีใช้งาน" มุมขวาบนของหน้าเพื่อดูคำอธิบาย logic ทั้งหมดในรูปแบบ Modal

API ที่รองรับ:
```
GET    /api/v2/hardware/device-notify-config?school_id=xxx
POST   /api/v2/hardware/device-notify-config?school_id=xxx        # เพิ่มรอบใหม่ (max 3)
PATCH  /api/v2/hardware/device-notify-config/time-windows/{id}?school_id=xxx
DELETE /api/v2/hardware/device-notify-config/time-windows/{id}?school_id=xxx
PATCH  /api/v2/hardware/device-notify-config/intervals/{id}?school_id=xxx
```
