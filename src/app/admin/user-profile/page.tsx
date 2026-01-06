"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Skeleton,
  Space,
  Button,
  Typography,
  Flex,
  theme,
  Avatar,
  Statistic,
  DatePicker,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Badge,
  Table,
  Collapse,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SmileOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  ContactsOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import dayjs from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import {
  UpdateUserInput as BaseUpdateUserInput,
  UserProfile as BaseUserProfile,
  UserProfileForm as BaseUserProfileForm,
} from "@stores/type";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
export type UserProfile = BaseUserProfile;
export type UserProfileForm = BaseUserProfileForm;
export type UpdateUserInput = BaseUpdateUserInput;

interface UserSummaryMetric {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  desc: string;
}

const POSITION_COLORS: Record<string, string> = {
  ADMIN: "red",
  Manager: "blue",
  Developer: "green",
  QA: "purple",
  Support: "orange",
};

// ==========================================
// HELPERS
// ==========================================

// Helper for Copy
const handleCopy = async (text: string, label: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}เรียบร้อยแล้ว`);
  } catch {
    toast.error("เกิดข้อผิดพลาดในการคัดลอก");
  }
};

const formatUserCopyText = (u: UserProfile): string =>
  [
    `[ข้อมูลผู้ใช้งาน]`,
    `----------------------------------------`,
    `ชื่อ-สกุล: ${u.firstname ?? "-"} ${u.lastname ?? "-"}`,
    `ID: ${u.admin_id ?? "-"}`,
    `Email: ${u.email ?? "-"}`,
    `เบอร์โทร: ${u.tel ?? "-"}`,
    `ตำแหน่ง: ${u.position ?? "-"}`,
    `รหัสพนักงาน: ${u.employee_code ?? "-"}`,
    `----------------------------------------`,
    `Ref: https://adminsystem.schoolbright.co`,
  ].join("\n");

const buildSummaryMetrics = (users: UserProfile[]): UserSummaryMetric[] => [
  {
    key: "total",
    label: "ผู้ใช้งานทั้งหมด",
    value: users.length,
    color: "#3b82f6",
    icon: <TeamOutlined />,
    desc: "จำนวนผู้ใช้งานในระบบทั้งหมด",
  },
  {
    key: "contactable",
    label: "ติดต่อได้ (มีอีเมล)",
    value: users.filter((u) => u.email).length,
    color: "#22c55e",
    icon: <MailOutlined />,
    desc: "ผู้ใช้งานที่มีข้อมูลอีเมล",
  },
  {
    key: "unique_positions",
    label: "ตำแหน่งงาน",
    value: new Set(users.map((u) => u.position).filter(Boolean)).size,
    color: "#f59e0b",
    icon: <PushpinOutlined />,
    desc: "จำนวนตำแหน่งงานที่แตกต่างกัน",
  },
];

// ==========================================
// COMPONENTS
// ==========================================

// --- Summary Cards ---
const SummaryCards = ({ metrics }: { metrics: UserSummaryMetric[] }) => (
  <Row gutter={[16, 16]}>
    {metrics.map((m) => (
      <Col xs={24} md={8} key={m.key}>
        <Card className="shadow-sm hover:shadow-md transition-shadow border-0 rounded-xl overflow-hidden relative h-full">
          <div className="absolute right-0 top-0 p-3 opacity-10">
            <span style={{ fontSize: "6rem", color: m.color }}>{m.icon}</span>
          </div>
          <Flex align="center" gap={16}>
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
              style={{ backgroundColor: `${m.color}15`, color: m.color }}
            >
              {m.icon}
            </div>
            <div>
              <Typography.Text
                type="secondary"
                className="block text-xs uppercase tracking-wider font-semibold"
              >
                {m.label}
              </Typography.Text>
              <Statistic
                value={m.value}
                valueStyle={{ fontWeight: 700, fontSize: "1.5rem" }}
              />
              <Typography.Text type="secondary" className="text-xs">
                {m.desc}
              </Typography.Text>
            </div>
          </Flex>
        </Card>
      </Col>
    ))}
  </Row>
);

// --- Header ---
const HeaderSection = ({ title, subtitle, refreshLabel, onRefresh }: any) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4  p-6 rounded-2xl ">
      <Space size={16}>
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white ">
          <ContactsOutlined style={{ fontSize: 24 }} />
        </div>
        <div>
          <Typography.Title
            level={3}
            style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}
          >
            {title}
          </Typography.Title>
          <Typography.Text type="secondary" className="text-sm">
            {subtitle}
          </Typography.Text>
        </div>
      </Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        size="large"
        shape="round"
      >
        {refreshLabel}
      </Button>
    </div>
  );
};

