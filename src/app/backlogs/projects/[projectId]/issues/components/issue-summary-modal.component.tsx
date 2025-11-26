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
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Issue } from "@/components/backlog/issue-drawer/types";

type IssueSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  total: number;
};

export default function IssueSummaryModal({
  open,
  onClose,
  issues,
  total,
}: IssueSummaryModalProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const stats = useMemo(() => {
    const closedStatusIds = [4]; // Assuming 4 is closed, but better to check status name
    // Actually we should check status name or color, but for now let's rely on status.name containing "Closed" or "Done"

    let closedCount = 0;
    let openCount = 0;
    const priorityCount: Record<string, number> = {};
    const assigneeCount: Record<string, number> = {};

    issues.forEach((issue) => {
      const isClosed = ["closed", "done", "completed", "finish"].some((s) =>
        issue.status?.name?.toLowerCase().includes(s)
      );

      if (isClosed) {
        closedCount++;
      } else {
        openCount++;
      }

      const priorityName = issue.priority?.name || "Unknown";
      priorityCount[priorityName] = (priorityCount[priorityName] || 0) + 1;

      const assigneeName = issue.assignee?.name || "Unassigned";
      assigneeCount[assigneeName] = (assigneeCount[assigneeName] || 0) + 1;
    });

    return {
      closedCount,
      openCount,
      priorityCount,
      assigneeCount,
      totalLoaded: issues.length,
    };
  }, [issues]);

  const assigneeData = useMemo(() => {
    return Object.entries(stats.assigneeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats.assigneeCount]);

  const completionRate =
    stats.totalLoaded > 0
      ? Math.round((stats.closedCount / stats.totalLoaded) * 100)
      : 0;

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <Typography.Text strong style={{ fontSize: 18 }}>
            รายงานสรุป (Summary Report)
          </Typography.Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* Key Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="shadow-sm bg-blue-50">
              <Statistic
                title="Total Issues (Loaded)"
                value={stats.totalLoaded}
                suffix={`/ ${total}`}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="shadow-sm bg-green-50">
              <Statistic
                title="Completion Rate"
                value={completionRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
              <Progress
                percent={completionRate}
                showInfo={false}
                strokeColor="#52c41a"
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="shadow-sm bg-orange-50">
              <Statistic
                title="Pending Issues"
                value={stats.openCount}
                prefix={<FireOutlined />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Assignee Ranking */}
          <Col xs={24} md={14}>
            <Card
              title="Issues by Assignee"
              bordered={false}
              className="shadow-sm"
            >
              <Table
                dataSource={assigneeData}
                rowKey="name"
                pagination={{ pageSize: 5 }}
                size="small"
                columns={[
                  {
                    title: "Assignee",
                    dataIndex: "name",
                    key: "name",
                    render: (text) => (
                      <Space>
                        <UserOutlined />
                        <Typography.Text>{text}</Typography.Text>
                      </Space>
                    ),
                  },
                  {
                    title: "Issues",
                    dataIndex: "count",
                    key: "count",
                    render: (val) => <Tag color="blue">{val}</Tag>,
                    sorter: (a, b) => a.count - b.count,
                  },
                  {
                    title: "% Contribution",
                    key: "percent",
                    render: (_, record) => (
                      <Progress
                        percent={Math.round(
                          (record.count / stats.totalLoaded) * 100
                        )}
                        size="small"
                        steps={5}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          {/* Priority Breakdown */}
          <Col xs={24} md={10}>
            <Card
              title="Issues by Priority"
              bordered={false}
              className="shadow-sm"
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                {Object.entries(stats.priorityCount).map(
                  ([priority, count]) => (
                    <div key={priority}>
                      <div className="flex justify-between mb-1">
                        <Typography.Text>{priority}</Typography.Text>
                        <Typography.Text strong>{count}</Typography.Text>
                      </div>
                      <Progress
                        percent={Math.round((count / stats.totalLoaded) * 100)}
                        strokeColor={
                          priority.toLowerCase().includes("high")
                            ? "#f5222d"
                            : priority.toLowerCase().includes("normal")
                            ? "#1890ff"
                            : "#52c41a"
                        }
                      />
                    </div>
                  )
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
}
