# Timesheet Entry - Sub-Project Search Feature

## Overview

ฟีเจอร์นี้เพิ่มความสามารถในการค้นหาโครงการย่อย (Sub-Project) ได้โดยตรง โดยไม่ต้องเลือกจากโครงการหลักก่อน เพื่อแก้ปัญหาที่ผู้ใช้งานหาโครงการย่อยไม่เจอเนื่องจากมีโครงการย่อยจำนวนมาก

## Features

### 1. Two Search Modes

ผู้ใช้สามารถเลือกวิธีการกรอก Timesheet ได้ 2 แบบ:

#### Mode 1: Hierarchy (เลือกตามโครงการ)

- เลือกโครงการหลักก่อน
- จากนั้นเลือกโครงการย่อยจาก dropdown ที่กรองตามโครงการหลัก
- เหมาะสำหรับผู้ใช้ที่รู้ว่างานอยู่ในโครงการไหน

#### Mode 2: Direct Search (ค้นหางานย่อย)

- ค้นหาโครงการย่อยได้โดยตรงจากชื่อ
- แสดงผลในรูปแบบ: `ชื่อโครงการย่อย (ชื่อโครงการหลัก) (รหัส ID โครงการย่อย-รหัส ID โครงการหลัก)`
- เมื่อเลือกแล้วจะ auto-fill ทั้ง project_id และ sub_project_id
- เหมาะสำหรับผู้ใช้ที่รู้ชื่องานแต่ไม่แน่ใจว่าอยู่ในโครงการไหน

### 2. Search Display Format

รูปแบบการแสดงผลในการค้นหา:

```
ชื่อโครงการย่อย (ชื่อโครงการหลัก) (รหัส ID โครงการย่อย-รหัส ID โครงการหลัก)
```

ตัวอย่าง:

```
Login Feature (SchoolBright Web) (123-45)
```

## Technical Implementation

### 1. Database Schema

ใช้ Prisma schema จาก `prisma/timesheet/schema.prisma`:

- **Project** (โครงการหลัก) - มี id, name, name_en
- **Feature** (โครงการย่อย) - มี id, name, name_en, projectId (FK to Project)
- **TimesheetEntry** - มี projectId และ featureId

### 2. Backend Services

#### Sub-Project Service

Location: `src/services/backend/timesheet/sub-project/sub-project.service.ts`

เพิ่ม method:

```typescript
async search(query: string, { limit = 50 }: { limit?: number } = {})
```

- ค้นหาจาก name และ name_en (case-insensitive)
- รวมข้อมูล project ที่เกี่ยวข้อง
- จำกัดผลลัพธ์ที่ 50 รายการ

#### Project Service

Location: `src/services/timesheet/project.service.ts`

Method:

```typescript
searchSubProject(query: string)
```

- เรียกใช้ SubProjectBackendService.search()
- จัดรูปแบบข้อมูลให้พร้อมแสดงผล
- สร้าง display_label ตามรูปแบบที่กำหนด

### 3. API Endpoint

**Endpoint**: `GET /api/v1/timesheet/project/sub-project/search`

**Query Parameters**:

- `q` (string) - คำค้นหา

**Response**:

```json
{
  "data": [
    {
      "id": 123,
      "name": "Login Feature",
      "main_project_id": 45,
      "main_project_name": "SchoolBright Web",
      "display_label": "Login Feature (SchoolBright Web) (123-45)",
      "full_data": { ... }
    }
  ]
}
```

### 4. Frontend Implementation

#### Component: CreateModalForm

Location: `src/app/timesheet/entry/create.tsx`

**New States**:

- `searchMode`: "hierarchy" | "direct" - โหมดการค้นหา
- `subProjectOptionsSearch`: array - ผลลัพธ์การค้นหา
- `searching`: boolean - สถานะกำลังค้นหา

**Key Functions**:

- `handleSearchSubProject(value)`: ค้นหาโครงการย่อยด้วย debounce 500ms
- Auto-fill project_id และ sub_project_id เมื่อเลือกจากผลการค้นหา

**Validation**:

- Hierarchy mode: ต้องกรอก project_id และ sub_project_id
- Direct search mode: ต้องเลือกจากผลการค้นหา และมี project_id, sub_project_id

**Mode Switching**:

- เมื่อสลับโหมด จะ clear fields ของโหมดเดิม
- Validation rules ปรับตามโหมดที่เลือก

## User Flow

### Hierarchy Mode

1. ผู้ใช้เลือก "เลือกตามโครงการ"
2. เลือกโครงการหลักจาก dropdown
3. เลือกโครงการย่อยจาก dropdown ที่กรองแล้ว
4. กรอกข้อมูลอื่นๆ และบันทึก

### Direct Search Mode

1. ผู้ใช้เลือก "ค้นหางานย่อย"
2. พิมพ์ชื่องานย่อย, โครงการหลัก หรือ ID
3. ระบบค้นหาและแสดงผลลัพธ์ (debounce 500ms)
4. เลือกงานที่ต้องการจากผลการค้นหา
5. ระบบ auto-fill project_id และ sub_project_id
6. กรอกข้อมูลอื่นๆ และบันทึก

## Data Submission

ทั้ง 2 โหมดจะส่งข้อมูลเหมือนกัน:

```typescript
{
  project_id: number,
  sub_project_id: number,
  date: Date,
  work_hour: number,
  status: string,
  description?: string
}
```

## Benefits

1. **ค้นหาง่ายขึ้น**: ผู้ใช้สามารถค้นหาโครงการย่อยได้โดยตรง
2. **ประหยัดเวลา**: ไม่ต้องเลือกจากโครงการหลักก่อนทุกครั้ง
3. **ข้อมูลครบถ้วน**: แสดงทั้งชื่อโครงการหลัก, โครงการย่อย และ ID
4. **ยืดหยุ่น**: รองรับทั้งผู้ใช้ที่รู้โครงการและไม่รู้โครงการ
5. **ป้องกันข้อผิดพลาด**: Validation ที่ชัดเจนตามแต่ละโหมด

## Performance Considerations

1. **Debounce**: การค้นหามี debounce 500ms เพื่อลด API calls
2. **Limit Results**: จำกัดผลลัพธ์ที่ 50 รายการ
3. **Case-insensitive Search**: ค้นหาแบบไม่สนใจตัวพิมพ์เล็ก-ใหญ่
4. **Index Optimization**: ควร index columns: name, name_en, is_deleted ใน Feature table
