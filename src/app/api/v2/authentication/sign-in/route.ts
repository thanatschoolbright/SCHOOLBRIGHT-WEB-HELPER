import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { sanitizeForwardHeaders } from "@/services/api-header";
import axios from "axios";
import FormData from "form-data";
import { apiLog } from "@helpers/api/api.log";

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.formData();
    const username = body.get("username") as string;
    const password = body.get("password") as string;
    const apiUrl = `${API_URL.PROD_ADMIN_JABJAI_API_URL}`;
    const endpoint = `/api/v2/auth/login`;
    const headers = sanitizeForwardHeaders(request);
    delete headers["content-type"];

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const callAPI = apiUrl + endpoint;

    const responseFromAPI = await axios.post(callAPI, formData, {
      headers: { ...formData.getHeaders() },
    });

    return NextResponse.json({
      success: responseFromAPI.data.success,
      token: responseFromAPI.data.token,
      user_data: responseFromAPI.data.user_data,
    });
  } catch (error: any) {
    return NextResponse.json({
      message: error.message || "Internal Server Error",
      status: error.response?.status || 500,
    });
  }
}

export const POST = apiLog(handler);
