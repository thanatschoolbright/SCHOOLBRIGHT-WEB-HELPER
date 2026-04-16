# Signature API Specification

## Purpose
จัดการลายเซ็นประจำตัว (Signature) ของ User โดยเก็บไฟล์ไว้บน Huawei OBS และบันทึก URL ลงในฐานข้อมูล Timesheet (`user.signature_path`)

---

## Endpoints

### 1. POST /api/v2/admin/user-management/signature/upload
อัปโหลดลายเซ็นใหม่ (multipart/form-data)

**Request (FormData)**
| Field | Type | Required | Description |
|---|---|---|---|
| file | File | yes | ไฟล์รูปภาพ PNG/JPG/WEBP ขนาดไม่เกิน 5 MB |
| user_id | string (number) | yes | ID ของ user ในตาราง timesheet |
| old_signature_path | string | no | URL ลายเซ็นเก่า — ถ้ามีจะถูกลบออกจาก OBS อัตโนมัติ |

**Response**
```json
{
  "status": 200,
  "message_th": "อัปโหลดลายเซ็นสำเร็จ",
  "message_en": "Signature uploaded successfully",
  "data": {
    "signature_url": "https://{bucket}.{domain}/signatures/{user_id}/sig_{timestamp}.png"
  }
}
```

**OBS Path:** `signatures/{user_id}/sig_{timestamp}.{ext}`

---

### 2. GET /api/v2/admin/user-management/signature/read?user_id={id}
ดึง URL ลายเซ็นปัจจุบันของ user

**Query Params**
| Param | Type | Required |
|---|---|---|
| user_id | number | yes |

**Response**
```json
{
  "status": 200,
  "data": {
    "signature_url": "https://..." // หรือ null ถ้ายังไม่มีลายเซ็น
  }
}
```

---

### 3. DELETE /api/v2/admin/user-management/signature/delete
ลบลายเซ็นออกจาก OBS และล้าง path ในฐานข้อมูล

**Request Body (JSON)**
| Field | Type | Required |
|---|---|---|
| user_id | number | yes |
| signature_path | string | yes |

**Response**
```json
{
  "status": 200,
  "message_th": "ลบลายเซ็นสำเร็จ",
  "data": null
}
```

---

## Logic Notes
- ไฟล์เก่าจะถูกลบออกจาก OBS ด้วย soft-delete (ไม่ throw ถ้าล้มเหลว เพื่อไม่ block flow หลัก)
- field `signature_path` ถูก update ผ่าน `$executeRaw` เนื่องจาก Prisma schema อาจยังไม่มี field นี้
- Auth: ทุก endpoint ต้องมี session จาก NextAuth (`await auth()`)
- ขนาดไฟล์สูงสุด: 5 MB — ตรวจสอบที่ route layer ก่อนส่งเข้า service
