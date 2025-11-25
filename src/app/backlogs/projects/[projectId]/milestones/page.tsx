"use client";

import { Layout, Space, theme } from "antd";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/backend-layout";
import { HeaderComponent } from "./components/header.component";
import { SummaryCards } from "./components/summary-cards.component";
import { MilestoneForm } from "./components/milestone-form.component";
import { MilestoneList } from "./components/milestone-list.component";
import { useMilestonesData } from "./hooks/milestones.data";

const { Content, Sider } = Layout;

export default function MilestoneManagerPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const router = useRouter();
  const { token } = theme.useToken();
  const {
    form,
    milestones,
    loading,
    saving,
    deletingId,
    editingMilestone,
    space,
    projectId,
    isValidProject,
    onRefresh,
    onSubmit,
    onEdit,
    onDelete,
    onResetForm,
  } = useMilestonesData();

  const activeCount = milestones.filter((m) => !m.archived).length;
  const archivedCount = milestones.filter((m) => m.archived).length;

  const layoutStyle = {
    minHeight: "100vh",
    background: token.colorBgLayout,
  };

  const sidePanelStyle = {
    background: token.colorBgContainer,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    padding: 24,
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 16,
  };

  const contentStyle = {
    padding: 32,
    minHeight: "100%",
    background: "transparent",
  };

  if (!isValidProject || !space) {
    return (
      <DashboardLayout>
        <Layout style={layoutStyle}>
          <Content style={{ padding: 32 }}>
            <HeaderComponent
              title={TRANSLATION("milestone_page.invalid_title")}
              subtitle={TRANSLATION("milestone_page.back")}
              onBack={() => router.back()}
            />
            <p className="text-gray-500">
              {TRANSLATION("milestone_page.invalid_description")}
            </p>
          </Content>
        </Layout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Layout style={layoutStyle}>
        <Sider width={360} style={sidePanelStyle}>
          {/* Header Section */}
          <HeaderComponent
            title={TRANSLATION("milestone_page.form_title")}
            subtitle={TRANSLATION("milestone_page.back")}
            onBack={() => router.back()}
          />

          {/* Form Section */}
          <MilestoneForm
            form={form}
            onSubmit={onSubmit}
            onCancelEdit={onResetForm}
            saving={saving}
            isEditing={Boolean(editingMilestone)}
            labels={{
              name: TRANSLATION("milestone_page.name_label"),
              description: TRANSLATION("milestone_page.description_label"),
              start: TRANSLATION("milestone_page.start_label"),
              due: TRANSLATION("milestone_page.due_label"),
              archived: TRANSLATION("milestone_page.archived_label"),
              saveNew: TRANSLATION("milestone_page.save_new"),
              saveEdit: TRANSLATION("milestone_page.save_edit"),
              cancelEdit: TRANSLATION("milestone_page.cancel_edit"),
            }}
          />
        </Sider>
        <Layout>
          <Content style={contentStyle}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {/* Summary Cards */}
              <SummaryCards
                total={milestones.length}
                active={activeCount}
                archived={archivedCount}
                titleTotal={TRANSLATION("milestone_page.total")}
                titleActive={TRANSLATION("milestone_page.active")}
                titleArchived={TRANSLATION("milestone_page.archived")}
              />

              {/* Table Section */}
              <MilestoneList
                milestones={milestones}
                loading={loading}
                deletingId={deletingId}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefresh={onRefresh}
                title={TRANSLATION("milestone_page.list_title")}
                emptyText={TRANSLATION("milestone_page.empty")}
                refreshText={TRANSLATION("milestone_page.refresh")}
                helperText={TRANSLATION("milestone_page.helper_text")}
              />
            </Space>
          </Content>
        </Layout>
      </Layout>
    </DashboardLayout>
  );
}
