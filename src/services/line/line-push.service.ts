import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import prisma from "@helpers/prisma";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const LINE_API = "https://api.line.me/v2/bot/message";
const LINE_FLEX_MAX_BUBBLES = 12;

// ส่งข้อความ push ไปยัง group หรือ user ผ่าน LINE Messaging API
export async function linePushMessage(
  to: string,
  messages: object[],
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");

  try {
    await axios.post(
      `${LINE_API}/push`,
      { to, messages },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (err: any) {
    const lineError = err?.response?.data;
    throw new Error(
      lineError
        ? `LINE API error ${err.response.status}: ${JSON.stringify(lineError)}`
        : err.message,
      { cause: err },
    );
  }
}

// กำหนดสีและ label ตามจำนวนอุปกรณ์ออฟไลน์
function resolveStatusStyle(offline: number): {
  color: string;
  label: string;
  headerBg: string;
} {
  if (offline === 0)
    return { color: "#16a34a", label: "ระบบปกติ", headerBg: "#14532d" };
  if (offline < 5)
    return { color: "#d97706", label: "โปรดตรวจสอบระบบ", headerBg: "#78350f" };
  return { color: "#dc2626", label: "โปรดตรวจสอบระบบ", headerBg: "#7f1d1d" };
}

// สร้าง progress bar จากเปอร์เซ็นต์ (0–100)
function buildProgressBar(rate: number): string {
  const filled = Math.round(rate / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

// สร้าง stat row แบบ horizontal (label ซ้าย, value ขวา)
function buildStatRow(
  label: string,
  value: string,
  valueColor: string,
): object {
  return {
    type: "box",
    layout: "horizontal",
    paddingTop: "4px",
    paddingBottom: "4px",
    contents: [
      { type: "text", text: label, size: "sm", color: "#94a3b8", flex: 3 },
      {
        type: "text",
        text: value,
        size: "sm",
        color: valueColor,
        weight: "bold",
        align: "end",
        flex: 2,
      },
    ],
  };
}

// สร้าง bubble สรุปภาพรวมทั้งหมด (card แรก)
function buildSummaryBubble(stats: {
  total: number;
  online: number;
  offline: number;
  login: number;
  onlineRate: number;
  totalSchools: number;
  reportTime: string;
  hiddenGroupCount?: number;
}): object {
  const {
    total,
    online,
    offline,
    login,
    onlineRate,
    totalSchools,
    reportTime,
    hiddenGroupCount = 0,
  } = stats;
  const { color, label, headerBg } = resolveStatusStyle(offline);
  const progressBar = buildProgressBar(onlineRate);

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "SchoolBright Helper",
          size: "xxs",
          color: "#64748b",
          weight: "bold",
        },
        {
          type: "text",
          text: "รายงานสถานะเครื่อง POS",
          size: "md",
          color: "#f8fafc",
          weight: "bold",
          margin: "xs",
        },
        {
          type: "text",
          text: reportTime,
          size: "xxs",
          color: "#94a3b8",
          margin: "xs",
        },
      ],
    },
    hero: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerBg,
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `สถานะ: ${label}`,
          color: "#ffffff",
          size: "sm",
          weight: "bold",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b",
      paddingAll: "16px",
      spacing: "sm",
      contents: [
        buildStatRow("📊 ทั้งหมด", `${total} เครื่อง`, "#e2e8f0"),
        buildStatRow("🟢 ออนไลน์", `${online} เครื่อง`, "#4ade80"),
        buildStatRow(
          "🔴 ออฟไลน์",
          `${offline} เครื่อง`,
          offline > 0 ? "#f87171" : "#4ade80",
        ),
        buildStatRow("⚡ ใช้งานอยู่", `${login} เครื่อง`, "#60a5fa"),
        buildStatRow("🏫 โรงเรียน", `${totalSchools} แห่ง`, "#c084fc"),
        { type: "separator", margin: "sm", color: "#334155" },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "อัตราออนไลน์",
                  size: "xs",
                  color: "#94a3b8",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${onlineRate}%`,
                  size: "xs",
                  color,
                  weight: "bold",
                  align: "end",
                  flex: 2,
                },
              ],
            },
            {
              type: "text",
              text: progressBar,
              size: "xs",
              color,
              margin: "xs",
            },
          ],
        },
        ...(hiddenGroupCount > 0
          ? [
              { type: "separator", margin: "sm", color: "#334155" },
              {
                type: "text",
                text: `หมายเหตุ: มีอีก ${hiddenGroupCount} กลุ่มแอปที่ไม่ได้แสดงในรายงานนี้`,
                size: "xxs",
                color: "#94a3b8",
                wrap: true,
                margin: "sm",
              },
            ]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "8px",
      contents: [
        {
          type: "text",
          text: "Auto Report · SchoolBright",
          size: "xxs",
          color: "#475569",
          align: "center",
        },
      ],
    },
  };
}

// สร้าง bubble สำหรับแต่ละ AppGroup (card ที่ 2 เป็นต้นไป)
function buildAppGroupBubble(group: {
  appName: string;
  appVersion: string;
  online: number;
  offline: number;
  login: number;
  total: number;
  onlineRate: number;
}): object {
  const { appName, appVersion, online, offline, login, total, onlineRate } =
    group;
  const { color, label, headerBg } = resolveStatusStyle(offline);
  const progressBar = buildProgressBar(onlineRate);

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "14px",
      contents: [
        {
          type: "text",
          text: appName,
          size: "sm",
          color: "#f8fafc",
          weight: "bold",
          wrap: true,
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "xs",
          contents: [
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#1e40af",
              cornerRadius: "4px",
              paddingTop: "2px",
              paddingBottom: "2px",
              paddingStart: "6px",
              paddingEnd: "6px",
              contents: [
                {
                  type: "text",
                  text: `v${appVersion}`,
                  size: "xxs",
                  color: "#bfdbfe",
                  weight: "bold",
                },
              ],
            },
          ],
        },
      ],
    },
    hero: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerBg,
      paddingAll: "8px",
      contents: [
        {
          type: "text",
          text: label,
          color: "#ffffff",
          size: "xs",
          weight: "bold",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b",
      paddingAll: "14px",
      spacing: "sm",
      contents: [
        buildStatRow("📊 ทั้งหมด", `${total} เครื่อง`, "#e2e8f0"),
        buildStatRow("🟢 ออนไลน์", `${online} เครื่อง`, "#4ade80"),
        buildStatRow(
          "🔴 ออฟไลน์",
          `${offline} เครื่อง`,
          offline > 0 ? "#f87171" : "#4ade80",
        ),
        buildStatRow("⚡ ใช้งานอยู่", `${login} เครื่อง`, "#60a5fa"),
        { type: "separator", margin: "sm", color: "#334155" },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "อัตราออนไลน์",
                  size: "xs",
                  color: "#94a3b8",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${onlineRate}%`,
                  size: "xs",
                  color,
                  weight: "bold",
                  align: "end",
                  flex: 2,
                },
              ],
            },
            {
              type: "text",
              text: progressBar,
              size: "xs",
              color,
              margin: "xs",
            },
          ],
        },
      ],
    },
  };
}

