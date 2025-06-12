import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { API_URL } from "@/services/api-url";

export async function POST(request: NextRequest) {
  const { SchoolID, sID, sID2, sSellID } = await request.json();

  const data = {
    SchoolID,
    sID,
    sID2,
    sSellID,
  };

  if (!SchoolID || !sID || !sID2 || !sSellID) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const apiUrl = `${API_URL.PROD_PAYMENT_API_URL}/api/support/sales/cancelsales`;
    const curlHeader = `--header 'Content-Type: application/json'`;
    const curlData = `--data '{
      "SchoolID" : ${SchoolID},
      "sID": ${sID},
      "sID2": ${sID2},
      "sSellID": ${sSellID}
    }'`;
    const curlCommand = `curl --location ${curlHeader} \ '${apiUrl}' \ ${curlData}`;

    // ถูกต้อง: ตัวแรกคือ URL, ตัวที่สองคือ body, ตัวที่สามคือ config
    const responseFromAPI = await axios.post(apiUrl, data, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json({
      data: responseFromAPI.data,
      curl: curlCommand,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Internal Server Error" },
      { status: err.response?.status || 500 }
    );
  }
}
