"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  SolutionOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Flex,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import SummaryCard from "@components/card/summary-card";
import DashboardLayout from "@components/layouts/backend-layout";
import StatusModal from "@components/modal/status-modal";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";

import { SubProjectDetailModal } from "./components/sub-project-detail-modal.component";
import { SubProjectFormModal } from "./components/sub-project-form-modal.component";
import type {
  FilterState,
  ModalState,
  PaginationState,
  Project,
  SubProject,
} from "./types/sub-project.types";

const { Title, Text } = Typography;

// ==========================================
// MAIN PAGE
// ==========================================

export default function SubProjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { token } = theme.useToken();
  const projectId = Number(params?.project_id);

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id;

  // --- State Management ---
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [allSubProjects, setAllSubProjects] = useState<SubProject[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    assetType: null,
    statusFilter: null,
  });

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  /**
   * * requestData: ดึงข้อมูลโครงการและฟีเจอร์ย่อยทั้งหมดจาก API
   */
  const requestData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectRes, subProjectRes, statusRes, allProjectsRes] =
        await Promise.all([
          axios.post("/api/v1/timesheet/project/read/", {
            limit: 1,
            page: 1,
            id: projectId,
          }),
          axios.post("/api/v1/timesheet/project/sub-project/read/", {
            limit: 1000,
            page: 1,
            project_id: projectId,
          }),
          axios.post("/api/v1/timesheet/project/status/read/"),
          axios.post("/api/v1/timesheet/project/read/", {
            limit: 1000,
            page: 1,
          }),
        ]);

      if (projectRes.data?.data?.length) {
        setProjectData(projectRes.data.data[0]);
      }

      if (statusRes.data?.status === 200) {
        setProjectStatuses(statusRes.data.data);
      }

      if (allProjectsRes.data?.data) {
        setAllProjects(allProjectsRes.data.data);
      }

      let fetchedSubProjects = subProjectRes.data?.data || [];

      // 🔍 Fetch user details for each assignee
      const allAssigneeIds = Array.from(
        new Set(
          fetchedSubProjects.flatMap(
            (sp: any) => sp.projectAssignees?.map((a: any) => a.userId) || [],
          ),
        ),
      ).filter(Boolean);

      if (allAssigneeIds.length > 0) {
        try {
          const userRes = await axios.get(
            `/api/v1/timesheet/project/sub-project/assignee-search?ids=${allAssigneeIds.join(",")}`,
          );
          if (userRes.data?.status === 200) {
            const userMap = new Map();
            userRes.data.data.forEach((u: any) => userMap.set(u.admin_id, u));

            fetchedSubProjects = fetchedSubProjects.map((sp: any) => ({
              ...sp,
              projectAssignees: sp.projectAssignees?.map((a: any) => ({
                ...a,
                userProfile: userMap.get(a.userId),
              })),
            }));
          }
        } catch (error) {
          console.error("Failed to fetch assignee details:", error);
        }
      }

      setAllSubProjects(fetchedSubProjects);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    requestData();
  }, [requestData]);

  /**
   * * filteredSubProjects: กรองข้อมูลฟีเจอร์ย่อยตามเงื่อนไขค้นหา
   */
  const filteredSubProjects = useMemo(() => {
    let result = [...allSubProjects];

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.name_en?.toLowerCase().includes(searchLower) ||
          item.backlogDescription?.note?.toLowerCase().includes(searchLower),
      );
    }

    if (filters.assetType) {
      result = result.filter(
        (item) => item.assetCaptureType === filters.assetType,
      );
    }

    if (filters.statusFilter) {
      result = result.filter(
        (item) =>
          String(item.status) === String(filters.statusFilter) ||
          String(item.projectStatusId) === String(filters.statusFilter),
      );
    }

    return result;
  }, [allSubProjects, filters]);

  /**
   * * stats: คำนวณสรุปข้อมูลภาพรวมจากข้อมูลดั้งเดิม (ห้ามกรองตามตาราง)
   */
  const stats = useMemo(() => {
    const sortedStatuses = [...projectStatuses].sort(
      (a, b) => a.priority - b.priority,
    );
    const startStatusId = sortedStatuses[0]?.id;
    const endStatusId = sortedStatuses[sortedStatuses.length - 1]?.id;
    const startStatusName = sortedStatuses[0]?.nameTh;
    const endStatusName = sortedStatuses[sortedStatuses.length - 1]?.nameTh;

    const baseStats = allSubProjects.reduce(
      (acc, curr) => {
        const hours = curr.estimate_sub_feature_workhours || 0;
        acc.total++;
        acc.totalHours += hours;

        const isCompleted = endStatusId
          ? curr.projectStatusId === endStatusId
          : curr.status === endStatusName;

        const isStarted = startStatusId
          ? curr.projectStatusId === startStatusId
          : curr.status === startStatusName;

        if (isCompleted) {
          acc.completed++;
        } else if ((curr.projectStatusId || curr.status) && !isStarted) {
          acc.processing++;
        }

        return acc;
      },
      { total: 0, processing: 0, completed: 0, totalHours: 0 },
    );

    const processingPercent =
      baseStats.total > 0
        ? Math.round((baseStats.processing / baseStats.total) * 100)
        : 0;

    // logic 100 - x ตามมาตรฐาน SchoolBright
    const completedPercent = baseStats.total > 0 ? 100 - processingPercent : 0;

    return {
      ...baseStats,
      processingPercent,
      completedPercent,
    };
  }, [allSubProjects, projectStatuses]);

  /**
   * * handleSubmit: ส่งข้อมูลฟีเจอร์ย่อย (สร้าง/แก้ไข) ไปยัง API
   */
  const handleSubmit = async (values: any) => {
    setIsActionLoading(true);
    try {
      const payload = {
        ...values,
        project_id: values.project_id || projectId,
        by: adminId,
      };

      const res = await axios.post(
        "/api/v1/timesheet/project/sub-project/insert",
        payload,
      );

      if (res.data?.status !== 200) throw new Error("Operation failed");

      setStatusModal({
        open: true,
        type: "success",
        title: values.id ? "อัปเดตข้อมูลสำเร็จ" : "สร้างข้อมูลสำเร็จ",
        message: `บันทึกข้อมูล ${values.name} เรียบร้อยแล้ว`,
      });
      await requestData();
      setModalState({ type: null, data: null });
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถบันทึกข้อมูลได้ในขณะนี้",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * * handleDelete: ลบฟีเจอร์ย่อยออกจากระบบ
   */
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
      content: "การลบรายการนี้จะไม่สามารถกู้คืนได้",
      okText: "ใช่, ลบรายการ",
      okType: "danger",
      cancelText: "ยกเลิก",
      centered: true,
      onOk: async () => {
        try {
          const res = await axios.post(
            "/api/v1/timesheet/project/sub-project/delete",
            {
              id,
              by: adminId,
            },
          );

          if (res.data?.status === 200) {
            setStatusModal({
              open: true,
              type: "success",
              title: "ลบข้อมูลสำเร็จ",
              message: "ระบบได้ทำการลบรายการฟีเจอร์ย่อยเรียบร้อยแล้ว",
            });
            await requestData();
          } else {
            throw new Error("Failed to delete");
          }
        } catch (error) {
          setStatusModal({
            open: true,
            type: "error",
            title: "ลบข้อมูลไม่สำเร็จ",
            message: "เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง",
          });
        }
      },
    });
  };

  /**
   * * handleCopyAllFeatures: คัดลอกรายชื่อฟีเจอร์ทั้งหมดลง Clipboard
   */
  const handleCopyAllFeatures = async () => {
    try {
      const projectName =
        projectData?.name || t("sub_project_page.default_title");
      const featureList = filteredSubProjects
        .map((item, index) => {
          const featureName = item.name_en
            ? `${item.name} (${item.name_en})`
            : item.name;
          return `${index + 1}. ${featureName}`;
        })
        .join("\n");
      const textToCopy = `${projectName}\n${featureList}\n\n---------------------------------------`;
      await navigator.clipboard.writeText(textToCopy);
      toast.success(t("sub_project_page.copy_all_success"));
    } catch (error) {
      toast.error(t("sub_project_page.copy_error"));
    }
  };

  // --- Table Columns Configuration ---
  const columns: ColumnsType<SubProject> = [
    {
      title: "สถานะงาน",
      key: "status_tracker",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2} className="w-full">
          <Tag
            color={
              record.projectStatus?.priority === 99 ? "error" : "processing"
            }
            bordered={false}
            style={{ fontWeight: 600, fontSize: 11 }}
          >
            {record.projectStatus?.nameTh || record.status || "Ready"}
          </Tag>
          <Text type="secondary" style={{ fontSize: 10 }}>
            {record.startDate
              ? dayjs(record.startDate).format("DD/MM/YYYY")
              : "-"}
          </Text>
        </Space>
      ),
      sorter: (a, b) =>
        (a.projectStatus?.priority || 0) - (b.projectStatus?.priority || 0),
    },
    {
      title: "ชื่อฟีเจอร์ / งานย่อย",
      key: "name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontWeight: 600 }}>
            {record.name}
          </Text>
          {record.name_en && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.name_en}
            </Text>
          )}
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "ประเภทสินทรัพย์",
      dataIndex: "assetCaptureType",
      key: "assetCaptureType",
      width: 150,
      align: "center",
      render: (type) => (
        <Tag
          color={type === "CAPTUREABLE" ? "success" : "default"}
          bordered={false}
          style={{ fontWeight: 600 }}
        >
          {type === "CAPTUREABLE"
            ? "Capitalization ทรัพย์สิน"
            : "Expense รายจ่าย"}
        </Tag>
      ),
      sorter: (a, b) =>
        (a.assetCaptureType || "").localeCompare(b.assetCaptureType || ""),
    },
    {
      title: "พนักงานที่รับผิดชอบ",
      key: "assignees",
      width: 180,
      render: (_, record) => (
        <Avatar.Group
          size="small"
          max={{
            count: 3,
            style: {
              color: "#f56a00",
              backgroundColor: "#fde3cf",
              cursor: "pointer",
            },
          }}
        >
          {record.projectAssignees?.map((a) => {
            const profile = (a as any).userProfile;
            const displayName = profile
              ? `${profile.firstname} ${profile.lastname}${profile.nickname ? ` (${profile.nickname})` : ""}`
              : `User ID: ${a.userId}`;
            const displayPosition = profile?.position || a.position || "";

            return (
              <Tooltip
                title={
                  <div style={{ textAlign: "center" }}>
                    <Text strong style={{ color: "white" }}>
                      {displayName}
                    </Text>
                    {displayPosition && (
                      <div
                        style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}
                      >
                        {displayPosition}
                      </div>
                    )}
                  </div>
                }
                key={a.id}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                  src={profile?.profile_image_path}
                />
              </Tooltip>
            );
          })}
        </Avatar.Group>
      ),
    },
    {
      title: "ชั่วโมงประมาณการ",
      dataIndex: "estimate_sub_feature_workhours",
      key: "estimate_sub_feature_workhours",
      width: 150,
      align: "right",
      render: (hours) => (
        <Text strong style={{ color: token.colorInfoText }}>
          {hours || 0} ชม.
        </Text>
      ),
      sorter: (a, b) =>
        (a.estimate_sub_feature_workhours || 0) -
        (b.estimate_sub_feature_workhours || 0),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "detail",
                label: "ดูรายละเอียด",
                icon: <InfoCircleOutlined />,
                onClick: () => setModalState({ type: "detail", data: record }),
              },
              {
                key: "edit",
                label: "แก้ไขข้อมูล",
                icon: <EditOutlined />,
                onClick: () => setModalState({ type: "edit", data: record }),
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                label: "ลบรายการ",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto p-2 md:p-6 space-y-6">
        {/* ส่วนที่ 1: หัวข้อหน้าเว็ป */}
        <HeaderBar
          icon={<ProjectOutlined />}
          title={projectData?.name || t("sub_project_page.default_title")}
          subTitle={t("sub_project_page.subtitle")}
          showBackButton={true}
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={requestData}
                style={{ fontWeight: 600 }}
              >
                รีเฟรชข้อมูล
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalState({ type: "create", data: null })}
                style={{ fontWeight: 600 }}
              >
                เพิ่มฟีเจอร์ใหม่
              </Button>
            </Space>
          }
        />

        {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={t("sub_project_page.stat_total")}
              value={stats.total}
              subtitle="จำนวนงานทั้งหมดในโครงการนี้"
              icon={<FileTextOutlined />}
              color="#3b82f6"
              percent={100}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={t("sub_project_page.stat_processing")}
              value={stats.processing}
              subtitle={`ก้าวหน้า ${stats.processingPercent}%`}
              icon={<SyncOutlined />}
              color="#f59e0b"
              percent={stats.processingPercent}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={t("sub_project_page.stat_completed")}
              value={stats.completed}
              subtitle={`ก้าวหน้า ${stats.completedPercent}%`}
              icon={<CheckCircleOutlined />}
              color="#22c55e"
              percent={stats.completedPercent}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={t("sub_project_page.stat_total_hours")}
              value={stats.totalHours}
              subtitle="ชั่วโมงทำงานโดยประมาณ"
              icon={<ClockCircleOutlined />}
              color="#8b5cf6"
              percent={100}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ตัวกรองข้อมูล (Filter Section) */}
        <Card
          variant="borderless"
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Flex align="center" gap={8} className="mb-6">
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              ตัวกรอง
            </Title>
          </Flex>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <Text
                strong
                style={{ fontSize: 13, display: "block", marginBottom: 8 }}
              >
                ค้นหาฟีเจอร์ / รายละเอียด
              </Text>
              <Input
                placeholder="ค้นหาด้วยชื่อไทย, อังกฤษ หรือ รายละเอียด..."
                prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                value={filters.searchText}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: e.target.value,
                  }))
                }
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <Text
                strong
                style={{ fontSize: 13, display: "block", marginBottom: 8 }}
              >
                ประเภทงบประมาณ
              </Text>
              <Select
                className="w-full"
                placeholder="เลือกประเภทงบ..."
                value={filters.assetType}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, assetType: val }))
                }
                allowClear
                options={[
                  { value: "CAPTUREABLE", label: "Capitalization ทรัพย์สิน" },
                  { value: "UN_CAPTUREABLE", label: "Expense รายจ่าย" },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text
                strong
                style={{ fontSize: 13, display: "block", marginBottom: 8 }}
              >
                สถานะงาน
              </Text>
              <Select
                className="w-full"
                placeholder="เลือกสถานะงาน..."
                value={filters.statusFilter}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, statusFilter: val }))
                }
                allowClear
                options={projectStatuses.map((s) => ({
                  label: s.nameTh,
                  value: s.id,
                }))}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <Flex justify="end" gap={12}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                setFilters({
                  searchText: "",
                  assetType: null,
                  statusFilter: null,
                })
              }
              style={{ fontWeight: 600 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ fontWeight: 600, padding: "0 32px" }}
              onClick={requestData}
            >
              ค้นหาข้อมูล
            </Button>
          </Flex>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex justify="space-between" align="center" className="mb-4">
            <Space size={12}>
              <SolutionOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                {t("sub_project_page.table_title")}
              </Title>
              <Badge
                count={filteredSubProjects.length}
                style={{
                  backgroundColor: token.colorPrimaryBg,
                  color: token.colorPrimary,
                }}
              />
            </Space>

            <Tooltip title={t("sub_project_page.copy_all_tooltip")}>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyAllFeatures}
                disabled={filteredSubProjects.length === 0}
                style={{ fontWeight: 600 }}
              >
                คัดลอกรายชื่อทั้งหมด
              </Button>
            </Tooltip>
          </Flex>

          <Table<SubProject>
            columns={columns}
            dataSource={filteredSubProjects}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredSubProjects.length,
              onChange: (page, pageSize) =>
                setPagination({
                  current: page,
                  pageSize,
                  total: filteredSubProjects.length,
                }),
              showSizeChanger: true,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Modals Logic */}
        <SubProjectFormModal
          open={modalState.type === "create" || modalState.type === "edit"}
          mode={modalState.type === "create" ? "create" : "edit"}
          data={modalState.data}
          loading={isActionLoading}
          onSubmit={handleSubmit}
          statuses={projectStatuses}
          allProjects={allProjects}
          onCancel={() => setModalState({ type: null, data: null })}
        />

        <SubProjectDetailModal
          open={modalState.type === "detail"}
          data={modalState.data}
          onClose={() => setModalState({ type: null, data: null })}
        />

        <StatusModal
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        />
      </div>
    </DashboardLayout>
  );
}
