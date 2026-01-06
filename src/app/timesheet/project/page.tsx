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
  Tooltip,
  Skeleton,
} from "antd";
import {
  CheckCircleOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Swal from "sweetalert2";

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

const PASSCODE = "LIGHT";

// ==========================================
// INTERNAL SUB-COMPONENTS (Based on your Liked Layout)
// ==========================================

const HeaderSection = ({
  title,
  subtitle,
  onRefresh,
  onCreate,
  onViewTimeline,
}: any) => (
  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl ">
    <Space size={16}>
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white ">
        <ProjectOutlined style={{ fontSize: 24 }} />
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
    <Space size={12}>
      <Button
        icon={<CalendarOutlined />}
        onClick={onViewTimeline}
        shape="round"
      >
        Timeline
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onRefresh} shape="round">
        รีเฟรช
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        shape="round"
        className="shadow-md"
      >
        เพิ่มโครงการ
      </Button>
    </Space>
  </div>
);

const SummaryCards = ({ stats }: any) => {
  const items = [
    {
      label: "โครงการทั้งหมด",
      value: stats.total,
      color: "#3b82f6",
      icon: <ProjectOutlined />,
      desc: "จำนวนโครงการที่กรอง",
    },
    {
      label: "กำลังดำเนินการ",
      value: stats.active,
      color: "#22c55e",
      icon: <CheckCircleOutlined />,
      desc: "สถานะ Open",
    },
    {
      label: "Sub Projects",
      value: stats.totalSubProjects,
      color: "#f59e0b",
      icon: <BarChartOutlined />,
      desc: "Features ทั้งหมด",
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {items.map((item, idx) => (
        <Col xs={24} md={8} key={idx}>
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0 rounded-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 p-3 opacity-10">
              <span style={{ fontSize: "5rem", color: item.color }}>
                {item.icon}
              </span>
            </div>
            <Flex align="center" gap={16}>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <div>
                <Typography.Text
                  type="secondary"
                  className="block text-xs uppercase font-semibold"
                >
                  {item.label}
                </Typography.Text>
                <Statistic
                  value={item.value}
                  valueStyle={{ fontWeight: 700 }}
                />
                <Typography.Text type="secondary" className="text-xs">
                  {item.desc}
                </Typography.Text>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function ProjectManagementPage() {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id || 0;
  const userRole = userAuth?.response?.data?.user_data?.position;

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

  // Filters State
  const [filters, setFilters] = useState({
    searchText: "",
    statusFilter: "open",
    categoryFilter: "",
    deletedFilter: "false",
  });

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
        !filters.statusFilter || project.status === filters.statusFilter;
      const matchCategory =
        !filters.categoryFilter ||
        String(project.categoryType) === filters.categoryFilter;
      const matchDeleted =
        filters.deletedFilter === "true"
          ? project.is_deleted === true
          : project.is_deleted === false || !project.is_deleted;

      return matchSearch && matchStatus && matchCategory && matchDeleted;
    });
  }, [projects, filters]);

  const stats = useMemo(
    () => ({
      total: filteredProjects.length,
      active: filteredProjects.filter((p) => p.status === "open").length,
      closed: filteredProjects.filter((p) => p.status === "close").length,
      totalSubProjects: filteredProjects.reduce(
        (sum, p) =>
          sum + (p.features?.filter((f) => !f.is_deleted).length || 0),
        0
      ),
    }),
    [filteredProjects]
  );

  // Handlers
  const handleResetFilters = () =>
    setFilters({
      searchText: "",
      statusFilter: "open",
      categoryFilter: "",
      deletedFilter: "false",
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
        <div className=" mx-auto p-6 space-y-6">
          <HeaderSection
            title="จัดการโครงการ"
            subtitle="ระบบบริหารจัดการ Timesheet และความคืบหน้าโครงการ"
            onRefresh={fetchProjects}
            onCreate={() => setModalState({ type: "create" })}
            onViewTimeline={() => router.push("/timesheet/timeline")}
          />

          <SummaryCards stats={stats} />

          {/* Filter Bar Card */}
          <Card className="border-0 shadow-sm rounded-xl mb-6">
            <Flex gap={12} wrap="wrap" align="center">
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="ค้นหาโครงการ..."
                className="flex-1 min-w-[200px] rounded-lg"
                value={filters.searchText}
                onChange={(e) =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
              />
              <Select
                className="w-[160px]"
                value={filters.statusFilter}
                onChange={(v) => setFilters({ ...filters, statusFilter: v })}
                options={[
                  { label: "Open", value: "open" },
                  { label: "Closed", value: "close" },
                ]}
                suffixIcon={<FilterOutlined />}
              />
              <Select
                className="w-[180px]"
                placeholder="ประเภท"
                value={filters.categoryFilter}
                onChange={(v) => setFilters({ ...filters, categoryFilter: v })}
                options={categoryType.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
              />
              <Button
                onClick={handleResetFilters}
                icon={<ReloadOutlined />}
                type="dashed"
                className="rounded-lg"
              >
                ล้างค่า
              </Button>
              <Divider type="vertical" />
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setShowAnalytics(!showAnalytics)}
                type={showAnalytics ? "primary" : "default"}
              >
                {showAnalytics ? "ซ่อนกราฟ" : "วิเคราะห์"}
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() =>
                  exportProjectsToExcel(filteredProjects, getCategoryName)
                }
                ghost
              >
                Export
              </Button>
            </Flex>
          </Card>

          {showAnalytics && (
            <div className="mb-6 animate-in fade-in duration-500">
              <AnalyticsDashboard
                projects={filteredProjects}
                getCategoryName={getCategoryName}
              />
            </div>
          )}

          {/* Main Table Card */}
          <Card
            className="shadow-sm rounded-xl border-0"
            title={
              <Space>
                <ProjectOutlined /> รายการโครงการ
              </Space>
            }
          >
            {loading ? (
              <Skeleton active />
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
                {modalState.type === "edit"
                  ? "แก้ไขโครงการ"
                  : "เพิ่มโครงการใหม่"}
              </Space>
            }
            onCancel={closeModal}
            footer={null}
            width={800}
            centered
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitForm}
              className="mt-4"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="ชื่อโครงการ (TH)"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="ระบุชื่อโครงการ" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="name_en"
                    label="ชื่อโครงการ (EN)"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="English Name" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="categoryType"
                    label="ประเภท"
                    rules={[{ required: true }]}
                  >
                    <Select
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
                    label="สถานะ"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={[
                        { label: "เปิดโครงการ", value: "open" },
                        { label: "ปิดโครงการ", value: "close" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="start_date" label="วันเริ่มโครงการ">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="end_date" label="วันสิ้นสุดโครงการ">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="คำอธิบาย">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Divider />
              <Flex justify="end" gap={8}>
                <Button onClick={closeModal}>ยกเลิก</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  icon={<CheckCircleOutlined />}
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
                <ExclamationCircleOutlined /> ยืนยันการลบโครงการ
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
            }}
            okText="ยืนยันการลบ"
          >
            <Typography.Paragraph>
              หากคุณแน่ใจที่จะลบโครงการ{" "}
              <Typography.Text strong>{modalState.data?.name}</Typography.Text>{" "}
              กรุณาพิมพ์คำว่า{" "}
              <Typography.Text code copyable>
                Delete
              </Typography.Text>
            </Typography.Paragraph>
            <Input
              placeholder="พิมพ์ 'Delete' เพื่อยืนยัน"
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </Modal>

          {/* Detail Modal */}
          <Modal
            title={
              <Space>
                <InfoCircleOutlined className="text-blue-500" />{" "}
                รายละเอียดโครงการ
              </Space>
            }
            open={modalState.type === "detail"}
            onCancel={closeModal}
            footer={<Button onClick={closeModal}>ปิดหน้าต่าง</Button>}
          >
            {modalState.data && (
              <Descriptions column={1} bordered size="small" className="mt-2">
                <Descriptions.Item label="ชื่อโครงการ">
                  {modalState.data.name}
                </Descriptions.Item>
                <Descriptions.Item label="ประเภท">
                  {getCategoryName(String(modalState.data.categoryType))}
                </Descriptions.Item>
                <Descriptions.Item label="สร้างเมื่อ">
                  {convertToThaiDateDDMMYYY(modalState.data.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="ผู้สร้าง">
                  {getUserById(modalState.data.createdBy)?.firstname ??
                    "Unknown"}
                </Descriptions.Item>
                <Descriptions.Item label="คำอธิบาย">
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
