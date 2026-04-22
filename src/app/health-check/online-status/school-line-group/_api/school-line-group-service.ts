import { callApiService } from "@services/axios-instance/sb-helper.axios";

export interface TLineGroupItem {
  LineGroupId: number;
  SchoolId: number | null;
  GroupId: string | null;
  LineNotificationAccessToken: string | null;
  GroupType: string | null;
  CreateDate: string | null;
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
 * @param page หน้าที่ต้องการดึง
 * @param limit จำนวนรายการต่อหน้า
 * @param school_id รหัสโรงเรียนที่ต้องการกรอง
 */
export const fetchSchoolLineGroups = async (
  page: number,
  limit: number,
  school_id?: number,
) => {
  const res = await callApiService.post<ApiResponse>(
    "/api/v1/hardware/machine-monitoring/channel/line/school-id",
    {
      page,
      limit,
      ...(school_id ? { school_id } : {}),
    },
  );
  return res.data;
};

/**
 * ส่งรายงานทดสอบไปยัง LINE
 * @param school_id รหัสโรงเรียน
 */
export const sendTestLineReport = async (school_id: number) => {
  const res = await callApiService.get(
    `/api/v1/hardware/machine-monitoring/channel/line/${school_id}`,
  );
  return res.data;
};
