import { convertToCurl } from "@/helpers/api/convert-to-curl";
import { sanitizeForwardHeaders } from "@/services/api-header";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import https from "https";
import { NextRequest, NextResponse } from "next/server";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = sanitizeForwardHeaders(request);
  const user_id = searchParams.get("user_id");
  const page = searchParams.get("page");
  const apiUrl = `${API_URL.PROD_SB_API_URL}`;
  const endpoint = `/api/v2/internal/leave-letter?userid=${user_id}/${page}`;
  const callAPI = apiUrl + endpoint;
  const curlCommand = convertToCurl(apiUrl, endpoint);
  try {
    const responseFromAPI = await axios.get(callAPI, {
      headers,
      httpsAgent: agent,
    });

    return NextResponse.json(
      { data: responseFromAPI.data, curl: curlCommand },
      {
        status: responseFromAPI.status,
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Internal Server Error",
        status: error.response?.status || 500,
      },
      { status: error.response?.status || 500 },
    );
  }
}
