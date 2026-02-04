# Read Leave Letter API

API สำหรับดึงข้อมูลรายการจดหมายลาของผู้ใช้งาน

## ข้อมูลพื้นฐาน

- **Method:** `GET`
- **URL:** `/api/v1/mobile/leave-letter/read`
- **Authentication:** Forwarding headers (Token/Cookie)

## พารามิเตอร์ (Query Parameters)

| ชื่อ      | ประเภท   | จำเป็น | คำอธิบาย               |
| --------- | -------- | ------ | ---------------------- |
| `user_id` | `string` | ใช่    | ไอดีของผู้ใช้งาน       |
| `page`    | `string` | ไม่ใช่ | ลำดับหน้า (Default: 1) |

## ตัวอย่างการเรียกใช้งาน (cURL)

```bash
curl -X GET "/api/v1/mobile/leave-letter/read?user_id=123&page=1" \
  -H "accept: application/json"
```

## รูปแบบการตอบกลับ (Response Body)

```json
{
  "success": true,
  "message_th": "ดึงข้อมูลจดหมายลาหยุดสำเร็จ",
  "message_en": "Leave letters fetched successfully",
  "data": {
    "data": [
      {
        "id": "...",
        "status": "...",
        "start_date": "...",
        "end_date": "...",
        "reason": "..."
      }
    ],
    "pagination": {
      "total": 100,
      "current_page": 1,
      "per_page": 10
    }
  }
}
```

## รหัสสถานะ (Status Codes)

- `200`: สำเร็จ
- `400`: พารามิเตอร์ไม่ถูกต้อง
- `500`: เกิดข้อผิดพลาดที่ฝั่งเซิร์ฟเวอร์
