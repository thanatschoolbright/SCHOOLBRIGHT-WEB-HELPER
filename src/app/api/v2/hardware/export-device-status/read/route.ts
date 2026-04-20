import { errorResponse } from "@/helpers/api/response";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { ExportDeviceStatusService } from "../service/export-device-status-service";

/**
 * API Route สำหรับส่งออกข้อมูลสถานะอุปกรณ์เป็นไฟล์ Excel
 * GET /api/v2/hardware/export-device-status/read
 */
export async function GET(request: NextRequest) {
  try {
    const buffer = await ExportDeviceStatusService.generateDeviceStatusExcel();

    const filename = `report_device_status_${dayjs().format(
      "DD-MM-YYYY-HHmm",
    )}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // ลบเครื่องหมาย " ที่ครอบ ${filename} ออก
        "Content-Disposition": `attachment; filename=${filename}`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      },
    });
  } catch (error: any) {
    console.error("Export Device Status Error:", error);
    return NextResponse.json(
      errorResponse({
        error: error.message || "เกิดข้อผิดพลาดในการสร้างไฟล์ Excel",
      }),
      { status: 500 },
    );
  }
}
