// ✨ Zustand Store สำหรับ Page Project Timeline
import { create } from "zustand";
import { getTimelineChartData, TimelineData } from "../_api/timeline-api";

interface TimelineState {
  // Data
  timelineData: TimelineData[];
  isLoading: boolean;
  error: string | null;

  // Filter
  filters: {
    start_date?: string;
    end_date?: string;
    project_id?: number;
  };

  // Actions
  setFilters: (filters: Partial<TimelineState["filters"]>) => void;
  fetchTimeline: () => Promise<void>;
  resetFilters: () => void;

  // Computed (Summary Metrics)
  getMetrics: () => {
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
  isLoading: false,
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

  fetchTimeline: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getTimelineChartData(get().filters);
      if (response.status_code === 200) {
        set({ timelineData: response.data, isLoading: false });
      } else {
        set({ error: response.message_th, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Error fetching data", isLoading: false });
    }
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

  getMetrics: () => {
    const data = get().timelineData;
    let totalFeatures = 0;
    data.forEach((p) => {
      if (p.children) totalFeatures += p.children.length;
    });

    return {
      totalProjects: data.length,
      totalFeatures,
      activeProjects: data.filter((p) => p.status === "open").length,
    };
  },
}));
