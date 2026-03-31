# GET /api/v2/server/status

## Purpose
ตรวจสอบสถานะ Server Production ทุกตัวของ SchoolBright แบบ Parallel
และคืนผลรวมพร้อม response_time และระดับความรุนแรง
หากระบุ `?mode=discord` จะส่งรายงานไปยัง Discord Webhook โดยอัตโนมัติ

---

## Query Parameters

| Parameter | Type   | Required | Description                                          |
|-----------|--------|----------|------------------------------------------------------|
| mode      | string | No       | ระบุ `discord` เพื่อส่งรายงานไปยัง Discord Webhook  |

---

## Response Schema

### 200 OK

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลสถานะเซิร์ฟเวอร์สำเร็จ",
  "message_en": "Server status fetched successfully",
  "timestamp": "31/03/2569",
  "data": [
    {
      "server": "SERVER_PROD_SBAPI",
      "server_name": "SCHOOL BRIGHT MOBILE APPLICATION API",
      "server_name_th": "1.ระบบหลังบ้าน SB App",
      "server_name_en": "Backend Service for School Bright App",
      "environment": "Production",
      "url": "https://...",
      "endpoint": "/api/SeverStatus",
      "description": "...",
      "timestamp": "31/03/2569",
      "status_code": 200,
      "status": "Online",
      "message": null,
      "response_time": 0.412,
      "response_time_severity_level": "low"
    }
  ]
}
```

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

## Field Descriptions

| Field                          | Type                              | Description                                  |
|--------------------------------|-----------------------------------|----------------------------------------------|
| status                         | `"Online"` \| `"Offline"`        | สถานะการเชื่อมต่อ                            |
| status_code                    | number                            | HTTP status code ที่ได้รับจาก server นั้น    |
| response_time                  | number (seconds, 3 decimal)       | เวลาตอบสนองเป็นวินาที                        |
| response_time_severity_level   | `"low"` \| `"medium"` \| `"high"` \| `"error"` | < 3s = low, < 5s = medium, ≥ 5s = high |

---

## Logic Notes

- ใช้ `Promise.all` เรียก Server ทุกตัวพร้อมกัน ไม่รอคิว
- Timeout ตั้งไว้ที่ **10,000ms** หากเกินจะถือว่า Offline
- `status_code` 200 หรือ 404 ถือว่า **Online** (บาง server คืน 404 ตาม design)
- Discord Webhook จะส่งเฉพาะเมื่อระบุ `?mode=discord` เท่านั้น
