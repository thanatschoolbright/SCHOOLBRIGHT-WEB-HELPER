import { create } from "zustand";
import { overtimeService } from "../_services/overtime-service";

/**
 * Interface สำหรับจัดการสถานะการดาวน์โหลดไฟล์ PDF แบบกลุ่ม
 */
interface OvertimeState {
  isBulkDownloading: boolean;
  bulkDownloadProgress: number;
  isBulkTrackingModalVisible: boolean;
  bulkTrackingData: any[];

  // Summary State
  overtimeDataSource: any[];
  isLoadingOvertimeData: boolean;
  totalRecords: number;

  // Filter State
  filterSearchText: string;
  filterSelectedMonth: any | null;
  filterStatus: string | null;

  // Action Methods
  setIsBulkDownloading: (status: boolean) => void;
  setBulkDownloadProgress: (progress: number) => void;
  setIsBulkTrackingModalVisible: (status: boolean) => void;
  setBulkTrackingData: (data: any[] | ((prev: any[]) => any[])) => void;

  // Data Methods
  setOvertimeDataSource: (data: any[]) => void;
  setIsLoadingOvertimeData: (status: boolean) => void;
  setTotalRecords: (total: number) => void;

  // Filter Methods
  setFilterSearchText: (text: string) => void;
  setFilterSelectedMonth: (month: any | null) => void;
  setFilterStatus: (status: string | null) => void;
  resetFilters: () => void;

  /**
   * ดึง ID ผู้ใช้งานปัจจุบันจากระบบ (Redux > LocalStorage > Fallback)
   * @param authenticationState ข้อมูล Auth จาก Redux
   */
  requestCurrentLocalUserID: (authenticationState?: any) => Promise<string>;

  /**
   * ค้นหาและดึงข้อมูล OT สำหรับดาวน์โหลด
   * @param ids รายการ ID ที่ต้องการ
   * @param requesterId รหัสผู้ส่งคำขอ
   */
  fetchOvertimeDataForBulk: (
    ids: string[],
    requesterId: string,
  ) => Promise<any[]>;
}

/**
 * Zustand Store สำหรับจัดการสถานะหน้า Overtime Management
 */
export const useOvertimeStore = create<OvertimeState>((set, get) => ({
  isBulkDownloading: false,
  bulkDownloadProgress: 0,
  isBulkTrackingModalVisible: false,
  bulkTrackingData: [],

  // Summary State Initial
  overtimeDataSource: [],
  isLoadingOvertimeData: false,
  totalRecords: 0,

  // Filter State Initial
  filterSearchText: "",
  filterSelectedMonth: null,
  filterStatus: null,

  setIsBulkDownloading: (status) => set({ isBulkDownloading: status }),
  setBulkDownloadProgress: (progress) =>
    set({ bulkDownloadProgress: progress }),
  setIsBulkTrackingModalVisible: (status) =>
    set({ isBulkTrackingModalVisible: status }),
  setBulkTrackingData: (data) =>
    set((state) => ({
      bulkTrackingData:
        typeof data === "function" ? data(state.bulkTrackingData) : data,
    })),

  setOvertimeDataSource: (data) => set({ overtimeDataSource: data }),
  setIsLoadingOvertimeData: (status) => set({ isLoadingOvertimeData: status }),
  setTotalRecords: (total) => set({ totalRecords: total }),

  setFilterSearchText: (text) => set({ filterSearchText: text }),
  setFilterSelectedMonth: (month) => set({ filterSelectedMonth: month }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  resetFilters: () =>
    set({
      filterSearchText: "",
      filterSelectedMonth: null,
      filterStatus: null,
    }),

  requestCurrentLocalUserID: async (
    authenticationState?: any,
  ): Promise<string> => {
    try {
      const authenticationId =
        authenticationState?.response?.data?.user_data?.admin_id;
      if (authenticationId) return String(authenticationId);

      const { getUserData } =
        await import("@helpers/local_storage/user.storage");
      const users = (await getUserData()) as any[] | null;
      if (Array.isArray(users) && users.length > 0) {
        return String(users[0].admin_id || users[0].id || "system");
      }
    } catch (e) {
      console.error("Error fetching user ID:", e);
    }
    return "system";
  },

  fetchOvertimeDataForBulk: async (ids, requesterId) => {
    const dataItems = [];
    for (const id of ids) {
      try {
        const response = await overtimeService.requestOvertimeItemByID(
          id,
          requesterId,
        );
        if (response?.status === 200 && response.data?.[0]) {
          dataItems.push(response.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch OT", id, err);
      }
    }
    return dataItems;
  },
}));
