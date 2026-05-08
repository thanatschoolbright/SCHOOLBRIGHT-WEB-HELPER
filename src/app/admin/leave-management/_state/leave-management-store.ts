import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import { create } from "zustand";
import {
  requestConfirmLeave,
  responseLeaveList,
} from "../_api/leave-management-api";

// --- Types ---
export interface SchoolUser {
  UserID: number;
  Name: string;
  LastName: string;
  BarCode?: string;
  username?: string;
}

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

export type BatchItemStatus = "waiting" | "processing" | "success" | "error";

export interface BatchProgressItem {
  id: number;
  student_name: string;
  leave_type: string;
  status: BatchItemStatus;
  error_message?: string;
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

  // User dropdown
  schoolUsers: SchoolUser[];
  isLoadingUsers: boolean;

  // Batch selection
  selectedRowKeys: number[];
  isApproving: boolean;

  // Batch progress modal
  showProgressModal: boolean;
  batchProgress: BatchProgressItem[];

  // Filters
  filters: {
    page: number;
    limit: number;
    user_id?: string | number;
    date_range?: [string, string];
    school_id?: string | number;
  };

  // Actions
  fetchData: () => Promise<void>;
  fetchSchoolUsers: () => Promise<void>;
  setFilter: (
    key: string,
    value: string | number | [string, string] | undefined,
  ) => void;
  resetFilters: () => void;
  setSelectedRowKeys: (keys: number[]) => void;
  clearSelection: () => void;
  setShowProgressModal: (visible: boolean) => void;
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
    schoolUsers: [],
    isLoadingUsers: false,
    selectedRowKeys: [],
    isApproving: false,
    showProgressModal: false,
    batchProgress: [],

    filters: {
      page: 1,
      limit: 50,
      user_id: undefined,
      date_range: undefined,
      school_id: undefined,
    },

    // ดึงรายชื่อผู้ใช้งานจาก school_id=39 สำหรับ Dropdown
    fetchSchoolUsers: async () => {
      set({ isLoadingUsers: true });
      try {
        const res = await callApiService.get("/api/v1/school/get-user", {
          params: { school_id: 39 },
        });
        const raw = res.data?.data ?? res.data ?? {};
        const list: SchoolUser[] = Array.isArray(raw)
          ? raw
          : Object.values(raw);
        set({ schoolUsers: list });
      } catch {
        toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้งานได้");
      } finally {
        set({ isLoadingUsers: false });
      }
    },

    // Actions
    fetchData: async () => {
      const { filters } = get();
      set({ isLoading: true });

      try {
        const targetId = filters.user_id || "";
        const formattedUserId = targetId ? `${targetId}/${filters.page}` : `/${filters.page}`;

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
    setShowProgressModal: (visible) => set({ showProgressModal: visible }),

    // อนุมัติการลา — ทำงาน sequential ทีละ 1 รายการพร้อมอัพเดต progress
    approveLeave: async (ids) => {
      const { leaves } = get();
      const targets = leaves.filter((item) => ids.includes(item.id));

      // ตั้งค่า initial progress ทุกรายการเป็น "รอคิว"
      const initialProgress: BatchProgressItem[] = targets.map((item) => ({
        id: item.id,
        student_name: item.student_name,
        leave_type: item.leave_type,
        status: "waiting",
      }));

      set({
        isApproving: true,
        batchProgress: initialProgress,
        showProgressModal: true,
      });

      // ประมวลผลทีละรายการ (sequential) ไม่ใช้ Promise.all
      for (const item of targets) {
        // อัพเดตสถานะรายการปัจจุบันเป็น "กำลังดำเนินการ"
        set((state) => ({
          batchProgress: state.batchProgress.map((p) =>
            p.id === item.id ? { ...p, status: "processing" } : p,
          ),
        }));

        try {
          await requestConfirmLeave({
            letter_id: item.letter_id,
            school_id: item.school_id_raw,
            approve: "1",
          });
          // อัพเดตสถานะเป็น "สำเร็จ"
          set((state) => ({
            batchProgress: state.batchProgress.map((p) =>
              p.id === item.id ? { ...p, status: "success" } : p,
            ),
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
          // อัพเดตสถานะเป็น "error"
          set((state) => ({
            batchProgress: state.batchProgress.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", error_message: message }
                : p,
            ),
          }));
        }
      }

      set({ isApproving: false, selectedRowKeys: [] });
      await get().fetchData();
    },

    // ไม่อนุมัติการลา — ทำงาน sequential ทีละ 1 รายการพร้อมอัพเดต progress
    rejectLeave: async (ids) => {
      const { leaves } = get();
      const targets = leaves.filter((item) => ids.includes(item.id));

      const initialProgress: BatchProgressItem[] = targets.map((item) => ({
        id: item.id,
        student_name: item.student_name,
        leave_type: item.leave_type,
        status: "waiting",
      }));

      set({
        isApproving: true,
        batchProgress: initialProgress,
        showProgressModal: true,
      });

      for (const item of targets) {
        set((state) => ({
          batchProgress: state.batchProgress.map((p) =>
            p.id === item.id ? { ...p, status: "processing" } : p,
          ),
        }));

        try {
          await requestConfirmLeave({
            letter_id: item.letter_id,
            school_id: item.school_id_raw,
            approve: "0",
          });
          set((state) => ({
            batchProgress: state.batchProgress.map((p) =>
              p.id === item.id ? { ...p, status: "success" } : p,
            ),
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
          set((state) => ({
            batchProgress: state.batchProgress.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", error_message: message }
                : p,
            ),
          }));
        }
      }

      set({ isApproving: false, selectedRowKeys: [] });
      await get().fetchData();
    },

    resetFilters: () => {
      set({
        filters: {
          page: 1,
          limit: 50,
          user_id: undefined,
          date_range: undefined,
          school_id: undefined,
        },
      });
      get().fetchData();
    },
  }),
);
