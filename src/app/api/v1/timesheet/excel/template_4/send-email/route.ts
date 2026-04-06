import { errorResponse, successResponse } from "@/helpers/api/response";
import { sendMailWithAttachment } from "@/server/mailer";
import { TimesheetAuditReportService } from "@/services/backend/timesheet/audit-report.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ====================================================================
// Schema
// ====================================================================

const DateRangeSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
});

const SendEmailSchema = z.object({
  // รองรับทั้ง single range (backward compat) และ multi-range
  ranges: z
    .array(DateRangeSchema)
    .min(1, "ต้องระบุช่วงวันที่อย่างน้อย 1 รายการ"),
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
  const rawBody = await request.json().catch(() => null);
  if (!rawBody) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูล JSON ไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  // รองรับทั้ง { ranges, recipients } และ { start_date, end_date, recipients } (backward compat)
  const normalizedBody = rawBody.ranges
    ? rawBody
    : {
        ranges: [
          { start_date: rawBody.start_date, end_date: rawBody.end_date },
        ],
        recipients: rawBody.recipients,
      };

  const parsed = SendEmailSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    console.error("[send-email][validation]", parsed.error.issues);
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  const { ranges, recipients } = parsed.data;

  try {
    // สร้าง Excel buffer ทุก range พร้อมกัน (parallel)
    const attachments: {
      filename: string;
      content: Uint8Array;
      contentType: string;
    }[] = [];
    const fileLabels: string[] = [];

    for (const range of ranges) {
      const excelBuffer = await TimesheetAuditReportService.generateAuditReport(
        {
          start_date: range.start_date,
          end_date: range.end_date,
        },
      );
      const formattedStart = formatDateThai(range.start_date);
      const formattedEnd = formatDateThai(range.end_date);
      const fileName = `Audit_Report_${formattedStart}_to_${formattedEnd}.xlsx`;
      fileLabels.push(`${formattedStart} ถึง ${formattedEnd}`);
      attachments.push({
        filename: fileName,
        content: new Uint8Array(excelBuffer),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }

    // สร้าง email subject + html สรุปทุกไฟล์ในฉบับเดียว
    const subjectLabel =
      ranges.length === 1
        ? `วันที่ ${fileLabels[0]}`
        : `${ranges.length} ช่วงเวลา`;
    const subject = `[SchoolBright] Audit Report ${subjectLabel}`;

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
      <div style="color:#fff;font-size:20px;font-weight:800;">Audit Report</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:6px;">รายงานการทำงานของพนักงาน · ${
        ranges.length
      } ไฟล์แนบ</div>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">สวัสดี,</p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        ไฟล์ Excel Audit Report จำนวน <strong style="color:#1e40af;">${
          ranges.length
        } ไฟล์</strong> ได้ถูกแนบมาพร้อมกับอีเมลนี้แล้ว
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #3b82f6;">
        <div style="font-size:13px;color:#475569;margin-bottom:8px;font-weight:600;">ไฟล์ที่แนบมาด้วย (${
          ranges.length
        } ไฟล์)</div>
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

    // ส่งอีเมลเดียวพร้อมทุกไฟล์แนบไปยังทุก recipients
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        await sendMailWithAttachment({
          to: recipient,
          subject,
          html,
          attachments,
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
        data: { sent, failed, total_files: attachments.length, results },
        message_th: `ส่งอีเมล Audit Report (${attachments.length} ไฟล์) สำเร็จ ${sent}/${recipients.length} ที่อยู่`,
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
