import prisma from "@helpers/prisma";
import { sendMail } from "@/server/mailer";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

// อีเมลที่รับรายงานสถานะเครื่อง POS
const REPORT_EMAILS = [
  "narin@schoolbright.co",
  "tantawan.tawan@schoolbright.co",
  "ariya.goff@schoolbright.co",
] as const;

const OFFLINE_CRITICAL_THRESHOLD = 5;

// ข้อมูลสถานะเครื่อง POS แต่ละเครื่อง
export interface DeviceStatusData {
  SchoolID: number;
  DeviceID: string;
  Online: boolean;
  OnlineTime?: string | Date | null;
  Login: boolean;
  LogOut: boolean;
  Tstamp: string | Date;
  BusinessDate: string | Date;
  AppName?: string | null;
  AppVersion?: string | null;
  Note?: string | null;
}

// mapping ระหว่าง SchoolID และชื่อโรงเรียน
export interface SchoolMapEntry {
  SchoolID: number;
  SchoolName: string;
}

// สถิติเครื่อง POS แยกตาม AppName + AppVersion
export interface AppGroupStats {
  appName: string;
  appVersion: string;
  total: number;
  online: number;
  offline: number;
  login: number;
  onlineRate: number;
  offlineDevices: DeviceStatusData[];
}

// สถิติรวมทั้งระบบ
export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  login: number;
  offlineDevices: DeviceStatusData[];
  onlineRate: number;
  appGroups: AppGroupStats[];
}

// ผลลัพธ์การส่ง email
export interface EmailResult {
  success: boolean;
  error?: string;
}

// เปรียบเทียบเวอร์ชันแบบตัวเลขเพื่อเรียงลำดับได้ถูกต้อง (เช่น 1.10 มากกว่า 1.2)
function compareVersionByNumber(versionA: string, versionB: string): number {
  const normalize = (v: string) => (v.match(/\d+/g) ?? ["0"]).map(Number);
  const a = normalize(versionA);
  const b = normalize(versionB);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return versionB.localeCompare(versionA);
}

// ดึงข้อมูลจาก DB คำนวณสถานะ heartbeat 15 นาที และแมปชื่อโรงเรียน
export async function fetchDeviceStats(): Promise<{
  stats: DeviceStats;
  schoolMap: SchoolMapEntry[];
}> {
  const now = new Date();

  const [allDevices, allSchools] = await Promise.all([
    prisma.deviceDailyStatus.findMany({
      select: {
        SchoolID: true,
        DeviceID: true,
        Online: true,
        OnlineTime: true,
        Login: true,
        LogOut: true,
        Tstamp: true,
        BusinessDate: true,
        AppName: true,
        AppVersion: true,
        Note: true,
      },
    }),
    prisma.activeSchoolList.findMany({
      select: { nCompany: true, sCompany: true },
    }),
  ]);

  const schoolMap: SchoolMapEntry[] = allSchools.map((s) => ({
    SchoolID: s.nCompany,
    SchoolName: (s.sCompany ?? `โรงเรียน ${s.nCompany}`).replace(/^โรงเรียน/, "").trim(),
  }));

  // คำนวณ online ด้วย heartbeat 15 นาที แล้วใส่กลับใน device object
  const devices: DeviceStatusData[] = allDevices.map((d) => {
    const onlineTime = d.OnlineTime ? new Date(d.OnlineTime) : null;
    const isOnline =
      d.Online === true ||
      (onlineTime ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS : false);
    return { ...d, Online: isOnline };
  });

  const stats = calculateDeviceStats(devices);
  return { stats, schoolMap };
}

