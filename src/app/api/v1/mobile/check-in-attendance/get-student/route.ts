import { TTempScanStatusOnline } from "./../../../../../../../generated/prisma/index.d";
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@helpers/api/response";
import { API_CLIENT_WITH_REFRESH_TOKEN } from "@/services/axios-instance/sb-refresh-token.axios";
import { API_URL } from "@services/api-url";
import z from "zod";
import { validateRequest } from "@helpers/api/validate.request";
import { ATTENDANCE_STATUS } from "@constants/attendance-status";

// Type Definition
export type ResponseGetStudent = {
  student_state: number;
  user_id: number;
  student_id: string;
  student_name: string;
  student_name_en: string;
  scan_status: string;
  authorized: boolean;
  teacher_name: string | null;
  teacher_id: number | null;
  sex: string;
  pic: string | null;
  pic_version: number;
  n_student_number: number;
  status_check: boolean;
  school_id: number;
  first_name_th: string | null;
  last_name_th: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  student_code: string | null;
  state_th: string | null;
  state_en: string | null;
  come2school_status: string | null;
  pic_update: string | null;
};

// Helper: แปลงข้อมูล
const mapToDto = (item: any): ResponseGetStudent => ({
  student_state: item.Student_State,
  user_id: item.UserId,
  student_id: item.studentId,
  student_name: item.studentName,
  student_name_en: item.studentNameEN,
  scan_status:
    ATTENDANCE_STATUS.find((s) => s.value === item.scanstatus)
      ?.text ?? "",
  authorized: item.authorized,
  teacher_name: item.teachername,
  teacher_id: item.teacherId,
  sex: item.sex,
  pic: item.pic,
  pic_version: item.picversion,
  n_student_number: item.nStudentNumber,
  status_check: item.statusCheck,
  school_id: item.SchoolID,
  first_name_th: item.FirstNameTH,
  last_name_th: item.LastNameTH,
  first_name_en: item.FirstNameEN,
  last_name_en: item.LastNameEN,
  student_code: item.studentCode,
  state_th: item.StateTH,
  state_en: item.StateEN,
  come2school_status: item.come2school_status,
  pic_update: item.PicUpdate,
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
  sub_level_id: z.string().min(1, "sub_level_id is required"),
});

export type RequestGetStudent = {
  school_id: string;
  sub_level_id: string;
};

// API Route
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, validator);
  if (error) return error;

  try {
    const apiClient = await API_CLIENT_WITH_REFRESH_TOKEN();
    const payload: RequestGetStudent = data;
    const target = `${API_URL.PROD_SB_API_URL}/api/School/getstudent/${payload.school_id}/${payload.sub_level_id}`;
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
