"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { Layout, Space, Spin, Card, Typography, Modal } from "antd";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/backend-layout";
import HeaderSection from "./components/header.component";
import SummaryCards from "./components/summary-cards.component";
import FiltersToolbar from "./components/filters.component";
import FiltersSection from "./components/filters-section.component";
import BulkUpdateSection from "./components/bulk-update-section.component";
import TableSection from "./components/table-section.component";
import FallbackError from "./components/fallback-error.component";
import { useIssuesPageData } from "./hooks/issues.data";

const { Content } = Layout;

function ProjectIssuesPageContent(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t: TRANSLATION } = useTranslation("translate");

  const projectIdParam = params?.projectId;
  const projectId =
    typeof projectIdParam === "string" ? Number(projectIdParam) : NaN;
  const space = searchParams?.get("space") ?? "";
  const projectName = searchParams?.get("name") ?? "";
  const projectReady =
    Number.isFinite(projectId) && projectId > 0 && Boolean(space);
  const [modalApi, contextHolder] = Modal.useModal();

  const {
    state,
    loadIssues,
    loadOptions,
    resetAll,
    handleSearchKeyword,
  } = useIssuesPageData({
    projectId,
    space,
    projectReady,
    modalApi,
  });

  const onBack = useCallback(() => router.back(), [router]);
  const handleSearch = useCallback(
    (value: string) => {
      handleSearchKeyword(value);
    },
    [handleSearchKeyword]
  );

  useEffect(() => {
    if (!projectReady) return;
    loadOptions();
  }, [projectReady, loadOptions]);

  useEffect(() => {
    if (!projectReady) return;
    loadIssues();
  }, [projectReady, loadIssues]);

  useEffect(() => {
    resetAll();
  }, [projectId, space, resetAll]);

  const notReadyView = useMemo(
    () => (
      <FallbackError
        title={TRANSLATION("backlog_issues_page.project_not_ready_title")}
        description={TRANSLATION(
          "backlog_issues_page.project_not_ready_description"
        )}
        actionLabel={TRANSLATION("backlog_issues_page.project_not_ready_cta")}
        onAction={() => router.push("/backlogs/report")}
      />
    ),
    [TRANSLATION, router]
  );

  if (!projectReady) {
    return notReadyView;
  }

  return (
    <DashboardLayout>
      {contextHolder}
      <Layout>
        <Content>
          <Space direction="vertical" size={16} className="w-full">
            {/* Header Section */}
            <HeaderSection
              title={
                projectName ||
                `${TRANSLATION("backlog_issues_page.project_prefix")} ${projectId}`
              }
              subtitle={`${TRANSLATION("backlog_issues_page.space")}: ${space}`}
              onBack={onBack}
            />

            {/* Summary Cards */}
            <SummaryCards
              total={state.total}
              space={space}
              projectName={projectName}
            />

            {/* Filters */}
            <FiltersToolbar
              total={state.total}
              keyword={state.filters.keyword ?? ""}
              onSearch={handleSearch}
              onReset={resetAll}
              onRefresh={loadIssues}
              loading={state.loading}
            />

            {/* Advanced Filters */}
            <FiltersSection onSearch={loadIssues} />

            {/* Bulk Update */}
            <BulkUpdateSection
              projectId={projectId}
              projectName={projectName}
              space={space}
              onUpdateComplete={loadIssues}
            />

            {/* Table Section */}
            <TableSection
              onReload={loadIssues}
              space={space}
              loading={state.loading}
            />
          </Space>
        </Content>
      </Layout>
    </DashboardLayout>
  );
}

export default function ProjectIssuesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Card>
            <Space align="center" size="small">
              <Spin />
              <Typography.Text>Loading...</Typography.Text>
            </Space>
          </Card>
        </div>
      }
    >
      <ProjectIssuesPageContent />
    </Suspense>
  );
}
