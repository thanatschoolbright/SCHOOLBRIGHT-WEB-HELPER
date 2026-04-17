import axios from "axios";

const LINE_API = "https://api.line.me/v2/bot/message";

// ส่งข้อความ push ไปยัง group หรือ user ผ่าน LINE Messaging API
export async function linePushMessage(
  to: string,
  messages: object[],
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");

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
}

// สร้าง Flex Message รายงานสถานะอุปกรณ์สำหรับ LINE
export function buildDeviceStatusFlexMessage(stats: {
  total: number;
  online: number;
  offline: number;
  login: number;
  onlineRate: number;
  totalSchools: number;
  reportTime: string;
}): object {
  const { total, online, offline, login, onlineRate, totalSchools, reportTime } = stats;

  const statusColor = offline === 0 ? "#16a34a" : offline < 5 ? "#d97706" : "#dc2626";
  const statusLabel = offline === 0 ? "ปกติ ✅" : offline < 5 ? "ต้องระวัง ⚠️" : "วิกฤต 🚨";
  const barFilled = Math.round(onlineRate / 10);
  const progressBar = "█".repeat(barFilled) + "░".repeat(10 - barFilled);

  return {
    type: "flex",
    altText: `[SchoolBright] รายงานสถานะ POS · ออนไลน์ ${online}/${total} (${onlineRate}%)`,
    contents: {
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
            size: "xs",
            color: "#64748b",
            weight: "bold",
          },
          {
            type: "text",
            text: "รายงานสถานะเครื่อง POS",
            size: "lg",
            color: "#f8fafc",
            weight: "bold",
            margin: "xs",
          },
          {
            type: "text",
            text: `🕐 ${reportTime}`,
            size: "xs",
            color: "#94a3b8",
            margin: "xs",
          },
        ],
      },
      hero: {
        type: "box",
        layout: "vertical",
        backgroundColor: statusColor,
        paddingAll: "10px",
        contents: [
          {
            type: "text",
            text: `สถานะระบบ: ${statusLabel}`,
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
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              buildStatBox("📊 ทั้งหมด", `${total}`, "#6366f1", "#eef2ff"),
              buildStatBox("🟢 ออนไลน์", `${online}`, "#16a34a", "#f0fdf4"),
              buildStatBox("🔴 ออฟไลน์", `${offline}`, offline >= 5 ? "#dc2626" : offline > 0 ? "#d97706" : "#16a34a", offline >= 5 ? "#fff1f2" : offline > 0 ? "#fffbeb" : "#f0fdf4"),
              buildStatBox("⚡ ใช้งาน", `${login}`, "#2563eb", "#eff6ff"),
            ],
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "อัตราออนไลน์",
                size: "xs",
                color: "#6b7280",
                weight: "bold",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: progressBar,
                    size: "xs",
                    color: statusColor,
                    flex: 4,
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${onlineRate}%`,
                    size: "sm",
                    color: statusColor,
                    weight: "bold",
                    align: "end",
                    flex: 1,
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `🏫 ${totalSchools} โรงเรียน`,
                size: "xs",
                color: "#6b7280",
                flex: 1,
              },
              {
                type: "text",
                text: "SchoolBright · Auto Report",
                size: "xs",
                color: "#9ca3af",
                align: "end",
                flex: 2,
              },
            ],
          },
        ],
      },
    },
  };
}

// สร้าง box สถิติแต่ละตัวใน Flex Message
function buildStatBox(
  label: string,
  value: string,
  color: string,
  bg: string,
): object {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: bg,
    cornerRadius: "8px",
    paddingAll: "8px",
    flex: 1,
    contents: [
      {
        type: "text",
        text: value,
        size: "xl",
        weight: "bold",
        color,
        align: "center",
      },
      {
        type: "text",
        text: label,
        size: "xxs",
        color: "#6b7280",
        align: "center",
        wrap: true,
      },
    ],
  };
}
