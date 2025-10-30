import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@helpers/api/response";
import { API_CLIENT_WITH_REFRESH_TOKEN } from "@/services/axios-instance/sb-refresh-token.axios";
import { API_URL } from "@services/api-url";
import z from "zod";
import { validateRequest } from "@helpers/api/validate.request";

import { logger } from "@helpers/logger";
// Type Definition
export type ResponseGetSubLevel = {
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

export type RequestGetStudent = {
  school_id: string;
  sub_level_id: string;
  subject_id: string;
  teacher_id: string;
  date: string; // mm/dd/yyyy
};

// Helper: แปลงข้อมูล
const mapToDto = (item: any): ResponseGetSubLevel => ({
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
  sub_level_id: z.string().min(1, "level_id is required"),
  subject_id: z.string().min(1, "subject_id is required"),
  teacher_id: z.string().min(1, "teacher_id is required"),
  date: z.string().min(1, "date is required"),
});

// API Route
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, validator);
  if (error) return error;

  try {
    const apiClient = await API_CLIENT_WITH_REFRESH_TOKEN();
    const payload: RequestGetStudent = data;
    payload.teacher_id = "99999"; // MOCKUP DATA ยังไม่จำเป็นต้องใส่ค่าจริง
  const target = `${API_URL.PROD_SB_API_URL}/api/School/getstudent/${payload.school_id}/${payload.sub_level_id}/${payload.subject_id}/${payload.teacher_id}?date=${payload.date}`;
  logger.debug("GET student target %s", target);
  const response = await apiClient.get(target);

  const rawData = extractData(response);
  const mappedData = rawData.map(mapToDto);

  logger.info(`Fetched %d student records (mapped: %d) from SB API`, rawData.length, mappedData.length);

    return Response.json(
      successResponse({
        data: mappedData,
        status: response.status,
      })
    );
  } catch (error: any) {
    logger.error("Failed to fetch students from SB API: %o", {
      message: error?.message,
      status: error?.response?.status,
    });

    return Response.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ ตอนนี้ Response จาก SB API ส่งมาผิด",
        status: error?.response?.status || 500,
        error,
      }),
      { status: error?.response?.status || 500 }
    );
  }
}
