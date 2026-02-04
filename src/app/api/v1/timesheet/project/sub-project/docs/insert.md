# 🚀 Sub-Project Insert (Create/Update) API

API สำหรับจัดการข้อมูลโครงการย่อย (Features) ทั้งในกรณีสร้างใหม่และแก้ไขข้อมูลเดิม

## 📝 รายละเอียดการทำงาน

- หากส่ง `id` มาใน Request Body ระบบจะทำการ **Update** ข้อมูลเดิม
- หากไม่ส่ง `id` มา ระบบจะทำการ **Create** ข้อมูลใหม่
- รองรับการบันทึกสถานะโครงการย่อยและผู้รับผิดชอบ (Assignees)
- **Feature ใหม่:** รองรับการบันทึก `ticket_number` เพื่อเชื่อมโยงกับระบบ Backlog เช่น JIRA หรือ GitHub Issues

## 📮 Request Body (Type: JSON)

| Field                | Type       | Description                                  | Required |
| -------------------- | ---------- | -------------------------------------------- | -------- |
| `id`                 | `number`   | ID ของโครงการย่อย (ส่งมาเมื่อต้องการ Update) | No       |
| `project_id`         | `number`   | ID ของโครงการหลัก                            | Yes      |
| `name`               | `string`   | ชื่อโครงการย่อย (ภาษาไทย)                    | Yes      |
| `name_en`            | `string`   | ชื่อโครงการย่อย (ภาษาอังกฤษ)                 | No       |
| `ticket_number`      | `string`   | รหัส Ticket/Backlog (เช่น SB-1234)           | No       |
| `assetCaptureType`   | `enum`     | "CAPTUREABLE" หรือ "UN_CAPTUREABLE"          | No       |
| `startDate`          | `ISO Date` | วันที่เริ่มต้น                               | Yes      |
| `endDate`            | `ISO Date` | วันที่สิ้นสุด                                | Yes      |
| `projectStatusId`    | `number`   | ID ของสถานะโครงการย่อย                       | No       |
| `assignees`          | `array`    | รายชื่อผู้รับผิดชอบ [{ userId, position }]   | No       |
| `by`                 | `number`   | ID ของผู้ที่ทำรายการ (Admin ID)              | Yes      |
| `backlogDescription` | `JSON`     | รายละเอียดเพิ่มเติม และ Link แนบ             | No       |

## 📥 Response Body

```json
{
  "status_code": 200,
  "message_th": "บันทึกข้อมูลสำเร็จ",
  "message_en": "Data saved successfully",
  "data": { ... }
}
```

## 💡 Logic Note

- **Man Hour Calculation:** ระบบจะคำนวณ Man Hour อัตโนมัติใน Service เลเยอร์ตามระยะเวลาและจำนวนคน
- **Asset Type:** หากไม่ได้ส่งจะ Default เป็น `UN_CAPTUREABLE`
- **Assignee Sync:** ในโหมด Update ระบบจะทำการลบผู้ดูแลเก่าออกทั้งหมดและ Create ใหม่ตาม List ที่ส่งมา
