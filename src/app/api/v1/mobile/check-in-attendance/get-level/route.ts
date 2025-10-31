import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@helpers/api/response";
import { API_CLIENT_WITH_REFRESH_TOKEN } from "@/services/axios-instance/sb-refresh-token.axios";
import { API_URL } from "@services/api-url";
import z from "zod";
import { validateRequest } from "@helpers/api/validate.request";

// Type Definition
export type ResponseGetLevel = {
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

export type RequestGetLevel = {
  school_id: string | number;
};

// Helper: แปลงข้อมูล
const mapToDto = (item: any): ResponseGetLevel => ({
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

// Validation Schema
const validator = z.object({
  school_id: z.string().min(1, "school_id is required"),
});

// API Route
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, validator);
  if (error) return error;

  try {
    const apiClient = await API_CLIENT_WITH_REFRESH_TOKEN();
    const payload: RequestGetLevel = data;
    const target = `${API_URL.PROD_SB_API_URL}/api/sublevel/getLevel/${payload.school_id}`;
    const response = await apiClient.get(target);

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
