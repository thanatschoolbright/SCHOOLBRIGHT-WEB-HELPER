import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { getHeaders } from "@/services/api-header";
import { sanitizeForwardHeaders } from "@/services/api-header";
import https from "https";
import { convertToCurl } from "@/helpers/api/convert-to-curl";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = sanitizeForwardHeaders(request);
  const user_id = searchParams.get("user_id");
  const page = searchParams.get("page");
  const apiUrl = `${API_URL.PROD_SB_API_URL}`;
  const endpoint = `/api/LeaveLetterList?userid=${user_id}/${page}`;
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
      }
    );
  } catch (error: any) {
    const ERROR = {
      message: error.message || "Internal Server Error",
      raw: error.response?.data || null,
      curl: curlCommand,
    };
    const status = 200;
    console.error(ERROR);
    return NextResponse.json(ERROR, { status });
  }
}
