# GET /api/v2/server/status/log

## Purpose
ดึงรายการ log การตรวจสอบสถานะ Server ที่บันทึกไว้ใน Timesheet DB (ตาราง `api_log`)
รองรับ filter ตาม Server name, สถานะ Online/Offline, และช่วงวันที่
ข้อมูลเก็บสูงสุด 30 วัน (ลบออกอัตโนมัติเมื่อ POST บันทึก log ใหม่)

---

## Query Parameters

| Parameter   | Type   | Required | Default | Description                        |
|-------------|--------|----------|---------|------------------------------------|
| page        | number | No       | 1       | หน้าที่ต้องการ                      |
| page_size   | number | No       | 20      | จำนวนรายการต่อหน้า (max 100)        |
| server_name | string | No       | -       | กรองตาม endpoint ที่มีคำนี้         |
| status      | string | No       | -       | "Online" หรือ "Offline"            |
| date_from   | string | No       | -       | วันที่เริ่มต้น (ISO 8601)           |
| date_to     | string | No       | -       | วันที่สิ้นสุด (ISO 8601)            |

---

## Data Mapping (api_log fields)

| api_log field  | ความหมาย                              |
|----------------|---------------------------------------|
| service_name   | "SERVER_STATUS_MONITOR" (fixed)       |
| trace_id       | server key เช่น "SERVER_PROD_SBAPI"   |
| called_by      | "Online" หรือ "Offline"               |
| duration_ms    | response_time ของ server (ms)         |
| response_body  | { server_name_th, environment }       |

---

## Response Schema

```json
{
  "status": 200,
  "message_th": "ดึงข้อมูล log สำเร็จ",
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 500,
    "total_pages": 25
  }
}
```
