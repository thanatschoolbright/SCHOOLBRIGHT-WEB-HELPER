# GET /api/v1/hardware/machine-monitoring/channel/email

ดึงข้อมูลสถานะเครื่อง POS จาก DB แล้วส่งรายงาน HTML ทางอีเมล — ออกแบบสำหรับ GitHub Actions Cron

## Authorization

ไม่ต้องการ Authorization header

## Environment Variables

| Key | หน้าที่ |
|---|---|
| `MAILER_HOST` / `MAILER_USER` / `MAILER_PASS` | SMTP config สำหรับส่ง Email |

## ผู้รับอีเมล

กำหนดใน `machine-monitoring.service.ts`:
- narin@schoolbright.co
- tantawan.tawan@schoolbright.co
- ariya.goff@schoolbright.co

## Response

```json
{ "status_code": 200, "data": { "total": 120, "online": 108, "offline": 12, "online_rate": 90 } }
```
