"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Col, Row, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  FileTextOutlined,
  PlusOutlined,
  ProjectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";

import { StatCard } from "./components/stat-card.component";
import { FilterBar } from "./components/filter-bar.component";
import { SubProjectTable } from "./components/sub-project-table.component";
import { SubProjectFormModal } from "./components/sub-project-form-modal.component";
import { SubProjectDetailModal } from "./components/sub-project-detail-modal.component";
import { useSubProjectData } from "./hooks/use-sub-project.data";
import type { ModalState } from "./types/sub-project.types";

const { Text, Title } = Typography;

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
    pagination,
    stats,
    filters,
    setFilters,
    setPagination,
    handleSubmit,
    handleDelete,
  } = useSubProjectData(projectId, adminId);

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const handleOpenCreate = () => {
    setModalState({ type: "create", data: null });
  };

  const handleOpenEdit = (record: any) => {
    setModalState({ type: "edit", data: record });
  };

  const handleViewDetail = (record: any) => {
    setModalState({ type: "detail", data: record });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, data: null });
  };

  const handleClearFilters = () => {
    setFilters({
      searchText: "",
      assetType: null,
      statusFilter: null,
    });
  };

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
      <div className="w-full space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="w-fit"
          >
            {t("sub_project_page.back_button")}
          </Button>
          <HeaderBar
            title={projectData?.name || t("sub_project_page.default_title")}
            subTitle={t("sub_project_page.subtitle")}
            icon={<ProjectOutlined />}
            color="none"
          />
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title={t("sub_project_page.stat_total")}
              value={stats.total}
              icon={<FileTextOutlined />}
              color="#1890ff"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title={t("sub_project_page.stat_processing")}
              value={stats.processing}
              icon={<SyncOutlined spin />}
              color="#faad14"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title={t("sub_project_page.stat_completed")}
              value={stats.completed}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title={t("sub_project_page.stat_total_hours")}
              value={stats.totalHours}
              icon={<ClockCircleOutlined />}
              color="#722ed1"
              suffix={t("sub_project_page.hours_suffix")}
              loading={isLoading}
            />
          </Col>
        </Row>

        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onClear={handleClearFilters}
        />

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Title level={4} style={{ margin: 0 }}>
                {t("sub_project_page.table_title")} ({stats.total})
              </Title>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopyAllFeatures}
                disabled={subProjects.length === 0}
                title={t("sub_project_page.copy_all_tooltip")}
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleOpenCreate}
            >
              {t("sub_project_page.add_button")}
            </Button>
          </div>
        </Card>

        <Card className="shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
          <SubProjectTable
            dataSource={subProjects}
            loading={isLoading}
            pagination={pagination}
            onPaginationChange={(page) =>
              setPagination((prev) => ({ ...prev, current: page }))
            }
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onViewDetail={handleViewDetail}
          />
        </Card>

        <SubProjectFormModal
          open={modalState.type === "create" || modalState.type === "edit"}
          mode={modalState.type === "create" ? "create" : "edit"}
          data={modalState.data}
          loading={isActionLoading}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />

        <SubProjectDetailModal
          open={modalState.type === "detail"}
          data={modalState.data}
          onClose={handleCloseModal}
        />
      </div>
    </DashboardLayout>
  );
}
