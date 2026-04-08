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
// Email Template สำหรับพนักงาน — Personal reminder (Enterprise Edition)
// รองรับ Light Mode / Dark Mode ผ่าน CSS Media Query
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
  const isZero = target.total_hours === 0;
  const helperUrl =
    process.env.NEXT_PUBLIC_SB_HELPER_URL ??
    "https://sb-helper.schoolbright.co";

  const statusColor = isZero ? "#dc2626" : "#d97706";
  const statusBg = isZero ? "#fef2f2" : "#fffbeb";
  const statusBorder = isZero ? "#fecaca" : "#fde68a";
  const statusBorderLeft = isZero ? "#ef4444" : "#f59e0b";
  const statusTitleColor = isZero ? "#991b1b" : "#92400e";
  const statusDescColor = isZero ? "#7f1d1d" : "#78350f";
  const badgeText = isZero ? "NOT RECORDED" : "INCOMPLETE";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>แจ้งเตือนบันทึกเวลาทำงาน — SchoolBright</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }

    /* ── Light Mode (Default) ── */
    body {
      background:#f0f2f5;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;
      color:#1a2332;
      -webkit-text-size-adjust:100%;
    }
    .wrapper { background:#f0f2f5; padding:48px 20px; }
    .container { max-width:580px; margin:0 auto; }

    /* Header */
    .header { background:#1e2a3a; border-radius:8px 8px 0 0; padding:36px 44px; }
    .header-brand { color:#94a3b8; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:10px; }
    .header-title { color:#ffffff; font-size:21px; font-weight:700; margin-bottom:6px; }
    .header-subtitle { color:#64748b; font-size:13px; }

    /* Body card */
    .body-card { background:#ffffff; padding:40px 44px; }

    /* Badge */
    .badge {
      display:inline-block;
      font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
      padding:4px 12px; border-radius:4px; margin-bottom:28px;
      background:${statusBg}; color:${statusTitleColor}; border:1px solid ${statusBorder};
    }

    /* Greeting */
    .greeting-label { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#94a3b8; margin-bottom:8px; }
    .greeting-name { font-size:22px; font-weight:700; color:#1a2332; margin-bottom:10px; }
    .greeting-text { font-size:14px; color:#4a5568; line-height:1.75; }

    /* Divider */
    .divider { border:none; border-top:1px solid #e5e9f0; margin:32px 0; }

    /* Alert */
    .alert {
      padding:18px 20px; border-radius:6px; margin-bottom:0;
      background:${statusBg}; border:1px solid ${statusBorder}; border-left:4px solid ${statusBorderLeft};
    }
    .alert-title { font-size:14px; font-weight:700; color:${statusTitleColor}; margin-bottom:4px; }
    .alert-desc { font-size:13px; color:${statusDescColor}; line-height:1.6; }

    /* Progress */
    .progress-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .progress-label { font-size:13px; font-weight:600; color:#4a5568; }
    .progress-value { font-size:13px; font-weight:700; color:${statusColor}; }
    .progress-track { background:#e5e9f0; border-radius:4px; height:8px; overflow:hidden; }
    .progress-fill { height:8px; border-radius:4px; background:${statusColor}; width:${filledPercent}%; }
    .progress-hint { font-size:12px; color:#94a3b8; margin-top:8px; text-align:right; }

    /* Info table */
    .section-label { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#94a3b8; margin-bottom:14px; }
    .table-wrap { background:#f8fafc; border:1px solid #e5e9f0; border-radius:6px; overflow:hidden; }
    .info-table { width:100%; border-collapse:collapse; }
    .info-table tr { border-bottom:1px solid #eef1f5; }
    .info-table tr:last-child { border-bottom:none; }
    .info-table td { padding:11px 16px; font-size:13px; vertical-align:middle; }
    .info-table td.td-label { color:#6b7a8d; font-weight:500; width:42%; }
    .info-table td.td-value { color:#1a2332; font-weight:600; text-align:right; }

    /* CTA */
    .cta-wrap { text-align:center; }
    .cta-btn {
      display:inline-block;
      background:#1d4ed8; color:#ffffff !important;
      font-size:14px; font-weight:700;
      padding:14px 40px; border-radius:6px;
      text-decoration:none; letter-spacing:0.4px;
    }
    .cta-hint { font-size:12px; color:#94a3b8; margin-top:12px; }

    /* Footer */
    .footer { background:#1e2a3a; border-radius:0 0 8px 8px; padding:28px 44px; text-align:center; }
    .footer-name { color:#e2e8f0; font-size:13px; font-weight:700; letter-spacing:0.5px; margin-bottom:3px; }
    .footer-role { color:#64748b; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px; }
    .footer-divider { border:none; border-top:1px solid #2d3e52; margin:0 0 14px 0; }
    .footer-auto { color:#94a3b8; font-size:12px; margin-bottom:4px; }
    .footer-auto a { color:#818cf8; text-decoration:none; }
    .footer-copy { color:#64748b; font-size:11px; margin-top:8px; }

    /* ── Dark Mode ── */
    @media (prefers-color-scheme: dark) {
      body { background:#0d1117; color:#e6edf3; }
      .wrapper { background:#0d1117; }
      .body-card { background:#161b22; }
      .divider { border-color:#21262d; }
      .greeting-name { color:#e6edf3; }
      .greeting-text { color:#8b949e; }
      .progress-label { color:#8b949e; }
      .progress-track { background:#21262d; }
      .progress-hint { color:#484f58; }
      .table-wrap { background:#0d1117; border-color:#21262d; }
      .info-table tr { border-color:#21262d; }
      .info-table td.td-label { color:#8b949e; }
      .info-table td.td-value { color:#e6edf3; }
      .cta-hint { color:#484f58; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <div class="header-brand">SchoolBright Helper &mdash; Timesheet System</div>
      <div class="header-title">การแจ้งเตือนบันทึกเวลาทำงาน</div>
      <div class="header-subtitle">Daily Timesheet Reminder &mdash; ${dateLabel}</div>
    </div>

    <!-- BODY -->
    <div class="body-card">

      <div class="badge">${badgeText}</div>

      <!-- Greeting -->
      <div class="greeting-label">เรียน</div>
      <div class="greeting-name">${target.full_name}${
    target.nickname ? ` (${target.nickname})` : ""
  }</div>
      <div class="greeting-text">
        ระบบตรวจพบว่าท่านยัง<strong>${
          isZero ? "ไม่ได้บันทึกเวลาทำงาน" : "บันทึกเวลาทำงานไม่ครบ"
        }</strong>
        สำหรับวันที่ <strong>${dateLabel}</strong>
        กรุณาดำเนินการให้เรียบร้อยก่อนสิ้นวันทำงาน
      </div>

      <hr class="divider"/>

      <!-- Alert -->
      <div class="alert" style="margin-bottom:32px;">
        <div class="alert-title">${
          isZero
            ? "ยังไม่ได้บันทึกเวลาทำงานวันนี้"
            : `บันทึกแล้ว ${target.total_hours} ชั่วโมง จากเป้าหมาย 8 ชั่วโมง`
        }</div>
        <div class="alert-desc">${
          isZero
            ? "กรุณาเข้าระบบและบันทึกเวลาทำงานโดยเร็ว"
            : `ขาดอีก ${remaining} ชั่วโมง — กรุณาบันทึกเพิ่มก่อนสิ้นวัน`
        }</div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom:32px;">
        <div class="progress-row">
          <span class="progress-label">ความคืบหน้าวันนี้</span>
          <span class="progress-value">${
            target.total_hours
          } / 8 ชั่วโมง (${filledPercent}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-hint">ต้องการอีก ${remaining} ชั่วโมงเพื่อครบเป้าหมาย</div>
      </div>

      <hr class="divider"/>

      <!-- Info Table -->
      <div style="margin-bottom:32px;">
        <div class="section-label">ข้อมูลพนักงาน</div>
        <div class="table-wrap">
          <table class="info-table">
            <tr>
              <td class="td-label">รหัสพนักงาน</td>
              <td class="td-value">${target.employee_code ?? "-"}</td>
            </tr>
            <tr>
              <td class="td-label">แผนก</td>
              <td class="td-value">${target.department ?? "-"}</td>
            </tr>
            <tr>
              <td class="td-label">ตำแหน่ง</td>
              <td class="td-value">${target.position ?? "-"}</td>
            </tr>
            <tr>
              <td class="td-label">วันที่</td>
              <td class="td-value">${dateLabel}</td>
            </tr>
            <tr>
              <td class="td-label">สถานะ</td>
              <td class="td-value">${target.status}</td>
            </tr>
          </table>
        </div>
      </div>

      <hr class="divider"/>

      <!-- CTA -->
      <div class="cta-wrap" style="margin-bottom:8px;">
        <a href="${helperUrl}/timesheet" class="cta-btn">บันทึกเวลาทำงานเดี๋ยวนี้</a>
        <div class="cta-hint">คลิกปุ่มด้านบนเพื่อเข้าสู่ระบบ SchoolBright Helper</div>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-name">THANAT PROMPIRIYA</div>
      <div class="footer-role">Head of Technology</div>
      <hr class="footer-divider"/>
      <div class="footer-auto">
        อีเมลนี้ถูกส่งโดยอัตโนมัติ &mdash; กรุณาอย่าตอบกลับ<br/>
        หากมีปัญหาติดต่อ <a href="mailto:sa@schoolbright.co">sa@schoolbright.co</a>
      </div>
      <div class="footer-copy">&copy; ${new Date().getFullYear()} SchoolBright Co., Ltd. All rights reserved.</div>
    </div>

  </div>
</div>
</body>
</html>`;
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
