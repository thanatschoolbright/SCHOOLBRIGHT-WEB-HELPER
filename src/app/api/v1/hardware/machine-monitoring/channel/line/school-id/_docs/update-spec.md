# Update School Line Group API

## Purpose
แก้ไขข้อมูลกลุ่ม LINE เดิมที่มีอยู่ในระบบ

## Schema
### Request (PATCH)
- `line_group_id` (Number, Required): ID ของกลุ่มที่ต้องการแก้ไข
- `school_id` (Number, Optional): รหัสโรงเรียนใหม่
- `group_id` (String, Optional): Group ID ใหม่
- `line_notification_access_token` (String, Optional): Access Token ใหม่
- `group_type` (String, Optional): ประเภทกลุ่มใหม่

### Response
- `status_code`: 200
- `message_th`: "แก้ไขข้อมูลกลุ่ม LINE สำเร็จ"
- `data`: ข้อมูลที่ได้รับการอัปเดต

## Logic Note
- ตรวจสอบ `line_group_id` ว่ามีอยู่ในระบบหรือไม่ก่อนทำการอัปเดต (Prisma จัดการอัตโนมัติ)
- อัปเดตเฉพาะฟิลด์ที่ส่งมาเท่านั้น
