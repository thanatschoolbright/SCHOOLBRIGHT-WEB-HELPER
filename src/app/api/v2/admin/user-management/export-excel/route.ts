import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";

/**
 * @description API สำหรับ Export ข้อมูลพนักงานเป็น Excel (IPO Enterprise Grade)
 * @method GET
 * @path /api/v2/admin/user-management/export-excel
 * @returns {Buffer} Excel file buffer
 */
export async function GET(req: NextRequest) {
  try {
    // ✨ เรียกใช้ Service เพื่อสร้าง Buffer ของ Excel ที่ตกแต่งแล้ว (Modular Style)
    const buffer = await UserManagementService.generateExportExcel();

    // เตรียมชื่อไฟล์ (พุทธศักราช)
    const now = dayjs();
    const thaiYear = now.year() + 543;
    const formattedDate = `${now.format("DD-MM")}-${thaiYear}`;
    const filename = `รายงานพนักงานบริษัทจับจ่ายคอร์เปอเรชัน_จำกัด_${formattedDate}.xlsx`;

    // ส่ง Response กลับในรูปแบบ Binary File
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("❌ [ExportExcel] Error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel กรุณาติดต่อ IT",
        message_en: "Internal Server Error during Excel export",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
