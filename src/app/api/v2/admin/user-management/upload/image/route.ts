import { NextRequest, NextResponse } from "next/server";
import { ObsService } from "@/services/backend/huawei/obs.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeCode = formData.get("employee_code") as string;
    const oldImagePath = formData.get("old_image_path") as string;

    if (!file || !employeeCode) {
      return NextResponse.json(
        errorResponse({
          message_th: "ข้อมูลไม่ครบถ้วน (ต้องการไฟล์และรหัสพนักงาน)",
          message_en: "Missing file or employee code",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // Prepare path: profile_images/{employee_code}/img_{timestamp}.png
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "png";
    const key = `profile_images/${employeeCode}/img_${timestamp}.${extension}`;
    const bucket = process.env.OBS_BUCKET_NAME || "";

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to OBS
    const result = await ObsService.uploadFile(bucket, key, buffer, file.type);

    // Cleanup old image if provided
    if (oldImagePath && oldImagePath.includes(process.env.OBS_DOMAIN || "")) {
      try {
        const oldKey = oldImagePath.split(`${process.env.OBS_DOMAIN}/`)[1];
        if (oldKey) {
          await ObsService.deleteFile(bucket, oldKey);
        }
      } catch (e) {
        console.warn("Soft warning: old image cleanup failed", e);
      }
    }

    return NextResponse.json(
      successResponse({
        data: { url: result.url },
        message_th: "อัปโหลดรูปภาพสำเร็จ",
        message_en: "Image uploaded successfully",
      }),
    );
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        message_en: error.message || "Internal Server Error",
        error: error,
      }),
      { status: 500 },
    );
  }
}
