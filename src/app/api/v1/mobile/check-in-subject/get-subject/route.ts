import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@helpers/api/response";
import { API_CLIENT_WITH_REFRESH_TOKEN } from "@/services/axios-instance/sb-refresh-token.axios";
import { API_URL } from "@services/api-url";
import z from "zod";
import { validateRequest } from "@helpers/api/validate.request";
import dayjs from "dayjs";

// Helper: format time string to 'HH:mm' robustly
const formatTimeRaw = (raw: any): string => {
  if (!raw && raw !== 0) return "";
  if (typeof raw === "string") {
    // try quick regex: match HH:MM
    const m = raw.match(/(\d{1,2}:\d{2})/);
    if (m && m[1]) return m[1];
  }
  try {
    const d = dayjs(raw);
    if (d.isValid && d.isValid()) return d.format("HH:mm");
  } catch (e) {
    // ignore
  }
  return "";
};

// Type Definition
export type ResponseGetSubject = {
  school_id: number;
  schedule_id: number;
  schedule_name: string;
  timestart: string;
  timeend: string;
  plane_id: string;
  schedule_name_en: string;
  plane_id_en: string;
};

export type RequestGetSubject = {
  school_id: string;
  sub_level_id: string;
};

// Helper: แปลงข้อมูล
const mapToDto = (item: any): ResponseGetSubject => ({
  school_id: item.SchoolID,
  schedule_id: item.scheduleId,
  schedule_name: item.scheduleName,
  timestart: formatTimeRaw(item.timestart),
  timeend: formatTimeRaw(item.timeend),
  plane_id: item.plane_id,
  schedule_name_en: item.scheldulNameEN,
  plane_id_en: item.plane_idEN,
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
  sub_level_id: z.string().min(1, "level_id is required"),
});

// API Route
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, validator);
  if (error) return error;

  try {
    const apiClient = await API_CLIENT_WITH_REFRESH_TOKEN();
    const payload: RequestGetSubject = data;
    const target = `${API_URL.PROD_SB_API_URL}/api/School/getschedule/${payload.school_id}/${payload.sub_level_id}`;
    const response = await apiClient.get(target);
    console.info("Target URL:", response.data);

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
