import { create } from "zustand";
import {
  requestServerStatusV2,
  requestSendStatusEmail,
  requestNotifyDiscord,
  requestServerStatusLogs,
  requestServerStatusLogSummary,
} from "../_api/server-status.api";
import { toast } from "sonner";

export interface ServerStatus {
  server: string;
  server_name: string;
  server_name_th: string;
  server_name_en?: string;
  endpoint: string;
  status: "Online" | "Offline";
  response_time: number;
  response_time_severity_level: "low" | "medium" | "high";
  timestamp: string;
  url: string;
  environment: string;
  description?: string;
  status_code?: number;
}

export interface ServerLogEntry {
  id: bigint;
  request_time: string;
  duration_ms: number | null;
  status_code: number | null;
  url: string | null;
  endpoint: string | null;
  called_by: string | null;   // "Online" | "Offline"
  error_message: string | null;
  is_success: boolean;
  created_at: string;
  trace_id: string | null;    // server key
  response_body: any;
}

export interface ServerLogPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ServerLogSummary {
  period: { from: string; to: string; days: number };
  overall: {
    total_checks: number;
    uptime_percent: number;
    downtime_percent: number;
    total_downtime_count: number;
  };
  servers: Array<{
    server_key: string;
    server_name_th: string;
    total_checks: number;
    online_count: number;
    offline_count: number;
    uptime_percent: number;
    downtime_percent: number;
    avg_response_time_ms: number;
    last_checked: string;
  }>;
}

export interface LogFilters {
  server_name?: string;
  status?: "Online" | "Offline" | undefined;
  date_from?: string;
  date_to?: string;
  days?: number;
}

interface ServerStatusState {
  // Data — Real-time status
  servers: ServerStatus[];
  isLoading: boolean;
  isSendingEmail: boolean;
  isNotifyingDiscord: boolean;

  // Data — Log tab
  logs: ServerLogEntry[];
  logPagination: ServerLogPagination | null;
  logSummary: ServerLogSummary | null;
  isLoadingLogs: boolean;
  isLoadingSummary: boolean;
  logFilters: LogFilters;

  // Computed (Calculated from raw data)
  getStats: () => { online: number; offline: number; avgResponseTime: number };
  getLatestTimestamp: () => string;

  // Actions — Real-time status
  fetchServers: () => Promise<void>;
  sendEmailReport: () => Promise<void>;
  notifyDiscord: () => Promise<void>;
  updateServerDescription: (serverName: string, timestamp: string, description: string) => void;

  // Actions — Log tab
  fetchLogs: (page?: number) => Promise<void>;
  fetchLogSummary: () => Promise<void>;
  setLogFilters: (filters: LogFilters) => void;
  resetLogFilters: () => void;
}

const DEFAULT_LOG_FILTERS: LogFilters = { days: 7 };

export const useServerStatusStore = create<ServerStatusState>((set, get) => ({
  // Initial Data — Real-time status
  servers: [],
  isLoading: false,
  isSendingEmail: false,
  isNotifyingDiscord: false,

  // Initial Data — Log tab
  logs: [],
  logPagination: null,
  logSummary: null,
  isLoadingLogs: false,
  isLoadingSummary: false,
  logFilters: DEFAULT_LOG_FILTERS,

  // Computed
  getStats: () => {
    const { servers } = get();
    const online = servers.filter((s) => s.status === "Online").length;
    const offline = servers.length - online;
    const avgResponseTime = servers.length
      ? servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length
      : 0;
    return { online, offline, avgResponseTime };
  },

  getLatestTimestamp: () => {
    const { servers } = get();
    if (!servers.length) return "-";
    const sorted = [...servers].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0]?.timestamp ?? "-";
  },

  // Actions
  fetchServers: async () => {
    set({ isLoading: true });
    try {
      const response = await requestServerStatusV2();
      set({ servers: response.data || [] });
    } catch (error: any) {
      toast.error("ไม่สามารถดึงข้อมูลสถานะเซิร์ฟเวอร์ได้: " + error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  sendEmailReport: async () => {
    set({ isSendingEmail: true });
    const toastId = toast.loading("กำลังส่งอีเมลรายงานสถานะระบบ...");
    try {
      const response = await requestSendStatusEmail();
      if (response.status_code === 200) {
        toast.success("ส่งอีเมลรายงานสถานะสำเร็จแล้ว", { id: toastId });
      } else {
        throw new Error(response.message_th || "ส่งอีเมลไม่สำเร็จ");
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`, { id: toastId });
    } finally {
      set({ isSendingEmail: false });
    }
  },

  notifyDiscord: async () => {
    set({ isNotifyingDiscord: true });
    try {
      const response = await requestNotifyDiscord();
      if (response.status_code === 200) {
        toast.success("ส่งแจ้งเตือนผ่านช่องทาง Discord เรียบร้อยแล้ว");
      } else {
        toast.error("ไม่สามารถส่งแจ้งเตือนผ่านช่องทาง Discord ได้");
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการส่งแจ้งเตือน: " + error.message);
    } finally {
      set({ isNotifyingDiscord: false });
    }
  },

  updateServerDescription: (serverName: string, timestamp: string, description: string) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.server_name_th === serverName && s.timestamp === timestamp
          ? { ...s, description }
          : s
      ),
    }));
    toast.success("อัปเดตหมายเหตุเรียบร้อยแล้ว");
  },

  // ✨ ดึงรายการ log การตรวจสอบ Server พร้อม filter
  fetchLogs: async (page = 1) => {
    set({ isLoadingLogs: true });
    try {
      const { logFilters } = get();
      const response = await requestServerStatusLogs({
        page,
        page_size: 20,
        server_name: logFilters.server_name,
        status: logFilters.status,
        date_from: logFilters.date_from,
        date_to: logFilters.date_to,
      });
      set({ logs: response.data ?? [], logPagination: response.pagination ?? null });
    } catch (error: any) {
      toast.error("ไม่สามารถดึงข้อมูล log ได้: " + error.message);
    } finally {
      set({ isLoadingLogs: false });
    }
  },

  // ✨ ดึงสรุปสถิติ Uptime/Downtime ของแต่ละ Server
  fetchLogSummary: async () => {
    set({ isLoadingSummary: true });
    try {
      const { logFilters } = get();
      const response = await requestServerStatusLogSummary({
        days: logFilters.days ?? 7,
        date_from: logFilters.date_from,
        date_to: logFilters.date_to,
      });
      set({ logSummary: response.data ?? null });
    } catch (error: any) {
      toast.error("ไม่สามารถดึงสรุป log ได้: " + error.message);
    } finally {
      set({ isLoadingSummary: false });
    }
  },

  // ✨ อัปเดต filter ของ log tab
  setLogFilters: (filters: LogFilters) => {
    set({ logFilters: filters });
  },

  // ✨ รีเซ็ต filter ของ log tab กลับค่าเริ่มต้น
  resetLogFilters: () => {
    set({ logFilters: DEFAULT_LOG_FILTERS });
  },
}));
