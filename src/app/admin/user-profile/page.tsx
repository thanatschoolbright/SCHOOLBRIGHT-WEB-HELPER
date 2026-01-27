"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Space,
  Button,
  theme,
  Avatar,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Badge,
  Table,
  Row,
  Col,
  Divider,
  Card,
  Drawer,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SmileOutlined,
  GlobalOutlined,
  SolutionOutlined,
  CloudSyncOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ClearOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import dayjs from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import { UserProfile } from "@stores/type";
import { SyncModal } from "./components/sync-modal";

// ==========================================
// 1. SERVICES & API CALLS (Logic)
// ==========================================

// TODO: Move to src/services/backend/user-management/user-profile.service.ts
const UserProfileService = {
  fetchUsers: async () => {
    return await axios.get("/api/v2/admin/user-management/read");
  },
  fetchConstants: async () => {
    // New Position API
    return await axios.get("/api/v2/admin/position-management/read?limit=1000"); // Limit 1000 to get all for dropdown
  },
  createUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/create", data);
  },
  updateUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/update", data);
  },
  deleteUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/delete", data);
  },
};

// ==========================================
// 2. TYPES
// ==========================================

interface FilterState {
  search: string;
  position?: number; // Changed from string to number (ID)
  status?: string;
}

// ==========================================
// 3. COMPONENTS
// ==========================================

import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

// ... (keep intervening code if any, or adjust imports)

