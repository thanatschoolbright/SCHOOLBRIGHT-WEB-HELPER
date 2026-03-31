# POST /api/v2/server/status

## Purpose
ทำงานเหมือน GET แต่รับ `mode` ผ่าน JSON body แทน query parameter
เหมาะสำหรับใช้กับ Cron Job หรือ Scheduled Task ที่ต้องการส่ง POST request

---

## Request Body

```json
{
  "mode": "discord"
}
```

| Field | Type   | Required | Description                                         |
|-------|--------|----------|-----------------------------------------------------|
| mode  | string | No       | ระบุ `"discord"` เพื่อส่งรายงานไปยัง Discord Webhook |

---

## Response Schema

### 200 OK

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลสถานะเซิร์ฟเวอร์สำเร็จ",
  "message_en": "Server status fetched successfully",
  "timestamp": "31/03/2569",
  "data": [...]
}
```

รูปแบบ `data[]` เหมือนกับ GET response ทุกประการ (ดู `get-spec.md`)

### 500 Internal Server Error

```json
{
  "status_code": 500,
  "message_th": "ดึงข้อมูลสถานะเซิร์ฟเวอร์ไม่สำเร็จ",
  "message_en": "Internal Server Error",
  "data": null
}
```

---

## Logic Notes

- Body ที่ไม่ใช่ JSON หรือ parse ไม่ได้จะถูก fallback เป็น `{}` อัตโนมัติ
- Business logic การตรวจสอบ Server เหมือนกับ GET ทุกประการ
- ใช้ร่วมกับ Cron Schedule เช่น `POST /api/v2/server/status` body `{ "mode": "discord" }` ทุก 8:00 น.
