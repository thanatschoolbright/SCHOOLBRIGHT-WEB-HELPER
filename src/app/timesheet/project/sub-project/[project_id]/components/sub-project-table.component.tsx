import React, { useMemo } from "react";
import {
  Table,
  Space,
  Avatar,
  Typography,
  Tag,
  Badge,
  Progress,
  Dropdown,
  Button,
  Popconfirm,
  Empty,
  theme,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import type { SubProject, PaginationState } from "../types/sub-project.types";
import {
  calculateWorkingHours,
  determineProjectStatus,
  calculateProgress,
} from "../utils/date-helpers";
import { ASSET_OPTIONS } from "../utils/constants";

const { Text } = Typography;

interface SubProjectTableProps {
  dataSource: SubProject[];
  loading: boolean;
  pagination: PaginationState;
  onPaginationChange: (page: number) => void;
  onEdit: (record: SubProject) => void;
  onDelete: (id: number) => void;
  onViewDetail: (record: SubProject) => void;
}

export const SubProjectTable: React.FC<SubProjectTableProps> = ({
  dataSource,
  loading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const columns: ColumnsType<SubProject> = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        width: 60,
        align: "center",
        render: (_, __, idx) =>
          (pagination.current - 1) * pagination.pageSize + idx + 1,
      },
      {
        title: t("sub_project_page.table_feature"),
        dataIndex: "name",
        key: "name",
        width: 300,
        render: (name, record) => (
          <Space align="start">
            <Avatar
              shape="square"
              icon={<FileTextOutlined />}
              style={{
                backgroundColor: token.colorPrimaryBg,
                color: token.colorPrimary,
              }}
            />
            <div className="flex flex-col">
              <Text strong>{name}</Text>
              {record.name_en && (
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  {record.name_en}
                </Text>
              )}
              {record.backlogDescription?.note && (
                <Text
                  type="secondary"
                  italic
                  ellipsis
                  style={{ fontSize: token.fontSizeSM, maxWidth: 200 }}
                >
                  {record.backlogDescription.note}
                </Text>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: t("sub_project_page.table_type"),
        dataIndex: "assetCaptureType",
        key: "type",
        width: 150,
        align: "center",
        render: (type) => {
          const option = ASSET_OPTIONS.find((o) => o.value === type);
          return <Tag color={option?.color}>{option?.label || type}</Tag>;
        },
      },
      {
        title: t("sub_project_page.table_status"),
        key: "status",
        width: 200,
        render: (_, record) => {
          const { label, status } = determineProjectStatus(
            record.startDate || "",
            record.endDate || ""
          );
          const percent = calculateProgress(
            record.startDate || "",
            record.endDate || ""
          );

          return (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <Badge status={status as any} text={label} />
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  {record.endDate
                    ? dayjs(record.endDate).format("DD MMM")
                    : "-"}
                </Text>
              </div>
              <Progress
                percent={percent}
                size="small"
                showInfo={false}
                strokeColor={
                  status === "processing" ? token.colorPrimary : undefined
                }
              />
            </div>
          );
        },
      },
      {
        title: t("sub_project_page.table_estimate_time"),
        key: "estimate",
        width: 120,
        align: "center",
        render: (_, record) => (
          <Tag icon={<ClockCircleOutlined />}>
            {
              calculateWorkingHours(
                record.startDate || "",
                record.endDate || ""
              ).text
            }
          </Tag>
        ),
      },
      {
        title: t("sub_project_page.table_actions"),
        key: "action",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: t("sub_project_page.action_view"),
                  icon: <InfoCircleOutlined />,
                  onClick: () => onViewDetail(record),
                },
                {
                  key: "edit",
                  label: t("sub_project_page.action_edit"),
                  icon: <EditOutlined />,
                  onClick: () => onEdit(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: (
                    <Popconfirm
                      title={t("sub_project_page.delete_confirm_title")}
                      description={t("sub_project_page.delete_confirm_desc")}
                      onConfirm={() => onDelete(record.id)}
                      okText={t("sub_project_page.delete_ok")}
                      cancelText={t("sub_project_page.delete_cancel")}
                      okButtonProps={{ danger: true }}
                    >
                      <span className="w-full inline-block">
                        {t("sub_project_page.action_delete")}
                      </span>
                    </Popconfirm>
                  ),
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [
      pagination.current,
      pagination.pageSize,
      token.colorPrimary,
      t,
      onEdit,
      onDelete,
      onViewDetail,
    ]
  );

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(r) => r.id}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: onPaginationChange,
        showSizeChanger: false,
        showTotal: (total) =>
          t("sub_project_page.total_items", { count: total }),
      }}
      locale={{
        emptyText: <Empty description={t("sub_project_page.no_data")} />,
      }}
    />
  );
};
