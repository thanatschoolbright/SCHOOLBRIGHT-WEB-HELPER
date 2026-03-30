"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  PushpinOutlined,
  RobotOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ColoredBadge from "@/components/ant-design/table/table-badge-color";
import {
  Avatar,
  Button,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Issue } from "@/components/backlog/issue-drawer/types";

const { Text } = Typography;

const formatDateThai = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "-";

interface IssuesTableProps {
  issues: Issue[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  selectedRowKeys: React.Key[];
  space: string;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSelectChange: (keys: React.Key[]) => void;
  onViewDetail: (issue: Issue) => void;
  onAiAnalyze: (issue: Issue) => void;
}

export function IssuesTable({
  issues,
  total,
  page,
  pageSize,
  loading,
  selectedRowKeys,
  space,
  onPaginationChange,
  onSelectChange,
  onViewDetail,
  onAiAnalyze,
}: IssuesTableProps) {
  const { token } = theme.useToken();

  const columns: ColumnsType<Issue> = [
    {
      title: "รหัสงาน",
      dataIndex: "issueKey",
      key: "issueKey",
      width: 120,
      fixed: "left",
      sorter: (a, b) => a.issueKey.localeCompare(b.issueKey),
      render: (key: string) => (
        <Typography.Link
          href={`https://${space}.backlog.com/view/${key}`}
          target="_blank"
          strong
          style={{ fontWeight: 600 }}
        >
          {key}
        </Typography.Link>
      ),
    },
    {
      title: "โปรเจกต์",
      key: "project",
      width: 120,
      render: (_, record: any) =>
        record.issueKey ? (
          <Tag color="blue">{record.issueKey.split("-")[0]}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "ประเภท",
      key: "issueType",
      width: 100,
      render: (_, record) => (
        <Tag color={record.issueType?.color || "default"}>
          {record.issueType?.name || "N/A"}
        </Tag>
      ),
    },
    {
      title: "หัวข้อ",
      dataIndex: "summary",
      key: "summary",
      ellipsis: true,
      width: 250,
      sorter: (a, b) => a.summary.localeCompare(b.summary),
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ fontWeight: 500 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "สรุปด้วย AI",
      key: "aiStatus",
      width: 100,
      align: "center",
      render: (_, record) => {
        const hasAi = record.description?.includes("AI");
        return hasAi ? (
          <Tooltip title="สรุปด้วย AI เรียบร้อยแล้ว">
            <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 18 }} />
          </Tooltip>
        ) : (
          <Tooltip title="ยังไม่ได้สรุปด้วย AI">
            <CloseCircleFilled style={{ color: token.colorError, fontSize: 18 }} />
          </Tooltip>
        );
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 130,
      sorter: (a, b) => (a.status?.name || "").localeCompare(b.status?.name || ""),
      render: (_, record) =>
        record.status ? (
          <ColoredBadge text={record.status.name} color={record.status.color} />
        ) : (
          "-"
        ),
    },
    {
      title: "ความสำคัญ",
      key: "priority",
      width: 100,
      sorter: (a, b) =>
        (a.priority?.name || "").localeCompare(b.priority?.name || ""),
      render: (_, record) => (
        <Tag
          color={
            record.priority?.name === "High"
              ? "volcano"
              : record.priority?.name === "Normal"
                ? "blue"
                : "default"
          }
          icon={<PushpinOutlined />}
        >
          {record.priority?.name || "N/A"}
        </Tag>
      ),
    },
    {
      title: "หมวดหมู่",
      key: "category",
      width: 150,
      ellipsis: true,
      render: (_, record) => (
        <Space wrap size={[0, 4]}>
          {record.category?.length ? (
            record.category.map((c: any) => (
              <Tag key={c.id} icon={<TagOutlined />}>
                {c.name}
              </Tag>
            ))
          ) : (
            <Space size={4}>
              <ExclamationCircleOutlined style={{ color: token.colorError }} />
              <Text type="danger" style={{ fontSize: 13 }}>
                ไม่ได้ระบุ
              </Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: "ผู้รับผิดชอบ",
      key: "assignee",
      width: 180,
      sorter: (a, b) =>
        (a.assignee?.name || "").localeCompare(b.assignee?.name || ""),
      render: (_, record) =>
        record.assignee ? (
          <Space size={8}>
            <Avatar
              size="small"
              src={record.assignee?.nulabAccount?.iconUrl}
              icon={<UserOutlined />}
            />
            <Text style={{ fontWeight: 500, fontSize: 13 }}>
              {record.assignee?.name}
            </Text>
          </Space>
        ) : (
          <Space size={4}>
            <ExclamationCircleOutlined style={{ color: token.colorError }} />
            <Text type="danger" style={{ fontSize: 13 }}>
              ไม่ได้ระบุ
            </Text>
          </Space>
        ),
    },
    {
      title: "กำหนดส่ง",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      sorter: (a, b) => dayjs(a.dueDate || 0).unix() - dayjs(b.dueDate || 0).unix(),
      render: (date) =>
        date ? (
          <Space size={4}>
            <CalendarOutlined style={{ fontSize: 12, color: token.colorTextDescription }} />
            <Text style={{ fontSize: 13 }}>{formatDateThai(date)}</Text>
          </Space>
        ) : (
          <Space size={4}>
            <ExclamationCircleOutlined style={{ color: token.colorError }} />
            <Text type="danger" style={{ fontSize: 13 }}>
              ไม่ได้ระบุ
            </Text>
          </Space>
        ),
    },
    {
      title: "อัปเดตเมื่อ",
      dataIndex: "updated",
      key: "updated",
      width: 120,
      sorter: (a, b) => dayjs(a.updated || 0).unix() - dayjs(b.updated || 0).unix(),
      render: (date) => (
        <Space size={4}>
          <HistoryOutlined style={{ fontSize: 12, color: token.colorTextDescription }} />
          <Text style={{ fontSize: 13 }}>{formatDateThai(date)}</Text>
        </Space>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="ใช้งาน AI วิเคราะห์งาน">
            <Button
              shape="circle"
              icon={<RobotOutlined />}
              onClick={() => onAiAnalyze(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Issue>
      columns={columns}
      dataSource={issues}
      rowKey={(r) => r.id}
      loading={loading}
      pagination={{
        total,
        current: page,
        pageSize,
        showSizeChanger: true,
        showTotal: (t) => `ทั้งหมด ${t} รายการ`,
        onChange: onPaginationChange,
      }}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectChange,
      }}
      scroll={{ x: 1600 }}
      size="middle"
    />
  );
}
