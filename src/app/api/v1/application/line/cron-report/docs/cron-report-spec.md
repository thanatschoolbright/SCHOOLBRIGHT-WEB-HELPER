# LINE Cron Report — Spec

**Endpoint:** `GET /api/v1/application/line/cron-report`
**Trigger:** Vercel Cron Job ทุก 10 นาที (`*/10 * * * *`)

## Purpose
ดึงสถิติสถานะอุปกรณ์ POS ทั้งหมดจาก DB แล้วส่ง Flex Message ไปยัง LINE Group (Monitoring Bot) อัตโนมัติ

## Environment Variables (server-only)
| Variable | Description |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Long-lived access token สำหรับ push message |
| `LINE_MONITORING_GROUP_ID` | Group ID ของ LINE Group ที่ต้องการรับรายงาน |
| `CRON_SECRET` | Secret สำหรับ protect endpoint (Vercel ส่งเป็น Bearer token) |

## Security
Vercel Cron ส่ง `Authorization: Bearer <CRON_SECRET>` มาให้อัตโนมัติ
ถ้า `CRON_SECRET` ไม่ตรงจะ return 401

## วิธีหา LINE Group ID
1. เพิ่ม LINE Bot เข้ากลุ่ม
2. ส่งข้อความใดก็ได้ในกลุ่ม
3. ดู webhook event ที่ `POST /api/v1/application/line/webhook` — field `event.source.groupId`

## Response
```json
{
  "status_code": 200,
  "data": { "total": 100, "online": 95, "offline": 5, "login": 80, "onlineRate": 95, "totalSchools": 42, "reportTime": "17/04/2026 10:00 น." }
}
```

## Flex Message
แสดง 4 stat boxes: ทั้งหมด / ออนไลน์ / ออฟไลน์ / ใช้งาน + progress bar อัตราออนไลน์ + badge สถานะ (ปกติ/ต้องระวัง/วิกฤต)
