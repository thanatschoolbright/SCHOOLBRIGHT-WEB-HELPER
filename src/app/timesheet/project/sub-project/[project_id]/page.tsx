"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  Col,
  Row,
  Typography,
  Space,
  Flex,
  Statistic,
  Divider,
  Tooltip,
  Skeleton,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  FileTextOutlined,
  PlusOutlined,
  ProjectOutlined,
  SyncOutlined,
  ReloadOutlined,
  SolutionOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import { useAppSelector } from "@stores/store";

import { SubProjectTable } from "./components/sub-project-table.component";
import { SubProjectFormModal } from "./components/sub-project-form-modal.component";
import { SubProjectDetailModal } from "./components/sub-project-detail-modal.component";
import { FilterBar } from "./components/filter-bar.component";
import { useSubProjectData } from "./hooks/use-sub-project.data";
import type { ModalState } from "./types/sub-project.types";

const { Title, Text } = Typography;

// ==========================================
// SUB-COMPONENTS (Layout Style Liked)
// ==========================================

const HeaderSection = ({
  title,
  subtitle,
  onBack,
  onCreate,
  onRefresh,
}: any) => (
  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl ">
    <Space size={16}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        shape="circle"
        className="border-none "
      />
      <div className="flex items-center justify-center w-14 h-14 rounded-xl ">
        <ProjectOutlined style={{ fontSize: 24 }} />
      </div>
      <div>
        <Title
          level={3}
          style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}
        >
          {title}
        </Title>
        <Text type="secondary" className="text-sm">
          {subtitle}
        </Text>
      </div>
    </Space>
    <Space size={12}>
      <Button icon={<ReloadOutlined />} onClick={onRefresh} shape="round">
        รีเฟรชข้อมูล
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        size="large"
        shape="round"
        className="shadow-md"
      >
        เพิ่มฟีเจอร์ใหม่
      </Button>
    </Space>
  </div>
);

const SummaryCards = ({ stats, loading, t }: any) => {
  const metrics = [
    {
      label: t("sub_project_page.stat_total"),
      value: stats.total,
      color: "#3b82f6",
      icon: <FileTextOutlined />,
      desc: "จำนวนงานทั้งหมด",
    },
    {
      label: t("sub_project_page.stat_processing"),
      value: stats.processing,
      color: "#f59e0b",
      icon: <SyncOutlined />,
      desc: "กำลังดำเนินการ",
    },
    {
      label: t("sub_project_page.stat_completed"),
      value: stats.completed,
      color: "#22c55e",
      icon: <CheckCircleOutlined />,
      desc: "เสร็จสิ้นแล้ว",
    },
    {
      label: t("sub_project_page.stat_total_hours"),
      value: stats.totalHours,
      color: "#8b5cf6",
      icon: <ClockCircleOutlined />,
      desc: "ชั่วโมงทำงานสะสม",
      suffix: t("sub_project_page.hours_suffix"),
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {metrics.map((m, idx) => (
        <Col xs={24} sm={12} md={6} key={idx}>
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden relative h-full">
            <div className="absolute right-0 top-0 p-3 opacity-10">
              <span style={{ fontSize: "5rem", color: m.color }}>{m.icon}</span>
            </div>
            <Flex align="center" gap={16}>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl shadow-sm"
                style={{ backgroundColor: `${m.color}15`, color: m.color }}
              >
                {m.icon}
              </div>
              <div>
                <Text
                  type="secondary"
                  className="block text-xs uppercase font-bold tracking-wider"
                >
                  {m.label}
                </Text>
                <Statistic
                  value={m.value}
                  suffix={m.suffix}
                  valueStyle={{ fontWeight: 800, fontSize: "1.5rem" }}
                  loading={loading}
                />
                <Text type="secondary" className="text-xs">
                  {m.desc}
                </Text>
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

export default function SubProjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params?.project_id);

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id;

  const {
    isLoading,
    isActionLoading,
    projectData,
    subProjects,
    projectStatuses,
    pagination,
    stats,
    filters,
    setFilters,
    setPagination,
    handleSubmit,
    handleDelete,
    fetchData,
  } = useSubProjectData(projectId, adminId);

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const handleCopyAllFeatures = async () => {
    try {
      const projectName =
        projectData?.name || t("sub_project_page.default_title");
      const featureList = subProjects
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

  return (
    <DashboardLayout>
      <div className="mx-auto p-2 md:p-6 space-y-6">
        {/* Header Section */}
        <HeaderSection
          title={projectData?.name || t("sub_project_page.default_title")}
          subtitle={t("sub_project_page.subtitle")}
          onBack={() => router.back()}
          onRefresh={fetchData}
          onCreate={() => setModalState({ type: "create", data: null })}
        />

        {/* Stats Section */}
        <SummaryCards stats={stats} loading={isLoading} t={t} />

        {/* Filter Card (Merged Style) */}
        <Card className="border-0 shadow-sm rounded-xl mb-6">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            statuses={projectStatuses}
            onClear={() =>
              setFilters({
                searchText: "",
                assetType: null,
                statusFilter: null,
              })
            }
          />
        </Card>

        {/* Table Card */}
        <Card
          className="shadow-sm rounded-xl border-0 overflow-hidden"
          title={
            <Space size={12}>
              <SolutionOutlined className="text-indigo-500" />
              <span>{t("sub_project_page.table_title")}</span>
              <Text
                type="secondary"
                style={{ fontSize: "14px", fontWeight: "normal" }}
              >
                ({stats.total} รายการ)
              </Text>
            </Space>
          }
          extra={
            <Tooltip title={t("sub_project_page.copy_all_tooltip")}>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyAllFeatures}
                disabled={subProjects.length === 0}
                className="hover:text-indigo-500"
              >
                คัดลอกรายชื่อทั้งหมด
              </Button>
            </Tooltip>
          }
        >
          {isLoading ? (
            <div className="p-6">
              <Skeleton active />
            </div>
          ) : (
            <SubProjectTable
              dataSource={subProjects}
              loading={isLoading}
              pagination={pagination}
              onPaginationChange={(page) =>
                setPagination((prev) => ({ ...prev, current: page }))
              }
              onEdit={(record) => setModalState({ type: "edit", data: record })}
              onDelete={handleDelete}
              onViewDetail={(record) =>
                setModalState({ type: "detail", data: record })
              }
              statuses={projectStatuses}
            />
          )}
        </Card>

        {/* Modals */}
        <SubProjectFormModal
          open={modalState.type === "create" || modalState.type === "edit"}
          mode={modalState.type === "create" ? "create" : "edit"}
          data={modalState.data}
          loading={isActionLoading}
          onSubmit={handleSubmit}
          statuses={projectStatuses}
          onCancel={() => setModalState({ type: null, data: null })}
        />

        <SubProjectDetailModal
          open={modalState.type === "detail"}
          data={modalState.data}
          onClose={() => setModalState({ type: null, data: null })}
        />
      </div>
    </DashboardLayout>
  );
}
