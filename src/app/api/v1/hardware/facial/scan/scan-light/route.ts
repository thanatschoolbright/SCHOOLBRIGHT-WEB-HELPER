import { successResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";
import { scanLightService } from "./_service/scan-light-service";
import { ScanLightSchema } from "./_validation/scan-light-schema";

/** ✨ ฟังก์ชันสำหรับแสกนใบหน้า (Light Version) - POST Request Handler */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 🛡️ ตรวจสอบข้อมูลด้วย Zod Schema ก่อนประมวลผล
    const validationResult = ScanLightSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th:
            "ข้อมูลไม่ถูกต้อง: " + validationResult.error.errors[0].message,
          message_en:
            "Invalid request payload: " +
            validationResult.error.errors[0].message,
        },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    // 🚀 เรียกใช้งาน Service Layer เพื่อประมวลผล Business Logic
    const formattedData = await scanLightService.executeScan(body);

    const response = successResponse({
      message_th: "แสกนใบหน้าสำเร็จ",
      message_en: "Face scan successful",
      data: formattedData,
    });

    return NextResponse.json(
      {
        status_code: 200,
        message_th: response.message_th,
        message_en: response.message_en,
        data: response.data,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      "Scan Light API Error:",
      error.response?.data || error.message,
    );
    return NextResponse.json(
      {
        status_code: 500,
        message_th:
          "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Hardware API หรือระบบประมวลผล",
        message_en: error.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
