# Leave Management Read Specification

## Purpose

ดึงข้อมูลรายการลาหยุดในระดับผู้ดูแลระบบ (Admin) เพื่อใช้ในการตรวจสอบและจัดการข้อมูลการลาของนักเรียน/ครูในระบบ SchoolBright

## Schema

### Request (Query Parameters)

- `userid`: string (Required) - ส่งในรูปแบบ `id/page` (เช่น `1233762/1`) ผ่าน Parameter `search`
- `school_id` (string): รหัสโรงเรียน

### Response

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลการลาสำเร็จ",
  "message_en": "Leave data retrieved successfully",
  "data": {
    "list": [],
    "pagination": {}
  }
}
```

## Logic Note

- API นี้จะทำการ Forward Header ที่จำเป็นไปยัง Backend หลักของ SchoolBright
- รองรับการกรองข้อมูลตามช่วงวันที่และโรงเรียน (ถ้ามีสิทธิ์)
- ตรวจสอบความถูกต้องของข้อมูลผ่าน Zod Schema ก่อนการเรียกใช้ Service
