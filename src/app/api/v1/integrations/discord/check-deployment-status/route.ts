import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
// นำเข้าไฟล์ Helper ที่ระบุ (กรุณาตรวจสอบ Path ให้ตรงกับโฟลเดอร์จริงของโปรเจกต์)
import { discordIdUser } from "@/helpers/api/discord-id-user";

// --- 1. Configuration ---
const GLOBAL_CONFIG = {
  webhookEnv: "WEBHOOK_DISCORD_CHECK_STATUS_DEPLOY_BOT",
  // ลบ mentionUserId ออก เพราะจะไปใช้จาก discordIdUser แทน
};

// --- 2. Logic (Deploy Status) ---
type DeployState = {
  statusLabel: string;
  description: string;
  color: number;
  icon: string;
  stepper: string;
};

const getDeployStatus = (state: string, env: string): DeployState => {
  const envName = env.toUpperCase();

  switch (state) {
    case "queued":
    case "pending":
      return {
        statusLabel: "[QUEUED] กำลังเตรียมการ (Queued)",
        description:
          "ระบบได้รับคำสั่ง Deploy แล้ว กำลังรอคิวเพื่อเริ่มกระบวนการ",
        color: 0x95a5a6, // Gray
        icon: "[BRICK]",
        stepper:
          "**[[STOP] รอเริ่ม]** -- [WORKING] กำลังทำ -- [SUCCESS] เสร็จสิ้น",
      };
    case "in_progress":
      return {
        statusLabel: "[DEPLOY] กำลังดำเนินการ Deploy",
        description: `กำลังติดตั้งเวอร์ชันล่าสุดลงเซิร์ฟเวอร์ **${envName}** \n[WARN] *ช่วงเวลานี้ระบบอาจหน่วงหรือหลุดชั่วคราว*`,
        color: 0xf39c12, // Orange/Yellow
        icon: "[CONSTRUCTION]",
        stepper:
          "[STOP] รอเริ่ม -- **[[WORKING] กำลังทำ]** -- [SUCCESS] เสร็จสิ้น",
      };
    case "success":
      return {
        statusLabel: "[SUCCESS] Deploy สำเร็จ (Success)",
        description: `อัปเดตระบบบน **${envName}** เรียบร้อยแล้ว \n[GOAL] **QA/CS สามารถเข้าตรวจสอบหรือใช้งานได้ทันที**`,
        color: 0x2ecc71, // Green
        icon: "[PASS]",
        stepper:
          "[STOP] รอเริ่ม -- [WORKING] กำลังทำ -- **[[SUCCESS] เสร็จสิ้น]**",
      };
    case "failure":
    case "error":
      return {
        statusLabel: "[FAIL] Deploy ล้มเหลว (Failed)",
        description:
          "เกิดข้อผิดพลาดระหว่างการ Deploy ระบบยังเป็นเวอร์ชันเดิม \n[DEV] **Dev กรุณาเช็ค Log โดยด่วน**",
        color: 0xe74c3c, // Red
        icon: "[ALERT]",
        stepper: "[STOP] รอเริ่ม -- [FAIL] **[ล้มเหลว]** -- [WAIT] เสร็จสิ้น",
      };
    default:
      return {
        statusLabel: "[SIGNAL] สถานะอื่นๆ",
        description: `Status: ${state}`,
        color: 0x3498db, // Blue
        icon: "[INFO]",
        stepper: "[WAIT] Unknown Status",
      };
  }
};

// --- 3. Payload Builder ---
const buildDiscordPayload = (repoFullName: string, payload: any) => {
  const deployment = payload.deployment;
  const status = payload.deployment_status;

  const state = status.state;
  const environment = deployment.environment;
  const creator = deployment.creator.login;

  // ตรวจสอบ URL ให้แน่ใจว่าไม่ว่าง (Button ต้องมี URL)
  const logUrl =
    status.target_url || status.log_url || deployment.repository_url;
  const commitUrl =
    deployment.html_url || `https://github.com/${repoFullName}/deployments`;

  const commitSha = deployment.sha.substring(0, 7);
  const deployInfo = getDeployStatus(state, environment);

  // Components (Buttons)
  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "View Logs",
          url: logUrl,
          emoji: { name: "log" },
        },
        {
          type: 2,
          style: 5,
          label: "GitHub Commit",
          url: commitUrl,
          emoji: { name: "link" },
        },
      ],
    },
  ];

  const embed = {
    title: `${deployInfo.icon} แจ้งเตือนสถานะ: ${repoFullName}`,
    description: `${deployInfo.stepper}\n\n**สถานะ**: ${deployInfo.statusLabel}\n${deployInfo.description}`,
    url: logUrl,
    color: deployInfo.color,
    fields: [
      {
        name: "[ENV] Environment",
        value: `\`${environment.toUpperCase()}\``,
        inline: true,
      },
      {
        name: "[VER] เวอร์ชัน (Commit)",
        value: `\`${commitSha}\``,
        inline: true,
      },
      {
        name: "[USER] สั่งการโดย",
        value: creator,
        inline: true,
      },
      {
        name: "[TIME] เวลา",
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: true,
      },
    ],
    footer: {
      text: `DevOps Notification - ${repoFullName}`,
      icon_url: "https://cdn-icons-png.flaticon.com/512/8662/8662237.png",
    },
    timestamp: new Date().toISOString(),
  };

  return {
    // แก้ไข: เรียกใช้ discordIdUser.TeamSupport แทนตัวแปรเดิม
    content: `${discordIdUser.TeamSupport} [NOTICE] **มีการเคลื่อนไหวที่ Repository: ${repoFullName}**`,
    embeds: [embed],
    components: components,
  };
};

// --- 4. Handler ---
export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");

  if (event !== "deployment_status") {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const payload = await req.json();

  if (!payload.deployment_status || !payload.deployment) {
    return NextResponse.json(
      { status: "error", reason: "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const repoFullName = payload.repository.full_name;
    const webhookUrl = process.env[GLOBAL_CONFIG.webhookEnv];

    if (!webhookUrl) {
      throw new Error(`Webhook URL not found: ${GLOBAL_CONFIG.webhookEnv}`);
    }

    const discordPayload = buildDiscordPayload(repoFullName, payload);

    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json({
      status: "success",
      discord_status: response.status,
    });
  } catch (err: any) {
    console.error("Deploy Webhook Error:", err.response?.data || err.message);

    return NextResponse.json(
      {
        status: "error",
        reason: "Internal Server Error",
        details: err.response?.data || err.message,
      },
      { status: 500 },
    );
  }
}
