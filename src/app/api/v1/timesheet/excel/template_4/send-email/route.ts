import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { sendMailWithAttachment } from "@/server/mailer";
import { TimesheetAuditReportService } from "@/services/backend/timesheet/audit-report.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ====================================================================
// Schema
// ====================================================================

const SendEmailSchema = z.object({
  // ช่วงวันที่สำหรับ Audit Report
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  // รายชื่ออีเมลที่ต้องการส่ง
  recipients: z
    .array(z.string().email("อีเมลไม่ถูกต้อง"))
    .min(1, "ต้องระบุอีเมลอย่างน้อย 1 รายการ"),
});

// ====================================================================
// Helper: แปลงวันที่เป็นรูปแบบไทย DD/MM/YYYY (พ.ศ.)
// ====================================================================

const formatDateThai = (dateStr: string): string => {
  const parts = dateStr.split("-");
  const year = parts[0] ?? "";
  const month = parts[1] ?? "";
  const day = parts[2] ?? "";
  const thYear = parseInt(year, 10) + 543;
  return `${day}/${month}/${thYear}`;
};

// ====================================================================
// POST /api/v1/timesheet/excel/template_4/send-email
// สร้าง Excel Audit Report แล้วส่งผ่านอีเมล (ไม่ดาวน์โหลด)
// ====================================================================

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, SendEmailSchema);
  if (error) return error;

  const { start_date, end_date, recipients } = data;

  if (!start_date || !end_date) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "กรุณาระบุช่วงวันที่" }),
      { status: 400 },
    );
  }

  try {
    const excelBuffer = await TimesheetAuditReportService.generateAuditReport({
      start_date,
      end_date,
    });

    const formattedStart = formatDateThai(start_date);
    const formattedEnd = formatDateThai(end_date);
    const fileName = `รายงานการทำงานของพนักงาน วันที่ ${formattedStart} ถึง ${formattedEnd}.xlsx`;

    const subject = `[SchoolBright] Audit Report วันที่ ${formattedStart} ถึง ${formattedEnd}`;

    const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px 36px;text-align:center;">
      <div style="color:#818cf8;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">SCHOOLBRIGHT SYSTEM</div>
      <div style="color:#fff;font-size:20px;font-weight:800;">Audit Report</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:6px;">รายงานการทำงานของพนักงาน</div>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">สวัสดี,</p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        ไฟล์ Excel Audit Report ประจำช่วงวันที่ <strong style="color:#1e40af;">${formattedStart}</strong> ถึง <strong style="color:#1e40af;">${formattedEnd}</strong> ได้ถูกแนบมาพร้อมกับอีเมลนี้แล้ว
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #3b82f6;">
        <div style="font-size:13px;color:#475569;margin-bottom:4px;">ชื่อไฟล์แนบ</div>
        <div style="font-size:13px;font-weight:600;color:#1e3a5f;">${fileName}</div>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:0;">อีเมลนี้ถูกส่งโดยอัตโนมัติ — กรุณาอย่าตอบกลับ</p>
    </div>
    <div style="padding:16px 36px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} SchoolBright Co., Ltd.</p>
    </div>
  </div>
</body>
</html>`;

    // ส่งอีเมลพร้อมไฟล์แนบไปยังทุก recipients
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        await sendMailWithAttachment({
          to: recipient,
          subject,
          html,
          attachments: [
            {
              filename: fileName,
              content: new Uint8Array(excelBuffer),
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          ],
        });
        results.push({ email: recipient, success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "unknown";
        results.push({ email: recipient, success: false, error: message });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json(
      successResponse({
        data: { sent, failed, results },
        message_th: `ส่งอีเมล Audit Report สำเร็จ ${sent}/${recipients.length} รายการ`,
      }),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[template_4/send-email][POST]", err);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการสร้างหรือส่ง Audit Report",
        error: message,
      }),
      { status: 500 },
    );
  }
}
