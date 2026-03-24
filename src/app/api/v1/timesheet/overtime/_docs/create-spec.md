# Overtime Create API Specification

## 🚀 Purpose

ใช้สำหรับสร้างคำขออนุมัติทำงานล่วงเวลา (OT) ใหม่ พร้อมส่งอีเมลแจ้งเตือนไปยังผู้บริหารและผู้ขอโดยอัตโนมัติ

## 📑 Schema

### Request (POST) - Header: `Content-Type: application/json`

| Field           | Type     | Description                         | Required |
| --------------- | -------- | ----------------------------------- | -------- |
| `requester_id`  | `string` | ID ของผู้ขอจากระบบ (admin_id)       | No       |
| `first_name`    | `string` | ชื่อต้น                             | No       |
| `last_name`     | `string` | นามสกุล                             | No       |
| `employee_code` | `string` | รหัสพนักงาน                         | No       |
| `role`          | `string` | ตำแหน่ง                             | No       |
| `department`    | `string` | แผนก                                | No       |
| `request_date`  | `string` | วันที่ทำรายการ (ISO Date)           | No       |
| `start_time`    | `string` | เวลาเริ่ม                           | No       |
| `end_time`      | `string` | เวลาสิ้นสุด                         | No       |
| `overtime_type` | `string` | ประเภท OT                           | No       |
| `descriptions`  | `array`  | รายละเอียดงาน (ดูโครงสร้างด้านล่าง) | No       |
| `approver_id`   | `string` | ID ของผู้อนุมัติ                    | No       |
| `status`        | `string` | สถานะ (Pending/Approved)            | No       |
| `created_by`    | `number` | ID ผู้สร้าง                         | No       |

#### descriptions structure:

- `date`: วันที่ปฏิบัติงาน
- `startDate`: วันที่/เวลาเริ่ม
- `endDate`: วันที่/เวลาจบ
- `duration`: จำนวนชั่วโมง (number)
- `description`: รายละเอียดงาน
- `assignee`: ผู้เกี่ยวข้อง

### Response (Standard Format)

```json
{
  "status_code": 201,
  "message_th": "สร้างรายการสำเร็จ",
  "message_en": "Created",
  "data": { "id": "uuid" }
}
```

## 🧠 Logic Note

1. **Validation**: ตรวจสอบ Payload ด้วย `CreateOvertimeSnakeSchema` (Zod)
2. **Database**: บันทึกข้อมูลลงตาราง `overtime` และ `overtime_description` ใน `PrismaTimesheet`
3. **Notification**:
   - ดึงข้อมูลพนักงานจาก DB เพื่อข้อมูลที่สมบูรณ์ (FullName, Email)
   - ส่งอีเมลหาผู้บัญชาการ (Manager Email)
   - ส่งอีเมลยืนยันหาผู้ขอ (Requester Email) หากตั้งค่าอีเมลไว้
4. **Error Handling**: หาก Step ใดหลุด จะดักด้วย Global `handleError`
