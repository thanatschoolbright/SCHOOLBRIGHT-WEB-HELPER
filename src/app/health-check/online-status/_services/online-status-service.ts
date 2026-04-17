import { callApiService } from "@services/axios-instance/sb-helper.axios";

export interface DeviceStatusData {
  DeviceStatusID: string;
  SchoolID: number;
  DeviceID: string;
  Online: boolean;
  OnlineTime: string | null;
  Login: boolean;
  LoginTime: string | null;
  LogOut: boolean;
  LogoutTime: string | null;
  Tstamp: string;
  BusinessDate: string;
  AppName?: string;
  AppVersion?: string;
}

export interface DeviceStatusApiResponse {
  status: number;
  status_code?: number;
  message_th: string;
  data: DeviceStatusData[];
  pagination?: {
    total: number;
  };
}

export interface DashboardSummary {
  total: number;
  online: number;
  offline: number;
  login: number;
  onlineRate: number;
  totalSchools: number;
}

export interface DashboardSummaryApiResponse {
  status_code: number;
  data: DashboardSummary;
}

export interface FetchDeviceStatusParams {
  page: number;
  limit: number;
  keyword?: string;
  schoolId?: number;
  appName?: string;
  appVersion?: string;
  isOnline?: boolean;
  isLogin?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * ดึงข้อมูลสถานะอุปกรณ์ทั้งหมดจาก API พร้อม pagination และ filter
 */
export const onlineStatusService = {
  fetchDeviceStatus: async (params: FetchDeviceStatusParams) => {
    const response = await callApiService.post<DeviceStatusApiResponse>(
      "/api/v2/hardware/check-device-status",
      params,
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data;
  },

  fetchDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await callApiService.get<DashboardSummaryApiResponse>(
      "/api/v2/hardware/device-dashboard-summary",
    );
    return response.data.data;
  },
};
