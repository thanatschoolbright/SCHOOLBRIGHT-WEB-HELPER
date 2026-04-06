"use client";

import {
  BellOutlined,
  CheckCircleFilled,
  CheckCircleTwoTone,
  ClockCircleOutlined,
  CopyOutlined,
  DownOutlined,
  ExclamationCircleTwoTone,
  FireFilled,
  MailOutlined,
  ProjectOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Flex,
  MenuProps,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ExpandableConfig } from "antd/es/table/interface";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
  selectFilteredRecords,
  TimesheetEntry,
  TimesheetRecord,
  useDescriptionStore,
} from "../_stores/description-store";

const { Text, Title } = Typography;

// ====================================================================
// Expandable row: แสดงรายละเอียดงานแต่ละ entry
// ====================================================================
const EntryDetailRow: React.FC<{ entries: TimesheetEntry[] }> = ({
  entries,
}) => {
  const { token } = theme.useToken();

  if (entries.length === 0) {
    return (
      <Flex justify="center" style={{ padding: "16px 0" }}>
        <Text type="secondary" italic>
          ไม่พบข้อมูลการบันทึกงาน
        </Text>
      </Flex>
    );
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: token.colorFillQuaternary,
      }}
    >
      <Row gutter={[12, 12]}>
        {entries.map((entry, idx) => (
          <Col key={idx} xs={24} sm={12} lg={8} xl={6}>
            <Card
              size="small"
              styles={{ body: { padding: "10px 14px" } }}
              style={{
                borderLeft: `3px solid ${token.colorPrimary}`,
                backgroundColor: token.colorBgContainer,
                height: "100%",
              }}
            >
              <Flex vertical gap={6}>
                {/* Project + hours */}
                <Flex justify="space-between" align="center">
                  <Space size={4}>
                    <ProjectOutlined
                      style={{ color: token.colorPrimary, fontSize: 12 }}
                    />
                    <Text strong style={{ fontSize: 12 }}>
                      {entry.project_name}
                    </Text>
                  </Space>
                  <Tag color="processing" style={{ margin: 0, fontSize: 11 }}>
                    {entry.hours} ชม.
                  </Tag>
                </Flex>

                {/* Feature */}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {entry.feature_name}
                </Text>

                {/* Description */}
                {entry.description && (
                  <Text
                    style={{
                      fontSize: 12,
                      whiteSpace: "pre-line",
                      color: token.colorText,
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      paddingTop: 6,
                    }}
                  >
                    {entry.description}
                  </Text>
                )}

                {/* Note */}
                {entry.backlogDescription.note && (
                  <Text italic type="warning" style={{ fontSize: 11 }}>
                    หมายเหตุ: {entry.backlogDescription.note}
                  </Text>
                )}
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// ====================================================================
// Main Table Section
// ====================================================================
export const TableSection: React.FC = () => {
  const { token } = theme.useToken();

  const loading = useDescriptionStore((s) => s.loading);
  const notifyLoading = useDescriptionStore((s) => s.notifyLoading);
  const sendNotify = useDescriptionStore((s) => s.sendNotify);
  const sendEmployeeNotify = useDescriptionStore((s) => s.sendEmployeeNotify);
  const openEmployeeNotifyDrawer = useDescriptionStore(
    (s) => s.openEmployeeNotifyDrawer,
  );
  const filteredRecords = useDescriptionStore(
    useShallow(selectFilteredRecords),
  );

  const notifyMenuItems: MenuProps["items"] = [
    {
      key: "all",
      icon: <BellOutlined />,
      label: "แจ้งเตือนทุกช่องทาง (Email + Discord)",
      onClick: () => sendNotify("all"),
    },
    {
      key: "email",
      icon: <MailOutlined />,
      label: "แจ้งเตือนผ่าน Email เท่านั้น",
      onClick: () => sendNotify("email"),
    },
    {
      key: "discord",
      label: "แจ้งเตือนผ่าน Discord เท่านั้น",
      onClick: () => sendNotify("discord"),
    },
    { type: "divider" },
    {
      key: "employee-notify",
      icon: <TeamOutlined />,
      label: "แจ้งเตือนอีเมลพนักงานไม่ลงเวลา (ทีละคน)",
      onClick: () => openEmployeeNotifyDrawer(),
    },
    {
      key: "employee-notify-dry",
      icon: <MailOutlined />,
      label: "[Dry Run] ดูรายชื่อที่จะแจ้งเตือน (ไม่ส่งจริง)",
      onClick: () => sendEmployeeNotify(true),
    },
  ];

  // คัดลอกรายชื่อผู้ที่ยังลงเวลาไม่ครบถ้วนไปยัง Clipboard
  const requestCopyIncompleteList = useCallback(() => {
    const incompleteList = filteredRecords.filter((rec) => rec.hours_gap > 0);
    if (incompleteList.length === 0) {
      toast.info("ไม่พบรายชื่อผู้ที่ยังลงเวลาไม่ครบถ้วน");
      return;
    }
    const title = `รายงานผู้ยังไม่ลงเวลาวันนี้ โปรดลงเวลาให้ครบถ้วน\n`;
    const body = incompleteList
      .map(
        (rec, index) =>
          `ลำดับที่ ${index + 1}\nรหัสพนักงาน ${rec.employee_code}\n${
            rec.full_name
          }${
            rec.nickname ? ` (${rec.nickname})` : ""
          }\nจำนวนชั่วโมงที่ลงวันนี้ : ${rec.progress_text} (ขาด ${
            rec.hours_gap
          } ชั่วโมง)`,
      )
      .join("\n\n");

    navigator.clipboard
      .writeText(`${title}\n${body}`)
      .then(() => toast.success("คัดลอกรายชื่อผู้ยังไม่ลงเวลาสำเร็จ"))
      .catch(() => toast.error("ไม่สามารถคัดลอกข้อมูลได้"));
  }, [filteredRecords]);

  const columns: ColumnsType<TimesheetRecord> = [
    {
      title: "พนักงาน",
      key: "employee",
      fixed: "left",
      width: 240,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.image_profile}
            icon={<UserOutlined />}
            size={36}
            style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
          />
          <Flex vertical gap={1}>
            <Text strong style={{ fontSize: 13 }}>
              {record.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.nickname ? `${record.nickname} · ` : ""}
              <span style={{ fontFamily: "monospace" }}>
                {record.employee_code}
              </span>
            </Text>
          </Flex>
        </Space>
      ),
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: "แผนก / ตำแหน่ง",
      key: "department",
      width: 180,
      render: (_, record) => (
        <Flex vertical gap={1}>
          <Text style={{ fontSize: 13 }}>{record.department}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.position}
          </Text>
        </Flex>
      ),
      sorter: (a, b) => a.department.localeCompare(b.department),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => {
        const isComplete = record.hours_gap <= 0;
        const isOT = record.total_hours > 8;
        return (
          <Tag
            color={isOT ? "warning" : isComplete ? "success" : "error"}
            icon={
              isOT ? (
                <FireFilled style={{ color: "#fa8c16" }} />
              ) : isComplete ? (
                <CheckCircleTwoTone twoToneColor={token.colorSuccess} />
              ) : (
                <ExclamationCircleTwoTone twoToneColor={token.colorError} />
              )
            }
            style={{ borderRadius: 12, padding: "2px 12px" }}
          >
            {isOT ? "เกิน 8 ชม." : record.status_label}
          </Tag>
        );
      },
      sorter: (a, b) => a.hours_gap - b.hours_gap,
    },
    {
      title: "ชั่วโมงที่บันทึก",
      key: "progress",
      width: 200,
      align: "center",
      render: (_, record) => {
        const isOT = record.total_hours > 8;
        const isComplete = record.hours_gap <= 0;
        const progressColor = isOT
          ? token.colorWarning
          : isComplete
          ? token.colorSuccess
          : token.colorError;
        const percent = Math.min(record.completion_rate, 100);

        return (
          <Flex vertical align="center" gap={4}>
            <Text strong style={{ color: progressColor, fontSize: 14 }}>
              {record.progress_text}
            </Text>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={progressColor}
              trailColor={token.colorFillSecondary}
              style={{ width: 120, margin: 0 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.completion_rate}%
            </Text>
          </Flex>
        );
      },
      sorter: (a, b) => a.completion_rate - b.completion_rate,
    },
    {
      title: "งานที่บันทึก",
      key: "entries_summary",
      width: 280,
      render: (_, record) => {
        if (record.entries.length === 0) {
          return (
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              ยังไม่ได้บันทึกงาน
            </Text>
          );
        }

        // สรุปโปรเจคพร้อมชั่วโมงรวมต่อโปรเจค
        const projectMap: Record<string, number> = {};
        record.entries.forEach((e) => {
          projectMap[e.project_name] =
            (projectMap[e.project_name] ?? 0) + e.hours;
        });

        return (
          <Flex wrap="wrap" gap={4}>
            {Object.entries(projectMap).map(([project, hours]) => (
              <Tooltip key={project} title={`${project} — ${hours} ชม.`}>
                <Tag
                  icon={<ProjectOutlined />}
                  color="default"
                  style={{ fontSize: 11, cursor: "default", margin: 0 }}
                >
                  {project.length > 14 ? `${project.slice(0, 14)}…` : project}
                  <Text
                    style={{
                      fontSize: 10,
                      color: token.colorPrimary,
                      marginLeft: 4,
                      fontWeight: 600,
                    }}
                  >
                    {hours}h
                  </Text>
                </Tag>
              </Tooltip>
            ))}
            {record.entries.length > 0 && (
              <Tag
                icon={<ClockCircleOutlined />}
                color="geekblue"
                style={{ fontSize: 11, margin: 0 }}
              >
                {record.entries.length} รายการ
              </Tag>
            )}
          </Flex>
        );
      },
    },
    {
      title: "",
      key: "complete_icon",
      width: 40,
      align: "center",
      render: (_, record) =>
        record.hours_gap <= 0 ? (
          <CheckCircleFilled
            style={{ color: token.colorSuccess, fontSize: 16 }}
          />
        ) : null,
    },
  ];

  const expandable: ExpandableConfig<TimesheetRecord> = {
    expandedRowRender: (record: TimesheetRecord) => (
      <EntryDetailRow entries={record.entries} />
    ),
    rowExpandable: (record: TimesheetRecord) => record.entries.length > 0,
    expandRowByClick: false,
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Space size={12}>
            <UnorderedListOutlined
              style={{ fontSize: "1rem", color: token.colorPrimary }}
            />
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              ตารางสรุปการลงเวลาประจำวัน
            </Title>
            {!loading && (
              <Badge
                count={filteredRecords.length}
                style={{ backgroundColor: token.colorInfo }}
              />
            )}
          </Space>
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={requestCopyIncompleteList}
              disabled={loading || filteredRecords.length === 0}
              shape="round"
            >
              คัดลอกรายชื่อ
            </Button>
            <Dropdown
              menu={{ items: notifyMenuItems }}
              trigger={["click"]}
              disabled={loading || filteredRecords.length === 0}
            >
              <Button
                type="primary"
                icon={<BellOutlined />}
                loading={notifyLoading}
                shape="round"
              >
                ส่งแจ้งเตือน <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        </Flex>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredRecords}
          loading={loading}
          rowKey="admin_id"
          expandable={expandable}
          scroll={{ x: 1100 }}
          size="middle"
          rowClassName={(record) =>
            record.hours_gap <= 0 ? "" : "table-row-incomplete"
          }
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
        />
      </Flex>
    </Card>
  );
};
