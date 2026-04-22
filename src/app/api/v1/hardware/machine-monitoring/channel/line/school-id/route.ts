import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import {
  buildDeviceStatusReport,
  linePushMessage,
} from "@services/line/line-push.service";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { getSchoolGroup } from "./_service/get-school-id.service";

// ✨ GET handler — ดึงข้อมูลกลุ่ม LINE ทั้งหมดจาก Jabjai Master DB
export async function GET(request: NextRequest) {
  try {
    const data = await getSchoolGroup();

    return NextResponse.json(
      successResponse({
        data: data,
        message_th: "ดึงข้อมูลกลุ่ม LINE สำเร็จ",
        message_en: "Successfully fetched LINE group data",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงาน LINE",
        message_en: "Failed to send LINE report",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}
