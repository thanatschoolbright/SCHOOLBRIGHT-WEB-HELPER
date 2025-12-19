import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { API_URL } from "@/services/api-url";

interface FacialScanRequest {
  school_id: string;
  user_code: string;
  s_id: string;
  version: string;
}

const JABJAI_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjIyNTAiLCJlbWFpbCI6IjIyNTBfODQ5XzBAc2Nob29sYnJpZ2h0LmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3Bvc3RhbGNvZGUiOiI4NDkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMjMwMzM2IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvaGFzaCI6IjAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiIxMi8yMi8yMDI1IDU6MDQ6MzAgUE0iLCJuYmYiOjE3NjYwNzc0NzAsImV4cCI6MTc2NjQyMzA3MCwiaWF0IjoxNzY2MDc3NDcwfQ.KUxHL2df_Yg04IaFE2UVQuMQRFzQLF9tyTNd3sQ-2sA";

function createExternalPayload(body: FacialScanRequest) {
  return {
    schoolId: body.school_id,
    UserCode: body.user_code,
    sID: body.s_id,
    version: body.version,
  };
}

function formatApiResponse(apiData: any) {
  const dataArray = Array.isArray(apiData) ? apiData : [apiData];

  const formattedData = dataArray.map((item: any) => ({
    n_log_scan_id: item.nLogScanID,
    log_time: item.LogTime,
    log_type: item.LogType,
    log_scan_status: item.LogScanStatus,
    log_n_day: item.LognDay,
    log_date: item.LogDate,
    n_year: item.nYear,
    s_name: item.sName,
    sex: item.Sex,
    picture: item.pictuer,
    pic_update: item.picupdate,
    pic_version: item.picversion,
    user_id: item.UserID,
    result_status: item.ResultStatus,
    error_message: item.ErrorMessage,
    desc: item.Desc,
    nfc_encrypt: item.NFCEncrypt,
    user_code: item.UserCode,
  }));

  return {
    status_code: 200,
    user_data: null,
    raw_data: formattedData,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FacialScanRequest = await request.json();

    if (!body.school_id || !body.s_id || !body.user_code) {
      return NextResponse.json(
        { message: "Missing required fields (school_id, s_id, user_code)" },
        { status: 400 }
      );
    }

    const externalUrl = `${API_URL.PROD_HARDWARE_API_URL}/api/jobscan/Timestamp`;
    const headerKey = `JabjaiKey-849-${body.s_id}`;
    const payload = createExternalPayload(body);

    const response = await axios.post(externalUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        [headerKey]: JABJAI_TOKEN,
      },
    });

    const clientResponse = formatApiResponse(response.data);

    return NextResponse.json(successResponse({ data: clientResponse }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Hardware API Error:", error.response?.data || error.message);

    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: 500,
        error: null,
      }),
      { status: 500 }
    );
  }
}
