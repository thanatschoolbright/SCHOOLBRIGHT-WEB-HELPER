"use client";

import dayjs from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import {
  requestExportExcelReport,
  requestServerStatus,
  ServerStatusData,
} from "../_services/server-status-service";

/**
 * โครงสร้าง State สำหรับหน้า Server Status
 */
interface ServerStatusState {
  // Data
  serverHealthData: ServerStatusData[];
  lastFetchTimestamp: Date | null;

  // UI Status
  isFetchingStatus: boolean;
  isSendingDiscord: boolean;
  isExporting: boolean;
  exportStep: number;
  isExportSuccess: boolean;
  isExportModalOpen: boolean;
  isDetailModalOpen: boolean;
  selectedItem: ServerStatusData | null;

  // Filter States
  searchQuery: string;
  statusFilter: "ALL" | "ONLINE" | "ERROR";
  groupFilter: string;
  methodFilter: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: "ALL" | "ONLINE" | "ERROR") => void;
  setGroupFilter: (group: string) => void;
  setMethodFilter: (method: string) => void;
  setExportSuccess: (success: boolean) => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openDetailModal: (item: ServerStatusData) => void;
  closeDetailModal: () => void;

  // Logic Actions
  fetchServerStatus: (mode?: "normal" | "discord") => Promise<void>;
  exportExcel: (filteredData: ServerStatusData[]) => Promise<void>;
  resetFilters: () => void;
}

/**
 * Zustand Store สำหรับจัดการสถานะของหน้าจอ Server Status
 */
export const useServerStatusStore = create<ServerStatusState>((set, get) => ({
  // Initial States
  serverHealthData: [],
  lastFetchTimestamp: null,
  isFetchingStatus: false,
  isSendingDiscord: false,
  isExporting: false,
  exportStep: 0,
  isExportSuccess: false,
  isExportModalOpen: false,
  isDetailModalOpen: false,
  selectedItem: null,
  searchQuery: "",
  statusFilter: "ALL",
  groupFilter: "ALL",
  methodFilter: "ALL",

  // Setters
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setGroupFilter: (group) => set({ groupFilter: group }),
  setMethodFilter: (method) => set({ methodFilter: method }),
  setExportSuccess: (success) => set({ isExportSuccess: success }),
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
  openDetailModal: (item) =>
    set({ selectedItem: item, isDetailModalOpen: true }),
  closeDetailModal: () => set({ isDetailModalOpen: false, selectedItem: null }),

  /**
   * ดึงข้อมูลสถานะเซิร์ฟเวอร์
   */
  fetchServerStatus: async (mode = "normal") => {
    const isDiscord = mode === "discord";
    if (isDiscord) set({ isSendingDiscord: true });
    else set({ isFetchingStatus: true });

    try {
      const response = await requestServerStatus(mode);
      if (response.data && Array.isArray(response.data)) {
        set({
          serverHealthData: response.data,
          lastFetchTimestamp: new Date(),
        });

        if (isDiscord) toast.success("ส่งรายงานเข้า Discord เรียบร้อยแล้ว");
        else toast.success("อัปเดตสถานะล่าสุดเรียบร้อย");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล", {
        description:
          error?.response?.data?.message_th ||
          "ไม่สามารถเชื่อมต่อกับ Server ได้",
      });
    } finally {
      set({ isFetchingStatus: false, isSendingDiscord: false });
    }
  },

  /**
   * ส่งออกรายงาน Excel
   */
  exportExcel: async (filteredData) => {
    if (filteredData.length === 0) {
      toast.warning("ไม่พบข้อมูลสำหรับสร้างรายงาน");
      return;
    }

    set({ isExporting: true, exportStep: 1, isExportSuccess: false });

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      set({ exportStep: 2 });

      const blob = await requestExportExcelReport(filteredData);

      set({ exportStep: 3 });
      await new Promise((resolve) => setTimeout(resolve, 600));

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `Server_Health_Report_${dayjs().format(
        "DD_MM_BBBB",
      )}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ exportStep: 4, isExportSuccess: true });
      toast.success("ส่งออกรายงานสำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน");
      set({ exportStep: 0 });
    } finally {
      set({ isExporting: false });
    }
  },

  /**
   * ล้างตัวกรองทั้งหมด
   */
  resetFilters: () => {
    set({
      searchQuery: "",
      statusFilter: "ALL",
      groupFilter: "ALL",
      methodFilter: "ALL",
    });
    toast.success("ล้างการค้นหาเรียบร้อย");
  },
}));
