# Create School Line Group API

## Purpose
สร้างข้อมูลกลุ่ม LINE ใหม่สำหรับโรงเรียนเพื่อใช้ในการส่งรายงานสถานะฮาร์ดแวร์

## Schema
### Request (POST)
- `school_id` (Number, Required): รหัสโรงเรียน
- `group_id` (String, Required): Group ID ของ LINE
- `line_notification_access_token` (String, Required): Access Token สำหรับส่งการแจ้งเตือน
- `group_type` (String, Optional): ประเภทของกลุ่ม (Default: "general")

### Response
- `status_code`: 201
- `message_th`: "สร้างข้อมูลกลุ่ม LINE สำเร็จ"
- `data`: วัตถุข้อมูลที่สร้างขึ้น

## Logic Note
- บันทึกข้อมูลลงในตาราง `tLineGroup` ของ Jabjai Master DB
- ระบบจะบันทึก `CreateDate` เป็นเวลาปัจจุบันโดยอัตโนมัติ
