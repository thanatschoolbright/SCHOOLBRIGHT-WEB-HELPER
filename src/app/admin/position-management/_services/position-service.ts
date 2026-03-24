import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

/**
 * ดึงข้อมูลรายการตำแหน่งงาน ทั้งหมด
 * @param search คำค้นหา
 * @param limit จำนวนรายการ
 */
export const fetchPositions = async (
  search: string = "",
  limit: number = 100,
) => {
  const response = await axios.get("/api/v2/admin/position-management/read", {
    params: { search, limit },
  });
  return response.data;
};

/**
 * สร้างตำแหน่งงานใหม่
 * @param data ข้อมูลตำแหน่ง
 */
export const createPosition = async (data: any) => {
  const response = await axios.post(
    "/api/v2/admin/position-management/create",
    data,
  );
  return response.data;
};

/**
 * แก้ไขข้อมูลตำแหน่งงาน
 * @param data ข้อมูลที่จะอัปเดต พร้อม ID
 */
export const updatePosition = async (data: any) => {
  const response = await axios.post(
    "/api/v2/admin/position-management/update",
    data,
  );
  return response.data;
};

/**
 * ลบตำแหน่งงาน
 * @param id รหัสตำแหน่งที่ต้องการลบ
 */
export const deletePosition = async (id: number) => {
  const response = await axios.post(
    "/api/v2/admin/position-management/delete",
    { id },
  );
  return response.data;
};