const LINE_TEXT_MAX = 5000;
// LINE อนุญาตสูงสุด 5 messages ต่อ 1 push call — flex ใช้ 1 slot เหลือ 4 สำหรับ text
const LINE_TEXT_MSG_SLOTS = 4;

// สร้าง block ข้อความของโรงเรียน 1 แห่ง (ไม่มี header/footer)
function buildSchoolBlock(
  schoolId: number,
  schoolName: string,
  devices: { appName: string; appVersion: string; deviceId: string }[],
): string {
  const lines: string[] = [
    `${schoolName} (${schoolId})`,
    `ออฟไลน์ ${devices.length} เครื่อง`,
    `─────────────────────`,
  ];
  for (const { appName, appVersion, deviceId } of devices) {
    lines.push(`▸ ${appName} v${appVersion}`);
    lines.push(`   ${deviceId}`);
  }
  return lines.join("\n");
}

// แบ่ง school blocks ออกเป็น chunk โดยไม่ให้ข้อความเกิน LINE_TEXT_MAX ตัวอักษร
function chunkSchoolBlocks(
  header: string,
  footer: string,
  blocks: string[],
): string[] {
  const messages: string[] = [];
  let current = header;

  for (const block of blocks) {
    const separator = current === header ? "" : "\n\n";
    const candidate = current + separator + block;
    // ถ้าใส่ block นี้แล้วยังไม่เกิน limit (เผื่อ footer ด้วย)
    if ((candidate + "\n\n" + footer).length <= LINE_TEXT_MAX) {
      current = candidate;
    } else {
      // flush message ปัจจุบันแล้วเริ่มใหม่
      messages.push(current);
      current = block;
    }
  }

  // flush message สุดท้ายพร้อม footer
  messages.push(current + "\n\n" + footer);
  return messages;
}

// สร้าง plain-text messages รายละเอียดเครื่อง offline จัดกลุ่มตามโรงเรียน
// คืนค่าเป็น array เพราะข้อมูลอาจยาวเกิน 5,000 ตัวอักษร (LINE limit)
export function buildOfflineDetailTextMessages(
  offlineBySchool: Map<
    number,
    {
      schoolName: string;
      devices: { appName: string; appVersion: string; deviceId: string }[];
    }
  >,
  reportTime: string,
): object[] {
  const sorted = Array.from(offlineBySchool.entries()).sort(
    ([a], [b]) => a - b,
  );
  const totalOffline = sorted.reduce(
    (sum, [, { devices }]) => sum + devices.length,
    0,
  );

  const header = [
    `แจ้งเตือน : เครื่องออฟไลน์`,
    `เวลา : ${reportTime}`,
    `จำนวนทั้งหมด : ${totalOffline} เครื่อง จาก ${sorted.length} โรงเรียน`,
    ``,
  ].join("\n");

  const footer = [
    `กรุณาตรวจสอบและชาร์จแบตเตอรี่`,
    `หรือรีสตาร์ทเครื่องโดยด่วน`,
  ].join("\n");

  const blocks = sorted.map(([schoolId, { schoolName, devices }]) =>
    buildSchoolBlock(schoolId, schoolName, devices),
  );

  const chunks = chunkSchoolBlocks(header, footer, blocks);

  // LINE อนุญาตสูงสุด LINE_TEXT_MSG_SLOTS messages สำหรับ text (ส่วนที่เหลือจาก flex)
  const capped = chunks.slice(0, LINE_TEXT_MSG_SLOTS);

  // ถ้าตัดทิ้ง chunk บางส่วน ให้บอกจำนวนที่เกิน
  if (chunks.length > LINE_TEXT_MSG_SLOTS) {
    const lastMsg = capped[capped.length - 1];
    const skipped = chunks.length - LINE_TEXT_MSG_SLOTS;
    capped[capped.length - 1] =
      lastMsg +
      `\n\n(ข้อมูลบางส่วนถูกตัดออก ${skipped} หน้า เนื่องจากเกินขีดจำกัด LINE)`;
  }

  return capped.map((text) => ({ type: "text", text }));
}

