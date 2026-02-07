import { errorResponse, successResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { Service as EntryTimesheetService } from "@/services/backend/timesheet/entry.service";
import { NextResponse } from "next/server";
import { generateDescriptionWithChatGPT } from "./chatgpt";
import { generateDescriptionWithGemini } from "./gemini";

/**
 * แยกชั่วโมงออกเป็นส่วนเล็กๆ (เช่น 2, 4, 3) เพื่อความเป็นธรรมชาติ
 */
function splitHoursToChunks(total: number): number[] {
  if (total <= 3) return [total];
  const chunks: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    if (remaining <= 4) {
      chunks.push(remaining);
      break;
    }
    // สุ่มระหว่าง 2 - 4 ชม.
    const chunk = Math.floor(Math.random() * 3) + 2;
    chunks.push(chunk);
    remaining -= chunk;
  }
  return chunks;
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    user_id,
    hours,
    date,
    engine = "gemini",
    projectId: targetProjectId,
    subProjectId: targetSubProjectId,
  } = body;
  const dates: (string | Date)[] = Array.isArray(date)
    ? date
    : [date].filter(Boolean);

  if (!user_id || !hours || !dates.length) {
    logger.warn("[automate-fill] missing required fields", {
      user_id,
      hours,
      dates_length: dates.length,
    });
    return NextResponse.json(
      errorResponse({
        status: 400,
        message_en: "user_id, hours and date are required",
        message_th: "กรุณาระบุ user_id, ชั่วโมง และวันที่",
      }),
      { status: 400 },
    );
  }

  try {
    logger.info("[automate-fill] fetching history and metadata", { user_id });

    // Fetch project/feature names if target IDs are provided
    let targetProjectName = "";
    let targetFeatureName = "";

    if (targetProjectId && targetSubProjectId) {
      const [project, feature] = await Promise.all([
        PrismaTimesheet.project.findUnique({
          where: { id: Number(targetProjectId) },
          select: { name: true },
        }),
        PrismaTimesheet.feature.findUnique({
          where: { id: Number(targetSubProjectId) },
          select: { name: true },
        }),
      ]);
      targetProjectName = project?.name || "";
      targetFeatureName = feature?.name || "";
    }

    const userInfomation = await EntryTimesheetService.findAll({
      user_id: Number(user_id),
      limit: 20,
    });
    const history = userInfomation.items || [];

    const useGemini = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
    const createdEntries = [];
    const status = "IN_PROGRESS";

    logger.info("[automate-fill] start creating timesheets", {
      user_id,
      dates: dates.length,
      useGemini,
      status,
      targetProjectName,
      targetFeatureName,
    });

    for (const rawDate of dates) {
      // Split hours into chunks
      const hourChunks = splitHoursToChunks(Number(hours));

      for (const chunkHour of hourChunks) {
        let projectId = targetProjectId;
        let subProjectId = targetSubProjectId;
        let projectName = targetProjectName;
        let featureName = targetFeatureName;

        // Fallback to random history if target not provided
        if (!projectId || !subProjectId) {
          if (!history.length) {
            return NextResponse.json(
              errorResponse({
                status: 404,
                message_en: "No timesheet history for this user",
                message_th:
                  "ไม่พบประวัติการกรอก Timesheet และไม่ได้ระบุเป้าหมาย",
              }),
              { status: 422 },
            );
          }
          const randomEntry =
            history[Math.floor(Math.random() * history.length)] || history[0];
          projectId = randomEntry.projectId;
          subProjectId =
            randomEntry.feature?.id ??
            (randomEntry as any).featureId ??
            (randomEntry as any).subProjectId;
          projectName = randomEntry.project?.name || "";
          featureName = randomEntry.feature?.name || "";
        }

        if (!projectId || !subProjectId) {
          logger.error("[automate-fill] missing project/sub-project", {
            projectId,
            subProjectId,
          });
          continue;
        }

        let description = "";

        if (engine === "chatgpt") {
          description = await generateDescriptionWithChatGPT({
            history,
            projectName,
            featureName,
            fallback: `Working on ${featureName} in project ${projectName}`,
          });
        } else {
          description = await generateDescriptionWithGemini({
            history,
            projectName,
            featureName,
            fallback: `Working on ${featureName} in project ${projectName}`,
          });
        }

        const created = await EntryTimesheetService.create({
          description,
          createdBy: Number(user_id),
          projectId: Number(projectId),
          subProjectId: Number(subProjectId),
          date: new Date(rawDate),
          hour: chunkHour,
          status,
        });

        createdEntries.push({
          id: created.id,
          date: rawDate,
          hour: chunkHour,
          description: created.description,
          project: projectName,
          feature: featureName,
        });

        logger.info("[automate-fill] created entry chunk", {
          date: rawDate,
          hour: chunkHour,
          projectId,
          subProjectId,
        });
      }
    }

    logger.info("[automate-fill] completed", {
      created: createdEntries.length,
      user_id,
    });

    return NextResponse.json(
      successResponse({
        data: {
          items: createdEntries,
          engine,
          total: createdEntries.length,
        },
      }),
    );
  } catch (error: unknown) {
    logger.error("[automate-fill] failed", error);
    return NextResponse.json(
      errorResponse({
        message_en: error instanceof Error ? error.message : "Unknown error",
        message_th: "เกิดข้อผิดพลาดในการบันทึกข้อมูลอัตโนมัติ",
      }),
    );
  }
}
