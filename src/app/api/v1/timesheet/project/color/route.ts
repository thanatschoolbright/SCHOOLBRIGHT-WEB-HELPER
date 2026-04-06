import { errorResponse, successResponse } from "@helpers/api/response";
import { handleError } from "@helpers/controller/handle-error.params";
import { Service } from "@services/backend/timesheet/project.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ColorSchema = z.object({
  project_id: z.number().int().positive(),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "รูปแบบสีไม่ถูกต้อง").optional(),
  color_hex_feature: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "รูปแบบสีไม่ถูกต้อง").optional(),
});

/**
 * PATCH /api/v1/timesheet/project/color
 * อัปเดตสีโครงการ (color_hex = สีโครงการหลัก, color_hex_feature = สีโครงการย่อย)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ColorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid request body",
          message_th: `ข้อมูลไม่ถูกต้อง: ${parsed.error.errors[0]?.message}`,
          status: 400,
        }),
        { status: 400 },
      );
    }

    const { project_id, color_hex, color_hex_feature } = parsed.data;

    if (!color_hex && !color_hex_feature) {
      return NextResponse.json(
        errorResponse({
          message_en: "At least one color field is required",
          message_th: "ต้องระบุ color_hex หรือ color_hex_feature อย่างน้อยหนึ่งฟิลด์",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const updated = await Service.update(project_id, {
      ...(color_hex !== undefined && { colorHex: color_hex }),
      ...(color_hex_feature !== undefined && { colorHexFeature: color_hex_feature }),
    });

    return NextResponse.json(
      successResponse({
        data: updated,
        status: 200,
        message_en: "Project color updated",
        message_th: "อัปเดตสีโครงการสำเร็จ",
      }),
      { status: 200 },
    );
  } catch (err: any) {
    return handleError(err, "PATCH /api/v1/timesheet/project/color error");
  }
}
