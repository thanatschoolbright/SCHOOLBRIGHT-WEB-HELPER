import { toast } from "sonner";
import { create } from "zustand";
import { responseLeaveList } from "../_api/leave-management-api";

// --- Types ---
export interface LeaveItem {
  id: number;
  student_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
  created_at?: string;
  school_name?: string;
}

export interface Pagination {
  total: number;
  current_page: number;
  per_page: number;
  total_pages: number;
}

interface LeaveManagementState {
  // Data
  leaves: LeaveItem[];
  pagination: Pagination;
  isLoading: boolean;

  // Filters
  filters: {
    page: number;
    limit: number;
    search?: string;
    date_range?: [string, string];
    school_id?: string | number;
  };

  // Actions
  fetchData: () => Promise<void>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
}

export const useLeaveManagementStore = create<LeaveManagementState>(
  (set, get) => ({
    // Initial State
    leaves: [],
    pagination: {
      total: 0,
      current_page: 1,
      per_page: 50,
      total_pages: 0,
    },
    isLoading: false,

    filters: {
      page: 1,
      limit: 50,
      search: undefined,
      date_range: undefined,
      school_id: undefined,
    },

    // Actions
    fetchData: async () => {
      const { filters } = get();
      set({ isLoading: true });

      try {
        const response = await responseLeaveList({
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          start_date: filters.date_range?.[0],
          end_date: filters.date_range?.[1],
          school_id: filters.school_id,
        });

        if (response.data.status_code === 200) {
          set({
            leaves: response.data.data.list || [],
            pagination: response.data.data.pagination || {
              total: 0,
              current_page: 1,
              per_page: 50,
              total_pages: 0,
            },
          });
        } else {
          toast.error(
            response.data.message_th || "เกิดข้อผิดพลาดในการดึงข้อมูล",
          );
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message_th ||
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        );
      } finally {
        set({ isLoading: false });
      }
    },

    setFilter: (key, value) => {
      set((state) => ({
        filters: {
          ...state.filters,
          [key]: value,
          page: key === "page" ? value : 1, // รีเซ็ตหน้าเมื่อเปลี่ยนตัวกรองอื่น
        },
      }));
    },

    resetFilters: () => {
      set({
        filters: {
          page: 1,
          limit: 50,
          search: undefined,
          date_range: undefined,
          school_id: undefined,
        },
      });
      get().fetchData();
    },
  }),
);
