import { sendMail } from "@/server/mailer";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { ServerResultInfo } from "../../_validation/server-status-schema";

dayjs.locale("th");

// สรุปข้อมูลสำหรับ Email
interface EmailReportData {
  total: number;
  online: number;
  offline: number;
  healthScore: number;
  avgResponseTime: number;
  results: ServerResultInfo[];
  reportTime: string;
}

/**
 * Service สำหรับจัดการการส่งอีเมลรายงานสถานะ Server
 */
export async function fetchAndSendServerStatusEmail() {
  try {
    // 1. ดึงข้อมูลสถานะ Server ปัจจุบันจาก API ภายใน (ใช้ระบบเดิมที่มีอยู่)
    // หมายเหตุ: แทนที่จะเขียน Logic เช็ค Server ซ้ำ เราจะดึงจาก API หลักของโครงการ
    const response = await axios.get(
      `${
        process.env.NEXT_PUBLIC_API_URL_LOCAL || "http://localhost:3000"
      }/api/v2/server/status`,
    );

    if (response.status !== 200) {
      throw new Error("Cannot fetch server status");
    }

    const { data: results } = response.data.data;
    const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

    const stats = calculateStats(results);
    const html = buildServerStatusEmailHtml({ ...stats, results, reportTime });

    // 2. ดึงรายชื่อผู้รับจาก Env หรือใช้ค่าเริ่มต้น
    const recipients =
      process.env.SERVER_REPORT_EMAILS ||
      "narin@schoolbright.co, tantawan.tawan@schoolbright.co, ariya.goff@schoolbright.co";

    // 3. ส่งอีเมล
    await sendMail(
      recipients,
      `[Report] Server Health Status - ${reportTime} (${stats.healthScore}%)`,
      `รายงานสถานะระบบประจำวันที่ ${reportTime}`,
      html,
    );

    return {
      success: true,
      data: {
        total: stats.total,
        online: stats.online,
        offline: stats.offline,
        health_score: stats.healthScore,
        report_time: reportTime,
      },
    };
  } catch (error: any) {
    console.error("fetchAndSendServerStatusEmail Error:", error);
    return { success: false, error: error.message };
  }
}

function calculateStats(results: ServerResultInfo[]) {
  const total = results.length;
  const online = results.filter((r) => r.status === "Online").length;
  const offline = total - online;
  const healthScore = total === 0 ? 0 : Math.round((online / total) * 100);
  const avgResponseTime =
    online === 0
      ? 0
      : Number(
          (
            results.reduce(
              (sum, r) => sum + (r.status === "Online" ? r.response_time : 0),
              0,
            ) / online
          ).toFixed(3),
        );

  return { total, online, offline, healthScore, avgResponseTime };
}

function buildServerStatusEmailHtml(data: EmailReportData): string {
  const {
    total,
    online,
    offline,
    healthScore,
    avgResponseTime,
    results,
    reportTime,
  } = data;

  const statusColor =
    healthScore === 100 ? "#16a34a" : healthScore >= 70 ? "#d97706" : "#dc2626";
  const statusBg =
    healthScore === 100 ? "#f0fdf4" : healthScore >= 70 ? "#fffbeb" : "#fff1f2";
  const statusLabel =
    healthScore === 100 ? "ปกติ" : healthScore >= 70 ? "ต้องระวัง" : "วิกฤต";

  const serverRows = results
    .map((server, i) => {
      const isEven = i % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#f8fafc";
      const isOnline = server.status === "Online";
      const speedColor =
        server.response_time_severity_level === "low"
          ? "#16a34a"
          : server.response_time_severity_level === "high"
          ? "#dc2626"
          : "#64748b";

      return `
      <tr style="background:${rowBg};">
        <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#0f172a; font-weight:500;">
          ${server.server_name_th}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; color:#64748b; font-family:monospace;">
          ${server.server}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; text-align:center;">
          <span style="background:${isOnline ? "#dcfce7" : "#fee2e2"}; color:${
        isOnline ? "#16a34a" : "#dc2626"
      }; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:600;">
            ${isOnline ? "Online" : "Offline"}
          </span>
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; text-align:center; font-size:13px; color:${speedColor}; font-weight:600;">
          ${isOnline ? server.response_time + "s" : "-"}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:11px; color:#94a3b8;">
          ${server.endpoint || "/"}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&display=swap');
        body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
        .container { max-width: 800px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; color: #ffffff; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 12px; }
        .summary-grid { display: table; width: 100%; border-spacing: 12px; margin: -6px; }
        .summary-card { display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; width: 25%; }
        .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .card-value { font-size: 24px; font-weight: 600; color: #0f172a; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 4px;">System Management Report</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Server Status Monitoring</h1>
          <div class="status-badge" style="background: ${statusBg}; color: ${statusColor};">
            สถานะรวม: ${statusLabel} (${healthScore}%)
          </div>
          <div style="margin-top: 20px; font-size: 13px; opacity: 0.9;">
            ประจำวันที่ ${reportTime}
          </div>
        </div>

        <div style="padding: 32px 40px;">
          <div class="summary-grid">
            <div class="summary-card">
              <span class="card-label">ทั้งหมด</span>
              <span class="card-value">${total}</span>
            </div>
            <div class="summary-card">
              <span class="card-label">ปกติ</span>
              <span class="card-value" style="color: #16a34a;">${online}</span>
            </div>
            <div class="summary-card">
              <span class="card-label">ขัดข้อง</span>
              <span class="card-value" style="color: #dc2626;">${offline}</span>
            </div>
            <div class="summary-card">
              <span class="card-label">เฉลี่ยต่อวินาที</span>
              <span class="card-value">${avgResponseTime}s</span>
            </div>
          </div>

          <div style="margin-top: 32px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center;">
              <span style="width: 4px; height: 18px; background: #3b82f6; display: inline-block; margin-right: 8px; border-radius: 2px;"></span>
              รายละเอียดสถานะเซิร์ฟเวอร์รายระบบ
            </h3>
            <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 12px 16px; font-size: 11px; color: #64748b; font-weight: 600; text-align: left;">ชื่อระบบ</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #64748b; font-weight: 600; text-align: left;">Server ID</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #64748b; font-weight: 600; text-align: center;">สถานะ</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #64748b; font-weight: 600; text-align: center;">ความเร็ว (วินาที)</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #64748b; font-weight: 600; text-align: left;">Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  ${serverRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="footer">
          อีเมลฉบับนี้เป็นการรายงานอัตโนมัติจากระบบ SchoolBright Web Helper<br>
          สงวนลิขสิทธิ์ &copy; ${new Date().getFullYear()} SchoolBright
        </div>
      </div>
    </body>
    </html>
  `;
}
