# Read User API

**Endpoint**: `/api/v2/admin/user-management/read`
**Method**: `GET`

## Description

ดึงข้อมูลผู้ใช้งานทั้งหมด พร้อมรองรับการค้นหา (Search) และการแบ่งหน้า (Pagination)

## Query Parameters

| Parameter | Type   | Default | Description                                    |
| --------- | ------ | ------- | ---------------------------------------------- |
| page      | number | 1       | หน้าที่ต้องการดู                               |
| limit     | number | 50      | จำนวนรายการต่อหน้า                             |
| search    | string | -       | คำค้นหา (ค้นหาจาก username, name, email, code) |
| status    | string | -       | กรองตามสถานะ (เช่น ACTIVE)                     |

**Example Request**:
`/api/v2/admin/user-management/read?page=1&limit=20&search=somchai`

## Response Body (JSON)

**Success (200)**

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลผู้ใช้งานสำเร็จ",
  "message_en": "Users retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "somchai",
        "firstname_th": "สมชาย",
        ...
        "role": {
           "id": 1,
           "role_name": "Admin"
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```
