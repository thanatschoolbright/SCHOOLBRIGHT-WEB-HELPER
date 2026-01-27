# Delete User API

**Endpoint**: `/api/v2/admin/user-management/delete`
**Method**: `POST`

## Description

ลบผู้ใช้งาน (Soft Delete) โดยการเปลี่ยนสถานะ is_deleted เป็น true

## Request Body (JSON)

| Field      | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| id         | number | Yes      | ID ของผู้ใช้งานที่ต้องการลบ               |
| deleted_by | number | No       | ID ของผู้ที่ทำการลบ (เพื่อเก็บ Audit Log) |

**Example Request**:

```json
{
  "id": 1
}
```

## Response Body (JSON)

**Success (200)**

```json
{
  "status_code": 200,
  "message_th": "ลบผู้ใช้งานสำเร็จ",
  "message_en": "User deleted successfully",
  "data": {
    "id": 1
  }
}
```
