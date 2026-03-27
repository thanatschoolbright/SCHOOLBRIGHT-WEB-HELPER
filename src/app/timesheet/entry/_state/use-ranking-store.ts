import dayjs, { Dayjs } from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import { getMonthlyRanking } from "../_services/ranking-service";

interface SummaryRecord {
  admin_id: number;
  admin_name: string;
  total_days: number;
  // Add other fields based on API response
}

interface SummaryMetadata {
  range?: {
    label_th: string;
  };
}

interface RankingState {
  records: SummaryRecord[];
  metadata: SummaryMetadata | null;
  loading: boolean;
  selectedMonth: Dayjs;
  setSelectedMonth: (month: Dayjs) => void;
  fetchRanking: (adminId?: number, showToast?: boolean) => Promise<void>;
}

/**
 * Store สำหรับจัดการสถานะการจัดอันดับพนักงานประจำเดือน
 */
export const useRankingStore = create<RankingState>((set, get) => ({
  records: [],
  metadata: null,
  loading: false,
  selectedMonth: dayjs(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  fetchRanking: async (adminId, showToast = false) => {
    set({ loading: true });
    if (showToast) {
      toast.loading("กำลังอัปเดตข้อมูล...", { id: "monthly-rank-toast" });
    }
    try {
      const month = get().selectedMonth.format("M");
      const year = get().selectedMonth.format("YYYY");
      const response = await getMonthlyRanking(month, year, adminId);

      let records = [];
      if (adminId) {
        // find-ranking API จะตอบกลับมาเป็น { record, metadata }
        const record = response.data?.record;
        records = record ? [record] : [];
      } else {
        // summary-month API จะตอบกลับมาเป็น { records, metadata }
        records = response.data?.records || [];
      }

      set({
        records: records,
        metadata: response.data?.metadata || null,
        loading: false,
      });

      if (showToast) {
        toast.success("อัปเดตข้อมูลสำเร็จ", { id: "monthly-rank-toast" });
      }
    } catch (error) {
      set({ loading: false });
      if (showToast) {
        toast.error("ไม่สามารถโหลดข้อมูลได้", { id: "monthly-rank-toast" });
      }
    }
  },
}));
