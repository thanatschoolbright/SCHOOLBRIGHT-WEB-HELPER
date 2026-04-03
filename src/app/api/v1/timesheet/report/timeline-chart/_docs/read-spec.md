# API Specification: Project Timeline Chart

## Purpose

ใช้สำหรับดึงข้อมูลโครงการ (Project) และโครงการย่อย (Feature) เพื่อนำไปแสดงผลในรูปแบบ Gantt Chart หรือ Timeline รายงานภาพรวมโครงการ

## Endpoints

### 1. GET `/api/v1/timesheet/report/timeline-chart/read`

ดึงข้อมูล Timeline พร้อม Filter หลายเงื่อนไข

#### Query Parameters

| Name             | Type         | Description                                            |
| ---------------- | ------------ | ------------------------------------------------------ |
| start_date       | string (ISO) | วันที่เริ่มต้นของช่วงเวลาที่ต้องการดู                  |
| end_date         | string (ISO) | วันที่สิ้นสุดของช่วงเวลาที่ต้องการดู                   |
| project_id       | number       | ID ของโครงการ (เจาะจงโครงการเดียว)                     |
| group_id         | number       | ID ของกลุ่มโครงการ                                     |
| status_id        | number       | ID ของสถานะโครงการ (projectStatusId)                   |
| category_type    | string       | ประเภทโครงการ: INTERNAL, EXTERNAL, MAINTENANCE, LEAVE  |
| approval         | string       | สถานะอนุมัติ: pending, approved, rejected               |
| sub_status_id    | number       | ID ของสถานะโครงการย่อย (กรองเฉพาะ Feature ที่มีสถานะนี้)|
| has_sub_projects | boolean      | true = มีโครงการย่อย, false = ไม่มีโครงการย่อย        |
| search           | string       | ค้นหาชื่อโครงการ (ภาษาไทย หรือ อังกฤษ)               |

#### Response

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลสำเร็จ",
  "data": [
    {
      "id": "p-1",
      "name": "ชื่อโครงการ",
      "name_en": "Project Name",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "status": "open",
      "status_name": "กำลังดำเนินงาน",
      "category_type": "INTERNAL",
      "approval": "approved",
      "group_name": "กลุ่มงานพัฒนา",
      "type": "project",
      "children": [
        {
          "id": "f-1",
          "name": "ชื่อโครงการย่อย",
          "name_en": "Feature Name",
          "start_date": "2024-01-01T00:00:00.000Z",
          "end_date": "2024-02-01T00:00:00.000Z",
          "status": "open",
          "status_name": "กำลังดำเนินงาน",
          "type": "feature",
          "project_id": 1
        }
      ]
    }
  ]
}
```

---

### 2. GET `/api/v1/timesheet/report/timeline-chart/groups/read`

ดึงรายการกลุ่มโครงการทั้งหมด (ใช้เป็น Dropdown ใน Filter)

#### Response

```json
{
  "status_code": 200,
  "data": [
    { "id": 1, "name": "กลุ่มงานพัฒนา", "name_en": "Development" }
  ]
}
```

---

## Filter Logic

- `start_date` + `end_date`: กรองโครงการที่มีช่วงเวลาทับซ้อนกับช่วงที่ระบุ
- `search`: ค้นหาแบบ case-insensitive จาก `name` หรือ `name_en`
- `sub_status_id`: กรอง Feature ใน children ที่มี `projectStatusId` ตรงกัน
- `has_sub_projects`: กรองหลัง query (post-filter) เพราะ Prisma ไม่รองรับ count condition ใน where โดยตรง
