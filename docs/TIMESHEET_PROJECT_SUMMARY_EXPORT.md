# 📊 Timesheet Project Summary Export System

ระบบส่งออกรายงานสรุป Timesheet แยกตามโปรเจ็ค เพื่อให้ผู้ใช้งานสามารถดูว่าการลง Timesheet รวมแล้วผู้ใช้รวมลงไปกับ Project A, B, C อย่างละกี่ชั่วโมง

## 🎯 Features

- **รายงานสรุปตาม Project**: แสดงชั่วโมงรวมทุกคนในแต่ละโครงการหลัก
- **รายงานสรุปตาม Sub Project**: แสดงชั่วโมงรวมทุกคนในแต่ละ Feature/โครงการย่อย  
- **รายงานรายละเอียด**: แสดงรายละเอียดผู้ใช้ในแต่ละ Project/Sub Project
- **ส่งออก Excel**: สร้างไฟล์ Excel หลายแผ่นงาน
- **เปอร์เซ็นต์การมีส่วนร่วม**: คำนวณเปอร์เซ็นต์ของแต่ละ Project/Sub Project และผู้ใช้

## 🏗️ Architecture

### 1. Frontend Components
- **ExportModalByProject**: Modal สำหรับการกำหนดค่าการส่งออก
- **TimesheetControls**: ปุ่มสำหรับเรียกใช้งาน Modal

### 2. API Endpoints
- **POST** `/api/v1/timesheet/excel/template_2`: สร้างและส่งออกไฟล์ Excel

### 3. Backend Services
- **TimesheetProjectSummaryService**: จัดการการดึงข้อมูลและสร้าง Excel

### 4. Database
- **Prisma Timesheet**: ใช้ database timesheet สำหรับข้อมูล Timesheet

## 📋 API Usage

### Request Format

```typescript
interface ProjectExportData {
  start_date: string;                    // "YYYY-MM-DD"
  end_date: string;                      // "YYYY-MM-DD"
  export_type: "project" | "sub_project"; // ประเภทรายงาน
}
```

### Example Request

```bash
# Export by Project
curl -X POST http://localhost:3000/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "export_type": "project"
  }'

# Export by Sub Project  
curl -X POST http://localhost:3000/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "export_type": "sub_project"
  }'
```

### Response
- **Success**: ไฟล์ Excel (.xlsx)
- **Error**: JSON error message

## 📊 Excel Structure

### Sheet 1: สรุปรวม

#### Project Export Format:
| โปรเจ็ค | รหัสโปรเจ็ค | จำนวนชั่วโมงรวม | จำนวนผู้ใช้ | เปอร์เซ็นต์ของรวม |
|---------|-------------|-----------------|-------------|-------------------|
| Project A | 1 | 120.50 | 3 | 45.23% |
| Project B | 2 | 85.25 | 2 | 32.01% |

#### Sub Project Export Format:
| โปรเจ็คหลัก | รหัสโปรเจ็คหลัก | Sub Project | รหัส Sub Project | จำนวนชั่วโมงรวม | จำนวนผู้ใช้ | เปอร์เซ็นต์ของรวม |
|-------------|-----------------|-------------|------------------|-----------------|-------------|-------------------|
| Project A | 1 | Feature Login | 10 | 45.50 | 3 | 25.30% |
| Project A | 1 | Feature Dashboard | 11 | 65.25 | 4 | 36.20% |
| Project B | 2 | Feature API | 15 | 89.75 | 2 | 49.80% |

### Sheet 2+: รายละเอียดแต่ละโปรเจ็ค/Sub Project
| ผู้ใช้ | รหัสพนักงาน | จำนวนชั่วโมง | เปอร์เซ็นต์ |
|-------|-------------|--------------|------------|
| John Doe | EMP001 | 65.50 | 54.35% |
| Jane Smith | EMP002 | 55.00 | 45.65% |

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Next.js 14+
- Prisma
- XLSX library

### 2. Installation
ไฟล์ทั้งหมดถูกสร้างขึ้นแล้ว ไม่ต้องติดตั้งเพิ่มเติม

### 3. Usage

#### Frontend (User Interface)
1. เข้าไปที่หน้า `/timesheet/all`
2. คลิกปุ่ม "ส่งออกรายงานโปรเจ็ค"
3. เลือกช่วงวันที่
4. เลือกประเภทรายงาน:
   - **📊 สรุปตาม Project**: รวมชั่วโมงตามโครงการหลัก
   - **📈 สรุปตาม Sub Project**: รวมชั่วโมงตาม Feature/โครงการย่อย
5. คลิก "สร้างรายงาน"

#### API (Direct Call)
```javascript
const response = await fetch('/api/v1/timesheet/excel/template_2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    export_type: 'project', // or 'sub_project'
  }),
});

const blob = await response.blob();
// Handle file download
```

## 🗂️ File Structure

```
src/
├── app/
│   ├── api/v1/timesheet/excel/template_2/
│   │   └── route.ts                           # API endpoint
│   └── timesheet/all/
│       └── page.tsx                           # Updated with ExportModalByProject
├── components/modal/
│   └── timesheet-export-modal-by-project.tsx # Export modal component
├── services/
│   ├── backend/timesheet/
│   │   └── project-summary.service.ts        # Backend service
│   └── timesheet/
│       └── timesheet-all.service.ts           # Updated with PROJECT_EXPORT
└── stores/reducers/
    └── timesheet.reducer.ts                   # Updated with exportModal2
```

## 🧪 Testing

### Automated Testing
```bash
chmod +x test-export-system.sh
./test-export-system.sh
```

### Manual Testing
1. Start development server: `npm run dev`
2. Navigate to `/timesheet/all`
3. Test the export functionality through UI

## 🔧 Configuration

### Environment Variables
```env
DATABASE_TIMESHEET_URL=postgresql://...
BASE_URL=http://localhost:3000  # For user API calls
```

### Prisma Schema
ใช้ schema ที่อยู่ใน `prisma/timesheet/schema.prisma`:
- **Project**: ข้อมูลโปรเจ็ค
- **Feature**: ข้อมูล feature ของโปรเจ็ค  
- **TimesheetEntry**: ข้อมูลการลงเวลา

## 🎨 Customization

### Adding New Export Fields
1. Update `ProjectSummaryData` interface
2. Modify `getProjectSummary()` method
3. Update Excel generation in `generateProjectSummaryExcel()`

### Styling the Modal
1. Edit `timesheet-export-modal-by-project.tsx`
2. Update Ant Design theme tokens
3. Modify CSS classes in `@/styles/timesheet-apple.css`

## ⚠️ Known Issues

1. **User Data**: ปัจจุบันใช้ fallback data หากไม่สามารถเรียก user API ได้
2. **Large Datasets**: อาจใช้เวลานานในการสร้าง Excel สำหรับข้อมูลจำนวนมาก
3. **Memory Usage**: การสร้าง Excel อาจใช้ memory สูงสำหรับข้อมูลขนาดใหญ่

## 🛠️ Troubleshooting

### API Returns 500 Error
1. ตรวจสอบ database connection
2. ตรวจสอบ Prisma client generation
3. ดู logs ใน console

### Excel File is Empty
1. ตรวจสอบว่ามีข้อมูลในช่วงวันที่ที่เลือก
2. ตรวจสอบการกรองโปรเจ็คและผู้ใช้
3. ตรวจสอบสิทธิ์การเข้าถึงข้อมูล

### Modal Not Opening
1. ตรวจสอบ Redux state management
2. ตรวจสอบ modal state ใน timesheet.reducer.ts
3. ตรวจสอบ component import

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is part of SchoolBright system.