import axios from "axios";

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
    return { color: "#d97706", label: "ต้องระวัง", headerBg: "#78350f" };
  return { color: "#dc2626", label: "วิกฤต", headerBg: "#7f1d1d" };
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

// สร้าง plain-text message รายละเอียดเครื่อง offline จัดกลุ่มตามโรงเรียน
export function buildOfflineDetailTextMessage(
  offlineBySchool: Map<
    number,
    {
      schoolName: string;
      devices: { appName: string; appVersion: string; deviceId: string }[];
    }
  >,
  reportTime: string,
): object {
  const sorted = Array.from(offlineBySchool.entries()).sort(([a], [b]) => a - b);

  const totalOffline = sorted.reduce((sum, [, { devices }]) => sum + devices.length, 0);

  const lines: string[] = [
    `แจ้งเตือน : เครื่อง POS ออฟไลน์`,
    `เวลา : ${reportTime}`,
    `จำนวนทั้งหมด : ${totalOffline} เครื่อง จาก ${sorted.length} โรงเรียน`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  sorted.forEach(([schoolId, { schoolName, devices }], idx) => {
    if (idx > 0) lines.push("");
    lines.push(`โรงเรียน${schoolName} (${schoolId})`);
    lines.push(`ออฟไลน์ ${devices.length} เครื่อง`);
    lines.push(`─────────────────────`);
    for (const { appName, appVersion, deviceId } of devices) {
      lines.push(`▸ ${appName} v${appVersion}`);
      lines.push(`   ${deviceId}`);
    }
  });

  lines.push(``);
  lines.push(`กรุณาตรวจสอบและชาร์จแบตเตอรี่`);
  lines.push(`หรือรีสตาร์ทเครื่องโดยด่วน`);

  return { type: "text", text: lines.join("\n") };
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
