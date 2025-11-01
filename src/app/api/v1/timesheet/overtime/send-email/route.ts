import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";
import { successResponse, errorResponse } from "@/helpers/api/response";
import Service from "@services/overtime/overtime.service";
import { handleError } from "@helpers/controller/handle-error.params";
import { sendOvertimeEmail } from "@/server/mailer";
import { API_URL } from "@services/api-url";

const SendEmailSchema = z.object({
  id: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    if (typeof v === "number") return v;
    return v;
  }, z.number().int().positive()),
  link: z.string().min(1),
  to: z.string().min(3),
});

interface OvertimeDescription {
  date?: string;
  duration?: number;
  description?: string;
  assignee?: string;
  type?: string;
}

interface OvertimeData {
  id: number;
  requesterId?: string;
  requesterName?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  requestDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  period?: string;
  reason?: string;
  descriptions?: OvertimeDescription[];
}

const getEnvVariable = (key: string, fallbackKey?: string): string => {
  return (
    process.env[key] || (fallbackKey ? process.env[fallbackKey] : "") || ""
  );
};

const sanitizeHtml = (text: string): string => {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const formatDate = (date?: string): string => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
};

/**
 * Sum durations and return a nicely formatted string:
 * - Round to 1 decimal place
 * - Remove trailing `.0` for integer totals (e.g. 8.0 -> "8")
 * - Remove accidental leading zero for two-digit formatting like "07.5" -> "7.5"
 */
const calculateTotalHours = (descriptions?: OvertimeDescription[]): string => {
  if (!Array.isArray(descriptions)) return "0";

  const total = descriptions.reduce((sum, item) => {
    // ensure numeric addition even if duration is a string
    const dur = Number(item?.duration || 0);
    return sum + (Number.isFinite(dur) ? dur : 0);
  }, 0);

  // Round to one decimal place
  const rounded = Math.round(total * 10) / 10;

  // Convert to string and clean formatting
  let out = String(rounded);

  // Drop trailing .0 for integer values (e.g. "8.0" -> "8")
  out = out.replace(/\.0$/, "");

  // Remove accidental leading zero for values like "07.5" -> "7.5"
  // But keep "0.5" as-is
  out = out.replace(/^0(?=\d)/, "");

  return out;
};

const generateEmailStyles = (): string => {
  return `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f7fa;
    }
    .email-wrapper {
      max-width: 680px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .email-logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .email-body {
      padding: 40px;
    }
    .alert-box {
      background-color: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .alert-title {
      color: #9a3412;
      font-weight: 600;
      font-size: 15px;
      margin: 0 0 8px 0;
    }
    .alert-text {
      color: #7c2d12;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
      padding: 24px;
      background-color: #fafbfc;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .info-item {
      margin: 0;
    }
    .info-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: #0f172a;
      font-size: 15px;
      font-weight: 600;
    }
    .section-title {
      color: #0f172a;
      font-size: 18px;
      font-weight: 700;
      margin: 32px 0 16px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #f97316;
    }
    .ot-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .ot-table thead {
      background: linear-gradient(180deg, #fafbfc 0%, #f5f7fa 100%);
    }
    .ot-table th {
      padding: 14px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    .ot-table td {
      padding: 14px 16px;
      font-size: 14px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
    }
    .ot-table tbody tr:last-child td {
      border-bottom: none;
    }
    .ot-table tbody tr:hover {
      background-color: #fafbfc;
    }
    .summary-box {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 2px solid #f97316;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .summary-label {
      color: #9a3412;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-value {
      color: #7c2d12;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      margin: 24px 0;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
      transition: all 0.3s ease;
    }
    .footer {
      background-color: #fafbfc;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #64748b;
      font-size: 13px;
      line-height: 1.8;
      margin: 8px 0;
    }
    .footer-brand {
      color: #f97316;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
      margin: 32px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-body { padding: 24px; }
      .info-grid { grid-template-columns: 1fr; gap: 16px; }
      .ot-table th, .ot-table td { padding: 10px 12px; font-size: 13px; }
    }
  `;
};

