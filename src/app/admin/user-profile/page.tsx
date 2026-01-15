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

const getAvatarColor = (name: string) => {
  const colors = [
    "#f5222d",
    "#fa541c",
    "#fa8c16",
    "#faad14",
    "#fadb14",
    "#a0d911",
    "#52c41a",
    "#13c2c2",
    "#1890ff",
    "#2f54eb",
    "#722ed1",
    "#eb2f96",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const addAlpha = (color: string, alpha: number) => {
  if (!color) return "rgba(0,0,0,0)";
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const buildSummaryMetrics = (users: UserProfile[]): UserSummaryMetric[] => [
  {
    key: "total",
    label: "ผู้ใช้งานทั้งหมด",
    value: users.length,
    color: "#3b82f6",
    icon: <TeamOutlined />,
    desc: "จำนวนสมาชิกในระบบ",
  },
  {
    key: "contactable",
    label: "ติดต่อได้",
    value: users.filter((u) => u.email).length,
    color: "#22c55e",
    icon: <MailOutlined />,
    desc: "สมาชิกที่มีอีเมล",
  },
  {
    key: "unique_positions",
    label: "ตำแหน่งงาน",
    value: new Set(users.map((u) => u.position).filter(Boolean)).size,
    color: "#8b5cf6",
    icon: <SolutionOutlined />,
    desc: "ประเภทตำแหน่ง",
  },
];

// ==========================================
// COMPONENTS
// ==========================================

// --- Summary Cards ---
const SummaryCards = ({ metrics }: { metrics: UserSummaryMetric[] }) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  return (
    <Row gutter={[20, 20]} className="mb-8">
      {metrics.map((m) => (
        <Col xs={24} sm={12} md={8} key={m.key}>
          <div
            className="p-6 rounded-2xl border border-solid h-full transition-all group overflow-hidden relative"
            style={{
              background: token.colorBgContainer,
              borderColor: addAlpha(m.color, 0.2),
            }}
          >
            <div
              className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
              style={{ fontSize: "100px", color: m.color }}
            >
              {m.icon}
            </div>

            <Flex vertical gap={12} className="relative z-10">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                style={{
                  backgroundColor: addAlpha(m.color, isDark ? 0.2 : 0.1),
                  color: m.color,
                }}
              >
                {m.icon}
              </div>

              <div>
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: addAlpha(token.colorTextSecondary, 0.8),
                  }}
                >
                  {m.label}
                </Typography.Text>
                <div className="flex items-baseline gap-2 mt-1">
                  <Typography.Title
                    level={2}
                    style={{ margin: 0, fontWeight: 900, fontSize: 32 }}
                  >
                    {m.value.toLocaleString()}
                  </Typography.Title>
                </div>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, opacity: 0.7 }}
                >
                  {m.desc}
                </Typography.Text>
              </div>
            </Flex>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// --- Header ---
const HeaderSection = ({ title, subtitle, refreshLabel, onRefresh }: any) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  return (
    <div
      className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-3xl border border-solid"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${addAlpha(
              token.colorPrimary,
              0.05
            )} 100%)`
          : `linear-gradient(135deg, #fff 0%, ${addAlpha(
              token.colorPrimary,
              0.03
            )} 100%)`,
        borderColor: addAlpha(token.colorBorder, 0.6),
      }}
    >
      <Space size={20}>
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
          }}
        >
          <ContactsOutlined style={{ fontSize: 28, color: "#fff" }} />
        </div>
        <div>
          <Typography.Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 800,
              letterSpacing: "-1px",
              color: token.colorTextHeading,
            }}
          >
            {title}
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            {subtitle}
          </Typography.Text>
        </div>
      </Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        size="large"
        shape="round"
        style={{
          height: 48,
          padding: "0 24px",
          fontWeight: 600,
          border: `1px solid ${token.colorBorder}`,
          background: token.colorBgContainer,
        }}
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
}: any) => {
  const { token } = theme.useToken();
  return (
    <div
      className="p-6 rounded-3xl border border-solid mb-8"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={10} lg={12}>
          <Input
            prefix={
              <SearchOutlined style={{ color: token.colorTextQuaternary }} />
            }
            placeholder="ค้นหาตาม ชื่อ, อีเมล, หรือพนักงาน..."
            allowClear
            size="large"
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} md={7} lg={6}>
          <Select
            className="w-full"
            placeholder="ตำแหน่งทั้งหมด"
            allowClear
            size="large"
            value={filters.position}
            onChange={onPositionChange}
            options={positions.map((p: string) => ({ label: p, value: p }))}
            suffixIcon={<FilterOutlined />}
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} md={7} lg={6}>
          <Button
            block
            size="large"
            onClick={onReset}
            icon={<ReloadOutlined />}
            style={{
              borderRadius: 12,
              fontWeight: 600,
              background: token.colorBgContainer,
              color: token.colorTextSecondary,
            }}
          >
            รีเซ็ตตัวกรอง
          </Button>
        </Col>
      </Row>
    </div>
  );
};

// --- Modals ---
const UserFormFields = ({ isEdit = false, positions = [], onCancel }: any) => (
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
      <Button onClick={onCancel}>ยกเลิก</Button>
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
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

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
      title: "#",
      key: "rank",
      width: 60,
      align: "center",
      render: (_, __, i) => (
        <Typography.Text
          strong
          style={{
            color: token.colorTextDescription,
            opacity: 0.6,
            fontSize: 13,
          }}
        >
          {(i + 1).toString().padStart(2, "0")}
        </Typography.Text>
      ),
    },
    {
      title: "ผู้ใช้งาน",
      render: (_, r) => (
        <Flex align="center" gap={16}>
          <div style={{ position: "relative" }}>
            <Badge
              dot
              status={r.status === "ACTIVE" ? "success" : "default"}
              offset={[-4, 38]}
            >
              <Avatar
                src={r.image_profile}
                size={52}
                style={{
                  border: `2px solid ${token.colorBorderSecondary}`,
                  background: r.image_profile
                    ? token.colorBgContainer
                    : getAvatarColor(r.firstname || ""),
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                {!r.image_profile && r.firstname?.charAt(0)}
              </Avatar>
            </Badge>
          </div>
          <Flex vertical gap={0}>
            <Flex gap={8} align="center">
              <Typography.Text
                strong
                style={{
                  fontSize: 18,
                  lineHeight: 1.3,
                  color: token.colorTextHeading,
                }}
              >
                {r.firstname} {r.lastname}
              </Typography.Text>
              <Tooltip title="คัดลอกชื่อ">
                <Button
                  type="text"
                  size="small"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  icon={
                    <CopyOutlined
                      style={{ fontSize: 12, color: token.colorPrimary }}
                    />
                  }
                  onClick={() =>
                    handleCopy(`${r.firstname} ${r.lastname}`, "ชื่อ-นามสกุล")
                  }
                />
              </Tooltip>
            </Flex>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {r.nickname || "-"} • {r.employee_code || "JD-XXXX"}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "ข้อมูลการติดต่อ",
      render: (_, r) => (
        <Flex vertical gap={4}>
          <div className="flex items-center gap-2 group">
            <div
              style={{
                padding: 4,
                borderRadius: 6,
                background: addAlpha(token.colorPrimary, 0.1),
                color: token.colorPrimary,
                display: "flex",
              }}
            >
              <MailOutlined style={{ fontSize: 12 }} />
            </div>
            <Typography.Text style={{ fontSize: 13 }}>
              {r.email || "-"}
            </Typography.Text>
            {r.email && (
              <Button
                type="text"
                size="small"
                className="opacity-0 group-hover:opacity-100 p-0 h-auto"
                icon={
                  <CopyOutlined
                    style={{ fontSize: 10, color: token.colorPrimary }}
                  />
                }
                onClick={() => handleCopy(r.email || "", "อีเมล")}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              style={{
                padding: 4,
                borderRadius: 6,
                background: addAlpha(token.colorSuccess, 0.1),
                color: token.colorSuccess,
                display: "flex",
              }}
            >
              <PhoneOutlined style={{ fontSize: 12 }} />
            </div>
            <Typography.Text style={{ fontSize: 13 }}>
              {r.tel || "-"}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      render: (v) => (
        <Tag
          color={POSITION_COLORS[v] || "default"}
          bordered={false}
          style={{
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            padding: "2px 10px",
          }}
        >
          {v || "ไม่ระบุ"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      fixed: "right",
      width: 150,
      align: "center",
      render: (_, r) => (
        <Space size={8}>
          <Tooltip title="คัดลอกข้อมูลทั้งหมด">
            <Button
              type="text"
              shape="circle"
              icon={<CopyOutlined style={{ color: token.colorPrimary }} />}
              onClick={async () => {
                await navigator.clipboard.writeText(formatUserCopyText(r));
                toast.success("คัดลอกข้อมูลทั้งหมดเรียบร้อยแล้ว");
              }}
              style={{ background: addAlpha(token.colorPrimary, 0.05) }}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: token.colorWarning }} />}
              onClick={() => {
                setState((s) => ({ ...s, selectedUser: r, modalType: "edit" }));
              }}
              style={{ background: addAlpha(token.colorWarning, 0.05) }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                setState((s) => ({ ...s, deleteId: r.id, modalType: "delete" }))
              }
              style={{ background: addAlpha(token.colorError, 0.05) }}
            />
          </Tooltip>
        </Space>
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

          <div
            className="rounded-3xl border border-solid overflow-hidden"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div
              className="p-6 border-b border-solid"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              <Flex justify="space-between" align="center">
                <Space size={12}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: addAlpha(token.colorInfo, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorInfo,
                    }}
                  >
                    <SolutionOutlined />
                  </div>
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontWeight: 700 }}
                  >
                    รายชื่อสมาชิก
                  </Typography.Title>
                  {!state.loading && (
                    <Badge
                      count={filteredUsers.length}
                      overflowCount={999}
                      showZero
                      style={{
                        backgroundColor: token.colorSuccess,
                        fontWeight: 700,
                        border: "none",
                      }}
                    />
                  )}
                </Space>
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
                  shape="round"
                  size="large"
                  style={{
                    padding: "0 24px",
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                    border: "none",
                  }}
                >
                  เพิ่มสมาชิกใหม่
                </Button>
              </Flex>
            </div>

            <div className="p-0">
              {state.loading ? (
                <div className="p-10">
                  <Skeleton active />
                </div>
              ) : (
                <Table
                  dataSource={filteredUsers}
                  columns={columns}
                  rowKey="id"
                  className="group"
                  scroll={{ x: 800 }}
                  pagination={{
                    pageSize: state.pageSize,
                    onChange: (_, size) =>
                      setState((s) => ({ ...s, pageSize: size })),
                    showSizeChanger: true,
                    className: "px-6 py-4",
                  }}
                />
              )}
            </div>
          </div>

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
              <UserFormFields
                onCancel={() => setState((s) => ({ ...s, modalType: "" }))}
              />
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
              <UserFormFields
                isEdit
                positions={state.positions}
                form={null}
                onCancel={() => setState((s) => ({ ...s, modalType: "" }))}
              />
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
