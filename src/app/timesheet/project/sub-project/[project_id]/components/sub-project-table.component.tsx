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
  Tooltip,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CopyOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { SubProject, PaginationState } from "../types/sub-project.types";
import {
  calculateWorkingHours,
  determineProjectStatus,
  calculateProgress,
} from "../utils/date-helpers";
import { ASSET_OPTIONS } from "../utils/constants";
import { getUserById } from "@helpers/local_storage/user.storage";

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

const getStatusConfig = (status?: string) => {
  switch (status) {
    case "ยังไม่เริ่มต้น":
      return { color: "default", icon: <ClockCircleOutlined /> };
    case "ค้นคว้าเอกสาร":
      return { color: "cyan", icon: <FileTextOutlined /> };
    case "พัฒนา":
      return { color: "processing", icon: <EditOutlined /> };
    case "ทดสอบระบบ":
      return { color: "warning", icon: <InfoCircleOutlined /> };
    case "ส่งมอบงาน (บนเซิฟเวอร์พัฒนา)":
      return { color: "blue", icon: <Badge status="processing" /> };
    case "ส่งมอบงาน (บนเซิฟเวอร์โปรดักชัน)":
      return { color: "success", icon: <CheckCircleOutlined /> };
    default:
      return { color: "default", icon: null };
  }
};

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
        width: 250,
        render: (name, record) => {
          const handleCopy = async () => {
            try {
              const textToCopy = record.name_en
                ? `${name} (${record.name_en})`
                : name;
              await navigator.clipboard.writeText(textToCopy);
              toast.success(t("sub_project_page.copy_success"));
            } catch (error) {
              toast.error(t("sub_project_page.copy_error"));
            }
          };

          return (
            <Space align="start" className="w-full group">
              <Avatar
                shape="square"
                icon={<FileTextOutlined />}
                style={{
                  backgroundColor: token.colorPrimaryBg,
                  color: token.colorPrimary,
                }}
              />
              <div className="flex flex-col flex-1">
                <Text strong>{name}</Text>
                {record.name_en && (
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    {record.name_en}
                  </Text>
                )}
              </div>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ flexShrink: 0 }}
              />
            </Space>
          );
        },
      },
      {
        title: "ผู้รับผิดชอบ",
        key: "assignees",
        width: 120,
        render: (_, record) => (
          <Avatar.Group maxCount={3} size="small" className="flex items-center">
            {record.projectAssignees?.map((a) => {
              const u = getUserById(a.userId);
              return (
                <Tooltip
                  title={`${u?.firstname || "Unknown"} ${u?.lastname || ""} ${
                    a.position ? `(${a.position})` : ""
                  }`}
                  key={a.id}
                >
                  <Avatar
                    src={u?.profile_image}
                    style={{ backgroundColor: token.colorPrimary }}
                  >
                    {u?.firstname?.[0] || <UserOutlined />}
                  </Avatar>
                </Tooltip>
              );
            })}
            {(!record.projectAssignees ||
              record.projectAssignees.length === 0) && (
              <Text type="secondary" style={{ fontSize: 10 }}>
                N/A
              </Text>
            )}
          </Avatar.Group>
        ),
      },
      {
        title: t("sub_project_page.table_status"),
        key: "status",
        width: 180,
        render: (_, record) => {
          const config = getStatusConfig(record.status);
          const percent = calculateProgress(
            record.startDate || "",
            record.endDate || ""
          );

          return (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <Tag color={config.color} className="m-0 text-[10px] font-bold">
                  {record.status || "ยังไม่เริ่มต้น"}
                </Tag>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {record.endDate ? dayjs(record.endDate).format("DD/MM") : "-"}
                </Text>
              </div>
              <Progress
                percent={percent}
                size={[0, 4]}
                showInfo={false}
                strokeColor={
                  record.status === "ส่งมอบงาน (บนเซิฟเวอร์โปรดักชัน)"
                    ? token.colorSuccess
                    : token.colorPrimary
                }
              />
            </div>
          );
        },
      },
      {
        title: t("sub_project_page.table_type"),
        dataIndex: "assetCaptureType",
        key: "type",
        width: 100,
        align: "center",
        render: (type) => {
          const option = ASSET_OPTIONS.find((o) => o.value === type);
          return (
            <Tag color={option?.color} style={{ fontSize: 10 }}>
              {option?.label || type}
            </Tag>
          );
        },
      },
      {
        title: t("sub_project_page.table_actions"),
        key: "action",
        width: 60,
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
      token.colorSuccess,
      token.fontSizeSM,
      token.colorPrimaryBg,
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
