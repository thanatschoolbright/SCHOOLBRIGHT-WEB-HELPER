# Read School Line Group API

## Purpose
ดึงข้อมูลรายชื่อกลุ่ม LINE ทั้งหมดพร้อมระบบแบ่งหน้าและค้นหาตามรหัสโรงเรียน

## Schema
### Request (POST)
- `page` (Number, Optional): เลขหน้าที่ต้องการ (Default: 1)
- `limit` (Number, Optional): จำนวนรายการต่อหน้า (Default: 10)
- `school_id` (Number, Optional): รหัสโรงเรียนสำหรับกรองข้อมูล

### Response
- `status_code`: 200
- `message_th`: "ดึงข้อมูลกลุ่ม LINE สำเร็จ"
- `data`: รายการกลุ่ม LINE
- `pagination`: ข้อมูลการแบ่งหน้า

## Logic Note
- ดึงข้อมูลจากตาราง `tLineGroup` เรียงลำดับตามวันที่สร้างล่าสุด