// นับสถิติ online/offline/login พร้อมแยกกลุ่ม AppName+AppVersion
export function calculateDeviceStats(devices: DeviceStatusData[]): DeviceStats {
  const total = devices.length;
  const onlineDevices = devices.filter((d) => d.Online === true);
  const offlineDevices = devices.filter((d) => d.Online === false);
  const loginDevices = devices.filter((d) => d.Login === true);
  const onlineRate = total === 0 ? 0 : Math.round((onlineDevices.length / total) * 100);

  const groupMap = new Map<string, DeviceStatusData[]>();
  for (const device of devices) {
    const key = `${device.AppName ?? "ไม่ระบุแอป"}|||${device.AppVersion ?? "-"}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(device);
  }

  const appGroups: AppGroupStats[] = [];
  for (const [key, groupDevices] of groupMap.entries()) {
    const [appName, appVersion] = key.split("|||");
    const groupOnline = groupDevices.filter((d) => d.Online).length;
    const groupOffline = groupDevices.filter((d) => !d.Online).length;
    appGroups.push({
      appName: appName ?? "ไม่ระบุแอป",
      appVersion: appVersion ?? "-",
      total: groupDevices.length,
      online: groupOnline,
      offline: groupOffline,
      login: groupDevices.filter((d) => d.Login).length,
      onlineRate: groupDevices.length === 0 ? 0 : Math.round((groupOnline / groupDevices.length) * 100),
      offlineDevices: groupDevices.filter((d) => !d.Online),
    });
  }

  appGroups.sort((a, b) => {
    const name = a.appName.localeCompare(b.appName);
    return name !== 0 ? name : a.appVersion.localeCompare(b.appVersion);
  });

  return {
    total,
    online: onlineDevices.length,
    offline: offlineDevices.length,
    login: loginDevices.length,
    offlineDevices,
    onlineRate,
    appGroups,
  };
}

// แปลงวันที่เป็นรูปแบบ DD/MM/YYYY HH:mm น.
function formatThaiDateTime(raw: string | Date | null | undefined): string {
  if (!raw) return "-";
  try {
    return dayjs(raw).format("DD/MM/YYYY HH:mm") + " น.";
  } catch {
    return String(raw);
  }
}

// ค้นหาชื่อโรงเรียนจาก SchoolID
function resolveSchoolName(schoolId: number, schoolMap: SchoolMapEntry[]): string {
  return schoolMap.find((s) => s.SchoolID === schoolId)?.SchoolName ?? `ID:${schoolId}`;
}

// จัดกลุ่มเครื่องออฟไลน์ตามโรงเรียน
function groupOfflineBySchool(
  offlineDevices: DeviceStatusData[],
  schoolMap: SchoolMapEntry[],
): { schoolId: number; schoolName: string; devices: DeviceStatusData[] }[] {
  const map = new Map<number, { schoolId: number; schoolName: string; devices: DeviceStatusData[] }>();
  for (const d of offlineDevices) {
    if (!map.has(d.SchoolID)) {
      map.set(d.SchoolID, {
        schoolId: d.SchoolID,
        schoolName: resolveSchoolName(d.SchoolID, schoolMap),
        devices: [],
      });
    }
    map.get(d.SchoolID)!.devices.push(d);
  }
  return Array.from(map.values()).sort((a, b) => a.schoolId - b.schoolId);
}

// สร้าง HTML email รายงานสถานะเครื่อง POS
function buildEmailHtml(stats: DeviceStats, schoolMap: SchoolMapEntry[], reportTime: string): string {
  const statusColor =
    stats.offline === 0 ? "#16a34a" : stats.offline < OFFLINE_CRITICAL_THRESHOLD ? "#d97706" : "#dc2626";
  const statusBg =
    stats.offline === 0 ? "#f0fdf4" : stats.offline < OFFLINE_CRITICAL_THRESHOLD ? "#fffbeb" : "#fff1f2";
  const statusLabel =
    stats.offline === 0 ? "ปกติ" : stats.offline < OFFLINE_CRITICAL_THRESHOLD ? "ต้องระวัง" : "วิกฤต";

  // --- ตาราง App Summary ---
  const sortedAppGroups = [...stats.appGroups].sort((a, b) => {
    const v = compareVersionByNumber(a.appVersion, b.appVersion);
    return v !== 0 ? v : a.appName.localeCompare(b.appName);
  });

  const latestVersionByApp = new Map<string, string>();
  for (const g of sortedAppGroups) {
    const cur = latestVersionByApp.get(g.appName);
    if (!cur || compareVersionByNumber(cur, g.appVersion) > 0) {
      latestVersionByApp.set(g.appName, g.appVersion);
    }
  }

  const appGroupRows = sortedAppGroups.map((group, i) => {
    const isEven = i % 2 === 0;
    const rowBg = isEven ? "#ffffff" : "#f8fafc";
    const badgeColor =
      group.offline === 0 ? "#16a34a" : group.offline < OFFLINE_CRITICAL_THRESHOLD ? "#d97706" : "#dc2626";
    const badgeText =
      group.offline === 0 ? "ปกติ" : group.offline < OFFLINE_CRITICAL_THRESHOLD ? "ระวัง" : "วิกฤต";
    const needsUpdate =
      compareVersionByNumber(group.appVersion, latestVersionByApp.get(group.appName) ?? group.appVersion) > 0;
    const updateCell = needsUpdate
      ? `<span style="background:#dcfce7;color:#15803d;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;">อัพเดท</span>`
      : `<span style="color:#d1d5db;font-size:13px;">—</span>`;

    return `<tr style="background:${rowBg};">
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:500;">${group.appName}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#64748b;font-family:monospace;">v${group.appVersion}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;">${updateCell}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#0f172a;font-weight:600;">${group.total}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#16a34a;font-weight:600;">${group.online}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:${group.offline > 0 ? "#dc2626" : "#94a3b8"};font-weight:600;">${group.offline}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;">
        <span style="background:${badgeColor};color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;">${badgeText}</span>
      </td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#0f172a;">${group.onlineRate}%</td>
    </tr>`;
  }).join("");

  // --- Section ออฟไลน์ Group ตามโรงเรียน ---
  const schoolGroups = groupOfflineBySchool(stats.offlineDevices, schoolMap);

  const offlineSchoolBlocksHtml = schoolGroups.map((school) => {
    const deviceRows = school.devices.map((device, idx) => {
      const lastOnline = formatThaiDateTime(device.OnlineTime);
      const isEven = idx % 2 === 0;
      return `<tr style="background:${isEven ? "#ffffff" : "#fafafa"};">
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;width:36px;">${idx + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${device.AppName ?? "ไม่ระบุแอป"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;font-family:monospace;text-align:center;">v${device.AppVersion ?? "-"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;font-family:monospace;">${device.DeviceID}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${device.Note ?? "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#dc2626;text-align:center;">${lastOnline}</td>
      </tr>`;
    }).join("");

    const schoolOffline = school.devices.length;
    const schoolBadgeColor = schoolOffline >= OFFLINE_CRITICAL_THRESHOLD ? "#dc2626" : "#d97706";

    return `<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
      <div style="background:linear-gradient(90deg,#1e293b 0%,#334155 100%);padding:12px 18px;display:flex;align-items:center;">
        <span style="font-size:14px;font-weight:600;color:#f1f5f9;flex:1;">${school.schoolName}</span>
        <span style="font-size:11px;color:#94a3b8;margin-left:8px;">(${school.schoolId})</span>
        <span style="margin-left:auto;background:${schoolBadgeColor};color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;">${schoolOffline} เครื่องออฟไลน์</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:9px 14px;font-size:11px;color:#94a3b8;font-weight:600;text-align:center;width:36px;">#</th>
            <th style="padding:9px 14px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">ชื่อแอปพลิเคชัน</th>
            <th style="padding:9px 14px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">เวอร์ชัน</th>
            <th style="padding:9px 14px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">รหัสเครื่อง</th>
            <th style="padding:9px 14px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">ชื่ออุปกรณ์</th>
            <th style="padding:9px 14px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">ออฟไลน์ล่าสุด</th>
          </tr>
        </thead>
        <tbody>${deviceRows}</tbody>
      </table>
    </div>`;
  }).join("");

  const offlineSection = stats.offline > 0
    ? `<div style="margin-top:36px;">
        <div style="display:flex;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #fee2e2;">
          <div>
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">รายละเอียดเครื่องออฟไลน์</p>
            <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">${stats.offline} เครื่อง · ${schoolGroups.length} โรงเรียน</p>
          </div>
          <span style="margin-left:auto;background:#fee2e2;color:#dc2626;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;">${stats.offline} ออฟไลน์</span>
        </div>
        ${offlineSchoolBlocksHtml}
      </div>`
    : `<div style="margin-top:28px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;">
        <p style="margin:0 0 4px 0;font-size:22px;">&#10003;</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#15803d;">ทุกเครื่องออนไลน์และพร้อมใช้งาน</p>
        <p style="margin:6px 0 0 0;font-size:12px;color:#4ade80;">ไม่พบเครื่องออฟไลน์ในขณะนี้</p>
      </div>`;

  // --- Stats Bar ---
  const onlineBarWidth = stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>รายงานสถานะเครื่อง POS</title>
</head>
<body style="margin:0;padding:0;background:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans Thai',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:40px 16px;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:36px 48px 32px;">
        <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:#64748b;text-transform:uppercase;font-weight:600;">SchoolBright Helper</p>
        <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">รายงานสถานะเครื่อง POS</h1>
        <p style="margin:0;font-size:13px;color:#94a3b8;">สร้างรายงานเมื่อ: <strong style="color:#cbd5e1;">${reportTime}</strong></p>
      </td></tr>

      <!-- STATUS BAR -->
      <tr><td style="background:${statusColor};padding:14px 48px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#fff;font-weight:600;">
              สถานะระบบ: ${statusLabel}
            </td>
            <td style="text-align:right;font-size:13px;color:rgba(255,255,255,0.85);">
              ออนไลน์ ${stats.online} / ${stats.total} เครื่อง &nbsp;·&nbsp; ออฟไลน์ ${stats.offline} เครื่อง &nbsp;·&nbsp; อัตราออนไลน์ ${stats.onlineRate}%
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- CONTENT -->
      <tr><td style="background:#ffffff;padding:40px 48px;border-radius:0 0 16px 16px;">

        <!-- KPI CARDS -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
          <tr>
            <td style="width:22%;text-align:center;padding:20px 12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:32px;font-weight:700;color:#0f172a;">${stats.total}</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;font-weight:500;">ทั้งหมด</p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:22%;text-align:center;padding:20px 12px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
              <p style="margin:0;font-size:32px;font-weight:700;color:#16a34a;">${stats.online}</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#4ade80;font-weight:500;">ออนไลน์</p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:22%;text-align:center;padding:20px 12px;background:${statusBg};border-radius:12px;border:1px solid ${stats.offline > 0 ? "#fecaca" : "#e2e8f0"};">
              <p style="margin:0;font-size:32px;font-weight:700;color:${stats.offline > 0 ? statusColor : "#94a3b8"};">${stats.offline}</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:${stats.offline > 0 ? statusColor : "#94a3b8"};font-weight:500;">ออฟไลน์</p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:22%;text-align:center;padding:20px 12px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
              <p style="margin:0;font-size:32px;font-weight:700;color:#1d4ed8;">${stats.login}</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#60a5fa;font-weight:500;">กำลังใช้งาน</p>
            </td>
          </tr>
        </table>

        <!-- ONLINE RATE BAR -->
        <div style="margin-bottom:36px;background:#f8fafc;border-radius:12px;padding:18px 24px;border:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td style="font-size:13px;font-weight:600;color:#374151;">อัตราออนไลน์</td>
              <td style="text-align:right;font-size:20px;font-weight:700;color:${statusColor};">${stats.onlineRate}%</td>
            </tr>
          </table>
          <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden;">
            <div style="background:${statusColor};width:${onlineBarWidth}%;height:10px;border-radius:999px;transition:width 0.3s;"></div>
          </div>
        </div>

        <!-- APP GROUP TABLE -->
        <p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#0f172a;padding-bottom:10px;border-bottom:2px solid #e2e8f0;">สถิติแยกตามแอปพลิเคชัน</p>
        <div style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">แอปพลิเคชัน</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">เวอร์ชัน</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">อัพเดท</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">ทั้งหมด</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">ออนไลน์</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">ออฟไลน์</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">สถานะ</th>
                <th style="padding:11px 16px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">อัตราออนไลน์</th>
              </tr>
            </thead>
            <tbody>${appGroupRows}</tbody>
          </table>
        </div>

        <!-- OFFLINE SECTION (grouped by school) -->
        ${offlineSection}

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:24px 48px;text-align:center;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;font-weight:500;">SchoolBright Helper &middot; Machine Monitoring System</p>
        <p style="margin:0;font-size:11px;color:#94a3b8;">${reportTime}</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ส่ง Email รายงานสถานะเครื่อง POS ไปยังรายชื่อผู้รับที่กำหนด
export async function sendMonitoringEmail(
  stats: DeviceStats,
  schoolMap: SchoolMapEntry[],
  reportTime: string,
): Promise<EmailResult> {
  try {
    const subject = `[SchoolBright] รายงานสถานะเครื่อง POS - ออนไลน์ ${stats.online}/${stats.total} เครื่อง (${stats.onlineRate}%)`;
    const html = buildEmailHtml(stats, schoolMap, reportTime);
    await sendMail(REPORT_EMAILS.join(", "), subject, "รายงานสถานะเครื่อง POS", html);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ";
    return { success: false, error: message };
  }
}
