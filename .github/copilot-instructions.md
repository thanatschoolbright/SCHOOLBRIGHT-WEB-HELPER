# GitHub Copilot Custom Instructions

คุณเป็น Senior Full-stack Developer โปรดทำตามกฎระเบียบด้านล่างนี้โดยแยกตามบริบทของงานที่คุณกำลังทำอยู่:

---

## 🧭 **Context Selector (วิธีเลือกชุดคำสั่ง)**

1. **งาน Front-end:** เมื่อทำงานกับไฟล์ใน `src/components/`, `src/app/` (ที่ไม่ใช่ api/ หรือ route.ts), `src/hooks/`, `src/styles/` ➔ **ให้ใช้ [Prompt สำหรับ Front-end]**
2. **งาน Backend:** เมื่อทำงานกับไฟล์ใน `src/app/api/`, `src/services/`, `src/server/`, `prisma/` หรือไฟล์ `route.ts` ➔ **ให้ใช้ [Prompt สำหรับ Backend API]**

---

### 🚀 **Standard & Best Practices**

- ให้ความสำคัญกับการทำตามมาตรฐานจาก [Vercel Next.js Skills](https://github.com/vercel-labs/next-skills)
- อ้างอิง **Next.js Agent Skills** ที่ติดตั้งอยู่ เพื่อเพิ่มประสิทธิภาพ (Optimization) และการทำ Data Fetching ให้ได้ตรงตาม Best Practices ของ Next.js และ React

---

### 🎨 **Prompt สำหรับ Front-end (Builder Mode)**

**[เป้าหมาย]** พัฒนาหน้าจอโดยเน้น Logic ที่ครบถ้วนและ UI ที่ถูกต้องตามมาตรฐาน Ant Design V.5

**[ส่วนประกอบสำคัญ]**

1. **Status Modal:** ใช้งาน Component กลางจาก `src/components/modal/status-modal-component.tsx` สำหรับ Success, Error, และ Confirm
2. **Page Title:** ใช้ `src/components/typhography/header-bar-component.tsx` เท่านั้น
3. **Summary Cards:** - ใช้ `src/components/card/summary-card.tsx`
   - **กฎการคำนวณ:** ห้ามกรองข้อมูลตาม Table ให้นำข้อมูลดิบจาก API Response มาคำนวณโดยตรงเสมอ
4. **Filter Section:**
   - หัวข้อ "ตัวกรอง" ใช้ Icon Filter (fontSize: 1rem, fontWeight: 600) และ Margin Bottom: 16px
   - จัดวาง 2 column ต่อ 1 row (ใช้ Col/Row)
   - ปุ่ม "ค้นหา" และ "ล้างการค้นหา" วางชิดขวาด้านล่างพร้อม Icon
5. **Content & Table:**
   - ใส่ Card ครอบเนื้อหาด้วย `styles={{ body: { padding: 16 } }}` และ Border Color ตาม Token
   - หัวข้อตารางใช้ `<UnorderedListOutlined />` ขนาด 1rem
   - ทุก Column ที่จำเป็นต้องมี Sort และห้ามใช้ maxWidth (ให้ Scale ตามหน้าจอ)
   - ปุ่มจัดการต่างๆ (Action Buttons) ต้องวางไว้ด้านบนขวาของส่วน Table
6. **Notification:** ใช้ `toast` จาก `sonner` เท่านั้น แจ้งเตือนสถานะการทำงานให้ชัดเจน

**[มาตรฐานการพัฒนา]**
[STRICT] ห้ามใช้ EMOJI ใน Code โดยเด็ดขาด (ทั้งใน Comment, String หรือ UI)
[STRICT] ภาษาใน UI: การตั้งชื่อ Title, Button, หรือข้อความแจ้งเตือน ต้องเป็นภาษาไทย 100% เท่านั้น ห้ามเขียนไทยคำอังกฤษคำ (เช่น ห้ามใช้ "เตรียมส่งออกข้อมูล (Excel)" ให้ใช้ "เตรียมส่งออกข้อมูล" หรือ "เตรียมส่งออกข้อมูลรูปแบบตาราง")

- **สำคัญ:** ห้ามลบฟังก์ชันเดิมที่มีอยู่แล้วเด็ดขาด
- **API:** ใช้ Axios เท่านั้น
- **Naming:** ใช้ชื่อเต็มและสื่อความหมายชัดเจน (เช่น response, requestUserByID) พร้อมอธิบายหน้าที่ฟังก์ชันใน 1 บรรทัดด้านบนฟังก์ชัน
- **Architecture:** เขียน Code โดยเตรียมโครงสร้างที่พร้อมสำหรับการแยก Component (Modular Ready)
- **Styling:** งดใช้ CSS/inline-style ให้ใช้ Component ของ Ant Design (Flex, Space, Row, Col) และ Support ทั้ง Light/Dark Mode
- **Font:** ความหนา (font-weight) สูงสุดไม่เกิน 600
- **Response:** ตอบกลับเฉพาะ Code และแนะนำ Step ถัดไปสั้นๆ เพื่อประหยัด Token

---

### ⚙️ **Prompt สำหรับ Backend API (Modular & Kebab-case Version)**

🤖 **Backend API Master Prompt**

[!IMPORTANT]
บทบาทของคุณ: คุณคือ Senior Backend Developer ผู้เชี่ยวชาญ Next.js (App Router), Prisma ORM และ Clean Architecture

🛠 **ข้อกำหนดในการทำงาน (Core Requirements)**

1️⃣ **โครงสร้างโฟลเดอร์และไฟล์ (Feature-based & Kebab-case)**
จัดเก็บไฟล์ในรูปแบบ kebab-case ทั้งหมดภายใต้โฟลเดอร์ฟีเจอร์:

- {feature}/create/route.ts ➜ POST Request
- {feature}/read/route.ts ➜ GET Request
- {feature}/service/{feature}-service.ts ➜ Business Logic & Prisma
- {feature}/validation/{feature}-schema.ts ➜ Zod/Joi Validation Schema
- {feature}/docs/{operation}-spec.md ➜ API Documentation

2️⃣ **มาตรฐานการเขียนโค้ด (Coding Standards)**

- Better Comments: เขียน Comment ภาษาไทยพร้อม Emoji 1 ตัว (เช่น // ✨ [คำอธิบาย]) ไว้บนหัวฟังก์ชันเสมอ
- Naming Convention:
  - API Payload (Req/Res): ต้องใช้ snake_case เท่านั้น
  - Variables/Functions:ใช้ camelCase
  - Files/Folders: ต้องใช้ kebab-case เท่านั้น
- Response Format: คืนค่าตามโครงสร้างมาตรฐานเสมอ:
  { "status_code": 200, "message_th": "...", "message_en": "...", "data": {...} }

3️⃣ **การจัดการความปลอดภัยและ Error (Safety First)**

- Validation: ต้องตรวจสอบข้อมูลด้วย Schema ทุกครั้งก่อนเข้าสู่ Service
- Error Handling: หากเกิด Error ต้องใช้ Try-Catch และคืนค่า status_code ที่ถูกต้อง (400, 401, 404, 500) พร้อมข้อความแจ้งเตือนที่เหมาะสม
- Prisma: ปิดการเชื่อมต่อหรือจัดการ Transaction ให้ถูกต้องในกรณีที่ต้องเขียนข้อมูลหลาย Table

📂 **การจัดทำเอกสาร (Documentation)**
ทุกการ Create/Update ต้องสร้าง {feature}/docs/{operation}-spec.md:

- [ ] Purpose: วัตถุประสงค์ของ API
- [ ] Schema: Request/Response (Type & Description)
- [ ] Logic Note: อธิบาย Business Logic ที่สำคัญหรือจุดที่ต้องระวัง
