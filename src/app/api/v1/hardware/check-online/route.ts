import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { API_URL } from "@/services/api-url";
import { CallPostOnlineDevice } from "@stores/type";
import { DeviceDailyStatusService } from "@services/backend/device-daily-status.service";
import { DeviceDailyStatus } from "generated/prisma";
import { RequestDeviceDailyStatusTypes } from "@/types/device-daily-status.types";
import { sanitizeForwardHeaders } from "@/services/api-header";

export async function POST(NextRequest: NextRequest) {
  const { SchoolID, DeviceID } = await NextRequest.json();
  try {
    const headers = sanitizeForwardHeaders(NextRequest);

    const endpoint = `/api/device/status/registeronline`;
    const apiUrl = `${API_URL.PROD_PAYMENT_API_URL}` + `${endpoint}`;
    const curlHeader = `--header 'Content-Type: application/json'`;
    const curlData = `--data '{
      "SchoolID" : ${SchoolID},
      "DeviceID": "${DeviceID}",
      "Status": "Online"
    }'`;
    const curlCommand = `curl --location ${curlHeader} \ '${apiUrl}' \ ${curlData}`;

    const payload: CallPostOnlineDevice["draftValues"] = {
      SchoolID: SchoolID,
      DeviceID: DeviceID,
      Status: "Online",
    };
    const responseFromAPI = await axios.post(apiUrl, payload, {
      headers,
    });

    return NextResponse.json({
      data: responseFromAPI.data,
      curl: curlCommand,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Internal Server Error",
        status: error.response?.status || 500,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const deviceId = searchParams.get("deviceId");
  const limit = searchParams.get("limit") || "10";

  if (!schoolId && !deviceId) {
    return NextResponse.json({
      message: "Missing schoolId or deviceId parameter",
      status: 400,
      data: [],
    });
  }

  const defaultRequest: RequestDeviceDailyStatusTypes = {
    schoolId: schoolId || "",
    deviceId: deviceId || "",
    limit: limit,
  };

  try {
    let data: DeviceDailyStatus[] = [];

    data = await DeviceDailyStatusService.findByDeviceIdOrSchoolId(
      defaultRequest
    );

    return NextResponse.json({
      status: 200,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
