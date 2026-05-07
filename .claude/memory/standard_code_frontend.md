---
name: Frontend Standard (Builder Mode)
description: โครงสร้าง Feature-based, Zustand state, Ant Design v5 UI standards — อ้างอิงจาก skill /new-feature และ vercel-react-best-practices ที่ใช้จริง
type: project
---

# Frontend Standard (Builder Mode)

## โครงสร้างไฟล์ (Feature-based)

```
src/app/{domain}/{feature}/
├── page.tsx              # Orchestrator — ประกอบ component + layout เท่านั้น
├── _components/          # UI ย่อย เช่น filter-section.tsx, user-table.tsx
├── _api/                 # Axios calls — Pure functions เท่านั้น (callApiService wrappers)
├── _state/               # Zustand store — use-{feature}-store.ts
└── _stores/              # Alternative location (บางฟีเจอร์เก่าใช้ชื่อนี้)
```

**หมายเหตุ:** `_state/` คือ location มาตรฐานใหม่ (ไม่ใช่ `_stores/`)

## State Management (Zustand)

- ข้อมูลที่แชร์ข้าม components → Zustand store ใน `_state/`
- การเรียก API ทำผ่าน store action หรือ service แล้ว update state ทันที
- Summary metrics คำนวณจาก raw data ใน store — ห้ามกรองผ่าน UI table

```ts
// pattern ใน store
export const useFeatureStore = create<FeatureStore>((set, get) => ({
  data: [],
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const res = await getFeatureList();
      set({ data: res?.data?.data ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

## Component Guidelines

1. **Status Modal:** `src/components/modal/status-modal-component.tsx` — types: `"success" | "error" | "confirm" | "delete"`
2. **Page Title:** `src/components/typhography/header-bar-component.tsx` เท่านั้น
3. **Summary Cards:** `src/components/card/summary-card.tsx` — fetch raw data server-side, คำนวณก่อนส่ง
4. **Filter Section:** หัวข้อ "ตัวกรอง" + `<FilterOutlined />` (fontSize: 1rem, fontWeight: 600, marginBottom: 16px), 2 col/row, ปุ่มชิดขวา
5. **Tables:** Card ครอบด้วย mandatory `title` prop, `styles={{ body: { padding: 16 } }}`, ทุก column มี sort, ห้าม maxWidth, action buttons ด้านบนขวา
6. **Notifications:** `toast` จาก `sonner` เท่านั้น

## UI Standards

- Layout: Ant Design v5 (`Flex`, `Row`, `Col`, `Space`) — ห้าม inline CSS/custom stylesheet
- Light/Dark mode: ใช้ `theme.useToken()` tokens เสมอ (ห้าม hardcode hex สี)
- Font weight: สูงสุด 600
- Dates: `dayjs` + timezone setup (`Asia/Bangkok`) ที่ top ของ client component
- Charts: `@ant-design/plots` (preferred)
- Export: `exceljs` (Excel), `jspdf` + `jspdf-autotable` (PDF)

## Naming & Comments

- Identifiers: เต็มและสื่อความหมาย — `responseUserList` ไม่ใช่ `res`
- Comment เหนือทุก function: Thai 1 บรรทัด รูปแบบ `// ✨ คำอธิบาย`
- ภาษา UI: ไทย 100% — ห้ามมีภาษาอังกฤษปนใน labels, buttons, toast
- ห้าม emoji ใน UI strings — อนุญาตเฉพาะใน function comments

## HTTP Clients (ห้ามสลับ)

- `callApiService` (`@services/axios-instance/sb-helper.axios`) — client → internal `/api/v*/` routes
- `callBackendAPI` (`@services/api-gateway`) — server-side → external SchoolBright backend
- ใช้ Axios เท่านั้น (ไม่ใช้ `fetch` ยกเว้นใน logger interceptor)

## RSC-First Approach

- Server Components: push data fetching และ Prisma queries ไปฝั่ง server ให้มากที่สุด
- `"use client"`: เฉพาะส่วนที่มี interaction (Form, Modal, Button with handlers)
- Sub-components ใน `_components/` รับ handlers เป็น props

**Why:** ลด client JS bundle, ปรับปรุง performance ตาม Next.js App Router best practices
**How to apply:** ก่อนเพิ่ม `"use client"` ให้ถามว่า component นี้จำเป็นต้องเป็น client จริงหรือไม่