// สร้าง Flex Message แบบ Carousel (เลื่อนซ้าย-ขวา) สำหรับรายงานสถานะอุปกรณ์
export function buildDeviceStatusFlexMessage(stats: {
  total: number;
  online: number;
  offline: number;
  login: number;
  onlineRate: number;
  totalSchools: number;
  reportTime: string;
  appGroups?: Array<{
    appName: string;
    appVersion: string;
    online: number;
    offline: number;
    login: number;
    total: number;
    onlineRate: number;
  }>;
}): object {
  const maxAppBubbles = Math.max(LINE_FLEX_MAX_BUBBLES - 1, 0);
  const allGroups = stats.appGroups ?? [];
  const displayedGroups = allGroups.slice(0, maxAppBubbles);
  const hiddenGroupCount = Math.max(
    allGroups.length - displayedGroups.length,
    0,
  );

  const summaryBubble = buildSummaryBubble({
    ...stats,
    hiddenGroupCount,
  });
  const appBubbles = displayedGroups.map(buildAppGroupBubble);

  return {
    type: "flex",
    altText: `[SchoolBright] รายงานสถานะ POS · ออนไลน์ ${stats.online}/${stats.total} (${stats.onlineRate}%)`,
    contents: {
      type: "carousel",
      contents: [summaryBubble, ...appBubbles],
    },
  };
}

const TEN_MIN_IN_MS = 10 * 60 * 1000;

