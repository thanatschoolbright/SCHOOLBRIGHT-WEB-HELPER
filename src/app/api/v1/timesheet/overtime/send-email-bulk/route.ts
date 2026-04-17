import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@helpers/controller/handle-error.params";
import { sendMailWithAttachment } from "@/server/mailer";
import { NextRequest, NextResponse } from "next/server";

interface OtSummaryItem {
  id: number;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  request_date: string | null;
  total_hours: number;
  status: string;
}

// แปลง status เป็นภาษาไทยพร้อม badge color
const statusLabel = (status: string): { text: string; color: string; bg: string } => {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    APPROVED:  { text: "อนุมัติแล้ว",    color: "#166534", bg: "#dcfce7" },
    PENDING:   { text: "รอการอนุมัติ",   color: "#92400e", bg: "#fef3c7" },
    REJECTED:  { text: "ไม่อนุมัติ",     color: "#991b1b", bg: "#fee2e2" },
    PAID:      { text: "จ่ายแล้ว",       color: "#1e40af", bg: "#dbeafe" },
    DRAFT:     { text: "ฉบับร่าง",       color: "#374151", bg: "#f3f4f6" },
  };
  return map[status?.toUpperCase()] ?? { text: status || "-", color: "#374151", bg: "#f3f4f6" };
};

// แปลงวันที่เป็นรูปแบบ dd/mm/yyyy ภาษาไทย
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  } catch {
    return "-";
  }
};

