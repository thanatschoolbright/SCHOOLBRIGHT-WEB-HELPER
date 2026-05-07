# GET /api/v2/hardware/device-notify-config

ดึงการตั้งค่าช่วงเวลาและช่วงห่างการแจ้งเตือน LINE สำหรับ Hardware Monitor

## Auth
Session required (any authenticated user)

## Response 200
```json
{
  "status": 200,
  "data": {
    "time_windows": [
      { "id": 1, "round": 1, "label": "รอบเช้า", "start_hour": 6, "start_min": 0, "end_hour": 8, "end_min": 0, "is_active": true, "updated_at": "..." },
      { "id": 2, "round": 2, "label": "รอบบ่าย", "start_hour": 15, "start_min": 0, "end_hour": 17, "end_min": 0, "is_active": true, "updated_at": "..." }
    ],
    "intervals": [
      { "id": 1, "round": 1, "label": "รอบแรก (หลัง Offline)", "interval_minutes": 5, "is_active": true, "updated_at": "..." },
      { "id": 2, "round": 2, "label": "รอบถัดไป", "interval_minutes": 30, "is_active": true, "updated_at": "..." }
    ]
  }
}
```

# PATCH /api/v2/hardware/device-notify-config/time-windows/[id]

อัปเดตช่วงเวลาแจ้งเตือนตาม id

## Body
```json
{
  "label": "รอบเช้า",
  "start_hour": 6,
  "start_min": 0,
  "end_hour": 8,
  "end_min": 0,
  "is_active": true
}
```

# PATCH /api/v2/hardware/device-notify-config/intervals/[id]

อัปเดตช่วงห่างการแจ้งเตือนตาม id

## Body
```json
{
  "label": "รอบแรก (หลัง Offline)",
  "interval_minutes": 5,
  "is_active": true
}
```

## Notes
- ข้อมูล default จะถูก seed ไว้ใน DB แล้ว (round 1 & 2 ทั้ง time_windows และ intervals)
- Cronjob อ่านจาก DB ทุกครั้งที่รัน — ไม่ cache
- ไม่มี create/delete — แก้ไขเฉพาะ row ที่มีอยู่
