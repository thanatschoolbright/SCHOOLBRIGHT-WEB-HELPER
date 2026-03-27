import dayjs from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import { timesheetService } from "../_services/timesheet-service";
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

  // Monthly Summary
  monthlySummary: any[];
  monthlyStats: any;
  summaryLoading: boolean;

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

  /** ดึงข้อมูลสรุปรายเดือน */
  fetchMonthlySummary: (
    admin_id: number | undefined,
    date: dayjs.Dayjs,
  ) => Promise<void>;

  /** ดึงข้อมูลสรุปรายสัปดาห์ สำหรับ Weekly Summary */
  fetchWeeklySummary: (
    admin_id: number | undefined,
    date: dayjs.Dayjs,
  ) => Promise<void>;

  /** บันทึกหรือแก้ไขข้อมูล Timesheet */
  saveTimesheet: (payload: any) => Promise<boolean>;

  /** ลบรายการ Timesheet */
  deleteTimesheet: (ids: string[]) => Promise<boolean>;

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

  monthlySummary: [],
  monthlyStats: null,
  summaryLoading: false,

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
      const response = await timesheetService.requestTimesheetList(admin_id);

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
      const response = await timesheetService.requestProjectList();
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
      const response = await timesheetService.requestSubProjectList(project_id);
      if (response.status === 200) {
        set({ subProjects: response.data || [] });
      }
    } catch (error) {
      console.error("Fetch sub-projects failed:", error);
    }
  },

  fetchMonthlySummary: async (admin_id, date) => {
    if (!admin_id) return;
    set({ summaryLoading: true });
    try {
      const response = await timesheetService.requestCalculateMonthlySummary(
        Number(admin_id),
        date.month() + 1,
        date.year(),
      );

      const apiResponse = response.data || response;

      // ปรับการดึงข้อมูลตามรูปแบบ Response ใหม่ที่ได้รับจาก Curl
      // response.data.monthlySummary และ response.data.stats
      if (apiResponse.status === 200 || response.status === 200) {
        const resultData = apiResponse.data || apiResponse;
        set({
          monthlySummary: resultData.monthlySummary || [],
          monthlyStats: resultData.stats || null,
        });
      } else {
        // Fallback หาก API เฉพาะบุคคลไม่มีข้อมูล
        await get().fetchWeeklySummary(admin_id, date);
      }
    } catch (error) {
      console.error("Fetch monthly summary failed:", error);
      // ลองเรียก fetchWeeklySummary เป็น fallback ในกรณีที่มีปัญหา
      await get().fetchWeeklySummary(admin_id, date);
    } finally {
      set({ summaryLoading: false });
    }
  },

  fetchWeeklySummary: async (admin_id, date) => {
    if (!admin_id) return;
    set({ summaryLoading: true });
    try {
      const start = date.startOf("month").format("YYYY-MM-DD");
      const end = date.endOf("month").format("YYYY-MM-DD");
      const response = await timesheetService.requestWeeklySummary(start, end);

      const apiResponse = response.data || response;
      const dataList =
        apiResponse.data?.records ||
        apiResponse.records ||
        (Array.isArray(apiResponse) ? apiResponse : apiResponse.data || []);

      // Find the current admin's record in the summary list
      const userRecord = dataList.find(
        (r: any) =>
          Number(r.admin_id) === Number(admin_id) ||
          Number(r.user_id) === Number(admin_id),
      );

      if (userRecord) {
        set({
          monthlySummary: userRecord.breakdown || [],
          monthlyStats: {
            total_hours: userRecord.total_hours,
            required_hours: userRecord.required_hours,
            hours_gap: userRecord.hours_gap,
            completion_rate: userRecord.completion_rate,
            status_label: userRecord.status_label,
          },
        });
      } else {
        set({ monthlySummary: [], monthlyStats: null });
      }
    } catch (error) {
      console.error("Fetch weekly summary failed:", error);
      set({ monthlySummary: [], monthlyStats: null });
    } finally {
      set({ summaryLoading: false });
    }
  },

  saveTimesheet: async (payload) => {
    set({ actionLoading: true });
    const toast_id = toast.loading("กำลังบันทึกข้อมูล...");
    try {
      const response = await timesheetService.requestUpsertTimesheet(payload);
      if (response.status === 200) {
        toast.success("บันทึกข้อมูลสำเร็จ", { id: toast_id });
        return true;
      } else {
        throw new Error(response.message_th || "บันทึกข้อมูลล้มเหลว");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", {
        id: toast_id,
      });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteTimesheet: async (ids: number[], by: number) => {
    set({ actionLoading: true });
    const toast_id = toast.loading("กำลังลบข้อมูล...");
    try {
      const response = await timesheetService.requestDeleteTimesheet(ids, by);
      if (response.status === 200) {
        toast.success("ลบข้อมูลสำเร็จ", { id: toast_id });
        return true;
      } else {
        throw new Error(response.message_th || "ลบข้อมูลล้มเหลว");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล", {
        id: toast_id,
      });
      return false;
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