// ตรวจสอบสถานะ hardware server โดยยิง GET /api/application แล้วคืน true ถ้าได้ 200
async function checkHardwareServerHealth(): Promise<boolean> {
  try {
    const { API_URL } = await import("@/services/api-url");
    const res = await axios.get(
      `${API_URL.PROD_HARDWARE_API_URL}/api/application`,
      {
        timeout: 8000,
        validateStatus: () => true,
      },
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

// ดึงข้อมูลจาก DB คำนวณสถานะ และสร้าง LINE messages array พร้อมส่ง
// ใช้ร่วมกันระหว่าง cron-report และ webhook (คำสั่ง "สถานะ")
export async function buildDeviceStatusReport(): Promise<object[]> {
  const now = new Date();
  const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

  const [allDevices, allSchools] = await Promise.all([
    prisma.deviceDailyStatus.findMany({
      select: {
        Online: true,
        OnlineTime: true,
        Login: true,
        SchoolID: true,
        DeviceID: true,
        AppName: true,
        AppVersion: true,
      },
    }),
    prisma.activeSchoolList.findMany({
      select: { nCompany: true, sCompany: true },
    }),
  ]);

  const schoolNameMap = new Map<number, string>(
    allSchools.map((s) => [s.nCompany, s.sCompany ?? `โรงเรียน ${s.nCompany}`]),
  );

  let online = 0;
  let offline = 0;
  let login = 0;
  const schoolSet = new Set<number>();
  const groupMap = new Map<
    string,
    { online: number; offline: number; login: number; total: number }
  >();
  const offlineBySchool = new Map<
    number,
    {
      schoolName: string;
      devices: { appName: string; appVersion: string; deviceId: string }[];
    }
  >();

  for (const device of allDevices) {
    const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
    const isOnlineDynamic = onlineTime
      ? now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS
      : false;

    if (isOnlineDynamic) online++;
    else {
      offline++;
      const entry = offlineBySchool.get(device.SchoolID) ?? {
        schoolName:
          schoolNameMap.get(device.SchoolID) ?? `โรงเรียน ${device.SchoolID}`,
        devices: [],
      };
      entry.devices.push({
        appName: device.AppName ?? "ไม่ระบุแอป",
        appVersion: device.AppVersion ?? "-",
        deviceId: device.DeviceID,
      });
      offlineBySchool.set(device.SchoolID, entry);
    }
    if (device.Login) login++;
    schoolSet.add(device.SchoolID);

    const appKey = `${device.AppName ?? "ไม่ระบุแอป"}|||${
      device.AppVersion ?? "-"
    }`;
    const g = groupMap.get(appKey) ?? {
      online: 0,
      offline: 0,
      login: 0,
      total: 0,
    };
    g.total++;
    if (isOnlineDynamic) g.online++;
    else g.offline++;
    if (device.Login) g.login++;
    groupMap.set(appKey, g);
  }

  const total = allDevices.length;
  const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);

  // ✨ ถ้าออฟไลน์เป็น 0 (ระบบปกติ) จะไม่ส่งแจ้งเตือน
  if (offline === 0) {
    return [];
  }

  const appGroups = Array.from(groupMap.entries())
    .map(([key, g]) => {
      const [appName, appVersion] = key.split("|||");
      return {
        appName: appName ?? "ไม่ระบุแอป",
        appVersion: appVersion ?? "-",
        ...g,
        onlineRate: g.total === 0 ? 0 : Math.round((g.online / g.total) * 100),
      };
    })
    .sort((a, b) => a.appName.localeCompare(b.appName));

  const messages: object[] = [
    buildDeviceStatusFlexMessage({
      total,
      online,
      offline,
      login,
      onlineRate,
      totalSchools: schoolSet.size,
      reportTime,
      appGroups,
    }),
  ];

  if (offlineBySchool.size > 0) {
    messages.push({
      type: "text",
      text: [
        `สำหรับ CS / QA`,
        `ให้ตรวจสอบรายละเอียดเครื่องฮาร์ดแวร์ออฟไลน์/ออนไลน์ แต่ละโรงเรียนได้ที่`,
        `https://sb-helper.schoolbright.co/health-check/online-status`,
        `และช่องทาง Email`,
      ].join("\n"),
    });
  }

  return messages;
}

// ค้นหาโรงเรียนแบบ Like และแสดงสถานะเครื่องทั้งหมด (ออนไลน์ + ออฟไลน์)
export async function buildSchoolStatusReport(
  keyword: string,
): Promise<object[]> {
  const now = new Date();
  const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

  // ค้นหาโรงเรียนที่ชื่อตรงกับ keyword (ตัดคำว่า "โรงเรียน" ออกก่อนเปรียบเทียบ)
  const matchedSchools = await prisma.activeSchoolList.findMany({
    where: { sCompany: { contains: keyword } },
    select: { nCompany: true, sCompany: true },
  });

  if (matchedSchools.length === 0) {
    return [
      {
        type: "text",
        text: `ไม่พบโรงเรียนที่ตรงกับ "${keyword}"\nกรุณาลองใช้คำค้นหาอื่น`,
      },
    ];
  }

  const schoolIds = matchedSchools.map((s) => s.nCompany);
  const schoolNameMap = new Map<number, string>(
    matchedSchools.map((s) => [
      s.nCompany,
      // ตัดคำนำหน้า "โรงเรียน" ออกเพื่อป้องกันการแสดงซ้ำ
      (s.sCompany ?? `โรงเรียน ${s.nCompany}`).replace(/^โรงเรียน/, "").trim(),
    ]),
  );

  const allDevices = await prisma.deviceDailyStatus.findMany({
    where: { SchoolID: { in: schoolIds } },
    select: {
      Online: true,
      OnlineTime: true,
      Login: true,
      SchoolID: true,
      DeviceID: true,
      AppName: true,
      AppVersion: true,
    },
  });

  // จัดกลุ่มอุปกรณ์ตามโรงเรียน แยก online/offline
  const schoolMap = new Map<
    number,
    {
      schoolName: string;
      online: { appName: string; appVersion: string; deviceId: string }[];
      offline: { appName: string; appVersion: string; deviceId: string }[];
    }
  >();

  for (const s of matchedSchools) {
    schoolMap.set(s.nCompany, {
      schoolName: schoolNameMap.get(s.nCompany) ?? `${s.nCompany}`,
      online: [],
      offline: [],
    });
  }

  for (const device of allDevices) {
    const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
    const isOnline = onlineTime
      ? now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS
      : false;

    const entry = schoolMap.get(device.SchoolID);
    if (!entry) continue;

    const info = {
      appName: device.AppName ?? "ไม่ระบุแอป",
      appVersion: device.AppVersion ?? "-",
      deviceId: device.DeviceID,
    };
    if (isOnline) entry.online.push(info);
    else entry.offline.push(info);
  }

  const lines: string[] = [
    `สถานะเครื่อง POS`,
    `เวลา : ${reportTime}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  for (const [schoolId, { schoolName, online, offline }] of Array.from(
    schoolMap.entries(),
  ).sort(([a], [b]) => a - b)) {
    const total = online.length + offline.length;
    lines.push(``);
    lines.push(`${schoolName} (${schoolId})`);
    lines.push(
      `รวม ${total} เครื่อง · ออนไลน์ ${online.length} · ออฟไลน์ ${offline.length}`,
    );
    lines.push(`─────────────────────`);

    for (const { appName, appVersion, deviceId } of online) {
      lines.push(`🟢 ${appName} v${appVersion}`);
      lines.push(`   ${deviceId}`);
    }
    for (const { appName, appVersion, deviceId } of offline) {
      lines.push(`🔴 ${appName} v${appVersion}`);
      lines.push(`   ${deviceId}`);
    }
  }

  // แบ่ง messages ถ้ายาวเกิน 5,000 ตัวอักษร
  const fullText = lines.join("\n");
  if (fullText.length <= LINE_TEXT_MAX) {
    return [{ type: "text", text: fullText }];
  }

  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    const candidate = current ? current + "\n" + line : line;
    if (candidate.length <= LINE_TEXT_MAX) {
      current = candidate;
    } else {
      chunks.push(current);
      current = line;
    }
  }
  if (current) chunks.push(current);

  return chunks.slice(0, 5).map((text) => ({ type: "text", text }));
}

// แปลง offlineMinutes เป็นข้อความภาษาไทย
function formatOfflineDuration(offlineMinutes: number | null): string {
  if (offlineMinutes === null) return "ไม่ทราบเวลา";
  const days = Math.floor(offlineMinutes / (60 * 24));
  const hours = Math.floor((offlineMinutes % (60 * 24)) / 60);
  const mins = offlineMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชม.`);
  parts.push(`${mins} น.`);
  return parts.join(" ");
}

// สร้าง bubble สรุปภาพรวมของโรงเรียนเดียว (card แรก)
function buildSchoolSummaryBubble(opts: {
  schoolName: string;
  schoolId: number;
  total: number;
  online: number;
  offline: number;
  notifyCount: number;
  reportTime: string;
  hiddenCount: number;
}): object {
  const {
    schoolName,
    schoolId,
    total,
    online,
    offline,
    notifyCount,
    reportTime,
    hiddenCount,
  } = opts;
  const { color, label, headerBg } = resolveStatusStyle(offline);
  const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);
  const progressBar = buildProgressBar(onlineRate);

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "SchoolBright Helper",
          size: "xxs",
          color: "#64748b",
          weight: "bold",
        },
        {
          type: "text",
          text: "รายงานสถานะอุปกรณ์",
          size: "md",
          color: "#f8fafc",
          weight: "bold",
          margin: "xs",
        },
        {
          type: "text",
          text: reportTime,
          size: "xxs",
          color: "#94a3b8",
          margin: "xs",
        },
      ],
    },
    hero: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerBg,
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `สถานะ: ${label}`,
          color: "#ffffff",
          size: "sm",
          weight: "bold",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b",
      paddingAll: "16px",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: schoolName,
          size: "sm",
          color: "#f8fafc",
          weight: "bold",
          wrap: true,
        },
        {
          type: "text",
          text: `รหัส ${schoolId}`,
          size: "xxs",
          color: "#64748b",
          margin: "xs",
        },
        { type: "separator", margin: "sm", color: "#334155" },
        buildStatRow("ทั้งหมด", `${total} เครื่อง`, "#e2e8f0"),
        buildStatRow("ออนไลน์", `${online} เครื่อง`, "#4ade80"),
        buildStatRow(
          "ออฟไลน์",
          `${offline} เครื่อง`,
          offline > 0 ? "#f87171" : "#4ade80",
        ),
        buildStatRow(
          "เปิดแจ้งเตือน",
          `${notifyCount}/${total} เครื่อง`,
          notifyCount > 0 ? "#38bdf8" : "#94a3b8",
        ),
        { type: "separator", margin: "sm", color: "#334155" },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "อัตราออนไลน์",
                  size: "xs",
                  color: "#94a3b8",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${onlineRate}%`,
                  size: "xs",
                  color,
                  weight: "bold",
                  align: "end",
                  flex: 2,
                },
              ],
            },
            {
              type: "text",
              text: progressBar,
              size: "xs",
              color,
              margin: "xs",
            },
          ],
        },
        ...(hiddenCount > 0
          ? [
              { type: "separator", margin: "sm", color: "#334155" },
              {
                type: "text",
                text: `และอีก ${hiddenCount} เครื่องที่ไม่ได้แสดง`,
                size: "xxs",
                color: "#94a3b8",
                wrap: true,
                margin: "sm",
              },
            ]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "8px",
      contents: [
        {
          type: "text",
          text: "Auto Report · SchoolBright",
          size: "xxs",
          color: "#475569",
          align: "center",
        },
      ],
    },
  };
}

// สร้าง bubble แสดงรายละเอียดเครื่องออฟไลน์ 1 เครื่อง
function buildOfflineDeviceBubble(opts: {
  index: number;
  deviceName: string;
  deviceId: string;
  appName: string;
  appVersion: string;
  offlineDuration: string;
  lastOnlineAt: string | null;
  offlineReason: "device_or_network" | "server_down";
}): object {
  const {
    index,
    deviceName,
    deviceId,
    appName,
    appVersion,
    offlineDuration,
    lastOnlineAt,
    offlineReason,
  } = opts;
  const reasonText =
    offlineReason === "server_down"
      ? "เซิร์ฟเวอร์เกิดข้อขัดข้อง"
      : "อินเทอร์เน็ต / ตัวเครื่องเสียหาย";
  const reasonColor = offlineReason === "server_down" ? "#dc2626" : "#d97706";

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#7f1d1d",
      paddingAll: "12px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#dc2626",
              cornerRadius: "12px",
              paddingTop: "2px",
              paddingBottom: "2px",
              paddingStart: "8px",
              paddingEnd: "8px",
              contents: [
                {
                  type: "text",
                  text: `#${index}`,
                  size: "xxs",
                  color: "#ffffff",
                  weight: "bold",
                },
              ],
            },
            {
              type: "text",
              text: "ออฟไลน์",
              size: "xxs",
              color: "#fca5a5",
              weight: "bold",
              margin: "sm",
              align: "end",
              flex: 1,
            },
          ],
        },
        {
          type: "text",
          text: deviceName,
          size: "sm",
          color: "#ffffff",
          weight: "bold",
          wrap: true,
          margin: "sm",
        },
        {
          type: "text",
          text: `${appName} v${appVersion}`,
          size: "xxs",
          color: "#fca5a5",
          wrap: false,
          margin: "xs",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b",
      paddingAll: "14px",
      spacing: "none",
      contents: [
        {
          type: "text",
          text: "ออฟไลน์นาน",
          size: "xxs",
          color: "#94a3b8",
        },
        {
          type: "text",
          text: offlineDuration,
          size: "xl",
          color: "#f87171",
          weight: "bold",
          margin: "xs",
        },
        { type: "separator", margin: "md", color: "#334155" },
        {
          type: "text",
          text: "ออนไลน์ล่าสุดเมื่อ",
          size: "xxs",
          color: "#94a3b8",
          margin: "md",
        },
        {
          type: "text",
          text: lastOnlineAt ?? "ไม่มีข้อมูล",
          size: "sm",
          color: lastOnlineAt ? "#e2e8f0" : "#475569",
          weight: "bold",
          margin: "xs",
        },
        { type: "separator", margin: "sm", color: "#334155" },
        {
          type: "box",
          layout: "horizontal",
          margin: "sm",
          contents: [
            {
              type: "text",
              text: "สาเหตุ",
              size: "xxs",
              color: "#94a3b8",
              flex: 2,
            },
            {
              type: "text",
              text: reasonText,
              size: "xxs",
              color: reasonColor,
              weight: "bold",
              wrap: true,
              align: "end",
              flex: 4,
            },
          ],
        },
        {
          type: "text",
          text: `ID: ${deviceId}`,
          size: "xxs",
          color: "#475569",
          margin: "sm",
        },
      ],
    },
  };
}

