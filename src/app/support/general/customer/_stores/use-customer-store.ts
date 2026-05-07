import { create } from "zustand";
import { toast } from "sonner";
import {
  GET_ACTIVITY_LOGS,
  GET_COMPANIES,
  GET_LOCKED_CUSTOMERS,
  POST_UNLOCK_ALL,
  POST_UNLOCK_CUSTOMER,
  UnlockAllProgressEvent,
} from "../_api/customer-management.service";

export interface LockedCustomer {
  sID: number;
  sName: string | null;
  sLastname: string | null;
  username: string | null;
  sEmail: string | null;
  sPhone: string | null;
  nCompany: number;
  school_name: string | null;
  CurrentFailedAttempts: number;
  AccountLockedUntil: string | null;
  cType: string | null;
}

export interface Company {
  nCompany: number;
  sCompany: string | null;
}

export interface ActivityLogItem {
  id: string;
  endpoint: string;
  request_time: string;
  request_body: any;
  status_code: number | null;
  is_success: boolean;
  called_by: string | null;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface CustomerFilters {
  keyword: string;
  company_id: number | undefined;
  page: number;
  page_size: number;
}

interface UnlockAllProgress {
  open: boolean;
  unlocked: number;
  total: number;
  percent: number;
  isDone: boolean;
}

interface CustomerStore {
  // ข้อมูลลูกค้า
  customers: LockedCustomer[];
  pagination: Pagination;
  filters: CustomerFilters;
  isLoading: boolean;
  companies: Company[];

  // ปลดล็อกรายเดียว
  unlockTargetId: number | null;
  isUnlocking: boolean;

  // ปลดล็อกทั้งหมด
  unlockAllConfirmOpen: boolean;
  unlockAllProgress: UnlockAllProgress;

  // Activity Log
  activityLogs: ActivityLogItem[];
  activityPagination: Pagination;
  isLoadingLogs: boolean;

  setFilters: (f: Partial<CustomerFilters>) => void;
  fetchCustomers: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  openUnlockConfirm: (userId: number) => void;
  closeUnlockConfirm: () => void;
  confirmUnlock: () => Promise<void>;
  openUnlockAllConfirm: () => void;
  closeUnlockAllConfirm: () => void;
  startUnlockAll: () => Promise<void>;
  closeUnlockAllProgress: () => void;
  fetchActivityLogs: (page?: number) => Promise<void>;
}

// Store สำหรับจัดการหน้า Customer Management
export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
  filters: { keyword: "", company_id: undefined, page: 1, page_size: 20 },
  isLoading: false,
  companies: [],
  unlockTargetId: null,
  isUnlocking: false,
  unlockAllConfirmOpen: false,
  unlockAllProgress: { open: false, unlocked: 0, total: 0, percent: 0, isDone: false },
  activityLogs: [],
  activityPagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
  isLoadingLogs: false,

  // อัปเดต filter
  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } })),

  // ดึงรายชื่อโรงเรียน
  fetchCompanies: async () => {
    try {
      const res = await GET_COMPANIES();
      set({ companies: res.data ?? [] });
    } catch {
      // silent
    }
  },

  // ดึงลูกค้าที่ถูกล็อก
  fetchCustomers: async () => {
    const { filters } = get();
    set({ isLoading: true });
    try {
      const res = await GET_LOCKED_CUSTOMERS({
        keyword: filters.keyword || undefined,
        company_id: filters.company_id,
        page: filters.page,
        page_size: filters.page_size,
      });
      set({ customers: res.data ?? [], pagination: res.pagination });
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลลูกค้าได้");
    } finally {
      set({ isLoading: false });
    }
  },

  // ปลดล็อกรายเดียว
  openUnlockConfirm: (userId) => set({ unlockTargetId: userId }),
  closeUnlockConfirm: () => set({ unlockTargetId: null }),
  confirmUnlock: async () => {
    const { unlockTargetId, fetchCustomers } = get();
    if (!unlockTargetId) return;
    set({ isUnlocking: true });
    try {
      const res = await POST_UNLOCK_CUSTOMER(unlockTargetId);
      toast.success(res.message_th ?? "ปลดล็อกสำเร็จ");
      set({ unlockTargetId: null });
      await fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message_th ?? "ปลดล็อกไม่สำเร็จ");
    } finally {
      set({ isUnlocking: false });
    }
  },

  // ปลดล็อกทั้งหมด
  openUnlockAllConfirm: () => set({ unlockAllConfirmOpen: true }),
  closeUnlockAllConfirm: () => set({ unlockAllConfirmOpen: false }),
  closeUnlockAllProgress: () =>
    set({ unlockAllProgress: { open: false, unlocked: 0, total: 0, percent: 0, isDone: false } }),

  startUnlockAll: async () => {
    const { filters, fetchCustomers } = get();
    set({
      unlockAllConfirmOpen: false,
      unlockAllProgress: { open: true, unlocked: 0, total: 0, percent: 0, isDone: false },
    });

    try {
      await POST_UNLOCK_ALL(filters.company_id, (ev: UnlockAllProgressEvent) => {
        if (ev.type === "start") {
          set((s) => ({ unlockAllProgress: { ...s.unlockAllProgress, total: ev.total ?? 0 } }));
        } else if (ev.type === "progress") {
          set((s) => ({
            unlockAllProgress: {
              ...s.unlockAllProgress,
              unlocked: ev.unlocked ?? 0,
              total: ev.total ?? 0,
              percent: ev.percent ?? 0,
            },
          }));
        } else if (ev.type === "done") {
          set((s) => ({
            unlockAllProgress: {
              ...s.unlockAllProgress,
              unlocked: ev.unlocked ?? 0,
              total: ev.total ?? 0,
              percent: 100,
              isDone: true,
            },
          }));
          toast.success(`ปลดล็อกทั้งหมด ${ev.unlocked} บัญชีสำเร็จ`);
          fetchCustomers();
        }
      });
    } catch (err: any) {
      toast.error(err?.message ?? "ปลดล็อกทั้งหมดไม่สำเร็จ");
      set((s) => ({ unlockAllProgress: { ...s.unlockAllProgress, isDone: true } }));
    }
  },

  // Activity Log
  fetchActivityLogs: async (page = 1) => {
    set({ isLoadingLogs: true });
    try {
      const res = await GET_ACTIVITY_LOGS({ page, page_size: 20 });
      set({ activityLogs: res.data ?? [], activityPagination: res.pagination });
    } catch {
      toast.error("ไม่สามารถโหลด Activity Log ได้");
    } finally {
      set({ isLoadingLogs: false });
    }
  },
}));
