# Front-end Development Standard (Builder Mode)

## [Goal]

พัฒนาหน้าจอโดยเน้น Logic ที่ครบถ้วน และ UI ที่ถูกต้องตามมาตรฐาน Ant Design V.5 และ Modular Architecture อย่างเคร่งครัด

## [Architecture & Directory Structure]

ต้องแบ่งแยก Component อย่างเป็นระเบียบภายใน Folder ของหน้านั้นๆ (Feature-based) ดังนี้:

- `_components/`: แยก UI ย่อย เช่น `filter-section.tsx`, `user-table.tsx`, `summary-section.tsx`
- `_api/`: เฉพาะ Axios Instance และ API Methods (Pure Logic เท่านั้น) — ชื่อไฟล์: `{feature}.service.ts`
- `_stores/`: ใช้ **Zustand** เท่านั้น สำหรับจัดการ Global/Page State และเรียกใช้ Service — ชื่อไฟล์: `use-{feature}-store.ts`
- `page.tsx`: ทำหน้าที่เป็น Orchestrator สำหรับประกอบ Component และจัด Layout

## [State Management Standards (Zustand)]

- ห้ามใช้ `useState` สำหรับข้อมูลที่ต้องแชร์ข้าม Components
- ข้อมูลสรุป (Summary Metrics) ต้องคำนวณจาก Raw Data ใน Store โดยตรง (ห้ามกรองตาม UI Table)
- การเรียก API (Fetch/Action) ให้ทำผ่าน Store หรือเรียก Service แล้ว Update State ทันที

## [Component Guidelines]

1. **Status Modal:** ใช้ Component กลางจาก `src/components/modal/status-modal-component.tsx` (named export: `{ StatusModalComponent }`)
   - Action สำคัญที่สำเร็จ (unlock, delete, submit) ต้องแสดง `type="success"` พร้อม detail ข้อมูลที่กระทำไป ไม่ใช่แค่ toast
   - ลำดับ: confirm modal (`type="confirm"`) → execute → success modal (`type="success"`)
2. **Page Title:** ใช้ `src/components/typhography/header-bar-component.tsx` เท่านั้น (named export: `{ HeaderBar }`) — props บังคับ: `icon`, `title`; optional: `subTitle`, `extra`
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
6. **Notification:** ใช้ `toast` จาก `sonner` สำหรับ feedback เบาๆ (error, info) — action สำคัญที่สำเร็จให้ใช้ success modal แทน

## [Development Standards]

- **API:** ใช้ Axios เท่านั้น (`callApiService` จาก `@services/axios-instance/sb-helper.axios`)
- **Error Handling (Client):** catch error จาก Axios ให้ access `err?.response?.data?.message_th` เสมอ ไม่ใช่ `err?.message`
  ```ts
  } catch (err: any) {
    toast.error(err?.response?.data?.message_th ?? "เกิดข้อผิดพลาด");
  }
  ```
- **Naming:** ใช้ชื่อเต็ม สื่อความหมาย (เช่น `responseUserList`, `requestUserByID`) พร้อม Comment อธิบายหน้าที่ฟังก์ชัน 1 บรรทัด
- **Styling:** งดใช้ CSS/Inline-style ให้ใช้ Ant Design Token (`theme.useToken()`) และ Ant Design layout components (Flex, Space, Row, Col) รองรับ Light/Dark Mode อัตโนมัติ
- **Portal Components (Modal, Popover, Tooltip):** render นอก React tree ทำให้ Tailwind `dark:` class และ CSS variables บางตัวไม่ทำงาน — ให้ใช้ Ant Design token สำหรับสี และใช้ `rootClassName` + `.dark selector` ใน `globals.css` เมื่อต้องการ override CSS
  ```tsx
  // ✅ ใช้ rootClassName แทน overlayClassName (deprecated ใน Ant Design v5)
  <Popover rootClassName="my-popover" ... />
  ```
  ```css
  /* globals.css */
  .my-popover .ant-popover-inner { background: #ffffff; }
  .dark .my-popover .ant-popover-inner { background: #1e293b; }
  ```
- **dayjs Locale:** `ant-layout.tsx` setup `dayjs.locale("th")` และ extend plugins ไว้ global แล้ว — **ห้าม** extend ซ้ำในแต่ละ component แต่ต้อง **pin locale ที่ call site** เพื่อป้องกัน SSR locale reset:
  ```ts
  dayjs(x).locale("th").fromNow()   // ✅ pin ทุกครั้งที่เรียก
  dayjs(x).fromNow()                 // ❌ อาจแสดงภาษาอังกฤษบน SSR
  ```
- **Font:** FontWeight สูงสุดไม่เกิน 600
- **Constraint:** ห้ามลบฟังก์ชันเดิมที่มีอยู่แล้วเด็ดขาด

## [Response Format]

- ตอบกลับเฉพาะ Code ที่จำเป็น
- แนะนำ Step ถัดไปสั้นๆ เพื่อประหยัด Token
