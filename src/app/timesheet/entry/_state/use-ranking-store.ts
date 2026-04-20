import dayjs, { Dayjs } from "dayjs";
import { create } from "zustand";
import { rankingApi } from "../_api/ranking-api";

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
  fetchRanking: async (adminId) => {
    set({ loading: true });
    try {
      const month = get().selectedMonth.format("M");
      const year = get().selectedMonth.format("YYYY");
      const response = await rankingApi.requestMonthlyRanking(
        month,
        year,
        adminId,
      );

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
    } catch (error) {
      console.error("Fetch ranking failed:", error);
      set({ loading: false });
    }
  },
}));
