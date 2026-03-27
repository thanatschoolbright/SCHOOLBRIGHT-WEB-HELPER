import dayjs from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import { requestPMDashboardReport } from "../_api/dashboard-api";

/**
 * Interface สำหรับข้อมูลสรุป (Summary Metrics)
 */
interface DashboardSummary {
  total_projects: number;
  total_hours: number;
  total_features: number;
  avg_completion: number;
}

/**
 * Interface สำหรับข้อมูลสุขภาพโครงการ (Project Health)
 */
interface ProjectHealthRecord {
  id: number;
  name: string;
  estimate: number;
  actual: number;
  percent: number;
  status: string;
}

/**
 * Interface สำหรับข้อมูลภาระงาน (Workload Analysis)
 */
interface WorkloadRecord {
  name: string;
  department: string;
  tasks: number;
  total_hours: number;
  load: number;
  color: string;
}

/**
 * Interface สำหรับ Dashboard State
 */
interface DashboardState {
  isLoading: boolean;
  summary: DashboardSummary | null;
  projectHealth: ProjectHealthRecord[];
  workloadData: WorkloadRecord[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];

  // Actions
  setDateRange: (dates: [dayjs.Dayjs, dayjs.Dayjs]) => void;
  fetchDashboardData: () => Promise<void>;
}

/**
 * ✨ Zustand Store สำหรับจัดการ State ของหน้า PM Dashboard
 */
export const usePMDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: false,
  summary: null,
  projectHealth: [],
  workloadData: [],
  dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],

  setDateRange: (dates) => set({ dateRange: dates }),

  /**
   * ดึงข้อมูล Dashboard จาก Service
   */
  fetchDashboardData: async () => {
    const { dateRange } = get();
    try {
      set({ isLoading: true });

      const start = dateRange[0].format("YYYY-MM-DD");
      const end = dateRange[1].format("YYYY-MM-DD");

      const responseDashboardReport = await requestPMDashboardReport(
        start,
        end,
      );

      if (responseDashboardReport.data?.status_code === 200) {
        set({
          summary: responseDashboardReport.data.data.summary,
          projectHealth: responseDashboardReport.data.data.project_health,
          workloadData: responseDashboardReport.data.data.workload_analysis,
        });
      } else {
        toast.error(
          responseDashboardReport.data?.message_th ||
            "ไม่สามารถดึงข้อมูลแดชบอร์ดได้",
        );
      }
    } catch (error) {
      console.error("[PM DASHBOARD STORE ERR]:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลรายงาน");
    } finally {
      set({ isLoading: false });
    }
  },
}));
