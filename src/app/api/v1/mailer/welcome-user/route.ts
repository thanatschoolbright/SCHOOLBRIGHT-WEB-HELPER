import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { sendMail } from "@/server/mailer";
import { handleError } from "@/helpers/controller/handle-error.params";
import { z } from "zod";

const welcomeUserSchema = z.object({
  to_email: z.string().email(),
  full_name: z.string().min(1),
  username: z.string().min(1),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
});

type WelcomeUserPayload = z.infer<typeof welcomeUserSchema>;

// สร้าง HTML Email สำหรับแจ้งข้อมูลการเข้าสู่ระบบให้ User ใหม่ในรูปแบบ Enterprise
const buildWelcomeEmailHtml = (payload: WelcomeUserPayload): string => {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/v2/signin`
    : "https://sb-helper.schoolbright.co/auth/v2/signin";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ยินดีต้อนรับสู่ SB Helper</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: #f0f4f8; color: #1a2332; -webkit-font-smoothing: antialiased; }

    .wrapper { max-width: 620px; margin: 40px auto; padding: 0 16px 40px; }

    /* Header */
    .header { background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%); border-radius: 16px 16px 0 0; padding: 36px 40px 32px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .header-logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-logo-text { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px; }
    .header-title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    .header-subtitle { font-size: 14px; color: rgba(255,255,255,0.8); }

    /* Body */
    .body { background: #ffffff; padding: 40px; }
    .greeting { font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 28px; }
    .greeting strong { color: #1677ff; }

    /* Info Card */
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 28px; }
    .info-card-header { background: #f1f5f9; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; }
    .info-card-header-text { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table tr { border-bottom: 1px solid #e9edf2; }
    .info-table tr:last-child { border-bottom: none; }
    .info-table td { padding: 13px 20px; font-size: 14px; vertical-align: middle; }
    .td-label { color: #64748b; font-weight: 500; width: 40%; }
    .td-value { color: #1a2332; font-weight: 600; text-align: right; }
    .td-value.highlight { color: #1677ff; }

    /* CTA Button */
    .cta-wrap { text-align: center; margin-bottom: 32px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%); color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(22,119,255,0.35); }

    /* Notice */
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
    .notice-title { font-size: 13px; font-weight: 600; color: #c2410c; margin-bottom: 4px; }
    .notice-text { font-size: 13px; color: #92400e; line-height: 1.6; }

    /* Timesheet reminder */
    .reminder { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
    .reminder-title { font-size: 13px; font-weight: 600; color: #15803d; margin-bottom: 4px; }
    .reminder-text { font-size: 13px; color: #166534; line-height: 1.6; }

    /* Footer */
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; padding: 24px 40px; text-align: center; }
    .footer-text { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer-brand { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="header-logo-text">SB Helper</span>
      </div>
      <div class="header-title">ยินดีต้อนรับสู่ระบบ</div>
      <div class="header-subtitle">SchoolBright Internal Management System</div>
    </div>

    <div class="body">
      <p class="greeting">
        สวัสดี <strong>${payload.full_name}</strong>,<br /><br />
        บัญชีของคุณได้รับการสร้างเรียบร้อยแล้ว
        ด้านล่างนี้คือข้อมูลสำหรับเข้าสู่ระบบ SB Helper กรุณาเก็บข้อมูลนี้ไว้เป็นความลับ
      </p>

      <div class="info-card">
        <div class="info-card-header">
          <span class="info-card-header-text">ข้อมูลการเข้าสู่ระบบ</span>
        </div>
        <table class="info-table">
          <tr>
            <td class="td-label">ชื่อ-นามสกุล</td>
            <td class="td-value">${payload.full_name}</td>
          </tr>
          <tr>
            <td class="td-label">ชื่อผู้ใช้ (Username)</td>
            <td class="td-value highlight">${payload.username}</td>
          </tr>
          ${payload.phone ? `<tr>
            <td class="td-label">รหัสผ่านเริ่มต้น</td>
            <td class="td-value highlight">${payload.phone}</td>
          </tr>` : ""}
          ${payload.position ? `<tr>
            <td class="td-label">ตำแหน่ง</td>
            <td class="td-value">${payload.position}</td>
          </tr>` : ""}
          ${payload.department ? `<tr>
            <td class="td-label">แผนก</td>
            <td class="td-value">${payload.department}</td>
          </tr>` : ""}
          <tr>
            <td class="td-label">URL เข้าสู่ระบบ</td>
            <td class="td-value highlight">${loginUrl}</td>
          </tr>
        </table>
      </div>

      <div class="cta-wrap">
        <a href="${loginUrl}" class="cta-btn">เข้าสู่ระบบ SB Helper</a>
      </div>

      ${payload.phone ? `<div class="notice">
        <div class="notice-title">สำคัญ: เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก</div>
        <div class="notice-text">รหัสผ่านเริ่มต้นคือเบอร์โทรศัพท์ของคุณ (<strong>${payload.phone}</strong>) กรุณาเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบครั้งแรกเพื่อความปลอดภัย</div>
      </div>` : ""}

      <div class="reminder">
        <div class="reminder-title">การลง Timesheet</div>
        <div class="reminder-text">กรุณาลงบันทึกเวลาทำงาน (Timesheet) ให้ครบทุกวันทำงาน เพื่อให้ข้อมูลชั่วโมงการทำงานถูกต้องและครบถ้วน</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">SchoolBright Co., Ltd.</div>
      <div class="footer-text">
        อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ SB Helper<br />
        กรุณาอย่าตอบกลับอีเมลฉบับนี้
      </div>
    </div>
  </div>
</body>
</html>`;
};

// ส่ง Welcome Email แจ้งข้อมูลการเข้าสู่ระบบให้ User ใหม่
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "ไม่มีสิทธิ์เข้าถึง", message_en: "Unauthorized" }),
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = welcomeUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง", message_en: "Invalid payload" }),
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const html = buildWelcomeEmailHtml(payload);
    const subject = `[SB Helper] ยินดีต้อนรับ ${payload.full_name} — ข้อมูลการเข้าสู่ระบบ`;

    await sendMail(payload.to_email, subject, subject, html);

    return NextResponse.json(
      successResponse({ data: { email: payload.to_email }, message_th: "ส่งอีเมลสำเร็จ", message_en: "Email sent" }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[WELCOME_USER_MAILER_ERROR]");
  }
}
