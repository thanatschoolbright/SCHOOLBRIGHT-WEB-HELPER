# Front-end Development Standard (Builder Mode)

    ## [Goal]

พัฒนาหน้าจอโดยเน้น Logic ที่ครบถ้วน และ UI ที่ถูกต้องตามมาตรฐาน Ant Design V.5 และ Modular Architecture อย่างเคร่งครัด

## [Architecture & Directory Structure]

ต้องแบ่งแยก Component อย่างเป็นระเบียบภายใน Folder ของหน้านั้นๆ (Feature-based) ดังนี้:

- `_components/`: แยก UI ย่อย เช่น `filter-section.tsx`, `user-table.tsx`, `summary-section.tsx`
- `_api/`: เฉพาะ Axios Instance และ API Methods (Pure Logic เท่านั้น)
- `_stores/`: ใช้ **Zustand** เท่านั้น สำหรับจัดการ Global/Page State และเรียกใช้ Service (จาก /\_api)
- `page.tsx`: ทำหน้าที่เป็น Orchestrator สำหรับประกอบ Component และจัด Layout

## [State Management Standards (Zustand)]

- ห้ามใช้ `useState` สำหรับข้อมูลที่ต้องแชร์ข้าม Components
- ข้อมูลสรุป (Summary Metrics) ต้องคำนวณจาก Raw Data ใน Store โดยตรง (ห้ามกรองตาม UI Table)
- การเรียก API (Fetch/Action) ให้ทำผ่าน Store หรือเรียก Service แล้ว Update State ทันที

## [Component Guidelines]

1. **Status Modal:** ใช้ Component กลางจาก `src/components/modal/status-modal-component.tsx`
2. **Page Title:** ใช้ `src/components/typhography/header-bar-component.tsx` เท่านั้น
3. **Summary Cards:** ใช้ `src/components/card/summary-card.tsx`
4. **Filter Section:**
   - หัวข้อ "ตัวกรอง" ใช้ Icon Filter (fontSize: 1rem, fontWeight: 600, marginBottom: 16px)
   - จัดวาง 2 column ต่อ 1 row (ใช้ Col/Row)
   - ปุ่ม "ค้นหา" และ "ล้างการค้นหา" วางชิดขวาด้านล่างพร้อม Icon
5. **Content & Table:**
   - ใช้ Card ครอบเนื้อหา: `styles={{ body: { padding: 16 } }}` และ Border Color ตาม Token
   - หัวข้อตารางใช้ `<UnorderedListOutlined />` ขนาด 1rem
   - ทุก Column ต้องมี Sort และห้ามใช้ maxWidth (ให้ Scale ตามหน้าจอ)
   - Action Buttons ต้องวางไว้ด้านบนขวาของส่วน Table
6. **Notification:** ใช้ `toast` จาก `sonner` เท่านั้น

## [Development Standards]

- **API:** ใช้ Axios เท่านั้น
- **Naming:** ใช้ชื่อเต็ม สื่อความหมาย (เช่น `responseUserList`, `requestUserByID`) พร้อม Comment อธิบายหน้าที่ฟังก์ชัน 1 บรรทัด
- **Styling:** งดใช้ CSS/Inline-style ให้ใช้ Ant Design (Flex, Space, Row, Col) และรองรับ Light/Dark Mode
- **Font:** FontWeight สูงสุดไม่เกิน 600
- **Constraint:** ห้ามลบฟังก์ชันเดิมที่มีอยู่แล้วเด็ดขาด

## [Response Format]

- ตอบกลับเฉพาะ Code ที่จำเป็น
- แนะนำ Step ถัดไปสั้นๆ เพื่อประหยัด Token
