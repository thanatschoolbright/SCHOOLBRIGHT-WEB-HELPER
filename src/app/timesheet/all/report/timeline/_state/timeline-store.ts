// ✨ Zustand Store สำหรับ Page Project Timeline
import { create } from "zustand";
import {
  requestGroupList,
  requestProjectList,
  requestProjectStatusList,
  requestTimelineChartData,
  requestUpsertSubProject,
  TimelineChartParams,
} from "../_api/timeline-api";

interface TimelineState {
  // Data
  timelineData: any[];
  projectStatuses: any[];
  projectList: any[];
  groupList: any[];
  isFetching: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Filter
  filters: TimelineChartParams;

  // Actions
  setFilters: (filters: Partial<TimelineChartParams>) => void;
  resetFilters: () => void;
  fetchTimelineData: () => Promise<void>;
  fetchProjectStatusList: () => Promise<void>;
  fetchProjectList: () => Promise<void>;
  fetchGroupList: () => Promise<void>;
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

const DEFAULT_FILTERS: TimelineChartParams = {
  start_date: undefined,
  end_date: undefined,
  project_id: undefined,
  group_id: undefined,
  status_id: undefined,
  category_type: undefined,
  approval: undefined,
  sub_status_id: undefined,
  has_sub_projects: undefined,
  search: undefined,
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelineData: [],
  projectStatuses: [],
  projectList: [],
  groupList: [],
  isFetching: false,
  isSubmitting: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
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
    set({ filters: { ...DEFAULT_FILTERS } });
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
   * ✨ ดึงรายการโครงการ (สำหรับ Dropdown)
   */
  fetchProjectList: async () => {
    try {
      const response = await requestProjectList();
      if (response.status_code === 200) {
        set({ projectList: response.data?.items || response.data || [] });
      }
    } catch (error) {
      console.error("Fetch project list error:", error);
    }
  },

  /**
   * ✨ ดึงรายการกลุ่มโครงการ (สำหรับ Dropdown)
   */
  fetchGroupList: async () => {
    try {
      const response = await requestGroupList();
      if (response.status_code === 200) {
        set({ groupList: response.data || [] });
      }
    } catch (error) {
      console.error("Fetch group list error:", error);
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
