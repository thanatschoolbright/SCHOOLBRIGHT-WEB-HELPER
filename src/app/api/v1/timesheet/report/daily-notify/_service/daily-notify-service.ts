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
  // ชั่วโมงสะสมรายสัปดาห์ (5 วันทำงาน) — optional, default 0
  weekly_hours?: number;
}

const WEEKLY_REQUIRED = 40; // 5 วันทำงาน x 8 ชม.

// คำนวณระดับพนักงานจากชั่วโมงสะสมรายสัปดาห์
function getWeeklyLevel(weeklyHours: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  lightBg: string;
  lightColor: string;
} {
  if (weeklyHours >= WEEKLY_REQUIRED)
    return { label: "ดีเยี่ยม", color: "#166534", bg: "#dcfce7", border: "#86efac", lightBg: "#f0fdf4", lightColor: "#15803d" };
  if (weeklyHours >= 32)
    return { label: "ดี", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", lightBg: "#eff6ff", lightColor: "#1e40af" };
  if (weeklyHours >= 20)
    return { label: "ปานกลาง", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", lightBg: "#fffbeb", lightColor: "#b45309" };
  return { label: "ต้องปรับปรุง", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", lightBg: "#fff1f2", lightColor: "#b91c1c" };
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
// Email HTML Template — Enterprise Grade with Light/Dark Mode Support
// ====================================================================

// สร้าง CSS styles สำหรับ email template รองรับทั้ง Light และ Dark Mode
const generateEmailStyles = (): string => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    background-color: #f0f4f8;
    color: #1e293b;
  }

  .wrapper { background-color: #f0f4f8; padding: 40px 20px; }
  .container { max-width: 920px; margin: 0 auto; }

  /* Header */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1e3a5f 100%);
    border-radius: 16px 16px 0 0;
    padding: 44px 52px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -80px; left: -80px;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%);
    pointer-events: none;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -60px; right: -60px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .header-inner { position: relative; z-index: 1; }
  .header-badge {
    display: inline-block;
    background: rgba(99,102,241,0.18);
    border: 1px solid rgba(99,102,241,0.45);
    color: #a5b4fc;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 5px 18px;
    border-radius: 20px;
    margin-bottom: 22px;
  }
  .header-logo {
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
    line-height: 1.2;
  }
  .header-logo span { color: #818cf8; }
  .header-subtitle { color: #94a3b8; font-size: 14px; font-weight: 400; margin-top: 4px; }
  .header-date {
    display: inline-block;
    margin-top: 16px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 20px;
    border-radius: 8px;
    letter-spacing: 0.3px;
  }

  /* Body */
  .body { background: #ffffff; padding: 44px 52px; }
  .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
  .intro { color: #64748b; font-size: 14px; line-height: 1.75; margin-bottom: 36px; }

  /* Summary Cards */
  .summary-grid {
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 14px 0;
    margin-bottom: 40px;
  }
  .summary-card {
    display: table-cell;
    width: 33.33%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 26px 20px;
    text-align: center;
    vertical-align: middle;
  }
  .summary-card.green { background: #f0fdf4; border-color: #bbf7d0; }
  .summary-card.red { background: #fff1f2; border-color: #fecdd3; }
  .summary-card.blue { background: #eff6ff; border-color: #bfdbfe; }
  .summary-icon { font-size: 24px; margin-bottom: 10px; line-height: 1; }
  .summary-value { font-size: 38px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 8px; }
  .summary-card.green .summary-value { color: #16a34a; }
  .summary-card.red .summary-value { color: #dc2626; }
  .summary-card.blue .summary-value { color: #2563eb; }
  .summary-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

  /* Section Title */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 16px;
    background: linear-gradient(180deg, #6366f1, #818cf8);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* Alert Banners */
  .alert-incomplete {
    background: linear-gradient(135deg, #fef2f2, #fff1f2);
    border: 1px solid #fecdd3;
    border-left: 4px solid #ef4444;
    border-radius: 10px;
    padding: 16px 22px;
    margin-bottom: 28px;
  }
  .alert-title { font-size: 14px; font-weight: 700; color: #b91c1c; margin-bottom: 4px; }
  .alert-desc { font-size: 13px; color: #7f1d1d; line-height: 1.5; }

  .alert-success {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #86efac;
    border-left: 4px solid #22c55e;
    border-radius: 10px;
    padding: 16px 22px;
    margin-bottom: 28px;
  }
  .alert-success .alert-title { color: #166534; }
  .alert-success .alert-desc { color: #14532d; }

  /* Table */
  .table-wrap {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 36px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  table { width: 100%; border-collapse: collapse; }
  thead tr {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  thead th {
    padding: 13px 14px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  thead th:first-child { text-align: center; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 13px 14px; font-size: 13px; color: #334155; vertical-align: middle; }

  /* Cell styles */
  .cell-idx {
    display: inline-flex;
    width: 28px; height: 28px;
    align-items: center; justify-content: center;
    border-radius: 50%;
    background: #1e293b;
    color: #e2e8f0;
    font-size: 11px;
    font-weight: 700;
  }
  .emp-code {
    font-family: monospace;
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    background: #f1f5f9;
    padding: 3px 9px;
    border-radius: 6px;
    white-space: nowrap;
    display: inline-block;
  }
  .name-cell { font-weight: 600; color: #1e293b; font-size: 13px; }
  .name-sub { font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 2px; }
  .dept-name { font-size: 13px; color: #334155; font-weight: 500; }
  .pos-name { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* Hours Cell */
  .hours-value { font-weight: 700; font-size: 14px; }
  .hours-ok { color: #16a34a; }
  .hours-warn { color: #ef4444; }
  .hours-caption { font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .gap-label { font-size: 11px; color: #ef4444; font-weight: 600; margin-top: 2px; }
  .progress-bar-wrap { background: #e2e8f0; border-radius: 4px; height: 5px; width: 72px; margin-top: 5px; }
  .progress-bar { height: 5px; border-radius: 4px; }
  .progress-ok { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .progress-warn { background: linear-gradient(90deg, #f97316, #fbbf24); }
  .progress-fail { background: linear-gradient(90deg, #ef4444, #f87171); }
  .pct-text { font-size: 10px; color: #94a3b8; margin-top: 3px; }

  /* Status Badge */
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  .badge-ot { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
  .badge-fail { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

  /* Completed List */
  .completed-list {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    padding: 18px 22px;
    margin-bottom: 28px;
  }
  .completed-item { font-size: 13px; color: #166534; padding: 4px 0; }
  .completed-dot {
    display: inline-block;
    width: 8px; height: 8px;
    background: #22c55e;
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: middle;
  }

  /* CTA */
  .cta-wrap { text-align: center; margin: 36px 0; }
  .cta-btn {
    display: inline-block;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    padding: 14px 40px;
    border-radius: 10px;
    text-decoration: none;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }

  /* Footer */
  .footer {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 0 0 16px 16px;
    padding: 36px 52px;
    text-align: center;
  }
  .footer-brand { color: #ffffff; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .footer-brand span { color: #818cf8; }
  .footer-tagline { color: #475569; font-size: 12px; margin-bottom: 20px; }
  .footer-divider { border: none; border-top: 1px solid #1e293b; margin: 18px 0; opacity: 0.6; }
  .footer-timestamp { color: #475569; font-size: 12px; line-height: 1.6; }

  .credits-wrap {
    margin-top: 22px;
    padding: 18px 28px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.22);
    border-radius: 12px;
    text-align: center;
  }
  .credits-system { color: #a5b4fc; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px; }
  .credits-separator { width: 40px; height: 1px; background: rgba(99,102,241,0.3); margin: 8px auto; }
  .credits-by { color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
  .credits-name { color: #818cf8; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
  .credits-title { color: #64748b; font-size: 11px; font-weight: 500; margin-top: 3px; letter-spacing: 0.3px; }
  .footer-copy { color: #334155; font-size: 11px; margin-top: 16px; }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    body { background-color: #0f172a !important; color: #e2e8f0 !important; }
    .wrapper { background-color: #0f172a !important; }
    .body { background: #1e293b !important; }
    .greeting { color: #f1f5f9 !important; }
    .intro { color: #94a3b8 !important; }
    .summary-card { background: #0f172a !important; border-color: #334155 !important; }
    .summary-card.green { background: #052e16 !important; border-color: #14532d !important; }
    .summary-card.red { background: #450a0a !important; border-color: #7f1d1d !important; }
    .summary-card.blue { background: #1e3a5f !important; border-color: #1e40af !important; }
    .summary-label { color: #94a3b8 !important; }
    .section-title { color: #94a3b8 !important; border-color: #334155 !important; }
    .table-wrap { border-color: #334155 !important; }
    tbody tr { border-color: #1e293b !important; }
    tbody tr:nth-child(even) { background: #0f172a !important; }
    tbody td { color: #cbd5e1 !important; }
    .name-cell { color: #f1f5f9 !important; }
    .emp-code { background: #334155 !important; color: #e2e8f0 !important; }
    .dept-name { color: #cbd5e1 !important; }
    .completed-list { background: #052e16 !important; border-color: #14532d !important; }
    .completed-item { color: #4ade80 !important; }
    .alert-incomplete { background: #450a0a !important; border-color: #7f1d1d !important; }
    .alert-title { color: #fca5a5 !important; }
    .alert-desc { color: #fecdd3 !important; }
    .progress-bar-wrap { background: #334155 !important; }
    .pct-text { color: #64748b !important; }
    .name-sub, .pos-name, .hours-caption { color: #64748b !important; }
  }
`;

// ฟังก์ชัน escape HTML เพื่อป้องกัน XSS
const esc = (s: string): string =>
  String(s ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// สร้าง HTML email รายงานไทม์ชีทประจำวัน
export const generateTimesheetEmailHtml = (
  records: TimesheetNotifyRecord[],
  dateLabel: string,
): string => {
  // เรียงจากชั่วโมงมากสุดไปน้อยสุด
  const sortedRecords = [...records].sort((a, b) => b.total_hours - a.total_hours);
  const incomplete = sortedRecords.filter((r) => r.hours_gap > 0);
  const completed = sortedRecords.filter((r) => r.hours_gap <= 0);
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "full",
    timeStyle: "short",
  });

  const incompleteRows = incomplete
    .map((r, idx) => {
      const todayHours = r.total_hours ?? 0;
      const requiredHours = r.required_hours ?? 8;
      const weeklyHours = r.weekly_hours ?? 0;

      const todayRate = Math.min(Math.round((todayHours / requiredHours) * 100), 100);
      const weeklyRate = Math.min(Math.round((weeklyHours / WEEKLY_REQUIRED) * 100), 100);

      const todayBarClass =
        todayHours > requiredHours ? "progress-ok" : todayHours >= requiredHours ? "progress-ok" : todayHours >= requiredHours * 0.5 ? "progress-warn" : "progress-fail";
      const weeklyBarClass =
        weeklyHours >= WEEKLY_REQUIRED ? "progress-ok" : weeklyHours >= 20 ? "progress-warn" : "progress-fail";

      const statusBadge =
        todayHours > requiredHours
          ? `<span class="badge badge-ot">OT</span>`
          : `<span class="badge badge-fail">ไม่ครบ</span>`;

      const level = getWeeklyLevel(weeklyHours);

      return `
        <tr>
          <td style="text-align:center;">
            <span class="cell-idx">${idx + 1}</span>
          </td>
          <td>
            <span class="emp-code">${esc(r.employee_code || "-")}</span>
          </td>
          <td>
            <div class="name-cell">${esc(r.full_name)}</div>
            <div class="name-sub">${esc(r.nickname || "-")}</div>
          </td>
          <td>
            <div class="dept-name">${esc(r.department)}</div>
            <div class="pos-name">${esc(r.position)}</div>
          </td>
          <td>
            <div class="hours-caption">วันนี้</div>
            <div class="hours-value ${r.hours_gap > 0 ? "hours-warn" : "hours-ok"}">${todayHours} / ${requiredHours} ชม.</div>
            ${r.hours_gap > 0 ? `<div class="gap-label">ขาด ${r.hours_gap} ชม.</div>` : ""}
            <div class="progress-bar-wrap"><div class="progress-bar ${todayBarClass}" style="width:${todayRate}%;"></div></div>
            <div class="pct-text">${todayRate}%</div>
          </td>
          <td>
            <div class="hours-caption" style="color:#6366f1;">สัปดาห์นี้</div>
            <div class="hours-value ${weeklyHours >= WEEKLY_REQUIRED ? "hours-ok" : "hours-warn"}">${weeklyHours} / ${WEEKLY_REQUIRED} ชม.</div>
            <div class="progress-bar-wrap"><div class="progress-bar ${weeklyBarClass}" style="width:${weeklyRate}%;"></div></div>
            <div class="pct-text">${weeklyRate}%</div>
          </td>
          <td>
            <div style="margin-bottom:6px;">${statusBadge}</div>
            <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${level.bg};color:${level.color};border:1px solid ${level.border};">${level.label}</span>
          </td>
        </tr>`;
    })
    .join("");

  const completedItems = completed
    .map(
      (r) =>
        `<div class="completed-item"><span class="completed-dot"></span>${esc(r.full_name)}${r.nickname ? ` (${esc(r.nickname)})` : ""} &mdash; ${r.total_hours} ชม.</div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="th" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <title>รายงานไทม์ชีทประจำวัน</title>
  <style>${generateEmailStyles()}</style>
</head>
<body>
<div class="wrapper">
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-inner">
      <div class="header-badge">Daily Timesheet Report</div>
      <div class="header-logo">SchoolBright <span>Helper</span></div>
      <div class="header-subtitle">ระบบติดตามการบันทึกเวลาทำงาน</div>
      <div class="header-date">${esc(dateLabel)}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="greeting">เรียนท่านผู้จัดการและผู้บริหาร</div>
    <p class="intro">
      นี่คือรายงานสรุปสถานะการบันทึกเวลาทำงาน (Timesheet) ประจำวันจากทีม SchoolBright
      กรุณาตรวจสอบและติดตามพนักงานที่ยังบันทึกไม่ครบถ้วนเพื่อความถูกต้องของข้อมูลโครงการ
    </p>

    <!-- Summary Cards -->
    <div class="section-title">ภาพรวมสรุป</div>
    <div class="summary-grid">
      <div class="summary-card blue">
        <div class="summary-value">${records.length}</div>
        <div class="summary-label">พนักงานทั้งหมด</div>
      </div>
      <div class="summary-card green">
        <div class="summary-value">${completed.length}</div>
        <div class="summary-label">กรอกครบแล้ว</div>
      </div>
      <div class="summary-card red">
        <div class="summary-value">${incomplete.length}</div>
        <div class="summary-label">ยังไม่ครบ</div>
      </div>
    </div>

    ${
      incomplete.length > 0
        ? `
    <!-- Alert Banner -->
    <div class="alert-incomplete">
      <div class="alert-title">พบพนักงาน ${incomplete.length} คน ที่ยังบันทึกเวลาไม่ครบถ้วน</div>
      <div class="alert-desc">กรุณาประสานงานให้พนักงานดังกล่าวบันทึกเวลาให้เรียบร้อยก่อนสิ้นวันทำงาน</div>
    </div>

    <!-- Incomplete Table -->
    <div class="section-title">รายชื่อผู้ที่ยังไม่บันทึกเวลาครบ</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:5%;text-align:center;">ลำดับ</th>
            <th style="width:12%;">รหัสพนักงาน</th>
            <th style="width:20%;">ชื่อ-นามสกุล</th>
            <th style="width:18%;">แผนก / ตำแหน่ง</th>
            <th style="width:17%;">เวลาที่บันทึก (วันนี้)</th>
            <th style="width:17%;">เวลาสะสม (สัปดาห์)</th>
            <th style="width:11%;">สถานะ</th>
          </tr>
        </thead>
        <tbody>${incompleteRows}</tbody>
      </table>
    </div>`
        : `
    <div class="alert-success">
      <div class="alert-title">ทีมบันทึกเวลาครบถ้วน 100%</div>
      <div class="alert-desc">พนักงานทุกคนได้บันทึกเวลาทำงานครบถ้วนแล้ว ขอบคุณสำหรับความร่วมมือ</div>
    </div>`
    }

    ${
      completed.length > 0
        ? `
    <!-- Completed List -->
    <div class="section-title">พนักงานที่บันทึกเวลาครบแล้ว (${completed.length} คน)</div>
    <div class="completed-list">${completedItems}</div>`
        : ""
    }

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${process.env.NEXT_PUBLIC_SB_HELPER_URL}/timesheet/all/description" class="cta-btn">
        ดูรายงานฉบับเต็ม
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">SchoolBright <span>Helper</span></div>
    <div class="footer-tagline">Enterprise Timesheet Intelligence Platform</div>
    <hr class="footer-divider"/>
    <p class="footer-timestamp">
      ส่งอัตโนมัติโดยระบบ SchoolBright Web Helper<br/>
      เวลาที่ส่ง: ${esc(now)} (เวลาประเทศไทย)
    </p>
    <div class="credits-wrap">
      <div class="credits-system">SchoolBright Helper System</div>
      <div class="credits-separator"></div>
      <div class="credits-by">Developed &amp; Maintained by</div>
      <div class="credits-name">THANAT PROMPIRIYA</div>
      <div class="credits-title">HEAD OF TECHNOLOGY &middot; SCHOOLBRIGHT CO., LTD.</div>
    </div>
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

// สร้าง payload สำหรับส่ง Discord webhook
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
    .map((r) => `- ${r.full_name} (${r.nickname || "-"})`)
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
            name: "ภาพรวม",
            value: [
              `พนักงานทั้งหมด: **${records.length} คน**`,
              `กรอกครบ: **${completed.length} คน**`,
              `ยังไม่ครบ: **${incomplete.length} คน**`,
              `Completion Rate: **${completionPct}%**`,
            ].join("\n"),
            inline: false,
          },
          ...(incomplete.length > 0
            ? [
                {
                  name: `ยังไม่บันทึกครบ (${incomplete.length} คน)`,
                  value: incompleteLines || "-",
                  inline: false,
                },
              ]
            : []),
          ...(completed.length > 0
            ? [
                {
                  name: `บันทึกครบแล้ว (${completed.length} คน)`,
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
          ? `[SchoolBright] รายงานไทม์ชีท ${dateLabel} — พบ ${incomplete.length} คนยังไม่บันทึกครบ`
          : `[SchoolBright] รายงานไทม์ชีท ${dateLabel} — ครบถ้วน 100%`;

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
