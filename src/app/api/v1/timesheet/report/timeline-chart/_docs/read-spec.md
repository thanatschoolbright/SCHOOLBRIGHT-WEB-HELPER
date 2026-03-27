# API Specification: Project Timeline Chart

## Purpose

ใช้สำหรับดึงข้อมูลโครงการ (Project) และโครงการย่อย (Feature) เพื่อนำไปแสดงผลในรูปแบบ Gantt Chart หรือ Timeline รายงานภาพรวมโครงการ

## Schema

### Request (Query Parameters)

| Name       | Type         | Description                           |
| ---------- | ------------ | ------------------------------------- |
| start_date | string (ISO) | วันที่เริ่มต้นของช่วงเวลาที่ต้องการดู |
| end_date   | string (ISO) | วันที่สิ้นสุดของช่วงเวลาที่ต้องการดู  |
| project_id | number       | ID ของโครงการ (ถ้าต้องการระบุเจาะจง)  |

### Response (JSON)

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลสำเร็จ",
  "message_en": "Data retrieved successfully",
  "data": [
    {
      "id": "p-1",
      "name": "ชื่อโครงการ",
      "name_en": "Project Name",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "status": "open",
      "status_name": "กำลังดำเนินงาน",
      "type": "project",
      "children": [
        {
          "id": "f-1",
          "name": "ชื่อโครงการย่อย",
          "name_en": "Feature Name",
          "start_date": "2024-01-01T00:00:00.000Z",
          "end_date": "2024-02-01T00:00:00.000Z",
          "status": "open",
          "type": "feature"
        }
      ]
    }
  ]
}
```

## Logic Note

- ระบบจะดึงข้อมูล Project พร้อม Features ที่ยังไม่ถูกลบ (`is_deleted: false`)
- มีการรวมผลโครงการย่อย (Features) ไว้ใน `children` ของแต่ละโครงการ
- กรองตามช่วงเวลาที่ระบุ โดยโครงการจะถูกแสดงถ้ามีช่วงเวลาทับซ้อนกับที่กำหนด
