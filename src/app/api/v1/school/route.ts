import { NextRequest, NextResponse } from "next/server";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";

export async function GET() {
  try {
    const apiUrl = `${API_URL.PROD_SB_API_URL}/api/school`;

    const responseFromAPI = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      data: responseFromAPI.data,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
