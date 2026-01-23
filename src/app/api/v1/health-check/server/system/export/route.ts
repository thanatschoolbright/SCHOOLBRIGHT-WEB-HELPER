import { NextRequest, NextResponse } from "next/server";
import { ServerStatusExportService } from "../service/export.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid data provided" },
        { status: 400 },
      );
    }

    const excelBuffer = await ServerStatusExportService.generateExcel(data);
    const fileName = ServerStatusExportService.generateFileName();

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          fileName,
        )}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("Export Server Status Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
