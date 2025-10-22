import { NextRequest, NextResponse } from "next/server";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolID = searchParams.get("school_id");
    const apiUrl = `${API_URL.PROD_PAYMENT_API_URL}/api/offline/school/getuserlist?SchoolID=${schoolID}`;

    const responseFromAPI = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      data: responseFromAPI?.data,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
