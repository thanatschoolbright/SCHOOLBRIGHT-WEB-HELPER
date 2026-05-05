# POST /api/v3/authentication/shared/sign-in

## Purpose
เส้น Login แบบ Shared สำหรับแชร์ให้เว็บอื่น (third-party) ใช้ DB ผู้ใช้เดียวกัน
ส่งคืน JWT token (HS256) อายุ 8 ชั่วโมง สำหรับนำไปใช้กับเส้น /session

## Request Body
```json
{
  "username": "string (required) — email / employee_code / username",
  "password": "string (required)"
}
```

## Response (200 OK)
```json
{
  "status": 200,
  "message_th": "เข้าสู่ระบบสำเร็จ",
  "message_en": "Sign in successful",
  "data": {
    "token": "<JWT HS256>",
    "token_type": "Bearer",
    "expires_in": 28800,
    "user": {
      "id": 1,
      "username": "john.doe",
      "email": "john@schoolbright.co",
      "role_name": "Developer",
      "permissions": ["timesheet.entry.read"],
      "status": "ACTIVE"
    }
  }
}
```

## JWT Payload
```json
{
  "sub": "1",
  "user_id": 1,
  "admin_id": null,
  "username": "john.doe",
  "employee_code": "EMP001",
  "email": "john@schoolbright.co",
  "role_id": 2,
  "role_name": "Developer",
  "permissions": ["timesheet.entry.read"],
  "iss": "schoolbright-shared-auth",
  "iat": 1746000000,
  "exp": 1746028800
}
```

## Error Responses
| Status | message_en |
|---|---|
| 400 | Username and password are required |
| 401 | Invalid credentials / Invalid password (N attempts remaining) |
| 403 | Account is locked or inactive |
| 429 | Account temporarily locked (5 failed attempts, 15 min lockout) |
| 500 | Internal Server Error |

## Business Logic
- ค้นหาผู้ใช้จาก 3 field (OR): `email`, `employee_code`, `username` — case-insensitive
- ตรวจสอบรหัสผ่านด้วย bcrypt; fallback plain-text สำหรับบัญชีเก่า
- Lock out หลัง 5 ครั้งผิด; auto-unlock หลัง 15 นาที
- Sign JWT ด้วย `AUTH_SECRET` (HS256), issuer = `schoolbright-shared-auth`
- ไม่สร้าง NextAuth session (stateless)
