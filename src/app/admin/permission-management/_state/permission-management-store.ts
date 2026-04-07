import type { ModalFuncProps } from "antd";
import { toast } from "sonner";
import { create } from "zustand";
import { PERMISSIONS } from "@/constants/permission.constant";
import {
  responseAllRoles,
  responseAllPermissions,
  requestCreateRole,
  requestUpdateRole,
  requestDeleteRole,
  requestSeedPermissions,
  requestDeletePermissions,
  requestDeletePermission,
} from "../_api/permission-management-api";

// --- Types ---
export interface Permission {
  id: number;
  p_code: string;
  name_th: string;
  description?: string;
}

export interface Role {
  id: number;
  role_name: string;
  description?: string;
  is_active: boolean;
  permissions: {
    permission_id: number;
    permission: Permission;
  }[];
  _count?: {
    users: number;
  };
}

interface PermissionManagementState {
  // Data
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;

  // Filters
  search: string;

  // UI Control
  selectedRole: Role | null;
  modalMode: "create" | "edit" | null;
  deleteModalOpen: boolean;
  selectedPermKeys: React.Key[];

  // Actions
  fetchData: () => Promise<void>;
  setSearch: (s: string) => void;
  setModalMode: (mode: "create" | "edit" | null) => void;
  setSelectedRole: (role: Role | null) => void;
  setDeleteModalOpen: (open: boolean) => void;
  setSelectedPermKeys: (keys: React.Key[]) => void;
  handleSubmit: (values: Record<string, unknown>) => Promise<void>;
  handleDeleteRole: () => Promise<void>;
  handleBulkDeletePermissions: (
    confirmFn: (config: ModalFuncProps) => void
  ) => void;
  handleDeleteSinglePermission: (
    permission: Permission,
    confirmFn: (config: ModalFuncProps) => void
  ) => void;
  handleSeedPermissions: () => Promise<void>;
}

// เตรียม payload สำหรับ Seed Permissions มาตรฐาน
const buildSeedPayload = () => {
  // 1. สิทธิ์มาตรฐาน IPO จาก PERMISSIONS constant
  const standardPerms = Object.entries(PERMISSIONS).map(([key, value]) => ({
    p_code: value,
    name_th: key.replace(/_/g, " ").toLowerCase(),
    description: `สิทธิ์มาตรฐานระบบ: ${key}`,
  }));

  // 2. สิทธิ์การเข้าถึงเมนูฝั่ง UI (sidebar)
  const menuPerms = [
    // Admin System
    { p_code: "menu.admin.user_profile", name_th: "เข้าถึงเมนู: ข้อมูลผู้ใช้งาน" },
    { p_code: "menu.admin.role_management", name_th: "เข้าถึงเมนู: จัดการสิทธิ์" },
    { p_code: "menu.admin.position_management", name_th: "เข้าถึงเมนู: จัดการตำแหน่ง" },
    { p_code: "menu.admin.department_management", name_th: "เข้าถึงเมนู: จัดการแผนก" },
    // Testing
    { p_code: "menu.testing.load_testing", name_th: "เข้าถึงเมนู: Load Testing" },
    // Support
    { p_code: "menu.support.bypass_school", name_th: "เข้าถึงเมนู: Bypass School" },
    { p_code: "menu.support.test_nfc_card", name_th: "เข้าถึงเมนู: Test NFC Card" },
    { p_code: "menu.support.cancel_sales", name_th: "เข้าถึงเมนู: Cancel Sales" },
    // Health Check
    { p_code: "menu.health_check.server_status", name_th: "เข้าถึงเมนู: Server Status" },
    { p_code: "menu.health_check.all_server_status", name_th: "เข้าถึงเมนู: All Server Status" },
    { p_code: "menu.health_check.online_status", name_th: "เข้าถึงเมนู: Online Status" },
    { p_code: "menu.health_check.version_control", name_th: "เข้าถึงเมนู: Version Control" },
    { p_code: "menu.health_check.transaction_log", name_th: "เข้าถึงเมนู: Transaction Log" },
    { p_code: "menu.health_check.heartbeats", name_th: "เข้าถึงเมนู: Heartbeats" },
    // Mobile App
    { p_code: "menu.mobile.notification", name_th: "เข้าถึงเมนู: Mobile Notification" },
    { p_code: "menu.mobile.leave_letter", name_th: "เข้าถึงเมนู: Mobile Leave Letter" },
    { p_code: "menu.mobile.statistic", name_th: "เข้าถึงเมนู: Mobile Statistics" },
    { p_code: "menu.mobile.qrcode_health_check", name_th: "เข้าถึงเมนู: QR Health Check" },
    { p_code: "menu.mobile.check_attendance", name_th: "เข้าถึงเมนู: Check Attendance" },
    // Timesheet
    { p_code: "menu.timesheet.project", name_th: "เข้าถึงเมนู: Timesheet Project" },
    { p_code: "menu.timesheet.entry", name_th: "เข้าถึงเมนู: Timesheet Entry" },
    { p_code: "menu.timesheet.timeline", name_th: "เข้าถึงเมนู: Timesheet Timeline" },
    { p_code: "menu.timesheet.all", name_th: "เข้าถึงเมนู: Timesheet All (Admin)" },
    { p_code: "menu.timesheet.overtime", name_th: "เข้าถึงเมนู: Timesheet Overtime" },
    // Backlogs
    { p_code: "menu.backlogs.report", name_th: "เข้าถึงเมนู: Backlogs Report" },
    // Logger
    { p_code: "menu.logger.api_logs", name_th: "เข้าถึงเมนู: API Logs" },
  ].map((m) => ({ ...m, description: "สิทธิ์การเข้าถึงเมนูฝั่ง UI" }));

  return [...standardPerms, ...menuPerms];
};

