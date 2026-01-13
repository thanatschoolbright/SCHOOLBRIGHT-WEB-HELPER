"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Modal,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Typography,
  Descriptions,
  Space,
  Card,
  Flex,
  Statistic,
  Divider,
  Tag,
  theme,
  Segmented,
  Skeleton,
  Progress,
  Avatar,
  Tooltip,
  Dropdown,
} from "antd";
import {
  CheckCircleOutlined,
  FileExcelOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  PieChartOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  BarsOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// Layout & Store
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { getUserById } from "@helpers/local_storage/user.storage";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { categoryType } from "@data/timesheet.category.type";

// Sub Components & Hooks
import { ProjectTable } from "./components/project-table.component";
import { AnalyticsDashboard } from "./components/analytics-dashboard.component";
import { useProjectData } from "./hooks/use-project-data";
import { exportProjectsToExcel } from "./utils/export-excel";
import type { ModalState, FormValues, Project } from "./types/project.types";

const { Title, Text } = Typography;

// ==========================================
// KANBAN BOARD COMPONENT
// ==========================================

const KanbanBoard = ({
  projects,
  loading,
  onEdit,
  onDelete,
  onViewDetail,
  token,
}: {
  projects: Project[];
  loading: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onViewDetail: (p: Project) => void;
  token: any;
}) => {
  const getHealthStatus = (project: Project) => {
    if (project.status === "close")
      return { color: "green", text: "เสร็จสิ้น" };
    if (!project.end_date) return { color: "blue", text: "ไม่มีกำหนดวัน" };

    const now = dayjs();
    const end = dayjs(project.end_date);
    const daysRemaining = end.diff(now, "day");

    if (daysRemaining < 0) return { color: "red", text: "เกินกำหนด" };
    if (daysRemaining <= 7) return { color: "gold", text: "ใกล้ถึงกำหนด" };
    return { color: "green", text: "ปกติ" };
  };

  const columns = useMemo(() => {
    const todo: Project[] = [];
    const inProgress: Project[] = [];
    const done: Project[] = [];

    projects.forEach((p) => {
      if (p.status === "close") {
        done.push(p);
      } else {
        const start = p.start_date ? dayjs(p.start_date) : null;
        const now = dayjs();
        // If start date is in the future, it's To Do. Otherwise In Progress.
        if (start && start.isAfter(now)) {
          todo.push(p);
        } else {
          inProgress.push(p);
        }
      }
    });

    return [
      {
        id: "todo",
        title: "ยังไม่เริ่ม (Upcoming)",
        items: todo,
        color: token.colorWarning,
      },
      {
        id: "process",
        title: "กำลังดำเนินการ (In Progress)",
        items: inProgress,
        color: token.colorPrimary,
      },
      {
        id: "done",
        title: "เสร็จสิ้น (Completed)",
        items: done,
        color: token.colorSuccess,
      },
    ];
  }, [projects, token]);

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1000px]">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-1 min-w-[300px] flex flex-col gap-4 bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <Text strong style={{ fontSize: 16 }}>
                {col.title}
              </Text>
              <Tag
                color={
                  col.id === "done"
                    ? "success"
                    : col.id === "process"
                    ? "blue"
                    : "orange"
                }
              >
                {col.items.length}
              </Tag>
            </div>

            <div className="flex flex-col gap-3">
              {col.items.map((item) => {
                const health = getHealthStatus(item);
                return (
                  <Card
                    key={item.id}
                    hoverable
                    size="small"
                    className="cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4"
                    style={{
                      borderLeftColor:
                        health.color === "red"
                          ? "#ff4d4f"
                          : health.color === "gold"
                          ? "#faad14"
                          : token.colorSuccess,
                      background: token.colorBgContainer,
                    }}
                    onClick={() => onViewDetail(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Text
                        strong
                        className="line-clamp-2 leading-snug text-sm flex-1 mr-2"
                      >
                        {item.name}
                      </Text>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "edit",
                              label: "แก้ไข",
                              icon: <ProjectOutlined />,
                              onClick: (e) => {
                                e.domEvent.stopPropagation();
                                onEdit(item);
                              },
                            },
                            {
                              key: "delete",
                              label: "ลบ",
                              icon: <ExclamationCircleOutlined />,
                              danger: true,
                              onClick: (e) => {
                                e.domEvent.stopPropagation();
                                onDelete(item);
                              },
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<div className="rotate-90">...</div>}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Tag
                        bordered={false}
                        className="text-xs m-0 px-1 py-0 bg-gray-100 dark:bg-gray-800"
                      >
                        {dayjs(item.createdAt).format("DD/MM/YY")}
                      </Tag>
                      {health.text !== "ปกติ" &&
                        health.text !== "เสร็จสิ้น" && (
                          <Tag
                            color={health.color}
                            className="text-xs m-0 px-1 py-0"
                          >
                            {health.text}
                          </Tag>
                        )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center">
                      <Space size={4}>
                        <UserOutlined className="text-xs text-gray-400" />
                        <Text type="secondary" className="text-xs">
                          {getUserById(item.createdBy)?.firstname || "ไม่ระบุ"}
                        </Text>
                      </Space>
                      <Avatar.Group maxCount={2} size="small">
                        <Tooltip title="Features count">
                          <Avatar
                            style={{
                              backgroundColor: token.colorPrimaryBg,
                              color: token.colorPrimary,
                              fontSize: 10,
                            }}
                          >
                            {item.features?.filter((f) => !f.is_deleted)
                              .length || 0}
                          </Avatar>
                        </Tooltip>
                      </Avatar.Group>
                    </div>
                  </Card>
                );
              })}
              {col.items.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-lg">
                  ไม่พบรายการ
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 1. HEADER SECTION
// ==========================================

const HeaderSection = ({
  title,
  subtitle,
  onRefresh,
  onCreate,
  onViewTimeline,
  token,
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  onCreate: () => void;
  onViewTimeline: () => void;
  token: any;
}) => (
  <Flex
    justify="space-between"
    align="center"
    wrap="wrap"
    gap={16}
    className="p-6 rounded-2xl shadow-sm border mb-6 transition-all duration-300 hover:shadow-md"
    style={{
      background: token.colorBgContainer,
      borderColor: token.colorBorderSecondary,
    }}
  >
    <Space size={20}>
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-inner"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorFillSecondary})`,
          border: `1px solid ${token.colorBorder}`,
        }}
      >
        <ProjectOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
      </div>
      <Flex vertical>
        <Title
          level={3}
          style={{
            margin: 0,
            fontWeight: 800,
            background: `linear-gradient(45deg, ${token.colorPrimary}, ${token.colorLink})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {subtitle}
        </Text>
      </Flex>
    </Space>

    <Space size={12} wrap>
      <Button
        icon={<ClockCircleOutlined />}
        onClick={onViewTimeline}
        size="large"
        className="rounded-xl"
      >
        ไทม์ไลน์
      </Button>
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        size="large"
        className="rounded-xl"
      >
        รีเฟรช
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        size="large"
        className="rounded-xl shadow-lg hover:shadow-xl transition-all"
        style={{ fontWeight: 600 }}
      >
        เพิ่มโครงการ
      </Button>
    </Space>
  </Flex>
);

// ==========================================
// 2. STATISTICS CARDS
// ==========================================

const SummaryCards = ({ stats, token }: { stats: any; token: any }) => {
  const cardStyle = {
    background: token.colorBgContainer,
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    height: "100%",
  };

  const iconBoxStyle = (color: string, bg: string) => ({
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    color: color,
    background: bg,
  });

  const items = [
    {
      label: "โครงการทั้งหมด",
      value: stats.total,
      color: token.colorPrimary,
      bg: token.colorPrimaryBg,
      icon: <AppstoreOutlined />,
      suffix: "โครงการ",
    },
    {
      label: "กำลังดำเนินการ",
      value: stats.active,
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <RocketOutlined />,
      suffix: "รายการ",
    },
    {
      label: "ปิดโครงการแล้ว",
      value: stats.closed,
      color: token.colorTextSecondary,
      bg: token.colorFillSecondary,
      icon: <CheckCircleOutlined />,
      suffix: "รายการ",
    },
    {
      label: "อัตราความสำเร็จ",
      value: stats.successRate,
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <PieChartOutlined />,
      suffix: "%",
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {items.map((item, idx) => (
        <Col xs={24} sm={12} xl={6} key={idx}>
          <Card
            bordered={false}
            bodyStyle={{ padding: 24 }}
            className="hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md"
            style={cardStyle}
          >
            <Flex justify="space-between" align="start">
              <Flex vertical gap={4}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {item.label}
                </Text>
                <Statistic
                  value={item.value}
                  valueStyle={{
                    fontWeight: 700,
                    fontSize: 32,
                    color: token.colorText,
                  }}
                  suffix={
                    <span
                      style={{ fontSize: 14, color: token.colorTextQuaternary }}
                    >
                      {item.suffix}
                    </span>
                  }
                />
              </Flex>
              <div style={iconBoxStyle(item.color, item.bg)}>{item.icon}</div>
            </Flex>
            <div className="mt-4">
              <Progress
                percent={item.label === "อัตราความสำเร็จ" ? item.value : 100}
                showInfo={false}
                strokeColor={item.color}
                trailColor={token.colorFillSecondary}
                size="small"
              />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function ProjectManagementPage() {
  const router = useRouter();
  const { token } = theme.useToken();
  const [form] = Form.useForm<FormValues>();

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id || 0;

  const {
    loading,
    projects,
    pagination,
    setPagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjectData(adminId);

  // States
  const [modalState, setModalState] = useState<ModalState>({
    type: "",
    data: null,
  });
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Filters State
  const [filters, setFilters] = useState({
    searchText: "",
    statusFilter: "ALL", // Changed default to ALL for better UX
    categoryFilter: "ALL",
  });

  // Initial Setting: 100 items per page
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize: 100, current: 1 }));
  }, []);

  const getCategoryName = useCallback((categoryId: string) => {
    return (
      categoryType.find((c) => String(c.id) === String(categoryId))?.name ||
      categoryId
    );
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchSearch =
        !filters.searchText ||
        [project.name, project.name_en, project.description].some((s) =>
          s?.toLowerCase().includes(filters.searchText.toLowerCase())
        );
      const matchStatus =
        filters.statusFilter === "ALL" ||
        project.status === filters.statusFilter;
      const matchCategory =
        filters.categoryFilter === "ALL" ||
        String(project.categoryType) === filters.categoryFilter;

      // Ensure we don't show deleted unless strictly requested (if logic existed)
      // Assuming API handles is_deleted=false by default, but filtering safely here:
      const matchDeleted = !project.is_deleted;

      return matchSearch && matchStatus && matchCategory && matchDeleted;
    });
  }, [projects, filters]);

  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const active = filteredProjects.filter((p) => p.status === "open").length;
    const closed = filteredProjects.filter((p) => p.status === "close").length;
    const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { total, active, closed, successRate };
  }, [filteredProjects]);

  // Handlers
  const handleResetFilters = () =>
    setFilters({
      searchText: "",
      statusFilter: "ALL",
      categoryFilter: "ALL",
    });

  const closeModal = () => {
    setModalState({ type: "", data: null });
    setConfirmDeleteText("");
    form.resetFields();
  };

  const openEditModal = (record: Project) => {
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    });
    setModalState({ type: "edit", data: record });
  };

  const handleSubmitForm = async (values: FormValues) => {
    setActionLoading(true);
    try {
      const success = modalState.data?.id
        ? await updateProject(modalState.data.id, values)
        : await createProject(values);
      if (success) {
        closeModal();
        fetchProjects();
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div className="mx-auto p-6 pb-20">
          <HeaderSection
            title="ภาพรวมโครงการ (Project Overview)"
            subtitle="ระบบบริหารจัดการ Timesheet และติดตามความคืบหน้าโครงการ"
            onRefresh={fetchProjects}
            onCreate={() => setModalState({ type: "create" })}
            onViewTimeline={() => router.push("/timesheet/timeline")}
            token={token}
          />

          <SummaryCards stats={stats} token={token} />

          {/* Filter Bar */}
          <Card
            bordered={false}
            className="mb-6 shadow-sm rounded-2xl"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Flex gap={16} wrap="wrap" align="center" justify="space-between">
              <Flex gap={12} wrap="wrap" className="flex-1">
                <Input
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextPlaceholder }}
                    />
                  }
                  placeholder="พิมพ์เพื่อค้นหาโครงการ..."
                  size="large"
                  className="rounded-xl w-full md:w-80"
                  value={filters.searchText}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  style={{ background: token.colorFillAlter }}
                />
                <Select
                  size="large"
                  placeholder="ประเภทโครงการ"
                  value={filters.categoryFilter}
                  onChange={(v) =>
                    setFilters({ ...filters, categoryFilter: v })
                  }
                  options={[
                    { label: "ทุกประเภท", value: "ALL" },
                    ...categoryType.map((c) => ({
                      label: c.name,
                      value: String(c.id),
                    })),
                  ]}
                  style={{ width: 200 }}
                  className="rounded-xl"
                />
              </Flex>

              <Flex gap={8}>
                <Segmented
                  options={[
                    { value: "table", icon: <BarsOutlined />, label: "ตาราง" },
                    {
                      value: "kanban",
                      icon: <AppstoreOutlined />,
                      label: "บอร์ดงาน",
                    },
                  ]}
                  value={viewMode}
                  onChange={setViewMode as any}
                  size="large"
                />
                <Button
                  onClick={handleResetFilters}
                  icon={<ReloadOutlined />}
                  size="large"
                  className="rounded-xl"
                >
                  ล้างค่า
                </Button>
                <Button
                  icon={<PieChartOutlined />}
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  type={showAnalytics ? "primary" : "default"}
                  size="large"
                  className="rounded-xl"
                  ghost={showAnalytics}
                >
                  {showAnalytics ? "ซ่อนกราฟ" : "วิเคราะห์"}
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() =>
                    exportProjectsToExcel(filteredProjects, getCategoryName)
                  }
                  size="large"
                  className="rounded-xl"
                  style={{ color: "#217346", borderColor: "#217346" }}
                >
                  Excel
                </Button>
              </Flex>
            </Flex>
          </Card>

          {showAnalytics && (
            <div className="mb-6 animate-pulse-once">
              <AnalyticsDashboard
                projects={filteredProjects}
                getCategoryName={getCategoryName}
              />
            </div>
          )}

          {/* Main Content Area */}
          {viewMode === "table" ? (
            <Card
              bordered={false}
              className="shadow-sm rounded-2xl overflow-hidden"
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
              title={
                <Space>
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      background: token.colorPrimary,
                      borderRadius: 4,
                    }}
                  />
                  <Text strong style={{ fontSize: 18 }}>
                    รายชื่อโครงการ ({filteredProjects.length})
                  </Text>
                </Space>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
              ) : (
                <ProjectTable
                  projects={filteredProjects}
                  loading={loading}
                  pagination={pagination}
                  onPaginationChange={(page, size) =>
                    setPagination({
                      ...pagination,
                      current: page,
                      pageSize: size,
                    })
                  }
                  onEdit={openEditModal}
                  onDelete={(record) =>
                    setModalState({ type: "delete", data: record })
                  }
                  onViewDetail={(record) =>
                    setModalState({ type: "detail", data: record })
                  }
                  getCategoryName={getCategoryName}
                />
              )}
            </Card>
          ) : (
            <KanbanBoard
              projects={filteredProjects}
              loading={loading}
              token={token}
              onEdit={openEditModal}
              onDelete={(item) => setModalState({ type: "delete", data: item })}
              onViewDetail={(item) =>
                setModalState({ type: "detail", data: item })
              }
            />
          )}

          {/* --- Modals Section --- */}
          <Modal
            open={modalState.type === "create" || modalState.type === "edit"}
            title={
              <Space>
                {modalState.type === "edit" ? (
                  <ProjectOutlined className="text-blue-500" />
                ) : (
                  <PlusOutlined className="text-green-500" />
                )}{" "}
                <Text strong style={{ fontSize: 20 }}>
                  {modalState.type === "edit"
                    ? "แก้ไขข้อมูลโครงการ"
                    : "สร้างโครงการใหม่"}
                </Text>
              </Space>
            }
            onCancel={closeModal}
            footer={null}
            width={800}
            centered
            styles={{ content: { borderRadius: 16 } }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitForm}
              className="mt-6"
              size="large"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="ชื่อโครงการ (ภาษาไทย)"
                    rules={[
                      { required: true, message: "กรุณาระบุชื่อโครงการ" },
                    ]}
                  >
                    <Input
                      placeholder="เช่น โครงการปรับปรุงระบบ..."
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="name_en"
                    label="ชื่อโครงการ (ภาษาอังกฤษ)"
                    rules={[
                      { required: true, message: "กรุณาระบุชื่อภาษาอังกฤษ" },
                    ]}
                  >
                    <Input
                      placeholder="เช่น System Renovation Project"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="categoryType"
                    label="ประเภทโครงการ"
                    rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                  >
                    <Select
                      className="rounded-lg"
                      placeholder="เลือกประเภท"
                      options={categoryType.map((c) => ({
                        label: c.name,
                        value: String(c.id),
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="สถานะโครงการ"
                    rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                  >
                    <Select
                      className="rounded-lg"
                      placeholder="เลือกสถานะ"
                      options={[
                        {
                          label: <Tag color="success">เปิดโครงการ (Open)</Tag>,
                          value: "open",
                        },
                        {
                          label: <Tag color="default">ปิดโครงการ (Close)</Tag>,
                          value: "close",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="start_date" label="วันที่เริ่มต้น">
                    <DatePicker
                      className="w-full rounded-lg"
                      format="DD/MM/YYYY"
                      placeholder="วว/ดด/ปปปป"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="end_date" label="วันที่สิ้นสุด">
                    <DatePicker
                      className="w-full rounded-lg"
                      format="DD/MM/YYYY"
                      placeholder="วว/ดด/ปปปป"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="รายละเอียดเพิ่มเติม">
                <Input.TextArea
                  rows={4}
                  className="rounded-lg"
                  placeholder="รายละเอียดหรือหมายเหตุ..."
                />
              </Form.Item>
              <Divider />
              <Flex justify="end" gap={12}>
                <Button
                  onClick={closeModal}
                  size="large"
                  className="rounded-lg"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  icon={<CheckCircleOutlined />}
                  size="large"
                  className="rounded-lg"
                >
                  บันทึกข้อมูล
                </Button>
              </Flex>
            </Form>
          </Modal>

          <Modal
            open={modalState.type === "delete"}
            title={
              <Space className="text-red-500">
                <ExclamationCircleOutlined style={{ fontSize: 24 }} />
                <Text strong style={{ fontSize: 20 }}>
                  ยืนยันลบโครงการ?
                </Text>
              </Space>
            }
            onCancel={closeModal}
            onOk={() =>
              deleteProject(modalState.data?.id!).then(() => {
                closeModal();
                fetchProjects();
              })
            }
            okButtonProps={{
              danger: true,
              disabled: confirmDeleteText !== "Delete",
              size: "large",
              className: "rounded-lg",
            }}
            cancelButtonProps={{ size: "large", className: "rounded-lg" }}
            okText="ลบข้อมูลทันที"
            cancelText="ยกเลิก"
            centered
            width={500}
            styles={{ content: { borderRadius: 16 } }}
          >
            <Flex vertical gap={12} className="my-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                <Text type="secondary">คุณกำลังจะลบโครงการ:</Text>
                <br />
                <Text strong style={{ fontSize: 16 }}>
                  {modalState.data?.name}
                </Text>
              </div>
              <Text>
                การกระทำนี้ไม่สามารถกู้คืนได้ หากต้องการยืนยัน โปรดพิมพ์คำว่า{" "}
                <Text code copyable>
                  Delete
                </Text>{" "}
                ในช่องด้านล่าง
              </Text>
              <Input
                placeholder="พิมพ์ 'Delete' เพื่อยืนยัน"
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </Flex>
          </Modal>

          <Modal
            title={
              <Space>
                <InfoCircleOutlined style={{ color: token.colorInfo }} />
                <Text strong>รายละเอียดโครงการ</Text>
              </Space>
            }
            open={modalState.type === "detail"}
            onCancel={closeModal}
            footer={
              <Button onClick={closeModal} size="large" className="rounded-lg">
                ปิดหน้าต่าง
              </Button>
            }
            centered
            width={600}
            styles={{ content: { borderRadius: 16 } }}
          >
            {modalState.data && (
              <Descriptions
                column={1}
                bordered
                size="middle"
                className="mt-4"
                labelStyle={{ width: 150 }}
              >
                <Descriptions.Item label="ชื่อโครงการ (TH)">
                  <Text strong>{modalState.data.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="ชื่อโครงการ (EN)">
                  {modalState.data.name_en || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="ประเภท">
                  <Tag color="cyan">
                    {getCategoryName(String(modalState.data.categoryType))}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="สถานะ">
                  {modalState.data.status === "open" ? (
                    <Tag color="success">เปิดอยู่</Tag>
                  ) : (
                    <Tag color="default">ปิดแล้ว</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="ระยะเวลา">
                  {convertToThaiDateDDMMYYY(modalState.data.start_date)} -{" "}
                  {convertToThaiDateDDMMYYY(modalState.data.end_date)}
                </Descriptions.Item>
                <Descriptions.Item label="สร้างเมื่อ">
                  {convertToThaiDateDDMMYYY(modalState.data.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="ผู้รับผิดชอบ">
                  {getUserById(modalState.data.createdBy)?.firstname ??
                    "ไม่ระบุ"}
                </Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">
                  {modalState.data.description || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