// สร้าง bubble แสดงสถานะ "ทุกเครื่องออนไลน์" เมื่อไม่มีเครื่องออฟไลน์
function buildAllOnlineBubble(opts: {
  schoolName: string;
  total: number;
  reportTime: string;
}): object {
  const { schoolName, total, reportTime } = opts;
  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "SchoolBright Helper",
          size: "xxs",
          color: "#64748b",
          weight: "bold",
        },
        {
          type: "text",
          text: "รายงานสถานะอุปกรณ์",
          size: "md",
          color: "#f8fafc",
          weight: "bold",
          margin: "xs",
        },
        {
          type: "text",
          text: reportTime,
          size: "xxs",
          color: "#94a3b8",
          margin: "xs",
        },
      ],
    },
    hero: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#14532d",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: "สถานะ: ระบบปกติ",
          color: "#ffffff",
          size: "sm",
          weight: "bold",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b",
      paddingAll: "16px",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: schoolName,
          size: "sm",
          color: "#f8fafc",
          weight: "bold",
          wrap: true,
        },
        { type: "separator", margin: "md", color: "#334155" },
        {
          type: "text",
          text: "ทุกเครื่องออนไลน์ปกติ",
          size: "sm",
          color: "#4ade80",
          weight: "bold",
          align: "center",
          margin: "md",
        },
        buildStatRow("จำนวนทั้งหมด", `${total} เครื่อง`, "#e2e8f0"),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "8px",
      contents: [
        {
          type: "text",
          text: "Auto Report · SchoolBright",
          size: "xxs",
          color: "#475569",
          align: "center",
        },
      ],
    },
  };
}

