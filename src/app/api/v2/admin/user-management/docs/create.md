# Create User API

**Endpoint**: `/api/v2/admin/user-management/create`
**Method**: `POST`

## Description

สร้างผู้ใช้งานใหม่ในระบบ (User)

## Request Body (JSON)

| Field         | Type   | Required | Description                   |
| ------------- | ------ | -------- | ----------------------------- |
| username      | string | Yes      | ชื่อผู้ใช้งาน (Unique)        |
| password      | string | Yes      | รหัสผ่าน (Min 6 chars)        |
| admin_id      | number | Yes      | ID อ้างอิงระบบภายนอก (Unique) |
| employee_code | string | No       | รหัสพนักงาน (Unique)          |
| firstname_th  | string | No       | ชื่อจริง (ภาษาไทย)            |
| lastname_th   | string | No       | นามสกุล (ภาษาไทย)             |
| firstname_en  | string | No       | ชื่อจริง (ภาษาอังกฤษ)         |
| lastname_en   | string | No       | นามสกุล (ภาษาอังกฤษ)          |
| nickname      | string | No       | ชื่อเล่น                      |
| position      | string | No       | ตำแหน่ง                       |
| department    | string | No       | แผนก                          |
| email         | string | No       | อีเมล                         |
| phone         | string | No       | เบอร์โทรศัพท์                 |
| role_id       | number | No       | ID ของ Role (RBAC)            |
| profile_image | string | No       | URL หรือ Path ของรูปโปรไฟล์   |
| created_by    | number | No       | ID ของผู้ที่สร้าง User นี้    |

**Example Request**:

```json
{
  "username": "johndoe",
  "password": "password123",
  "admin_id": 1001,
  "firstname_th": "สมชาย",
  "lastname_th": "ใจดี",
  "email": "somchai@example.com",
  "position": "Manager"
}
```

## Response Body (JSON)

**Success (201)**

```json
{
  "status_code": 201,
  "message_th": "สร้างผู้ใช้งานสำเร็จ",
  "message_en": "User created successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "firstname_th": "สมชาย",
    "lastname_th": "ใจดี",
    "status": "ACTIVE",
    "created_at": "2024-03-20T10:00:00.000Z",
    ...
  }
}
```

**Error (400/500)**

```json
{
  "status_code": 500,
  "message_th": "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน",
  "message_en": "Error message details...",
  "error": { ... }
}
```
