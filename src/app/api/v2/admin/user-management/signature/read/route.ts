import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@helpers/api/response";
import { readSignatureSchema } from "../validation/signature-schema";
import { readSignatureService } from "../service/signature-service";

// ดึง URL ลายเซ็นของ user ตาม user_id
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const raw = { user_id: searchParams.get("user_id") ?? "" };

    const parsed = readSignatureSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          message_th: "user_id ไม่ถูกต้อง",
          message_en: "Invalid user_id",
          status: 400,
          error: parsed.error.issues,
        }),
        { status: 400 },
      );
    }

    const user_id = parseInt(parsed.data.user_id, 10);
    const result = await readSignatureService(user_id);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลลายเซ็นสำเร็จ",
        message_en: "Signature fetched successfully",
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลลายเซ็น",
        message_en: message,
        status: 500,
        error,
      }),
      { status: 500 },
    );
  }
}