const generateEmailTemplate = (
  overtime: OvertimeData,
  previewUrl: string
): string => {
  const totalHours = calculateTotalHours(overtime.descriptions);
  const hasDescriptions =
    Array.isArray(overtime.descriptions) && overtime.descriptions.length > 0;

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>การอนุมัติ OT หมายเลข #${overtime.id}</title>
      <style>${generateEmailStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-header">
          <h1 class="email-logo">🎓 School Bright</h1>
        </div>

        <div class="email-body">
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
            การอนุมัติทำงานล่วงเวลา (OT)
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
            เอกสารหมายเลข #${overtime.id}
          </p>

          <div class="alert-box">
            <p class="alert-title">✅ การอนุมัติเสร็จสมบูรณ์</p>
            <p class="alert-text">
              คำขอทำงานล่วงเวลานี้ได้รับการอนุมัติเรียบร้อยแล้ว 
              กรุณาดำเนินการบันทึกข้อมูลเพื่อคำนวณเงินเดือนในระบบ Payroll
            </p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">ชื่อพนักงาน</div>
              <div class="info-value">${
                overtime.requesterName || overtime.requesterId || "-"
              }</div>
            </div>
            <div class="info-item">
              <div class="info-label">รหัสพนักงาน</div>
              <div class="info-value">${overtime.employeeCode || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ตำแหน่ง</div>
              <div class="info-value">${overtime.position || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">แผนก/ฝ่าย</div>
              <div class="info-value">${overtime.department || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">วันที่ยื่นคำขอ</div>
              <div class="info-value">${formatDate(overtime.requestDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ประจำเดือน</div>
              <div class="info-value">${overtime.period || "-"}</div>
            </div>
          </div>

          ${
            overtime.reason
              ? `
            <div style="margin: 24px 0;">
              <div class="info-label" style="margin-bottom: 8px;">เหตุผลการขอ OT</div>
              <div style="background-color: #fafbfc; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${sanitizeHtml(overtime.reason)}
                </p>
              </div>
            </div>
          `
              : ""
          }

          <h3 class="section-title">📋 รายละเอียดการทำงานล่วงเวลา</h3>

          <table class="ot-table">
            <thead>
              <tr>
                <th style="width: 8%;">ลำดับ</th>
                <th style="width: 15%;">วันที่</th>
                <th>รายละเอียดงาน</th>
                <th style="width: 12%;">ชั่วโมง</th>
                <th style="width: 15%;">ประเภท</th>
                <th style="width: 18%;">ผู้มอบหมาย</th>
              </tr>
            </thead>
            <tbody>
              ${
                hasDescriptions
                  ? overtime
                      .descriptions!.map(
                        (item, index) => `
                <tr>
                  <td style="text-align: center; font-weight: 600;">${
                    index + 1
                  }</td>
                  <td style="white-space: nowrap;">${formatDate(item.date)}</td>
                  <td>${sanitizeHtml(item.description || "-")}</td>
                  <td style="text-align: center; font-weight: 600; color: #f97316;">
                    ${item.duration || 0}
                  </td>
                  <td style="text-align: center;">
                    <span style="
                      display: inline-block;
                      padding: 4px 12px;
                      background-color: ${
                        item.type === "holiday" ? "#fef2f2" : "#eff6ff"
                      };
                      color: ${item.type === "holiday" ? "#991b1b" : "#1e40af"};
                      border-radius: 12px;
                      font-size: 12px;
                      font-weight: 600;
                    ">
                      ${item.type === "holiday" ? "🌙 วันหยุด" : "☀️ วันทำงาน"}
                    </span>
                  </td>
                  <td>${sanitizeHtml(item.assignee || "-")}</td>
                </tr>
              `
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="6" style="text-align: center; color: #94a3b8; padding: 32px;">
                    ไม่มีรายการทำงานล่วงเวลา
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-label">รวมชั่วโมงทั้งหมด</div>
            <p class="summary-value">${totalHours} ชั่วโมง</p>
          </div>

          <div class="divider"></div>

          ${
            overtime.approvedBy
              ? `
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #86efac; margin: 24px 0;">
              <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.6;">
                <strong>ผู้อนุมัติ:</strong> ${sanitizeHtml(
                  overtime.approvedBy
                )}<br>
                <strong>วันที่อนุมัติ:</strong> ${formatDate(
                  overtime.approvedDate
                )}
              </p>
            </div>
          `
              : ""
          }

          <div style="text-align: center; margin: 32px 0;">
            <a href="${previewUrl}" class="cta-button">
              📄 ดูเอกสารฉบับเต็ม
            </a>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #93c5fd;">
            <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong>💡 คำแนะนำสำหรับ HR:</strong><br>
              • ตรวจสอบข้อมูลให้ครบถ้วนก่อนบันทึกในระบบ Payroll<br>
              • อ้างอิงหมายเลขเอกสาร #${overtime.id} สำหรับการติดตาม<br>
              • หากพบข้อผิดพลาด กรุณาติดต่อผู้จัดการแผนกโดยตรง
            </p>
          </div>
        </div>

        <div class="footer">
          <p class="footer-text">
            <strong class="footer-brand">School Bright</strong> — ระบบบริหารจัดการองค์กร
          </p>
          <p class="footer-text">
            อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับที่อีเมลนี้
          </p>
          <p class="footer-text" style="color: #94a3b8; font-size: 12px;">
            หากมีข้อสงสัย กรุณาติดต่อ IT Support หรือผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePlainTextEmail = (
  overtime: OvertimeData,
  previewUrl: string
): string => {
  const totalHours = calculateTotalHours(overtime.descriptions);
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════");
  lines.push("  SCHOOL BRIGHT - การอนุมัติ OT");
  lines.push("═══════════════════════════════════════════");
  lines.push("");
  lines.push(`เอกสารหมายเลข: #${overtime.id}`);
  lines.push(`สถานะ: ✅ อนุมัติแล้ว`);
  lines.push("");
  lines.push("───────────────────────────────────────────");
  lines.push("ข้อมูลพนักงาน");
  lines.push("───────────────────────────────────────────");
  lines.push(
    `ชื่อ-สกุล: ${overtime.requesterName || overtime.requesterId || "-"}`
  );
  lines.push(`รหัสพนักงาน: ${overtime.employeeCode || "-"}`);
  lines.push(`ตำแหน่ง: ${overtime.position || "-"}`);
  lines.push(`แผนก/ฝ่าย: ${overtime.department || "-"}`);
  lines.push(`วันที่ยื่นคำขอ: ${formatDate(overtime.requestDate)}`);
  lines.push(`ประจำเดือน: ${overtime.period || "-"}`);
  lines.push("");

  if (overtime.reason) {
    lines.push("───────────────────────────────────────────");
    lines.push("เหตุผลการขอ OT");
    lines.push("───────────────────────────────────────────");
    lines.push(overtime.reason);
    lines.push("");
  }

  lines.push("───────────────────────────────────────────");
  lines.push("รายละเอียดการทำงานล่วงเวลา");
  lines.push("───────────────────────────────────────────");

  if (
    Array.isArray(overtime.descriptions) &&
    overtime.descriptions.length > 0
  ) {
    overtime.descriptions.forEach((item, index) => {
      lines.push(`${index + 1}. ${formatDate(item.date)}`);
      lines.push(`   • รายละเอียด: ${item.description || "-"}`);
      lines.push(`   • จำนวนชั่วโมง: ${item.duration || 0} ชม.`);
      lines.push(
        `   • ประเภท: ${item.type === "holiday" ? "วันหยุด" : "วันทำงาน"}`
      );
      lines.push(`   • ผู้มอบหมาย: ${item.assignee || "-"}`);
      lines.push("");
    });
  } else {
    lines.push("ไม่มีรายการทำงานล่วงเวลา");
    lines.push("");
  }

  lines.push("───────────────────────────────────────────");
  lines.push(`รวมชั่วโมงทั้งหมด: ${totalHours} ชั่วโมง`);
  lines.push("───────────────────────────────────────────");
  lines.push("");

  if (overtime.approvedBy) {
    lines.push(`ผู้อนุมัติ: ${overtime.approvedBy}`);
    lines.push(`วันที่อนุมัติ: ${formatDate(overtime.approvedDate)}`);
    lines.push("");
  }

  lines.push("ดูเอกสารฉบับเต็ม:");
  lines.push(previewUrl);
  lines.push("");
  lines.push("═══════════════════════════════════════════");
  lines.push("School Bright — ระบบบริหารจัดการองค์กร");
  lines.push("อีเมลนี้ส่งโดยระบบอัตโนมัติ");
  lines.push("═══════════════════════════════════════════");

  return lines.join("\n");
};

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, SendEmailSchema);
  if (error) return error;

  try {
    const payload = data as z.infer<typeof SendEmailSchema>;

    const overtimeResult = await Service.findById(Number(payload.id));
    const overtime = Array.isArray(overtimeResult.items)
      ? overtimeResult.items[0]
      : null;

    if (!overtime) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_th: "ไม่พบรายการ OT",
          message_en: "Overtime request not found",
        }),
        { status: 404 }
      );
    }

    const mailUser = getEnvVariable("MAILER_USER", "NEXT_PUBLIC_MAILER_USER");
    const mailPass = getEnvVariable("MAILER_PASS", "NEXT_PUBLIC_MAILER_PASS");

    if (!mailUser || !mailPass) {
      console.error("Mailer configuration missing: MAILER_USER or MAILER_PASS");
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "การตั้งค่าเมลไม่ครบถ้วน",
          message_en: "Mailer configuration missing",
        }),
        { status: 500 }
      );
    }

    const previewUrl = `${API_URL.SB_HELPER_URL}/timesheet/overtime/preview/${overtime.id}`;
    const subject = `✅ การอนุมัติ OT #${overtime.id} - ${
      overtime.requesterName || overtime.requesterId || "พนักงาน"
    }`;

    const htmlContent = generateEmailTemplate(
      overtime as OvertimeData,
      previewUrl
    );
    const textContent = generatePlainTextEmail(
      overtime as OvertimeData,
      previewUrl
    );

    try {
      const info = await sendOvertimeEmail(
        payload.to,
        subject,
        textContent,
        htmlContent
      );

      return NextResponse.json(
        successResponse({
          data: {
            notified: payload.to,
            overtimeId: overtime.id,
            previewUrl,
            info,
          },
          message_th: "ส่งอีเมลแจ้งเตือน HR เรียบร้อยแล้ว",
        }),
        { status: 200 }
      );
    } catch (mailError: unknown) {
      console.error("Error sending email:", mailError);
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ไม่สามารถส่งอีเมลได้",
          message_en: "Failed to send email",
          error: mailError,
        }),
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    return handleError(err, "POST /api/v1/timesheet/overtime/send-email");
  }
}
