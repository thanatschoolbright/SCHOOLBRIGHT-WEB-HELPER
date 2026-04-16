# /export-feature — เพิ่ม Export Excel/PDF ให้ Table ที่มีอยู่

Scaffold ระบบ Export สำหรับ Table ที่มีอยู่แล้ว โดยใช้ Library ที่ติดตั้งไว้แล้วในโปรเจกต์ (`exceljs`, `jspdf`) ครบทั้ง Modal, Service function และปุ่ม Action

## วิธีใช้

```
/export-feature
```

Claude จะถามข้อมูล:

1. **path ของ feature** ที่ต้องการเพิ่ม export (เช่น `src/app/timesheet/overtime`)
2. **ชื่อรายงาน (Thai)** (เช่น `รายงานการทำงานล่วงเวลา`)
3. **format ที่ต้องการ**: Excel / PDF / ทั้งคู่
4. **columns ที่ต้องการใน export** (อาจต่างจาก Table บนหน้าจอ)
5. **ใช้ข้อมูลจาก state เดิม หรือ fetch ใหม่ตอน export?**
   - ถ้า fetch ใหม่ → ระบุ API endpoint
6. **ต้องการ filter ตาม date range ใน export?**
7. **ชื่อไฟล์ที่ export** (เช่น `รายงาน-OT-{วันที่}`)

## ไฟล์ที่จะถูกสร้างหรือแก้ไข

```
src/app/{domain}/{feature}/
├── _components/
│   └── export-modal.tsx              # สร้างใหม่ — Modal เลือก format + progress
├── _api/
│   └── {feature}-export-service.ts  # สร้างใหม่ — Generate Excel/PDF
└── page.tsx                          # แก้ไข — เพิ่ม <ExportModal /> และปุ่ม
```

## Template ที่สร้าง

### export-modal.tsx
```tsx
"use client";
import { useState } from "react";
import { Button, Modal, Radio, Space } from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { StatusModalComponent } from "@components/modal/status-modal-component";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  data: {DataType}[];
}

// Modal สำหรับเลือกรูปแบบและดาวน์โหลดรายงาน
export function ExportModal({ open, onClose, data }: ExportModalProps) {
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [isLoading, setIsLoading] = useState(false);

  // ดาวน์โหลดรายงานตามรูปแบบที่เลือก
  const handleExport = async () => {
    setIsLoading(true);
    try {
      if (format === "excel") {
        await exportToExcel(data);
      } else {
        await exportToPdf(data);
      }
      toast.success("ดาวน์โหลดรายงานสำเร็จ");
      onClose();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="ส่งออกรายงาน"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>ยกเลิก</Button>,
        <Button key="export" type="primary" loading={isLoading} onClick={handleExport}>
          ดาวน์โหลด
        </Button>,
      ]}
    >
      <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
        <Space direction="vertical">
          <Radio value="excel"><FileExcelOutlined /> ไฟล์ Excel (.xlsx)</Radio>
          <Radio value="pdf"><FilePdfOutlined /> ไฟล์ PDF (.pdf)</Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
}
```

### {feature}-export-service.ts
```ts
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import "jspdf-autotable";

// สร้างไฟล์ Excel สำหรับรายงาน {Thai name}
export async function exportToExcel(data: {DataType}[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("{Thai sheet name}");

  // กำหนด header columns
  worksheet.columns = [
    { header: "{Thai column}", key: "field_name", width: 20 },
    // ...
  ];

  // ใส่ข้อมูล
  data.forEach((row) => worksheet.addRow(row));

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `{Thai filename}-${new Date().toLocaleDateString("th-TH")}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// สร้างไฟล์ PDF สำหรับรายงาน {Thai name}
export async function exportToPdf(data: {DataType}[]): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape" });
  // autoTable logic...
  doc.save(`{Thai filename}-${new Date().toLocaleDateString("th-TH")}.pdf`);
}
```

## กฎที่บังคับใช้อัตโนมัติ

- ปุ่ม Export วางที่ **มุมขวาบนของ Table section** เสมอ
- ชื่อปุ่ม: `"ส่งออกรายงาน"` (ไทย 100%)
- ชื่อไฟล์ที่ดาวน์โหลดต้องมีวันที่ format `th-TH`
- ใช้ `toast.success` / `toast.error` จาก `sonner`
- ห้ามใช้ emoji ในทุกส่วน
- ห้ามแก้ไขหรือลบ logic เดิมของ Table — เพิ่มต่อท้ายเท่านั้น
- ถ้า column ใน export ต่างจากที่แสดงบนหน้าจอ — ใช้ข้อมูล raw จาก store ไม่ใช่ Table columns
