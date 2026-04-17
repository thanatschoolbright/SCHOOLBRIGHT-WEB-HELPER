# POST /api/v1/hardware/machine-monitoring

## วัตถุประสงค์

รับข้อมูลสถานะเครื่อง POS ทั้งหมดจาก client แล้วส่งรายงานพร้อมกันไปยัง 2 ช่องทาง:
1. **Discord Webhook** — embed แบบ rich ที่แยกสถิติตาม AppName + AppVersion
2. **Email** — HTML report ส่งไปยัง `narin@schoolbright.co`

ไม่ต้องการ session (ออกแบบให้รองรับ GitHub Actions Cronjob เรียกโดยตรง)

---

## Request Body

```json
{
  "devices": [
    {
      "DeviceStatusID": "abc123",
      "SchoolID": 101,
      "DeviceID": "POS-001",
      "Online": true,
      "OnlineTime": "2026-04-17T08:00:00Z",
      "Login": true,
      "LoginTime": "2026-04-17T08:05:00Z",
      "LogOut": false,
      "LogoutTime": null,
      "Tstamp": "2026-04-17T09:00:00Z",
      "BusinessDate": "2026-04-17",
      "AppName": "SB Facial Attendance 8 inch",
      "AppVersion": "1.2.9"
    }
  ],
  "school_map": [
    { "SchoolID": 101, "SchoolName": "โรงเรียนตัวอย่าง" }
  ],
  "total_in_db": 150
}
```

| Field | Type | Required | คำอธิบาย |
|---|---|---|---|
| `devices` | `DeviceStatusData[]` | ใช่ | รายการสถานะเครื่อง POS ทั้งหมด |
| `school_map` | `SchoolMapEntry[]` | ใช่ | ตาราง mapping SchoolID → ชื่อโรงเรียน |
| `total_in_db` | `number` | ไม่ | จำนวนรวมทั้งหมดใน DB (เพื่อแสดง note ถ้าดึงไม่ครบ) |

---

## Response (200)

```json
{
  "status": 200,
  "message_th": "ส่งรายงานสถานะเครื่อง POS ไปยัง Discord และอีเมลเรียบร้อยแล้ว",
  "message_en": "Machine monitoring report sent to Discord and email successfully",
  "data": {
    "total": 150,
    "online": 140,
    "offline": 10,
    "login": 135,
    "online_rate": 93,
    "app_groups": [
      {
        "app_name": "SB Facial Attendance 8 inch",
        "app_version": "1.2.9",
        "total": 80,
        "online": 75,
        "offline": 5,
        "online_rate": 94
      }
    ],
    "email_sent": true,
    "email_error": null
  }
}
```

---

## Business Logic

1. **Validation** — ตรวจสอบ request ด้วย Zod schema (`MachineMonitoringSchema`) ก่อนทุกครั้ง
2. **Webhook URL check** — ถ้า `NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MACHINE_MONITORING` ไม่ได้ตั้งค่า ส่ง 500 ทันที
3. **calculateDeviceStats** — จัดกลุ่มเครื่องตาม `AppName + AppVersion` พร้อมนับ online/offline/login และ onlineRate แต่ละกลุ่ม
4. **Discord embed** — ส่ง embed ที่มี 3 section: ภาพรวม, สถิติแยกกลุ่มแอป (inline 2 คอลัมน์), รายละเอียดออฟไลน์ ถ้า field เกิน 1024 ตัวอักษรจะ auto-chunk
5. **Email** — ส่ง HTML พร้อมกับ Discord ผ่าน `Promise.allSettled` — Discord ต้องสำเร็จ ส่วน Email ล้มเหลวได้โดยไม่ทำให้ response เป็น error
6. **Color coding** — ออฟไลน์ 0 = เขียว, 1-4 = เหลือง, 5+ = แดง

---

## Environment Variables

| ตัวแปร | คำอธิบาย |
|---|---|
| `NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MACHINE_MONITORING` | Discord Webhook URL สำหรับ channel รายงานสถานะเครื่อง |
| `MAILER_HOST` / `MAILER_USER` / `MAILER_PASS` | SMTP config สำหรับส่ง Email |
