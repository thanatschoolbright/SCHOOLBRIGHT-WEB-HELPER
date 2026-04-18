# GET /api/v1/hardware/machine-monitoring/channel/line

ดึงข้อมูลสถานะเครื่อง POS จาก DB แล้วส่ง Flex Message ไปยัง LINE Group — ออกแบบสำหรับ GitHub Actions Cron

## Authorization

Header `Authorization: Bearer {CRON_SECRET}` — ถ้าไม่ตั้งค่า `CRON_SECRET` ใน env จะข้ามการตรวจสอบ

## Environment Variables

| Key | หน้าที่ |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Long-lived access token สำหรับ push message |
| `LINE_MONITORING_GROUP_ID` | Group ID ของ LINE Group ที่รับรายงาน |
| `CRON_SECRET` | ป้องกันการเรียกจากภายนอก |

## Response

```json
{ "status_code": 200, "message_th": "ส่งรายงานไปยัง LINE สำเร็จ" }
```
