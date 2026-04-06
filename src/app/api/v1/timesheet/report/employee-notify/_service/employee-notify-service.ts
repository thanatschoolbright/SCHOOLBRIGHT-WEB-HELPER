import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { sendMail } from "@/server/mailer";

// ====================================================================
// Types
// ====================================================================

export interface EmployeeNotifyTarget {
  admin_id: number;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string | null;
  department: string | null;
  email: string | null;
  total_hours: number;
  status: "ไม่ได้กรอกเลย" | "กรอกไม่ครบ";
}

export interface NotifyEmployeeResult {
  total_targets: number;
  sent: number;
  skipped_no_email: number;
  failed: number;
  details: { email: string; success: boolean; error?: string }[];
}

// ====================================================================
// Prisma: ดึงพนักงานที่ยังไม่กรอก/กรอกไม่ครบวันนี้
// ====================================================================

export const queryNotEntryUsersToday = async (
  departmentIds?: number[],
): Promise<EmployeeNotifyTarget[]> => {
  const thaiNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const startOfToday = new Date(thaiNow);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(thaiNow);
  endOfToday.setHours(23, 59, 59, 999);

  // ดึง entries ของวันนี้ทั้งหมด
  const entries = await PrismaTimesheet.timesheetEntry.findMany({
    where: {
      is_deleted: false,
      date: { gte: startOfToday, lte: endOfToday },
    },
    select: { createdBy: true, hours: true },
  });

  // รวมชั่วโมงต่อ user
  const hoursMap: Record<number, number> = {};
  for (const e of entries) {
    const uid = e.createdBy ?? 0;
    hoursMap[uid] = (hoursMap[uid] ?? 0) + Number(e.hours);
  }

  // ดึง users ที่ active และมีอีเมล
  const users = await PrismaTimesheet.user.findMany({
    where: {
      is_deleted: false,
      status: "ACTIVE",
      ...(departmentIds?.length
        ? { department_id: { in: departmentIds } }
        : {}),
    },
    select: {
      id: true,
      admin_id: true,
      firstname_th: true,
      lastname_th: true,
      nickname: true,
      employee_code: true,
      email: true,
      position_ref: { select: { name_th: true } },
      department: { select: { name_th: true } },
    },
  });

  const targets: EmployeeNotifyTarget[] = [];

  for (const user of users) {
    const totalHours = hoursMap[user.admin_id] ?? 0;
    if (totalHours >= 8) continue; // กรอกครบแล้ว — ข้าม

    const fullName =
      `${user.firstname_th ?? ""} ${user.lastname_th ?? ""}`.trim() ||
      "ไม่ระบุชื่อ";

    targets.push({
      admin_id: user.admin_id,
      full_name: fullName,
      nickname: user.nickname,
      employee_code: user.employee_code,
      position: user.position_ref?.name_th ?? null,
      department: user.department?.name_th ?? null,
      email: user.email,
      total_hours: totalHours,
      status: totalHours === 0 ? "ไม่ได้กรอกเลย" : "กรอกไม่ครบ",
    });
  }

  return targets;
};

// ====================================================================
// Email Template สำหรับพนักงาน — Personal reminder
// ====================================================================

