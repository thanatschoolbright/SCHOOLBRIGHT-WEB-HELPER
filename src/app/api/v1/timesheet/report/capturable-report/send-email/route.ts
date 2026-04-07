import { errorResponse, successResponse } from "@/helpers/api/response";
import { sendMailWithAttachment } from "@/server/mailer";
import { ExcelService } from "@/services/backend/timesheet/report/capturable/capturable.report.service";
import { Service } from "@/services/backend/timesheet/report/capturable/capturable.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Validation Schema ──
const DateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
});

const SendEmailSchema = z.object({
  ranges: z.array(DateRangeSchema).min(1, "ต้องระบุช่วงวันที่อย่างน้อย 1 รายการ"),
  recipients: z.array(z.string().email("อีเมลไม่ถูกต้อง")).min(1, "ต้องระบุอีเมลอย่างน้อย 1 รายการ"),
});

// ── Helper: แปลงวันที่ YYYY-MM-DD → DD/MM/พ.ศ. ──
const formatDateThai = (dateStr: string): string => {
  const [year = "", month = "", day = ""] = dateStr.split("-");
  return `${day}/${month}/${parseInt(year, 10) + 543}`;
};

// ── POST /api/v1/timesheet/report/capturable-report/send-email ──
// สร้าง Excel Capturable Report หลาย range แล้วส่งเป็นไฟล์แนบในอีเมลเดียว
export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (!rawBody) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูล JSON ไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  // รองรับ backward compat: { start_date, end_date, recipients } → { ranges, recipients }
  const normalizedBody = rawBody.ranges
    ? rawBody
    : { ranges: [{ start_date: rawBody.start_date, end_date: rawBody.end_date }], recipients: rawBody.recipients };

  const parsed = SendEmailSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  const { ranges, recipients } = parsed.data;

  try {
    // 1. สร้าง Excel buffer ทุก range (parallel)
    const attachments: { filename: string; content: Uint8Array; contentType: string }[] = [];
    const fileLabels: string[] = [];

    await Promise.all(
      ranges.map(async (range) => {
        const dataResult = await Service.getProjectStats(range.start_date, range.end_date);
        const buffer = await ExcelService.generateCapturableReport(dataResult, range.start_date, range.end_date);
        const formattedStart = formatDateThai(range.start_date);
        const formattedEnd = formatDateThai(range.end_date);
        const fileName = `Capitalization_Report_${range.start_date}_to_${range.end_date}.xlsx`;
        fileLabels.push(`${formattedStart} ถึง ${formattedEnd}`);
        attachments.push({
          filename: fileName,
          content: new Uint8Array(buffer as ArrayBuffer),
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      }),
    );

    // เรียงตาม filename เพื่อให้ order คงที่
    attachments.sort((a, b) => a.filename.localeCompare(b.filename));

    // 2. สร้าง HTML email
    const subjectLabel =
      ranges.length === 1
        ? `วันที่ ${fileLabels[0]}`
        : `${ranges.length} ช่วงเวลา`;
    const subject = `[SchoolBright] Capitalization Report ${subjectLabel}`;

    const fileListHtml = attachments
      .map(
        (a) =>
          `<li style="font-size:13px;font-weight:600;color:#1e3a5f;padding:4px 0;">${a.filename}</li>`,
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px 36px;text-align:center;">
      <div style="color:#818cf8;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">SCHOOLBRIGHT SYSTEM</div>
      <div style="color:#fff;font-size:20px;font-weight:800;">Capitalization Report</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:6px;">รายงานวิเคราะห์ทรัพย์สิน · ${ranges.length} ไฟล์แนบ</div>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">สวัสดี,</p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        ไฟล์ Excel <strong style="color:#1e40af;">Capitalization Report</strong> จำนวน
        <strong>${ranges.length} ไฟล์</strong> ได้ถูกแนบมาพร้อมกับอีเมลนี้แล้ว
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #3b82f6;">
        <div style="font-size:13px;color:#475569;margin-bottom:8px;font-weight:600;">ไฟล์ที่แนบมาด้วย (${ranges.length} ไฟล์)</div>
        <ul style="margin:0;padding-left:18px;">${fileListHtml}</ul>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:0;">อีเมลนี้ถูกส่งโดยอัตโนมัติ — กรุณาอย่าตอบกลับ</p>
    </div>
    <div style="padding:16px 36px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:10px;padding:14px 24px;margin-bottom:12px;">
        <div style="color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">System Developed by</div>
        <div style="color:#ffffff;font-size:15px;font-weight:800;letter-spacing:0.5px;">THANAT PROMPIRIYA</div>
        <div style="color:#6366f1;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px;">HEAD OF TECHNOLOGY · SCHOOLBRIGHT</div>
      </div>
      <p style="font-size:11px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} SchoolBright Co., Ltd.</p>
    </div>
  </div>
</body>
</html>`;

    // 3. ส่งอีเมลให้ทุก recipients (1 email = ทุกไฟล์แนบ)
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        await sendMailWithAttachment({ to: recipient, subject, html, attachments });
        results.push({ email: recipient, success: true });
      } catch (err: unknown) {
        results.push({ email: recipient, success: false, error: err instanceof Error ? err.message : "unknown" });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json(
      successResponse({
        data: { sent, failed, total_files: attachments.length, results },
        message_th: `ส่งอีเมล Capitalization Report (${attachments.length} ไฟล์) สำเร็จ ${sent}/${recipients.length} ที่อยู่`,
      }),
    );
  } catch (err: unknown) {
    console.error("❌ [capturable-report/send-email][POST]", err);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการสร้างหรือส่ง Capitalization Report",
        error: err instanceof Error ? err.message : "unknown",
      }),
      { status: 500 },
    );
  }
}
