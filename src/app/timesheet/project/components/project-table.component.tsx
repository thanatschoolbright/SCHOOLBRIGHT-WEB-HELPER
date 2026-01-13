import React from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Tooltip,
  Badge,
  Tag,
  Dropdown,
  Skeleton,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import Link from "next/link";
import dayjs from "dayjs";
import {
  ProjectOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  EditOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";

interface Project {
  id: number;
  name: string;
  name_en?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  categoryType: string;
  status: string;
  features?: Array<{ is_deleted: boolean }>;
  start_date?: string;
  end_date?: string;
  is_deleted?: boolean;
}

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPaginationChange: (page: number, size: number) => void;
  onEdit: (record: Project) => void;
  onDelete: (record: Project) => void;
  onViewDetail: (record: Project) => void;
  getCategoryName: (id: string) => string;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  loading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onViewDetail,
  getCategoryName,
}) => {
  const { t } = useTranslation("translate");

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const now = dayjs();
    const total = end.diff(start, "day");
    const elapsed = now.diff(start, "day");
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getSubProjectCount = (features?: Array<{ is_deleted: boolean }>) => {
    return features?.filter((f) => !f.is_deleted).length || 0;
  };

  const columns: ColumnsType<Project> = [
    {
      title: t("project_page.table_index"),
      key: "index",
      align: "center",
      width: 60,
      render: (_, __, idx) => (
        <Typography.Text strong>
          {(pagination.current - 1) * pagination.pageSize + idx + 1}
        </Typography.Text>
      ),
    },
    {
      title: t("project_page.table_id"),
      dataIndex: "id",
      key: "id",
      align: "center",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <Typography.Text copyable={{ text: String(id) }} code>
          {String(id).padStart(4, "0")}
        </Typography.Text>
      ),
    },
    {
      title: t("project_page.table_project"),
      key: "project_name",
      width: 280,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
          <div
            style={{
              minWidth: 40,
              height: 40,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e6f4ff",
              backgroundColor: "#f0f5ff",
            }}
          >
            <ProjectOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text strong style={{ display: "block" }}>
              {record.name}
            </Typography.Text>
            {record.name_en ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.name_en}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary" italic style={{ fontSize: 12 }}>
                {t("project_page.no_english_name")}
              </Typography.Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("project_page.table_duration"),
      key: "duration",
      width: 200,
      sorter: (a, b) => {
        const dateA = a.start_date ? dayjs(a.start_date).valueOf() : 0;
        const dateB = b.start_date ? dayjs(b.start_date).valueOf() : 0;
        return dateA - dateB;
      },
      render: (_, record) => {
        if (!record.start_date || !record.end_date) {
          return <Typography.Text type="secondary">-</Typography.Text>;
        }

        const isExpired = dayjs(record.end_date).isBefore(dayjs());
        const progress = calculateProgress(record.start_date, record.end_date);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{ display: "flex", alignItems: "center", fontSize: 12 }}
            >
              <CalendarOutlined style={{ marginRight: 8, opacity: 0.7 }} />
              <span>{convertToThaiDateDDMMYYY(record.start_date)}</span>
              <ArrowRightOutlined
                style={{ margin: "0 8px", fontSize: 10, opacity: 0.5 }}
              />
              <span
                style={{ textDecoration: isExpired ? "line-through" : "none" }}
              >
                {convertToThaiDateDDMMYYY(record.end_date)}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 2,
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: isExpired ? "#d9d9d9" : "#1890ff",
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: "สุขภาพโครงการ",
      key: "health",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (record.status === "close") {
          return <Tag color="success">Completed</Tag>;
        }
        if (!record.end_date) {
          return <Tag color="default">- No Plan -</Tag>;
        }

        const now = dayjs();
        const end = dayjs(record.end_date);
        const daysRemaining = end.diff(now, "day");

        if (daysRemaining < 0) {
          return <Tag color="error">Overdue</Tag>;
        }
        if (daysRemaining <= 7) {
          return <Tag color="warning">Due Soon</Tag>;
        }
        return <Tag color="success">Healthy</Tag>;
      },
    },
    {
      title: t("project_page.table_sub_projects"),
      key: "features",
      align: "center",
      width: 100,
      sorter: (a, b) =>
        getSubProjectCount(a.features) - getSubProjectCount(b.features),
      render: (_, record) => {
        const count = getSubProjectCount(record.features);
        return (
          <Tooltip title={`${count} ${t("project_page.sub_projects_count")}`}>
            <Badge
              count={count}
              showZero
              style={{
                backgroundColor: count > 0 ? "#722ed1" : "#d9d9d9",
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: t("project_page.table_status"),
      key: "status_type",
      width: 160,
      render: (_, record) => {
        const categoryName = getCategoryName(record.categoryType);
        const isOpen = record.status === "open";

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Badge
              status={isOpen ? "processing" : "default"}
              text={
                <span style={{ color: isOpen ? "#52c41a" : "#8c8c8c" }}>
                  {isOpen
                    ? t("project_page.status_active")
                    : t("project_page.status_closed")}
                </span>
              }
            />
            <Tag style={{ margin: 0, fontSize: 11 }}>{categoryName}</Tag>
          </div>
        );
      },
    },
    {
      title: t("project_page.table_deleted_status"),
      key: "is_deleted",
      width: 120,
      align: "center",
      render: (_, record) => {
        const isDeleted = record.is_deleted === true;
        return (
          <Badge
            status={isDeleted ? "error" : "success"}
            text={
              <span style={{ color: isDeleted ? "#ff4d4f" : "#52c41a" }}>
                {isDeleted
                  ? t("project_page.deleted")
                  : t("project_page.active")}
              </span>
            }
          />
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "center",
      width: 140,
      fixed: "right",
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "detail",
            label: t("project_page.action_view_detail"),
            icon: <InfoCircleOutlined />,
            onClick: () => onViewDetail(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            label: t("project_page.action_delete"),
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(record),
          },
        ];

        return (
          <Space>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 20,
                border: "1px solid #f0f0f0",
              }}
            >
              <Tooltip title={t("project_page.action_edit")}>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Tooltip title={t("project_page.action_more")}>
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    icon={<MoreOutlined />}
                  />
                </Tooltip>
              </Dropdown>
            </div>
            <Tooltip title={t("project_page.action_enter_project")}>
              <Link href={`/timesheet/project/sub-project/${record.id}`}>
                <Button
                  type="primary"
                  size="small"
                  shape="circle"
                  icon={<ArrowRightOutlined />}
                />
              </Link>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  return (
    <Card>
      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: onPaginationChange,
          showTotal: (total) =>
            `${t("project_page.total_items", { count: total })}`,
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};
