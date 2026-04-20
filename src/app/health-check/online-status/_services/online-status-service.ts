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
  app_stats?: {
    name: string;
    total: number;
    online: number;
  }[];
}

export interface DashboardSummaryApiResponse {
  status_code: number;
  data: DashboardSummary;
}

export interface LineGroup {
  id: number;
  group_id: string;
  group_name: string | null;
  is_active: boolean;
  created_at: string;
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

  fetchLineGroups: async (): Promise<{
    groups: LineGroup[];
    active_group_id: string | null;
  }> => {
    const response = await callApiService.get<{
      status_code: number;
      data: { groups: LineGroup[]; active_group_id: string | null };
    }>("/api/v1/application/line/groups");
    return response.data.data;
  },

  setActiveLineGroup: async (group_id: string): Promise<void> => {
    await callApiService.post("/api/v1/application/line/groups/active", {
      group_id,
    });
  },

  /**
   * ส่งออกไฟล์ Excel รายงานสถานะอุปกรณ์
   */
  exportDeviceStatusExcel: async (): Promise<void> => {
    try {
      const response = await callApiService.get(
        "/api/v2/hardware/export-device-status/read",
        {
          responseType: "blob",
        },
      );

      // สร้างลิงก์ดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const contentDisposition = response.headers["content-disposition"];
      let filename = `device-status-report-${new Date().toISOString()}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // ลบลิงก์หลังดาวน์โหลด
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Excel error:", error);
      throw error;
    }
  },
};
