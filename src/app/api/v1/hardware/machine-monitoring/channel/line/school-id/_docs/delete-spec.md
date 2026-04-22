# Delete School Line Group API

## Purpose
ลบข้อมูลกลุ่ม LINE ออกจากระบบ

## Schema
### Request (DELETE)
- `line_group_id` (Number, Required): ID ของกลุ่มที่ต้องการลบ

### Response
- `status_code`: 200
- `message_th`: "ลบข้อมูลกลุ่ม LINE สำเร็จ"
- `data`: ข้อมูลที่ถูกลบออกไป

## Logic Note
- ลบข้อมูลจากตาราง `tLineGroup` ตามรหัสที่ระบุ