const UserFormFields = ({
  isEdit = false,
  positions = [],
  onCancel,
  form,
}: {
  isEdit?: boolean;
  positions?: any[]; // Changed to any[] or specific Position type
  onCancel: () => void;
  form: any;
}) => {
  // Watch phone for auto password generation
  const phone = Form.useWatch("tel", form);
  const employeeCode = Form.useWatch("employee_code", form); // Watch employee code for naming
  const currentImage = Form.useWatch("profile_image_path", form); // Watch current image

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit && phone) {
      // Auto set password if creating new user
      form.setFieldValue("password", phone);
    }
  }, [phone, isEdit, form]);

  // Handle Image Upload
  const handleUploadChange: UploadProps["onChange"] = async (info) => {
    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }

    // We handle the upload manually via customRequest or directly here
    // But since Antd Upload handles file list, let's use customRequest or beforeUpload
  };

  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
    setUploading(true);
    try {
      if (!employeeCode) {
        message.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
        setUploading(false);
        onError(new Error("Missing employee code"));
        return;
      }

      // Call Huawei Service
      const result =
        await HuaweiBucketStorageService.requestUploadUserProfileImage(
          file,
          employeeCode,
          currentImage, // Pass old image path for cleanup
        );

      if (result && result.url) {
        form.setFieldValue("profile_image_path", result.url);
        message.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess(result.url);
      } else {
        throw new Error("Upload failed, no URL returned");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <>
      {/* Account Info */}
      <Divider orientation="left">ข้อมูลบัญชีผู้ใช้</Divider>
      <div className="grid grid-cols-2 gap-4">
        {/* ... (Account Info Fields) ... */}
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "กรุณาระบุ Username" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          extra={
            !isEdit && (
              <span className="text-xs text-gray-400">
                *ตั้งค่าเริ่มต้นอัตโนมัติจากเบอร์โทรศัพท์
              </span>
            )
          }
          rules={[
            isEdit
              ? { required: false }
              : { required: true, message: "กรุณาระบุ Password" }, // Password optional on edit? Usually yes.
            { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="******" />
        </Form.Item>
      </div>

      {/* Personal Info */}
      <Divider orientation="left">ข้อมูลส่วนตัว</Divider>

      {/* Avatar Upload Section */}
      <div className="flex justify-center mb-6">
        <Form.Item name="profile_image_path" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          customRequest={customUploadRequest}
          beforeUpload={(file) => {
            const isJpgOrPng =
              file.type === "image/jpeg" || file.type === "image/png";
            if (!isJpgOrPng) {
              message.error("You can only upload JPG/PNG file!");
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
              message.error("Image must smaller than 2MB!");
            }
            return isJpgOrPng && isLt2M;
          }}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt="avatar"
              style={{
                width: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                height: "100%",
              }}
            />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="name"
          label="ชื่อจริง (TH)"
          rules={[{ required: true, message: "กรุณาระบุชื่อจริง" }]}
        >
          <Input prefix={<EditOutlined />} />
        </Form.Item>
        {/* ... (Rest of Personal Info) */}
        <Form.Item
          name="lastname"
          label="นามสกุล (TH)"
          rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
        >
          <Input prefix={<EditOutlined />} />
        </Form.Item>
        <Form.Item name="nickname" label="ชื่อเล่น">
          <Input prefix={<SmileOutlined />} />
        </Form.Item>
        <Form.Item
          name="employee_code"
          label="รหัสพนักงาน"
          rules={[{ required: true, message: "กรุณาระบุรหัสพนักงาน" }]} // Required for upload path
        >
          <Input
            prefix={<IdcardOutlined />}
            onChange={(e) =>
              form.setFieldValue("employee_code", e.target.value)
            }
          />
        </Form.Item>
      </div>

      {/* Work Info */}
      <Divider orientation="left">ข้อมูลการทำงาน</Divider>
      <div className="grid grid-cols-2 gap-4">
        {/* Updated Position Select */}
        <Form.Item name="position_id" label="ตำแหน่ง">
          <Select
            placeholder="เลือกตำแหน่ง"
            options={positions.map((p: any) => ({
              label: p.name_th,
              value: p.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="role_id" label="บทบาท (Role)">
          <Select
            placeholder="เลือกบทบาท"
            options={[
              { label: "Admin", value: 1 },
              { label: "User", value: 2 },
            ]}
          />
        </Form.Item>
      </div>

      {/* Contact Info */}
      <Divider orientation="left">ข้อมูลการติดต่อ</Divider>
      <div className="grid grid-cols-2 gap-4">
        {/* ... (Keep Contact Info) ... */}
        <Form.Item name="tel" label="เบอร์โทรศัพท์">
          <Input prefix={<PhoneOutlined />} placeholder="08xxxxxxxx" />
        </Form.Item>
        <Form.Item name="email" label="อีเมล" rules={[{ type: "email" }]}>
          <Input prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item name="backlog_email" label="Backlog Email">
          <Input prefix={<GlobalOutlined />} />
        </Form.Item>
        {/* Redundant input for manual URL entry if needed, or remove since we have Upload */}
        <Form.Item
          name="profile_image_path_manual"
          label="Profile Image URL (Manual)"
          initialValue={currentImage}
        >
          <Input
            prefix={<GlobalOutlined />}
            placeholder="https://..."
            onChange={(e) =>
              form.setFieldValue("profile_image_path", e.target.value)
            }
          />
        </Form.Item>
      </div>

      {/* IPO Security Audit (Read Only) */}
      {isEdit && (
        <>
          <Divider orientation="left">
            <Space>
              <SafetyCertificateOutlined /> ความปลอดภัย (IPO Audit)
            </Space>
          </Divider>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <Form.Item name="last_login" label="เข้าสู่ระบบล่าสุด">
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="failed_login_attempts"
              label="login ล้มเหลว (ครั้ง)"
            >
              <Input disabled />
            </Form.Item>
          </div>
        </>
      )}

      <Divider />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>ยกเลิก</Button>
        <Button
          type="primary"
          htmlType="submit"
          icon={<CheckCircleOutlined />}
          loading={uploading}
        >
          บันทึกข้อมูล
        </Button>
      </div>
    </>
  );
};

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function UserManagementPage() {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";
  const [form] = Form.useForm();
  const router = useRouter();

  // Auth State
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  // Local State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [positions, setPositions] = useState<any[]>([]); // Changed type to any[]
  const [filters, setFilters] = useState<FilterState>({ search: "" });

  // Modals State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false); // For Role Management

  // --- Logic: Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, posRes] = await Promise.all([
        UserProfileService.fetchUsers(),
        UserProfileService.fetchConstants(),
      ]);
      setUsers(userRes?.data?.data?.items || []);
      // Ensure we access the correct data structure from new API
      setPositions(posRes?.data?.data?.items || []);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Logic: Submit ---
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        firstname_th: values.name, // Map UI 'name' to DB 'firstname_th'
        lastname_th: values.lastname,
        phone: values.tel,
        profile_image: values.profile_image_path,
        position_id: values.position_id, // Ensure this is sent
        // Audit
        created_by: modalMode === "create" ? adminId : undefined,
        updated_by: modalMode === "edit" ? adminId : undefined,
        id: modalMode === "edit" ? selectedUser?.id : undefined,
      };

      if (modalMode === "create") {
        // Auto password fallback logic (already handled in form effect, but double check)
        if (!payload.password && payload.phone) {
          payload.password = payload.phone;
        }
        await UserProfileService.createUser(payload);
      } else {
        await UserProfileService.updateUser(payload);
      }

      toast.success(
        modalMode === "create" ? "เพิ่มพนักงานสำเร็จ" : "แก้ไขข้อมูลสำเร็จ",
      );
      setModalMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message_th || "เกิดข้อผิดพลาด");
    }
  };

  // --- Logic: Delete ---
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await UserProfileService.deleteUser({
        id: selectedUser.id,
        deleted_by: adminId,
      });
      toast.success("ลบพนักงานสำเร็จ");
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // --- Filter Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        u.firstname?.toLowerCase().includes(searchLower) ||
        u.lastname?.toLowerCase().includes(searchLower) ||
        u.employee_code?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower);

      // Assuming user object now has position_id or position object if loaded
      // If user.position is still just a string from old data, this might fail unless we assume mixed.
      // But typically we filter by ID if selected in filter.
      // Let's assume u.position_id or u.position_ref?.id
      // For now, let's try to match position_id if filter is number, else string match if filter is string (legacy)

      let matchesPosition = true;
      if (filters.position) {
        // Check if u has position_id (new) or just position string (old)
        // If u.position_id exists, match against filter ID
        if ((u as any).position_id) {
          matchesPosition = (u as any).position_id === filters.position;
        } else if (u.position) {
          // Fallback: see if we can find name in positions list corresponding to filter ID
          const posName = positions.find(
            (p) => p.id === filters.position,
          )?.name_th;
          matchesPosition = u.position === posName;
        }
      }

      const matchesStatus = filters.status ? u.status === filters.status : true;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [users, filters, positions]);

  // --- Summary Card Logic (Raw Data) ---
  const summaryMetrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const inactive = users.filter((u) => u.status !== "ACTIVE").length;
    const admins = users.filter((u) => u.role?.id === 1).length; // Check Role ID = 1

    return [
      {
        title: "พนักงานทั้งหมด",
        value: total,
        icon: <TeamOutlined />,
        color: "#1890ff",
      },
      {
        title: "สถานะ Active",
        value: active,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
      },
      {
        title: "สถานะ Inactive",
        value: inactive,
        icon: <ExclamationCircleOutlined />,
        color: "#faad14",
      },
      {
        title: "จำนวน Admin",
        value: admins,
        icon: <SafetyCertificateOutlined />,
        color: "#722ed1",
      },
    ];
  }, [users]);

  // --- Columns ---
  const columns: ColumnsType<UserProfile> = [
    {
      title: "รหัสพนักงาน",
      dataIndex: "employee_code",
      sorter: (a, b) =>
        (a.employee_code || "").localeCompare(b.employee_code || ""),
      render: (text) => <Tag>{text || "-"}</Tag>,
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "fullname",
      sorter: (a, b) => (a.firstname || "").localeCompare(b.firstname || ""),
      render: (_, r) => (
        <Space>
          {/* ... Avatar & Info ... */}
          <Avatar
            src={r.image_profile || r.profile_image}
            icon={<UserOutlined />}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-700">
              {r.firstname} {r.lastname}
            </span>
            <span className="text-xs text-gray-400">
              {r.nickname ? `(${r.nickname})` : ""} {r.email}
            </span>
          </div>
          {/* UI Alert: Missing Phone implies check password manually if implemented logic requires phone */}
          {!r.tel && (
            <Tooltip title="ผู้ใช้งานยังไม่ตั้งพาสเวิร์ด (กรุณาระบุเบอร์โทรศัพท์)">
              <WarningOutlined className="text-orange-500 animate-pulse" />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "ตำแหน่ง",
      key: "position",
      render: (_, r: any) => {
        // Try to show relation name, fallback to string field
        return r.position_ref?.name_th || r.position || "-";
      },
      sorter: (a: any, b: any) => {
        const nameA = a.position_ref?.name_th || a.position || "";
        const nameB = b.position_ref?.name_th || b.position || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "บทบาท",
      dataIndex: ["role", "role_name"], // Nested dataIndex
      render: (text) =>
        text ? <Tag color="blue">{text}</Tag> : <Tag>User</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      align: "center",
      render: (status) => (
        <Badge
          status={status === "ACTIVE" ? "success" : "default"}
          text={status || "Inactive"}
        />
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined className="text-yellow-500" />}
              onClick={() => {
                router.push(`/admin/user-profile/${r.id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
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
          onSuccess={fetchData}
        />

        {/* 1. Header Bar */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="จัดการผู้ใช้งาน (User Management)"
          subTitle="ระบบจัดการพนักงานและสิทธิ์การเข้าใช้งาน (RBAC)"
          extra={
            <Space>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                รีเฟรช
              </Button>
              <Button
                type="primary"
                ghost
                icon={<CloudSyncOutlined />}
                onClick={() => setSyncModalOpen(true)}
              >
                Sync Legacy Data
              </Button>
              <Button
                icon={<SolutionOutlined />}
                onClick={() => setRoleDrawerOpen(true)}
              >
                จัดการบทบาท (Role)
              </Button>
            </Space>
          }
        />

        {/* 2. Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryMetrics.map((m, i) => (
            <div key={i} className="h-full">
              <SummaryCard {...m} isLoading={loading} />
            </div>
          ))}
        </div>

        {/* 3. Filters & Content */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* Filter Section - 2 Cols */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={12} lg={16}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <span className="text-gray-500 text-xs mb-1 block">
                      ค้นหาข้อมูล
                    </span>
                    <Input
                      prefix={<SearchOutlined className="text-gray-400" />}
                      placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
                      allowClear
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <span className="text-gray-500 text-xs mb-1 block">
                      กรองตามตำแหน่ง
                    </span>
                    <Select
                      placeholder="ตำแหน่งทั้งหมด"
                      className="w-full"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={filters.position}
                      onChange={(v) =>
                        setFilters((prev) => ({ ...prev, position: v }))
                      }
                      options={positions.map((p) => ({
                        label: p.name_th,
                        value: p.id,
                      }))}
                    />
                  </Col>
                </Row>
              </Col>
              <Col xs={24} md={12} lg={8}>
                <div className="flex justify-end gap-2">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={() => setFilters({ search: "" })}
                  >
                    ล้างค่า
                  </Button>
                  <Button type="primary" icon={<SearchOutlined />}>
                    ค้นหา
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          {/* Table Header Action */}
          <div className="flex justify-between items-center mb-4">
            <Typography.Text strong className="text-lg">
              รายชื่อพนักงานทั้งหมด ({filteredUsers.length})
            </Typography.Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalMode("create");
                form.resetFields();
              }}
            >
              เพิ่มพนักงาน
            </Button>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* 4. User Modal (Create/Edit) */}
        <Modal
          open={!!modalMode}
          title={
            modalMode === "create" ? "เพิ่มพนักงานใหม่" : "แก้ไขข้อมูลพนักงาน"
          }
          onCancel={() => setModalMode(null)}
          width={800}
          footer={null}
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={
              modalMode === "edit" && selectedUser
                ? {
                    ...selectedUser,
                    name: selectedUser.firstname, // Map back
                    tel: selectedUser.tel, // Map phone
                    profile_image_path:
                      selectedUser.profile_image || selectedUser.image_profile,
                    role_id: selectedUser.role?.id,
                    last_login: selectedUser.last_login
                      ? dayjs(selectedUser.last_login).format(
                          "DD/MM/YYYY HH:mm",
                        )
                      : "-",
                    failed_login_attempts:
                      selectedUser.failed_login_attempts ?? 0,
                  }
                : {}
            }
          >
            <UserFormFields
              isEdit={modalMode === "edit"}
              positions={positions}
              onCancel={() => setModalMode(null)}
              form={form}
            />
          </Form>
        </Modal>

        {/* 5. Role Drawer (Stub for now) */}
        <Drawer
          title="จัดการบทบาทและสิทธิ์ (Role & Permission)"
          open={roleDrawerOpen}
          onClose={() => setRoleDrawerOpen(false)}
          width={600}
        >
          <div className="text-center p-10 text-gray-500">
            <SafetyCertificateOutlined className="text-4xl mb-4" />
            <p>ระบบจัดการ Role & Permission อยู่ระหว่างการพัฒนา</p>
            <p className="text-xs">
              สามารถจัดการได้ผ่าน Database Table: Role, RolePermission
            </p>
          </div>
        </Drawer>

        {/* 6. Delete Confirmation Modal */}
        <Modal
          title={
            <Space className="text-red-500">
              <ExclamationCircleOutlined /> ยืนยันการลบ
            </Space>
          }
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDelete}
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณแน่ใจหรือไม่ที่จะลบพนักงาน:{" "}
            <strong>
              {selectedUser?.firstname} {selectedUser?.lastname}
            </strong>
          </p>
          <p className="text-red-500 text-xs">
            *การลบนี้จะเป็นการ Soft Delete ข้อมูลยังคงอยู่ในระบบแต่จะไม่แสดงผล
          </p>
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
