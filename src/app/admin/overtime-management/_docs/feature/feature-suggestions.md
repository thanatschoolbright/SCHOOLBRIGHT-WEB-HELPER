# Feature Suggestions — Admin Overtime Management

เอกสารนี้รวบรวม Feature ที่แนะนำให้เพิ่มในหน้า `/admin/overtime-management`
เรียงลำดับตามความสำคัญและความซับซ้อนในการพัฒนา

---

## Feature ที่มีอยู่แล้ว (สรุปสั้น)

| Feature | Component |
|---|---|
| ตารางรายการ OT ทั้งหมด + Pagination | `AdminOtTable` |
| กรองด้วยชื่อ / รหัส / สถานะ / พนักงาน / ช่วงวันที่ | `AdminOtFilter` |
| Summary Cards (คำขอ / รออนุมัติ / อนุมัติ / ปฏิเสธ / ชั่วโมง / พนักงาน) | `AdminOtSummary` |
| Bulk Approve / Reject / Mark Paid / PDF ZIP / Send Email | `BulkActionBar` |
| แจ้งเตือน OT ค้างอนุมัติเกิน 3 วัน | `OverdueAlert` |
| Audit Trail ประวัติการเปลี่ยนสถานะ | `StatusLogDrawer` |
| Export Excel | `AdminExportModal` |
| Mark Paid + Export ส่ง Finance | `MarkPaidModal` |
| แก้ไขวันที่ผิดปกติ (Auto/Manual) | `FixDateModal` |
| Dashboard SLA การอนุมัติ | `ApprovalSlaDashboard` |
| รายงานค่าใช้จ่าย OT รายเดือน/รายคน | `MonthlyCostReport` |
| สถิติ OT แยกตามแผนก | `DepartmentBreakdown` |
| **[เสร็จแล้ว]** ปฏิทิน OT รายเดือน color-coded + Drill-down | `OtCalendarView` |
| **[เสร็จแล้ว]** หมายเหตุ Admin ใน DetailModal + Timeline | `comment/route.ts` + `detail-modal.tsx` |

---

## Feature ที่แนะนำให้เพิ่ม

---

### 1. OT Calendar View ✅ เสร็จแล้ว

**ปัญหาที่แก้:** ปัจจุบันดูข้อมูล OT ได้เฉพาะในรูปแบบตารางเท่านั้น ยากต่อการมองภาพรวมว่าวันไหนมีคนทำ OT กี่คน หรือช่วงไหนมี OT หนาแน่น

**สิ่งที่ทำ:**
- Calendar Monthly View โหลด OT ทั้งเดือนจาก `/api/v1/timesheet/overtime/read`
- Badge color-coded แต่ละวัน: เขียว = อนุมัติ / เหลือง = รออนุมัติ / แดง = ปฏิเสธ / น้ำเงิน = จ่ายแล้ว
- คลิกวัน → Drawer รายชื่อพนักงานพร้อม Status Tag
- คลิกการ์ดใน Drawer → เปิด DetailModal เดิม
- Summary cards นับ OT รายเดือนแยกทุกสถานะ
- เปลี่ยนเดือน → โหลด data อัตโนมัติ

**Component:** `_components/ot-calendar-view.tsx`
**วางใน page.tsx:** ระหว่าง AdminOtTable และ DepartmentBreakdown

---

### 2. OT Quota & Budget Tracking (Priority: สูง)

**ปัญหาที่แก้:** Admin ไม่มีข้อมูลว่าแต่ละแผนกใช้งบ OT ไปแล้วเท่าไหร่เทียบกับงบที่ตั้งไว้ ทำให้ควบคุมค่าใช้จ่ายได้ยาก

**รายละเอียด:**
- ตั้ง Budget OT รายแผนกต่อเดือน (จำนวนชั่วโมง หรือ จำนวนเงิน)
- Progress Bar แสดงการใช้งบปัจจุบัน vs งบที่ตั้งไว้
- แจ้งเตือนเมื่อแผนกใดใช้งบเกิน 80% และ 100%
- Summary card "งบ OT คงเหลือเดือนนี้" ในส่วน AdminOtSummary

**API ที่ต้องสร้าง:** 
- `GET/POST /api/v2/admin/overtime/budget` — จัดการ Budget รายแผนก
- `GET /api/v2/admin/overtime/budget/usage` — ดึงข้อมูลการใช้จ่ายจริง

