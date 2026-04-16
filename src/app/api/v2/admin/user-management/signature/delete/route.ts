import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { deleteSignatureSchema } from "../validation/signature-schema";
import { deleteSignatureService } from "../service/signature-service";

// ลบลายเซ็นของ user ออกจาก OBS และล้าง path ในฐานข้อมูล
export async function DELETE(request: NextRequest) {
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

  const validation = await validateRequest(request, deleteSignatureSchema);
  if ("error" in validation) return validation.error;

  try {
    await deleteSignatureService(
      validation.data.user_id,
      validation.data.signature_path,
    );

    return NextResponse.json(
      successResponse({
        data: null,
        message_th: "ลบลายเซ็นสำเร็จ",
        message_en: "Signature deleted successfully",
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการลบลายเซ็น",
        message_en: message,
        status: 500,
        error,
      }),
      { status: 500 },
    );
  }
}