// ข้อมูล device แต่ละเครื่องสำหรับ cronjob endpoint
export interface SchoolDeviceItem {
  device_id: string;
  app_name: string;
  app_version: string;
  note: string | null;
  is_online: boolean;
  is_login: boolean;
  online_time: string | null;
  offline_reason: "device_or_network" | "server_down" | null;
  notify_enabled: boolean;
}

// ผลลัพธ์รวมสถานะเครื่องของโรงเรียนสำหรับ cronjob endpoint
export interface SchoolDeviceStatusResult {
  school_id: number;
  school_name: string;
  online: number;
  offline: number;
  total: number;
  offline_reason: "device_or_network" | "server_down" | null;
  devices: SchoolDeviceItem[];
}

// ดึงข้อมูลสถานะเครื่องทุกเครื่องของโรงเรียน พร้อม NotifyEnabled จาก DeviceDailyStatus (Main DB)
export async function buildSchoolDeviceStatusData(
  schoolId: number,
): Promise<SchoolDeviceStatusResult | null> {
  const now = new Date();

  const [school, devices] = await Promise.all([
    prisma.activeSchoolList.findFirst({
      where: { nCompany: schoolId },
      select: { nCompany: true, sCompany: true },
    }),
    prisma.deviceDailyStatus.findMany({
      where: { SchoolID: schoolId },
      select: {
        DeviceID: true,
        AppName: true,
        AppVersion: true,
        Note: true,
        OnlineTime: true,
        Login: true,
        NotifyEnabled: true,
      },
      orderBy: { DeviceID: "asc" },
    }),
  ]);

  if (!school) return null;

  const hardwareServerOk = await checkHardwareServerHealth();
  const serverOfflineReason = hardwareServerOk
    ? "device_or_network"
    : "server_down";

  let onlineCount = 0;
  let offlineCount = 0;

  const mappedDevices: SchoolDeviceItem[] = devices.map((d) => {
    const onlineTime = d.OnlineTime ? new Date(d.OnlineTime) : null;
    const isOnline = onlineTime
      ? now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS
      : false;

    if (isOnline) onlineCount++;
    else offlineCount++;

    return {
      device_id: d.DeviceID ?? "-",
      app_name: d.AppName ?? "ไม่ระบุแอป",
      app_version: d.AppVersion ?? "-",
      note: d.Note ?? null,
      is_online: isOnline,
      is_login: d.Login ?? false,
      online_time: onlineTime ? onlineTime.toISOString() : null,
      offline_reason: isOnline ? null : serverOfflineReason,
      notify_enabled: d.NotifyEnabled,
    };
  });

  return {
    school_id: schoolId,
    school_name: school.sCompany ?? `โรงเรียน ${schoolId}`,
    online: onlineCount,
    offline: offlineCount,
    total: devices.length,
    offline_reason: offlineCount > 0 ? serverOfflineReason : null,
    devices: mappedDevices,
  };
}

