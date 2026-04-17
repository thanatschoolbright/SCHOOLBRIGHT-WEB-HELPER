import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@helpers/controller/handle-error.params";
import { sendMailWithAttachment } from "@/server/mailer";
import { NextRequest, NextResponse } from "next/server";

// สร้าง HTML body ของอีเมลสรุปรายการ OT
const buildEmailHtml = (otCount: number, zipFileName: string): string => `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0; }
    .wrapper { max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .hdr { background:linear-gradient(135deg,#1e293b,#0f172a);padding:32px 40px;text-align:center; }
    .hdr h1 { color:#fff;margin:0;font-size:22px;font-weight:800; }
    .hdr h1 span { color:#f97316; }
    .body { padding:32px 40px; }
    .info-box { background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:8px;margin-bottom:24px; }
    .info-box p { color:#166534;margin:0;font-size:14px;line-height:1.6; }
    .footer { background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9; }
    .footer p { color:#94a3b8;font-size:12px;margin:4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hdr">
      <h1>SchoolBright <span>Helper</span></h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">รายงานการทำงานล่วงเวลา (OT)</p>
    </div>
    <div class="body">
      <div class="info-box">
        <p>ไฟล์ ZIP บรรจุใบคำขอ OT จำนวน <strong>${otCount} รายการ</strong> แนบมาพร้อมอีเมลนี้</p>
        <p style="margin-top:8px">ชื่อไฟล์: <strong>${zipFileName}</strong></p>
        <p style="margin-top:8px">กรุณาดาวน์โหลดและตรวจสอบ จากนั้นบันทึกเข้าระบบ Payroll ต่อไป</p>
      </div>
    </div>
    <div class="footer">
      <p><strong style="color:#f97316">SchoolBright Developer Team</strong></p>
      <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>`;

// POST /api/v1/timesheet/overtime/send-email-bulk
// รับ FormData: zip (Blob), recipients (JSON string), zip_filename, ot_count
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
    const otCount = Number(formData.get("ot_count") || 0);

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

    // แปลง File เป็น Buffer
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());

    const subject = `ใบคำขอ OT จำนวน ${otCount} รายการ — SchoolBright Helper`;
    const htmlBody = buildEmailHtml(otCount, zipFileName);

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
