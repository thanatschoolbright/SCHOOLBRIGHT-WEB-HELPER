// ✨ Zustand Store สำหรับ Page Project Timeline
import { create } from "zustand";
import {
  requestProjectStatusList,
  requestTimelineChartData,
  requestUpsertSubProject,
} from "../_api/timeline-api";

interface TimelineState {
  // Data
  timelineData: any[];
  projectStatuses: any[];
  isFetching: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Filter
  filters: {
    start_date?: string;
    end_date?: string;
    project_id?: number | null;
  };

  // Actions
  setFilters: (filters: Partial<TimelineState["filters"]>) => void;
  resetFilters: () => void;
  fetchTimelineData: () => Promise<void>;
  fetchProjectStatusList: () => Promise<void>;
  submitSubProject: (values: any, adminId: number) => Promise<boolean>;
  getSummaryMetrics: () => {
    totalProjects: number;
    totalFeatures: number;
    activeProjects: number;
  };

  // Modal State for Edit
  modal: {
    open: boolean;
    mode: "create" | "edit" | "clone";
    data: any | null;
  };
  setModal: (modal: Partial<TimelineState["modal"]>) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelineData: [],
  projectStatuses: [],
  isFetching: false,
  isSubmitting: false,
  error: null,
  filters: {
    start_date: undefined,
    end_date: undefined,
    project_id: undefined,
  },
  modal: {
    open: false,
    mode: "edit",
    data: null,
  },

  setModal: (newModal) => {
    set((state) => ({
      modal: { ...state.modal, ...newModal },
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({
      filters: {
        start_date: undefined,
        end_date: undefined,
        project_id: undefined,
      },
    });
  },

  /**
   * ✨ ดึงข้อมูล Timeline ทั้งหมด
   */
  fetchTimelineData: async () => {
    set({ isFetching: true, error: null });
    try {
      const response = await requestTimelineChartData(get().filters);
      if (response.status === 200 || response.status_code === 200) {
        set({ timelineData: response.data, isFetching: false });
      } else {
        set({ error: response.message_th, isFetching: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Error fetching data", isFetching: false });
    }
  },

  /**
   * ✨ ดึงข้อมูลสถานะโครงการ
   */
  fetchProjectStatusList: async () => {
    try {
      const response = await requestProjectStatusList();
      if (response.status === 200) {
        set({ projectStatuses: response.data });
      }
    } catch (error) {
      console.error("Fetch status error:", error);
    }
  },

  /**
   * ✨ บันทึกข้อมูลโครงการย่อย
   */
  submitSubProject: async (values: any, adminId: number) => {
    set({ isSubmitting: true });
    try {
      const payload = {
        ...values,
        project_id: values.project_id || get().modal.data?.project_id,
        by: adminId,
      };

      const response = await requestUpsertSubProject(payload);
      if (response.status === 200) {
        await get().fetchTimelineData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Submit error:", error);
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  /**
   * ✨ คำนวณข้อมูลสรุป (Metrics) จาก Raw Data
   */
  getSummaryMetrics: () => {
    const data = get().timelineData;
    let totalFeatures = 0;
    data.forEach((p) => {
      if (p.children) totalFeatures += p.children.length;
    });

    return {
      totalProjects: data.length,
      totalFeatures,
      activeProjects: data.filter((p: any) => p.status === "open").length,
    };
  },
}));
