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

    const results = response.data.data || [];
    const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

    const stats = calculateStats(results);
    const html = buildServerStatusEmailHtml({ ...stats, results, reportTime });

    // 2. ดึงรายชื่อผู้รับจาก Env หรือใช้ค่าเริ่มต้น
    const recipients =
      process.env.SERVER_REPORT_EMAILS ||
      "narin@schoolbright.co, tantawan.tawan@schoolbright.co, ariya.goff@schoolbright.co, cs@schoolbright.co , sa@schoolbright.co, vimal@schoolbright.co";

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

function calculateStats(results: ServerResultInfo[] = []) {
  const safeResults = results || [];
  const total = safeResults.length;
  const online = safeResults.filter((r) => r.status === "Online").length;
  const offline = total - online;
  const healthScore = total === 0 ? 0 : Math.round((online / total) * 100);
  const avgResponseTime =
    online === 0
      ? 0
      : Number(
          (
            safeResults.reduce(
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
    healthScore === 100 ? "#10b981" : healthScore >= 70 ? "#f59e0b" : "#ef4444";
  const statusBg =
    healthScore === 100 ? "#ecfdf5" : healthScore >= 70 ? "#fffbeb" : "#fef2f2";
  const statusLabel =
    healthScore === 100
      ? "Excellent"
      : healthScore >= 70
      ? "Warning"
      : "Critical";

  const serverRows = results
    .map((server, i) => {
      const isEven = i % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#fbfcfd";
      const isOnline = server.status === "Online";
      const speedColor =
        server.response_time_severity_level === "low"
          ? "#10b981"
          : server.response_time_severity_level === "high"
          ? "#ef4444"
          : "#6b7280";

      return `
      <tr style="background:${rowBg};">
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:center; color:#94a3b8; font-size:12px; font-weight:600;">
          ${i + 1}
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9;">
          <div style="font-size:14px; color:#1e293b; font-weight:600;">${
            server.server_name_th
          }</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">${
            server.server_name_en || ""
          }</div>
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; font-size:12px; color:#475569; font-family:'Courier New', Courier, monospace;">
          ${server.server}
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:center;">
          <span style="display:inline-block; background:${
            isOnline ? "#dcfce7" : "#fee2e2"
          }; color:${
        isOnline ? "#15803d" : "#b91c1c"
      }; border-radius:12px; padding:4px 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.02em;">
            ${isOnline ? "● Online" : "● Offline"}
          </span>
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:center;">
          <div style="font-size:14px; color:${speedColor}; font-weight:700;">
            ${isOnline ? server.response_time + "s" : "N/A"}
          </div>
          ${
            isOnline
              ? `<div style="font-size:9px; color:#94a3b8; text-transform:uppercase;">Response</div>`
              : ""
          }
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; font-size:12px; color:#64748b;">
          <code>${server.endpoint || "/"}</code>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Sarabun:wght@400;600&display=swap');
        body { font-family: 'Plus Jakarta Sans', 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 900px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 48px 40px; color: #ffffff; position: relative; }
        .header-bg { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); z-index: 1; }
        .header-content { position: relative; z-index: 2; }
        .status-badge { display: inline-flex; align-items: center; padding: 8px 20px; border-radius: 30px; font-weight: 700; font-size: 13px; margin-top: 16px; letter-spacing: 0.02em; }
        .summary-grid { display: table; width: 100%; border-spacing: 16px; margin: 0 auto; }
        .summary-card { display: table-cell; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px; text-align: left; width: 25%; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .card-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px; font-weight: 700; }
        .card-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { background: #f8fafc; padding: 14px 12px; font-size: 11px; color: #64748b; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #475569; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-bg"></div>
          <div class="header-content">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #3b82f6; font-weight: 800; margin-bottom: 8px;">System Monitoring Service</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Server Health Status</h1>
            <div class="status-badge" style="background: ${statusBg}; color: ${statusColor};">
              <span style="font-size: 18px; margin-right: 8px;">●</span> Health Score: ${healthScore}% — ${statusLabel}
            </div>
            <div style="margin-top: 24px; font-size: 13px; color: #94a3b8; font-weight: 500;">
              Reports generated on <span style="color: #ffffff;">${reportTime}</span>
            </div>
          </div>
        </div>

        <div style="padding: 40px;">
          <div class="summary-grid">
            <div class="summary-card">
              <span class="card-label">Total Servers</span>
              <span class="card-value">${total}</span>
            </div>
            <div class="summary-card">
              <span class="card-label" style="color: #10b981;">Online</span>
              <span class="card-value" style="color: #10b981;">${online}</span>
            </div>
            <div class="summary-card" style="${
              offline > 0 ? "border-color: #fecaca; background: #fef2f2;" : ""
            }">
              <span class="card-label" style="color: #ef4444;">Offline</span>
              <span class="card-value" style="color: #ef4444;">${offline}</span>
            </div>
            <div class="summary-card">
              <span class="card-label">Avg. Latency</span>
              <span class="card-value">${avgResponseTime}s</span>
            </div>
          </div>

          <div style="margin-top: 48px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div>
              </div>
              <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em;">Detailed Infrastructure Status</h3>
            </div>

            <div style="border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              <table cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>ชื่อระบบ / System Name</th>
                    <th>Server ID</th>
                    <th style="text-align: center;">สถานะ</th>
                    <th style="text-align: center;">ความเร็ว</th>
                    <th>Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  ${serverRows}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin-top: 40px; padding: 24px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px;">
            <div style="display: flex;">
              <span style="font-size: 20px; margin-right: 12px;">💡</span>
              <div style="font-size: 13px; color: #92400e;">
                <strong>Note:</strong> รายงานนี้ถูกส่งตามรอบการตรวจสอบอัตโนมัติ หากตรวจพบสถานะ <strong>Offline</strong> โปรดตรวจสอบการเชื่อมต่อหรือบริการที่เกี่ยวข้องทันที
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px;">Managed by SchoolBright Infrastructure</div>
          อีเมลฉบับนี้เป็นการรายงานอัตโนมัติจากระบบ SchoolBright Web Helper<br>
          สงวนลิขสิทธิ์ &copy; ${new Date().getFullYear()} SchoolBright
        </div>
      </div>
    </body>
    </html>
  `;
}
