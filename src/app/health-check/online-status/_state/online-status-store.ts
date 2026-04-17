import { create } from "zustand";
import dayjs from "dayjs";
import { toast } from "sonner";
import {
  DeviceStatusData,
  onlineStatusService,
} from "../_services/online-status-service";

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface OnlineStatusState {
  isFetching: boolean;
  deviceList: DeviceStatusData[];
  pagination: PaginationState;

  // Filter form values
  keyword: string;
  schoolId?: number;
  appName?: string;
  appVersion?: string;
  isOnline?: boolean;
  isLogin?: boolean;
  dateRange?: [any, any] | null;

  // Actions
  setKeyword: (value: string) => void;
  setSchoolId: (value?: number) => void;
  setAppName: (value?: string) => void;
  setAppVersion: (value?: string) => void;
  setIsOnline: (value?: boolean) => void;
  setIsLogin: (value?: boolean) => void;
  setDateRange: (value?: [any, any] | null) => void;
  resetFilters: () => void;

  /**
   * ดึงข้อมูลสถานะอุปกรณ์โดยใช้ filter ปัจจุบันใน store
   */
  fetchData: (page?: number, pageSize?: number) => Promise<void>;
}

/**
 * Zustand Store สำหรับจัดการสถานะหน้าตรวจสอบสถานะอุปกรณ์
 */
export const useOnlineStatusStore = create<OnlineStatusState>((set, get) => ({
  isFetching: false,
  deviceList: [],
  pagination: { current: 1, pageSize: 20, total: 0 },

  keyword: "",
  schoolId: undefined,
  appName: undefined,
  appVersion: undefined,
  isOnline: true,
  isLogin: undefined,
  dateRange: null,

  setKeyword: (value) => set({ keyword: value }),
  setSchoolId: (value) => set({ schoolId: value }),
  setAppName: (value) => set({ appName: value }),
  setAppVersion: (value) => set({ appVersion: value }),
  setIsOnline: (value) => set({ isOnline: value }),
  setIsLogin: (value) => set({ isLogin: value }),
  setDateRange: (value) => set({ dateRange: value }),

  resetFilters: () =>
    set({
      keyword: "",
      schoolId: undefined,
      appName: undefined,
      appVersion: undefined,
      isOnline: true,
      isLogin: undefined,
      dateRange: null,
    }),

  fetchData: async (page, pageSize) => {
    const state = get();
    const targetPage = page ?? state.pagination.current;
    const targetPageSize = pageSize ?? state.pagination.pageSize;

    set({ isFetching: true });
    try {
      const result = await onlineStatusService.fetchDeviceStatus({
        page: targetPage,
        limit: targetPageSize,
        keyword: state.keyword,
        schoolId: state.schoolId,
        appName: state.appName,
        appVersion: state.appVersion,
        isOnline: state.isOnline,
        isLogin: state.isLogin,
        startDate: state.dateRange?.[0]
          ? dayjs(state.dateRange[0]).format("YYYY-MM-DD")
          : null,
        endDate: state.dateRange?.[1]
          ? dayjs(state.dateRange[1]).format("YYYY-MM-DD")
          : null,
      });

      if (result.status === 200) {
        set({
          deviceList: result.data || [],
          pagination: {
            current: targetPage,
            pageSize: targetPageSize,
            total: result.pagination?.total || 0,
          },
        });
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description:
          error?.response?.data?.message_th || "ไม่สามารถดึงข้อมูลได้",
      });
    } finally {
      set({ isFetching: false });
    }
  },
}));
