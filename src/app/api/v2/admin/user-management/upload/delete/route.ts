import { NextRequest, NextResponse } from "next/server";
import { ObsService } from "@/services/backend/huawei/obs.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบบัญชีไฟล์ที่ต้องการลบ",
          message_en: "No file path provided",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const bucket = process.env.OBS_BUCKET_NAME || "";
    const domain = process.env.OBS_DOMAIN || "";

    // Extract key from URL
    let key = path;
    if (path.includes(domain)) {
      key = path.split(`${domain}/`)[1];
    }

    if (key) {
      await ObsService.deleteFile(bucket, key);
    }

    return NextResponse.json(
      successResponse({
        data: { success: true },
        message_th: "ลบไฟล์สำเร็จ",
        message_en: "File deleted successfully",
      }),
    );
  } catch (error: any) {
    console.error("Delete File Route Error:", error);
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการลบไฟล์",
        message_en: error.message || "Internal Server Error",
        error: error,
      }),
      { status: 500 },
    );
  }
}
