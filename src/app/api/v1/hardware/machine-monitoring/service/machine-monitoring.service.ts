import { sendMail } from "@/server/mailer";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// อีเมลที่รับรายงานสถานะเครื่อง POS
const REPORT_EMAILS = [
  "narin@schoolbright.co",
  "tantawan.tawan@schoolbright.co",
  "ariya.goff@schoolbright.co",
] as const;

// Discord field limit สูงสุด 1024 ตัวอักษรต่อ 1 field
const DISCORD_FIELD_CHAR_LIMIT = 1024;
// จำนวน offline เครื่องที่ถือว่าวิกฤต
const OFFLINE_CRITICAL_THRESHOLD = 5;

// ข้อมูลสถานะเครื่อง POS แต่ละเครื่อง
export interface DeviceStatusData {
  DeviceStatusID?: string | null;
  SchoolID: number;
  DeviceID: string;
  Online: boolean;
  OnlineTime?: string | Date | null;
  Login: boolean;
  LoginTime?: string | Date | null;
  LogOut: boolean;
  LogoutTime?: string | Date | null;
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

// แปลงชื่อแอปให้สั้นลงเพื่อแสดงใน Discord
function shortenAppName(appName: string): string {
  return appName
    .replace(/SchoolBright\s*/gi, "SB ")
    .replace(/Attendance\s*/gi, "Att.")
    .replace(/Facial\s*/gi, "Face ")
    .trim();
}

// เปรียบเทียบเวอร์ชันแบบตัวเลขเพื่อเรียงลำดับได้ถูกต้อง (เช่น 1.10 มากกว่า 1.2)
function compareVersionByNumber(versionA: string, versionB: string): number {
  const normalizeVersion = (version: string): number[] => {
    const matches = version.match(/\d+/g);
    if (!matches) return [0];
    return matches.map((part) => Number(part));
  };

  const numbersA = normalizeVersion(versionA);
  const numbersB = normalizeVersion(versionB);
  const maxLength = Math.max(numbersA.length, numbersB.length);

  for (let index = 0; index < maxLength; index++) {
    const valueA = numbersA[index] ?? 0;
    const valueB = numbersB[index] ?? 0;
    if (valueA !== valueB) {
      return valueB - valueA;
    }
  }

  return versionB.localeCompare(versionA);
}

// นับสถิติ online/offline/login พร้อมแยกกลุ่ม AppName+AppVersion
export function calculateDeviceStats(devices: DeviceStatusData[]): DeviceStats {
  const total = devices.length;
  const onlineDevices = devices.filter((d) => d.Online === true);
  const offlineDevices = devices.filter((d) => d.Online === false);
  const loginDevices = devices.filter((d) => d.Login === true);
  const onlineRate =
    total === 0 ? 0 : Math.round((onlineDevices.length / total) * 100);

  // จัดกลุ่มตาม AppName + AppVersion
  const groupMap = new Map<string, DeviceStatusData[]>();
  for (const device of devices) {
    const key = `${device.AppName ?? "ไม่ระบุแอป"}|||${
      device.AppVersion ?? "-"
    }`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(device);
  }

  const appGroups: AppGroupStats[] = [];
  for (const [key, groupDevices] of groupMap.entries()) {
    const parts = key.split("|||");
    const appName = parts[0] ?? "ไม่ระบุแอป";
    const appVersion = parts[1] ?? "-";
    const groupOnline = groupDevices.filter((d) => d.Online).length;
    const groupOffline = groupDevices.filter((d) => !d.Online).length;
    const groupLogin = groupDevices.filter((d) => d.Login).length;
    const groupTotal = groupDevices.length;
    appGroups.push({
      appName,
      appVersion,
      total: groupTotal,
      online: groupOnline,
      offline: groupOffline,
      login: groupLogin,
      onlineRate:
        groupTotal === 0 ? 0 : Math.round((groupOnline / groupTotal) * 100),
      offlineDevices: groupDevices.filter((d) => !d.Online),
    });
  }

  // เรียงกลุ่มตาม AppName แล้ว AppVersion
  appGroups.sort((a, b) => {
    const nameCompare = a.appName.localeCompare(b.appName);
    if (nameCompare !== 0) return nameCompare;
    return a.appVersion.localeCompare(b.appVersion);
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

// เลือกสีของ Discord embed ตามจำนวนเครื่อง offline
function resolveEmbedColor(offlineCount: number): number {
  if (offlineCount === 0) return 0x22c55e;
  if (offlineCount < OFFLINE_CRITICAL_THRESHOLD) return 0xf59e0b;
  return 0xef4444;
}

// แปลงวันที่ string หรือ Date เป็นรูปแบบ DD/MM/YYYY HH:mm น.
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

// ค้นหาชื่อโรงเรียนจาก SchoolID โดยใช้ school_map
function resolveSchoolName(
  schoolId: number,
  schoolMap: SchoolMapEntry[],
): string {
  const found = schoolMap.find((s) => s.SchoolID === schoolId);
  return found ? found.SchoolName : `โรงเรียน ID:${schoolId}`;
}

// สร้าง progress bar แบบ text สำหรับ Discord
function buildProgressBar(rate: number, length = 10): string {
  const filled = Math.round((rate / 100) * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

// สร้าง text รายละเอียดเครื่อง offline 1 เครื่องในรูปแบบ Discord quote block
function formatOfflineDeviceEntry(
  device: DeviceStatusData,
  schoolMap: SchoolMapEntry[],
): string {
  const schoolName = resolveSchoolName(device.SchoolID, schoolMap);
  const lastOnline = formatThaiDateTime(device.OnlineTime);
  const businessDate = formatBusinessDate(device.BusinessDate);
  const loginStatus = device.Login ? "🟡 ยังล็อกอินอยู่" : "⚫ ออกจากระบบแล้ว";

  return [
    `> 🏫 **${schoolName}**`,
    `> 🖥️ \`${device.DeviceID}\`  ·  ${loginStatus}`,
    `> 📡 ออฟไลน์ล่าสุด: ${lastOnline}`,
    `> 📅 วันทำรายการ: ${businessDate}`,
    ``,
  ].join("\n");
}

// แบ่ง array ของเครื่อง offline เป็น chunks ตาม Discord field char limit
function chunkOfflineDeviceFields(
  offlineDevices: DeviceStatusData[],
  schoolMap: SchoolMapEntry[],
  headerLabel: string,
): Array<{ name: string; value: string; inline: boolean }> {
  const fields: Array<{ name: string; value: string; inline: boolean }> = [];
  let currentChunk = "";
  let chunkIndex = 1;

  for (const device of offlineDevices) {
    const entry = formatOfflineDeviceEntry(device, schoolMap);

    if ((currentChunk + entry).length > DISCORD_FIELD_CHAR_LIMIT) {
      if (currentChunk.trim()) {
        fields.push({
          name:
            chunkIndex === 1
              ? headerLabel
              : `${headerLabel} (ต่อ ${chunkIndex})`,
          value: currentChunk.trim(),
          inline: false,
        });
        chunkIndex++;
      }
      currentChunk = entry;
    } else {
      currentChunk += entry;
    }
  }

  if (currentChunk.trim()) {
    fields.push({
      name:
        chunkIndex === 1 ? headerLabel : `${headerLabel} (ต่อ ${chunkIndex})`,
      value: currentChunk.trim(),
      inline: false,
    });
  }

  return fields;
}

// สร้าง Discord embed payload พร้อมแยกกลุ่มตาม AppName + AppVersion
export function buildDiscordPayload(
  stats: DeviceStats,
  schoolMap: SchoolMapEntry[],
  totalInDb?: number,
): object {
  const now = dayjs();
  const reportTime = now.format("DD/MM/YYYY HH:mm:ss") + " น.";
  const embedColor = resolveEmbedColor(stats.offline);
  const progressBar = buildProgressBar(stats.onlineRate);

  const fetchedNote =
    totalInDb !== undefined && totalInDb !== stats.total
      ? `> 📦 ดึงมา **${stats.total}** จาก DB ทั้งหมด **${totalInDb}** เครื่อง`
      : "";

  const overallStatusIcon =
    stats.offline === 0
      ? "🟢"
      : stats.offline < OFFLINE_CRITICAL_THRESHOLD
      ? "🟡"
      : "🔴";

  const vibeLabel =
    stats.offline === 0
      ? "✅ ระบบทุกอย่าง OK เลย!"
      : stats.offline < OFFLINE_CRITICAL_THRESHOLD
      ? "⚠️ มีบางเครื่องต้องดูแล"
      : "🚨 วิกฤต! หลายเครื่องออฟไลน์";

  // field ภาพรวมระบบ
  const summaryFields: Array<{ name: string; value: string; inline: boolean }> =
    [
      {
        name: `${overallStatusIcon} ภาพรวมระบบ  ·  ${vibeLabel}`,
        value: [
          "```ansi",
          `\u001b[1;37m📊 ทั้งหมด    \u001b[0m\u001b[1;36m${stats.total}\u001b[0m เครื่อง`,
          `\u001b[1;37m🟢 ออนไลน์   \u001b[0m\u001b[1;32m${stats.online}\u001b[0m เครื่อง`,
          `\u001b[1;37m🔴 ออฟไลน์   \u001b[0m\u001b[1;31m${stats.offline}\u001b[0m เครื่อง`,
          `\u001b[1;37m⚡ กำลังใช้   \u001b[0m\u001b[1;33m${stats.login}\u001b[0m เครื่อง`,
          "```",
          `📶 **อัตราออนไลน์**  ${progressBar}  **${stats.onlineRate}%**`,
          fetchedNote,
        ]
          .filter(Boolean)
          .join("\n"),
        inline: false,
      },
    ];

  // fields แยกตาม AppName + AppVersion (inline 2 คอลัมน์)
  const appGroupFields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }> = [];

  // หา version ล่าสุดของแต่ละ AppName เพื่อแสดง badge อัพเดท
  const latestVersionByApp = new Map<string, string>();
  for (const group of stats.appGroups) {
    const current = latestVersionByApp.get(group.appName);
    if (!current || compareVersionByNumber(current, group.appVersion) > 0) {
      latestVersionByApp.set(group.appName, group.appVersion);
    }
  }

  for (const group of stats.appGroups) {
    const shortName = shortenAppName(group.appName);
    const groupBar = buildProgressBar(group.onlineRate, 8);
    const statusDot =
      group.offline === 0
        ? "🟢"
        : group.offline < OFFLINE_CRITICAL_THRESHOLD
        ? "🟡"
        : "🔴";
    const latestVer = latestVersionByApp.get(group.appName) ?? group.appVersion;
    const needsUpdate = compareVersionByNumber(group.appVersion, latestVer) > 0;
    const updateTag = needsUpdate
      ? "  🔔 **ควรอัพเดท**"
      : "  ✨ **เวอร์ชันล่าสุด**";

    appGroupFields.push({
      name: `${statusDot} ${shortName}  \`v${group.appVersion}\`${updateTag}`,
      value: [
        `🖥️ ทั้งหมด **${group.total}** · 🟢 **${group.online}** · 🔴 **${group.offline}** · ⚡ **${group.login}**`,
        `${groupBar}  **${group.onlineRate}%**`,
      ].join("\n"),
      inline: true,
    });
  }

  // แทรก zero-width space เพื่อ break inline layout ทุก 2 คอลัมน์
  const appGroupFieldsWithSpacer: Array<{
    name: string;
    value: string;
    inline: boolean;
  }> = [];
  for (let i = 0; i < appGroupFields.length; i++) {
    const field = appGroupFields[i];
    if (!field) continue;
    appGroupFieldsWithSpacer.push(field);
    if ((i + 1) % 2 === 0 && i + 1 < appGroupFields.length) {
      appGroupFieldsWithSpacer.push({
        name: "\u200b",
        value: "\u200b",
        inline: false,
      });
    }
  }

  // fields รายละเอียดเครื่อง offline แยกตามกลุ่ม
  const offlineDetailFields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }> = [];

  if (stats.offline > 0) {
    offlineDetailFields.push({
      name: `🚨 เครื่องออฟไลน์ที่ต้องตรวจสอบ (${stats.offline} เครื่อง)`,
      value: `> พบ **${stats.offline}** เครื่องออฟไลน์ กรุณาตรวจสอบด่วน! 👇`,
      inline: false,
    });

    for (const group of stats.appGroups) {
      if (group.offline === 0) continue;
      const shortName = shortenAppName(group.appName);
      const label = `📱 ${shortName}  \`v${group.appVersion}\`  —  ${group.offline} เครื่องออฟไลน์`;
      const chunks = chunkOfflineDeviceFields(
        group.offlineDevices,
        schoolMap,
        label,
      );
      offlineDetailFields.push(...chunks);
    }
  } else {
    offlineDetailFields.push({
      name: "🎉 สถานะระบบ",
      value: "> ✅ ทุกเครื่องออนไลน์ครบ ไม่มีปัญหาใดๆ เลย 🔥",
      inline: false,
    });
  }

  const allFields = [
    ...summaryFields,
    ...appGroupFieldsWithSpacer,
    ...offlineDetailFields,
  ];

  const titleEmoji =
    stats.offline === 0
      ? "🟢"
      : stats.offline < OFFLINE_CRITICAL_THRESHOLD
      ? "🟡"
      : "🔴";

  return {
    content:
      stats.offline >= OFFLINE_CRITICAL_THRESHOLD
        ? "🚨 **@here** มีเครื่องออฟไลน์เกินเกณฑ์วิกฤต!"
        : undefined,
    embeds: [
      {
        title: `${titleEmoji} รายงานสถานะเครื่อง POS · SchoolBright`,
        description: `🕐 **${reportTime}**  ·  ระบบตรวจสอบอัตโนมัติ`,
        color: embedColor,
        fields: allFields,
        footer: {
          text: "SchoolBright Helper · Machine Monitoring  |  ส่งอัตโนมัติโดยระบบ",
        },
        timestamp: now.toISOString(),
      },
    ],
  };
}

// ส่ง Discord webhook notification ไปยัง channel ที่กำหนด
export async function sendDiscordWebhook(
  payload: object,
  webhookUrl: string,
): Promise<void> {
  await axios.post(webhookUrl, payload, {
    headers: { "Content-Type": "application/json" },
  });
}

// สร้าง HTML email รายงานสถานะเครื่อง POS แยกตาม AppGroup
function buildEmailHtml(
  stats: DeviceStats,
  schoolMap: SchoolMapEntry[],
  reportTime: string,
): string {
  const statusColor =
    stats.offline === 0
      ? "#16a34a"
      : stats.offline < OFFLINE_CRITICAL_THRESHOLD
      ? "#d97706"
      : "#dc2626";
  const statusLabel =
    stats.offline === 0
      ? "ปกติ"
      : stats.offline < OFFLINE_CRITICAL_THRESHOLD
      ? "ต้องระวัง"
      : "วิกฤต";

  const sortedAppGroups = [...stats.appGroups].sort((groupA, groupB) => {
    const versionCompare = compareVersionByNumber(
      groupA.appVersion,
      groupB.appVersion,
    );
    if (versionCompare !== 0) return versionCompare;
    return groupA.appName.localeCompare(groupB.appName);
  });

  // หา version ล่าสุดของแต่ละ AppName เพื่อใช้เปรียบเทียบ "แจ้งให้อัพเดท"
  const latestVersionByApp = new Map<string, string>();
  for (const group of sortedAppGroups) {
    const current = latestVersionByApp.get(group.appName);
    if (!current || compareVersionByNumber(current, group.appVersion) > 0) {
      latestVersionByApp.set(group.appName, group.appVersion);
    }
  }

  const appGroupRows = sortedAppGroups
    .map((group) => {
      const rowColor =
        group.offline === 0
          ? "#f0fdf4"
          : group.offline < OFFLINE_CRITICAL_THRESHOLD
          ? "#fffbeb"
          : "#fff1f2";
      const badgeColor =
        group.offline === 0
          ? "#16a34a"
          : group.offline < OFFLINE_CRITICAL_THRESHOLD
          ? "#d97706"
          : "#dc2626";
      const badgeText =
        group.offline === 0
          ? "ปกติ"
          : group.offline < OFFLINE_CRITICAL_THRESHOLD
          ? "ระวัง"
          : "วิกฤต";

      const latestVersion =
        latestVersionByApp.get(group.appName) ?? group.appVersion;
      const needsUpdate =
        compareVersionByNumber(group.appVersion, latestVersion) > 0;
      const updateCell = needsUpdate
        ? `<span style="border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;">✅</span>`
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
          const rowBg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
          return `
            <tr style="background:${rowBg};">
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${
                idx + 1
              }</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111827;font-weight:600;">${schoolName}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-family:monospace;">${
                device.DeviceID
              }</td>
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
      ? `
        <div style="margin-top:32px;">
          <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #fee2e2;">
            รายละเอียดเครื่องออฟไลน์ (${stats.offline} เครื่อง)
          </h2>
          ${offlineGroupsHtml}
        </div>`
      : `
        <div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
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

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">SchoolBright Helper</p>
        <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#f8fafc;">รายงานสถานะเครื่อง POS</h1>
        <p style="margin:0;font-size:13px;color:#94a3b8;">วันเวลาที่รายงาน: ${reportTime}</p>
      </td></tr>

      <!-- Status banner -->
      <tr><td style="background:${statusColor};padding:12px 40px;">
        <p style="margin:0;font-size:13px;color:#fff;font-weight:600;">สถานะระบบ: ${statusLabel} &nbsp;|&nbsp; ออนไลน์ ${stats.online} เครื่อง &nbsp;|&nbsp; ออฟไลน์ ${stats.offline} เครื่อง &nbsp;|&nbsp; อัตราออนไลน์ ${stats.onlineRate}%</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">

        <!-- Summary cards -->
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

        <!-- AppGroup breakdown table -->
        <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">
          สถิติแยกตามแอปพลิเคชัน
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:8px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:left;border-bottom:2px solid #e5e7eb;">แอปพลิเคชัน</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">เวอร์ชัน</th>
              <th style="padding:10px 14px;font-size:12px;color:#374151;text-align:center;border-bottom:2px solid #e5e7eb;">แจ้งให้อัพเดท</th>
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

      <!-- Footer -->
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
    const recipientList = REPORT_EMAILS.join(", ");
    await sendMail(recipientList, subject, "รายงานสถานะเครื่อง POS", html);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ";
    return { success: false, error: message };
  }
}
