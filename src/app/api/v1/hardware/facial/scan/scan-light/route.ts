import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * ฟังก์ชันสำหรับแสกนใบหน้า (Light Version)
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { school_id, user_code, s_id, version = "1.2.5" } = body;

    if (!school_id || !user_code || !s_id) {
      return NextResponse.json(
        errorResponse({
          message_en: "Missing required fields",
          message_th: "ข้อมูลไม่ครบถ้วน",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // เตรียม Payload สำหรับ Externel API
    const payload = {
      schoolId: String(school_id),
      UserCode: String(user_code),
      sID: String(s_id),
      version: version,
    };

    const externalUrl =
      "https://hardware.schoolbright.co/api/jobscan/TimeStamp";

    const response = await axios.post(externalUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        // หมายเหตุ: Cookie อาจจะหมดอายุได้ในอนาคต หากใช้ถาวรควรมีการจัดการ Session
        Cookie: "HWWAFSESID=03e7db5aba0cb39b6c; HWWAFSESTIME=1774516432923",
      },
    });

    return NextResponse.json(
      successResponse({
        message_th: "แสกนใบหน้าสำเร็จ",
        message_en: "Face scan successful",
        data: response.data,
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      "Scan Light API Error:",
      error.response?.data || error.message,
    );
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Hardware API",
        status: 500,
      }),
      { status: 500 },
    );
  }
}
