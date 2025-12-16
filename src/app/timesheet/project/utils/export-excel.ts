import * as XLSX from "xlsx";
import { toast } from "sonner";
import dayjs from "dayjs";

interface Project {
  id: number;
  name: string;
  name_en?: string;
  description: string;
  categoryType: string;
  status: string;
  start_date?: string;
  end_date?: string;
  features?: Array<{ is_deleted: boolean }>;
  createdAt: string;
  is_deleted?: boolean;
}

export const exportProjectsToExcel = (
  projects: Project[],
  getCategoryName: (id: string) => string
) => {
  try {
    const data = projects.map((project, index) => ({
      ลำดับ: index + 1,
      ID: String(project.id).padStart(4, "0"),
      "ชื่อโครงการ (TH)": project.name,
      "ชื่อโครงการ (EN)": project.name_en || "-",
      รายละเอียด: project.description || "-",
      ประเภท: getCategoryName(project.categoryType),
      สถานะ: project.status === "open" ? "เปิดใช้งาน" : "ปิดแล้ว",
      วันเริ่มต้น: project.start_date
        ? dayjs(project.start_date).format("DD/MM/YYYY")
        : "-",
      วันสิ้นสุด: project.end_date
        ? dayjs(project.end_date).format("DD/MM/YYYY")
        : "-",
      จำนวนโครงการย่อย:
        project.features?.filter((f) => !f.is_deleted).length || 0,
      สถานะการใช้งาน: project.is_deleted ? "ถูกลบ" : "ใช้งานอยู่",
      วันที่สร้าง: dayjs(project.createdAt).format("DD/MM/YYYY HH:mm"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

    const colWidths = [
      { wch: 8 },
      { wch: 8 },
      { wch: 30 },
      { wch: 30 },
      { wch: 40 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];
    worksheet["!cols"] = colWidths;

    const fileName = `Projects_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`ส่งออกข้อมูล ${projects.length} โครงการสำเร็จ`);
  } catch (error) {
    toast.error("ไม่สามารถส่งออกข้อมูลได้");
    console.error("Export error:", error);
  }
};