export const usePermissionManagementStore = create<PermissionManagementState>(
  (set, get) => ({
    roles: [],
    permissions: [],
    isLoading: false,
    search: "",
    selectedRole: null,
    modalMode: null,
    deleteModalOpen: false,
    selectedPermKeys: [],

    setSearch: (search) => set({ search }),
    setModalMode: (modalMode) => set({ modalMode }),
    setSelectedRole: (selectedRole) => set({ selectedRole }),
    setDeleteModalOpen: (deleteModalOpen) => set({ deleteModalOpen }),
    setSelectedPermKeys: (selectedPermKeys) => set({ selectedPermKeys }),

    /**
     * โหลดข้อมูล Roles + Permissions พร้อมกัน
     */
    fetchData: async () => {
      set({ isLoading: true });
      try {
        const [roleRes, permRes] = await Promise.all([
          responseAllRoles(get().search),
          responseAllPermissions(),
        ]);
        set({
          roles: roleRes?.data?.data?.items || [],
          permissions: permRes?.data?.data || [],
        });
      } catch (error) {
        console.error(error);
        toast.info("โหมดแสดงผล (API ยังไม่พร้อม)");
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * บันทึก Role — สร้างใหม่หรืออัปเดตตาม modalMode
     */
    handleSubmit: async (values) => {
      const { modalMode, selectedRole, fetchData } = get();
      try {
        const payload = {
          ...values,
          permission_ids: values.permission_ids || [],
        };

        if (modalMode === "create") {
          await requestCreateRole(payload);
          toast.success("สร้างบทบาทสำเร็จ");
        } else {
          await requestUpdateRole({ ...payload, id: selectedRole?.id });
          toast.success("อัปเดตสิทธิ์บทบาทสำเร็จ");
        }
        set({ modalMode: null });
        await fetchData();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message_th?: string } } };
        toast.error(error?.response?.data?.message_th || "เกิดข้อผิดพลาด");
      }
    },

    /**
     * ลบ Role ที่เลือก
     */
    handleDeleteRole: async () => {
      const { selectedRole, fetchData } = get();
      if (!selectedRole) return;
      try {
        await requestDeleteRole(selectedRole.id);
        toast.success("ลบบทบาทเรียบร้อยแล้ว");
        set({ deleteModalOpen: false });
        await fetchData();
      } catch {
        toast.error("ไม่สามารถลบได้เนื่องจากมีผู้ใช้ใช้บทบาทนี้อยู่");
      }
    },

    /**
     * ลบ Permissions แบบกลุ่มพร้อม confirm dialog
     */
    handleBulkDeletePermissions: (confirmFn: (config: ModalFuncProps) => void) => {
      const { selectedPermKeys, fetchData } = get();
      if (selectedPermKeys.length === 0) return;

      confirmFn({
        title: "ลบสิทธิ์ที่เลือก",
        content: `คุณต้องการลบสิทธิ์จำนวน ${selectedPermKeys.length} รายการที่เลือกใช่หรือไม่?`,
        okText: "ลบทั้งหมด",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await requestDeletePermissions(selectedPermKeys as number[]);
            toast.success("ลบสิทธิ์ที่เลือกสำเร็จ");
            set({ selectedPermKeys: [] });
            await fetchData();
          } catch {
            toast.error("เกิดข้อผิดพลาดในการลบสิทธิ์แบบกลุ่ม");
          }
        },
      });
    },

    /**
     * ลบ Permission เดี่ยว พร้อม confirm dialog
     */
    handleDeleteSinglePermission: (permission: Permission, confirmFn: (config: ModalFuncProps) => void) => {
      const { fetchData } = get();
      confirmFn({
        title: "ยืนยันการลบสิทธิ์",
        content: `คุณต้องการลบสิทธิ์ ${permission.name_th} (${permission.p_code}) ใช่หรือไม่? การลบนี้จะมีผลกับทุกบทบาทที่ถือสิทธิ์นี้อยู่`,
        okText: "ลบ",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await requestDeletePermission(permission.id);
            toast.success("ลบสิทธิ์สำเร็จ");
            await fetchData();
          } catch {
            toast.error("ลบสิทธิ์ไม่สำเร็จ");
          }
        },
      });
    },

    /**
     * Seed Permissions มาตรฐาน IPO + เมนู UI
     */
    handleSeedPermissions: async () => {
      try {
        const finalPerms = buildSeedPayload();
        await requestSeedPermissions(finalPerms);
        toast.success("Seed รายสิทธิ์ตามเมนูสำเร็จ");
        await get().fetchData();
      } catch {
        toast.error("Seed ล้มเหลว (อาจมีข้อมูลบางส่วนอยู่แล้ว)");
      }
    },
  })
);
