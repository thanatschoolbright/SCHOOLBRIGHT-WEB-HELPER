# Batch Operations Feature - Overtime Management

## Overview

เพิ่มฟีเจอร์การทำรายการแบบหลายรายการพร้อมกัน (Batch Operations) สำหรับระบบโอที เพื่อเพิ่มประสิทธิภาพในการจัดการใบโอทีจำนวนมาก

## Features Added

### 1. **Checkbox Selection**

- เพิ่ม Checkbox ในตารางเพื่อเลือกรายการหลายรายการพร้อมกัน
- สามารถเลือกทั้งหมดหรือเลือกเฉพาะรายการที่ต้องการ
- แสดงจำนวนรายการที่เลือกไว้บนปุ่ม

### 2. **Batch Status Change (ปรับสถานะใบโอทีแบบหลายรายการ)**

- ปรับสถานะใบโอทีหลายรายการพร้อมกัน
- รองรับสถานะ: รออนุมัติ (pending), อนุมัติ (approved), ปฏิเสธ (rejected)
- แสดง Modal ยืนยันก่อนทำรายการ
- ใช้ API endpoint เดิม: `/api/v1/timesheet/overtime/change-status`

### 3. **Batch Email Sending (ส่งอีเมลแบบหลายรายการ)**

- ส่งอีเมลไปยัง HR หลายรายการพร้อมกัน
- ส่งไปที่: `manager.hr@schoolbright.co` (ตามค่า DEFAULT_HR_EMAIL)
- ใช้ API endpoint เดิม: `/api/v1/timesheet/overtime/send-email`

### 4. **Visual Feedback**

- แสดงเครื่องหมายถูก (✓) สีเขียวหน้ารายการที่ทำสำเร็จแล้ว
- แสดงสถานะ Loading ขณะกำลังประมวลผล
- แสดงผลสรุปจำนวนรายการที่สำเร็จและล้มเหลว

## User Interface

### Batch Action Buttons

เมื่อเลือกรายการแล้ว จะแสดงปุ่ม:

1. **ปรับสถานะ (X)** - ปรับสถานะรายการที่เลือก
2. **ส่งอีเมล (X)** - ส่งอีเมลรายการที่เลือก
3. **ยกเลิกการเลือก** - ยกเลิกการเลือกทั้งหมด

### Status Indicator Column

- คอลัมน์แรกของตารางแสดงสถานะการประมวลผล
- แสดงเครื่องหมายถูก (✓) สีเขียวเมื่อทำรายการสำเร็จ

## Permission Control

- เฉพาะ Admin ID `117` เท่านั้นที่สามารถใช้ฟีเจอร์ Batch Operations ได้
- ระบบจะตรวจสอบสิทธิ์ก่อนทำรายการทุกครั้ง

## Technical Implementation

### State Management

```typescript
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
const [batchProcessing, setBatchProcessing] = useState(false);
const [processedItems, setProcessedItems] = useState<Set<React.Key>>(new Set());
const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
const [batchSelectedStatus, setBatchSelectedStatus] =
  useState<string>("approved");
```

### Batch Processing Functions

1. **batchApproveOvertime(status)** - ปรับสถานะหลายรายการ
2. **batchSendEmail()** - ส่งอีเมลหลายรายการ

### API Calls

ใช้ API endpoints เดิม:

- `POST /api/v1/timesheet/overtime/change-status?id={id}`
- `POST /api/v1/timesheet/overtime/send-email`

## Usage Flow

### Batch Status Change

1. เลือกรายการที่ต้องการปรับสถานะ (Checkbox)
2. คลิกปุ่ม "ปรับสถานะ (X)"
3. เลือกสถานะที่ต้องการใน Modal
4. คลิก "บันทึก"
5. ระบบจะประมวลผลทีละรายการ
6. แสดงเครื่องหมายถูกหน้ารายการที่สำเร็จ
7. แสดงผลสรุปเมื่อเสร็จสิ้น

### Batch Email Sending

1. เลือกรายการที่ต้องการส่งอีเมล (Checkbox)
2. คลิกปุ่ม "ส่งอีเมล (X)"
3. ระบบจะประมวลผลทีละรายการ
4. แสดงเครื่องหมายถูกหน้ารายการที่สำเร็จ
5. แสดงผลสรุปเมื่อเสร็จสิ้น

## Error Handling

- แสดง Toast error สำหรับแต่ละรายการที่ล้มเหลว
- แสดงสรุปจำนวนรายการที่สำเร็จและล้มเหลว
- ไม่หยุดการประมวลผลเมื่อพบข้อผิดพลาด (ทำต่อไปจนครบทุกรายการ)

## Benefits

✅ ประหยัดเวลาในการอนุมัติ OT หลายรายการ
✅ ลดการกดซ้ำ ๆ แบบ 1:1
✅ แสดงผลลัพธ์แบบ Real-time
✅ ใช้ API เดิม ไม่ต้องแก้ไข Backend
✅ มี Visual Feedback ชัดเจน

## File Modified

- `/src/app/timesheet/overtime/page.tsx`

## Dependencies

- Ant Design Table (rowSelection)
- React State Management
- Existing API endpoints
