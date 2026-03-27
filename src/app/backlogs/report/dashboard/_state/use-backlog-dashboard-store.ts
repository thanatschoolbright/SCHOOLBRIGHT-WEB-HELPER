import dayjs from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import { fetchBacklogAnalytics } from "../_api/backlog-analytics-service";

interface Issue {
  key: string;
  summary: string;
  status: string;
}

interface AnalyticsItem {
  id: number;
  name: string;
  total: number;
  closed: number;
  open: number;
  in_progress: number;
  efficiency: number;
  avatarUrl: string;
  issues?: Issue[];
  // New KPI Metrics
  active_tasks: number;
  pending_tasks: number;
  load_value: number;
  capacity_status: string;
}

interface BacklogDashboardState {
  loading: boolean;
  analyticsData: AnalyticsItem[];
  space: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  selectedAssigneeId: number | null;
  searchName: string;

  // Actions
  setSpace: (space: string) => void;
  setDateRange: (range: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
  setSelectedAssigneeId: (id: number | null) => void;
  setSearchName: (name: string) => void;
  // Computed (Selectors conceptually)
  getTotalStats: () => { total: number; closed: number; open: number };
}

export const useBacklogDashboardStore = create<BacklogDashboardState>(
  (set, get) => ({
    loading: false,
    analyticsData: [],
    space: "jabjai",
    dateRange: [dayjs("2026-03-23"), dayjs("2026-03-27")],
    selectedAssigneeId: null,
    searchName: "",

    setSpace: (space) => set({ space }),
    setDateRange: (dateRange) => set({ dateRange }),
    setSelectedAssigneeId: (selectedAssigneeId) => set({ selectedAssigneeId }),
    setSearchName: (searchName) => set({ searchName }),

    fetchAnalytics: async () => {
      const { space, dateRange } = get();
      set({ loading: true });
      try {
        const params: any = { space };
        if (dateRange) {
          params.createdSince = dateRange[0].format("YYYY-MM-DD");
          params.createdUntil = dateRange[1].format("YYYY-MM-DD");
        }
        const response = await fetchBacklogAnalytics(params);
        set({ analyticsData: response.data || [] });
        toast.success("ดึงข้อมูลการทำงานพนักงานสำเร็จ");
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูล Dashboard ได้");
        console.error(error);
      } finally {
        set({ loading: false });
      }
    },

    getTotalStats: () => {
      const { analyticsData } = get();
      return analyticsData.reduce(
        (acc, curr) => ({
          total: acc.total + curr.total,
          closed: acc.closed + curr.closed,
          open: acc.open + (curr.open || 0),
        }),
        { total: 0, closed: 0, open: 0 },
      );
    },
  }),
);
