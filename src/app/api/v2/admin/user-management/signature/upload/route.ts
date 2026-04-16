import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@helpers/api/response";
import { uploadSignatureService } from "../service/signature-service";

// อัปโหลดลายเซ็นของ user ไปยัง Huawei OBS และบันทึก path ลงฐานข้อมูล
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      errorResponse({
        message_th: "ไม่มีสิทธิ์เข้าถึง",
        message_en: "Unauthorized",
        status: 401,
      }),
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userIdRaw = formData.get("user_id") as string | null;
    const oldSignaturePath = formData.get("old_signature_path") as string | null;

    if (!file || !userIdRaw) {
      return NextResponse.json(
        errorResponse({
          message_th: "ข้อมูลไม่ครบถ้วน (ต้องการไฟล์และ user_id)",
          message_en: "Missing file or user_id",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const user_id = parseInt(userIdRaw, 10);
    if (isNaN(user_id) || user_id <= 0) {
      return NextResponse.json(
        errorResponse({
          message_th: "user_id ไม่ถูกต้อง",
          message_en: "Invalid user_id",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // ตรวจสอบประเภทไฟล์ — รับเฉพาะรูปภาพ
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        errorResponse({
          message_th: "ประเภทไฟล์ไม่รองรับ กรุณาอัปโหลดไฟล์รูปภาพ (PNG, JPG, WEBP)",
          message_en: "Unsupported file type. Please upload an image file.",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // ตรวจสอบขนาดไฟล์ไม่เกิน 5 MB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        errorResponse({
          message_th: "ขนาดไฟล์เกินกำหนด (สูงสุด 5 MB)",
          message_en: "File size exceeds the 5 MB limit",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const result = await uploadSignatureService(
      file,
      user_id,
      oldSignaturePath ?? undefined,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "อัปโหลดลายเซ็นสำเร็จ",
        message_en: "Signature uploaded successfully",
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น",
        message_en: message,
        status: 500,
        error,
      }),
      { status: 500 },
    );
  }
}
