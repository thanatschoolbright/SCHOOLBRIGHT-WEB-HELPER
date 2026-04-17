import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildDiscordPayload,
  calculateDeviceStats,
  sendDiscordWebhook,
  sendMonitoringEmail,
} from "./service/machine-monitoring.service";

// schema สำหรับ validate request body ของ endpoint นี้
const MachineMonitoringSchema = z.object({
  devices: z.array(
    z.object({
      DeviceStatusID: z.string().nullable().optional(),
      SchoolID: z.number(),
      DeviceID: z.string(),
      Online: z.boolean(),
      OnlineTime: z.union([z.string(), z.date()]).nullable().optional().default(null),
      Login: z.boolean(),
      LoginTime: z.union([z.string(), z.date()]).nullable().optional().default(null),
      LogOut: z.boolean(),
      LogoutTime: z.union([z.string(), z.date()]).nullable().optional().default(null),
      Tstamp: z.union([z.string(), z.date()]),
      BusinessDate: z.union([z.string(), z.date()]),
      AppName: z.string().nullable().optional(),
      AppVersion: z.string().nullable().optional(),
    }),
  ),
  school_map: z.array(
    z.object({
      SchoolID: z.number(),
      SchoolName: z.string(),
    }),
  ),
  total_in_db: z.number().optional(),
});

// POST handler สำหรับรับข้อมูลสถานะเครื่อง POS และส่งรายงานไปยัง Discord + Email
export async function POST(req: NextRequest) {
  const { data, error } = await validateRequest(req, MachineMonitoringSchema);
  if (error) return error;

  const { devices, school_map, total_in_db } = data;

  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MACHINE_MONITORING ?? "";
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return NextResponse.json(
      errorResponse({
        message_th: "ไม่พบการตั้งค่า Discord Webhook URL",
        message_en: "Discord Webhook URL is not configured",
        status: 500,
      }),
      { status: 500 },
    );
  }

  try {
    const stats = calculateDeviceStats(devices);
    const now = new Date();
    const reportTime =
      now.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      " น.";

    const discordPayload = buildDiscordPayload(stats, school_map, total_in_db);

    // ส่ง Discord และ Email พร้อมกัน
    const [discordResult, emailResult] = await Promise.allSettled([
      sendDiscordWebhook(discordPayload, webhookUrl),
      sendMonitoringEmail(stats, school_map, reportTime),
    ]);

    const discordSuccess = discordResult.status === "fulfilled";
    const emailStatus =
      emailResult.status === "fulfilled"
        ? emailResult.value
        : {
            success: false,
            error: emailResult.status === "rejected" ? String(emailResult.reason) : "ส่งอีเมลไม่สำเร็จ",
          };

    if (!discordSuccess) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ส่งรายงานไปยัง Discord ไม่สำเร็จ",
          message_en: "Failed to send report to Discord",
          error:
            discordResult.status === "rejected"
              ? String(discordResult.reason)
              : undefined,
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      successResponse({
        data: {
          total: stats.total,
          online: stats.online,
          offline: stats.offline,
          login: stats.login,
          online_rate: stats.onlineRate,
          app_groups: stats.appGroups.map((g) => ({
            app_name: g.appName,
            app_version: g.appVersion,
            total: g.total,
            online: g.online,
            offline: g.offline,
            online_rate: g.onlineRate,
          })),
          email_sent: emailStatus.success,
          email_error: emailStatus.error ?? null,
        },
        message_th: "ส่งรายงานสถานะเครื่อง POS ไปยัง Discord และอีเมลเรียบร้อยแล้ว",
        message_en: "Machine monitoring report sent to Discord and email successfully",
      }),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงานสถานะเครื่อง POS",
        message_en: "Failed to send machine monitoring report",
        status: 500,
        error: message,
      }),
      { status: 500 },
    );
  }
}
