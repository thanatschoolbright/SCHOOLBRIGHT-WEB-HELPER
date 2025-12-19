import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import { checkLoginService, HealthCheckResult } from "./helper/login.service";
import { checkVerificationService } from "./helper/verification.service";
import { checkServerStatusService } from "./helper/server-status.service";

const DISCORD_CONFIG = {
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_HEARTBEAT_BOT ?? "",
  ALERT_USER_ID: "<@692372441699319900>",
  BOT_USERNAME: "SB-System-Monitor",
};

async function executeHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    checkLoginService(),
    checkVerificationService(),
    checkServerStatusService(),
  ]);
}

function generateDiscordAlertMessage(
  failedServices: HealthCheckResult[]
): string {
  const errorDetails = failedServices
    .map(
      (service) =>
        `❌ **${service.module}** (${service.service}) : Status ${service.status}\n\`\`\`bash\n${service.curl}\n\`\`\``
    )
    .join("\n\n");

  return `🔥 **System Alert!**\n${errorDetails}\nรบกวนตรวจสอบทันที ${DISCORD_CONFIG.ALERT_USER_ID}`;
}

async function sendDiscordNotification(failedServices: HealthCheckResult[]) {
  if (failedServices.length === 0) return;

  const content = generateDiscordAlertMessage(failedServices);

  try {
    await axios.post(
      DISCORD_CONFIG.WEBHOOK_URL,
      {
        content,
        username: DISCORD_CONFIG.BOT_USERNAME,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    logger.error("Failed to send Discord webhook", error?.message ?? error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shouldNotifyDiscord = body.mode === "discord";

    const healthCheckResults = await executeHealthChecks();

    if (shouldNotifyDiscord) {
      const failedServices = healthCheckResults.filter(
        (result) => result.status !== "200"
      );
      await sendDiscordNotification(failedServices);
    }

    return NextResponse.json(successResponse({ data: healthCheckResults }), {
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
