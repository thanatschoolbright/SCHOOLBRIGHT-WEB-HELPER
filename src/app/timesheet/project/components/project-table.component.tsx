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
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { categoryType } from "@/data/timesheet.category.type";

import type { Project } from "../types/project.types";

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
  onShowAssignees: (record: Project) => void;
  statuses?: any[];
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
  onShowAssignees,
  statuses = [],
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

        // Format to Thai Date only (DD/MM/YYYY)
        const formatDate = (d: string) =>
          new Date(d).toLocaleDateString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

        return (
          <div style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
            <CalendarOutlined style={{ marginRight: 8, opacity: 0.7 }} />
            <span>{formatDate(record.start_date)}</span>
            <ArrowRightOutlined
              style={{ margin: "0 8px", fontSize: 10, opacity: 0.5 }}
            />
            <span
              style={{ textDecoration: isExpired ? "line-through" : "none" }}
            >
              {formatDate(record.end_date)}
            </span>
          </div>
        );
      },
    },
    {
      title: "ประมาณการ (ชม.)",
      dataIndex: "estimate_hour",
      key: "estimate_hour",
      width: 140,
      align: "center",
      sorter: (a, b) => (a.estimate_hour || 0) - (b.estimate_hour || 0),
      render: (val: number) => (
        <Tooltip title="ประมาณการชั่วโมงการทำงานรวม (Man-Hours)">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#fff7e6",
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid #ffe7ba",
              width: "fit-content",
              margin: "0 auto",
            }}
          >
            <ClockCircleOutlined style={{ color: "#fa8c16" }} />
            <Typography.Text strong style={{ color: "#d46b08" }}>
              {(val || 0).toLocaleString()}
            </Typography.Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "สุขภาพโครงการ",
      key: "health",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (record.status === "close") {
          return <Tag color="success">เสร็จสิ้น</Tag>;
        }
        if (!record.end_date) {
          return <Tag color="default">- ไม่มีกำหนด -</Tag>;
        }

        const now = dayjs();
        const end = dayjs(record.end_date);
        const daysRemaining = end.diff(now, "day");

        if (daysRemaining < 0) {
          return <Tag color="error">เกินกำหนด</Tag>;
        }
        if (daysRemaining <= 7) {
          return <Tag color="warning">ใกล้ถึงกำหนด</Tag>;
        }
        return <Tag color="success">ปกติ</Tag>;
      },
      filters: [
        { text: "เสร็จสิ้น (Completed)", value: "completed" },
        { text: "ไม่มีกำหนด (No Plan)", value: "no_plan" },
        { text: "เกินกำหนด (Overdue)", value: "overdue" },
        { text: "ใกล้ถึงกำหนด (Due Soon)", value: "due_soon" },
        { text: "ปกติ (Healthy)", value: "healthy" },
      ],
      onFilter: (value: any, record) => {
        if (record.status === "close" && value === "completed") return true;
        if (!record.end_date && value === "no_plan") return true;

        if (record.end_date && record.status === "open") {
          const now = dayjs();
          const end = dayjs(record.end_date);
          const daysRemaining = end.diff(now, "day");

          if (value === "overdue" && daysRemaining < 0) return true;
          if (value === "due_soon" && daysRemaining >= 0 && daysRemaining <= 7)
            return true;
          if (value === "healthy" && daysRemaining > 7) return true;
        }
        return false;
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
        const categoryName = getCategoryName(record.categoryType || "");
        const matchedStatus = statuses.find((s) => s.nameTh === record.status);

        if (matchedStatus) {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Tag
                color="blue"
                style={{
                  margin: 0,
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Step {matchedStatus.priority}: {matchedStatus.nameTh}
              </Tag>
              <Tag style={{ margin: 0, fontSize: 11 }}>{categoryName}</Tag>
            </div>
          );
        }

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
      filters: [
        { text: "จุดเริ่มต้น (Open)", value: "open" },
        { text: "สิ้นสุด (Closed)", value: "close" },
        ...statuses.map((s) => ({ text: s.nameTh, value: s.nameTh })),
        ...categoryType.map((c) => ({ text: c.name, value: c.id })),
      ],
      onFilter: (value: any, record) => {
        return (
          record.status === value ||
          String(record.categoryType) === String(value)
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
      filters: [
        { text: "ใช้งานอยู่ (Active)", value: false },
        { text: "ถูกลบ (Deleted)", value: true },
      ],
      onFilter: (value: any, record) => !!record.is_deleted === value,
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
              <Tooltip title="แสดงรายชื่อผู้จัดทำโครงการ">
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<TeamOutlined />}
                  onClick={() => onShowAssignees(record)}
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
