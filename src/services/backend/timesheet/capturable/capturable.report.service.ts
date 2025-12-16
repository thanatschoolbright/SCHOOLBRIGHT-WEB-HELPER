import ExcelJS from "exceljs";
import { ProjectStatResult } from "./capturable.service"; // Import interface จากไฟล์เดิม

export const ExcelService = {
  async generateCapturableReport(data: ProjectStatResult[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Capturable Report");

    // 1. กำหนด Columns (ตัด project_id ออกตามโจทย์)
    worksheet.columns = [
      { header: "Project Code", key: "project_code", width: 15 },
      { header: "Project Name", key: "project_name", width: 40 },
      { header: "Capturable (%)", key: "capturable_percent", width: 15 },
      { header: "Uncapturable (%)", key: "uncapturable_percent", width: 15 },
      { header: "Hours", key: "hours", width: 15 },
      { header: "Hours (%)", key: "hours_percent", width: 15 },
    ];

    // 2. ใส่ข้อมูลลงใน Rows
    data.forEach((item) => {
      worksheet.addRow({
        project_code: item.project_code,
        project_name: item.project_name,
        capturable_percent: item.capturable_percent,
        uncapturable_percent: item.uncapturable_percent,
        hours: item.hours,
        hours_percent: item.hours_percent,
      });
    });

    // 3. จัด Style หัวตาราง (Optional: เพื่อความสวยงาม)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // 4. สร้าง Buffer ส่งกลับ
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};
