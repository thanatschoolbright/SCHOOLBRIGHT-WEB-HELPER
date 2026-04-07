import { toast } from "sonner";
import { create } from "zustand";
import {
  type CrmItem,
  type CrmListParams,
  type CrmSummary,
  requestCreateCrmCase,
  requestDeleteCrmCase,
  requestUpdateCrmCase,
  responseCrmList,
} from "../_api/crm-api";

interface CrmPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface CrmStore {
  // State
  items: CrmItem[];
  summary: CrmSummary;
  pagination: CrmPagination;
  filters: CrmListParams;
  isLoading: boolean;
  isSubmitting: boolean;
  drawerOpen: boolean;
  editingItem: CrmItem | null;

  // Actions
  fetchList: (params?: CrmListParams) => Promise<void>;
  setFilters: (filters: Partial<CrmListParams>) => void;
  resetFilters: () => void;
  openDrawer: (item?: CrmItem) => void;
  closeDrawer: () => void;
  createCase: (payload: Record<string, unknown>) => Promise<boolean>;
  updateCase: (payload: Record<string, unknown>) => Promise<boolean>;
  deleteCase: (id: number, deletedBy?: number) => Promise<boolean>;
  updateStatusInline: (
    id: number,
    status: string,
    updatedBy?: number,
  ) => Promise<boolean>;
  setPage: (page: number) => void;
}

const defaultFilters: CrmListParams = {
  page: 1,
  page_size: 20,
  tab: "all",
};

const defaultSummary: CrmSummary = {
  total: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
};

export const useCrmStore = create<CrmStore>((set, get) => ({
  items: [],
  summary: defaultSummary,
  pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
  filters: defaultFilters,
  isLoading: false,
  isSubmitting: false,
  drawerOpen: false,
  editingItem: null,

  // ดึงรายการเคสพร้อมสรุปข้อมูลจาก Server
  fetchList: async (params?: CrmListParams) => {
    set({ isLoading: true });
    try {
      const currentFilters = get().filters;
      const mergedParams = { ...currentFilters, ...params };
      const result = await responseCrmList(mergedParams);
      set({
        items: result.items,
        summary: result.summary,
        pagination: result.pagination,
      });
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      set({ isLoading: false });
    }
  },

  // ตั้งค่า Filter และ Fetch ใหม่ทันที
  setFilters: (filters) => {
    const updated = { ...get().filters, ...filters, page: 1 };
    set({ filters: updated });
    get().fetchList(updated);
  },

  // ล้างค่า Filter ทั้งหมด
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchList(defaultFilters);
  },

  // เปิด Drawer สำหรับสร้าง/แก้ไขเคส
  openDrawer: (item?: CrmItem) => {
    set({ drawerOpen: true, editingItem: item ?? null });
  },

  // ปิด Drawer
  closeDrawer: () => {
    set({ drawerOpen: false, editingItem: null });
  },

  // สร้างเคสใหม่
  createCase: async (payload) => {
    set({ isSubmitting: true });
    try {
      await requestCreateCrmCase(payload);
      toast.success("สร้างเคสสำเร็จ");
      get().closeDrawer();
      get().fetchList();
      return true;
    } catch {
      toast.error("สร้างเคสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // อัปเดตเคสที่มีอยู่
  updateCase: async (payload) => {
    set({ isSubmitting: true });
    try {
      await requestUpdateCrmCase(payload);
      toast.success("อัปเดตเคสสำเร็จ");
      get().closeDrawer();
      get().fetchList();
      return true;
    } catch {
      toast.error("อัปเดตเคสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // ลบเคส (Soft Delete)
  deleteCase: async (id, deletedBy) => {
    set({ isSubmitting: true });
    try {
      await requestDeleteCrmCase(id, deletedBy);
      toast.success("ลบเคสสำเร็จ");
      get().fetchList();
      return true;
    } catch {
      toast.error("ลบเคสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // เปลี่ยนสถานะเคสจากหน้ารายการโดยตรง
  updateStatusInline: async (id, status, updatedBy) => {
    try {
      await requestUpdateCrmCase({ id, status, updated_by: updatedBy });
      toast.success("อัปเดตสถานะสำเร็จ");
      get().fetchList();
      return true;
    } catch {
      toast.error("อัปเดตสถานะไม่สำเร็จ");
      return false;
    }
  },

  // เลื่อนหน้า Pagination
  setPage: (page) => {
    const updated = { ...get().filters, page };
    set({ filters: updated });
    get().fetchList(updated);
  },
}));
