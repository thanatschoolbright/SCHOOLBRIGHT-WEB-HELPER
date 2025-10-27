import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@helpers/api/response";
import { API_CLIENT_WITH_REFRESH_TOKEN } from "@/services/axios-instance/sb-refresh-token.axios";

// Type Definition
export type LevelDto = {
  id: number;
  name: string | null;
  lastname: string | null;
  sex: string | null;
  value: string | null;
  name_en: string | null;
  name_th: string | null;
  type: string | null;
  school_id: number;
  image: string | null;
  token: string | null;
  desc: string | null;
  status_code: number;
};

// Config
const TARGET = "https://sbapi.schoolbright.co/api/sublevel/getLevel/849";

// Helper: แปลงข้อมูล
const mapToDto = (item: any): LevelDto => ({
  id: item.ID,
  name: item.name,
  lastname: item.lastname,
  sex: item.sex,
  value: item.Value,
  name_en: item.NameEN,
  name_th: item.NameTH,
  type: item.Type,
  school_id: item.SchoolId,
  image: item.image,
  token: item.token,
  desc: item.Desc,
  status_code: item.StatusCode,
});

// Helper: ดึงข้อมูลจาก response
const extractData = (response: any): any[] => {
  return Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];
};

// API Route
export async function POST(request: NextRequest) {
  try {
    const apiClient = await API_CLIENT_WITH_REFRESH_TOKEN(); // เพิ่ม await
    const response = await apiClient.get(TARGET);

    const rawData = extractData(response);
    const mappedData = rawData.map(mapToDto);

    return Response.json(
      successResponse({
        data: mappedData,
        status: response.status,
      })
    );
  } catch (error: any) {
    console.error("API Error:", error.message);

    return Response.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: error?.response?.status || 500,
        error,
      }),
      { status: error?.response?.status || 500 }
    );
  }
}
