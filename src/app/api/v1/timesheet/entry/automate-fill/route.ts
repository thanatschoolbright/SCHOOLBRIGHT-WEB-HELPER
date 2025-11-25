import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { Service as EntryTimesheetService } from "@/services/backend/timesheet/entry.service";
import { generateDescriptionWithGemini } from "./gemini";
import { STATUS_OPTIONS } from "@/constants/timesheet.constants";
import { logger } from "@/helpers/logger";

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, hours, date } = body;
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
      { status: 400 }
    );
  }

  try {
    logger.info("[automate-fill] fetching history", { user_id });
    const userInfomation = await EntryTimesheetService.findAll({
      user_id: Number(user_id),
      limit: 20,
    });
    const history = userInfomation.items || [];

    if (!history.length) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_en: "No timesheet history for this user",
          message_th: "ไม่พบประวัติการกรอก Timesheet ของผู้ใช้นี้",
        }),
        { status: 404 }
      );
    }

    const useGemini = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
    const createdEntries = [];

    const randomStatus =
      STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)]
        ?.value || "DRAFT";

    logger.info("[automate-fill] start creating timesheets", {
      user_id,
      dates: dates.length,
      useGemini,
      randomStatus,
      history_sample: history.slice(0, 3).map((h) => h.id ?? h),
    });

    for (const rawDate of dates) {
      const randomEntry =
        history[Math.floor(Math.random() * history.length)] || history[0];
      const subProjectId =
        randomEntry.feature?.id ??
        (randomEntry as any).featureId ??
        (randomEntry as any).subProjectId;

      if (!randomEntry.projectId || !subProjectId) {
        logger.error("[automate-fill] missing project/sub-project", {
          randomEntry,
        });
        return NextResponse.json(
          errorResponse({
            status: 422,
            message_en: "Cannot determine project/sub-project from history",
            message_th: "ไม่สามารถระบุโปรเจกต์หรือซับโปรเจกต์จากประวัติได้",
          }),
          { status: 422 }
        );
      }

      const description = useGemini
        ? await generateDescriptionWithGemini({
            history,
            fallback: randomEntry?.description,
          })
        : randomEntry?.description ||
          `Auto fill timesheet ${new Date().toLocaleDateString()}`;

      const created = await EntryTimesheetService.create({
        description,
        createdBy: Number(user_id),
        projectId: randomEntry.projectId,
        subProjectId,
        date: new Date(rawDate),
        hour: Number(hours),
        status: randomStatus,
      });

      createdEntries.push(created);
      logger.info("[automate-fill] created entry", {
        date: rawDate,
        projectId: randomEntry.projectId,
        subProjectId,
        status: randomStatus,
      });
    }

    logger.info("[automate-fill] completed", {
      created: createdEntries.length,
      user_id,
    });

    return NextResponse.json(successResponse({ data: createdEntries }));
  } catch (error: unknown) {
    logger.error("[automate-fill] failed", error);
    return NextResponse.json(
      errorResponse({
        message_en: error instanceof Error ? error.message : "Unknown error",
        message_th: "เกิดข้อผิดพลาด",
        error,
      })
    );
  }
}
