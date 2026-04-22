import { create } from "zustand";
import {
  ApiResponse,
  TLineGroupItem,
  fetchSchoolLineGroups,
} from "../_api/school-line-group-service";
import { toast } from "sonner";

interface SchoolLineGroupState {
  items: TLineGroupItem[];
  loading: boolean;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filterSchoolId: number | undefined;
  sendingId: number | null;
  statusModal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
  };

  // Actions
  setFilterSchoolId: (id: number | undefined) => void;
  setSendingId: (id: number | null) => void;
  setStatusModal: (modal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
  }) => void;
  closeModal: () => void;
  fetchData: (page?: number) => Promise<void>;
  resetFilters: () => void;
}

/**
 * Zustand store สำหรับจัดการ State ของหน้า School Line Group
 */
export const useSchoolLineGroupStore = create<SchoolLineGroupState>(
  (set, get) => ({
    items: [],
    loading: false,
    pagination: {
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
    },
    filterSchoolId: undefined,
    sendingId: null,
    statusModal: { open: false, type: "success", title: "", message: "" },

    /**
     * ตั้งค่ารหัสโรงเรียนสำหรับกรองข้อมูล
     */
    setFilterSchoolId: (id) => set({ filterSchoolId: id }),

    /**
     * ตั้งค่า ID ที่กำลังส่งข้อมูล
     */
    setSendingId: (id) => set({ sendingId: id }),

    /**
     * ตั้งค่าข้อมูล Modal สถานะ
     */
    setStatusModal: (modal) => set({ statusModal: modal }),

    /**
     * ปิด Modal สถานะ
     */
    closeModal: () =>
      set((state) => ({ statusModal: { ...state.statusModal, open: false } })),

    /**
     * ดึงข้อมูลจาก API และอัปเดต State
     */
    fetchData: async (page) => {
      const { pagination, filterSchoolId } = get();
      const currentPage = page ?? pagination.page;

      set({ loading: true });
      try {
        const body = await fetchSchoolLineGroups(
          currentPage,
          pagination.page_size,
          filterSchoolId,
        );

        if ((body.status ?? body.status_code) === 200) {
          set({
            items: body.data,
            pagination: body.pagination,
          });
        }
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        set({ loading: false });
      }
    },

    /**
     * ล้างการค้นหาและดึงข้อมูลใหม่
     */
    resetFilters: () => {
      set({ filterSchoolId: undefined });
      get().fetchData(1);
    },
  }),
);