**Component ที่ต้องสร้าง:** `_components/budget-tracker.tsx`

---

### 3. ระบบ Comment / หมายเหตุ ในรายการ OT ✅ เสร็จแล้ว

**ปัญหาที่แก้:** เมื่อ Admin อนุมัติหรือปฏิเสธ OT ปัจจุบันมีแค่ "เหตุผลปฏิเสธ" แต่ไม่มีพื้นที่สำหรับการสื่อสารระหว่าง Admin กับพนักงาน ทำให้ต้องใช้ช่องทางอื่น (Line/Email) แทน

**สิ่งที่ทำ:**
- API `POST /api/v1/timesheet/overtime/comment` — บันทึก comment ลง `OvertimeStatusLog` ด้วย `to_status = "comment"` (ไม่ต้องแก้ schema DB)
- `detail-modal.tsx` เพิ่ม prop `isAdmin` — เมื่อ `true` แสดง Section "หมายเหตุจาก Admin" พร้อม TextArea + ปุ่มบันทึก (Ctrl+Enter ก็บันทึกได้)
- หลัง save comment — reload Timeline ใน modal อัตโนมัติ
- Timeline ทั้งใน `DetailModal` และ `StatusLogDrawer` render entry ที่ `to_status = "comment"` แบบพิเศษ (สีน้ำเงิน, icon `CommentOutlined`, ไม่แสดง arrow สถานะ)
- พนักงานฝั่ง User เห็น comment ได้ผ่าน GET /status-log เหมือนเดิม (ไม่ต้องแก้อะไรเพิ่ม)

**ไฟล์ที่แก้:**
- `src/app/api/v1/timesheet/overtime/comment/route.ts` (ใหม่)
- `src/app/timesheet/overtime/_components/detail-modal.tsx`
- `src/app/admin/overtime-management/_components/status-log-drawer.tsx`
- `src/app/admin/overtime-management/page.tsx` (เพิ่ม `isAdmin={true}` ใน DetailModal)

---

### 4. Recurring OT Detection (Priority: กลาง)

**ปัญหาที่แก้:** พนักงานบางคนขอ OT ซ้ำทุกสัปดาห์ในลักษณะเดิม ควรแจ้งเตือน Admin เพื่อพิจารณาว่าควรปรับ Scope งานหรือเพิ่มกำลังคนแทน

**รายละเอียด:**
- ตรวจจับ Pattern: พนักงานที่มี OT เดือนเดียวกัน > X ครั้ง (ตั้งค่า threshold ได้)
- Badge สีส้ม "OT บ่อย" บน Row ในตาราง
- Tooltip แสดงจำนวนครั้งใน 30 วันที่ผ่านมา
- รายงาน "พนักงานที่ทำ OT บ่อยที่สุด Top 10" ใน AnalyticsModal

**Logic:** คำนวณ client-side จาก data ที่มีอยู่แล้ว ไม่ต้องสร้าง API เพิ่ม

---

### 5. Smart Approve — อนุมัติอัตโนมัติตาม Rule (Priority: กลาง)

**ปัญหาที่แก้:** OT ที่ชั่วโมงน้อยและเป็นประเภทงานทั่วไป Admin ต้องอนุมัติทีละรายการเสียเวลา

**รายละเอียด:**
- ตั้ง Rule: "ถ้า OT ไม่เกิน X ชั่วโมง และพนักงานมี Approval Rate > 90% → Auto Approve"
- Queue Auto-Approve: Admin ยืนยัน 1 ครั้งก่อน Execute
- Log ทุก Auto-Approve ใน StatusLogDrawer พร้อม tag "อนุมัติอัตโนมัติ"
- ปิด/เปิด Rule ได้จาก Settings

**Component ที่ต้องสร้าง:** `_components/smart-approve-settings.tsx`

---

### 6. Export PDF สรุปรายเดือน (Priority: กลาง)

**ปัญหาที่แก้:** ปัจจุบัน Export ได้เฉพาะ Excel และ PDF รายบุคคล แต่ไม่มี PDF สรุปภาพรวมทั้งเดือนสำหรับส่ง Management

**รายละเอียด:**
- PDF 1 ไฟล์ต่อ 1 เดือน ประกอบด้วย:
  - Summary: จำนวนรายการ / ชั่วโมงรวม / ค่าใช้จ่ายประมาณ
  - ตารางสรุปแยกตามแผนก
  - Top 5 พนักงานที่ทำ OT มากสุด
  - Chart ชั่วโมง OT รายวัน
