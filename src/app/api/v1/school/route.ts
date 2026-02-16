import { API_URL } from "@/services/api-url";
import axios from "axios";
import { NextResponse } from "next/server";

// --- High Performance Cache Implementation ---
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (School list doesn't change often)
let cachedData: any = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();

  // ตรวจสอบ Cache ก่อน
  if (cachedData && now - lastFetchTime < CACHE_TTL) {
    return NextResponse.json(cachedData, { status: 200 });
  }

  try {
    const apiUrl = `${API_URL.PROD_SB_API_URL}/api/school`;

    const responseFromAPI = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = {
      data: responseFromAPI.data,
    };

    // อัปเดต Cache
    cachedData = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
