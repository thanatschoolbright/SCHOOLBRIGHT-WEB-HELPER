import { NextRequest, NextResponse } from "next/server";
import { MyWorkService } from "@/services/timesheet/my-work.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "user_id is required" },
        { status: 400 }
      );
    }

    const data = await MyWorkService.findMyWork(Number(userId));

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("[MY_WORK_API_ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