// ✨ ตรวจสอบและอัปเดต state การแจ้งเตือนรายเครื่องใน DeviceNotifyState — คืนว่าควรส่ง LINE ไหมและรอบที่เท่าไหร่
export async function checkAndUpdateNotifyState(
  schoolId: number,
  devices: Array<{
    is_online: boolean;
    online_time: string | null;
    notify_enabled: boolean;
    device_id?: string;
    app_name?: string;
  }>,
  intervalRound1Minutes: number,
  intervalRound2Minutes: number,
): Promise<{
  result: boolean;
  notifyRound: 1 | 2 | null;
  debugLines: string[];
}> {
  const now = new Date();
  const nowMs = now.getTime();
  const debugLines: string[] = [];
  let result = false;
  let notifyRound: 1 | 2 | null = null;

  const existingStates = await PrismaJabjaiMaster.deviceNotifyState.findMany({
    where: { school_id: schoolId },
  });
  const stateMap = new Map(existingStates.map((s) => [s.device_id, s]));

  for (const device of devices) {
    const deviceId = device.device_id ?? "unknown";
    const name = device.app_name ?? deviceId;

    if (device.is_online) {
      const existing = stateMap.get(deviceId);
      if (existing?.offline_since !== null) {
        await PrismaJabjaiMaster.deviceNotifyState.upsert({
          where: {
            school_id_device_id: { school_id: schoolId, device_id: deviceId },
          },
          create: {
            school_id: schoolId,
            device_id: deviceId,
            offline_since: null,
            r1_sent_at: null,
            last_notified_at: null,
          },
          update: {
            offline_since: null,
            r1_sent_at: null,
            last_notified_at: null,
          },
        });
      }
      continue;
    }

    if (!device.notify_enabled) continue;

    let state = stateMap.get(deviceId);

    if (!state || state.offline_since === null) {
      const offlineSince = device.online_time
        ? new Date(device.online_time)
        : now;
      const upserted = await PrismaJabjaiMaster.deviceNotifyState.upsert({
        where: {
          school_id_device_id: { school_id: schoolId, device_id: deviceId },
        },
        create: {
          school_id: schoolId,
          device_id: deviceId,
          offline_since: offlineSince,
          r1_sent_at: null,
          last_notified_at: null,
        },
        update: { offline_since: offlineSince },
      });
      state = upserted;
      stateMap.set(deviceId, upserted);
    }

    const offlineSinceMs = state.offline_since!.getTime();
    const offlineMin = (nowMs - offlineSinceMs) / 60_000;
    const offlineMinStr = offlineMin.toFixed(1);

    if (state.r1_sent_at === null) {
      if (offlineMin >= intervalRound1Minutes) {
        debugLines.push(`  [NOTIFY R1] ${name} — offline ${offlineMinStr} min`);
        await PrismaJabjaiMaster.deviceNotifyState.update({
          where: {
            school_id_device_id: { school_id: schoolId, device_id: deviceId },
          },
          data: { r1_sent_at: now, last_notified_at: now },
        });
        result = true;
        if (notifyRound === null) notifyRound = 1;
      } else {
        debugLines.push(
          `  [WAIT  R1] ${name} — offline ${offlineMinStr} min, wait ${(
            intervalRound1Minutes - offlineMin
          ).toFixed(1)} min`,
        );
      }
    } else {
      const lastMs = state.last_notified_at!.getTime();
      const minutesSinceLast = (nowMs - lastMs) / 60_000;
      if (minutesSinceLast >= intervalRound2Minutes) {
        const cycleNo = Math.floor(
          (nowMs - state.r1_sent_at!.getTime()) /
            60_000 /
            intervalRound2Minutes,
        );
        debugLines.push(
          `  [NOTIFY R2] ${name} — offline ${offlineMinStr} min, cycle #${cycleNo}`,
        );
        await PrismaJabjaiMaster.deviceNotifyState.update({
          where: {
            school_id_device_id: { school_id: schoolId, device_id: deviceId },
          },
          data: { last_notified_at: now },
        });
        result = true;
        if (notifyRound === null) notifyRound = 2;
      } else {
        const waitMin = (intervalRound2Minutes - minutesSinceLast).toFixed(1);
        debugLines.push(
          `  [WAIT  R2] ${name} — offline ${offlineMinStr} min, next in ~${waitMin} min`,
        );
      }
    }
  }

  return { result, notifyRound, debugLines };
}

// สูงสุด 9 bubble เครื่องออฟไลน์ + 1 summary = 10 (ขีดจำกัด carousel)
const MAX_DEVICE_BUBBLES = 9;

