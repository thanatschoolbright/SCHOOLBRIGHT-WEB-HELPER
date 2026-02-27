import { errorResponse, successResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import { Service } from "@/services/backend/timesheet/report/not-entry/today.service";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// ==========================================
// CONFIGURATIONS & MAPPINGS
// ==========================================

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_TIMESHEET_SYSTEM || "";

const TARGET_POSITIONS = [
  "Developer",
  "Tester",
  "Quality Assurance",
  "ADMIN",
  "Business Development",
  "Business Analyst",
  "System Analyst",
  "UX/UI",
  "UXUI",
];

// Map Roles -> Discord Role ID
const ROLE_MAP: Record<string, string> = {
  Tester: "<@&1344136247135703092>",
  "Quality Assurance": "<@&1344136247135703092>",
  Developer: "<@&1344137483901993131>",
  "UX/UI": "<@&1344137746515492905>",
  UXUI: "<@&1344137746515492905>",
  "System Analyst": "<@&1344139128702242877>",
  SystemAnalyst: "<@&1344139128702242877>",
  "Business Analyst": "<@1424599602358784031>",
};

// Map Admin ID -> Discord User ID
const USER_TAG_MAP: Record<number, string> = {
  2: "<@692371893826879568>",
  10: "<@1347719592780238979>",
  23: "<@1293755432484999211>",
  57: "<@692372441699319900>",
  133: "<@376432228886118400>",
  142: "<@400231526270500874>",
  143: "<@250628114504220672>",
  144: "<@637607266048016384>",
  145: "<@341535710043701249>",
  147: "<@618000571030568990>",
  148: "<@376432228886118400>",
  156: "<@431107453082533898>",
  157: "<@701791555085926402>",
  158: "<@1074331797279756328>",
  160: "<@1420709950488838208>",
  996: "<@1074331797279756328>",
};

// Helper for formatting logic
const getStatusConfig = (status: string) => {
  if (status === "ไม่ได้กรอกเลย") {
    return {
      title: "Missing Entry",
      color: 0xed4245, // Red
      desc: "No timesheet entry found for today.",
    };
  }
  return {
    title: "Incomplete Hours",
    color: 0xfaa61a, // Orange/Yellow
    desc: "Logged hours are less than 8 hours.",
  };
};

// ==========================================
// ROUTE HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------
    // 0. Parse Request Body (Check Mode)
    // ------------------------------------------------------------------
    const body = await request.json();
    const mode = body.mode || "report"; // Default to 'report' if missing

    logger.info(`[Timesheet Report] Processing request with mode: ${mode}`);

    // ------------------------------------------------------------------
    // 1. Fetch Timesheet Data (Parallel)
    // ------------------------------------------------------------------
    const [notEntryIds, incompleteEntries] = await Promise.all([
      Service.getUnsubmittedUserIds(),
      Service.getIncompleteUsers(),
    ]);

    // ------------------------------------------------------------------
    // 2. Fetch Users from External API
    // ------------------------------------------------------------------
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const { data: userRes } = await axios.get(`${API_URL}/api/v1/admin/user/`);
    const allUsers = Array.isArray(userRes?.data?.data)
      ? userRes.data.data
      : [];

    // ------------------------------------------------------------------
    // 3. Filter Target Users
    // ------------------------------------------------------------------
    const targetUsers = allUsers.filter((user: any) =>
      TARGET_POSITIONS.includes(user.position),
    );

    // ------------------------------------------------------------------
    // 4. Map & Analyze Data
    // ------------------------------------------------------------------
    const resultList: any[] = [];

    targetUsers.forEach((user: any) => {
      const userId = user.admin_id;

      // Case A: Missing Entry
      if (notEntryIds.includes(userId)) {
        resultList.push({
          ...user,
          status: "ไม่ได้กรอกเลย",
          total_hours: 0,
        });
        return;
      }

      // Case B: Incomplete
      const incompleteEntry = incompleteEntries.find(
        (e) => e.user_id === userId,
      );
      if (incompleteEntry) {
        resultList.push({
          ...user,
          status: "กรอกไม่ครบ",
          total_hours: incompleteEntry.total_hours,
        });
      }
    });

    // ------------------------------------------------------------------
    // 5. Send Discord Notification (ONLY IF MODE IS 'discord')
    // ------------------------------------------------------------------
    if (mode === "discord" && resultList.length > 0 && WEBHOOK_URL) {
      logger.info(
        `[Discord] Mode is 'discord'. Preparing to send ${resultList.length} notifications...`,
        { count: resultList.length },
      );

      // 5.1 Build Embed Objects (Modern Style)
      const embeds = resultList.map((user) => {
        const roleMention =
          ROLE_MAP[user.position] || `${user.position}` || "-";
        const userTag = USER_TAG_MAP[user.admin_id] || "";
        const config = getStatusConfig(user.status);
        const userName = `${user.firstname} ${user.lastname} (${
          user.nickname || "-"
        })`;

        return {
          color: config.color,
          author: {
            name: userName,
          },
          title: config.title,
          description: config.desc,
          fields: [
            {
              name: "Position",
              value: roleMention,
              inline: true,
            },
            {
              name: "Logged Hours",
              value: `**${user.total_hours} hrs**`,
              inline: true,
            },
            {
              name: "Direct Contact",
              value: userTag ? `${userTag}` : `${user.email}`,
              inline: false, // Force new line
            },
          ],
          footer: {
            text: "Automated Timesheet Police System",
          },
          timestamp: new Date().toISOString(),
        };
      });

      // 5.2 Batching (10 embeds per request)
      const batches = [];
      for (let i = 0; i < embeds.length; i += 10) {
        batches.push(embeds.slice(i, i + 10));
      }

      const dateStr = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const headerContent = `**Timesheet Police Report** \n**Date:** ${dateStr}\n**Attention:** @here`;

      // 5.3 Send Batches
      for (const [index, batch] of batches.entries()) {
        try {
          await axios.post(WEBHOOK_URL, {
            content: index === 0 ? headerContent : undefined,
            embeds: batch,
          });

          logger.info(
            `[Discord] Batch ${index + 1}/${batches.length} sent successfully.`,
          );
        } catch (err: any) {
          logger.error(`[Discord] Failed to send batch ${index + 1}`, {
            error: err.message,
            stack: err.stack,
            response: err.response?.data,
          });
        }
      }
    } else {
      logger.info(
        `[Timesheet Report] Skipping Discord notification. Mode: ${mode}, Result Count: ${resultList.length}`,
      );
    }

    // ------------------------------------------------------------------
    // 6. Return Response
    // ------------------------------------------------------------------
    return NextResponse.json(
      successResponse({
        data: resultList,
        message_th: `ทำงานสำเร็จ (Mode: ${mode}) พบผู้ที่ยังไม่ลงเวลาหรือลงไม่ครบ ${resultList.length} คน`,
        message_en: `Operation successful (Mode: ${mode}). Found ${resultList.length} users with missing or incomplete timesheets`,
      }),
    );
  } catch (error: any) {
    logger.error("Not Entry Report Error", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(errorResponse({ error }));
  }
}
