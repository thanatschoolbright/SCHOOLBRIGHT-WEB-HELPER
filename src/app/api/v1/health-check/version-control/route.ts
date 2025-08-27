import { NextResponse } from "next/server";
import { callWithLogging } from "@helpers/call-with-logging";

export async function GET() {
  const endpoint = `https://raw.githubusercontent.com/Jabjai-Corporation/meta-version/refs/heads/main/system.version.json`;
  const fullURL = `${endpoint}`;

  try {
    const response = await callWithLogging(
      {
        method: "GET",
        url: fullURL,
      },
      {}
    );

    return NextResponse.json(
      {
        data: response.data,
      },
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      {
        message: error.message || "Internal Server Error",
        raw: error.response?.data || null,
      },
      { status: statusCode }
    );
  }
}
