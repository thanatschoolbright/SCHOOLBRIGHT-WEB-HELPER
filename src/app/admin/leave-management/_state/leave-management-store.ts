import { toast } from "sonner";
import { create } from "zustand";
import {
  requestConfirmLeave,
  responseLeaveList,
} from "../_api/leave-management-api";

// --- Types ---
export interface LeaveItem {
  id: number;
  // letter_id คือ leaveLetterId จาก API ใช้ส่งไปใน confirmLeave
  letter_id: number;
  leave_letter_id: number;
  // school_id_raw ของผู้ขอลา สำหรับส่งไปใน confirmLeave
  school_id_raw: number;
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

  // Batch selection
  selectedRowKeys: number[];
  isApproving: boolean;

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
  setFilter: (
    key: string,
    value: string | number | [string, string] | undefined,
  ) => void;
  resetFilters: () => void;
  setSelectedRowKeys: (keys: number[]) => void;
  clearSelection: () => void;
  approveLeave: (ids: number[]) => Promise<void>;
  rejectLeave: (ids: number[]) => Promise<void>;
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
    selectedRowKeys: [],
    isApproving: false,

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
        // ใช้ 1233762 เป็นค่า default ID ถ้าไม่มีการระบุ search
        const targetId = filters.search || "1233762";
        const formattedUserId = `${targetId}/${filters.page}`;

        const response = await responseLeaveList({
          userid: formattedUserId,
          schoolid: filters.school_id,
        });

        if (response.data.status_code === 200 || response.data.status === 200) {
          // ตรวจสอบโครงสร้างข้อมูลที่มาจาก API
          const rawList = response.data.data || [];

          // Map ข้อมูลให้เข้ากับ Schema ของ Frontend โดยอ้างอิงจากโครงสร้าง API LeaveLetterList
          const mappedLeaves: LeaveItem[] = Array.isArray(rawList)
            ? rawList.map((item: any) => ({
                id: item.letterId || item.leaveLetterId,
                letter_id: item.letterId,
                leave_letter_id: item.leaveLetterId,
                user_id_raw: item.leaveLetterId, // ใช้ leaveLetterId เป็น userid ในการ confirm
                school_id_raw: item.SchoolID,
                student_name: item.senderName || "ไม่ระบุชื่อ",
                leave_type: item.letterType || "ไม่ระบุประเภท",
                start_date: item.letterSubmitDate,
                end_date: item.letterSubmitDate,
                reason: "-",
                status: item.ApprovedStatus?.TextTH || "รออนุมัติ",
                created_at: item.letterSubmitDate,
              }))
            : [];

          set({
            leaves: mappedLeaves,
            pagination: {
              total: mappedLeaves.length,
              current_page: filters.page,
              per_page: filters.limit,
              total_pages: 1,
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
          page: key === "page" ? (value as number) : 1,
        },
      }));
    },

    // จัดการ selected rows สำหรับ batch action
    setSelectedRowKeys: (keys) => set({ selectedRowKeys: keys }),
    clearSelection: () => set({ selectedRowKeys: [] }),

    // อนุมัติการลา (รองรับทั้งทีละคนและ batch โดย loop call API ทีละรายการ)
    approveLeave: async (ids) => {
      set({ isApproving: true });
      try {
        const { leaves } = get();
        // หา LeaveItem ที่ตรงกับ id ที่เลือกเพื่อนำ letter_id, user_id_raw, school_id_raw ไปใช้
        const targets = leaves.filter((item) => ids.includes(item.id));
        await Promise.all(
          targets.map((item) =>
            requestConfirmLeave({
              letter_id: item.letter_id,
              school_id: item.school_id_raw,
              approve: "1",
            }),
          ),
        );
        toast.success(`อนุมัติการลาจำนวน ${ids.length} รายการสำเร็จ`);
        set({ selectedRowKeys: [] });
        await get().fetchData();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
      } finally {
        set({ isApproving: false });
      }
    },

    // ไม่อนุมัติการลา (รองรับทั้งทีละคนและ batch โดย loop call API ทีละรายการ)
    rejectLeave: async (ids) => {
      set({ isApproving: true });
      try {
        const { leaves } = get();
        const targets = leaves.filter((item) => ids.includes(item.id));
        await Promise.all(
          targets.map((item) =>
            requestConfirmLeave({
              letter_id: item.letter_id,
              school_id: item.school_id_raw,
              approve: "0",
            }),
          ),
        );
        toast.success(`ไม่อนุมัติการลาจำนวน ${ids.length} รายการสำเร็จ`);
        set({ selectedRowKeys: [] });
        await get().fetchData();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการไม่อนุมัติ");
      } finally {
        set({ isApproving: false });
      }
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
