# 📖 Users API - Read Endpoint Documentation

## 🎯 Overview

API endpoint สำหรับดึงข้อมูล User จากระบบ Timesheet เพื่อใช้ในการสร้าง dropdown "พนักงานผู้ปฏิบัติงาน" ในฟีเจอร์ Overtime Management

---

## 📍 Endpoints

### 1. GET - ดึงรายชื่อ User แบบ Simple

```
GET /api/v1/timesheet/overtime/users
```

#### Query Parameters

| Field    | Type     | Required | Description                                                  |
| -------- | -------- | -------- | ------------------------------------------------------------ |
| `search` | `string` | ❌ No    | ค้นหา User ด้วย firstname, lastname, nickname, employee_code |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/v1/timesheet/overtime/users?search=ธนัท"
```

#### Response (200 OK)

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลพนักงานสำเร็จ",
  "message_en": "Users retrieved successfully",
  "data": [
    {
      "admin_id": 117,
      "firstname": "THANAT",
      "firstname_th": "ธนัท",
      "lastname": "PHROM",
      "lastname_th": "พรหม",
      "nickname": "ธนัท",
      "employee_code": "JJ00176"
    }
  ]
}
```

---

### 2. POST - ดึงรายชื่อ User พร้อม Pagination

```
POST /api/v1/timesheet/overtime/users
```

#### Request Body

| Field    | Type     | Required | Default | Description           |
| -------- | -------- | -------- | ------- | --------------------- |
| `search` | `string` | ❌ No    | `""`    | ค้นหา User            |
| `limit`  | `number` | ❌ No    | `50`    | จำนวน record ต่อ page |
| `page`   | `number` | ❌ No    | `1`     | หมายเลข page          |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/timesheet/overtime/users" \
  -H "Content-Type: application/json" \
  -d '{
    "search": "ธ",
    "limit": 20,
    "page": 1
  }'
```

#### Response (200 OK)

```json
{
  "status_code": 200,
  "message_th": "ดึงข้อมูลพนักงานสำเร็จ",
  "message_en": "Users retrieved successfully",
  "data": [
    {
      "admin_id": 117,
      "firstname": "THANAT",
      "firstname_th": "ธนัท",
      "lastname": "PHROM",
      "lastname_th": "พรหม",
      "nickname": "ธนัท",
      "employee_code": "JJ00176"
    },
    {
      "admin_id": 148,
      "firstname": "THANACHAT",
      "firstname_th": "ธนัชทัศน์",
      "lastname": "REUNGPLAPPHLA",
      "lastname_th": "เรืองพลับพลา",
      "nickname": "วุฒิ",
      "employee_code": "JJ00174"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

---

## 📊 Response Body Details

### Status Codes

| Code  | Message               | Description             |
| ----- | --------------------- | ----------------------- |
| `200` | OK                    | ดึงข้อมูลสำเร็จ         |
| `400` | Bad Request           | Request Body ไม่ถูกต้อง |
| `500` | Internal Server Error | Error จากฝั่ง Server    |

### Data Fields

| Field           | Type     | Nullable | Description                |
| --------------- | -------- | -------- | -------------------------- |
| `admin_id`      | `number` | ❌ No    | ID ของ Admin (Primary Key) |
| `firstname`     | `string` | ✅ Yes   | ชื่อจริง (English)         |
| `firstname_th`  | `string` | ✅ Yes   | ชื่อจริง (Thai)            |
| `lastname`      | `string` | ✅ Yes   | นามสกุล (English)          |
| `lastname_th`   | `string` | ✅ Yes   | นามสกุล (Thai)             |
| `nickname`      | `string` | ✅ Yes   | ชื่อเล่น                   |
| `employee_code` | `string` | ✅ Yes   | รหัสพนักงาน                |

---

## 💡 Logic Notes

### 1. **User Filtering**

- ดึงเฉพาะ User ที่มี `status = "ACTIVE"`
- ดึงเฉพาะ User ที่ `is_deleted = false`
- ลำดับผลลัพธ์ เรียงตาม Thai Name (firstname_th, lastname_th)

### 2. **Search Implementation**

- Support ค้นหาด้วย 6 Fields: firstname, firstname_th, lastname, lastname_th, nickname, employee_code
- ใช้ `insensitive` mode สำหรับ case-insensitive search
- ใช้ `OR` operator เพราะ User สามารถค้นหาด้วยฟิลด์ใดก็ได้

### 3. **Pagination Strategy**

- GET method: ไม่มี pagination (fixed `take: 100`)
- POST method: มี pagination สูงสุด 50 records ต่อ page (default)
- Pagination info อยู่ใน response body

### 4. **Performance Optimization**

- ใช้ `select` เพื่อดึงเฉพาะฟิลด์ที่จำเป็น (ลด data transfer)
- ใช้ `Promise.all()` ในการ fetch users และ count (parallel queries)
- ใช้ singleton pattern สำหรับ Service class

### 5. **Error Handling**

- ทุก error ถูก catch และ return เป็น HTTP 500
- Error message ประกอบด้วย context (หลาย error มาจากไหน)

---

## 🔄 Usage Example (Frontend)

```typescript
// GET - Simple fetch
const response = await fetch(`/api/v1/timesheet/overtime/users?search=ธนัท`);
const { data } = await response.json();

// POST - With pagination
const response = await fetch(`/api/v1/timesheet/overtime/users`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    search: "ธ",
    limit: 20,
    page: 1,
  }),
});
const { data, pagination } = await response.json();
```

---

## ⚠️ Notes

- API นี้ใช้ Prisma Timesheet Database
- ไม่มี Authentication/Authorization check (ถ้าจำเป็น ให้เพิ่ม middleware)
- Response ทั้งหมดใช้ format `{ status_code, message_th, message_en, data }`
