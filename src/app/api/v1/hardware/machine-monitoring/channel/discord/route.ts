import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import axios, { AxiosError } from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { NextRequest, NextResponse } from "next/server";

dayjs.locale("th");

const TEN_MIN_IN_MS = 10 * 60 * 1000;
const CRITICAL_THRESHOLD = 5;
const FIELD_CHAR_LIMIT = 1000;
const MAX_EMBED_FIELDS = 24;

// ตรวจสอบว่าเครื่อง online จริงโดยใช้ heartbeat 15 นาที
function isDeviceOnline(online: boolean, onlineTime: Date | null, now: Date): boolean {
  if (online) return true;
  if (!onlineTime) return false;
  return now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS;
}

// เลือกสี embed ตามจำนวน offline
function resolveColor(offline: number): number {
  if (offline === 0) return 0x22c55e;
  if (offline < CRITICAL_THRESHOLD) return 0xf59e0b;
  return 0xef4444;
}

// สร้าง progress bar แบบ ASCII ที่ Discord รองรับแน่นอน
function progressBar(rate: number): string {
  const filled = Math.round(rate / 10);
  return "[" + "#".repeat(filled) + "-".repeat(10 - filled) + "]";
}

// ดึง Discord error body จาก AxiosError เพื่อ debug
function extractDiscordError(err: unknown): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data;
    if (body) return `HTTP ${err.response?.status}: ${JSON.stringify(body)}`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

// GET handler — ดึงข้อมูลจาก DB แล้วส่ง Discord webhook
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "ไม่มีสิทธิ์เข้าถึง", message_en: "Unauthorized" }),
      { status: 401 },
    );
  }

  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MACHINE_MONITORING ?? "";
  if (!webhookUrl.startsWith("http")) {
    return NextResponse.json(
      errorResponse({ status: 503, message_th: "ยังไม่ได้ตั้งค่า Discord Webhook URL", message_en: "Discord Webhook URL not configured" }),
      { status: 503 },
    );
  }

  try {
    const now = new Date();
    const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

    const [allDevices, allSchools] = await Promise.all([
      prisma.deviceDailyStatus.findMany({
        select: {
          SchoolID: true,
          DeviceID: true,
          Online: true,
          OnlineTime: true,
          Login: true,
          AppName: true,
          AppVersion: true,
        },
      }),
      prisma.activeSchoolList.findMany({
        select: { nCompany: true, sCompany: true },
      }),
    ]);

    const schoolNameMap = new Map<number, string>(
      allSchools.map((s) => [
        s.nCompany,
        (s.sCompany ?? `โรงเรียน ${s.nCompany}`).replace(/^โรงเรียน/, "").trim(),
      ]),
    );

    let online = 0;
    let offline = 0;
    let login = 0;

    const offlineBySchool = new Map<
      number,
      { schoolName: string; devices: { appName: string; appVersion: string; deviceId: string }[] }
    >();

    for (const device of allDevices) {
      const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
      const isOnline = isDeviceOnline(device.Online, onlineTime, now);

      if (isOnline) {
        online++;
      } else {
        offline++;
        const schoolName = schoolNameMap.get(device.SchoolID) ?? String(device.SchoolID);
        const entry = offlineBySchool.get(device.SchoolID) ?? { schoolName, devices: [] };
        entry.devices.push({
          appName: device.AppName ?? "ไม่ระบุแอป",
          appVersion: device.AppVersion ?? "-",
          deviceId: device.DeviceID,
        });
        offlineBySchool.set(device.SchoolID, entry);
      }
      if (device.Login) login++;
    }

    const total = allDevices.length;
    const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);
    const statusLabel =
      offline === 0 ? "ปกติ" : offline < CRITICAL_THRESHOLD ? "ระวัง" : "วิกฤต";

    const summaryValue = [
      `ทั้งหมด: **${total}** เครื่อง`,
      `ออนไลน์: **${online}** เครื่อง`,
      `ออฟไลน์: **${offline}** เครื่อง`,
      `ใช้งานอยู่: **${login}** เครื่อง`,
      `อัตราออนไลน์: ${progressBar(onlineRate)} **${onlineRate}%**`,
    ].join("\n");

    const fields: { name: string; value: string; inline: boolean }[] = [
      { name: `สถานะระบบ: ${statusLabel}`, value: summaryValue, inline: false },
    ];

    if (offline > 0) {
      let currentValue = "";
      let fieldIndex = 1;
      const totalSchools = offlineBySchool.size;

      const flushField = (value: string, idx: number) => {
        if (fields.length >= MAX_EMBED_FIELDS) return;
        fields.push({
          name: idx === 1
            ? `เครื่องออฟไลน์ (${offline} เครื่อง / ${totalSchools} โรงเรียน)`
            : `เครื่องออฟไลน์ (ต่อ ${idx})`,
          value: value.trim() || "-",
          inline: false,
        });
      };

      for (const [schoolId, { schoolName, devices }] of Array.from(offlineBySchool.entries()).sort(([a], [b]) => a - b)) {
        if (fields.length >= MAX_EMBED_FIELDS) break;
        const lines = [`**${schoolName}** (${schoolId})`];
        for (const { appName, appVersion, deviceId } of devices) {
          lines.push(`- ${appName} v${appVersion} | ${deviceId}`);
        }
        const block = lines.join("\n") + "\n";
        const safeBlock = block.length > FIELD_CHAR_LIMIT
          ? block.slice(0, FIELD_CHAR_LIMIT - 4) + "...\n"
          : block;

        if (currentValue.length + safeBlock.length > FIELD_CHAR_LIMIT) {
          if (currentValue) {
            flushField(currentValue, fieldIndex++);
            currentValue = "";
          }
        }
        currentValue += safeBlock;
      }
      if (currentValue && fields.length < MAX_EMBED_FIELDS) {
        flushField(currentValue, fieldIndex);
      }
    } else {
      fields.push({
        name: "สถานะระบบ",
        value: "ทุกเครื่องออนไลน์ครบ ไม่มีปัญหาใดๆ",
        inline: false,
      });
    }

    const embed = {
      title: `รายงานสถานะเครื่อง POS - SchoolBright`,
      description: `เวลารายงาน: **${reportTime}**`,
      color: resolveColor(offline),
      fields,
      footer: { text: "SchoolBright Helper | POS Status Alert" },
      timestamp: new Date().toISOString(),
    };

    const discordPayload: Record<string, unknown> = { embeds: [embed] };
    if (offline >= CRITICAL_THRESHOLD) {
      discordPayload.content = "@here มีเครื่องออฟไลน์เกินเกณฑ์วิกฤต!";
    }

    await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json(
      successResponse({
        data: { total, online, offline, online_rate: onlineRate },
        message_th: "ส่งรายงานสถานะ POS ไปยัง Discord สำเร็จ",
        message_en: "POS status alert sent to Discord successfully",
      }),
    );
  } catch (err: unknown) {
    const message = extractDiscordError(err);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงานสถานะ POS",
        message_en: "Failed to send POS status alert",
        error: message,
      }),
      { status: 500 },
    );
  }
}
