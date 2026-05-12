import { create } from "zustand";
import {
  SchoolOption,
  TLineGroupItem,
  fetchSchoolOptions as apiFetchSchoolOptions,
  createSchoolLineGroup,
  deleteSchoolLineGroup,
  fetchSchoolLineGroups,
  fetchTestLinePreview,
  sendTestLineReport,
  updateSchoolLineGroup,
} from "../_api/school-line-group-service";

export type { SchoolOption };

interface SchoolLineGroupState {
  items: TLineGroupItem[];
  loading: boolean;
  schoolOptions: SchoolOption[];
  schoolOptionsLoading: boolean;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filterSchoolId: number | undefined;
  sendingId: number | null;
  sendProgress: number;
  deleteId: number | null;
  statusModal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
    errorDetails?: unknown;
  };

  // Preview State
  previewModal: {
    open: boolean;
    data: any | null;
    loading: boolean;
  };

  // CRUD State
  isModalOpen: boolean;
  modalMode: "create" | "edit";
  editItem: TLineGroupItem | null;

  // Actions
  fetchSchoolOptions: () => Promise<void>;
  setFilterSchoolId: (id: number | undefined) => void;
  setSendingId: (id: number | null) => void;
  setSendProgress: (p: number) => void;
  setDeleteId: (id: number | null) => void;
  setStatusModal: (modal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
    errorDetails?: unknown;
  }) => void;
  closeModal: () => void;

  // Preview Actions
  openPreview: (item: TLineGroupItem) => Promise<void>;
  closePreview: () => void;
  confirmSend: () => Promise<void>;

  // CRUD Actions
  openCreateModal: () => void;
  openEditModal: (item: TLineGroupItem) => void;
  closeFormModal: () => void;

  fetchData: (page?: number) => Promise<void>;
  resetFilters: () => void;

  submitForm: (values: Record<string, unknown>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

/**
 * Zustand store สำหรับจัดการ State ของหน้า School Line Group
 */
export const useSchoolLineGroupStore = create<SchoolLineGroupState>(
  (set, get) => ({
    items: [],
    loading: false,
    schoolOptions: [],
    schoolOptionsLoading: false,
    pagination: {
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
    },
    filterSchoolId: undefined,
    sendingId: null,
    sendProgress: 0,
    deleteId: null,
    statusModal: {
      open: false,
      type: "success",
      title: "",
      message: "",
      errorDetails: undefined,
    },

    // Preview State
    previewModal: {
      open: false,
      data: null,
      loading: false,
    },

    isModalOpen: false,
    modalMode: "create",
    editItem: null,

    fetchSchoolOptions: async () => {
      if (get().schoolOptions.length > 0) return;
      set({ schoolOptionsLoading: true });
      try {
        const options = await apiFetchSchoolOptions();
        set({ schoolOptions: options });
      } catch {
        // ถ้าโหลดไม่สำเร็จ ให้ใช้ InputNumber แทน
      } finally {
        set({ schoolOptionsLoading: false });
      }
    },

    setFilterSchoolId: (id) => set({ filterSchoolId: id }),
    setSendingId: (id) => set({ sendingId: id }),
    setSendProgress: (p) => set({ sendProgress: p }),
    /**
     * ตั้งค่าข้อมูล Modal สถานะ
     */
    setStatusModal: (modal) => {
      // ถ้าเป็นประเภทลบ ให้ล้าง deleteId เดิมออกก่อน (ถ้ามี)
      if (modal.type !== "delete") {
        set({ deleteId: null });
      }
      set({ statusModal: modal });
    },

    /**
     * ตั้งค่า ID ที่ต้องการลบ
     */
    setDeleteId: (id: number | null) => set({ deleteId: id }),
    closeModal: () =>
      set((state) => ({ statusModal: { ...state.statusModal, open: false } })),

    // Preview Actions
    openPreview: async (item) => {
      set({
        previewModal: { open: true, data: null, loading: true },
        sendingId: item.SchoolId,
      });
      try {
        const res = await fetchTestLinePreview(item.SchoolId);
        // ✨ เข้าถึง res.data.data เพราะ successResponse คืนค่า { status, data, ... }
        set((state) => ({
          previewModal: {
            ...state.previewModal,
            data: res.data,
            loading: false,
          },
        }));
      } catch (error: any) {
        set({
          previewModal: { open: false, data: null, loading: false },
          statusModal: {
            open: true,
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message:
              error?.response?.data?.message_th ||
              "ไม่สามารถดึงข้อมูล Preview ได้",
            errorDetails: error?.response?.data || error,
          },
        });
      }
    },

    closePreview: () =>
      set({
        previewModal: { open: false, data: null, loading: false },
        sendingId: null,
      }),

    confirmSend: async () => {
      const schoolId = get().sendingId;
      if (!schoolId) return;

      // ✨ จำลอง Progress
      set({
        previewModal: { ...get().previewModal, open: false },
        sendProgress: 1,
      });

      const interval = setInterval(() => {
        set((state) => {
          if (state.sendProgress >= 90) {
            clearInterval(interval);
            return state;
          }
          return {
            sendProgress:
              state.sendProgress + Math.floor(Math.random() * 15) + 5,
          };
        });
      }, 200);

      try {
        await sendTestLineReport(schoolId);
        clearInterval(interval);
        set({ sendProgress: 100 });

        // หน่วงเวลาเล็กน้อยให้เห็น 100%
        setTimeout(() => {
          set({
            sendProgress: 0,
            sendingId: null,
            statusModal: {
              open: true,
              type: "success",
              title: "ส่งข้อมูลสำเร็จ",
              message: "ส่งรายงานสถานะเครื่องไปยัง LINE เรียบร้อยแล้ว",
            },
          });
        }, 500);
      } catch (error: any) {
        clearInterval(interval);
        set({
          sendProgress: 0,
          sendingId: null,
          statusModal: {
            open: true,
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message:
              error?.response?.data?.message_th ||
              "ไม่สามารถส่งข้อมูลไปยัง LINE ได้",
            errorDetails: error,
          },
        });
      }
    },

    openCreateModal: () =>
      set({ isModalOpen: true, modalMode: "create", editItem: null }),
    openEditModal: (item) =>
      set({ isModalOpen: true, modalMode: "edit", editItem: item }),
    closeFormModal: () => set({ isModalOpen: false, editItem: null }),

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
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้";
        set({
          statusModal: {
            open: true,
            type: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: "ไม่สามารถดึงข้อมูลกลุ่ม LINE ได้ กรุณาลองใหม่อีกครั้ง",
            errorDetails: errMsg,
          },
        });
      } finally {
        set({ loading: false });
      }
    },

    resetFilters: () => {
      set({ filterSchoolId: undefined });
      get().fetchData(1);
    },

    submitForm: async (values: Record<string, unknown>) => {
      const { modalMode, editItem, fetchData, closeFormModal } = get();
      set({ loading: true });
      try {
        let res;
        if (modalMode === "create") {
          res = await createSchoolLineGroup({
            school_id: values.school_id as number,
            group_id: values.group_id as string,
            line_notification_access_token:
              values.line_notification_access_token as string,
            group_type: values.group_type as string,
          });
        } else if (editItem) {
          res = await updateSchoolLineGroup({
            line_group_id: editItem.LineGroupId,
            school_id: values.school_id as number,
            group_id: values.group_id as string,
            line_notification_access_token:
              values.line_notification_access_token as string,
            group_type: values.group_type as string,
          });
        }

        const isSuccess =
          (res?.status ?? res?.status_code) === 200 ||
          (res?.status ?? res?.status_code) === 201;
        if (isSuccess) {
          closeFormModal();
          void fetchData();
          set({
            statusModal: {
              open: true,
              type: "success",
              title:
                modalMode === "create"
                  ? "เพิ่มกลุ่ม LINE สำเร็จ"
                  : "แก้ไขข้อมูลกลุ่ม LINE สำเร็จ",
              message:
                res?.message_th ??
                (modalMode === "create"
                  ? "เพิ่มข้อมูลเรียบร้อยแล้ว"
                  : "แก้ไขข้อมูลเรียบร้อยแล้ว"),
            },
          });
        } else {
          throw new Error(res?.message_th || "ดำเนินการไม่สำเร็จ");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        set({
          statusModal: {
            open: true,
            type: "error",
            title:
              modalMode === "create"
                ? "เพิ่มกลุ่ม LINE ไม่สำเร็จ"
                : "แก้ไขข้อมูลกลุ่ม LINE ไม่สำเร็จ",
            message:
              "ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
            errorDetails: msg,
          },
        });
      } finally {
        set({ loading: false });
      }
    },

    removeItem: async (id) => {
      const { fetchData } = get();
      set({ loading: true });
      try {
        const res = await deleteSchoolLineGroup(id);
        if ((res?.status ?? res?.status_code) === 200) {
          void fetchData();
          set({
            statusModal: {
              open: true,
              type: "success",
              title: "ลบข้อมูลสำเร็จ",
              message:
                res?.message_th ?? "ลบกลุ่ม LINE ออกจากระบบเรียบร้อยแล้ว",
            },
          });
        } else {
          throw new Error(res?.message_th || "ลบข้อมูลไม่สำเร็จ");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        set({
          statusModal: {
            open: true,
            type: "error",
            title: "ลบข้อมูลไม่สำเร็จ",
            message: "ไม่สามารถลบกลุ่ม LINE ได้ กรุณาลองใหม่อีกครั้ง",
            errorDetails: msg,
          },
        });
      } finally {
        set({ loading: false });
      }
    },
  }),
);
