import { auth } from "@/auth";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextResponse } from "next/server";

// บันทึก logout log ลง api_log ก่อนที่ NextAuth จะทำลาย session
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ status: 401 }, { status: 401 });
  }

  const userId = (session.user as any).id;

  PrismaTimesheet.apiLog.create({
    data: {
      request_time: new Date(),
      method: "POST",
      endpoint: "AUTH_LOGOUT",
      service_name: "authentication",
      status_code: 200,
      is_success: true,
      called_by: String(userId),
    },
  }).catch(() => undefined);

  return NextResponse.json({ success: true }, { status: 200 });
}
