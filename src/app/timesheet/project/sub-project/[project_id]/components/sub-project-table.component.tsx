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
  statuses?: any[];
}

const StatusStepTracker: React.FC<{
  currentStatusId?: number | null;
  currentStatusName?: string;
  statuses: any[];
}> = ({ currentStatusId, currentStatusName, statuses }) => {
  const { token } = theme.useToken();
  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.priority - b.priority),
    [statuses]
  );

  // Find current status priority
  const currentStatus = useMemo(() => {
    if (currentStatusId) return statuses.find((s) => s.id === currentStatusId);
    if (currentStatusName)
      return statuses.find((s) => s.nameTh === currentStatusName);
    return null;
  }, [currentStatusId, currentStatusName, statuses]);

  const currentPriority = currentStatus?.priority || 0;
  // Exclude 'On Hold' (99) from the main progress steps if it's too high?
  // Let's filter out anything > 10 for the line, or just show all.
  // The user sample had priority 99 for On Hold.
  const mainStages = sortedStatuses.filter((s) => s.priority < 90);
  const onHoldStatus = sortedStatuses.find((s) => s.priority === 99);

  const isOnHold = currentPriority === 99;

  return (
    <div className="flex flex-col gap-3 w-full py-2">
      <div className="flex items-center gap-1 relative h-6">
        {mainStages.map((status, index) => {
          const isCompleted = !isOnHold && currentPriority >= status.priority;
          const isActive = !isOnHold && currentPriority === status.priority;

          return (
            <React.Fragment key={status.id}>
              {/* Connector */}
              {index > 0 && (
                <div
                  className="h-[3px] flex-1 rounded-full transition-all duration-700"
                  style={{
                    background: isCompleted
                      ? `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`
                      : token.colorFillSecondary,
                  }}
                />
              )}
              {/* Step Dot */}
              <Tooltip title={`Step ${status.priority}: ${status.nameTh}`}>
                <div
                  className={`relative flex items-center justify-center transition-all duration-500 ${
                    isActive ? "scale-125" : "scale-100"
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute w-5 h-5 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: token.colorPrimary }}
                    />
                  )}
                  <div
                    className="w-3 h-3 rounded-full z-10 transition-all duration-500 border-2"
                    style={{
                      backgroundColor: isCompleted
                        ? token.colorPrimary
                        : "#fff",
                      borderColor: isCompleted
                        ? token.colorPrimary
                        : token.colorFillSecondary,
                      boxShadow: isActive
                        ? `0 0 10px ${token.colorPrimary}80`
                        : "none",
                    }}
                  />
                </div>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex justify-between items-center px-0.5">
        <div className="flex flex-col">
          <Text
            strong
            className="text-[11px]"
            style={{ color: isOnHold ? token.colorError : token.colorPrimary }}
          >
            {currentStatus?.nameTh || currentStatusName || "Ready to Start"}
          </Text>
          {isOnHold && (
            <Text type="danger" style={{ fontSize: 9 }} className="italic">
              Paused at priority {currentStatus?.priority}
            </Text>
          )}
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider"
          style={{
            backgroundColor: isOnHold
              ? `${token.colorError}15`
              : `${token.colorPrimary}15`,
            color: isOnHold ? token.colorError : token.colorPrimary,
          }}
        >
          {currentPriority > 0 && !isOnHold
            ? `${Math.round(
                ((mainStages.findIndex((s) => s.priority === currentPriority) +
                  1) /
                  mainStages.length) *
                  100
              )}%`
            : isOnHold
            ? "ON HOLD"
            : "0%"}
        </div>
      </div>
    </div>
  );
};

export const SubProjectTable: React.FC<SubProjectTableProps> = ({
  dataSource,
  loading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onViewDetail,
  statuses = [],
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const columns: ColumnsType<SubProject> = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        width: 50,
        align: "center",
        className: "text-gray-400 font-medium",
        render: (_, __, idx) =>
          (pagination.current - 1) * pagination.pageSize + idx + 1,
      },
      {
        title: t("sub_project_page.table_feature"),
        dataIndex: "name",
        key: "name",
        width: 280,
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
            <div className="flex items-center gap-4 group py-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`,
                  color: "#fff",
                }}
              >
                <FileTextOutlined style={{ fontSize: 18 }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <Text
                  strong
                  className="truncate text-[14px]"
                  style={{ color: token.colorText }}
                >
                  {name}
                </Text>
                {record.name_en ? (
                  <Text
                    type="secondary"
                    className="truncate text-[11px] font-medium opacity-70"
                  >
                    {record.name_en}
                  </Text>
                ) : (
                  <Text
                    type="secondary"
                    className="italic text-[10px] opacity-40"
                  >
                    No English Name
                  </Text>
                )}
              </div>
              <Tooltip title="Copy name">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  className="opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100 rounded-lg"
                />
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: "ทีมงานผู้รับผิดชอบ",
        key: "assignees",
        width: 140,
        render: (_, record) => (
          <div className="flex flex-col gap-1">
            <Avatar.Group
              max={{
                count: 3,
                style: {
                  color: token.colorPrimary,
                  backgroundColor: `${token.colorPrimary}15`,
                  fontSize: 10,
                  fontWeight: 600,
                },
              }}
              size="small"
              className="flex items-center"
            >
              {record.projectAssignees?.map((a) => {
                const u = getUserById(a.userId);
                return (
                  <Tooltip
                    title={
                      <div className="text-[11px]">
                        <div className="font-bold">{`${
                          u?.firstname || "Unknown"
                        } ${u?.lastname || ""}`}</div>
                        {a.position && (
                          <div className="opacity-80 italic">{a.position}</div>
                        )}
                      </div>
                    }
                    key={a.id}
                  >
                    <Avatar
                      src={u?.profile_image}
                      className="border-2 border-white"
                      style={{ backgroundColor: token.colorPrimary }}
                    >
                      {u?.firstname?.[0] || <UserOutlined />}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </Avatar.Group>
            {record.projectAssignees && record.projectAssignees.length > 0 ? (
              <Text type="secondary" style={{ fontSize: 9 }} className="pl-1">
                {record.projectAssignees.length} members
              </Text>
            ) : (
              <Tag
                color="default"
                className="w-fit text-[9px] h-4 leading-[14px] m-0 opacity-50"
              >
                Unassigned
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: t("sub_project_page.table_status"),
        key: "status",
        width: 220,
        render: (_, record) => (
          <StatusStepTracker
            currentStatusId={record.projectStatusId}
            currentStatusName={record.status}
            statuses={statuses}
          />
        ),
      },
      {
        title: t("sub_project_page.table_type"),
        dataIndex: "assetCaptureType",
        key: "type",
        width: 110,
        align: "center",
        render: (type) => {
          const option = ASSET_OPTIONS.find((o) => o.value === type);
          return (
            <Tag
              className="m-0 border-none rounded-full px-3 text-[10px] uppercase font-bold tracking-tighter"
              style={{
                backgroundColor:
                  `${option?.color}15` || token.colorFillSecondary,
                color: option?.color || token.colorTextSecondary,
              }}
            >
              {option?.label || type}
            </Tag>
          );
        },
      },
      {
        title: "",
        key: "action",
        width: 60,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "ดูรายละเอียด",
                  icon: <InfoCircleOutlined />,
                  onClick: () => onViewDetail(record),
                },
                {
                  key: "edit",
                  label: "แก้ไขข้อมูล",
                  icon: <EditOutlined />,
                  onClick: () => onEdit(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: (
                    <Popconfirm
                      title="ยืนยันการลบ?"
                      description="ข้อมูลที่ถูกลบไม่สามารถกู้คืนได้"
                      onConfirm={() => onDelete(record.id)}
                      okText="ยืนยัน"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                    >
                      <span className="w-full inline-block text-red-500">
                        ลบฟีเจอร์
                      </span>
                    </Popconfirm>
                  ),
                  icon: <DeleteOutlined className="text-red-500" />,
                  danger: true,
                },
              ],
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              type="text"
              shape="circle"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              className="hover:bg-gray-100"
            />
          </Dropdown>
        ),
      },
    ],
    [
      pagination.current,
      pagination.pageSize,
      token.colorPrimary,
      token.colorPrimaryHover,
      token.colorText,
      token.colorFillSecondary,
      token.colorError,
      t,
      onEdit,
      onDelete,
      onViewDetail,
      statuses,
    ]
  );

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(r) => r.id}
      loading={loading}
      className="premium-table"
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: onPaginationChange,
        showSizeChanger: false,
        className: "px-6 pb-4",
      }}
      rowClassName={() =>
        "hover:bg-gray-50/50 transition-colors pointer-cursor"
      }
      scroll={{ x: 800 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col gap-2">
                <Text type="secondary">{t("sub_project_page.no_data")}</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onPaginationChange(1)}
                >
                  Clear Filters
                </Button>
              </div>
            }
          />
        ),
      }}
    />
  );
};
