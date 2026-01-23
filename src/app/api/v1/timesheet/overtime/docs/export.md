# Export Overtime API Documentation

## Description

API สำหรับส่งออกรายการ Overtime (OT) ทั้งหมดหรือตามเงื่อนไขที่กำหนด โดยผลลัพธ์จะเป็นไฟล์ Excel (.xlsx)

## Endpoint

`POST /api/v1/timesheet/overtime/export`

## Request Body (Snake Case)

| Parameter      | Type   | Required | Description                                    |
| -------------- | ------ | -------- | ---------------------------------------------- |
| `from`         | string | No       | วันที่เริ่มต้น (YYYY-MM-DD)                    |
| `to`           | string | No       | วันที่สิ้นสุด (YYYY-MM-DD)                     |
| `status`       | string | No       | สถานะของ OT (เช่น pending, approved, rejected) |
| `requester_id` | string | No       | รหัสผู้ขอ OT                                   |

### Example Request Body

```json
{
  "from": "2024-03-01",
  "to": "2024-03-31",
  "status": "approved",
  "requester_id": "EMP123"
}
```

## Response

### Success (200 OK)

Returns a binary file with content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

### Error (400 Bad Request / 500 Internal Server Error)

```json
{
  "status_code": 500,
  "message_th": "เกิดข้อผิดพลาดในการส่งออกข้อมูล OT",
  "message_en": "Error exporting overtime data",
  "error": { ... }
}
```
