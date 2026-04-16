# /review-feature — ตรวจ Feature ให้ตรง Standard

ตรวจสอบ Feature ที่เพิ่งเขียนหรือแก้ไขให้ตรงตาม Standard ของ SCHOOLBRIGHT-WEB-HELPER ทุกข้อ โดยไม่ต้องอธิบาย standard ซ้ำ

## วิธีใช้

```
/review-feature src/app/{domain}/{feature}
```

หรือระบุ path เพิ่มเติมได้เลย เช่น:
```
/review-feature src/app/timesheet/overtime
/review-feature src/app/api/v1/backlog/issues/re-assign
/review-feature src/app/backlogs/report/dashboard
```

## Checklist ที่ตรวจ

### UI / Frontend
- [ ] **ภาษาไทย 100%** — title, button, placeholder, toast, error message ต้องไม่มีคำอังกฤษปน
- [ ] **ไม่มี emoji** — ใน code, comment, string, UI ทุกส่วน
- [ ] **HeaderBar** — ใช้ `src/components/typhography/header-bar-component.tsx` เท่านั้น
- [ ] **StatusModal** — ใช้ `src/components/modal/status-modal-component.tsx` สำหรับ confirm/success/error
- [ ] **SummaryCard** — ใช้ `src/components/card/summary-card.tsx`, คำนวณ aggregates ก่อนส่งเข้า component
- [ ] **Toast** — ใช้ `toast` จาก `sonner` เท่านั้น (ไม่ใช้ antd notification/message)
- [ ] **Table columns** — ไม่มี `maxWidth` บน column ใดๆ
- [ ] **Filter layout** — 2 columns ต่อ row, ปุ่มชิดขวาล่าง
- [ ] **Styling** — ไม่มี inline CSS หรือ custom className นอกเหนือจาก Tailwind utility
- [ ] **Font weight** — ไม่เกิน 600
- [ ] **Zustand store** — อยู่ใน `_state/use-{feature}-store.ts` ไม่ใช่ใน component
- [ ] **API calls** — ใช้ `callApiService` จาก `api-gateway.tsx` เท่านั้น (ไม่ใช้ `fetch` โดยตรง)
- [ ] **ไม่ลบฟังก์ชันเดิม** — มีแค่เพิ่มหรือแก้ไข

### Backend / API
- [ ] **Response format** — ทุก route คืน `{ status_code, message_th, message_en, data }`
- [ ] **validateRequest** — เรียกก่อน service ทุกครั้ง
- [ ] **auth()** — เรียก `await auth()` และ check session ก่อน logic
- [ ] **snake_case payload** — ฟิลด์ใน request/response body ทั้งหมด snake_case
- [ ] **camelCase variables** — ตัวแปรและฟังก์ชันใน code ทั้งหมด camelCase
- [ ] **kebab-case files** — ชื่อไฟล์และโฟลเดอร์ทั้งหมด kebab-case
- [ ] **Thai comment บนฟังก์ชัน** — ทุกฟังก์ชันมี comment ภาษาไทย 1 บรรทัด ไม่มี emoji
- [ ] **Error handling** — มี try-catch ครอบ service call และคืน status 400/401/404/500 ที่เหมาะสม
- [ ] **Transaction** — ถ้าเขียนหลาย table ต้องใช้ `$transaction`
- [ ] **docs spec.md** — มีไฟล์ `docs/{action}-spec.md` สำหรับทุก create/update route
- [ ] **DB instance ถูกต้อง** — timesheet ใช้ `prisma-timesheet.ts`, ส่วนอื่นใช้ `prisma.ts`
- [ ] **File structure** — ถูกตาม pattern `{feature}/service/`, `{feature}/validation/`, `{feature}/docs/`

## Output ที่ได้

Claude จะรายงานในรูปแบบ:

```
PASS  src/app/...
FAIL  src/app/... — [รายการปัญหาที่พบ]
FIX   [โค้ดที่แก้ไขแล้ว หรือ diff ที่ต้องทำ]
```

ถ้าพบปัญหา Claude จะแก้ไขไฟล์นั้นทันทีโดยไม่ถาม เว้นแต่ปัญหาที่ต้องการ input เพิ่มเติม
