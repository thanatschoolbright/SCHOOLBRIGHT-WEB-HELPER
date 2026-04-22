import { create } from "zustand";
import {
  TLineGroupItem,
  createSchoolLineGroup,
  deleteSchoolLineGroup,
  fetchSchoolLineGroups,
  updateSchoolLineGroup,
} from "../_api/school-line-group-service";

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
  deleteId: number | null;
  statusModal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
    errorDetails?: unknown;
  };

  // CRUD State
  isModalOpen: boolean;
  modalMode: "create" | "edit";
  editItem: TLineGroupItem | null;

  // Actions
  setFilterSchoolId: (id: number | undefined) => void;
  setSendingId: (id: number | null) => void;
  setDeleteId: (id: number | null) => void;
  setStatusModal: (modal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
    errorDetails?: unknown;
  }) => void;
  closeModal: () => void;

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
    pagination: {
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
    },
    filterSchoolId: undefined,
    sendingId: null,
    deleteId: null,
    statusModal: {
      open: false,
      type: "success",
      title: "",
      message: "",
      errorDetails: undefined,
    },

    isModalOpen: false,
    modalMode: "create",
    editItem: null,

    setFilterSchoolId: (id) => set({ filterSchoolId: id }),
    setSendingId: (id) => set({ sendingId: id }),
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
