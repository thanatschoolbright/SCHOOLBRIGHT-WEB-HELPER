"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Layout,
  Space,
  Spin,
  Card,
  Typography,
  Modal,
  Button,
  Row,
  Col,
  theme,
  Collapse,
  Statistic,
  Progress,
  Table,
  Tag,
  Tooltip,
  Avatar,
} from "antd";
import {
  PieChartOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  BugOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import DashboardLayout from "@/components/layouts/backend-layout";
import IssueFilter from "@/components/backlog/issue-filter";
import SharedBulkUpdateSection from "@/components/backlog/bulk-update-section";
import IssuesTable from "@/components/backlog/issues-table";
import type { Issue } from "@/components/backlog/issue-drawer/types";
import { useIssuesPageData } from "./hooks/issues.data";

const { Content } = Layout;

// ส่วนแสดงหัวข้อหน้าและปุ่มย้อนกลับ
function HeaderSection({
  title,
  subtitle,
  onBack,
  extra,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  extra?: React.ReactNode;
}): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  return (
    // ส่วนหัวของหน้า ประกอบด้วยปุ่มย้อนกลับ ชื่อโปรเจกต์ และปุ่มเสริม
    <div className="flex justify-between items-center w-full">
      <Space align="center" size={12}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          type="text"
          className="hover:-translate-y-0.5 transition-transform"
        >
          {TRANSLATION("backlog_issues_page.back")}
        </Button>
        <div className="flex flex-col">
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </div>
      </Space>
      {extra && <div>{extra}</div>}
    </div>
  );
}

