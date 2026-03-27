# ✨ API Documentation: Overtime Analytics Dashboard

- **Purpose**: เพื่อใช้ในการดึงข้อมูลมาแสดงผลใน Dashboard (Visualisation) สำหรับแสดงภาพรวมการทำงานล่วงเวลา (OT)
- **Method**: `GET`
- **Endpoint**: `/api/v1/timesheet/overtime/analytics`

---

## 🛠 Request Specifications

### Headers

| Name         | Value              | Requirement |
| ------------ | ------------------ | ----------- |
| Content-Type | `application/json` | Required    |

### Query Parameters

| Payload (snake_case) | Type     | Required | Description                  |
| -------------------- | -------- | -------- | ---------------------------- |
| `start_date`         | `string` | No       | วันที่เริ่มต้น (YYYY-MM-DD)  |
| `end_date`           | `string` | No       | วันที่สิ้นสุด (YYYY-MM-DD)   |
| `department_id`      | `string` | No       | รหัสแผนกที่ต้องการกรองข้อมูล |

---

## 📦 Response Format

### Success Response (200 OK)

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลวิเคราะห์สำเร็จ",
  "message_en": "Successfully retrieved overtime analytics.",
  "data": {
    "trends": [
      {
        "month": "2024-01",
        "label": "ม.ค. 2024",
        "total_hours": 120,
        "request_count": 15
      }
    ],
    "department_breakdown": [
      {
        "id": 1,
        "department_name": "ไอที / เทคโนโลยี",
        "total_hours": 85,
        "percentage": 70.83
      }
    ],
    "budget_tracking": [
      {
        "month": "2024-01",
        "label": "ม.ค. 2024",
        "actual_hours": 120,
        "budget_hours": 150,
        "usage_percentage": 80
      }
    ],
    "summary": {
      "total_hours": 120,
      "total_requests": 15,
      "avg_hours_per_request": 8
    }
  }
}
```

---

## 🚀 Business Logic Notes

1. **Trend Chart Calculation**: กราฟแสดงแนวโน้มจะคำนวณจากทุกรายการที่มี `request_date` อยู่ในช่วงที่ระบุ (ค่าเริ่มต้นคือย้อนหลัง 5 เดือนล่าสุดรวมเดือนปัจจุบัน)
2. **Budget Simulation**: เนื่องจากปัจจุบันยังไม่มีตารางเก็บข้อมูล Budget รายเดือน ระบบจึงใช้ค่าคงที่ (150 ชม./เดือน) เป็นฐานสำหรับการคำนวณเพื่อใช้เป็น Prototype สำหรับ Dashboard ในเบื้องต้น
3. **Department Aggregation**: สัดส่วนแผนกคำนวณจาก `total_hours` เปรียบเทียบกับผลรวมทั้งหมด และส่งค่า `percentage` กลับไปเพื่อใช้สำหรับ Pie Chart ทันที
