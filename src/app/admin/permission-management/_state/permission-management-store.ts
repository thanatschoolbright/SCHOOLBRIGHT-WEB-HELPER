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

// ชื่อภาษาไทยของแต่ละสิทธิ์ — ตรงกับ PERMISSIONS constant ทุกรายการ
const PERMISSION_LABELS: Record<string, string> = {
  // Admin & Core
  ADMIN_ACCESS: "สิทธิ์ Super Admin (เข้าถึงทั้งระบบ)",
  ROLE_MANAGE: "จัดการบทบาทและสิทธิ์",
  USER_MANAGE: "จัดการผู้ใช้งาน",
  AUDIT_VIEW: "ดูประวัติการตรวจสอบ",
  // Project
  PROJECT_READ: "ดูข้อมูลโปรเจกต์",
  PROJECT_WRITE: "สร้าง/แก้ไขโปรเจกต์",
  PROJECT_DELETE: "ลบโปรเจกต์",
  // Timesheet
  TIMESHEET_READ: "ดูข้อมูล Timesheet",
  TIMESHEET_WRITE: "บันทึก Timesheet",
  TIMESHEET_APPROVE: "อนุมัติ Timesheet",
  TIMESHEET_EXPORT: "ส่งออกข้อมูล Timesheet",
  // Finance
  REPORT_VIEW: "ดูรายงานทั้งหมด",
  FINANCE_READ: "ดูข้อมูลการเงิน",
  // Menu — Health Check
  MENU_HEALTH_CHECK: "เมนู: สถานะเซิร์ฟเวอร์",
  MENU_HEALTH_ALL: "เมนู: สถานะเซิร์ฟเวอร์ทั้งหมด",
  MENU_HEALTH_ONLINE: "เมนู: ตรวจสอบอุปกรณ์ออนไลน์",
  MENU_HEALTH_VERSION: "เมนู: Version Control",
  MENU_HEALTH_LOG: "เมนู: Transaction Log",
  MENU_HEALTH_HEARTBEAT: "เมนู: Heartbeats",
  // Menu — Mobile App
  MENU_MOBILE_NOTI: "เมนู: แจ้งเตือน Mobile App",
  MENU_MOBILE_LEAVE: "เมนู: ใบลา Mobile App",
  MENU_MOBILE_STAT: "เมนู: สถิติ Mobile App",
  MENU_MOBILE_QR: "เมนู: QR Health Check",
  MENU_MOBILE_ATTENDANCE: "เมนู: ตรวจสอบการเข้างาน Mobile",
  // Menu — Support
  MENU_SUPPORT_BYPASS: "เมนู: Bypass School",
  MENU_SUPPORT_NFC: "เมนู: ทดสอบ NFC Card",
  MENU_SUPPORT_CANCEL_SALES: "เมนู: ยกเลิกรายการขาย",
  MENU_SUPPORT_CUSTOMER: "เมนู: จัดการลูกค้า",
  // Menu — Testing
  MENU_TESTING_LOAD: "เมนู: Load Testing",
  // Menu — Timesheet
  MENU_TIMESHEET_PROJECT: "เมนู: Timesheet โปรเจกต์",
  MENU_TIMESHEET_ENTRY: "เมนู: บันทึก Timesheet",
  MENU_TIMESHEET_TIMELINE: "เมนู: Timeline Timesheet",
  MENU_TIMESHEET_ALL: "เมนู: Timesheet ทั้งทีม (Admin)",
  MENU_TIMESHEET_OVERTIME: "เมนู: Overtime",
  MENU_OT_MANAGEMENT: "เมนู: จัดการ OT (Admin)",
  MENU_ADMIN_LEAVE: "เมนู: จัดการวันลา (Admin)",
  // Menu — Others
  MENU_BACKLOGS: "เมนู: Backlogs Report",
  MENU_LOGGER: "เมนู: API Logs",
};

// เตรียม payload สำหรับ Seed Permissions — derive จาก PERMISSIONS constant เท่านั้น ไม่มี hardcode ซ้ำ
const buildSeedPayload = () =>
  Object.entries(PERMISSIONS).map(([key, p_code]) => ({
    p_code,
    name_th: PERMISSION_LABELS[key] ?? key.replace(/_/g, " ").toLowerCase(),
    description: p_code.startsWith("menu.")
      ? "สิทธิ์การเข้าถึงเมนูฝั่ง UI"
      : "สิทธิ์มาตรฐานระบบ",
  }));

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
