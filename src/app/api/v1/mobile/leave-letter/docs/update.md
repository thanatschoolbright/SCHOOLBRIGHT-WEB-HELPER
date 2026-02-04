# Update Leave Letter Status API

API สำหรับแก้ไขหรือปรับปรุงสถานะจดหมายลา (Fix Status)

## ข้อมูลพื้นฐาน

- **Method:** `GET` (หมายเหตุ: ระบบเดิมใช้ GET ในการ Trigger Update)
- **URL:** `/api/v1/mobile/leave-letter/update`
- **Authentication:** Forwarding headers (Token/Cookie)

## พารามิเตอร์ (Query Parameters)

| ชื่อ        | ประเภท   | จำเป็น | คำอธิบาย        |
| ----------- | -------- | ------ | --------------- |
| `letter_id` | `string` | ใช่    | ไอดีของจดหมายลา |
| `school_id` | `string` | ใช่    | ไอดีของโรงเรียน |

## ตัวอย่างการเรียกใช้งาน (cURL)

```bash
curl -X GET "/api/v1/mobile/leave-letter/update?letter_id=999&school_id=123" \
  -H "accept: application/json"
```

## รูปแบบการตอบกลับ (Response Body)

```json
{
  "status_code": 200,
  "message_th": "อัปเดตสถานะจดหมายลาหยุดสำเร็จ",
  "message_en": "Leave letter status updated successfully",
  "data": {
    "status": "success",
    "curl": "curl ..."
  }
}
```

## Logic Note

- ระบบจะเรียกใช้ `/api/LeaveCalendar/update` ของระบบหลัก
- ใช้สำหรับการ Fix สถานะที่มีความผิดปกติ (Inconsistency) ระหว่างระบบ
- ถึงแม้จะเป็นการ Update แต่ในระดับ Integration กับระบบเดิมยังคงใช้ Method `GET` ตาม Legacy API
