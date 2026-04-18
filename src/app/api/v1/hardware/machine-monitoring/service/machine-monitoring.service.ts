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

// แปลงวันที่ BusinessDate เป็นรูปแบบ DD/MM/YYYY
function formatBusinessDate(raw: string | Date): string {
  if (!raw) return "-";
  try {
    return dayjs(raw).format("DD/MM/YYYY");
  } catch {
    return String(raw);
  }
}

// ค้นหาชื่อโรงเรียนจาก SchoolID
function resolveSchoolName(schoolId: number, schoolMap: SchoolMapEntry[]): string {
  return schoolMap.find((s) => s.SchoolID === schoolId)?.SchoolName ?? `โรงเรียน ID:${schoolId}`;
}

// สร้าง HTML email รายงานสถานะเครื่อง POS แยกตาม AppGroup
function buildEmailHtml(stats: DeviceStats, schoolMap: SchoolMapEntry[], reportTime: string): string {
  const statusColor =
    stats.offline === 0 ? "#16a34a" : stats.offline < OFFLINE_CRITICAL_THRESHOLD ? "#d97706" : "#dc2626";
  const statusLabel =
    stats.offline === 0 ? "ปกติ" : stats.offline < OFFLINE_CRITICAL_THRESHOLD ? "ต้องระวัง" : "วิกฤต";

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

  const appGroupRows = sortedAppGroups
    .map((group) => {
      const rowColor =
        group.offline === 0 ? "#f0fdf4" : group.offline < OFFLINE_CRITICAL_THRESHOLD ? "#fffbeb" : "#fff1f2";
      const badgeColor =
        group.offline === 0 ? "#16a34a" : group.offline < OFFLINE_CRITICAL_THRESHOLD ? "#d97706" : "#dc2626";
      const badgeText =
        group.offline === 0 ? "ปกติ" : group.offline < OFFLINE_CRITICAL_THRESHOLD ? "ระวัง" : "วิกฤต";
      const needsUpdate = compareVersionByNumber(group.appVersion, latestVersionByApp.get(group.appName) ?? group.appVersion) > 0;
      const updateCell = needsUpdate
        ? `<span style="color:#16a34a;font-size:11px;font-weight:600;">ควรอัพเดท</span>`
        : `<span style="color:#6b7280;font-size:12px;">—</span>`;

      return `
        <tr style="background:${rowColor};">
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:600;">${group.appName}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">v${group.appVersion}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${updateCell}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#111827;">${group.total}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#16a34a;font-weight:600;">${group.online}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#dc2626;font-weight:600;">${group.offline}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">
            <span style="background:${badgeColor};color:#fff;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;">${badgeText}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#111827;">${group.onlineRate}%</td>
        </tr>`;
    })
    .join("");

  const offlineGroupsHtml = sortedAppGroups
    .filter((g) => g.offline > 0)
    .map((group) => {
      const deviceRows = group.offlineDevices
        .map((device, idx) => {
          const schoolName = resolveSchoolName(device.SchoolID, schoolMap);
          const lastOnline = formatThaiDateTime(device.OnlineTime);
          const businessDate = formatBusinessDate(device.BusinessDate);
          return `
            <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${idx + 1}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111827;font-weight:600;">${schoolName}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-family:monospace;">${device.DeviceID}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#dc2626;">${lastOnline}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${businessDate}</td>
            </tr>`;
        })
        .join("");

      return `
        <div style="margin-bottom:24px;">
          <div style="background:#1e293b;color:#f1f5f9;padding:10px 16px;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;">
            ${group.appName} &nbsp; v${group.appVersion}
            <span style="float:right;background:#ef4444;color:#fff;border-radius:999px;padding:2px 10px;font-size:11px;">${group.offline} เครื่องออฟไลน์</span>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">#</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">โรงเรียน</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">รหัสเครื่อง</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">ออฟไลน์ล่าสุด</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">วันทำรายการ</th>
              </tr>
            </thead>
            <tbody>${deviceRows}</tbody>
          </table>
        </div>`;
    })
    .join("");

  const offlineSection =
    stats.offline > 0
      ? `<div style="margin-top:32px;">
          <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #fee2e2;">
            รายละเอียดเครื่องออฟไลน์ (${stats.offline} เครื่อง)
          </h2>
          ${offlineGroupsHtml}
        </div>`
      : `<div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#15803d;font-size:14px;margin:0;font-weight:600;">ทุกเครื่องออนไลน์และพร้อมใช้งาน</p>
        </div>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>รายงานสถานะเครื่อง POS</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">SchoolBright Helper</p>
        <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#f8fafc;">รายงานสถานะเครื่อง POS</h1>
        <p style="margin:0;font-size:13px;color:#94a3b8;">วันเวลาที่รายงาน: ${reportTime}</p>
      </td></tr>
      <tr><td style="background:${statusColor};padding:12px 40px;">
        <p style="margin:0;font-size:13px;color:#fff;font-weight:600;">สถานะระบบ: ${statusLabel} &nbsp;|&nbsp; ออนไลน์ ${stats.online} เครื่อง &nbsp;|&nbsp; ออฟไลน์ ${stats.offline} เครื่อง &nbsp;|&nbsp; อัตราออนไลน์ ${stats.onlineRate}%</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td width="25%" style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:12px;">
              <p style="margin:0;font-size:28px;font-weight:600;color:#111827;">${stats.total}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">ทั้งหมด</p>
            </td>
            <td width="4%"></td>
            <td width="25%" style="text-align:center;padding:16px 8px;background:#f0fdf4;border-radius:12px;">
              <p style="margin:0;font-size:28px;font-weight:600;color:#16a34a;">${stats.online}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">ออนไลน์</p>
            </td>
            <td width="4%"></td>
            <td width="25%" style="text-align:center;padding:16px 8px;background:#fff1f2;border-radius:12px;">
              <p style="margin:0;font-size:28px;font-weight:600;color:#dc2626;">${stats.offline}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">ออฟไลน์</p>
            </td>
            <td width="4%"></td>
            <td width="25%" style="text-align:center;padding:16px 8px;background:#eff6ff;border-radius:12px;">
              <p style="margin:0;font-size:28px;font-weight:600;color:#1d4ed8;">${stats.login}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">กำลังใช้งาน</p>
            </td>
          </tr>
        </table>
        <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">สถิติแยกตามแอปพลิเคชัน</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:8px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:left;border-bottom:2px solid #e5e7eb;">แอปพลิเคชัน</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">เวอร์ชัน</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">อัพเดท</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">ทั้งหมด</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">ออนไลน์</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">ออฟไลน์</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">สถานะ</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">อัตราออนไลน์</th>
            </tr>
          </thead>
          <tbody>${appGroupRows}</tbody>
        </table>
        ${offlineSection}
      </td></tr>
      <tr><td style="padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">SchoolBright Helper &middot; Machine Monitoring System &middot; ${reportTime}</p>
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
