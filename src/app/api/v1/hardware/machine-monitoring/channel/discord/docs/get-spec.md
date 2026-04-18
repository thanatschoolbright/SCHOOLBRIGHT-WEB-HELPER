# GET /api/v1/hardware/machine-monitoring/channel/discord

ดึงข้อมูลสถานะเครื่อง POS จาก DB แล้วส่ง Discord webhook แบบกระชับ — ออกแบบสำหรับ Vercel Cron Job และ GitHub Actions

## Authorization

Header `Authorization: Bearer {CRON_SECRET}` — ถ้าไม่ตั้งค่า `CRON_SECRET` ใน env จะข้ามการตรวจสอบ

## Environment Variables

| Key | หน้าที่ |
|---|---|
| `NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MACHINE_MONITORING` | Discord Webhook URL ปลายทาง |
| `CRON_SECRET` | ป้องกันการเรียกจากภายนอก |

## Discord Payload

- **1 embed** เท่านั้น ประกอบด้วย
  - field สรุปภาพรวม: ทั้งหมด / ออนไลน์ / ออฟไลน์ / ใช้งานอยู่ / อัตราออนไลน์
  - field(s) รายละเอียดเครื่อง offline จัดกลุ่มตามโรงเรียน (chunk ≤ 1,024 ตัวอักษรต่อ field, สูงสุด 25 fields)
- `content: "@here ..."` — ส่งเฉพาะเมื่อ offline ≥ 5 (CRITICAL_THRESHOLD)

## Response

```json
{ "status_code": 200, "data": { "total": 120, "online": 108, "offline": 12, "online_rate": 90 } }
```
