import { NextRequest, NextResponse } from "next/server";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";
import { CallPostOnlineDevice } from "@stores/type";

export async function POST(NextRequest: NextRequest) {
  const { SchoolID, DeviceID } = await NextRequest.json();
  try {
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
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      data: responseFromAPI.data,
      curl: curlCommand,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
