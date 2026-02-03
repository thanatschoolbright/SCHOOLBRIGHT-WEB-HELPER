"use client";

import {
  ApartmentOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CloudSyncOutlined,
  CodeOutlined,
  ControlOutlined,
  DashboardOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FlagOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import { UserProfile } from "@stores/type";
import { SyncModal } from "./components/sync-modal";
const { Title, Text, Paragraph } = Typography;

// ==========================================
// 1. SERVICES & API CALLS (Logic)
// ==========================================

/**
 * รวมฟังก์ชันสำหรับการเรียกใช้งาน API ที่เกี่ยวข้องกับการจัดการผู้ใช้งาน
 */
const requestUserProfileService = {
  // ดึงข้อมูลพนักงานทั้งหมดที่มีในระบบ
  requestFetchAllUsers: async () => {
    return await axios.get("/api/v2/admin/user-management/read?limit=1000");
  },
  // ดึงข้อมูลตำแหน่งงานทั้งหมดที่มีในระบบ
  requestFetchPositions: async () => {
    return await axios.get("/api/v2/admin/position-management/read?limit=1000");
  },
  // สร้างพนักงานใหม่ในระบบ
  requestCreateNewUser: async (payload: any) => {
    return await axios.post("/api/v2/admin/user-management/create", payload);
  },
  // แก้ไขข้อมูลพนักงานที่มีอยู่แล้วตาม ID
  requestUpdateUserByID: async (payload: any) => {
    return await axios.post("/api/v2/admin/user-management/update", payload);
  },
  // ลบข้อมูลพนักงานออกจากระบบ (Soft Delete)
  requestDeleteUserByID: async (payload: any) => {
    return await axios.post("/api/v2/admin/user-management/delete", payload);
  },
  // ปลดล็อกบัญชีผู้ใช้งานที่ใส่รหัสผ่านผิดเกินกำหนด
  requestUnlockUserByID: async (userAccountID: number) => {
    return await axios.post("/api/v2/admin/user-management/unlock", {
      id: userAccountID,
    });
  },
};

// ==========================================
// 2. TYPES
// ==========================================

interface FilterState {
  search: string;
  position?: number;
  department?: number;
  status?: string;
}

// ==========================================
// 3. COMPONENTS
// ==========================================

const ResetPasswordTrackingModal = ({
  open,
  users,
  adminId,
  onComplete,
  onCancel,
}: {
  open: boolean;
  users: any[] | null;
  adminId?: number | string;
  onComplete: () => void;
  onCancel: () => void;
}) => {
  const { token } = theme.useToken();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "รวบรวมข้อมูล", icon: <CodeOutlined /> },
    { title: "ตรวจสอบสิทธิ์", icon: <SafetyCertificateOutlined /> },
    { title: "บันทึกรหัสผ่าน", icon: <DashboardOutlined /> },
    { title: "นำส่ง Email", icon: <SendOutlined /> },
    { title: "จัดส่งสำเร็จ", icon: <FlagOutlined /> },
  ];

  const statusMessages = [
    `📦 กำลังรวบรวมข้อมูลพนักงาน ${users?.length || 0} ท่าน และเตรียมข้อมูล...`,
    "🔍 ตรวจสอบเบอร์โทรศัพท์และความถูกต้องของข้อมูลสิทธิ์...",
    "🔐 กำลังทยอยอัปเดตรหัสผ่านใหม่เป็น 'เบอร์มือถือ' ลงในฐานข้อมูล...",
    "🚀 กำลังนำส่งอีเมลแจ้งเตือนรหัสผ่านใหม่ไปยังพนักงานทุกคน...",
    "🏆 ภารกิจเสร็จสิ้น! ทุกบัญชีถูกรีเซ็ตเป็นเบอร์มือถือเรียบร้อยแล้ว",
  ];

  useEffect(() => {
    if (open && users && users.length > 0) {
      runProcess();
    } else {
      setCurrentStep(0);
    }
  }, [open, users]);

  const runProcess = async () => {
    try {
      // Step 0: Preparing
      setCurrentStep(0);
      await new Promise((r) => setTimeout(r, 1200));

      // Step 1: Validating
      setCurrentStep(1);
      const invalidUsers = users?.filter((u) => !u.phone && !(u as any).tel);
      if (invalidUsers && invalidUsers.length > 0) {
        throw new Error(
          `พบพนักงาน ${invalidUsers.length} ท่านที่ยังไม่ได้ระบุเบอร์โทรศัพท์ กรุณาตรวจสอบข้อมูลก่อนดำเนินการแบบกลุ่ม`,
        );
      }
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Hashing & Saving
      setCurrentStep(2);
      // Process in batch
      const userIds = users?.map((u) => u.id);
      const res = await axios.post(
        "/api/v2/admin/user-management/reset-password-to-phone",
        {
          userIds: userIds,
          adminId: adminId,
        },
      );

      // ตรวจสอบความสำเร็จจากโครงสร้าง Response (res.data.data.success)
      if (res.data.status !== 200 || !res.data.data?.success) {
        throw new Error(
          res.data.message_th || res.data.message_en || "API Connection Error",
        );
      }
      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: Sending Email
      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 2000));

      // Step 4: Finished
      setCurrentStep(4);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการประมวลผลแบบกลุ่ม");
      onCancel();
    }
  };

  return (
    <Modal
      open={open}
      footer={null}
      closable={currentStep === 4}
      onCancel={onCancel}
      width={750}
      centered
      styles={{ body: { padding: "50px 40px" } }}
      modalRender={(node) => (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: -10,
              right: 20,
              zIndex: 1,
              background: token.colorInfo,
              color: "white",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            รีเซ็ตรหัสผ่านกลุ่ม #รายการ-{users?.length}-ท่าน
          </div>
          {node}
        </div>
      )}
    >
      <div className="text-center">
        <div className="py-10 mb-8 relative  rounded-3xl overflow-hidden border border-dashed border-slate-200 dark:border-slate-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="flex flex-col items-center"
            >
              <div
                style={{
                  fontSize: 72,
                  color:
                    currentStep === 4 ? token.colorSuccess : token.colorPrimary,
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                }}
              >
                {currentStep === 4 ? (
                  <CheckCircleOutlined />
                ) : currentStep === 3 ? (
                  <SendOutlined />
                ) : (
                  <CarOutlined spin={false} />
                )}
              </div>
              <Typography.Title level={3} className="mt-6 mb-2">
                {steps[currentStep].title}
              </Typography.Title>
              <Typography.Text
                type="secondary"
                className="text-lg px-8 max-w-md block mx-auto"
              >
                {statusMessages[currentStep]}
              </Typography.Text>
            </motion.div>
          </AnimatePresence>

          {/* Road/Tracking Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        </div>

        <Steps
          current={currentStep}
          labelPlacement="vertical"
          items={steps.map((s) => ({
            ...s,
            icon:
              currentStep > steps.indexOf(s) ? <CheckCircleOutlined /> : s.icon,
          }))}
        />

        {currentStep === 4 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-10"
          >
            <Button
              type="primary"
              size="large"
              block
              onClick={onComplete}
              style={{ height: 54, borderRadius: 16, fontSize: 18 }}
            >
              ตรวจสอบความเรียบร้อย (ปิดหน้านี้)
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
};

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function UserManagementPage() {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const isDark = token.colorBgBase !== "#ffffff";
  const [form] = Form.useForm();
  const router = useRouter();

  // Auth State
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  // Local State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });

  // Modals State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false); // For Role Management
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [usersToReset, setUsersToReset] = useState<UserProfile[] | null>(null);

  // Bulk Edit State
  const [bulkMode, setBulkMode] = useState<
    "position" | "department" | "role" | "employment-type" | null
  >(null);
  const [bulkValue, setBulkValue] = useState<number | string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // --- Logic: Reset Password ---
  const requestResetPassword = async (user: UserProfile) => {
    modal.confirm({
      title: "ยืนยันการรีเซ็ตรหัสผ่าน",
      icon: <WarningOutlined style={{ color: token.colorWarning }} />,
      content: `คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่านสำหรับ ${user.firstname_th} ${user.lastname_th}? รหัสผ่านใหม่จะถูกสุ่มและส่งไปที่อีเมล ${user.email}`,
      okText: "ยืนยันรีเซ็ต",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await axios.post(
            "/api/v2/admin/user-management/reset-password",
            {
              userId: user.id,
            },
          );
          if (res.data.status === 200 || res.data.data?.success) {
            toast.success("รีเซ็ตรหัสผ่านสำเร็จ และส่งเมลเรียบร้อยแล้ว");
          } else {
            toast.error(
              res.data.message_th || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
            );
          }
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ||
              "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
          );
        }
      },
    });
  };

  const requestBulkResetPassword = async () => {
    modal.confirm({
      title: "ยืนยันการรีเซ็ตรหัสผ่านแบบกลุ่ม",
      icon: <WarningOutlined style={{ color: token.colorWarning }} />,
      content: `คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่านสำหรับพนักงานที่เลือกจำนวน ${selectedRowKeys.length} ท่าน? รหัสผ่านใหม่จะถูกสุ่มและส่งไปที่เมลของแต่ละท่านทันที`,
      okText: "ยืนยันรีเซ็ตตามที่เลือก",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await axios.post(
            "/api/v2/admin/user-management/reset-password",
            {
              userIds: selectedRowKeys,
            },
          );
          if (res.data.status === 200 || res.data.data?.success) {
            toast.success(
              res.data.message_th || "ดำเนินการรีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
            );
            setSelectedRowKeys([]); // Clear selection
          } else {
            toast.error(
              res.data.message_th ||
                "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่านรายกลุ่ม",
            );
          }
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ||
              "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่านรายกลุ่ม",
          );
        }
      },
    });
  };

  const requestBulkResetPasswordToPhone = () => {
    const selectedUsers = users.filter((u) => selectedRowKeys.includes(u.id));
    if (selectedUsers.length === 0) return;

    setUsersToReset(selectedUsers);
    setTrackingModalOpen(true);
  };

  const requestBulkUpdateStaffData = async () => {
    if (!bulkMode || !bulkValue || selectedRowKeys.length === 0) return;

    setBulkLoading(true);
    try {
      let endpoint = "";
      if (bulkMode === "position") {
        endpoint = "/api/v2/admin/user-management/bulk-update-position";
      } else if (bulkMode === "department") {
        endpoint = "/api/v2/admin/user-management/bulk-update-department";
      } else if (bulkMode === "role") {
        endpoint = "/api/v2/admin/user-management/bulk-update-role";
      } else if (bulkMode === "employment-type") {
        endpoint = "/api/v2/admin/user-management/bulk-update-employment-type";
      }

      const payload = {
        userIds: selectedRowKeys,
        adminId: adminId,
        ...(bulkMode === "position"
          ? { positionId: bulkValue }
          : bulkMode === "department"
            ? { departmentId: bulkValue }
            : bulkMode === "role"
              ? { roleId: bulkValue }
              : { employmentType: bulkValue }),
      };

      const res = await axios.post(endpoint, payload);

      if (res.data.status === 200) {
        toast.success(
          `ปรับปรุง${
            bulkMode === "position"
              ? "ตำแหน่ง"
              : bulkMode === "department"
                ? "แผนก"
                : bulkMode === "role"
                  ? "สิทธิ์การใช้งาน"
                  : "ประเภทการจ้างงาน"
          }แบบกลุ่มสำเร็จ`,
        );
        setBulkMode(null);
        setBulkValue(null);
        setSelectedRowKeys([]);
        requestFetchInitialData();
      } else {
        throw new Error(res.data.message_th || "ดำเนินการไม่สำเร็จ");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการปรับปรุงข้อมูลแบบกลุ่ม");
    } finally {
      setBulkLoading(false);
    }
  };

  const requestExportUserExcelReport = async () => {
    setExportLoading(true);
    const id = toast.loading("กำลังเตรียมข้อมูลรายงาน Excel สำหรับ IPO...");
    try {
      const res = await axios.get(
        "/api/v2/admin/user-management/export-excel",
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const now = dayjs();
      const thaiYear = now.year() + 543;
      const formattedDate = `${now.format("DD-MM")}-${thaiYear}`;
      const filename = `รายงานพนักงานบริษัทจับจ่ายคอร์เปอเรชัน_จำกัด_${formattedDate}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("ส่งออกรายงานพนักงานสำเร็จ (Enterprise Grade)", { id });
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง", { id });
    } finally {
      setExportLoading(false);
    }
  };

  // --- Logic: Fetch Data ---
  /**
   * ดึงข้อมูลเริ่มต้นทั้งหมดจาก Server สำหรับแสดงผลในหน้าจอ
   */
  const requestFetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [userResponse, posResponse, deptResponse, constResponse] =
        await Promise.all([
          requestUserProfileService.requestFetchAllUsers(),
          requestUserProfileService.requestFetchPositions(),
          axios.get("/api/v2/admin/department-management/read?limit=1000"),
          axios.get("/api/v2/admin/user-management/constants"),
        ]);
      setUsers(userResponse?.data?.data?.items || []);
      setPositions(posResponse?.data?.data?.items || []);
      setDepartments(deptResponse?.data?.data?.items || []);
      setRoles(constResponse?.data?.data?.roles || []);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestFetchInitialData();
  }, [requestFetchInitialData]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [filters]);

  /**
   * ปลดล็อกบัญชีผู้ใช้งานผ่านเมนูจัดการ
   */
  const requestUnlockAccount = async (targetUser: UserProfile) => {
    Modal.confirm({
      title: "ยืนยันการปลดล็อกบัญชี?",
      icon: <UnlockOutlined style={{ color: token.colorSuccess }} />,
      content: `ต้องการล้างจำนวนครั้งที่ระบุรหัสผิดของ ${targetUser.firstname_th} และปลดล็อกการระงับใช้งานใช่หรือไม่?`,
      okText: "ปลดล็อกทันที",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await requestUserProfileService.requestUnlockUserByID(targetUser.id);
          toast.success("ปลดล็อกบัญชีเรียบร้อยแล้ว");
          requestFetchInitialData();
        } catch (error) {
          toast.error("เกิดข้อผิดพลาดในการปลดล็อก");
        }
      },
    });
  };

  // --- Logic: Delete ---
  /**
   * ลบข้อมูลพนักงานออกจากระบบ (Soft Delete)
   */
  const requestDeleteAccount = async () => {
    if (!selectedUser) return;
    try {
      await requestUserProfileService.requestDeleteUserByID({
        id: selectedUser.id,
        deleted_by: adminId,
      });
      toast.success("ลบพนักงานสำเร็จ");
      setDeleteModalOpen(false);
      requestFetchInitialData();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // --- Filter Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        u.firstname_th?.toLowerCase().includes(searchLower) ||
        u.lastname_th?.toLowerCase().includes(searchLower) ||
        u.firstname_en?.toLowerCase().includes(searchLower) ||
        u.lastname_en?.toLowerCase().includes(searchLower) ||
        u.employee_code?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.nickname?.toLowerCase().includes(searchLower);

      let matchesPosition = true;
      if (filters.position) {
        matchesPosition = u.position_id === filters.position;
      }

      let matchesStatus = true;
      if (filters.status) {
        if (filters.status === "BLOCKED") {
          matchesStatus = (u.failed_login_attempts ?? 0) >= 5;
        } else {
          matchesStatus = u.status === filters.status;
        }
      }

      let matchesDepartment = true;
      if (filters.department) {
        matchesDepartment = u.department_id === filters.department;
      }

      return (
        matchesSearch && matchesPosition && matchesStatus && matchesDepartment
      );
    });
  }, [users, filters, positions]);

  // --- Summary Card Logic (Raw Data) ---
  const summaryMetrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const blockedCount = users.filter(
      (u) => (u.failed_login_attempts ?? 0) >= 5,
    ).length;
    const admins = users.filter((u) => u.role?.id === 1).length; // Check Role ID = 1

    return [
      {
        title: "พนักงานทั้งหมด",
        value: total,
        icon: <TeamOutlined />,
        color: token.colorPrimary,
      },
      {
        title: "สถานะ Active",
        value: active,
        icon: <CheckCircleOutlined />,
        color: token.colorSuccess,
      },
      {
        title: "โดนระงับ (Locked)",
        value: blockedCount,
        icon: <LockOutlined />,
        color: token.colorError,
      },
      {
        title: "จำนวน Admin",
        value: admins,
        icon: <SafetyCertificateOutlined />,
        color: "#722ed1", // Ant Design Purple
      },
    ];
  }, [users, token]);

  const getColumnSearchProps = (
    dataIndex: string | string[],
    title: string,
    customOnFilter?: (value: any, record: UserProfile) => boolean,
  ) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`ค้นหา ${title}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            ค้นหา
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            ล้าง
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined
        style={{ color: filtered ? token.colorPrimary : undefined }}
      />
    ),
    onFilter: (value: any, record: UserProfile) => {
      if (customOnFilter) return customOnFilter(value, record);

      const getNestedValue = (obj: any, path: string | string[]) => {
        if (Array.isArray(path)) {
          return path.reduce((acc, key) => acc?.[key], obj);
        }
        return obj?.[path];
      };

      const val = getNestedValue(record, dataIndex);
      return val
        ? val
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase())
        : false;
    },
  });

  // --- Columns ---
  const columns: ColumnsType<UserProfile> = [
    {
      title: "รหัสพนักงาน",
      key: "codes",
      width: 150,
      sorter: (a, b) =>
        (a.employee_code || "").localeCompare(b.employee_code || ""),
      ...getColumnSearchProps(
        ["employee_code"],
        "รหัสพนักงาน/ไอดี",
        (value, record) =>
          (record.employee_code || "")
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          (record.admin_id?.toString() || "").includes(value),
      ),
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
            รหัส: {r.employee_code || "-"}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            <LinkOutlined style={{ marginRight: 4 }} />
            ไอดีระบบ: {r.admin_id || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ข้อมูลพนักงาน",
      key: "fullname",
      width: 300,
      ...getColumnSearchProps(
        ["firstname_th"],
        "ชื่อ/เมล/เบอร์",
        (value, record) =>
          (record.firstname_th || "")
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          (record.lastname_th || "")
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          (record.nickname || "").toLowerCase().includes(value.toLowerCase()) ||
          (record.email || "").toLowerCase().includes(value.toLowerCase()) ||
          (record.phone || "").toLowerCase().includes(value.toLowerCase()),
      ),
      sorter: (a, b) =>
        (a.firstname_th || "").localeCompare(b.firstname_th || ""),
      render: (_, r) => (
        <div className="flex items-start gap-3 py-1">
          <Avatar
            src={r.profile_image_path}
            icon={<UserOutlined />}
            size={48}
            className="shadow-sm"
            style={{ border: `2px solid ${token.colorBgContainer}` }}
          />
          <div className="flex flex-col">
            <Space size={4} align="center">
              <span
                style={{
                  color: token.colorText,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {r.firstname_th} {r.lastname_th}
              </span>
              {r.nickname && (
                <Tag
                  color="warning"
                  className="text-[10px] m-0 px-1 leading-4 h-4 border-none rounded-full"
                >
                  {r.nickname}
                </Tag>
              )}
            </Space>
            <Typography.Text
              type="secondary"
              className="text-[11px] flex items-center gap-1 mt-0.5"
            >
              <MailOutlined style={{ fontSize: 10 }} />
              {r.email || "-"}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              className="text-[11px] flex items-center gap-1"
            >
              <PhoneOutlined style={{ fontSize: 10 }} />
              {r.phone || "-"}
            </Typography.Text>
            {!r.phone && (
              <div className="mt-1">
                <Badge
                  status="warning"
                  text={
                    <Typography.Text
                      type="warning"
                      style={{ fontSize: 10, display: "block" }}
                    >
                      ยังไม่ตั้งรหัสผ่าน
                    </Typography.Text>
                  }
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "การทำงาน",
      key: "work_info",
      width: 250,
      sorter: (a, b) =>
        (a.position_ref?.name_th || "").localeCompare(
          b.position_ref?.name_th || "",
        ),
      ...getColumnSearchProps(
        ["position_ref", "name_th"],
        "ตำแหน่ง/แผนก",
        (value, record) =>
          (record.position_ref?.name_th || "")
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          (record.department?.name_th || "")
            .toLowerCase()
            .includes(value.toLowerCase()),
      ),
      render: (_, record) => {
        const getEmpType = (type?: string) => {
          switch (type) {
            case "FULL_TIME":
              return { color: "green", label: "พนักงานประจำ" };
            case "PART_TIME":
              return { color: "cyan", label: "พาร์ทไทม์" };
            case "CONTRACT":
              return { color: "gold", label: "สัญญาจ้าง" };
            case "INTERN":
              return { color: "purple", label: "นักศึกษาฝึกงาน" };
            default:
              return { color: "gray", label: "ไม่ระบุ" };
          }
        };
        const emp = getEmpType(record.employment_type);

        return (
          <div className="flex flex-col gap-1">
            <Typography.Text style={{ fontWeight: 600 }} className="text-sm">
              {record.position_ref?.name_th || "ไม่มีตำแหน่ง"}
            </Typography.Text>
            <div className="flex items-center gap-1 text-[11px]">
              <Typography.Text
                type="secondary"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ApartmentOutlined />
                {record.department?.name_th || "ไม่มีแผนก"}
              </Typography.Text>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Tag
                color={emp.color}
                className="text-[10px] m-0 border-none rounded-full h-5 leading-5"
              >
                {emp.label}
              </Tag>
              {record.joined_date && (
                <Tag
                  icon={<CalendarOutlined />}
                  className="text-[10px] m-0 border-none rounded-full h-5 leading-5"
                  style={{ backgroundColor: token.colorFillAlter }}
                >
                  เริ่ม {dayjs(record.joined_date).format("DD MMM YY")}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "สถานะบัญชี",
      key: "account_status",
      width: 180,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      ...getColumnSearchProps(["status"], "สถานะ/สิทธิ์", (value, record) => {
        const isBlocked = (record.failed_login_attempts ?? 0) >= 5;
        const statusStr = isBlocked
          ? "โดนระงับ (Locked)"
          : record.status === "ACTIVE"
            ? "ออนไลน์ / ปกติ"
            : "ระงับการใช้งาน";
        return (
          statusStr.toLowerCase().includes(value.toLowerCase()) ||
          (record.role?.role_name || "")
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }),
      render: (_, r) => {
        const isBlocked = (r.failed_login_attempts ?? 0) >= 5;
        const statusText = isBlocked
          ? "โดนระงับ (Locked)"
          : r.status === "ACTIVE"
            ? "ออนไลน์ / ปกติ"
            : "ระงับการใช้งาน";
        const statusType = isBlocked
          ? "error"
          : r.status === "ACTIVE"
            ? "success"
            : "default";

        return (
          <div className="flex flex-col gap-1">
            <Badge
              status={statusType as any}
              text={
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      statusType === "success"
                        ? token.colorSuccess
                        : statusType === "error"
                          ? token.colorError
                          : token.colorTextDescription,
                  }}
                >
                  {statusText}
                </span>
              }
            />
            {isBlocked && (
              <Tag
                color="error"
                className="m-0 text-[9px] py-0 px-1 border-none rounded"
                icon={<WarningOutlined className="text-[9px]" />}
              >
                เข้าผิด {r.failed_login_attempts} ครั้ง
              </Tag>
            )}
            <div className="mt-1">
              <Typography.Text type="secondary" className="text-[10px] block">
                สิทธิ์: {r.role?.role_name || "ผู้ใช้งาน"}
              </Typography.Text>
              {r.last_login && (
                <Typography.Text type="secondary" className="text-[10px]">
                  ล่าสุด: {dayjs(r.last_login).format("DD/MM/YY HH:mm")}
                </Typography.Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 150,
      sorter: (a, b) => 0, // Placeholder sorter to satisfy standard requirement
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => {
                setSelectedUser(r);
                setDetailModalOpen(true);
              }}
            />
          </Tooltip>
          {/* ✅ ปุ่มปลดล็อก (Show Only if Blocked) */}
          {((r as any).failed_login_attempts ?? 0) >= 5 && (
            <Tooltip title="ปลดล็อกบัญชี">
              <Button
                type="text"
                size="small"
                icon={<UnlockOutlined style={{ color: token.colorSuccess }} />}
                onClick={() => requestUnlockAccount(r)}
              />
            </Tooltip>
          )}
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorWarning }} />}
              onClick={() => {
                router.push(`/admin/user-profile/${r.id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="ตั้งค่าเริ่มต้นรหัสผ่าน (ใช้เบอร์มือถือ)">
            <Button
              type="text"
              size="small"
              icon={<ControlOutlined style={{ color: token.colorSuccess }} />}
              onClick={() => {
                setUsersToReset([r]);
                setTrackingModalOpen(true);
              }}
              disabled={!(r.phone || (r as any).tel)}
            />
          </Tooltip>
          <Tooltip title="รีเซ็ตรหัสผ่าน (สุ่มชุดใหม่)">
            <Button
              type="text"
              size="small"
              icon={<LockOutlined style={{ color: token.colorInfo }} />}
              onClick={() => requestResetPassword(r)}
              disabled={!r.email}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedUser(r);
                setDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        {/* Sync Modal Component */}
        <SyncModal
          open={syncModalOpen}
          onCancel={() => setSyncModalOpen(false)}
          onSuccess={requestFetchInitialData}
        />

        {/* ส่วนที่ 1: แถบหัวข้อหน้าจอ (Header Bar) */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="จัดการผู้ใช้งาน (User Management)"
          subTitle="ระบบจัดการพนักงานและสิทธิ์การเข้าใช้งาน"
          extra={
            <Space>
              <Button
                onClick={requestFetchInitialData}
                icon={<ReloadOutlined />}
                shape="round"
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<CloudSyncOutlined />}
                onClick={() => setSyncModalOpen(true)}
                shape="round"
              >
                ซิงค์ข้อมูลชุดเก่า
              </Button>
              <Button
                icon={<SolutionOutlined />}
                onClick={() => setRoleDrawerOpen(true)}
                shape="round"
              >
                จัดการบทบาท
              </Button>
            </Space>
          }
        />

        {/* ส่วนที่ 2: การ์ดสรุปข้อมูลภาพรวม (Summary Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryMetrics.map((metrics, index) => (
            <div key={index} className="h-full">
              <SummaryCard {...metrics} isLoading={loading} />
            </div>
          ))}
        </div>

        {/* ส่วนที่ 3: ส่วนการกรองข้อมูล (Filters) */}
        <Card
          styles={{ body: { padding: 24 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 24,
          }}
        >
          <Flex align="center" gap={8} className="mb-6">
            <ControlOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
            <Text style={{ fontSize: 16, fontWeight: 600 }}>ตัวกรอง</Text>
          </Flex>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Text
                style={{ fontWeight: 600, color: token.colorTextSecondary }}
                className="text-xs mb-2 block"
              >
                ค้นหาคำสำคัญ (ชื่อ, นามสกุล, รหัสพนักงาน)
              </Text>
              <Input
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                }
                placeholder="ระบุข้อมูลที่ต้องการค้นหา..."
                allowClear
                size="large"
                style={{ borderRadius: 8 }}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </Col>

            <Col xs={24} md={12}>
              <Text
                style={{ fontWeight: 600, color: token.colorTextSecondary }}
                className="text-xs mb-2 block"
              >
                ตำแหน่งงาน
              </Text>
              <Select
                placeholder="เลือกตำแหน่งงาน"
                size="large"
                allowClear
                showSearch
                className="w-full"
                optionFilterProp="label"
                value={filters.position}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, position: v }))
                }
                options={positions.map((p) => ({
                  label: p.name_th,
                  value: p.id,
                }))}
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} md={12}>
              <Text
                style={{ fontWeight: 600, color: token.colorTextSecondary }}
                className="text-xs mb-2 block"
              >
                แผนก / ฝ่าย
              </Text>
              <Select
                placeholder="เลือกแผนก"
                size="large"
                allowClear
                showSearch
                className="w-full"
                optionFilterProp="label"
                value={filters.department}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, department: v }))
                }
                options={departments.map((d) => ({
                  label: d.name_th,
                  value: d.id,
                }))}
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} md={12}>
              <Text
                style={{ fontWeight: 600, color: token.colorTextSecondary }}
                className="text-xs mb-2 block"
              >
                สถานะบัญชีรายชื่อ
              </Text>
              <Select
                placeholder="เลือกสถานะ"
                size="large"
                allowClear
                className="w-full"
                value={filters.status}
                onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
                options={[
                  { label: "ใช้งานอยู่ (Active)", value: "ACTIVE" },
                  { label: "ระงับการใช้งาน (Inactive)", value: "INACTIVE" },
                  { label: "โดนระงับ (Locked/Failed Login)", value: "BLOCKED" },
                ]}
                style={{ borderRadius: 8 }}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <Flex justify="flex-end" gap={12}>
            <Button
              icon={<ClearOutlined />}
              type="default"
              ghost
              shape="round"
              onClick={() =>
                setFilters({
                  search: "",
                  position: undefined,
                  department: undefined,
                  status: undefined,
                })
              }
              style={{ minWidth: 120 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              shape="round"
              onClick={() => requestFetchInitialData()}
              style={{ minWidth: 120 }}
            >
              ค้นหาข้อมูล
            </Button>
          </Flex>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา (Content Table) */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* Table Header Action */}
          <div className="flex justify-between items-center mb-6">
            <Flex align="center" gap={12}>
              <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                รายชื่อพนักงานทั้งหมด
                <Text
                  type="secondary"
                  style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}
                >
                  ({filteredUsers.length} รายการ)
                </Text>
              </Title>
              {selectedRowKeys.length > 0 && (
                <Tag
                  color="processing"
                  style={{ borderRadius: 20, padding: "2px 12px" }}
                >
                  เลือกอยู่ {selectedRowKeys.length} รายการ
                </Tag>
              )}
            </Flex>

            <Space size={12}>
              {selectedRowKeys.length > 0 && (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "reset-to-phone",
                        label: "ใช้เบอร์มือถือเป็นรหัสผ่าน",
                        icon: (
                          <ControlOutlined
                            style={{ color: token.colorSuccess }}
                          />
                        ),
                        onClick: requestBulkResetPasswordToPhone,
                      },
                      {
                        key: "bulk-position",
                        label: "ปรับตำแหน่ง",
                        icon: <ApartmentOutlined />,
                        onClick: () => setBulkMode("position"),
                      },
                      {
                        key: "bulk-department",
                        label: "ปรับแผนก",
                        icon: <TeamOutlined />,
                        onClick: () => setBulkMode("department"),
                      },
                      {
                        key: "bulk-role",
                        label: "ปรับสิทธิ์",
                        icon: <SafetyCertificateOutlined />,
                        onClick: () => setBulkMode("role"),
                      },
                      {
                        key: "bulk-employment-type",
                        label: "จัดการประเภทการจ้างงาน",
                        icon: <IdcardOutlined />,
                        onClick: () => setBulkMode("employment-type"),
                      },
                      { type: "divider" },
                      {
                        key: "reset-password",
                        label: "รีเซ็ตรหัสผ่านใหม่",
                        icon: <LockOutlined />,
                        danger: true,
                        onClick: requestBulkResetPassword,
                      },
                    ],
                  }}
                >
                  <Button
                    type="primary"
                    ghost
                    icon={<SettingOutlined />}
                    shape="round"
                  >
                    จัดการข้อมูลแบบกลุ่ม
                  </Button>
                </Dropdown>
              )}
              <Button
                icon={<FileExcelOutlined />}
                onClick={requestExportUserExcelReport}
                loading={exportLoading}
                shape="round"
                style={{
                  backgroundColor: "#217346",
                  color: "#fff",
                  borderColor: "#217346",
                }}
              >
                ส่งออก Excel
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                shape="round"
                onClick={() => {
                  router.push("/admin/user-profile/create");
                }}
              >
                เพิ่มพนักงาน
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
              showTotal: (total, range) =>
                `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
          />
        </Card>

        {/* 5. Role Drawer (Stub for now) */}
        <Drawer
          title="จัดการบทบาทและสิทธิ์"
          open={roleDrawerOpen}
          onClose={() => setRoleDrawerOpen(false)}
          width={600}
        >
          <div className="text-center p-10">
            <Typography.Text type="secondary">
              <SafetyCertificateOutlined
                className="mb-4"
                style={{ fontSize: 40 }}
              />
              <p>ระบบจัดการบทบาทและสิทธิ์การใช้งาน อยู่ระหว่างการพัฒนา</p>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                สามารถจัดการได้ผ่านตารางฐานข้อมูล: Role, RolePermission
              </Typography.Text>
            </Typography.Text>
          </div>
        </Drawer>

        {/* 6. Delete Confirmation Modal */}
        <Modal
          title={
            <Space style={{ color: token.colorError }}>
              <ExclamationCircleOutlined /> ยืนยันการลบ
            </Space>
          }
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={requestDeleteAccount}
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณแน่ใจหรือไม่ที่จะลบพนักงาน:{" "}
            <span style={{ fontWeight: 600 }}>
              {selectedUser?.firstname_th} {selectedUser?.lastname_th}
            </span>
          </p>
          <Typography.Text
            type="danger"
            style={{ fontSize: "12px", display: "block" }}
          >
            *การลบนี้จะเป็นการ Soft Delete ข้อมูลยังคงอยู่ในระบบแต่จะไม่แสดงผล
          </Typography.Text>
        </Modal>

        {/* 5. User Detail Modal */}
        <Modal
          open={detailModalOpen}
          title={
            <Space>
              <InfoCircleOutlined style={{ color: token.colorPrimary }} />
              <span>รายละเอียดพนักงาน</span>
            </Space>
          }
          onCancel={() => setDetailModalOpen(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              ปิดหน้าต่าง
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                router.push(`/admin/user-profile/${selectedUser?.id}`);
              }}
            >
              แก้ไขข้อมูล
            </Button>,
          ]}
          centered
        >
          {selectedUser && (
            <div className="py-4">
              <div
                className="flex items-center gap-6 mb-8 p-6 rounded-2xl border"
                style={{
                  backgroundColor: token.colorFillAlter,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <Avatar
                  size={100}
                  src={selectedUser.profile_image_path}
                  icon={<UserOutlined />}
                  className="shadow-md"
                  style={{ border: `4px solid ${token.colorBgContainer}` }}
                />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {selectedUser.firstname_th} {selectedUser.lastname_th}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="text-lg">
                    {selectedUser.nickname ? `(${selectedUser.nickname})` : ""}
                  </Typography.Text>
                  <div className="mt-2 flex gap-2">
                    <Tag color="blue" className="rounded-full">
                      EMP: {selectedUser.employee_code}
                    </Tag>
                    <Tag color="cyan" className="rounded-full">
                      ID: {selectedUser.admin_id}
                    </Tag>
                    <Tag
                      color={
                        selectedUser.status === "ACTIVE" ? "success" : "default"
                      }
                      className="rounded-full"
                    >
                      {selectedUser.status === "ACTIVE"
                        ? "คัดเลือก/ปกติ"
                        : "ระงับ"}
                    </Tag>
                  </div>
                </div>
              </div>

              <Descriptions
                title="ข้อมูลส่วนตัวและบัญชี"
                bordered
                column={2}
                className="mb-6"
              >
                <Descriptions.Item label="ชื่อผู้ใช้งาน (Username)">
                  {selectedUser.username}
                </Descriptions.Item>
                <Descriptions.Item label="สิทธิ์การใช้งาน">
                  {selectedUser.role?.role_name || "ผู้ใช้งาน"}
                </Descriptions.Item>
                <Descriptions.Item label="อีเมล" span={2}>
                  {selectedUser.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="เบอร์โทรศัพท์">
                  {selectedUser.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Backlog Email">
                  {(selectedUser as any).backlog_email || "-"}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions
                title="ข้อมูลการทำงาน"
                bordered
                column={2}
                className="mb-6"
              >
                <Descriptions.Item label="ตำแหน่ง">
                  {selectedUser.position_ref?.name_th || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="แผนก">
                  {selectedUser.department?.name_th || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="ประเภทการจ้างงาน">
                  {selectedUser.employment_type === "FULL_TIME"
                    ? "พนักงานประจำ"
                    : selectedUser.employment_type === "PART_TIME"
                      ? "พาร์ทไทม์"
                      : selectedUser.employment_type === "CONTRACT"
                        ? "สัญญาจ้าง"
                        : selectedUser.employment_type === "INTERN"
                          ? "นักศึกษาฝึกงาน"
                          : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="วันที่เริ่มงาน">
                  {selectedUser.joined_date
                    ? dayjs(selectedUser.joined_date).format("DD MMMM YYYY")
                    : "-"}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions title="ข้อมูลความปลอดภัย" bordered column={2}>
                <Descriptions.Item label="เข้าสู่ระบบล่าสุด">
                  {selectedUser.last_login
                    ? dayjs(selectedUser.last_login).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="เข้าสู่ระบบล้มเหลว">
                  {selectedUser.failed_login_attempts || 0} ครั้ง
                </Descriptions.Item>
                <Descriptions.Item label="สร้างเมื่อ" span={2}>
                  {dayjs(selectedUser.created_at).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>

        {/* Tracking Reset Modal */}
        <ResetPasswordTrackingModal
          open={trackingModalOpen}
          users={usersToReset}
          adminId={adminId}
          onComplete={() => {
            setTrackingModalOpen(false);
            setUsersToReset(null);
            setSelectedRowKeys([]); // Clear selection after bulk reset
            requestFetchInitialData();
          }}
          onCancel={() => {
            setTrackingModalOpen(false);
            setUsersToReset(null);
          }}
        />

        {/* 7. Bulk Update Modal (Position/Department/Role/EmploymentType) */}
        <Modal
          title={`ปรับปรุง${
            bulkMode === "position"
              ? "ตำแหน่ง"
              : bulkMode === "department"
                ? "แผนก"
                : bulkMode === "role"
                  ? "สิทธิ์การใช้งาน"
                  : "ประเภทการจ้างงาน"
          }แบบกลุ่ม`}
          open={!!bulkMode}
          onOk={requestBulkUpdateStaffData}
          onCancel={() => {
            setBulkMode(null);
            setBulkValue(null);
          }}
          confirmLoading={bulkLoading}
          okText="ยืนยันการเปลี่ยนข้อมูล"
          cancelText="ยกเลิก"
        >
          <div className="py-4">
            <Typography.Text className="mb-4 block">
              คุณต้องการเปลี่ยน
              {bulkMode === "position"
                ? "ตำแหน่ง"
                : bulkMode === "department"
                  ? "แผนก"
                  : bulkMode === "role"
                    ? "สิทธิ์การใช้งาน"
                    : "ประเภทการจ้างงาน"}{" "}
              ของ{" "}
              <span style={{ fontWeight: 600 }}>{selectedRowKeys.length}</span>{" "}
              พนักงานที่เลือก เป็น:
            </Typography.Text>
            <Select
              className="w-full"
              placeholder={`เลือก${
                bulkMode === "position"
                  ? "ตำแหน่งใหม่"
                  : bulkMode === "department"
                    ? "แผนกใหม่"
                    : bulkMode === "role"
                      ? "สิทธิ์การใช้งานใหม่"
                      : "ประเภทการจ้างงานใหม่"
              }`}
              value={bulkValue}
              onChange={setBulkValue}
              options={
                bulkMode === "position"
                  ? positions.map((p: any) => ({
                      label: p.name_th,
                      value: p.id,
                    }))
                  : bulkMode === "department"
                    ? departments.map((d: any) => ({
                        label: d.name_th,
                        value: d.id,
                      }))
                    : bulkMode === "role"
                      ? roles.map((r: any) => ({
                          label: r.role_name,
                          value: r.id,
                        }))
                      : [
                          {
                            label: "Full-time (พนักงานประจำ)",
                            value: "FULL_TIME",
                          },
                          {
                            label: "Part-time (พนักงานชั่วคราว)",
                            value: "PART_TIME",
                          },
                          { label: "Contract (สัญญาจ้าง)", value: "CONTRACT" },
                          { label: "Intern (ฝึกงาน)", value: "INTERN" },
                        ]
              }
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
