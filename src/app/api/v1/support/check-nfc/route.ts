import { NextRequest, NextResponse } from "next/server";
import axios from "axios"
import { API_URL } from "@/services/api-url";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const SchoolID = searchParams.get("SchoolID");
  const NFC = searchParams.get("NFC");

  if (!SchoolID || !NFC) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const apiUrl = `${API_URL.PROD_PAYMENT_API_URL}/api/shop/user/getuserinfo?SchoolID=${SchoolID}&NFC=${NFC}`;
    const curlCommand = `curl --location '${apiUrl}'`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    return NextResponse.json({
      data: response.data,
      curl: curlCommand,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Internal Server Error" },
      { status: err.response?.status || 500 }
    );
  }
}
