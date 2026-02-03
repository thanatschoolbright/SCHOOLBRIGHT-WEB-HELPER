# Capturable Details Read API

เอกสารอธิบายการทำงานของ API สำหรับดึงรายละเอียดการลงเวลารายโครงการ เพื่อใช้ประกอบการตรวจสอบ (Audit/Tracking) ในรายงาน Capitalization

## ข้อมูลทั่วไป

- **Endpoint:** `/api/v1/timesheet/report/capturable-details/read`
- **Method:** `POST`
- **Description:** ดึงรายการลงเวลาทั้งหมดของโครงการในช่วงวันที่ระบุ พร้อมข้อมูลผู้ใช้งานและฟีเจอร์

## Request Body (Snake Case)

| Parameter    | Type     | Required | Description                 |
| ------------ | -------- | -------- | --------------------------- |
| `project_id` | `number` | Yes      | ID ของโครงการ               |
| `start_date` | `string` | Yes      | วันที่เริ่มต้น (YYYY-MM-DD) |
| `end_date`   | `string` | Yes      | วันที่สิ้นสุด (YYYY-MM-DD)  |

### Example Request

```json
{
  "project_id": 1,
  "start_date": "2024-03-01",
  "end_date": "2024-03-31"
}
```

## Response Body (Snake Case)

| Parameter     | Type     | Description           |
| ------------- | -------- | --------------------- |
| `status_code` | `number` | รหัสสถานะ (200)       |
| `message_th`  | `string` | ข้อความตอบกลับไทย     |
| `data`        | `array`  | รายการข้อมูลการลงเวลา |

### Data Object Structure

| Field                | Type     | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `entry_id`           | `number` | ID ของรายการลงเวลา                 |
| `date`               | `string` | วันที่ลงเวลา                       |
| `hours`              | `number` | จำนวนชั่วโมง                       |
| `description`        | `string` | รายละเอียดงาน                      |
| `admin_id`           | `number` | Admin ID ของผู้ลง                  |
| `user_name`          | `string` | ชื่อ-นามสกุลผู้ลง                  |
| `user_nickname`      | `string` | ชื่อเล่น                           |
| `feature_name`       | `string` | ชื่อฟีเจอร์                        |
| `asset_capture_type` | `string` | ประเภท (CAPTUREABLE/UNCAPTUREABLE) |

### Example Response

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลรายละเอียดสำเร็จ",
  "data": [
    {
      "entry_id": 102,
      "date": "2024-03-20",
      "hours": 8,
      "description": "พัฒนาระบบหลังบ้านส่วนรายงาน",
      "admin_id": 55,
      "user_name": "สมชาย ใจดี",
      "user_nickname": "ชาย",
      "feature_name": "Report Module",
      "asset_capture_type": "CAPTUREABLE"
    }
  ]
}
```