- ปุ่ม "Export สรุปเดือนนี้" ใน header

**ใช้ Library เดิม:** `@/helpers/bulk-pdf-download.helper` ที่มีอยู่แล้ว

---

### 7. Notification Center สำหรับ Admin (Priority: กลาง)

**ปัญหาที่แก้:** Admin ต้องเข้ามาเช็คหน้านี้เองเพื่อรู้ว่ามี OT รออนุมัติ ไม่มีระบบแจ้งเตือน Proactive

**รายละเอียด:**
- Badge แจ้งจำนวน OT รออนุมัติที่ Sidebar / เมนู
- Email สรุป OT รออนุมัติทุกเช้า 8:00 น. (Cron)
- LINE Notify เมื่อมี OT ยื่นขอใหม่ (ถ้า Admin ผูก LINE ไว้)
- Push Notification ผ่าน Browser (Web Push API)

**API ที่ต้องสร้าง:** `POST /api/v1/timesheet/overtime/notify-admin` (Cron trigger)

---

### 8. Delegation — มอบหมายสิทธิ์อนุมัติชั่วคราว (Priority: ต่ำ)

**ปัญหาที่แก้:** ปัจจุบัน `user_id === "49"` เป็นผู้อนุมัติคนเดียว (Hard-coded) เมื่อผู้อนุมัติลา งานติดขัดทันที

**รายละเอียด:**
- Admin ตั้งค่า "มอบหมายให้ User X อนุมัติแทน" พร้อมกำหนดช่วงเวลา
- ระบบ fallback: ถ้าเกินเวลาที่มอบหมาย → กลับเป็น Approver เดิม
- Log การมอบหมายทุกครั้ง

**หมายเหตุ:** ต้องแก้ `BYPASS_USER_ID` constant และ Logic ใน `change-status/route.ts` ด้วย เพราะตอนนี้ Hard-code `"49"` ไว้ทั้ง Frontend และ API

---

### 9. OT Trend Forecast (Priority: ต่ำ)

**ปัญหาที่แก้:** ไม่มีข้อมูล Predictive ว่าเดือนหน้าจะมี OT เท่าไหร่ ทำให้วางแผนงบประมาณล่วงหน้าได้ยาก

**รายละเอียด:**
- กราฟ Trend ย้อนหลัง 6 เดือน + เส้น Forecast เดือนถัดไป (Moving Average)
- แสดงใน `MonthlyCostReport` เป็น section เพิ่มเติม
- คำนวณ Client-side จากข้อมูลที่มีอยู่

---

### 10. Mobile-Responsive Admin View (Priority: ต่ำ)

**ปัญหาที่แก้:** หน้านี้ใช้งานบน Mobile ได้ยากเพราะตารางกว้าง + ปุ่มเยอะ

**รายละเอียด:**
- Breakpoint `< 768px`: เปลี่ยนตารางเป็น Card List รายการ
- Bulk Action ยุบเป็น Bottom Sheet
- Filter ยุบเป็น Drawer แทน Inline

---

## สรุปลำดับความสำคัญ

| ลำดับ | Feature | เหตุผล |
|---|---|---|
| ~~1~~ | ~~OT Calendar View~~ ✅ | เสร็จแล้ว — `_components/ot-calendar-view.tsx` |
| 2 | OT Quota & Budget Tracking | ตอบโจทย์ธุรกิจโดยตรง ควบคุมค่าใช้จ่าย |
| ~~3~~ | ~~Comment / หมายเหตุ~~ ✅ | เสร็จแล้ว — comment API + DetailModal + StatusLogDrawer |
| 4 | Recurring OT Detection | Logic ง่าย ไม่ต้องสร้าง API ใหม่ |
| 5 | Smart Approve | ลด Manual Work ของ Admin |
| 6 | Export PDF สรุปรายเดือน | ใช้ Infrastructure เดิมได้เลย |
| 7 | Notification Center | ลด Passive Monitoring |
| 8 | Delegation | แก้ Single Point of Failure แต่ต้องแตะ Hard-code |
| 9 | OT Trend Forecast | Nice-to-have, ไม่เร่งด่วน |
| 10 | Mobile-Responsive | Effort สูง, Use case น้อย |
