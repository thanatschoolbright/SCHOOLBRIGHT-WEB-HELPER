import { callApiService } from "@services/axios-instance/sb-helper.axios";

export interface SchoolOption {
  value: number;
  label: string;
}

export interface TLineGroupItem {
  LineGroupId: number;
  SchoolId: number | null;
  GroupId: string | null;
  LineNotificationAccessToken: string | null;
  GroupType: string | null;
  CreateDate: string | null;
  school_name_th: string | null;
  school_name_en: string | null;
}

export interface ApiResponse {
  status: number;
  status_code?: number;
  message_th: string;
  data: TLineGroupItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * ดึงข้อมูลกลุ่ม LINE ตามรหัสโรงเรียน
 */
export const fetchSchoolLineGroups = async (
  page: number,
  limit: number,
  school_id?: number,
) => {
  const res = await callApiService.post<ApiResponse>(
    "/api/v1/hardware/machine-monitoring/channel/line/school-id/read",
    {
      page,
      limit,
      ...(school_id ? { school_id } : {}),
    },
  );
  return res.data;
};

/**
 * สร้างกลุ่ม LINE ใหม่
 */
export const createSchoolLineGroup = async (data: {
  school_id: number;
  group_id: string;
  line_notification_access_token: string;
  group_type: string;
}) => {
  const res = await callApiService.post(
    "/api/v1/hardware/machine-monitoring/channel/line/school-id/create",
    data,
  );
  return res.data;
};

/**
 * แก้ไขกลุ่ม LINE
 */
export const updateSchoolLineGroup = async (data: {
  line_group_id: number;
  school_id?: number;
  group_id?: string;
  line_notification_access_token?: string;
  group_type?: string;
}) => {
  const res = await callApiService.patch(
    "/api/v1/hardware/machine-monitoring/channel/line/school-id/update",
    data,
  );
  return res.data;
};

/**
 * ลบกลุ่ม LINE
 */
export const deleteSchoolLineGroup = async (line_group_id: number) => {
  const res = await callApiService.delete(
    "/api/v1/hardware/machine-monitoring/channel/line/school-id/delete",
    {
      data: { line_group_id },
    },
  );
  return res.data;
};

/**
 * ดึง Preview รายงานสถานะเครื่องของโรงเรียน (โดยไม่ส่งจริง)
 */
export const fetchTestLinePreview = async (school_id: number) => {
  const res = await callApiService.get(
    `/api/v1/hardware/machine-monitoring/channel/line/${school_id}/preview`,
  );
  return res.data;
};

/**
 * ดึงรายชื่อโรงเรียนทั้งหมดสำหรับใช้ใน Dropdown
 */
export const fetchSchoolOptions = async (): Promise<SchoolOption[]> => {
  const res = await callApiService.get("/api/v1/school/get-detail");
  const rawList: any[] = res.data?.data?.data ?? [];
  return rawList.map((item: any) => ({
    value: item.school_id ?? item.SchoolID ?? 0,
    label: `[${item.school_id ?? item.SchoolID}] ${
      item.SchoolName ?? item.company_name ?? ""
    }`,
  }));
};

/**
 * ส่งรายงานทดสอบไปยัง LINE
 */
export const sendTestLineReport = async (school_id: number) => {
  const res = await callApiService.get(
    `/api/v1/hardware/machine-monitoring/channel/line/${school_id}`,
  );
  return res.data;
};