// การ์ดแสดงสรุปข้อมูลจำนวน Issue และรายละเอียดโปรเจกต์
function SummaryCards({
  total,
  space,
  projectName,
}: {
  total: number;
  space: string;
  projectName: string;
}): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  return (
    // Grid การ์ด 3 ใบ แสดงจำนวน Issue, Space และชื่อ Project
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: `linear-gradient(120deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
            boxShadow: token.boxShadowSecondary,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.total_issues")}
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {total ?? 0}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.total_issues_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.space_label")}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {space || "-"}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.space_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: token.colorBgContainer,
            boxShadow: token.boxShadow,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.project_label")}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {projectName || "-"}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.project_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

// หน้าแสดงข้อผิดพลาดเมื่อโปรเจกต์ไม่พร้อมใช้งาน
function FallbackError({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}): JSX.Element {
  return (
    // แสดงข้อความแจ้งเตือนกลางหน้าจอพร้อมปุ่มดำเนินการ
    <div className="flex h-[60vh] items-center justify-center">
      <Card className="shadow-md" style={{ borderRadius: 16 }}>
        <Space direction="vertical" size={12} align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary" className="max-w-md text-center">
            {description}
          </Typography.Text>
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </Space>
      </Card>
    </div>
  );
}

// ส่วนแสดงตารางรายการ Issues
function TableSection({
  onReload,
  space,
  loading,
}: {
  onReload: () => void;
  space: string;
  loading: boolean;
}): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  return (
    // การ์ดครอบตาราง IssuesTable พร้อมสถานะโหลด
    <Card
      variant="outlined"
      title={TRANSLATION("backlog_issues_page.table_title")}
      style={{ borderRadius: 16 }}
      className="shadow-sm"
      extra={
        <span className="text-xs text-gray-500">
          {loading
            ? TRANSLATION("backlog_issues_page.loading_table")
            : TRANSLATION("backlog_issues_page.table_ready")}
        </span>
      }
    >
      <IssuesTable listCardStyle={{}} onReload={onReload} space={space} />
    </Card>
  );
}

// ส่วนสำหรับอัปเดตข้อมูลจำนวนมาก (Bulk Update)
function BulkUpdateContainer({
  projectId,
  projectName,
  space,
  onUpdateComplete,
}: {
  projectId: number;
  projectName: string;
  space: string;
  onUpdateComplete: () => void;
}): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  return (
    // Collapse สำหรับซ่อน/แสดงส่วน Bulk Update
    <Card
      size="small"
      style={{ borderRadius: 14 }}
      className="shadow-sm bg-transparent"
    >
      <Collapse
        items={[
          {
            key: "bulk-update",
            label: TRANSLATION("backlog_issues_page.bulk_update_title"),
            children: (
              <SharedBulkUpdateSection
                elevatedCardStyle={{}}
                projectName={projectName}
                projectId={projectId}
                space={space}
                onUpdateComplete={onUpdateComplete}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

// Modal สรุปผลการดำเนินงานของทีม
function IssueSummaryModal({
  open,
  onClose,
  issues,
  total,
}: {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  total: number;
}): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const { assigneeStats, overallStats } = useMemo(() => {
    const stats: Record<string, any> = {};
    let totalOverdue = 0,
      totalClosed = 0;

    issues.forEach((issue) => {
      const assigneeName = issue.assignee?.name || "Unassigned";
      if (!stats[assigneeName])
        stats[assigneeName] = {
          name: assigneeName,
          total: 0,
          closed: 0,
          open: 0,
          overdue: 0,
          issueTypes: {},
          score: 0,
        };

      const s = stats[assigneeName];
      s.total++;

      const isClosed = ["closed", "done", "completed", "finish"].some((st) =>
        issue.status?.name?.toLowerCase().includes(st)
      );
      if (isClosed) {
        s.closed++;
        totalClosed++;
      } else {
        s.open++;
      }

      if (
        !isClosed &&
        issue.dueDate &&
        dayjs(issue.dueDate).isBefore(dayjs(), "day")
      ) {
        s.overdue++;
        totalOverdue++;
      }

      const typeName = issue.issueType?.name || "Other";
      s.issueTypes[typeName] = (s.issueTypes[typeName] || 0) + 1;
    });

    const computedStats = Object.values(stats).map((s: any) => {
      const completionRate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
      let score = completionRate - s.overdue * 5;
      if (s.total >= 5 && s.overdue === 0) score += 10;
      return { ...s, score: Math.max(0, Math.min(100, Math.round(score))) };
    });

    return {
      assigneeStats: computedStats.sort((a: any, b: any) => b.score - a.score),
      overallStats: {
        totalLoaded: issues.length,
        totalClosed,
        totalOverdue,
        completionRate:
          issues.length > 0
            ? Math.round((totalClosed / issues.length) * 100)
            : 0,
      },
    };
  }, [issues]);

  const topPerformer = assigneeStats.length > 0 ? assigneeStats[0] : null;
  const getScoreColor = (score: number) =>
    score >= 80 ? "#52c41a" : score >= 50 ? "#1890ff" : "#ff4d4f";
  const getIssueTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("bug")) return <BugOutlined />;
    if (lower.includes("task")) return <CheckCircleOutlined />;
    return <FileTextOutlined />;
  };
  const getIssueTypeColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("bug")) return "red";
    if (lower.includes("task")) return "blue";
    if (lower.includes("request")) return "purple";
    if (lower.includes("feature")) return "green";
    return "default";
  };

  return (
    // Modal แสดง Dashboard สรุปผลงานทีมและรายบุคคล
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: "#FFD700", fontSize: 22 }} />
          <Typography.Text strong style={{ fontSize: 18 }}>
            รายงานสรุปผลงานทีม (Team Performance Report)
          </Typography.Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      footer={null}
      destroyOnHidden
      style={{ top: 20 }}
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card className="shadow-sm bg-blue-50 h-full">
              <Statistic
                title="Total Issues"
                value={overallStats.totalLoaded}
                suffix={`/ ${total}`}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card className="shadow-sm bg-green-50 h-full">
              <Statistic
                title="Completion Rate"
                value={overallStats.completionRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
              <Progress
                percent={overallStats.completionRate}
                showInfo={false}
                strokeColor="#52c41a"
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card className="shadow-sm bg-red-50 h-full">
              <Statistic
                title="Overdue Issues"
                value={overallStats.totalOverdue}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                งานที่เกินกำหนดส่ง
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card
              className="shadow-sm bg-gold-50 h-full"
              style={{ background: "#fffbe6" }}
            >
              <Statistic
                title="Top Performer"
                value={topPerformer?.name || "-"}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "#faad14", fontSize: 18 }}
              />
              {topPerformer && (
                <Tag color="gold">Score: {topPerformer.score}</Tag>
              )}
            </Card>
          </Col>
        </Row>
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>ประสิทธิภาพรายบุคคล (Individual Performance)</span>
            </Space>
          }
          className="shadow-sm"
        >
          <Table
            dataSource={assigneeStats}
            rowKey="name"
            pagination={{ pageSize: 10 }}
            size="middle"
            columns={[
              {
                title: "Rank",
                key: "rank",
                width: 60,
                align: "center",
                render: (_, __, index) =>
                  index < 3 ? (
                    <TrophyOutlined
                      style={{
                        color:
                          index === 0
                            ? "#FFD700"
                            : index === 1
                            ? "#C0C0C0"
                            : "#CD7F32",
                        fontSize: 18 - index * 2,
                      }}
                    />
                  ) : (
                    index + 1
                  ),
              },
              {
                title: "Assignee",
                dataIndex: "name",
                key: "name",
                width: 180,
                render: (text) => (
                  <Space>
                    <Avatar
                      style={{ backgroundColor: "#1890ff" }}
                      icon={<UserOutlined />}
                      size="small"
                    />
                    <Typography.Text strong>{text}</Typography.Text>
                  </Space>
                ),
              },
              {
                title: "Performance Score",
                dataIndex: "score",
                key: "score",
                width: 150,
                sorter: (a, b) => a.score - b.score,
                render: (score) => (
                  <Space direction="vertical" size={0} style={{ width: 120 }}>
                    <div className="flex justify-between">
                      <span
                        style={{
                          fontWeight: "bold",
                          color: getScoreColor(score),
                        }}
                      >
                        {score}/100
                      </span>
                    </div>
                    <Progress
                      percent={score}
                      size="small"
                      strokeColor={getScoreColor(score)}
                      showInfo={false}
                    />
                  </Space>
                ),
              },
              {
                title: "Workload",
                dataIndex: "total",
                key: "total",
                width: 100,
                align: "center",
                sorter: (a, b) => a.total - b.total,
                render: (val) => (
                  <Tag color="default" style={{ fontSize: 14 }}>
                    {val}
                  </Tag>
                ),
              },
              {
                title: "Issue Type Breakdown",
                key: "issueTypes",
                render: (_, record: any) => (
                  <Space wrap size={[0, 4]}>
                    {Object.entries(record.issueTypes).map(([type, count]) => (
                      <Tooltip key={type} title={`${type}: ${count} issues`}>
                        <Tag
                          icon={getIssueTypeIcon(type)}
                          color={getIssueTypeColor(type)}
                          style={{ margin: "0 4px 4px 0" }}
                        >
                          {type}{" "}
                          <span style={{ fontWeight: "bold", marginLeft: 4 }}>
                            {count as number}
                          </span>
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                ),
              },
              {
                title: "Overdue",
                dataIndex: "overdue",
                key: "overdue",
                width: 100,
                align: "center",
                sorter: (a, b) => a.overdue - b.overdue,
                render: (val) =>
                  val > 0 ? (
                    <Tag color="error" icon={<WarningOutlined />}>
                      {val}
                    </Tag>
                  ) : (
                    <Tag color="success">-</Tag>
                  ),
              },
            ]}
          />
        </Card>
      </Space>
    </Modal>
  );
}

// ส่วนเนื้อหาหลักเมื่อโหลดข้อมูลสำเร็จ
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
  const [showSummary, setShowSummary] = useState(false);

  const { state, loadIssues, loadOptions, resetAll, handleSearchKeyword } =
    useIssuesPageData({ projectId, space, projectReady, modalApi });

  const onBack = useCallback(() => router.back(), [router]);

  useEffect(() => {
    if (!projectReady) return;
    const initializeData = async () => {
      await loadOptions();
      loadIssues();
    };
    initializeData();
  }, [projectReady]);

  useEffect(() => {
    resetAll();
  }, [projectId, space, resetAll]);

  if (!projectReady) {
    return (
      <FallbackError
        title={TRANSLATION("backlog_issues_page.project_not_ready_title")}
        description={TRANSLATION(
          "backlog_issues_page.project_not_ready_description"
        )}
        actionLabel={TRANSLATION("backlog_issues_page.project_not_ready_cta")}
        onAction={() => router.push("/backlogs/report")}
      />
    );
  }

  return (
    // Layout หลักของหน้า Dashboard รวมส่วนประกอบต่างๆ
    <DashboardLayout>
      {contextHolder}
      <Layout>
        <Content>
          <Space direction="vertical" size={16} className="w-full">
            <HeaderSection
              title={
                projectName ||
                `${TRANSLATION(
                  "backlog_issues_page.project_prefix"
                )} ${projectId}`
              }
              subtitle={`${TRANSLATION("backlog_issues_page.space")}: ${space}`}
              onBack={onBack}
              extra={
                <Button
                  icon={<PieChartOutlined />}
                  onClick={() => setShowSummary(true)}
                  type="default"
                >
                  ดูรายงานสรุป
                </Button>
              }
            />
            <SummaryCards
              total={state.total}
              space={space}
              projectName={projectName}
            />
            <IssueFilter
              onSearch={loadIssues}
              elevatedCardStyle={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            />
            <BulkUpdateContainer
              projectId={projectId}
              projectName={projectName}
              space={space}
              onUpdateComplete={loadIssues}
            />
            <TableSection
              onReload={loadIssues}
              space={space}
              loading={state.loading}
            />
          </Space>
        </Content>
      </Layout>
      <IssueSummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        issues={state.issues || []}
        total={state.total}
      />
    </DashboardLayout>
  );
}

// Component หลักสำหรับ Export ที่ห่อหุ้มด้วย Suspense
export default function ProjectIssuesPage(): JSX.Element {
  return (
    // ใช้ Suspense เพื่อรองรับการโหลดรูปแบบ Lazy Loading หรือ SSR
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
