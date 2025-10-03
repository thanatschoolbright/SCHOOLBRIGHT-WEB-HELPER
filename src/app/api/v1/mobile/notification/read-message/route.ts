import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@services/api-url";
import { getHeaders } from "@services/api-header";
import { sanitizeForwardHeaders } from "@/services/api-header";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headers = sanitizeForwardHeaders(request);
    const user_id = searchParams.get("user_id");
    const message_id = searchParams.get("message_id");
    const apiUrl = `${API_URL.PROD_SB_API_URL}`;
    // const endpoint = `/api/LetterDetail?userid=${user_id}&messageID=${message_id}`;
    const endpoint = `/api/messagebox/ReadMessag/${user_id}/${message_id}?lang=th`;

    const callAPI = apiUrl + endpoint;
    const curlHeader = `--header 'Content-Type: application/json'`;
    const curlCommand = `curl --location ${curlHeader} \ '${callAPI}' `;

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
    return NextResponse.json(
      {
        message: error.message || "Internal Server Error",
        raw: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}
