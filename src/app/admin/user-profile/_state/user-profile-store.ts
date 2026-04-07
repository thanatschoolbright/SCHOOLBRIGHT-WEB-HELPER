import { toast } from "sonner";
import { create } from "zustand";

import { UserProfile } from "@stores/type";
import {
  requestBulkUpdateDepartment,
  requestBulkUpdateEmploymentType,
  requestBulkUpdatePosition,
  requestBulkUpdateRole,
  requestDeleteUserByID,
  requestResetPasswordBulk,
  requestResetPasswordSingle,
  requestUnlockUserByID,
  responseAllUsers,
  responseDepartments,
  responseExportUserExcel,
  responsePositions,
  responseUserConstants,
} from "../_api/user-profile-api";
import type React from "react";
import dayjs from "dayjs";

export interface FilterState {
  search: string;
  position?: number;
  department?: number;
  status?: string;
}

export type BulkMode = "position" | "department" | "role" | "employment-type" | null;

interface UserProfileStore {
  // ── State ──
  users: UserProfile[];
  positions: unknown[];
  departments: unknown[];
  roles: unknown[];
  isLoading: boolean;
  exportLoading: boolean;
  bulkLoading: boolean;
  filters: FilterState;
  selectedRowKeys: React.Key[];
  bulkMode: BulkMode;
  bulkValue: number | string | null;
  pagination: { current: number; pageSize: number };

