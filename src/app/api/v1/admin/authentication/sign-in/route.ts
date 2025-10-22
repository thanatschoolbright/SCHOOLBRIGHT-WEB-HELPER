import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { sanitizeForwardHeaders } from "@/services/api-header";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { RequestLoginAdmin } from "@/stores/type";

export async function POST(request: NextRequest) {
  try {
    const { username, password }: RequestLoginAdmin["draftValues"] =
      await request.json();
    const apiUrl = `${API_URL.PROD_ADMIN_JABJAI_API_URL}`;
    const endpoint = `/api/auth/login`;
    const parameter = `?username=${username}&password=${password}`;
    const callAPI = apiUrl + endpoint + parameter;
    const headers = sanitizeForwardHeaders(request);

    const payload = {
      username: username,
      password: password,
    };

    const responseFromAPI = await axios.post(callAPI, {}, {});

    return NextResponse.json({
      status: responseFromAPI.status,
      data: responseFromAPI.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      message: error.message || "Internal Server Error",
      status: error.response.status || 500,
    });
  }
}
