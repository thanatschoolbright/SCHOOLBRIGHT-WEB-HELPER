import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/services/timesheet/project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json(successResponse({ data: [] }));
    }

    const result = await ProjectService.searchSubProject(query);

    return NextResponse.json(successResponse({ data: result }));
  } catch (error: any) {
    return NextResponse.json(errorResponse({ error }));
  }
}
