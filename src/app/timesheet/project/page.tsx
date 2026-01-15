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
  List,
  AutoComplete,
  Empty,
  InputNumber,
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
  MinusCircleOutlined,
  TeamOutlined,
  ApartmentOutlined,
  GlobalOutlined,
  ToolOutlined,
  MedicineBoxOutlined,
  CompassOutlined,
  AuditOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// Layout & Store
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { getUserById, getUserData } from "@helpers/local_storage/user.storage";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { categoryType } from "@data/timesheet.category.type";

// Sub Components & Hooks
import { ProjectTable } from "./components/project-table.component";
import { AnalyticsDashboard } from "./components/analytics-dashboard.component";
import { ProjectStatusModal } from "./components/project-status-modal.component";
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
        title: "ยังไม่เริ่ม",
        items: todo,
        color: token.colorWarning,
      },
      {
        id: "process",
        title: "กำลังดำเนินการ",
        items: inProgress,
        color: token.colorPrimary,
      },
      {
        id: "done",
        title: "เสร็จสิ้น",
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
  onManageStatus,
  token,
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  onCreate: () => void;
  onViewTimeline: () => void;
  onManageStatus: () => void;
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
      <Tooltip title="จัดการขั้นตอนการทำงานและสถานะ (SDLC Step)">
        <Button
          icon={<CheckCircleOutlined />}
          onClick={onManageStatus}
          size="large"
          className="rounded-xl border-dashed"
          style={{ color: token.colorPrimary, borderColor: token.colorPrimary }}
        >
          เพิ่มสถานะโครงการ/โครงการย่อย
        </Button>
      </Tooltip>
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

  const tooltipContent = (
    label: string,
    source: string,
    calc: string,
    utility: string
  ) => (
    <div style={{ padding: "4px" }}>
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          paddingBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          ที่มา:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{source}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          การคำนวณ:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{calc}</span>
      </div>
      <div>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          ประโยชน์:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{utility}</span>
      </div>
    </div>
  );

  const items = [
    {
      label: "โครงการทั้งหมด",
      value: `${stats.total}/${stats.total}`,
      percent: 100,
      color: token.colorPrimary,
      bg: token.colorPrimaryBg,
      icon: <AppstoreOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "โครงการทั้งหมด",
        "ดึงข้อมูลจากฐานข้อมูลโครงการ (ยกเว้นที่ถูกลบ)",
        "นับจำนวนโครงการทั้งหมดที่อยู่ในระบบ",
        "ใช้ดูภาพรวมปริมาณโครงการทั้งหมดที่เคยบริหารจัดการ"
      ),
    },
    {
      label: "กำลังดำเนินการ",
      value: `${stats.active}/${stats.total}`,
      percent: stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <RocketOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "กำลังดำเนินการ",
        "โครงการที่มีสถานะเป็น 'เปิดใช้งาน'",
        "กรองโครงการที่มีสถานะ Open",
        "ช่วยติดตามความคืบหน้าของงานปัจจุบันที่กำลังทำอยู่"
      ),
    },
    {
      label: "ปิดโครงการแล้ว",
      value: `${stats.closed}/${stats.total}`,
      percent: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      color: token.colorTextSecondary,
      bg: token.colorFillSecondary,
      icon: <CheckCircleOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "ปิดโครงการแล้ว",
        "โครงการที่มีสถานะเป็น 'ปิดโครงการ' หรือเสร็จแล้ว",
        "กรองโครงการที่มีสถานะ Closed",
        "ใช้สำรวจโครงการที่จบไปแล้วเพื่อสรุปยอดหรืองานย้อนหลัง"
      ),
    },
    {
      label: "อัตราความสำเร็จ",
      value: stats.successRate,
      percent: stats.successRate,
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <PieChartOutlined />,
      suffix: "%",
      tooltip: tooltipContent(
        "อัตราความสำเร็จ",
        "คำนวณจากสัดส่วนโครงการที่ปิดแล้ว",
        "(จำนวนที่ปิด / จำนวนทั้งหมด) x 100",
        "วัดประสิทธิภาพการบริหารโครงการให้เสร็จสิ้นตามเป้าหมาย"
      ),
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {items.map((item, idx) => (
        <Col xs={24} sm={12} xl={6} key={idx}>
          <Card
            bodyStyle={{ padding: 24 }}
            className="hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md"
            style={cardStyle}
          >
            <Flex justify="space-between" align="start">
              <Flex vertical gap={4}>
                <Tooltip title={item.tooltip} placement="topLeft" arrow>
                  <Text
                    type="secondary"
                    style={{ fontSize: 13, cursor: "help" }}
                  >
                    {item.label}{" "}
                    <InfoCircleOutlined
                      style={{ fontSize: 10, opacity: 0.5 }}
                    />
                  </Text>
                </Tooltip>
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
                percent={item.percent}
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
// 3. CATEGORY CARDS
// ==========================================

const CategorySummaryCards = ({
  projects,
  token,
}: {
  projects: Project[];
  token: any;
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "INTERNAL":
        return <ApartmentOutlined />;
      case "EXTERNAL":
        return <GlobalOutlined />;
      case "MAINTENANCE":
        return <ToolOutlined />;
      case "LEAVE":
        return <MedicineBoxOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  const getColor = (id: string) => {
    switch (id) {
      case "INTERNAL":
        return token.colorPrimary;
      case "EXTERNAL":
        return token.colorSuccess;
      case "MAINTENANCE":
        return token.colorWarning;
      case "LEAVE":
        return "#eb2f96"; // Pink
      default:
        return token.colorTextSecondary;
    }
  };

  const getBg = (id: string) => {
    switch (id) {
      case "INTERNAL":
        return token.colorPrimaryBg;
      case "EXTERNAL":
        return token.colorSuccessBg;
      case "MAINTENANCE":
        return token.colorWarningBg;
      case "LEAVE":
        return "#fff0f6";
      default:
        return token.colorFillTertiary;
    }
  };

  const cardStyle = {
    background: token.colorBgContainer,
    borderRadius: 12,
    border: `1px solid ${token.colorBorderSecondary}`,
    height: "100%",
  };

  // Filter out deleted projects for all calculations
  const validProjects = projects.filter((p) => !p.is_deleted);
  const total = validProjects.length;

  return (
    <div className="mb-6">
      <Space className="mb-4">
        <AppstoreOutlined />
        <Text strong>แยกตามประเภท (By Category)</Text>
      </Space>
      <Row gutter={[12, 12]}>
        {categoryType.map((cat) => {
          const count = validProjects.filter(
            (p) => String(p.categoryType) === String(cat.id)
          ).length;

          const categoryTooltip = (
            <div style={{ padding: "4px" }}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 8,
                  borderBottom: `1px solid rgba(255,255,255,0.2)`,
                  paddingBottom: 4,
                }}
              >
                หมวดหมู่: {cat.name}
              </div>
              <div style={{ marginBottom: 4 }}>
                <Text strong style={{ color: "#fff", fontSize: 11 }}>
                  ที่มา:
                </Text>{" "}
                <span style={{ fontSize: 11 }}>
                  แยกตามประเภทที่ระบุในโครงการ
                </span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Text strong style={{ color: "#fff", fontSize: 11 }}>
                  การคำนวณ:
                </Text>{" "}
                <span style={{ fontSize: 11 }}>
                  กรองเฉพาะโครงการที่เป็นประเภท {cat.id}
                </span>
              </div>
              <div>
                <Text strong style={{ color: "#fff", fontSize: 11 }}>
                  ประโยชน์:
                </Text>{" "}
                <span style={{ fontSize: 11 }}>
                  ใช้สำหรับการทำแผนผังทรัพยากรและการจัดการงบประมาณตามหมวดหมู่
                </span>
              </div>
            </div>
          );

          return (
            <Col xs={12} sm={8} md={6} xl={4} key={cat.id}>
              <Tooltip title={categoryTooltip} placement="top">
                <Card
                  size="small"
                  style={cardStyle}
                  className="hover:shadow-sm transition-all cursor-help"
                >
                  <Flex justify="space-between" align="start" className="mb-2">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: getColor(cat.id),
                        background: getBg(cat.id),
                      }}
                    >
                      {getIcon(cat.id)}
                    </div>
                    <Tag color={count > 0 ? getColor(cat.id) : "default"}>
                      {count}/{total}
                    </Tag>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {cat.name}
                  </Text>
                </Card>
              </Tooltip>
            </Col>
          );
        })}
      </Row>
    </div>
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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [users, setUsers] = useState<any[]>([]);
  const [costPerHour, setCostPerHour] = useState<number>(0);

  const [filters, setFilters] = useState({
    searchText: "",
    statusFilter: "ALL",
    categoryFilter: "ALL",
  });

  // Initial Setting
  useEffect(() => {
    const u = getUserData();
    if (u) setUsers(u);
  }, []);

  const getCategoryName = useCallback((categoryId?: string) => {
    if (!categoryId) return "-";
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

      return matchSearch && matchStatus && matchCategory;
    });
  }, [projects, filters]);

  const stats = useMemo(() => {
    // Calculated from API response directly (projects)
    // EXCLUDE deleted projects from ALL stats
    const validProjects = projects.filter((p) => !p.is_deleted);

    const total = validProjects.length;

    // Active: Open status
    const active = validProjects.filter((p) => p.status === "open").length;

    // Closed: Close status
    const closed = validProjects.filter((p) => p.status === "close").length;

    // Success Rate: Closed / Total (Valid projects only)
    const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, active, closed, successRate };
  }, [projects]);

  const positionOptions = useMemo(() => {
    const positions = new Set<string>();
    users.forEach((u) => {
      if (u.position) {
        positions.add(u.position);
      }
    });
    return Array.from(positions).map((p) => ({ value: p }));
  }, [users]);

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
      assignees: record.projectAssignees?.map((a) => ({
        userId: a.userId,
        position: a.position,
      })),
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
            onManageStatus={() => setStatusModalOpen(true)}
            token={token}
          />

          <SummaryCards stats={stats} token={token} />

          <CategorySummaryCards projects={projects} token={token} />

          {/* Filter Bar */}
          <Card
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
                  onShowAssignees={(record) =>
                    setModalState({ type: "assignees", data: record })
                  }
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

          {/* Status Management Modal */}
          <ProjectStatusModal
            open={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
          />

          {/* Create/Edit Modal */}
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
                          label: <Tag color="success">เปิดโครงการ</Tag>,
                          value: "open",
                        },
                        {
                          label: <Tag color="default">ปิดโครงการ</Tag>,
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

              <Divider
                dashed
                orientation="left"
                style={{ borderColor: token.colorBorder }}
              >
                <Space>
                  <TeamOutlined /> ทีมงานผู้รับผิดชอบ
                </Space>
              </Divider>

              <Form.List name="assignees">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row
                        key={key}
                        gutter={12}
                        align="middle"
                        className="mb-2"
                      >
                        <Col span={10}>
                          <Form.Item
                            {...restField}
                            name={[name, "userId"]}
                            rules={[
                              { required: true, message: "ระบุผู้รับผิดชอบ" },
                            ]}
                            className="mb-0"
                          >
                            <Select
                              placeholder="เลือกผู้รับผิดชอบ"
                              showSearch
                              filterOption={(input, option) =>
                                (option?.label ?? "")
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              options={users.map((u) => ({
                                label: `${u.firstname} ${u.lastname}`,
                                value: u.admin_id,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "position"]}
                            className="mb-0"
                          >
                            <AutoComplete
                              options={positionOptions}
                              placeholder="ตำแหน่ง / หน้าที่ (Optional)"
                              filterOption={(inputValue, option) =>
                                (option?.value ?? "")
                                  .toUpperCase()
                                  .indexOf(inputValue.toUpperCase()) !== -1
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: "red", fontSize: 18 }}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        เพิ่มผู้รับผิดชอบ
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

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

          {/* Delete Modal */}
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

          {/* Detail Modal - Redesigned */}
          <Modal
            open={modalState.type === "detail"}
            onCancel={closeModal}
            footer={null}
            centered
            width={900}
            styles={{
              content: { borderRadius: 24, padding: 0, overflow: "hidden" },
            }}
            closable={false}
          >
            {modalState.data && (
              <div className="relative bg-gray-50 dark:bg-gray-900">
                {/* Header Banner */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorLink})`,
                    padding: "32px 32px 64px 32px",
                  }}
                  className="relative"
                >
                  <Button
                    icon={<CloseOutlined style={{ color: "white" }} />}
                    type="text"
                    className="absolute top-4 right-4 hover:bg-white/20"
                    onClick={closeModal}
                  />
                  <Flex justify="space-between" align="start" gap={32}>
                    <Flex gap={12} vertical style={{ flex: 1 }}>
                      <Space size={12}>
                        <Tag
                          color="rgba(255,255,255,0.2)"
                          className="text-white border-none px-3 py-1 font-semibold backdrop-blur-sm"
                        >
                          {getCategoryName(
                            String(modalState.data.categoryType)
                          )}
                        </Tag>
                        <Tag
                          color={
                            modalState.data.status === "open"
                              ? "#87d068"
                              : "default"
                          }
                          className="border-none px-3 py-1 font-semibold"
                        >
                          {modalState.data.status === "open"
                            ? "เปิดใช้งาน"
                            : "ปิดโครงการ"}
                        </Tag>
                      </Space>
                      <Title
                        level={2}
                        style={{ color: "white", margin: 0, fontWeight: 800 }}
                      >
                        {modalState.data.name}
                      </Title>
                      {modalState.data.name_en && (
                        <Text className="text-white/80 text-xl italic">
                          {modalState.data.name_en}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </div>

                <div className="px-8 pb-8 -mt-10">
                  {/* Stats Cards - Floating overlapping banner */}
                  <Row gutter={16} className="mb-6">
                    <Col span={8}>
                      <Card
                        className="shadow-md h-full rounded-2xl border-l-4 border-l-blue-500"
                        bodyStyle={{ padding: 20 }}
                      >
                        <Statistic
                          title={
                            <Space className="text-sm font-medium text-gray-400">
                              <CalendarOutlined /> ระยะเวลาโครงการ
                            </Space>
                          }
                          value={convertToThaiDateDDMMYYY(
                            modalState.data.start_date
                          )}
                          valueStyle={{ fontSize: 16, fontWeight: 700 }}
                          formatter={(val) => (
                            <div className="flex flex-col gap-1 mt-1">
                              <span>{val}</span>
                              <span className="text-xs text-gray-400">
                                ถึง{" "}
                                {convertToThaiDateDDMMYYY(
                                  modalState?.data?.end_date
                                )}
                              </span>
                            </div>
                          )}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        className="shadow-md h-full rounded-2xl border-l-4 border-l-orange-500"
                        bodyStyle={{ padding: 20 }}
                      >
                        <Statistic
                          title={
                            <Space className="text-sm font-medium text-gray-400">
                              <ClockCircleOutlined /> ประมาณการชั่วโมงรวม
                            </Space>
                          }
                          value={modalState.data.estimate_hour || 0}
                          suffix="Hours"
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#fa8c16",
                          }}
                        />
                        <div className="text-[10px] text-gray-400 mt-2">
                          * คำนวณจาก (จำนวนทีมงาน x 8 ชม. x วันทำการ)
                        </div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        className="shadow-md h-full rounded-2xl border-l-4 border-l-green-500"
                        bodyStyle={{ padding: 20 }}
                      >
                        <Statistic
                          title={
                            <Space className="text-sm font-medium text-gray-400">
                              <AppstoreOutlined /> ฟีเจอร์ย่อย
                            </Space>
                          }
                          value={
                            modalState.data.features?.filter(
                              (f) => !f.is_deleted
                            ).length || 0
                          }
                          suffix="รายการ"
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#52c41a",
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    {/* Left Main */}
                    <Col span={16}>
                      <div className="flex flex-col gap-6">
                        <Card
                          className="shadow-md h-full rounded-2xl border-l-4 border-l-purple-500"
                          bodyStyle={{ padding: 20 }}
                        >
                          <div className="text-sm font-medium text-gray-400 mb-3">
                            <UserOutlined /> ผู้สร้างโครงการ
                          </div>
                          <Space>
                            <Avatar
                              size={40}
                              style={{
                                backgroundColor: token.colorPrimaryBg,
                                color: token.colorPrimary,
                              }}
                            >
                              {
                                getUserById(modalState.data.createdBy)
                                  ?.firstname?.[0]
                              }
                            </Avatar>
                            <div className="flex flex-col">
                              <Text strong>
                                {getUserById(modalState.data.createdBy)
                                  ?.firstname || "System"}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {convertToThaiDateDDMMYYY(
                                  modalState.data.createdAt
                                )}
                              </Text>
                            </div>
                          </Space>
                        </Card>

                        <Card
                          title={
                            <Space>
                              <FileTextOutlined /> รายละเอียด
                            </Space>
                          }
                          className="shadow-sm rounded-2xl"
                        >
                          <Text className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                            {modalState.data.description ||
                              "ไม่มีรายละเอียดเพิ่มเติม"}
                          </Text>
                        </Card>
                      </div>

                      <Card
                        title={
                          <Space>
                            <AppstoreOutlined /> รายการฟีเจอร์ (Features)
                          </Space>
                        }
                        className="shadow-sm rounded-2xl mt-5"
                        styles={{
                          body: {
                            padding: "0 24px 24px",
                          },
                        }}
                      >
                        <List
                          itemLayout="horizontal"
                          dataSource={
                            modalState.data.features?.filter(
                              (f) => !f.is_deleted
                            ) || []
                          }
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={
                                  <div
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 10,
                                      background:
                                        item.status === "open"
                                          ? token.colorPrimaryBg
                                          : token.colorFillSecondary,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color:
                                        item.status === "open"
                                          ? token.colorPrimary
                                          : token.colorTextSecondary,
                                    }}
                                  >
                                    <ProjectOutlined />
                                  </div>
                                }
                                title={
                                  <Text strong style={{ fontSize: 15 }}>
                                    {item.name}
                                  </Text>
                                }
                                description={
                                  <Tag
                                    bordered={false}
                                    color={
                                      item.status === "open"
                                        ? "processing"
                                        : "default"
                                    }
                                  >
                                    {item.status === "open"
                                      ? "Active"
                                      : "Closed"}
                                  </Tag>
                                }
                              />
                            </List.Item>
                          )}
                        />
                        {(!modalState.data.features ||
                          modalState.data.features.filter((f) => !f.is_deleted)
                            .length === 0) && (
                          <div className="text-center py-8 text-gray-400">
                            ไม่มีรายการฟีเจอร์
                          </div>
                        )}
                      </Card>
                    </Col>

                    {/* Right Side */}
                    <Col span={8}>
                      <Card
                        title={
                          <Space>
                            <TeamOutlined /> ทีมงาน (
                            {modalState.data.projectAssignees?.length || 0})
                          </Space>
                        }
                        className="shadow-sm rounded-2xl h-full"
                      >
                        <List
                          itemLayout="horizontal"
                          dataSource={modalState.data.projectAssignees || []}
                          locale={{ emptyText: "ยังไม่มีผู้รับผิดชอบ" }}
                          renderItem={(item) => {
                            const u = getUserById(item.userId);
                            return (
                              <List.Item
                                style={{
                                  padding: "12px 0",
                                  borderBottom: "1px dashed #f0f0f0",
                                }}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar
                                      src={u?.profile_image}
                                      style={{
                                        backgroundColor: token.colorPrimary,
                                      }}
                                    >
                                      {u?.firstname?.[0]}
                                    </Avatar>
                                  }
                                  title={
                                    <Text style={{ fontSize: 14 }}>
                                      {u?.firstname} {u?.lastname}
                                    </Text>
                                  }
                                  description={
                                    item.position ? (
                                      <Tag
                                        color="blue"
                                        bordered={false}
                                        className="text-[10px] m-0 mt-1"
                                      >
                                        {item.position}
                                      </Tag>
                                    ) : (
                                      <Text
                                        type="secondary"
                                        className="text-[11px]"
                                      >
                                        ไม่ระบุตำแหน่ง
                                      </Text>
                                    )
                                  }
                                />
                              </List.Item>
                            );
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Modal>

          {/* Assignees List Modal - Refactored for Dark Mode & V5 */}
          <Modal
            open={modalState.type === "assignees"}
            onCancel={closeModal}
            footer={null}
            centered
            width={850}
            styles={{
              content: { borderRadius: 24, padding: 0, overflow: "hidden" },
            }}
            closable={false}
          >
            {modalState.data && (
              <div style={{ backgroundColor: token.colorBgLayout }}>
                {/* Header Banner */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${token.colorInfoActive}, ${token.colorPrimary})`,
                    padding: "32px 32px 64px 32px",
                    position: "relative",
                  }}
                >
                  <Button
                    icon={<CloseOutlined style={{ color: "white" }} />}
                    type="text"
                    style={{ position: "absolute", top: 16, right: 16 }}
                    className="hover:bg-white/20"
                    onClick={closeModal}
                  />
                  <Flex vertical gap={24}>
                    <Flex justify="space-between" align="center" gap={32}>
                      <Flex gap={8} vertical style={{ flex: 1 }}>
                        <Space size={12}>
                          <TeamOutlined
                            style={{ color: "white", fontSize: 24 }}
                          />
                          <Title
                            level={4}
                            style={{
                              color: "white",
                              margin: 0,
                              fontWeight: 700,
                            }}
                          >
                            รายชื่อผู้จัดทำโครงการ
                          </Title>
                        </Space>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.85)",
                            fontStyle: "italic",
                          }}
                        >
                          {modalState.data.name}
                        </Text>
                      </Flex>

                      <Space size={16}>
                        <Card
                          size="small"
                          bordered={false}
                          style={{
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(8px)",
                            borderRadius: 16,
                            minWidth: 140,
                          }}
                        >
                          <Statistic
                            title={
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.7)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: 1,
                                }}
                              >
                                จำนวนชั่วโมงทั้งหมด
                              </span>
                            }
                            value={modalState.data.estimate_hour || 0}
                            valueStyle={{
                              color: "white",
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                            suffix={
                              <span style={{ fontSize: 12, color: "white" }}>
                                ชม.
                              </span>
                            }
                            formatter={(val) => Number(val).toLocaleString()}
                          />
                        </Card>

                        {costPerHour > 0 && (
                          <Card
                            size="small"
                            bordered={false}
                            style={{
                              background: "rgba(255,255,255,0.25)",
                              backdropFilter: "blur(8px)",
                              borderRadius: 16,
                              minWidth: 180,
                              border: "1px solid rgba(255,255,255,0.3)",
                            }}
                          >
                            <Statistic
                              title={
                                <span
                                  style={{
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: 1,
                                  }}
                                >
                                  ประมาณการต้นทุนรวม
                                </span>
                              }
                              value={
                                (modalState.data.estimate_hour || 0) *
                                costPerHour
                              }
                              valueStyle={{
                                color: "#fff",
                                fontWeight: 900,
                                fontSize: 24,
                                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                              prefix="฿"
                              formatter={(val) => Number(val).toLocaleString()}
                            />
                          </Card>
                        )}
                      </Space>
                    </Flex>

                    {/* Cost Input Section */}
                    <Flex
                      align="center"
                      gap={16}
                      style={{
                        background: "rgba(0,0,0,0.1)",
                        padding: "12px 20px",
                        borderRadius: 16,
                        width: "fit-content",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: 600 }}>
                        กำหนดต้นทุนรายชั่วโมง:
                      </Text>
                      <InputNumber
                        min={0}
                        placeholder="ระบุบาทต่อชั่วโมง"
                        value={costPerHour}
                        onChange={(val) => setCostPerHour(val || 0)}
                        style={{ width: 180 }}
                        prefix="฿"
                        size="large"
                        className="rounded-lg"
                      />
                      <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                        ต่อ 1 Man-Hour
                      </Text>
                    </Flex>
                  </Flex>
                </div>

                {/* Content Section */}
                <div style={{ padding: "0 32px 32px", marginTop: -40 }}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 20,
                      boxShadow: token.boxShadowSecondary,
                      background: token.colorBgElevated,
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    <List
                      dataSource={modalState.data.projectAssignees || []}
                      renderItem={(item) => {
                        const user = getUserById(item.userId);
                        const individualHours =
                          (modalState.data?.estimate_hour || 0) /
                          (modalState.data?.projectAssignees?.length || 1);
                        const individualCost = individualHours * costPerHour;

                        return (
                          <List.Item
                            style={{
                              padding: "16px 24px",
                              borderBottom: `1px solid ${token.colorBorderSecondary}`,
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  size={54}
                                  src={user?.profile_image}
                                  style={{
                                    backgroundColor: token.colorPrimaryBg,
                                    color: token.colorPrimary,
                                    border: `2px solid ${token.colorBgContainer}`,
                                  }}
                                >
                                  {user?.firstname?.[0]}
                                </Avatar>
                              }
                              title={
                                <Flex justify="space-between" align="start">
                                  <Flex vertical style={{ flex: 1 }}>
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 16,
                                        color: token.colorText,
                                      }}
                                    >
                                      {user?.firstname} {user?.lastname}
                                    </Text>
                                    <Tag
                                      color="processing"
                                      bordered={false}
                                      style={{
                                        width: "fit-content",
                                        marginTop: 4,
                                      }}
                                    >
                                      {item.position || "ไม่ระบุตำแหน่ง"}
                                    </Tag>
                                  </Flex>

                                  <Flex gap={12} align="center">
                                    <Tooltip title="สัดส่วนเวลารับผิดชอบรายบุคคล">
                                      <Tag
                                        color="blue"
                                        icon={<ClockCircleOutlined />}
                                        style={{
                                          padding: "4px 12px",
                                          borderRadius: 8,
                                          fontWeight: 600,
                                          marginRight: 0,
                                        }}
                                      >
                                        {individualHours.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 1 }
                                        )}{" "}
                                        ชม.
                                      </Tag>
                                    </Tooltip>

                                    {costPerHour > 0 && (
                                      <Tooltip title="ประมาณการณ์ต้นทุนของสมาชิกท่านนี้">
                                        <Tag
                                          color="success"
                                          style={{
                                            padding: "4px 12px",
                                            borderRadius: 8,
                                            fontWeight: 700,
                                            fontSize: 14,
                                            marginRight: 0,
                                          }}
                                        >
                                          ฿{" "}
                                          {individualCost.toLocaleString(
                                            undefined,
                                            { maximumFractionDigits: 0 }
                                          )}
                                        </Tag>
                                      </Tooltip>
                                    )}
                                  </Flex>
                                </Flex>
                              }
                            />
                          </List.Item>
                        );
                      }}
                      locale={{
                        emptyText: (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="ยังไม่มีข้อมูลทีมงาน"
                            style={{ padding: "40px 0" }}
                          />
                        ),
                      }}
                    />
                  </Card>

                  <Flex justify="center" style={{ marginTop: 24 }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={closeModal}
                      style={{
                        borderRadius: 12,
                        padding: "0 48px",
                        height: 48,
                        fontWeight: 600,
                        boxShadow: token.boxShadow,
                      }}
                    >
                      ตกลง
                    </Button>
                  </Flex>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
