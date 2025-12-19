import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";

// Import Service ที่แยกออกไป
import { checkLoginService, HealthCheckResult } from "./helper/login.service";
import { checkVerificationService } from "./helper/verification.service";

const WEBHOOK_DISCORD =
  process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_HEARTBEAT_BOT ?? "";
const DISCORD_ALERT_USER = "<@692372441699319900>";

// --- Discord Helper ---

async function sendDiscordWebhook(content: string) {
  try {
    await axios.post(
      WEBHOOK_DISCORD,
      { content, username: "SB-System-Monitor" },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    logger.error("Failed to send Discord webhook", err?.message ?? err);
  }
}

// --- Main Handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mode } = body;

    // เรียกใช้ Service ต่างๆ ผ่าน Promise.all
    const results: HealthCheckResult[] = await Promise.all([
      checkLoginService(),
      checkVerificationService(),
    ]);

    // กรองหา Service ที่มีปัญหา
    const failedServices = results.filter((r) => r.status !== "200");

    // แจ้งเตือน Discord หากโหมดเป็น discord และมี service พัง
    if (mode === "discord" && failedServices.length > 0) {
      const errorMsg = failedServices
        .map(
          (s) =>
            `❌ **${s.module}** (${s.service}) : Status ${s.status}\n\`\`\`bash\n${s.curl}\n\`\`\``
        )
        .join("\n\n");

      await sendDiscordWebhook(
        `🔥 **System Alert!**\n${errorMsg}\nรบกวนตรวจสอบทันที ${DISCORD_ALERT_USER}`
      );
    }

    return NextResponse.json(successResponse({ data: results }), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: 500,
        error: null,
      }),
      { status: 500 }
    );
  }
}
