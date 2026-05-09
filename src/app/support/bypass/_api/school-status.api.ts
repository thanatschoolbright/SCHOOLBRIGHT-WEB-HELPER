import { callApiService as axios } from "@/services/axios-instance/sb-helper.axios";

// ✨ ปรับสถานะโรงเรียนใน TCompany (Active และ/หรือ isActive)
export const requestUpdateSchoolStatus = async (
  schoolId: number,
  payload: { active?: boolean; is_active?: boolean }
) => {
  const response = await axios.patch(`/api/v2/support/school-status/${schoolId}`, payload);
  return response.data;
};
