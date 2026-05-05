# GET /api/v3/authentication/shared/session

## Purpose
รับ JWT token จาก `Authorization: Bearer` header แล้ว verify และดึงข้อมูล session ล่าสุดของพนักงานจาก DB (real-time)

## Authentication
```
Authorization: Bearer <JWT token จากเส้น /sign-in>
```

## Response (200 OK)
```json
{
  "status": 200,
  "message_th": "ดึงข้อมูล session สำเร็จ",
  "message_en": "Session retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john.doe",
      "email": "john@schoolbright.co",
      "role_name": "Developer",
      "permissions": ["timesheet.entry.read"],
      "department_name": "เทคโนโลยีสารสนเทศ",
      "status": "ACTIVE"
    },
    "expires": "2026-05-05T18:00:00.000Z"
  }
}
```

## Error Responses
| Status | message_en |
|---|---|
| 401 | Missing or invalid Authorization header |
| 401 | Invalid or expired token |
| 401 | Invalid token payload |
| 403 | Account is locked or inactive |
| 404 | User not found |
| 500 | Internal Server Error |

## Business Logic
- แยก token จาก header รูปแบบ `Bearer <token>` (case-insensitive)
- Verify JWT HS256 ด้วย `AUTH_SECRET` + ตรวจ issuer = `schoolbright-shared-auth`
- ดึงข้อมูล user จาก DB ตาม `user_id` ใน payload (real-time ไม่ใช่ข้อมูลจาก token)
- ตรวจสอบ `status === "ACTIVE"` อีกรอบ กัน token ที่ยังไม่หมดอายุแต่บัญชีถูกปิดแล้ว
