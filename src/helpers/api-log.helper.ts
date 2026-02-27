import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  ApiLogFilters,
  ApiLogFormData,
  ApiLogResponse,
} from "@/types/api-log.type";

const API_BASE_URL = "/api/v1/logger";

//** ดึงรายการ API Logs */
export const GET_API_LOGS = async (
  filters: ApiLogFilters,
): Promise<ApiLogResponse> => {
  const response = await axios.post(`${API_BASE_URL}/search`, filters);
  return response.data;
};

//** ดึง API Log ตาม ID */
export const GET_API_LOG_BY_ID = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

//** สร้าง API Log ใหม่ */
const safeJsonParse = (str: string | undefined): any => {
  if (!str || str.trim() === "") return undefined;
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
};

export const POST_CREATE_API_LOG = async (data: ApiLogFormData) => {
  const payload = {
    requestTime: new Date(data.requestTime),
    responseTime: data.responseTime ? new Date(data.responseTime) : undefined,
    durationMs: data.durationMs,
    method: data.method,
    statusCode: data.statusCode,
    url: data.url,
    endpoint: data.endpoint,
    serviceName: data.serviceName,
    requestHeader: safeJsonParse(data.requestHeader),
    requestBody: safeJsonParse(data.requestBody),
    responseBody: safeJsonParse(data.responseBody),
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    calledBy: data.calledBy,
    traceId: data.traceId,
    errorMessage: data.errorMessage,
    isSuccess: data.isSuccess ?? true,
    isArchived: data.isArchived ?? false,
  };

  const response = await axios.post(`${API_BASE_URL}/create`, payload);
  return response.data;
};

//** อัปเดต API Log */
export const PUT_UPDATE_API_LOG = async (id: string, data: ApiLogFormData) => {
  // ปกติจะไม่มีการอัปเดต log แต่สามารถอัปเดต archive status ได้
  const response = await axios.patch(`${API_BASE_URL}/${id}/archive`, {
    isArchived: data.isArchived ?? false,
  });
  return response.data;
};

//** ลบ API Log */
export const DELETE_API_LOG = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};

//** อัปเดตสถานะ Archive */
export const PATCH_ARCHIVE_STATUS = async (id: string, isArchived: boolean) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/archive`, {
    isArchived,
  });
  return response.data;
};
