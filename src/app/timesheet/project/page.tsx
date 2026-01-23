"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  AuditOutlined,
  CloseOutlined,
  FileTextOutlined,
  SendOutlined,
  CompassOutlined,
  FormatPainterOutlined,
  CodeOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  CloudUploadOutlined,
  LaptopOutlined,
  ExperimentOutlined,
  HighlightOutlined,
  FilterOutlined,
  DatabaseOutlined,
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
import {
  ProjectTable,
  StatusTracker,
} from "./components/project-table.component";
import { AnalyticsDashboard } from "./components/analytics-dashboard.component";
import { ProjectStatusModal } from "./components/project-status-modal.component";
import { useProjectData } from "./hooks/use-project-data";
import { exportProjectsToExcel } from "./utils/export-excel";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";
import type {
  ModalState,
  FormValues,
  Project,
  ProjectStatus,
} from "./types/project.types";

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
  allStatuses,
  onProjectStatusChange,
}: {
  projects: Project[];
  loading: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onViewDetail: (p: Project) => void;
  token: any;
  allStatuses: ProjectStatus[];
  onProjectStatusChange: (
    projectId: number,
    newStatusId: number | null,
  ) => void;
}) => {
  const [draggingProjectId, setDraggingProjectId] = useState<number | null>(
    null,
  );
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggingProjectId(projectId);
    e.dataTransfer.setData("projectId", String(projectId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingProjectId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const projectId = Number(e.dataTransfer.getData("projectId"));
    const statusId = columnId === "unspecified" ? null : Number(columnId);
    setDragOverColumnId(null);
    onProjectStatusChange(projectId, statusId);
  };

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
    const statusGroups = new Map<number | "null", Project[]>();
    projects.forEach((p) => {
      const key = p.projectStatusId || "null";
      if (!statusGroups.has(key)) statusGroups.set(key, []);
      statusGroups.get(key)?.push(p);
    });

    const result = [];
    const sortedMasterStatuses = [...allStatuses].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0),
    );

    result.push({
      id: "unspecified",
      title: "ยังไม่ระบุ",
      items: statusGroups.get("null") || [],
      color: token.colorTextDescription,
    });
    statusGroups.delete("null");

    sortedMasterStatuses.forEach((status) => {
      result.push({
        id: String(status.id),
        title: status.nameTh,
        items: statusGroups.get(status.id) || [],
        color: status.priority === 99 ? token.colorError : token.colorPrimary,
      });
      statusGroups.delete(status.id);
    });

    statusGroups.forEach((items, key) => {
      result.push({
        id: String(key),
        title: `Unknown (${key})`,
        items,
        color: token.colorTextDescription,
      });
    });

    return result;
  }, [projects, allStatuses, token]);

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1000px]">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-1 min-w-[300px] flex flex-col gap-4 p-4 rounded-xl border transition-all duration-200"
            style={{
              background:
                dragOverColumnId === col.id
                  ? token.colorFillSecondary
                  : token.colorFillQuaternary,
              borderColor:
                dragOverColumnId === col.id
                  ? token.colorPrimary
                  : token.colorBorderSecondary,
              borderStyle: dragOverColumnId === col.id ? "dashed" : "solid",
            }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <Text strong style={{ fontSize: 16 }}>
                {col.title}
              </Text>
              <Tag color={col.id === "unspecified" ? "default" : "blue"}>
                {col.items.length}
              </Tag>
            </div>

            <div className="flex flex-col gap-3">
              {col.items.map((item: Project) => {
                const health = getHealthStatus(item);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className="transition-transform active:scale-95"
                  >
                    <Card
                      hoverable
                      size="small"
                      className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all border-l-4 ${
                        draggingProjectId === item.id
                          ? "opacity-30"
                          : "opacity-100"
                      }`}
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
                          style={{
                            background: token.colorFillQuaternary,
                            color: token.colorTextSecondary,
                          }}
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
                            {getUserById(item.createdBy)?.firstname ||
                              "ไม่ระบุ"}
                          </Text>
                        </Space>
                        <Avatar.Group max={{ count: 2 }} size="small">
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
                  </div>
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
// 2. HELPER FUNCTIONS & STATISTICS COMPONENTS
// ==========================================

const getSdlcStyle = (priority: number, nameTh: string, token: any) => {
  const name = nameTh.toLowerCase();
  if (
    name.includes("requirement") ||
    name.includes("ความต้องการ") ||
    priority === 1
  ) {
    return {
      color: token.colorInfo,
      bg: token.colorInfoBg,
      icon: <CompassOutlined />,
    };
  }
  if (name.includes("design") || name.includes("ออกแบบ") || priority === 2) {
    return {
      color: "#722ed1",
      bg: "#f9f0ff",
      icon: <FormatPainterOutlined />,
    };
  }
  if (
    name.includes("develop") ||
    name.includes("coding") ||
    name.includes("พัฒนา") ||
    priority === 3
  ) {
    return {
      color: "#13c2c2",
      bg: "#e6fffb",
      icon: <CodeOutlined />,
    };
  }
  if (
    name.includes("test") ||
    name.includes("qa") ||
    name.includes("ทดสอบ") ||
    priority === 4
  ) {
    return {
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <BugOutlined />,
    };
  }
  if (name.includes("uat") || priority === 5) {
    return {
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <SafetyCertificateOutlined />,
    };
  }
  if (
    name.includes("deploy") ||
    name.includes("release") ||
    name.includes("ส่งมอบ") ||
    priority >= 6
  ) {
    return {
      color: token.colorError,
      bg: token.colorErrorBg,
      icon: <CloudUploadOutlined />,
    };
  }
  return {
    color: token.colorPrimary,
    bg: token.colorPrimaryBg,
    icon: <RocketOutlined />,
  };
};

const getCategoryStyle = (id: string, token: any) => {
  switch (id) {
    case "INTERNAL":
      return {
        color: token.colorPrimary,
        bg: token.colorPrimaryBg,
        icon: <ApartmentOutlined />,
      };
    case "EXTERNAL":
      return {
        color: token.colorSuccess,
        bg: token.colorSuccessBg,
        icon: <GlobalOutlined />,
      };
    case "MAINTENANCE":
      return {
        color: token.colorWarning,
        bg: token.colorWarningBg,
        icon: <ToolOutlined />,
      };
    case "LEAVE":
      return { color: "#eb2f96", bg: "#fff0f6", icon: <MedicineBoxOutlined /> };
    default:
      return {
        color: token.colorTextSecondary,
        bg: token.colorFillTertiary,
        icon: <AppstoreOutlined />,
      };
  }
};

const SdlcStatsSection = ({
  stats,
  statuses,
  token,
}: {
  stats: any;
  statuses: any[];
  token: any;
}) => {
  if (!stats?.trackings) return null;

  const sortedActive = [...statuses]
    .filter((s) => s.priority < 99)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const total = stats.health?.total || 1;

  return (
    <div className="mb-8">
      <Flex align="center" gap={8} className="mb-4">
        <RocketOutlined style={{ color: token.colorPrimary }} />
        <Text strong style={{ fontSize: 16 }}>
          สถานะการดำเนินการ (Trackings)
        </Text>
      </Flex>
      <Row gutter={[16, 16]}>
        {sortedActive.map((s) => {
          const count = (s.nameEn ? stats.trackings[s.nameEn] : 0) || 0;
          const percent = (count / total) * 100;
          const style = getSdlcStyle(s.priority, s.nameTh, token);

          return (
            <Col xs={12} sm={8} md={6} lg={4} key={s.id}>
              <SummaryCard
                title={s.nameTh}
                value={count}
                suffix={`/ ${total}`}
                percent={percent}
                icon={style.icon}
                color={style.color}
                iconBg={style.bg}
                tooltip={`จำนวนโครงการที่อยู่ในสถานะ ${s.nameTh}`}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

const CategoryStatsSection = ({ stats, token }: { stats: any; token: any }) => {
  if (!stats?.by_category) return null;

  const total = stats.health?.total || 1;

  return (
    <div className="mb-8">
      <Flex align="center" gap={8} className="mb-4">
        <AppstoreOutlined style={{ color: token.colorPrimary }} />
        <Text strong style={{ fontSize: 16 }}>
          แยกตามประเภท (By Category)
        </Text>
      </Flex>
      <Row gutter={[16, 16]}>
        {categoryType.map((cat) => {
          const count = stats.by_category[cat.id] || 0;
          const percent = (count / total) * 100;
          const style = getCategoryStyle(cat.id, token);

          return (
            <Col xs={12} sm={8} md={6} lg={4} key={cat.id}>
              <SummaryCard
                title={cat.name}
                value={count}
                suffix={`/ ${total}`}
                percent={percent}
                icon={style.icon}
                color={style.color}
                iconBg={style.bg}
                tooltip={`จำนวนโครงการประเภท ${cat.name}`}
              />
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
    statuses,
    stats: backendStats,
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
    isDeletedFilter: "ACTIVE" as "ALL" | "ACTIVE" | "DELETED",
  });

  // Initial Setting
  useEffect(() => {
    const u = getUserData();
    if (u) setUsers(u);
  }, []);

  // Set form values when modal opens
  useEffect(() => {
    if (modalState.type === "edit" && modalState.data) {
      form.setFieldsValue({
        ...modalState.data,
        start_date: modalState.data.start_date
          ? dayjs(modalState.data.start_date)
          : undefined,
        end_date: modalState.data.end_date
          ? dayjs(modalState.data.end_date)
          : undefined,
        assignees: modalState.data.projectAssignees?.map((a) => ({
          userId: a.userId,
          position: a.position,
        })),
      });
    } else if (modalState.type === "create") {
      form.resetFields();
    }
  }, [modalState.type, modalState.data, form]);

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
          s?.toLowerCase().includes(filters.searchText.toLowerCase()),
        );
      const matchStatus =
        filters.statusFilter === "ALL" ||
        project.status === filters.statusFilter;
      const matchCategory =
        filters.categoryFilter === "ALL" ||
        String(project.categoryType) === filters.categoryFilter;

      const matchDeleted =
        filters.isDeletedFilter === "ALL" ||
        (filters.isDeletedFilter === "ACTIVE" && !project.is_deleted) ||
        (filters.isDeletedFilter === "DELETED" && project.is_deleted);

      return matchSearch && matchStatus && matchCategory && matchDeleted;
    });
  }, [projects, filters]);

  const positionOptions = useMemo(() => {
    const defaultPositions = [
      "Project Manager",
      "Full-stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "QA / Tester",
      "UI/UX Designer",
      "System Analyst",
      "Head of Technology",
      "Chief Technology Officer",
      "DevOps Engineer",
      "Mobile Developer",
      "Data Engineer",
    ];
    const positions = new Set<string>(defaultPositions);
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
      isDeletedFilter: "ACTIVE",
    });

  const closeModal = () => {
    setModalState({ type: "", data: null });
    setConfirmDeleteText("");
  };

  const openEditModal = (record: Project) => {
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

  const handleProjectStatusChange = async (
    projectId: number,
    newStatusId: number | null,
  ) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // หากสถานะเดิมกับสถานะใหม่เหมือนกัน ไม่ต้องทำอะไร
    if (project.projectStatusId === newStatusId) return;

    setActionLoading(true);
    try {
      const statusName =
        newStatusId === null
          ? "open"
          : statuses.find((s) => s.id === newStatusId)?.nameTh ||
            project.status;

      const success = await updateProject(projectId, {
        ...project,
        projectStatusId: newStatusId,
        status: statusName,
        start_date: project.start_date,
        end_date: project.end_date,
      });

      if (success) {
        toast.success(`ย้ายโครงการไปสู้สถานะ "${statusName}" เรียบร้อย`);
        fetchProjects();
      }
    } catch (error) {
      toast.error("ไม่สามารถเปลี่ยนสถานะโครงการได้");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PermissionLayout role={["ADMIN", "TIMESHEET_VIEW"]}>
      <DashboardLayout>
        {/* ส่วนที่ 1: ส่วนหัวของหน้าจอ */}
        <HeaderBar
          title="โครงการทั้งหมด"
          subTitle="จัดการและติดตามสถานะความคืบหน้าของโครงการทั้งหมดในระบบ"
          icon={<ProjectOutlined />}
          extra={
            <Space size={12} wrap>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => setStatusModalOpen(true)}
                size="large"
                className="rounded-xl border-dashed"
                style={{
                  color: token.colorPrimary,
                  borderColor: token.colorPrimary,
                }}
              >
                เพิ่มสถานะ
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => router.push("/timesheet/timeline")}
                size="large"
                className="rounded-xl"
              >
                ไทม์ไลน์
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchProjects}
                size="large"
                className="rounded-xl"
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalState({ type: "create" })}
                size="large"
                className="rounded-xl"
                style={{ fontWeight: 600 }}
              >
                เพิ่มโครงการ
              </Button>
            </Space>
          }
        />

        {/* ส่วนที่ 2: ส่วนสรุปข้อมูล (Summary Cards) - ใช้ข้อมูลดั้งเดิมจาก API */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} md={6}>
            <SummaryCard
              title="โครงการทั้งหมด"
              value={backendStats?.health?.total || 0}
              subtitle="รวมโครงการทุกสถานะ"
              icon={<ProjectOutlined />}
              color={token.colorPrimary}
              percent={100}
              isLoading={loading && !backendStats}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard
              title="กำลังดำเนินการ"
              value={backendStats?.health?.open || 0}
              subtitle="โครงการที่ยังไม่ปิด"
              icon={<ReloadOutlined />}
              color={token.colorInfo}
              percent={
                backendStats?.health?.total > 0
                  ? (backendStats.health.open / backendStats.health.total) * 100
                  : 0
              }
              isLoading={loading && !backendStats}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard
              title="เสร็จสิ้นแล้ว"
              value={backendStats?.health?.close || 0}
              subtitle="โครงการที่ส่งมอบแล้ว"
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              percent={
                backendStats?.health?.total > 0
                  ? (backendStats.health.close / backendStats.health.total) *
                    100
                  : 0
              }
              isLoading={loading && !backendStats}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard
              title="อัตราความสำเร็จ"
              value={
                backendStats?.health?.total > 0
                  ? `${((Number(backendStats?.health?.close || 0) / backendStats.health.total) * 100).toFixed(1)}%`
                  : "0%"
              }
              subtitle="เปอร์เซ็นต์โครงการที่เสร็จ"
              icon={<PieChartOutlined />}
              color={token.colorWarning}
              percent={
                backendStats?.health?.total > 0
                  ? (Number(backendStats?.health?.close || 0) /
                      backendStats.health.total) *
                    100
                  : 0
              }
              isLoading={loading && !backendStats}
            />
          </Col>
        </Row>

        {/* ส่วน Statistics Sections ที่เพิ่มเข้ามาใหม่ (Trackings & Categories) */}
        <SdlcStatsSection
          stats={backendStats}
          statuses={statuses}
          token={token}
        />
        <CategoryStatsSection stats={backendStats} token={token} />

        <div className="space-y-6">
          {/* ส่วนที่ 3: ฟิลเตอร์ข้อมูล (Filter Bar) - แบ่งสัดส่วน 2 column ใน 1 row */}
          <Card
            bordered={false}
            styles={{ body: { padding: 24 } }}
            style={{
              borderRadius: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Flex align="center" gap={8} className="mb-6">
              <FilterOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: 16 }}>
                ตัวกรองข้อมูล
              </Text>
            </Flex>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Flex vertical gap={8}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    ค้นหาโครงการ
                  </Text>
                  <Input
                    prefix={
                      <SearchOutlined style={{ color: token.colorPrimary }} />
                    }
                    placeholder="ชื่อโครงการ, รหัสโครงการ หรือรายละเอียด..."
                    size="large"
                    className="rounded-lg"
                    value={filters.searchText}
                    onChange={(e) =>
                      setFilters({ ...filters, searchText: e.target.value })
                    }
                    allowClear
                  />
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Flex vertical gap={8}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    ประเภทโครงการ
                  </Text>
                  <Select
                    size="large"
                    className="w-full"
                    placeholder="ระบุประเภท"
                    value={filters.categoryFilter}
                    onChange={(v) =>
                      setFilters({ ...filters, categoryFilter: v })
                    }
                    options={[
                      { label: "โครงการทั้งหมด", value: "ALL" },
                      ...categoryType.map((c: any) => ({
                        label: c.name,
                        value: String(c.id),
                      })),
                    ]}
                  />
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Flex vertical gap={8}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    สถานะโครงการ
                  </Text>
                  <Select
                    size="large"
                    className="w-full"
                    placeholder="ระบุสถานะ"
                    value={filters.statusFilter}
                    onChange={(v) =>
                      setFilters({ ...filters, statusFilter: v })
                    }
                    options={[
                      { label: "ทุกสถานะ", value: "ALL" },
                      { label: "เปิดโครงการ (Open)", value: "open" },
                      { label: "ปิดโครงการ (Close)", value: "close" },
                      ...Array.from(new Set(projects.map((p: any) => p.status)))
                        .filter((s) => s && s !== "open" && s !== "close")
                        .map((s) => ({
                          label: s,
                          value: s,
                        })),
                    ]}
                  />
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Flex vertical gap={8}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    สถานะการใช้งาน
                  </Text>
                  <Select
                    size="large"
                    className="w-full"
                    placeholder="สถานะการลบ"
                    value={filters.isDeletedFilter}
                    onChange={(v) =>
                      setFilters({ ...filters, isDeletedFilter: v })
                    }
                    options={[
                      { label: "ใช้งานอยู่ (Active)", value: "ACTIVE" },
                      { label: "รายการที่ลบ (Deleted)", value: "DELETED" },
                      { label: "แสดงทั้งหมด (All)", value: "ALL" },
                    ]}
                  />
                </Flex>
              </Col>
            </Row>

            <Flex justify="flex-end" gap={12} className="mt-8">
              <Button
                onClick={handleResetFilters}
                icon={<ReloadOutlined />}
                size="large"
                className="rounded-lg"
              >
                ล้างค่าตัวกรอง
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                className="rounded-lg"
                style={{ fontWeight: 600 }}
                onClick={() => {
                  toast.success("กรองข้อมูลเรียบร้อยแล้ว");
                }}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Card>

          {showAnalytics && (
            <div className="mb-6">
              <AnalyticsDashboard
                projects={filteredProjects}
                getCategoryName={getCategoryName}
              />
            </div>
          )}

          {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
          <Card
            bordered={false}
            styles={{ body: { padding: 16 } }}
            style={{
              borderRadius: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
              marginBottom: 24,
            }}
            title={
              <Space>
                <DatabaseOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 18 }}>
                  รายการผลการค้นหาโครงการ ({filteredProjects.length})
                </Text>
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() =>
                    exportProjectsToExcel(filteredProjects, getCategoryName)
                  }
                  size="middle"
                  className="rounded-lg"
                  style={{
                    color: token.colorSuccess,
                    borderColor: token.colorSuccess,
                  }}
                >
                  ส่งออก Excel
                </Button>
                <Segmented
                  options={[
                    {
                      value: "table",
                      icon: <BarsOutlined />,
                      label: "ตาราง",
                    },
                    {
                      value: "kanban",
                      icon: <AppstoreOutlined />,
                      label: "บอร์ดงาน",
                    },
                  ]}
                  value={viewMode}
                  onChange={setViewMode as any}
                  className="rounded-lg"
                />
              </Space>
            }
          >
            {viewMode === "table" ? (
              loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
              ) : (
                <ProjectTable
                  projects={filteredProjects}
                  statuses={statuses}
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
                  onShowTracking={(record) =>
                    setModalState({ type: "tracking", data: record })
                  }
                />
              )
            ) : (
              <KanbanBoard
                projects={filteredProjects}
                loading={loading}
                token={token}
                allStatuses={statuses || []}
                onEdit={openEditModal}
                onDelete={(item: Project) =>
                  setModalState({ type: "delete", data: item })
                }
                onViewDetail={(item: Project) =>
                  setModalState({ type: "detail", data: item })
                }
                onProjectStatusChange={handleProjectStatusChange}
              />
            )}
          </Card>
        </div>
      </DashboardLayout>

      {/* Tracking Modal */}
      <Modal
        open={modalState.type === "tracking"}
        onCancel={closeModal}
        footer={null}
        centered
        width={500}
        title={
          <Space>
            <RocketOutlined className="text-blue-500" />
            <Text strong style={{ fontSize: 18 }}>
              ติดตามสถานะความคืบหน้า (Delivery Tracking)
            </Text>
          </Space>
        }
        styles={{ content: { borderRadius: 20 } }}
      >
        {modalState.data && (
          <div className="py-6 px-4">
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Text type="secondary" style={{ fontSize: 12 }}>
                โครงการ:
              </Text>
              <br />
              <Text strong style={{ fontSize: 16 }}>
                {modalState.data.name}
              </Text>
            </div>
            <StatusTracker
              currentStatus={modalState.data.status}
              allStatuses={statuses || []}
              token={token}
              direction="vertical"
            />
          </div>
        )}
      </Modal>

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
                rules={[{ required: true, message: "กรุณาระบุชื่อโครงการ" }]}
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
                rules={[{ required: true, message: "กรุณาระบุชื่อภาษาอังกฤษ" }]}
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
                  options={categoryType.map((c: any) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="projectStatusId"
                label="สถานะโครงการ (SDLC Step)"
                rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
              >
                <Select
                  className="rounded-lg"
                  placeholder="เลือกขั้นตอนหลัก (SDLC)"
                  allowClear
                  onChange={(val) => {
                    const selectedStatus = statuses.find((s) => s.id === val);
                    if (selectedStatus) {
                      form.setFieldsValue({
                        status: selectedStatus.nameTh,
                      });
                    } else {
                      form.setFieldsValue({ status: "open" });
                    }
                  }}
                  options={[
                    ...(statuses || [])
                      .sort((a: any, b: any) => a.priority - b.priority)
                      .map((s: any) => ({
                        label: (
                          <Tag color="blue">
                            Step {s.priority}: {s.nameTh}
                          </Tag>
                        ),
                        value: s.id,
                      })),
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
                  <Row key={key} gutter={12} align="middle" className="mb-2">
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, "userId"]}
                        rules={[
                          { required: true, message: "ระบุผู้รับผิดชอบ" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const assignees =
                                getFieldValue("assignees") || [];
                              const duplicates = assignees.filter(
                                (a: any) =>
                                  a?.userId === value && value !== undefined,
                              );
                              if (duplicates.length > 1) {
                                return Promise.reject(
                                  new Error("ชื่อผู้ใช้ซ้ำกัน!"),
                                );
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                        className="mb-0"
                      >
                        <Select
                          placeholder="เลือกผู้รับผิดชอบ (ค้นหาชื่อ/ชื่อเล่น)"
                          showSearch
                          disabled={modalState.type === "edit"}
                          filterOption={(input, option) => {
                            const label = (option?.label ?? "").toLowerCase();
                            const searchStr = input.toLowerCase();
                            return label.includes(searchStr);
                          }}
                          onChange={(userId) => {
                            const user = users.find(
                              (u) => u.admin_id === userId,
                            );
                            if (user?.position) {
                              const currentAssignees =
                                form.getFieldValue("assignees");
                              currentAssignees[name].position = user.position;
                              form.setFieldsValue({
                                assignees: currentAssignees,
                              });
                            }
                          }}
                          options={users.map((u: any) => ({
                            label: `${u.firstname} ${u.lastname}${
                              u.nickname ? ` (${u.nickname})` : ""
                            }`,
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
                          disabled={modalState.type === "edit"}
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
                      {modalState.type !== "edit" && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: "red", fontSize: 18 }}
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  {modalState.type === "edit" ? (
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <InfoCircleOutlined className="mr-1" />{" "}
                        ทีมงานผู้รับผิดชอบไม่สามารถแก้ไขได้ในหน้านี้
                      </Text>
                    </div>
                  ) : (
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      เพิ่มผู้รับผิดชอบ
                    </Button>
                  )}
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Flex justify="end" gap={12}>
            <Button onClick={closeModal} size="large" className="rounded-lg">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionLoading}
              icon={<CheckCircleOutlined />}
              size="large"
              className="rounded-lg"
              style={{ fontWeight: 600 }}
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
                      {getCategoryName(String(modalState.data.categoryType))}
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
                    className="h-full rounded-2xl border-l-4 border-l-blue-500"
                    styles={{ body: { padding: 20 } }}
                  >
                    <Statistic
                      title={
                        <Space className="text-sm font-medium text-gray-400">
                          <CalendarOutlined /> ระยะเวลาโครงการ
                        </Space>
                      }
                      value={convertToThaiDateDDMMYYY(
                        modalState.data.start_date,
                      )}
                      valueStyle={{ fontSize: 16, fontWeight: 700 }}
                      formatter={(val) => (
                        <div className="flex flex-col gap-1 mt-1">
                          <span>{val}</span>
                          <span className="text-xs text-gray-400">
                            ถึง{" "}
                            {convertToThaiDateDDMMYYY(
                              modalState?.data?.end_date,
                            )}
                          </span>
                        </div>
                      )}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    className="h-full rounded-2xl border-l-4 border-l-orange-500"
                    styles={{ body: { padding: 20 } }}
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
                    className="h-full rounded-2xl border-l-4 border-l-green-500"
                    styles={{ body: { padding: 20 } }}
                  >
                    <Statistic
                      title={
                        <Space className="text-sm font-medium text-gray-400">
                          <AppstoreOutlined /> ฟีเจอร์ย่อย
                        </Space>
                      }
                      value={
                        modalState.data.features?.filter((f) => !f.is_deleted)
                          .length || 0
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
                      className="h-full rounded-2xl border-l-4 border-l-purple-500"
                      styles={{ body: { padding: 20 } }}
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
                              modalState.data.createdAt,
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
                      className="rounded-2xl"
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
                    className="rounded-2xl mt-5"
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
                          (f) => !f.is_deleted,
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
                                {item.status === "open" ? "Active" : "Closed"}
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
                    className="rounded-2xl h-full"
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
                      <TeamOutlined style={{ color: "white", fontSize: 24 }} />
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
                            (modalState.data.estimate_hour || 0) * costPerHour
                          }
                          valueStyle={{
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: 24,
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
                  boxShadow: "none",
                  background: token.colorBgElevated,
                }}
                styles={{ body: { padding: 0 } }}
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
                                    {individualHours.toLocaleString(undefined, {
                                      maximumFractionDigits: 1,
                                    })}{" "}
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
                                        { maximumFractionDigits: 0 },
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
                    boxShadow: "none",
                  }}
                >
                  ตกลง
                </Button>
              </Flex>
            </div>
          </div>
        )}
      </Modal>
    </PermissionLayout>
  );
}