// สร้าง HTML email แบบ Enterprise
const buildEmailHtml = (
  otSummary: OtSummaryItem[],
  zipFileName: string,
  generatedAt: string,
): string => {
  const totalHours = otSummary.reduce((s, r) => s + (r.total_hours || 0), 0);

  const tableRows = otSummary.map((row, idx) => {
    const { text, color, bg } = statusLabel(row.status);
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    return `
      <tr style="background:${rowBg};">
        <td style="padding:12px 14px;text-align:center;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">${idx + 1}</td>
        <td style="padding:12px 14px;font-family:monospace;font-size:12px;color:#1677ff;font-weight:700;border-bottom:1px solid #f1f5f9;">${row.employee_code}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:600;color:#1e293b;font-size:13px;">${row.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${row.position}</div>
        </td>
        <td style="padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">${row.department}</td>
        <td style="padding:12px 14px;text-align:center;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">${formatDate(row.request_date)}</td>
        <td style="padding:12px 14px;text-align:center;border-bottom:1px solid #f1f5f9;">
          <span style="font-weight:700;font-size:15px;color:#f97316;">${row.total_hours}</span>
          <span style="font-size:11px;color:#94a3b8;margin-left:2px;">ชม.</span>
        </td>
        <td style="padding:12px 14px;text-align:center;border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;color:${color};background:${bg};">${text}</span>
        </td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OT Report — SchoolBright Helper</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;width:100%;">

          <!-- ===== HERO HEADER ===== -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#1e293b 100%);border-radius:20px 20px 0 0;padding:44px 48px 36px;text-align:center;position:relative;overflow:hidden;">
              <!-- accent line top -->
              <div style="height:3px;background:linear-gradient(90deg,#f97316,#fb923c,#fdba74,#f97316);border-radius:2px;margin-bottom:32px;"></div>

              <!-- logo area -->
              <div style="margin-bottom:8px;">
                <span style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;padding:10px 18px;">
                  <span style="font-size:13px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">SchoolBright</span>
                </span>
              </div>

              <h1 style="margin:12px 0 4px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Overtime Report
              </h1>
              <p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:0.5px;">
                รายงานการทำงานล่วงเวลา — AI Powered
              </p>

              <!-- stat pills -->
              <div style="margin-top:28px;display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <span style="display:inline-block;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.3);border-radius:20px;padding:6px 18px;font-size:13px;font-weight:700;color:#fb923c;">
                  ${otSummary.length} รายการ
                </span>
                <span style="display:inline-block;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:20px;padding:6px 18px;font-size:13px;font-weight:700;color:#a5b4fc;">
                  รวม ${totalHours} ชั่วโมง
                </span>
                <span style="display:inline-block;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:6px 18px;font-size:13px;font-weight:700;color:#86efac;">
                  ${generatedAt}
                </span>
              </div>
            </td>
          </tr>

          <!-- ===== MAIN BODY ===== -->
          <tr>
            <td style="background:#ffffff;padding:40px 48px;">

              <!-- greeting -->
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
                สวัสดี — อีเมลนี้ส่งโดยระบบอัตโนมัติจาก <strong style="color:#f97316;">SchoolBright Helper</strong><br>
                ไฟล์ ZIP แนบท้ายอีเมลนี้บรรจุใบคำขอ OT จำนวน <strong>${otSummary.length} รายการ</strong> พร้อมเอกสารหลักฐาน<br>
                กรุณาตรวจสอบและบันทึกเข้าระบบ Payroll ต่อไป
              </p>

              <!-- zip info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:18px 22px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">ไฟล์แนบ</div>
                          <div style="font-size:15px;font-weight:700;color:#1e3a8a;font-family:monospace;">${zipFileName}</div>
                        </td>
                        <td align="right" style="white-space:nowrap;">
                          <span style="display:inline-block;background:#1d4ed8;color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;letter-spacing:0.5px;">
                            ZIP · PDF
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- section label -->
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                <div style="width:4px;height:20px;background:linear-gradient(180deg,#f97316,#ea580c);border-radius:2px;"></div>
                <span style="font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;">รายละเอียดรายการ OT</span>
              </div>

              <!-- OT table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:32px;">
                <thead>
                  <tr style="background:linear-gradient(135deg,#1e293b,#334155);">
                    <th style="padding:13px 14px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">#</th>
                    <th style="padding:13px 14px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">รหัสพนักงาน</th>
                    <th style="padding:13px 14px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">ชื่อ — ตำแหน่ง</th>
                    <th style="padding:13px 14px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">ฝ่าย/แผนก</th>
                    <th style="padding:13px 14px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">วันที่ยื่น</th>
                    <th style="padding:13px 14px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">ชั่วโมง</th>
                    <th style="padding:13px 14px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                  <!-- summary row -->
                  <tr style="background:linear-gradient(135deg,#fff7ed,#ffedd5);">
                    <td colspan="5" style="padding:14px;text-align:right;font-size:13px;font-weight:700;color:#9a3412;border-top:2px solid #fed7aa;">รวมชั่วโมงทั้งหมด</td>
                    <td style="padding:14px;text-align:center;border-top:2px solid #fed7aa;">
                      <span style="font-size:18px;font-weight:800;color:#f97316;">${totalHours}</span>
                      <span style="font-size:11px;color:#c2410c;margin-left:2px;">ชม.</span>
                    </td>
                    <td style="border-top:2px solid #fed7aa;"></td>
                  </tr>
                </tbody>
              </table>

              <!-- notice box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;">
                    <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">หมายเหตุ</div>
                    <div style="font-size:13px;color:#78350f;line-height:1.6;">
                      อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ<br>
                      หากพบปัญหาหรือข้อมูลไม่ถูกต้อง กรุณาติดต่อฝ่าย IT โดยตรง
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:0 0 20px 20px;padding:32px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- divider -->
                    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent);margin-bottom:24px;"></div>

                    <!-- signature block -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:20px;border-right:2px solid rgba(249,115,22,0.4);vertical-align:top;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:0;">
                            <span style="font-size:20px;font-weight:900;color:#fff;">T</span>
                          </div>
                        </td>
                        <td style="padding-left:20px;vertical-align:top;">
                          <div style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">THANAT PROMPIRIYA</div>
                          <div style="font-size:11px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:1.5px;margin-top:2px;">HEAD OF TECH</div>
                          <div style="font-size:11px;color:#64748b;margin-top:6px;letter-spacing:0.3px;">SCHOOLBRIGHT HELPER · AI POWERED</div>
                        </td>
                      </tr>
                    </table>

                    <div style="height:1px;background:rgba(255,255,255,0.06);margin:20px 0;"></div>

                    <!-- bottom line -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:11px;color:#475569;">
                          ส่งเมื่อ ${generatedAt} · สร้างโดยระบบอัตโนมัติ
                        </td>
                        <td align="right" style="font-size:11px;color:#334155;">
                          <span style="color:#f97316;font-weight:700;">SchoolBright</span> &copy; ${new Date().getFullYear()}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
};

// POST /api/v1/timesheet/overtime/send-email-bulk
// รับ FormData: zip (Blob), recipients (JSON string), zip_filename, ot_count, ot_summary (JSON string)
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    // อ่าน FormData
    const formData = await request.formData();
    const zipFile = formData.get("zip") as File | null;
    const recipientsRaw = formData.get("recipients") as string | null;
    const zipFileName = (formData.get("zip_filename") as string) || "SB_OT_Bulk.zip";
    const otSummaryRaw = formData.get("ot_summary") as string | null;

    if (!zipFile) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ไม่พบไฟล์ ZIP", message_en: "ZIP file is required" }),
        { status: 400 },
      );
    }

    let recipients: string[] = [];
    try {
      recipients = JSON.parse(recipientsRaw || "[]");
    } catch {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "รูปแบบรายชื่อผู้รับไม่ถูกต้อง", message_en: "Invalid recipients format" }),
        { status: 400 },
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ต้องระบุผู้รับอย่างน้อย 1 คน", message_en: "At least one recipient required" }),
        { status: 400 },
      );
    }

    let otSummary: OtSummaryItem[] = [];
    try {
      otSummary = JSON.parse(otSummaryRaw || "[]");
    } catch {
      otSummary = [];
    }

    // แปลง File เป็น Buffer
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());

    // สร้าง timestamp ภาษาไทย
    const now = new Date();
    const generatedAt = now.toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const subject = `[OT Report] ใบคำขอ OT จำนวน ${otSummary.length} รายการ — SchoolBright Helper`;
    const htmlBody = buildEmailHtml(otSummary, zipFileName, generatedAt);

    const sentResults: string[] = [];
    const failedResults: string[] = [];

    // ส่งอีเมลไปยัง recipients ทุกคน
    for (const recipient of recipients) {
      try {
        await sendMailWithAttachment({
          to: recipient,
          subject,
          html: htmlBody,
          attachments: [
            {
              filename: zipFileName,
              content: zipBuffer,
              contentType: "application/zip",
            },
          ],
        });
        sentResults.push(recipient);
      } catch (mailErr) {
        console.error(`[send-email-bulk] ส่งอีเมล ${recipient} ล้มเหลว:`, mailErr);
        failedResults.push(recipient);
      }
    }

    return NextResponse.json(
      successResponse({
        data: {
          sent: sentResults.length,
          failed: failedResults.length,
          sentTo: sentResults,
          failedTo: failedResults,
        },
        message_th: `ส่งอีเมลสำเร็จ ${sentResults.length} รายการ`,
        message_en: `Email sent to ${sentResults.length} recipients`,
      }),
      { status: 200 },
    );
  } catch (err) {
    return handleError(err, "POST /api/v1/timesheet/overtime/send-email-bulk");
  }
}
