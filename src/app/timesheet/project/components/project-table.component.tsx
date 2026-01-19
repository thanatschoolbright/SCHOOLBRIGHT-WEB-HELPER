import React, { useMemo } from "react";
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
  Avatar,
  theme,
  Progress,
  Flex,
  Steps,
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
  UserOutlined,
  CheckCircleFilled,
  HistoryOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { getUserById } from "@helpers/local_storage/user.storage";

import type { Project, ProjectStatus } from "../types/project.types";

const { Text } = Typography;

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
  onShowTracking: (record: Project) => void;
  statuses?: ProjectStatus[];
}

/**
 * Status Tracker Component (Delivery Tracking style)
 */
export const StatusTracker: React.FC<{
  currentStatus: string;
  allStatuses: ProjectStatus[];
  token: any;
  direction?: "horizontal" | "vertical";
}> = ({ currentStatus, allStatuses, token, direction = "horizontal" }) => {
  const sortedStatuses = useMemo(() => {
    return [...allStatuses]
      .filter((s) => s.priority < 99)
      .sort((a, b) => a.priority - b.priority);
  }, [allStatuses]);

  const matchedStatus = allStatuses.find((s) => s.nameTh === currentStatus);
  const currentPriority = matchedStatus?.priority || 0;
  const isOnHold =
    matchedStatus?.priority === 99 || currentStatus === "On Hold";

  // If status is "open" or "close" but not in ProjectStatus list
  let activeStep = -1;
  if (currentStatus === "close") {
    activeStep = sortedStatuses.length;
  } else if (matchedStatus) {
    activeStep = sortedStatuses.findIndex((s) => s.id === matchedStatus.id);
  }

  if (isOnHold) {
    return (
      <Tag
        color="error"
        icon={<ClockCircleOutlined />}
        className="px-3 py-1 rounded-full font-bold"
      >
        ระงับชั่วคราว (ON HOLD)
      </Tag>
    );
  }

  return (
    <div
      style={{
        minWidth: direction === "horizontal" ? 280 : "100%",
        padding: "8px 0",
      }}
    >
      <Steps
        size="small"
        current={currentStatus === "close" ? sortedStatuses.length : activeStep}
        labelPlacement={direction === "horizontal" ? "vertical" : "horizontal"}
        direction={direction}
        items={sortedStatuses.map((s) => ({
          title: (
            <span
              style={{
                fontSize: 13,
                fontWeight: activeStep >= sortedStatuses.indexOf(s) ? 600 : 400,
                opacity: activeStep >= sortedStatuses.indexOf(s) ? 1 : 0.4,
              }}
            >
              {s.nameTh}
            </span>
          ),
          description:
            direction === "vertical" &&
            activeStep === sortedStatuses.indexOf(s) ? (
              <Tag color="processing" bordered={false} style={{ marginTop: 4 }}>
                กำลังดำเนินการ
              </Tag>
            ) : null,
        }))}
      />
      {direction === "horizontal" && (
        <div style={{ marginTop: 8 }}>
          {matchedStatus ? (
            <Badge
              status="processing"
              text={
                <Text
                  strong
                  style={{ fontSize: 12, color: token.colorPrimary }}
                >
                  {matchedStatus.nameTh}
                </Text>
              }
            />
          ) : currentStatus === "close" ? (
            <Badge
              status="success"
              text={
                <Text
                  strong
                  style={{ fontSize: 12, color: token.colorSuccess }}
                >
                  เสร็จสิ้น/ส่งมอบ
                </Text>
              }
            />
          ) : (
            <Badge
              status="default"
              text={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentStatus}
                </Text>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

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
  onShowTracking,
  statuses = [],
}) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  const getSubProjectCount = (features?: Array<{ is_deleted: boolean }>) => {
    return features?.filter((f) => !f.is_deleted).length || 0;
  };

  const columns: ColumnsType<Project> = [
    {
      title: "ลำดับ",
      key: "index",
      align: "center",
      width: 70,
      render: (_, __, idx) => (
        <Text strong style={{ color: token.colorTextSecondary }}>
          {(pagination.current - 1) * pagination.pageSize + idx + 1}
        </Text>
      ),
    },
    {
      title: "ข้อมูลโครงการ",
      key: "project_name",
      width: 350,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => {
        const isDeleted = record.is_deleted === true;
        return (
          <Flex gap={16} align="start">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDeleted
                  ? token.colorErrorBg
                  : `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorInfoBgHover} 100%)`,
                border: `1px solid ${
                  isDeleted ? token.colorErrorBorder : token.colorInfoBorder
                }`,
                boxShadow: "none",
              }}
            >
              <ProjectOutlined
                style={{
                  color: isDeleted ? token.colorError : token.colorPrimary,
                  fontSize: 22,
                }}
              />
            </div>
            <Flex vertical gap={2} style={{ flex: 1 }}>
              <Space size={4}>
                <Text
                  strong
                  style={{
                    fontSize: 15,
                    color: isDeleted
                      ? token.colorTextDisabled
                      : token.colorTextHeading,
                    textDecoration: isDeleted ? "line-through" : "none",
                  }}
                >
                  {record.name}
                </Text>
                {isDeleted && <Tag color="error">ลบแล้ว</Tag>}
              </Space>
              {record.name_en && (
                <Text
                  type="secondary"
                  style={{ fontSize: 13, fontStyle: "italic" }}
                >
                  {record.name_en}
                </Text>
              )}
              <Flex gap={8} style={{ marginTop: 4 }}>
                <Tag
                  bordered={false}
                  style={{
                    fontSize: 11,
                    background: token.colorFillTertiary,
                    margin: 0,
                    borderRadius: 4,
                  }}
                >
                  ID: {String(record.id).padStart(4, "0")}
                </Tag>
                <Tag
                  bordered={false}
                  color="blue"
                  style={{ fontSize: 11, margin: 0, borderRadius: 4 }}
                >
                  {getCategoryName(record.categoryType || "")}
                </Tag>
              </Flex>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "ผู้รับผิดชอบ",
      key: "assignees",
      width: 180,
      render: (_, record) => {
        const assignees = record.projectAssignees || [];
        if (assignees.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ยังไม่มีคนรับผิดชอบ
            </Text>
          );
        }

        return (
          <Avatar.Group
            max={{
              count: 4,
              style: {
                color: token.colorWhite,
                backgroundColor: token.colorPrimary,
                cursor: "pointer",
              },
            }}
            size="large"
          >
            {assignees.map((a, i) => {
              const u = getUserById(a.userId);
              return (
                <Tooltip
                  key={i}
                  title={
                    <div style={{ textAlign: "center" }}>
                      <Text strong style={{ color: "white" }}>
                        {u?.firstname} {u?.lastname}
                      </Text>
                      <br />
                      <Text
                        style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}
                      >
                        {a.position || "Member"}
                      </Text>
                    </div>
                  }
                >
                  <Avatar
                    src={u?.profile_image}
                    style={{
                      backgroundColor: token.colorPrimary,
                      border: `2px solid ${token.colorBgContainer}`,
                    }}
                  >
                    {u?.firstname?.[0] || <UserOutlined />}
                  </Avatar>
                </Tooltip>
              );
            })}
          </Avatar.Group>
        );
      },
    },
    {
      title: "สถานะปัจจุบัน",
      key: "current_status_tag",
      width: 160,
      render: (_, record) => {
        const matchedStatus = statuses.find((s) => s.nameTh === record.status);
        if (record.status === "close")
          return <Tag color="success">เสร็จสิ้น</Tag>;
        if (matchedStatus)
          return <Tag color="processing">{matchedStatus.nameTh}</Tag>;
        return <Tag color="default">{record.status || "Open"}</Tag>;
      },
    },
    {
      title: "ระยะเวลา / กายภาพ",
      key: "duration_metrics",
      width: 200,
      render: (_, record) => {
        const count = getSubProjectCount(record.features);
        return (
          <Flex vertical gap={8}>
            {record.start_date && record.end_date ? (
              <Tooltip
                title={`ระยะเวลา: ${convertToThaiDateDDMMYYY(
                  record.start_date
                )} - ${convertToThaiDateDDMMYYY(record.end_date)}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <CalendarOutlined
                    style={{ color: token.colorTextSecondary }}
                  />
                  <Text style={{ fontSize: 11 }}>
                    {dayjs(record.start_date).format("DD/MM/YY")} -{" "}
                    {dayjs(record.end_date).format("DD/MM/YY")}
                  </Text>
                </div>
              </Tooltip>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ไม่มีกำหนดวันที่
              </Text>
            )}

            <Flex gap={8} align="center">
              <Tooltip title="ฟีเจอร์ย่อย">
                <Badge
                  count={count}
                  showZero
                  style={{
                    backgroundColor:
                      count > 0 ? "#722ed1" : token.colorTextDisabled,
                    boxShadow: "none",
                  }}
                />
              </Tooltip>
              <Tooltip title="ประมาณการชั่วโมงการทำงาน">
                <Tag
                  icon={<ClockCircleOutlined />}
                  color="orange"
                  style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}
                >
                  {(record.estimate_hour || 0).toLocaleString()} ชม.
                </Tag>
              </Tooltip>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "detail",
            label: "ดูรายละเอียดเชิงลึก",
            icon: <InfoCircleOutlined />,
            onClick: () => onViewDetail(record),
          },
          {
            key: "assign",
            label: "จัดการผู้รับผิดชอบ",
            icon: <TeamOutlined />,
            onClick: () => onShowAssignees(record),
          },
          {
            key: "tracking",
            label: "ดูความคืบหน้า (Tracking)",
            icon: <HistoryOutlined />,
            onClick: () => onShowTracking(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            label: "ลบโครงการ",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(record),
          },
        ];

        return (
          <Flex gap={8} justify="center">
            <Tooltip title="Tracking">
              <Button
                type="text"
                shape="circle"
                icon={<HistoryOutlined style={{ color: token.colorInfo }} />}
                onClick={() => onShowTracking(record)}
                style={{ background: token.colorInfoBg }}
              />
            </Tooltip>
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                shape="circle"
                icon={<EditOutlined style={{ color: token.colorWarning }} />}
                onClick={() => onEdit(record)}
                style={{ background: token.colorWarningBg }}
              />
            </Tooltip>
            <Tooltip title="เข้าสู่โครงการ">
              <Link href={`/timesheet/project/sub-project/${record.id}`}>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<ArrowRightOutlined />}
                  style={{
                    boxShadow: "none",
                  }}
                />
              </Link>
            </Tooltip>
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button type="text" shape="circle" icon={<MoreOutlined />} />
            </Dropdown>
          </Flex>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card bordered={false}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  return (
    <Table
      rowKey={(r) => r.id}
      columns={columns}
      dataSource={projects}
      loading={loading}
      className="modern-project-table"
      pagination={{
        ...pagination,
        total: projects.length,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        onChange: onPaginationChange,
        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
      }}
      scroll={{ x: 1300 }}
      rowClassName={(record) => (record.is_deleted ? "deleted-row" : "")}
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
      }}
    />
  );
};
