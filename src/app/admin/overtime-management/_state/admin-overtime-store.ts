import { create } from "zustand";

/**
 * สถานะและ action สำหรับหน้าจัดการ OT ฝั่งผู้ดูแลระบบ
 */
interface AdminOvertimeState {
  // ข้อมูลหลัก
  dataSource: any[];
  isLoading: boolean;
  totalRecords: number;

  // ตัวกรอง
  filterSearchText: string;
  filterStatus: string | null;
  filterUserId: string | null;
  filterDateRange: [string, string] | null;

  // Setters
  setDataSource: (data: any[]) => void;
  setIsLoading: (v: boolean) => void;
  setTotalRecords: (v: number) => void;
  setFilterSearchText: (v: string) => void;
  setFilterStatus: (v: string | null) => void;
  setFilterUserId: (v: string | null) => void;
  setFilterDateRange: (v: [string, string] | null) => void;
  resetFilters: () => void;
}

/**
 * Zustand Store สำหรับหน้าจัดการ OT ของผู้ดูแลระบบ
 */
export const useAdminOvertimeStore = create<AdminOvertimeState>((set) => ({
  dataSource: [],
  isLoading: false,
  totalRecords: 0,

  filterSearchText: "",
  filterStatus: null,
  filterUserId: null,
  filterDateRange: null,

  setDataSource: (data) => set({ dataSource: data }),
  setIsLoading: (v) => set({ isLoading: v }),
  setTotalRecords: (v) => set({ totalRecords: v }),
  setFilterSearchText: (v) => set({ filterSearchText: v }),
  setFilterStatus: (v) => set({ filterStatus: v }),
  setFilterUserId: (v) => set({ filterUserId: v }),
  setFilterDateRange: (v) => set({ filterDateRange: v }),
  resetFilters: () =>
    set({
      filterSearchText: "",
      filterStatus: null,
      filterUserId: null,
      filterDateRange: null,
    }),
}));
