import { create } from "zustand";
import { timesheetApi } from "../_api/timesheet-api";
import { TimesheetEntry } from "../types/timesheet-entry.types";

/**
 * Interface สำหรับข้อมูลสถานะ Timesheet
 */
interface TimesheetState {
  // Data
  entries: TimesheetEntry[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;

  // Projects
  projects: any[];
  subProjects: any[];
  projectsLoading: boolean;

  // Actions
  actionLoading: boolean;

  // Filters
  filters: {
    project_id: number | undefined;
    status: string | undefined;
  };

  // Methods
  /** ดึงข้อมูลรายการ Timesheet ทั้งหมด */
  fetchEntries: (admin_id: number | undefined) => Promise<void>;

  /** ตั้งค่าตัวกรองข้อมูล */
  setFilters: (filters: { project_id?: number; status?: string }) => void;

  /** ล้างตัวกรองข้อมูล ทั้งหมด */
  resetFilters: () => void;

  /** ดึงข้อมูลโครงการทั้งหมด */
  fetchProjects: () => Promise<void>;

  /** ดึงข้อมูลโครงการย่อยของโครงการที่เลือก */
  fetchSubProjects: (project_id: number) => Promise<void>;

  /** บันทึกหรือแก้ไขข้อมูล Timesheet */
  saveTimesheet: (payload: any) => Promise<boolean>;

  /** ลบรายการ Timesheet */
  deleteTimesheet: (ids: number[], by: number) => Promise<boolean>;

  /** เปลี่ยนหน้าในตาราง */
  setPagination: (page: number, size?: number) => void;

  /** ล้างค่าโครงการย่อย */
  clearSubProjects: () => void;
}

/**
 * Zustand Store สำหรับจัดการสถานะของหน้า Timesheet Entry
 * ตามมาตรฐาน Modular Architecture อย่างเคร่งครัด
 */
export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  // Initial States
  entries: [],
  loading: false,
  totalItems: 0,
  currentPage: 1,
  pageSize: 10,

  projects: [],
  subProjects: [],
  projectsLoading: false,

  actionLoading: false,

  filters: {
    project_id: undefined,
    status: undefined,
  },

  // Methods
  fetchEntries: async (admin_id) => {
    if (!admin_id) {
      console.warn("fetchEntries: No admin_id provided");
      return;
    }
    const { filters } = get();
    set({ loading: true });
    try {
      console.log(
        "fetchEntries: Requesting list for admin_id:",
        admin_id,
        "with filters:",
        filters,
      );
      const response = await timesheetApi.requestTimesheetList(admin_id);

      // Log response details to debug data flow
      console.log("fetchEntries: Raw response from API:", response);

      // Extract data correctly based on the response pattern shown by user
      const apiResponse = response.data || response;

      // Check if apiResponse is directly an array (the case where axios response.data is the array)
      const dataIsArray = Array.isArray(apiResponse);
      const status =
        apiResponse.status ||
        apiResponse.status_code ||
        (dataIsArray ? 200 : undefined);

      if (status === 200 || apiResponse.status_code === 200 || dataIsArray) {
        // According to user's example, records are in "data" property or the array itself
        let dataList = dataIsArray ? apiResponse : apiResponse.data || [];

        // Client-side filtering logic for demo purposes/until backend supports all params
        if (filters.project_id) {
          dataList = dataList.filter(
            (entry: any) =>
              Number(entry.project_id) === Number(filters.project_id),
          );
        }
        if (filters.status) {
          dataList = dataList.filter(
            (entry: any) => entry.status === filters.status,
          );
        }

        const total = apiResponse.pagination?.total || dataList.length || 0;

        console.log("fetchEntries: Extracted data list for store:", dataList);

        set({
          entries: dataList,
          totalItems: total,
        });
      } else {
        console.error("fetchEntries: API returned non-200 status", apiResponse);
      }
    } catch (error: any) {
      console.error("Fetch entries failed:", error);
      console.error("Error Detail:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({
      filters: {
        project_id: undefined,
        status: undefined,
      },
    });
  },

  fetchProjects: async () => {
    set({ projectsLoading: true });
    try {
      const response = await timesheetApi.requestProjectList();
      if (response.status === 200) {
        set({ projects: response.data || [] });
      }
    } catch (error) {
      console.error("Fetch projects failed:", error);
    } finally {
      set({ projectsLoading: false });
    }
  },

  fetchSubProjects: async (project_id) => {
    try {
      const response = await timesheetApi.requestSubProjectList(project_id);
      if (response.status === 200) {
        set({ subProjects: response.data || [] });
      }
    } catch (error) {
      console.error("Fetch sub-projects failed:", error);
    }
  },

  saveTimesheet: async (payload) => {
    set({ actionLoading: true });
    try {
      const response = await timesheetApi.requestUpsertTimesheet(payload);
      if (response.status === 200) {
        return true;
      } else {
        throw new Error(response.message_th || "บันทึกข้อมูลล้มเหลว");
      }
    } catch (error: any) {
      console.error("Save timesheet failed:", error);
      throw error;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteTimesheet: async (ids: number[], by: number) => {
    set({ actionLoading: true });
    try {
      const response = await timesheetApi.requestDeleteTimesheet(ids, by);
      if (response.status === 200) {
        return true;
      } else {
        throw new Error(response.message_th || "ลบข้อมูลล้มเหลว");
      }
    } catch (error: any) {
      console.error("Delete timesheet failed:", error);
      throw error;
    } finally {
      set({ actionLoading: false });
    }
  },

  setPagination: (page, size) =>
    set({
      currentPage: page,
      pageSize: size ?? get().pageSize,
    }),

  clearSubProjects: () => set({ subProjects: [] }),
}));