// --- Filters ---
const Filters = ({
  filters,
  positions,
  onSearchChange,
  onPositionChange,
  onDateRangeChange,
  onReset,
}: any) => (
  <Card className="border-0 shadow-sm rounded-xl mb-6">
    <Flex gap={12} wrap="wrap" align="center">
      <div className="flex-1 min-w-[200px]">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="ค้นหา ชื่อ, อีเมล, รหัสพนักงาน..."
          allowClear
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg"
        />
      </div>
      <Select
        className="min-w-[150px]"
        placeholder="เลือกตำแหน่ง"
        allowClear
        value={filters.position}
        onChange={onPositionChange}
        options={positions.map((p: string) => ({ label: p, value: p }))}
        suffixIcon={<FilterOutlined />}
      />
      <DatePicker.RangePicker
        className="w-full md:w-auto rounded-lg"
        value={filters.dateRange}
        onChange={onDateRangeChange}
        placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
      />
      <Button
        onClick={onReset}
        icon={<ReloadOutlined />}
        type="dashed"
        className="rounded-lg"
      >
        ล้างตัวเลือก
      </Button>
    </Flex>
  </Card>
);

// --- Modals ---
const UserFormFields = ({ isEdit = false, positions = [] }: any) => (
  <>
    {!isEdit && (
      <div className="grid grid-cols-2 gap-4">
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
          rules={[
            { required: true, message: "กรุณาระบุ Password" },
            { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="******" />
        </Form.Item>
      </div>
    )}
    <div className="grid grid-cols-2 gap-4">
      <Form.Item
        name="name"
        label="ชื่อจริง"
        rules={[{ required: true, message: "กรุณาระบุชื่อจริง" }]}
      >
        <Input prefix={<EditOutlined />} />
      </Form.Item>
      <Form.Item
        name="lastname"
        label="นามสกุล"
        rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
      >
        <Input prefix={<EditOutlined />} />
      </Form.Item>
    </div>
    {isEdit && (
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="nickname" label="ชื่อเล่น">
          <Input prefix={<SmileOutlined />} />
        </Form.Item>
        <Form.Item name="employee_code" label="รหัสพนักงาน">
          <Input prefix={<IdcardOutlined />} />
        </Form.Item>
      </div>
    )}
    {isEdit && (
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="position" label="ตำแหน่ง">
          <Select
            options={positions.map((p: string) => ({ label: p, value: p }))}
          />
        </Form.Item>
        <Form.Item name="tel" label="เบอร์โทรศัพท์">
          <Input prefix={<PhoneOutlined />} />
        </Form.Item>
      </div>
    )}
    {isEdit && (
      <>
        <Form.Item name="email" label="อีเมล" rules={[{ type: "email" }]}>
          <Input prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item name="backlog_email" label="อีเมลสำหรับ Backlog">
          <Input prefix={<GlobalOutlined />} />
        </Form.Item>
      </>
    )}
    <Divider />
    <Flex justify="end" gap={8}>
      <Button onClick={() => Modal.destroyAll()}>ยกเลิก</Button>
      <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
        บันทึกข้อมูล
      </Button>
    </Flex>
  </>
);

// ==========================================
// MAIN PAGE
// ==========================================

export default function Page() {
  const { t } = useTranslation("translate");
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  // --- State ---
  const [state, setState] = useState({
    loading: true,
    users: [] as UserProfile[],
    positions: [] as string[],
    selectedUser: null as UserProfile | null,
    modalType: "" as any,
    deleteId: null as number | null,
    confirmDeleteText: "",
    pageSize: 10,
  });

  const [filters, setFilters] = useState<any>({
    searchTerm: "",
    position: undefined,
    dateRange: null,
  });

  // --- API ---
  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const [uRes, pRes] = await Promise.all([
        axios.get("/api/v1/admin/user/"),
        axios.get("/api/v1/admin/user/constants/position"),
      ]);
      setState((s) => ({
        ...s,
        loading: false,
        users: uRes?.data?.data?.data ?? [],
        positions: pRes?.data?.data?.response?.data ?? [],
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน");
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleSubmit = async (values: any, isEdit: boolean) => {
    try {
      const url = isEdit
        ? "/api/v1/admin/user/update"
        : "/api/v1/admin/user/create";
      const payload = isEdit
        ? Object.entries(values).reduce((fd, [k, v]) => {
            fd.append(k, String(v || ""));
            return fd;
          }, new FormData())
        : values;

      await axios.post(url, payload, {
        headers: isEdit ? { "Content-Type": "multipart/form-data" } : {},
      });
      toast.success(
        isEdit
          ? "บันทึกการแก้ไขเรียบร้อยแล้ว"
          : "สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว"
      );
      setState((s) => ({ ...s, modalType: "" }));
      fetchData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async () => {
    if (!state.deleteId || !adminId) return;
    try {
      await axios.post("/api/v1/timesheet/project/delete/", {
        id: state.deleteId,
        by: adminId,
      });
      toast.success("ลบผู้ใช้งานเรียบร้อยแล้ว");
      setState((s) => ({
        ...s,
        modalType: "",
        deleteId: null,
        confirmDeleteText: "",
      }));
      fetchData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้งาน");
    }
  };

  // --- Filtered Data ---
  const filteredUsers = useMemo(() => {
    const q = filters.searchTerm.toLowerCase();
    return state.users.filter((u) => {
      const matchSearch =
        !q ||
        [u.email, u.firstname, u.lastname, u.nickname, u.employee_code].some(
          (s) => s?.toLowerCase().includes(q)
        );
      const matchPos = !filters.position || u.position === filters.position;
      return matchSearch && matchPos;
    });
  }, [state.users, filters]);

  // --- Columns ---
  const columns: ColumnsType<UserProfile> = [
    {
      title: (
        <Tooltip title="ลำดับ">
          <Space>
            #<InfoCircleOutlined />
          </Space>
        </Tooltip>
      ),
      render: (_, __, i) => i + 1,
      width: 60,
      align: "center",
    },
    {
      title: "ชื่อ-นามสกุล",
      render: (_, r) => (
        <Space>
          <Badge dot status={r.status === "ACTIVE" ? "success" : "default"}>
            <Avatar
              src={r.image_profile}
              icon={<UserOutlined />}
              className="border border-indigo-100"
            />
          </Badge>
          <div className="flex flex-col">
            <Flex gap={4} align="center">
              <Typography.Text strong>
                {r.firstname} {r.lastname}
              </Typography.Text>
              <Tooltip title="คัดลอกชื่อ-นามสกุล">
                <Button
                  type="text"
                  size="small"
                  className="text-gray-400 hover:text-blue-600"
                  icon={<CopyOutlined style={{ fontSize: 10 }} />}
                  onClick={() =>
                    handleCopy(`${r.firstname} ${r.lastname}`, "ชื่อ-นามสกุล")
                  }
                />
              </Tooltip>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.nickname}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <Tooltip title="ข้อมูลการติดต่อ">
          <Space>
            <ContactsOutlined /> ติดต่อ
            <QuestionCircleOutlined />
          </Space>
        </Tooltip>
      ),
      render: (_, r) => (
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MailOutlined />
            <span>{r.email}</span>
            <Tooltip title="คัดลอกอีเมล">
              <Button
                type="text"
                size="small"
                className="text-gray-400 hover:text-blue-600 h-auto p-0 ml-1"
                icon={<CopyOutlined style={{ fontSize: 10 }} />}
                onClick={() => handleCopy(r.email || "", "อีเมล")}
              />
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <PhoneOutlined />
            <span>{r.tel || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      render: (v) => (
        <Tag
          color={POSITION_COLORS[v] || "default"}
          className="rounded-full px-2"
        >
          {v || "ไม่ระบุ"}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="รหัสพนักงงาน">
          <Space>
            รหัสพนักงาน <InfoCircleOutlined />
          </Space>
        </Tooltip>
      ),
      dataIndex: "employee_code",
      render: (v) =>
        v ? <Tag icon={<SafetyCertificateOutlined />}>{v}</Tag> : "-",
    },
    {
      title: "จัดการ",
      fixed: "right",
      width: 140,
      render: (_, r) => (
        <Space.Compact>
          <Tooltip title="คัดลอกข้อมูลทั้งหมด">
            <Button
              type="text"
              icon={<CopyOutlined className="text-blue-500" />}
              onClick={async () => {
                await navigator.clipboard.writeText(formatUserCopyText(r));
                toast.success("คัดลอกข้อมูลทั้งหมดเรียบร้อยแล้ว");
              }}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined className="text-orange-500" />}
              onClick={() => {
                setState((s) => ({ ...s, selectedUser: r, modalType: "edit" }));
              }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                setState((s) => ({ ...s, deleteId: r.id, modalType: "delete" }))
              }
            />
          </Tooltip>
        </Space.Compact>
      ),
    },
  ];

  const deleteKeyword = "ยืนยันการลบ";

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <div className="space-y-6  mx-auto">
          <HeaderSection
            title="จัดการข้อมูลผู้ใช้งาน"
            subtitle="Admin System - User Profile"
            refreshLabel="รีเฟรชข้อมูล"
            onRefresh={fetchData}
          />

          <SummaryCards metrics={buildSummaryMetrics(state.users)} />

          <Filters
            filters={filters}
            positions={state.positions}
            onSearchChange={(v: string) =>
              setFilters((prev: any) => ({ ...prev, searchTerm: v }))
            }
            onPositionChange={(v: string) =>
              setFilters((prev: any) => ({ ...prev, position: v }))
            }
            onDateRangeChange={(v: any) =>
              setFilters((prev: any) => ({ ...prev, dateRange: v }))
            }
            onReset={() =>
              setFilters({
                searchTerm: "",
                position: undefined,
                dateRange: null,
              })
            }
          />

          <Card
            className="shadow-sm rounded-xl border-0"
            title={
              <Space>
                <SolutionOutlined />
                รายชื่อผู้ใช้งาน
              </Space>
            }
            extra={
              <Button
                type="primary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    selectedUser: null,
                    modalType: "create",
                  }))
                }
                icon={<UserOutlined />}
              >
                เพิ่มผู้ใช้งาน
              </Button>
            }
          >
            {state.loading ? (
              <Skeleton active />
            ) : (
              <Table
                dataSource={filteredUsers}
                columns={columns}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{
                  pageSize: state.pageSize,
                  onChange: (_, size) =>
                    setState((s) => ({ ...s, pageSize: size })),
                  showSizeChanger: true,
                }}
              />
            )}
          </Card>

          {/* Create Modal */}
          <Modal
            open={state.modalType === "create"}
            title={
              <Space>
                <UserOutlined /> สร้างผู้ใช้งานใหม่
              </Space>
            }
            footer={null}
            onCancel={() => setState((s) => ({ ...s, modalType: "" }))}
          >
            <Form layout="vertical" onFinish={(v) => handleSubmit(v, false)}>
              <UserFormFields />
            </Form>
          </Modal>

          {/* Edit Modal */}
          <Modal
            open={state.modalType === "edit"}
            title={
              <Space>
                <EditOutlined /> แก้ไขข้อมูลผู้ใช้งาน
              </Space>
            }
            footer={null}
            onCancel={() => setState((s) => ({ ...s, modalType: "" }))}
            destroyOnHidden
          >
            <Form
              layout="vertical"
              initialValues={{
                ...state.selectedUser,
                name: state.selectedUser?.firstname, // Mapping for shared field
              }}
              onFinish={(v) =>
                handleSubmit(
                  { ...v, admin_id: state.selectedUser?.admin_id },
                  true
                )
              }
            >
              <UserFormFields isEdit positions={state.positions} form={null} />
            </Form>
          </Modal>

          {/* Delete Modal */}
          <Modal
            open={state.modalType === "delete"}
            title={
              <Space className="text-red-500">
                <ExclamationCircleOutlined /> ยืนยันการลบข้อมูล
              </Space>
            }
            onCancel={() => setState((s) => ({ ...s, modalType: "" }))}
            onOk={handleDelete}
            okButtonProps={{
              danger: true,
              disabled: state.confirmDeleteText !== deleteKeyword,
            }}
          >
            <Typography.Paragraph>
              หากคุณแน่ใจที่จะลบผู้ใช้งานนี้ กรุณาพิมพ์คำว่า{" "}
              <Typography.Text code copyable>
                {deleteKeyword}
              </Typography.Text>
            </Typography.Paragraph>
            <Input
              placeholder={`พิมพ์ "${deleteKeyword}" เพื่อยืนยัน`}
              onChange={(e) =>
                setState((s) => ({ ...s, confirmDeleteText: e.target.value }))
              }
            />
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
