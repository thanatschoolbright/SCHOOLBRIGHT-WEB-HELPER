# /commit — สร้าง Git Commit ตาม Format ของ Project

สร้าง commit message ให้ตรงกับรูปแบบที่ใช้ใน SCHOOLBRIGHT-WEB-HELPER และ commit ทันที

## Format มาตรฐานของ Project

```
✨ ระบบ {ชื่อระบบ} : {คำอธิบายสิ่งที่ทำ} ({รายการไฟล์ที่แก้ไข})
```

### ตัวอย่าง commit จริงใน repo
```
✨ ระบบ ChangeStatus : เพิ่มการตรวจสอบสิทธิ์ผู้ใช้ในการเปลี่ยนสถานะ OT (API ที่แก้ไข /api/v1/timesheet/overtime/change-status, หน้าที่แก้ไข /src/app/timesheet/overtime/page.tsx)
✨ ระบบ BacklogDashboardStore : ปรับปรุงช่วงวันที่ให้เป็นเดือนปัจจุบัน (หน้าที่แก้ไข src/app/backlogs/report/dashboard/_state/use-backlog-dashboard-store.ts)
✨ ระบบ Reassign : เพิ่มฟีเจอร์ Quick Re-assign และ API สำหรับเปลี่ยนผู้รับผิดชอบงาน (หน้าที่แก้ไข ..., API ที่แก้ไข ...)
```

## รูปแบบ {รายการไฟล์ที่แก้ไข}

แยกตามประเภท คั่นด้วย `, `:

- **หน้าที่แก้ไข** `{path}` — สำหรับไฟล์ใน `src/app/` ที่ไม่ใช่ API
- **API ที่แก้ไข** `{path}` — สำหรับไฟล์ใน `src/app/api/`
- **ไฟล์ที่แก้ไข** `{path}` — สำหรับไฟล์อื่นๆ (services, helpers, stores)

ถ้าไฟล์มีมากกว่า 3 รายการต่อประเภท ให้รวมเป็น `และไฟล์ที่เกี่ยวข้อง`

## ขั้นตอนที่ Claude จะทำ

1. รัน `git diff --staged` และ `git status` เพื่อดูไฟล์ที่เปลี่ยน
2. ถ้ายังไม่มีไฟล์ staged — รัน `git add` ให้ไฟล์ที่เกี่ยวข้องก่อน (ถามถ้าไม่แน่ใจ)
3. วิเคราะห์การเปลี่ยนแปลงแล้วสร้าง commit message ตาม format
4. แสดง commit message ให้ดูก่อน แล้ว commit ทันที (ไม่ต้องรอ confirm เว้นแต่ไม่แน่ใจ)
5. แสดง commit hash ที่ได้

## กฎ

- ใช้ emoji `✨` เสมอ (นี่คือ exception เดียวที่อนุญาต emoji — เฉพาะ commit message เท่านั้น)
- ชื่อระบบใช้ PascalCase (เช่น `ChangeStatus`, `BacklogDashboard`, `OvertimeReport`)
- คำอธิบายเป็น **ภาษาไทย** เสมอ
- path ในวงเล็บใช้ path จริงจากไฟล์ที่เปลี่ยน ไม่ใช่ path สมมติ
- ถ้าแก้หลายระบบในครั้งเดียว — แยก commit ทีละระบบ (ถามก่อนถ้าไม่แน่ใจ)
