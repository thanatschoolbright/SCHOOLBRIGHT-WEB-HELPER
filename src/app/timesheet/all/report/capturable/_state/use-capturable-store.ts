import dayjs, { Dayjs } from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";

import {
  CapturableData,
  CapturableSummary,
  DateRange,
  requestCapturableReport,
  requestCapturableSummary,
  requestExportExcel,
  requestSendCapturableEmail,
  requestTrackingDetails,
} from "../_api/capturable-api";

interface CapturableStore {
  // ── State ──
  loading: boolean;
  exportLoading: boolean;
  data: CapturableData[];
  searchText: string;
  dateRange: [Dayjs, Dayjs];
  summaryData: CapturableSummary;

  // Tracking
  trackingData: any[];
  trackingLoading: boolean;

  // Detail Modal
  detailModalOpen: boolean;
  selectedProject: CapturableData | null;

  // Export Modal
  exportModalVisible: boolean;
  countdown: number;
  isCounting: boolean;

  // Email Export Modal
  emailModalVisible: boolean;
  emailLoading: boolean;

  // ── Actions ──
  setSearchText: (text: string) => void;
  setDateRange: (range: [Dayjs, Dayjs]) => void;
  setExportModalVisible: (open: boolean) => void;
  setCountdown: (n: number) => void;
  setIsCounting: (v: boolean) => void;
  closeDetailModal: () => void;
  setEmailModalVisible: (open: boolean) => void;

  fetchReport: () => Promise<void>;
  openDetails: (record: CapturableData) => Promise<void>;
  exportExcel: () => Promise<void>;
  sendEmail: (ranges: DateRange[], recipients: string[]) => Promise<boolean>;
  clearFilters: () => void;
}

export const useCapturableStore = create<CapturableStore>((set, get) => ({
  loading: false,
  exportLoading: false,
  data: [],
  searchText: "",
  dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
  summaryData: {
    totalProjects: 0,
    totalHours: 0,
    avgCapturable: 0,
    avgUncapturable: 0,
  },
  trackingData: [],
  trackingLoading: false,
  detailModalOpen: false,
  selectedProject: null,
  exportModalVisible: false,
  countdown: 3,
  isCounting: false,
  emailModalVisible: false,
  emailLoading: false,

  setSearchText: (text) => set({ searchText: text }),
  setDateRange: (range) => set({ dateRange: range }),
  setExportModalVisible: (open) => set({ exportModalVisible: open }),
  setCountdown: (n) => set({ countdown: n }),
  setIsCounting: (v) => set({ isCounting: v }),
  closeDetailModal: () =>
    set({ detailModalOpen: false, selectedProject: null }),
  setEmailModalVisible: (open) => set({ emailModalVisible: open }),

  // ✨ ดึงข้อมูลรายงาน Summary + รายโครงการ
  fetchReport: async () => {
    const { dateRange } = get();
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");

    set({ loading: true });
    const toastId = toast.loading("กำลังดึงข้อมูลรายงาน...");
    try {
      const [summaryData, data] = await Promise.all([
        requestCapturableSummary(startDate, endDate),
        requestCapturableReport(startDate, endDate),
      ]);
      set({ summaryData, data });
      toast.success("ดึงข้อมูลแสดงรายการโครงการสมบูรณ์", { id: toastId });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message_th || "เกิดข้อผิดพลาดในการดึงข้อมูล",
        { id: toastId },
      );
    } finally {
      set({ loading: false });
    }
  },

  // ✨ เปิด Detail Modal และดึงข้อมูล Tracking
  openDetails: async (record) => {
    const { dateRange } = get();
    set({ selectedProject: record, detailModalOpen: true, trackingLoading: true });
    try {
      const trackingData = await requestTrackingDetails(
        record.project_id,
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD"),
      );
      set({ trackingData });
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลรายละเอียดการติดตามได้");
    } finally {
      set({ trackingLoading: false });
    }
  },

  // ✨ ส่งออก Excel
  exportExcel: async () => {
    const { dateRange } = get();
    set({ exportLoading: true });
    const toastId = toast.loading("กำลังส่งออกไฟล์ Excel...");
    try {
      const blob = await requestExportExcel(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD"),
      );
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `รายงานการบันทึกทรัพย์สินบริษัท (Capitalization Report) ประจำวันที่ ${dateRange[0].format("DD-MM-YYYY")} ถึง วันที่ ${dateRange[1].format("DD-MM-YYYY")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ส่งออกไฟล์ Excel รายงานโครงการสมบูรณ์", { id: toastId });
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งออกไฟล์", { id: toastId });
    } finally {
      set({ exportLoading: false });
    }
  },

  // ✨ ส่ง Excel ทางอีเมล (multi-range) — คืนค่า true เมื่อสำเร็จ
  sendEmail: async (ranges, recipients) => {
    set({ emailLoading: true });
    try {
      const result = await requestSendCapturableEmail(ranges, recipients);
      if (result.failed > 0) {
        toast.warning(`ส่งไม่สำเร็จ ${result.failed} ที่อยู่`);
      }
      toast.success(
        `ส่ง Capitalization Report สำเร็จ ${result.sent}/${recipients.length} ที่อยู่`,
      );
      return true;
    } catch {
      toast.error("ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่");
      return false;
    } finally {
      set({ emailLoading: false });
    }
  },

  // ✨ ล้างฟิลเตอร์
  clearFilters: () =>
    set({
      searchText: "",
      dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
      summaryData: {
        totalProjects: 0,
        totalHours: 0,
        avgCapturable: 0,
        avgUncapturable: 0,
      },
    }),
}));
