# Server Health Status Email API Spec

## Purpose

API สำหรับสั่งการส่งรายงานสถานะ Server สรุปรายวัน/รายรอบ ไปยังผู้พัฒนาและผู้ดูแลระบบผ่าน E-mail โดยใช้ Template ที่สวยงาม (Modern Sarabun Style) เพื่อการตรวจสอบความพร้อมของระบบ SchoolBright Infrastructure

## Schema

### Request

- **Method:** `GET`
- **URL:** `/api/v2/server/status/channel/email`
- **Headers:**
  - `Authorization: Bearer <Token>` (ถ้ามี)
- **Query Params:** (None)

### Response

```json
{
  "status_code": 200,
  "message_th": "ส่งอีเมลรายงานสถานะ Server สำเร็จแล้ว",
  "message_en": "Server status report email sent successfully",
  "data": {
    "total": 15,
    "online": 14,
    "offline": 1,
    "health_score": 93,
    "report_time": "20/04/2026 14:30 น."
  }
}
```

## Logic Note

1. ดึงข้อมูลสถานะล่าสุดจาก API `/api/v2/server/status` (Internal call)
2. คำนวณ Health Score (Online/Total %)
3. สร้าง HTML Template โดยอิงตามแบบของ Machine Monitoring Email (Header ดำ, สรุปในกล่องเทา, ตารางรายละเอียด)
4. ส่งอีเมลผ่าน `nodemailer` โดยใช้ข้อมูลจาก `SERVER_REPORT_EMAILS` ใน environment
5. ทำงานแบบ Sync (รอส่งเสร็จ) เพื่อแจ้งผลทาง UI ทันที