export const buildEmployeeEmailHtml = (
  target: EmployeeNotifyTarget,
  dateLabel: string,
): string => {
  const remaining = Math.max(0, 8 - target.total_hours);
  const filledPercent = Math.min(
    Math.round((target.total_hours / 8) * 100),
    100,
  );
  const progressColor = target.total_hours === 0 ? "#ef4444" : "#f59e0b";
  const isZero = target.total_hours === 0;
  const helperUrl =
    process.env.NEXT_PUBLIC_SB_HELPER_URL ??
    "https://sb-helper.schoolbright.co";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>แจ้งเตือนบันทึกเวลาทำงาน</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f1f5f9; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrapper { background:#f1f5f9; padding:40px 20px; }
    .container { max-width:560px; margin:0 auto; }
    /* Header */
    .header { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%); border-radius:16px 16px 0 0; padding:36px 40px; text-align:center; }
    .header-badge { display:inline-block; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.5); color:#fca5a5; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:5px 14px; border-radius:20px; margin-bottom:16px; }
    .header-logo { color:#fff; font-size:22px; font-weight:800; margin-bottom:6px; }
    .header-logo span { color:#818cf8; }
    .header-sub { color:#94a3b8; font-size:13px; }
    /* Body */
    .body { background:#fff; padding:36px 40px; }
    .greeting { font-size:20px; font-weight:700; color:#0f172a; margin-bottom:6px; }
    .greeting-sub { color:#64748b; font-size:14px; line-height:1.6; margin-bottom:28px; }
    /* Status Card */
    .status-card { border-radius:14px; padding:24px; margin-bottom:28px; ${
      isZero
        ? "background:linear-gradient(135deg,#fef2f2,#fff1f2);border:1px solid #fecdd3;border-left:4px solid #ef4444;"
        : "background:linear-gradient(135deg,#fffbeb,#fef9c3);border:1px solid #fde68a;border-left:4px solid #f59e0b;"
    } }
    .status-icon { font-size:32px; margin-bottom:10px; }
    .status-title { font-size:16px; font-weight:700; color:${
      isZero ? "#b91c1c" : "#92400e"
    }; margin-bottom:4px; }
    .status-desc { font-size:13px; color:${isZero ? "#7f1d1d" : "#78350f"}; }
    /* Progress */
    .progress-section { margin-bottom:28px; }
    .progress-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .progress-label { font-size:13px; font-weight:600; color:#475569; }
    .progress-value { font-size:13px; font-weight:700; color:${progressColor}; }
    .progress-track { background:#f1f5f9; border-radius:8px; height:12px; overflow:hidden; }
    .progress-fill { height:12px; border-radius:8px; background:${progressColor}; width:${filledPercent}%; transition:width 0.5s; }
    .progress-hint { font-size:12px; color:#94a3b8; margin-top:6px; text-align:right; }
    /* Info grid */
    .info-grid { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:28px; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
    .info-row:last-child { border-bottom:none; padding-bottom:0; }
    .info-label { font-size:12px; color:#64748b; font-weight:500; }
    .info-value { font-size:12px; color:#1e293b; font-weight:600; }
    /* CTA */
    .cta-wrap { text-align:center; margin-bottom:28px; }
    .cta-btn { display:inline-block; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; font-size:15px; font-weight:700; padding:14px 40px; border-radius:12px; text-decoration:none; letter-spacing:0.3px; }
    .cta-hint { font-size:12px; color:#94a3b8; text-align:center; margin-top:10px; }
    /* Footer */
    .footer { background:#1e293b; border-radius:0 0 16px 16px; padding:28px 40px; text-align:center; }
    .footer-logo { color:#94a3b8; font-size:12px; font-weight:600; margin-bottom:6px; }
    .footer-logo span { color:#6366f1; }
    .footer-divider { border:none; border-top:1px solid #334155; margin:12px 0; }
    .footer-text { color:#475569; font-size:11px; line-height:1.6; }
  </style>
</head>
<body>
<div class="wrapper"><div class="container">

  <div class="header">
    <div class="header-badge">${
      isZero ? "⚠️ ยังไม่บันทึกเลย" : "⏳ บันทึกไม่ครบ"
    }</div>
    <div class="header-logo">SchoolBright <span>Helper</span></div>
    <div class="header-sub">แจ้งเตือนการบันทึกเวลาทำงานประจำวัน</div>
  </div>

  <div class="body">
    <div class="greeting">สวัสดี คุณ${target.full_name}${
    target.nickname ? ` (${target.nickname})` : ""
  }</div>
    <div class="greeting-sub">
      ระบบตรวจพบว่าท่านยัง<strong>${
        isZero ? "ไม่ได้บันทึกเวลาทำงานเลย" : "บันทึกเวลาทำงานไม่ครบ"
      }</strong>
      สำหรับวันที่ <strong>${dateLabel}</strong>
      กรุณาบันทึกให้ครบถ้วนก่อนสิ้นวันทำงาน
    </div>

    <!-- Status Card -->
    <div class="status-card">
      <div class="status-icon">${isZero ? "🚨" : "⚠️"}</div>
      <div class="status-title">${
        isZero
          ? "ยังไม่ได้บันทึกเวลาทำงานวันนี้เลย"
          : `บันทึกแล้ว ${target.total_hours} ชั่วโมง จากเป้า 8 ชั่วโมง`
      }</div>
      <div class="status-desc">${
        isZero
          ? "กรุณาเข้าระบบและบันทึกเวลาทำงานโดยเร็วที่สุด"
          : `ยังขาดอีก ${remaining} ชั่วโมง — กรุณาบันทึกเพิ่มก่อนสิ้นวัน`
      }</div>
    </div>

    <!-- Progress -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">ความคืบหน้าวันนี้</span>
        <span class="progress-value">${
          target.total_hours
        } / 8 ชั่วโมง (${filledPercent}%)</span>
      </div>
      <div class="progress-track"><div class="progress-fill"></div></div>
      <div class="progress-hint">ต้องการอีก ${remaining} ชั่วโมงเพื่อครบเป้า</div>
    </div>

    <!-- Info -->
    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">รหัสพนักงาน</span>
        <span class="info-value">${target.employee_code ?? "-"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">แผนก</span>
        <span class="info-value">${target.department ?? "-"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">ตำแหน่ง</span>
        <span class="info-value">${target.position ?? "-"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">วันที่</span>
        <span class="info-value">${dateLabel}</span>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${helperUrl}/timesheet" class="cta-btn">บันทึกเวลาทำงานเดี๋ยวนี้ →</a>
    </div>
    <p class="cta-hint">คลิกปุ่มด้านบนเพื่อเข้าสู่ระบบ SchoolBright Helper</p>
  </div>

  <div class="footer">
    <div class="footer-logo">SchoolBright <span>Helper</span> System</div>
    <hr class="footer-divider"/>
    <p class="footer-text">
      อีเมลนี้ถูกส่งโดยอัตโนมัติ — กรุณาอย่าตอบกลับ<br/>
      หากมีปัญหาติดต่อ <a href="mailto:sa@schoolbright.co" style="color:#6366f1;">sa@schoolbright.co</a>
    </p>
    <hr class="footer-divider"/>
    <p style="color:#334155;font-size:10px;">© ${new Date().getFullYear()} SchoolBright Co., Ltd.</p>
  </div>

</div></div>
</body></html>`;
};

// ====================================================================
// Service: ส่งอีเมลแจ้งเตือนพนักงานแต่ละคน
// ====================================================================

export const EmployeeNotifyService = {
  // ดึงรายชื่อพนักงานที่ยังไม่กรอก/กรอกไม่ครบวันนี้
  async queryTargets(
    departmentIds?: number[],
  ): Promise<EmployeeNotifyTarget[]> {
    return queryNotEntryUsersToday(departmentIds);
  },

  // ส่งอีเมลแจ้งเตือนไปยังพนักงานแต่ละคน
  async sendToAll(
    targets: EmployeeNotifyTarget[],
    dateLabel: string,
  ): Promise<NotifyEmployeeResult> {
    const result: NotifyEmployeeResult = {
      total_targets: targets.length,
      sent: 0,
      skipped_no_email: 0,
      failed: 0,
      details: [],
    };

    for (const target of targets) {
      if (!target.email) {
        result.skipped_no_email++;
        continue;
      }

      const subject =
        target.status === "ไม่ได้กรอกเลย"
          ? `🚨 [SchoolBright] กรุณาบันทึกเวลาทำงานวันนี้ ${dateLabel}`
          : `⏳ [SchoolBright] บันทึกเวลาทำงานยังไม่ครบ ${dateLabel}`;

      const html = buildEmployeeEmailHtml(target, dateLabel);

      try {
        await sendMail(target.email, subject, subject, html);
        result.sent++;
        result.details.push({ email: target.email, success: true });
      } catch (err: any) {
        result.failed++;
        result.details.push({
          email: target.email,
          success: false,
          error: err?.message ?? "unknown",
        });
      }
    }

    return result;
  },
};
