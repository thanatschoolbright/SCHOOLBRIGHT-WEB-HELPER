# Update User API

**Endpoint**: `/api/v2/admin/user-management/update`
**Method**: `POST`

## Description

อัปเดตข้อมูลผู้ใช้งานที่มีอยู่

## Request Body (JSON)

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| id            | number | Yes      | ID ของผู้ใช้งานที่ต้องการแก้ไข |
| username      | string | No       | ชื่อผู้ใช้งาน                  |
| password      | string | No       | รหัสผ่านใหม่                   |
| admin_id      | number | No       | ID อ้างอิงระบบภายนอก           |
| employee_code | string | No       | รหัสพนักงาน                    |
| firstname_th  | string | No       | ชื่อจริง (ภาษาไทย)             |
| lastname_th   | string | No       | นามสกุล (ภาษาไทย)              |
| firstname_en  | string | No       | ชื่อจริง (ภาษาอังกฤษ)          |
| lastname_en   | string | No       | นามสกุล (ภาษาอังกฤษ)           |
| nickname      | string | No       | ชื่อเล่น                       |
| position      | string | No       | ตำแหน่ง                        |
| department    | string | No       | แผนก                           |
| status        | string | No       | สถานะ (ACTIVE, INACTIVE, etc.) |
| email         | string | No       | อีเมล                          |
| phone         | string | No       | เบอร์โทรศัพท์                  |
| role_id       | number | No       | ID ของ Role                    |
| profile_image | string | No       | URL หรือ Path ของรูปโปรไฟล์    |
| updated_by    | number | No       | ID ของผู้ที่ทำการแก้ไข         |

**Example Request**:

```json
{
  "id": 1,
  "firstname_th": "สมหญิง",
  "position": "Senior Manager"
}
```

## Response Body (JSON)

**Success (200)**

```json
{
  "status_code": 200,
  "message_th": "อัปเดตข้อมูลผู้ใช้งานสำเร็จ",
  "message_en": "User updated successfully",
  "data": {
    "id": 1,
    "firstname_th": "สมหญิง",
    "position": "Senior Manager",
    "updated_at": "2024-03-21T10:00:00.000Z",
    ...
  }
}
```
