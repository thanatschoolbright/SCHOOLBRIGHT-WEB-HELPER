# GET /api/v3/authentication/shared/all-user

## Purpose
ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ (เฉพาะที่ยังไม่ถูกลบ) ต้องมี Bearer token ที่ถูกต้องจากเส้น /sign-in

## Authentication
```
Authorization: Bearer <JWT token จากเส้น /sign-in>
```

## Response (200 OK)
```json
{
  "status": 200,
  "message_th": "ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ",
  "message_en": "Users retrieved successfully",
  "data": {
    "total": 42,
    "users": [
      {
        "id": 1,
        "username": "john.doe",
        "employee_code": "EMP001",
        "email": "john@schoolbright.co",
        "firstname_th": "จอห์น",
        "lastname_th": "โด",
        "status": "ACTIVE",
        "employment_type": "FULL_TIME",
        "department_name": "เทคโนโลยีสารสนเทศ",
        "position_name": "Software Engineer",
        "role_name": "Developer",
        "joined_date": "2023-01-01T00:00:00.000Z",
        "last_login": "2026-05-05T10:00:00.000Z"
      }
    ]
  }
}
```

## Error Responses
| Status | message_en |
|---|---|
| 401 | Missing or invalid Authorization header |
| 401 | Invalid or expired token |
| 500 | Internal Server Error |

## Business Logic
- Verify JWT HS256 ด้วย `AUTH_SECRET` + ตรวจ issuer = `schoolbright-shared-auth`
- ไม่ส่ง `password`, `refresh_token`, `failed_login_attempts` กลับ
- กรองเฉพาะ `is_deleted = false`
- เรียงตาม `id ASC`
