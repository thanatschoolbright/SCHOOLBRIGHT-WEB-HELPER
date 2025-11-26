import React, { useMemo } from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Typography,
  Tooltip,
  Avatar,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FireOutlined,
  BugOutlined,
  FileTextOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Issue } from "@/components/backlog/issue-drawer/types";
import dayjs from "dayjs";

type IssueSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  total: number;
};

type AssigneeStat = {
  name: string;
  total: number;
  closed: number;
  open: number;
  overdue: number;
  issueTypes: Record<string, number>;
  score: number;
};

export default function IssueSummaryModal({
  open,
  onClose,
  issues,
  total,
}: IssueSummaryModalProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const { assigneeStats, overallStats } = useMemo(() => {
    const stats: Record<string, AssigneeStat> = {};
    let totalOverdue = 0;
    let totalClosed = 0;

    issues.forEach((issue) => {
      const assigneeName = issue.assignee?.name || "Unassigned";
      if (!stats[assigneeName]) {
        stats[assigneeName] = {
          name: assigneeName,
          total: 0,
          closed: 0,
          open: 0,
          overdue: 0,
          issueTypes: {},
          score: 0,
        };
      }

      const s = stats[assigneeName];
      s.total++;

      // Status Check
      const isClosed = ["closed", "done", "completed", "finish"].some((st) =>
        issue.status?.name?.toLowerCase().includes(st)
      );

      if (isClosed) {
        s.closed++;
        totalClosed++;
      } else {
        s.open++;
      }

      // Overdue Check
      if (
        !isClosed &&
        issue.dueDate &&
        dayjs(issue.dueDate).isBefore(dayjs(), "day")
      ) {
        s.overdue++;
        totalOverdue++;
      }

      // Issue Type
      const typeName = issue.issueType?.name || "Other";
      s.issueTypes[typeName] = (s.issueTypes[typeName] || 0) + 1;
    });

    // Calculate Score
    const computedStats = Object.values(stats).map((s) => {
      const completionRate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
      // Score Formula: Completion Rate - (Overdue * 5)
      // Bonus: If total > 5 and overdue == 0 -> +10
      let score = completionRate - s.overdue * 5;
      if (s.total >= 5 && s.overdue === 0) score += 10;

      return {
        ...s,
        score: Math.max(0, Math.min(100, Math.round(score))),
      };
    });

    return {
      assigneeStats: computedStats.sort((a, b) => b.score - a.score),
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 50) return "#1890ff";
    return "#ff4d4f";
  };

  const getIssueTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("bug")) return <BugOutlined />;
    if (lower.includes("task")) return <CheckCircleOutlined />;
    if (lower.includes("request") || lower.includes("feature"))
      return <FileTextOutlined />;
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
      destroyOnClose
      style={{ top: 20 }}
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* Key Metrics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card bordered={false} className="shadow-sm bg-blue-50 h-full">
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
            <Card bordered={false} className="shadow-sm bg-green-50 h-full">
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
            <Card bordered={false} className="shadow-sm bg-red-50 h-full">
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
              bordered={false}
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

        {/* Detailed Table */}
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>ประสิทธิภาพรายบุคคล (Individual Performance)</span>
            </Space>
          }
          bordered={false}
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
                render: (_, __, index) => {
                  if (index === 0)
                    return (
                      <TrophyOutlined
                        style={{ color: "#FFD700", fontSize: 18 }}
                      />
                    );
                  if (index === 1)
                    return (
                      <TrophyOutlined
                        style={{ color: "#C0C0C0", fontSize: 16 }}
                      />
                    );
                  if (index === 2)
                    return (
                      <TrophyOutlined
                        style={{ color: "#CD7F32", fontSize: 14 }}
                      />
                    );
                  return index + 1;
                },
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
                render: (_, record) => (
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
                            {count}
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
