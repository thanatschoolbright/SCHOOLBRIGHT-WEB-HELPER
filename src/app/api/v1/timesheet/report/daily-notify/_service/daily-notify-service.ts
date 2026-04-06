import { sendMail } from "@/server/mailer";
import axios from "axios";

// ====================================================================
// Types
// ====================================================================

export interface TimesheetNotifyRecord {
  admin_id: number;
  full_name: string;
  nickname: string;
  employee_code: string;
  position: string;
  department: string;
  total_hours: number;
  required_hours: number;
  hours_gap: number;
  status_label: string;
  completion_rate: number;
  progress_text: string;
}

export interface NotifyResult {
  email: { success: boolean; accepted?: string[]; error?: string };
  discord: { success: boolean; error?: string };
  summary: {
    total: number;
    completed: number;
    incomplete: number;
    date_range: string;
  };
}

// ====================================================================
// Email HTML Template — Enterprise Grade
// ====================================================================

const generateEmailStyles = (): string => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #f0f4f8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  .wrapper { background-color: #f0f4f8; padding: 40px 20px; }
  .container { max-width: 900px; margin: 0 auto; }
  /* Header */
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border-radius: 16px 16px 0 0; padding: 40px 48px; text-align: center; position: relative; overflow: hidden; }
  .header::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%); }
  .header-badge { display: inline-block; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); color: #a5b4fc; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px; }
  .header-logo { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .header-logo span { color: #818cf8; }
  .header-subtitle { color: #94a3b8; font-size: 14px; font-weight: 400; }
  /* Body */
  .body { background: #ffffff; padding: 40px 48px; }
  .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .intro { color: #64748b; font-size: 15px; line-height: 1.7; margin-bottom: 32px; }
  /* Summary Bar */
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px 24px; text-align: center; }
  .summary-card.green { background: #f0fdf4; border-color: #bbf7d0; }
  .summary-card.red { background: #fff1f2; border-color: #fecdd3; }
  .summary-card.blue { background: #eff6ff; border-color: #bfdbfe; }
  .summary-value { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 10px; }
  .summary-card.green .summary-value { color: #16a34a; }
  .summary-card.red .summary-value { color: #dc2626; }
  .summary-card.blue .summary-value { color: #2563eb; }
  .summary-label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }
  /* Section */
  .section-title { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
  .section-title::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #6366f1; border-radius: 2px; }
  /* Alert */
  .alert-incomplete { background: linear-gradient(135deg, #fef2f2, #fff1f2); border: 1px solid #fecdd3; border-left: 4px solid #ef4444; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
  .alert-title { font-size: 14px; font-weight: 700; color: #b91c1c; margin-bottom: 4px; }
  .alert-desc { font-size: 13px; color: #7f1d1d; }
  /* Table */
  .table-wrap { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: linear-gradient(135deg, #1e293b, #334155); }
  thead th { padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.8px; }
  tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 14px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
  .name-cell { font-weight: 600; color: #1e293b; }
  .name-sub { font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 2px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-ok { background: #dcfce7; color: #166534; }
  .badge-fail { background: #fee2e2; color: #991b1b; }
  .badge-ot { background: #fff7ed; color: #9a3412; }
  .progress-bar-wrap { background: #f1f5f9; border-radius: 4px; height: 6px; width: 80px; margin: 4px 0; }
  .progress-bar { height: 6px; border-radius: 4px; }
  .progress-ok { background: #22c55e; }
  .progress-fail { background: #ef4444; }
  .hours-text { font-weight: 700; font-size: 13px; }
  .gap-text { font-size: 11px; color: #ef4444; font-weight: 500; }
  /* Completed Section */
  .completed-list { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
  .completed-item { font-size: 13px; color: #166534; padding: 3px 0; }
  /* CTA */
  .cta-wrap { text-align: center; margin-bottom: 32px; }
  .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px; text-decoration: none; letter-spacing: 0.3px; }
  /* Footer */
  .footer { background: #1e293b; border-radius: 0 0 16px 16px; padding: 32px 48px; text-align: center; }
  .footer-logo { color: #94a3b8; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
  .footer-logo span { color: #6366f1; }
  .footer-text { color: #475569; font-size: 12px; line-height: 1.6; }
  .footer-divider { border: none; border-top: 1px solid #334155; margin: 16px 0; }
  .footer-copy { color: #334155; font-size: 11px; }
`;

const esc = (s: string): string =>
  String(s ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const generateTimesheetEmailHtml = (
  records: TimesheetNotifyRecord[],
  dateLabel: string,
): string => {
  const incomplete = records.filter((r) => r.hours_gap > 0);
  const completed = records.filter((r) => r.hours_gap <= 0);
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "full",
    timeStyle: "short",
  });

  const incompleteRows = incomplete
    .map((r) => {
      const rate = Math.min(r.completion_rate, 100);
      const barColor = r.total_hours > 8 ? "progress-ok" : "progress-fail";
      const badge =
        r.total_hours > 8
          ? `<span class="badge badge-ot">OT</span>`
          : `<span class="badge badge-fail">ไม่ครบ</span>`;
      return `
        <tr>
          <td>
            <div class="name-cell">${esc(r.full_name)}</div>
            <div class="name-sub">${esc(r.nickname || "-")}</div>
          </td>
          <td>
            <span style="font-family:monospace;font-size:12px;font-weight:600;color:#334155;background:#f1f5f9;padding:3px 8px;border-radius:6px;white-space:nowrap;">${esc(
              r.employee_code || "-",
            )}</span>
          </td>
          <td><span style="font-size:13px;color:#334155;">${esc(
            r.department,
          )}</span><br/><span style="font-size:11px;color:#94a3b8;">${esc(
        r.position,
      )}</span></td>
          <td>
            <span class="hours-text" style="color:${
              r.hours_gap > 0 ? "#ef4444" : "#16a34a"
            };">${r.total_hours}/${r.required_hours} ชม.</span>
            ${
              r.hours_gap > 0
                ? `<div class="gap-text">ขาด ${r.hours_gap} ชม.</div>`
                : ""
            }
            <div class="progress-bar-wrap"><div class="progress-bar ${barColor}" style="width:${rate}%"></div></div>
            <div style="font-size:10px;color:#94a3b8;">${rate}%</div>
          </td>
          <td>${badge}</td>
        </tr>`;
    })
    .join("");

  const completedItems = completed
    .map(
      (r) =>
        `<div class="completed-item">✅ ${esc(r.full_name)} (${esc(
          r.nickname || "-",
        )}) — ${r.total_hours} ชม.</div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>รายงานไทม์ชีทประจำวัน</title>
  <style>${generateEmailStyles()}</style>
</head>
<body>
<div class="wrapper">
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-badge">Daily Timesheet Report</div>
    <div class="header-logo">SchoolBright <span>Helper</span></div>
    <div class="header-subtitle">ระบบติดตามการบันทึกเวลาทำงาน · ${esc(
      dateLabel,
    )}</div>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="greeting">เรียน Project Manager &amp; Head of Technology</div>
    <p class="intro">
      นี่คือรายงานสรุปสถานะการบันทึกเวลาทำงาน (Timesheet) ประจำวันจากทีม SchoolBright
      กรุณาตรวจสอบและติดตามพนักงานที่ยังบันทึกไม่ครบถ้วน เพื่อความถูกต้องของข้อมูลโครงการ
    </p>

    <!-- Summary -->
    <div class="section-title">ภาพรวมสรุป</div>
    <div class="summary-grid">
      <div class="summary-card blue">
        <div class="summary-value">${records.length}</div>
        <div class="summary-label">พนักงานทั้งหมด</div>
      </div>
      <div class="summary-card green">
        <div class="summary-value">${completed.length}</div>
        <div class="summary-label">กรอกครบ</div>
      </div>
      <div class="summary-card red">
        <div class="summary-value">${incomplete.length}</div>
        <div class="summary-label">ยังไม่ครบ</div>
      </div>
    </div>

    ${
      incomplete.length > 0
        ? `
    <!-- Alert -->
    <div class="alert-incomplete">
      <div class="alert-title">⚠️ พบพนักงาน ${incomplete.length} คนที่ยังบันทึกเวลาไม่ครบถ้วน</div>
      <div class="alert-desc">กรุณาประสานงานให้พนักงานดังกล่าวบันทึกเวลาให้เรียบร้อยก่อนสิ้นวันทำงาน</div>
    </div>

    <!-- Incomplete Table -->
    <div class="section-title">รายชื่อผู้ที่ยังไม่บันทึกเวลาครบ</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:22%;">ชื่อ-นามสกุล</th>
            <th style="width:13%;">รหัสพนักงาน</th>
            <th style="width:25%;">แผนก / ตำแหน่ง</th>
            <th style="width:25%;">เวลาที่บันทึก</th>
            <th style="width:15%;">สถานะ</th>
          </tr>
        </thead>
        <tbody>${incompleteRows}</tbody>
      </table>
    </div>`
        : `
    <div class="alert-incomplete" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#86efac;border-left-color:#22c55e;">
      <div class="alert-title" style="color:#166534;">🎉 ทีมบันทึกเวลาครบถ้วน 100%</div>
      <div class="alert-desc" style="color:#14532d;">พนักงานทุกคนได้บันทึกเวลาทำงานครบถ้วนแล้ว ขอบคุณสำหรับความร่วมมือ</div>
    </div>`
    }

    ${
      completed.length > 0
        ? `
    <!-- Completed -->
    <div class="section-title">พนักงานที่บันทึกเวลาครบแล้ว (${completed.length} คน)</div>
    <div class="completed-list">${completedItems}</div>`
        : ""
    }

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${
        process.env.NEXT_PUBLIC_SB_HELPER_URL
      }/timesheet/all/description" class="cta-btn">
        ดูรายงานฉบับเต็ม →
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-logo">SchoolBright <span>Helper</span> System</div>
    <hr class="footer-divider"/>
    <p class="footer-text text-white">
      อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ SchoolBright Web Helper<br/>
      เวลาที่ส่ง: ${esc(now)} (เวลาประเทศไทย)
    </p>
    <hr class="footer-divider"/>
    <p class="footer-copy">© ${new Date().getFullYear()} SchoolBright Co., Ltd. · All rights reserved.</p>
  </div>

</div>
</div>
</body>
</html>`;
};

// ====================================================================
// Discord Embed Payload
// ====================================================================

export const buildDiscordPayload = (
  records: TimesheetNotifyRecord[],
  dateLabel: string,
): object => {
  const incomplete = records.filter((r) => r.hours_gap > 0);
  const completed = records.filter((r) => r.hours_gap <= 0);
  const completionPct =
    records.length > 0
      ? Math.round((completed.length / records.length) * 100)
      : 0;

  const incompleteLines = incomplete
    .slice(0, 15)
    .map(
      (r, i) =>
        `\`${String(i + 1).padStart(2, "0")}\` **${r.full_name}** (${
          r.nickname || "-"
        }) — ${r.total_hours}/${r.required_hours} ชม. _(ขาด ${
          r.hours_gap
        } ชม.)_`,
    )
    .join("\n");

  const completedLines = completed
    .slice(0, 10)
    .map((r) => `✅ ${r.full_name} (${r.nickname || "-"})`)
    .join("\n");

  const statusEmoji =
    completionPct === 100 ? "🟢" : completionPct >= 70 ? "🟡" : "🔴";
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  });

  return {
    username: "SchoolBright Timesheet Bot",
    avatar_url: "https://sb-helper.schoolbright.co/favicon.ico",
    embeds: [
      {
        title: `${statusEmoji} รายงานไทม์ชีทประจำวัน`,
        description: `**ช่วงวันที่:** ${dateLabel}\n**เวลาที่รายงาน:** ${now} (ไทย)`,
        color:
          completionPct === 100
            ? 0x22c55e
            : completionPct >= 70
            ? 0xf59e0b
            : 0xef4444,
        fields: [
          {
            name: "📊 ภาพรวม",
            value: [
              `👥 พนักงานทั้งหมด: **${records.length} คน**`,
              `✅ กรอกครบ: **${completed.length} คน**`,
              `⚠️ ยังไม่ครบ: **${incomplete.length} คน**`,
              `📈 Completion Rate: **${completionPct}%**`,
            ].join("\n"),
            inline: false,
          },
          ...(incomplete.length > 0
            ? [
                {
                  name: `⚠️ ยังไม่บันทึกครบ (${incomplete.length} คน)`,
                  value: incompleteLines || "-",
                  inline: false,
                },
              ]
            : []),
          ...(completed.length > 0
            ? [
                {
                  name: `✅ บันทึกครบแล้ว (${completed.length} คน)`,
                  value:
                    completedLines +
                    (completed.length > 10
                      ? `\n_...และอีก ${completed.length - 10} คน_`
                      : ""),
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: "SchoolBright Web Helper · Daily Timesheet Report",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

// ====================================================================
// Service Methods
// ====================================================================

export const DailyNotifyService = {
  // ส่งอีเมลแจ้งเตือนไปยัง recipients ที่กำหนด
  async sendEmail(
    records: TimesheetNotifyRecord[],
    dateLabel: string,
    recipients: string[],
  ): Promise<{
    success: boolean;
    accepted: string[] | undefined;
    error: string | undefined;
  }> {
    try {
      const html = generateTimesheetEmailHtml(records, dateLabel);
      const incomplete = records.filter((r) => r.hours_gap > 0);
      const subject =
        incomplete.length > 0
          ? `⚠️ [SchoolBright] รายงานไทม์ชีท ${dateLabel} — พบ ${incomplete.length} คนยังไม่บันทึกครบ`
          : `✅ [SchoolBright] รายงานไทม์ชีท ${dateLabel} — ครบถ้วน 100%`;

      const info = await sendMail(recipients.join(","), subject, subject, html);
      return {
        success: true,
        accepted: info.accepted as string[],
        error: undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        accepted: undefined,
        error: err?.message || "ส่งอีเมลไม่สำเร็จ",
      };
    }
  },

  // ส่ง Discord webhook notification
  async sendDiscord(
    records: TimesheetNotifyRecord[],
    dateLabel: string,
  ): Promise<{ success: boolean; error: string | undefined }> {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_TIMESHEET_SYSTEM;
    if (!webhookUrl)
      return { success: false, error: "DISCORD_WEBHOOK_URL ไม่ได้ตั้งค่า" };

    try {
      const payload = buildDiscordPayload(records, dateLabel);
      await axios.post(webhookUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
      return { success: true, error: undefined };
    } catch (err: any) {
      return { success: false, error: err?.message || "ส่ง Discord ไม่สำเร็จ" };
    }
  },
};
