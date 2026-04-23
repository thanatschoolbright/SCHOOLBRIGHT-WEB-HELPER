import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

/**
 * ดึงรายการข้อมูลการลา (Server-side Pagination & Search)
 * @param params {page, limit, search, start_date, end_date, school_id}
 */
export const responseLeaveList = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  school_id?: string | number;
}) => {
  return await axios.get("/api/v2/admin/leave-management/read", {
    params,
  });
};
