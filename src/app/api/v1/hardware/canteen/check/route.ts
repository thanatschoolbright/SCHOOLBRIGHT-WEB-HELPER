import { API_URL } from "@/services/api-url";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("app_id");
    const currentVer = searchParams.get("current_ver") || "";
    const versionName = searchParams.get("version_name");
    const schoolId = searchParams.get("SchoolID");

    if (!appId || !versionName || !schoolId) {
      return NextResponse.json(
        { message: "app_id, version_name, and SchoolID are required" },
        { status: 400 },
      );
    }

    const apiUrl = API_URL.PROD_HARDWARE_API_URL;
    const endpoint = "/api/v2/applications/version-control/check";
    const fullURL = `${apiUrl}${endpoint}`;

    const queryParams = {
      app_id: appId,
      current_ver: currentVer,
      version_name: versionName,
      SchoolID: schoolId,
    };

    const response = await axios.get(fullURL, {
      params: queryParams,
      timeout: 10000,
    });

    const curlCommand = convertToCurl(apiUrl, endpoint, "GET", queryParams);

    return NextResponse.json(
      {
        data: response.data,
        curl: curlCommand,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      "[ERROR] Error in GET /api/v1/hardware/canteen/check:",
      error,
    );

    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.message || error.message || "Internal Server Error";

    return NextResponse.json(
      {
        message: errorMessage,
        raw: error.response?.data || null,
        details: error.toString(),
      },
      { status: statusCode },
    );
  }
}