// สร้าง LINE message รายงานสถานะเครื่องฮาร์ดแวร์ของโรงเรียนเดียว พร้อมหมายเลขลำดับ
export async function buildSchoolDeviceReport(schoolId: number): Promise<{
  messages: object[];
  schoolName: string;
  total: number;
  online: number;
  offline: number;
}> {
  const now = new Date();
  const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

  const school = await prisma.activeSchoolList.findFirst({
    where: { nCompany: schoolId },
    select: { nCompany: true, sCompany: true },
  });

  if (!school) {
    return {
      messages: [
        { type: "text", text: `ไม่พบข้อมูลโรงเรียน รหัส ${schoolId}` },
      ],
      schoolName: `โรงเรียน ${schoolId}`,
      total: 0,
      online: 0,
      offline: 0,
    };
  }

  const schoolName = school.sCompany ?? `โรงเรียน ${schoolId}`;

  const devices = await prisma.deviceDailyStatus.findMany({
    where: { SchoolID: schoolId },
    select: {
      Online: true,
      OnlineTime: true,
      Login: true,
      DeviceID: true,
      AppName: true,
      AppVersion: true,
      Note: true,
      NotifyEnabled: true,
    },
    orderBy: { DeviceID: "asc" },
  });

  // กรองเฉพาะเครื่องที่ไม่ใช่ .SB Canteen ออกก่อนนับ total
  const filteredDevices = devices.filter(
    (d) => (d.AppName ?? "").trim() !== ".SB Canteen",
  );

  let onlineCount = 0;
  let offlineCount = 0;
  let notifyCount = 0;

  interface OfflineDevice {
    deviceName: string;
    deviceId: string;
    appName: string;
    appVersion: string;
    offlineMinutes: number | null;
    lastOnlineAt: string | null;
    offlineReason: "device_or_network" | "server_down";
  }

  const offlineDevices: OfflineDevice[] = [];

  // ตรวจสอบ hardware server ก่อนวนเครื่อง เพื่อกำหนดสาเหตุ offline
  const hardwareServerOk = await checkHardwareServerHealth();
  const offlineReason: OfflineDevice["offlineReason"] = hardwareServerOk
    ? "device_or_network"
    : "server_down";

  for (const device of filteredDevices) {
    const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
    const isOnline = onlineTime
      ? now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS
      : false;

    if (device.NotifyEnabled) notifyCount++;

    if (isOnline) {
      onlineCount++;
    } else {
      offlineCount++;
      if (device.NotifyEnabled) {
        const offlineMinutes =
          onlineTime !== null
            ? Math.floor((now.getTime() - onlineTime.getTime()) / (60 * 1000))
            : null;
        offlineDevices.push({
          deviceName: device.Note?.trim() || "ไม่ระบุชื่อเครื่อง",
          deviceId: device.DeviceID ?? "-",
          appName: device.AppName ?? "ไม่ระบุแอป",
          appVersion: device.AppVersion ?? "-",
          offlineMinutes,
          lastOnlineAt: onlineTime
            ? dayjs(onlineTime).format("DD/MM/YYYY HH:mm")
            : null,
          offlineReason,
        });
      }
    }
  }

  const total = filteredDevices.length;

  // กรณีไม่มีอุปกรณ์ที่ต้องตรวจสอบ — ไม่ส่ง LINE
  if (total === 0) {
    return {
      messages: [],
      schoolName,
      total: 0,
      online: 0,
      offline: 0,
    };
  }

  // กรณีทุกเครื่องออนไลน์ — ส่ง bubble เดียว
  if (offlineDevices.length === 0) {
    return {
      messages: [
        {
          type: "flex",
          altText: `[SchoolBright] ${schoolName} · ทุกเครื่องออนไลน์ปกติ (${total} เครื่อง)`,
          contents: buildAllOnlineBubble({ schoolName, total, reportTime }),
        },
      ],
      schoolName,
      total,
      online: onlineCount,
      offline: 0,
    };
  }

  // จำกัดจำนวน bubble เครื่องออฟไลน์ไม่เกิน MAX_DEVICE_BUBBLES
  const displayedDevices = offlineDevices.slice(0, MAX_DEVICE_BUBBLES);
  const hiddenCount = offlineDevices.length - displayedDevices.length;

  const summaryBubble = buildSchoolSummaryBubble({
    schoolName,
    schoolId,
    total,
    online: onlineCount,
    offline: offlineCount,
    notifyCount,
    reportTime,
    hiddenCount,
  });

  const deviceBubbles = displayedDevices.map((d, i) =>
    buildOfflineDeviceBubble({
      index: i + 1,
      deviceName: d.deviceName,
      deviceId: d.deviceId,
      appName: d.appName,
      appVersion: d.appVersion,
      offlineDuration: formatOfflineDuration(d.offlineMinutes),
      lastOnlineAt: d.lastOnlineAt,
      offlineReason: d.offlineReason,
    }),
  );

  return {
    messages: [
      {
        type: "flex",
        altText: `[SchoolBright] ${schoolName} · ออฟไลน์ ${offlineCount}/${total} เครื่อง`,
        contents: {
          type: "carousel",
          contents: [summaryBubble, ...deviceBubbles],
        },
      },
    ],
    schoolName,
    total,
    online: onlineCount,
    offline: offlineCount,
  };
}
