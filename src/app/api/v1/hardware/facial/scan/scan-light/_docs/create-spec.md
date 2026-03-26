# ✨ API SPECIFICATION: [POST] /api/v1/hardware/facial/scan/scan-light

## 🎯 Purpose

วัตถุประสงค์ของ API นี้คือเพื่อให้นักพัฒนาสามารถเรียกใช้ระบบแสกนใบหน้าแบบจำลอง (Simulation Mode) โดยเชื่อมต่อกับระบบส่วนกลางของ School Bright และดึงข้อมูลการเข้างานที่มีการจัดรูปแบบข้อมูลให้พร้อมสำหรับการแสดงผลที่หน้าบ้าน

---

## 🛠 Schema

### ⬆️ Request Payload (JSON)

| Field       | Type     | Required | Description                                 |
| ----------- | -------- | -------- | ------------------------------------------- |
| `school_id` | `string` | ✅       | รหัสโรงเรียน                                |
| `user_code` | `string` | ✅       | รหัสพนักงานหรือนักเรียน                     |
| `s_id`      | `string` | ✅       | รหัสผู้ใช้ (sID)                            |
| `version`   | `string` | ❌       | เวอร์ชันของ API กายภาพ (ค่าเริ่มต้น: 1.2.5) |

### ⬇️ Response Structure (Success 200)

| Field         | Type     | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `status_code` | `number` | รหัสสถานะ HTTP (200)                      |
| `message_th`  | `string` | ข้อความแจ้งเตือนภาษาไทย                   |
| `message_en`  | `string` | ข้อความแจ้งเตือนภาษาอังกฤษ                |
| `data`        | `array`  | ข้อมูลบันทึกเวลาที่ได้รับจาก Hardware API |

### ⬇️ Response Structure (Error)

| Field         | Type     | Description                |
| ------------- | -------- | -------------------------- |
| `status_code` | `number` | รหัสสถานะ Error (400, 500) |
| `message_th`  | `string` | ข้อความ ERROR ภาษาไทย      |
| `message_en`  | `string` | ข้อความ ERROR ภาษาอังกฤษ   |

---

## 📝 Logic Note

1. **Validation**: ใช้ Zod ในการตรวจสอบข้อมูล Request Payload ก่อนเข้าสู่ Service Layer
2. **Attendance Mapping**: มีการแปลงรหัสสถานะ `LogScanStatus` ของทางโรงเรียนให้เป็นข้อความที่หน้าบ้านสื่อสารง่าย (User-Friendly Text) เช่น:
   - 0, 7 ➜ มาตรงเวลา
   - 1 ➜ มาสาย
   - 3, -3 ➜ ขาดเรียน
   - 99 ➜ ยังไม่เช็ค
3. **Data Return**: คืนค่าข้อมูลที่ถูกจัดรูปแบบแล้ว (formattedData) พร้อม Field พิเศษ `attendance_status`.