  // ── Modal State ──
  selectedUser: UserProfile | null;
  detailModalOpen: boolean;
  deleteModalOpen: boolean;
  syncModalOpen: boolean;
  roleDrawerOpen: boolean;
  trackingModalOpen: boolean;
  usersToReset: UserProfile[] | null;
  statusModal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
    loading?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  };

  // ── Actions ──
  fetchInitialData: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  setBulkMode: (mode: BulkMode) => void;
  setBulkValue: (value: number | string | null) => void;

  // Modal actions
  openDetailModal: (user: UserProfile) => void;
  closeDetailModal: () => void;
  openDeleteModal: (user: UserProfile) => void;
  closeDeleteModal: () => void;
  setSyncModalOpen: (open: boolean) => void;
  setRoleDrawerOpen: (open: boolean) => void;
  setStatusModal: (modal: UserProfileStore["statusModal"]) => void;
  closeStatusModal: () => void;
  openTrackingModal: (users: UserProfile[]) => void;
  closeTrackingModal: () => void;

  // Business actions
  deleteUser: (adminId: number | string | undefined) => Promise<void>;
  unlockAccount: (user: UserProfile) => void;
  resetPassword: (user: UserProfile) => void;
  bulkResetPassword: () => void;
  bulkResetPasswordToPhone: () => void;
  bulkUpdateStaffData: (adminId: number | string | undefined) => Promise<void>;
  exportUserExcel: () => void;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  // ── Initial State ──
  users: [],
  positions: [],
  departments: [],
  roles: [],
  isLoading: false,
  exportLoading: false,
  bulkLoading: false,
  filters: { search: "" },
  selectedRowKeys: [],
  bulkMode: null,
  bulkValue: null,
  pagination: { current: 1, pageSize: 10 },
  selectedUser: null,
  detailModalOpen: false,
  deleteModalOpen: false,
  syncModalOpen: false,
  roleDrawerOpen: false,
  trackingModalOpen: false,
  usersToReset: null,
  statusModal: { open: false, type: "success", loading: false },

  // ── Data Fetching ──
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [userRes, posRes, deptRes, constRes] = await Promise.all([
        responseAllUsers(),
        responsePositions(),
        responseDepartments(),
        responseUserConstants(),
      ]);
      set({
        users: userRes?.data?.data?.items ?? [],
        positions: posRes?.data?.data?.items ?? [],
        departments: deptRes?.data?.data?.items ?? [],
        roles: constRes?.data?.data?.roles ?? [],
      });
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Filter Actions ──
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, current: 1 },
    }));
  },
  resetFilters: () => {
    set({
      filters: { search: "", position: undefined, department: undefined, status: undefined },
      pagination: { current: 1, pageSize: 10 },
    });
  },

  // ── UI Actions ──
  setSelectedRowKeys: (keys) => set({ selectedRowKeys: keys }),
  setPagination: (pagination) => set({ pagination }),
  setBulkMode: (mode) => set({ bulkMode: mode, bulkValue: null }),
  setBulkValue: (value) => set({ bulkValue: value }),

  // ── Modal Actions ──
  openDetailModal: (user) => set({ selectedUser: user, detailModalOpen: true }),
  closeDetailModal: () => set({ detailModalOpen: false }),
  openDeleteModal: (user) => set({ selectedUser: user, deleteModalOpen: true }),
  closeDeleteModal: () => set({ deleteModalOpen: false }),
  setSyncModalOpen: (open) => set({ syncModalOpen: open }),
  setRoleDrawerOpen: (open) => set({ roleDrawerOpen: open }),
  setStatusModal: (modal) => set({ statusModal: modal }),
  closeStatusModal: () =>
    set((state) => ({ statusModal: { ...state.statusModal, open: false } })),
  openTrackingModal: (users) => set({ usersToReset: users, trackingModalOpen: true }),
  closeTrackingModal: () => set({ trackingModalOpen: false, usersToReset: null }),

  // ── Business Actions ──
  deleteUser: async (adminId) => {
    const { selectedUser, fetchInitialData, closeDeleteModal } = get();
    if (!selectedUser) return;
    try {
      await requestDeleteUserByID({ id: selectedUser.id, deleted_by: adminId });
      toast.success("ลบพนักงานสำเร็จ");
      closeDeleteModal();
      fetchInitialData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  },

  unlockAccount: (user) => {
    const { setStatusModal, closeStatusModal, fetchInitialData } = get();
    setStatusModal({
      open: true,
      type: "confirm",
      title: "ยืนยันการปลดล็อกบัญชี?",
      message: `ต้องการล้างจำนวนครั้งที่ระบุรหัสผิดของ ${user.firstname_th} และปลดล็อกการระงับใช้งานใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await requestUnlockUserByID(user.id);
          toast.success("ปลดล็อกบัญชีเรียบร้อยแล้ว");
          fetchInitialData();
          closeStatusModal();
        } catch {
          toast.error("เกิดข้อผิดพลาดในการปลดล็อก");
          closeStatusModal();
        }
      },
    });
  },

  resetPassword: (user) => {
    const { setStatusModal, closeStatusModal } = get();
    setStatusModal({
      open: true,
      type: "confirm",
      title: "ยืนยันการรีเซ็ตรหัสผ่าน",
      message: `คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่านสำหรับ ${user.firstname_th} ${user.lastname_th}? รหัสผ่านใหม่จะถูกสุ่มและส่งไปที่อีเมล ${user.email}`,
      onConfirm: async () => {
        try {
          const res = await requestResetPasswordSingle(user.id);
          if (res.data.status === 200 || res.data.data?.success) {
            toast.success("รีเซ็ตรหัสผ่านสำเร็จ และส่งเมลเรียบร้อยแล้ว");
          } else {
            toast.error(res.data.message_th || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
          }
          closeStatusModal();
        } catch {
          toast.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
          closeStatusModal();
        }
      },
    });
  },

  bulkResetPassword: () => {
    const { setStatusModal, closeStatusModal, selectedRowKeys, setSelectedRowKeys } = get();
    setStatusModal({
      open: true,
      type: "confirm",
      title: "ยืนยันการรีเซ็ตรหัสผ่านแบบกลุ่ม",
      message: `คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่านสำหรับพนักงานที่เลือกจำนวน ${selectedRowKeys.length} ท่าน? รหัสผ่านใหม่จะถูกสุ่มและส่งไปที่เมลของแต่ละท่านทันที`,
      onConfirm: async () => {
        try {
          const res = await requestResetPasswordBulk(selectedRowKeys);
          if (res.data.status === 200 || res.data.data?.success) {
            toast.success(res.data.message_th || "ดำเนินการรีเซ็ตรหัสผ่านเรียบร้อยแล้ว");
            setSelectedRowKeys([]);
          } else {
            toast.error(res.data.message_th || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่านรายกลุ่ม");
          }
          closeStatusModal();
        } catch {
          toast.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่านรายกลุ่ม");
          closeStatusModal();
        }
      },
    });
  },

  bulkResetPasswordToPhone: () => {
    const { users, selectedRowKeys, openTrackingModal } = get();
    const selectedUsers = users.filter((u) => selectedRowKeys.includes(u.id));
    if (selectedUsers.length === 0) return;
    openTrackingModal(selectedUsers);
  },

  bulkUpdateStaffData: async (adminId) => {
    const { bulkMode, bulkValue, selectedRowKeys, fetchInitialData, setBulkMode } = get();
    if (!bulkMode || !bulkValue || selectedRowKeys.length === 0) return;

    set({ bulkLoading: true });
    try {
      const payload = {
        userIds: selectedRowKeys,
        adminId,
        ...(bulkMode === "position"
          ? { positionId: bulkValue }
          : bulkMode === "department"
            ? { departmentId: bulkValue }
            : bulkMode === "role"
              ? { roleId: bulkValue }
              : { employmentType: bulkValue }),
      };

      let res;
      if (bulkMode === "position") res = await requestBulkUpdatePosition(payload);
      else if (bulkMode === "department") res = await requestBulkUpdateDepartment(payload);
      else if (bulkMode === "role") res = await requestBulkUpdateRole(payload);
      else res = await requestBulkUpdateEmploymentType(payload);

      if (res.data.status === 200) {
        const modeLabel =
          bulkMode === "position" ? "ตำแหน่ง"
          : bulkMode === "department" ? "แผนก"
          : bulkMode === "role" ? "สิทธิ์การใช้งาน"
          : "ประเภทการจ้างงาน";
        toast.success(`ปรับปรุง${modeLabel}แบบกลุ่มสำเร็จ`);
        setBulkMode(null);
        set({ selectedRowKeys: [] });
        fetchInitialData();
      } else {
        throw new Error(res.data.message_th || "ดำเนินการไม่สำเร็จ");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการปรับปรุงข้อมูลแบบกลุ่ม");
    } finally {
      set({ bulkLoading: false });
    }
  },

  exportUserExcel: () => {
    const { setStatusModal, closeStatusModal } = get();
    setStatusModal({
      open: true,
      type: "confirm",
      title: "เตรียมส่งออกข้อมูลพนักงานในรูปแบบตาราง",
      message: "ระบบจะรวบรวมข้อมูลพนักงานทั้งหมดที่มีความแม่นยำสูงเพื่อใช้ในการจัดเตรียมรายงานความพร้อมบริษัท กรุณายืนยันการดำเนินการ",
      confirmLabel: "เริ่มดาวน์โหลด",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        set({ exportLoading: true });
        setStatusModal({
          open: true,
          type: "confirm",
          loading: true,
          message: "กำลังรวบรวมข้อมูลและจัดเตรียมไฟล์รายงานความละเอียดสูง กรุณารอสักครู่...",
        });
        try {
          const res = await responseExportUserExcel();
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const now = dayjs();
          const thaiYear = now.year() + 543;
          link.setAttribute("download", `รายงานพนักงานบริษัทจับจ่ายคอร์เปอเรชัน_จำกัด_${now.format("DD-MM")}-${thaiYear}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          setStatusModal({
            open: true,
            type: "success",
            title: "ส่งออกรายงานพนักงานสำเร็จ",
            message: "ระบบได้ทำการดาวน์โหลดไฟล์รายงานลงในเครื่องคอมพิวเตอร์ของท่านเรียบร้อยแล้ว",
            onConfirm: closeStatusModal,
          });
          toast.success("ส่งออกรายงานพนักงานสำเร็จ");
        } catch {
          setStatusModal({
            open: true,
            type: "error",
            title: "ส่งออกข้อมูลล้มเหลว",
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลจาก Server กรุณาตรวจสอบการเชื่อมต่อ หรือติดต่อฝ่าย IT",
            onConfirm: closeStatusModal,
          });
          toast.error("ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
          set({ exportLoading: false });
        }
      },
    });
  },
}));
