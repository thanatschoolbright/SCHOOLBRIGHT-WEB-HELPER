import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";

interface NotifyPayload {
  targets: {
    email?: string | null;
    full_name?: string | null;
    position?: string | null;
    tel?: string | null;
  }[];
}

const buildMailContent = (payload: NotifyPayload) => {
  const lines = payload.targets.map((target, idx) => {
    const name = target.full_name || "-";
    const position = target.position ? `(${target.position})` : "";
    const tel = target.tel ? ` • ${target.tel}` : "";
    return `${idx + 1}. ${name} ${position} • ${target.email ?? "-"}${tel}`;
  });

  return lines.join("\n");
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NotifyPayload;
    if (!payload?.targets?.length) {
      throw new Error("ไม่พบข้อมูลผู้รับอีเมล");
    }

    const summaryText = buildMailContent(payload);

    // TODO: Replace this log with a real mail provider integration (SMTP, Resend, etc.)
    console.info("[Mailer][Timesheet][notify-missing] targets:\n" + summaryText);

    return NextResponse.json(
      successResponse({
        data: {
          notified: payload.targets,
          message: "บันทึกคำขอส่งอีเมลเรียบร้อย (โหมดจำลอง)",
        },
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Mailer][Timesheet][notify-missing]", message, error);

    return NextResponse.json(
      errorResponse({
        status: 400,
        message_en: message,
        message_th: "ข้อมูลไม่ถูกต้อง",
        error,
      }),
      { status: 400 }
    );
  }
}
