import { create } from "zustand";
import { 
  requestServerStatusV2, 
  requestSendStatusEmail, 
  requestNotifyDiscord 
} from "../_api/server-status.api";
import { toast } from "sonner";

export interface ServerStatus {
  server: string;
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

interface ServerStatusState {
  // Data
  servers: ServerStatus[];
  isLoading: boolean;
  isSendingEmail: boolean;
  isNotifyingDiscord: boolean;

  // Computed (Calculated from raw data)
  getStats: () => { online: number; offline: number; avgResponseTime: number };
  getLatestTimestamp: () => string;

  // Actions
  fetchServers: () => Promise<void>;
  sendEmailReport: () => Promise<void>;
  notifyDiscord: () => Promise<void>;
  updateServerDescription: (serverName: string, timestamp: string, description: string) => void;
}

export const useServerStatusStore = create<ServerStatusState>((set, get) => ({
  // Initial Data
  servers: [],
  isLoading: false,
  isSendingEmail: false,
  isNotifyingDiscord: false,

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
}));
