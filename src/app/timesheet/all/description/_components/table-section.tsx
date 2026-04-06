"use client";

import {
  CheckCircleTwoTone,
  CopyOutlined,
  ExclamationCircleTwoTone,
  FireFilled,
  ProjectOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Flex,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
  selectFilteredRecords,
  TimesheetRecord,
  useDescriptionStore,
} from "../_stores/description-store";

const { Text, Title } = Typography;

/**
 * ส่วนแสดงตารางสรุปการลงเวลาประจำวัน พร้อมปุ่มคัดลอกรายชื่อผู้ยังไม่ลง
 */
export const TableSection: React.FC = () => {
  const { token } = theme.useToken();

  const loading = useDescriptionStore((s) => s.loading);
  const filteredRecords = useDescriptionStore(useShallow(selectFilteredRecords));

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
          `ลำดับที่ ${index + 1}\nรหัสพนักงาน ${rec.employee_code}\n${rec.full_name}${rec.nickname ? ` (${rec.nickname})` : ""}\nจำนวนชั่วโมงที่ลงวันนี้ : ${rec.progress_text} (ขาด ${rec.hours_gap} ชั่วโมง)`,
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
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.image_profile}
            icon={<UserOutlined />}
            style={{ backgroundColor: token.colorPrimary }}
          />
          <Flex vertical>
            <Text strong>{record.full_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nickname ? `${record.nickname} | ` : ""}
              {record.employee_code}
            </Text>
          </Flex>
        </Space>
      ),
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: "แผนก/ตำแหน่ง",
      key: "department",
      width: 200,
      render: (_, record) => (
        <Flex vertical>
          <Text>{record.department}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.position}
          </Text>
        </Flex>
      ),
      sorter: (a, b) => a.department.localeCompare(b.department),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 150,
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
            style={{ borderRadius: 12, padding: "0 12px" }}
          >
            {isOT ? "เกิน 8 ชั่วโมง" : record.status_label}
          </Tag>
        );
      },
      sorter: (a, b) => a.hours_gap - b.hours_gap,
    },
    {
      title: "เวลาที่บันทึก",
      key: "progress",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Flex vertical align="center">
          <Text
            strong
            style={{
              color:
                record.total_hours > 8
                  ? token.colorWarning
                  : record.hours_gap > 0
                    ? token.colorError
                    : token.colorSuccess,
            }}
          >
            {record.progress_text}
          </Text>
          <Badge
            status={
              record.total_hours > 8
                ? "warning"
                : record.hours_gap > 0
                  ? "error"
                  : "success"
            }
            text={`${record.completion_rate}%`}
          />
        </Flex>
      ),
      sorter: (a, b) => a.completion_rate - b.completion_rate,
    },
    {
      title: "รายละเอียดงาน",
      key: "entries",
      render: (_, record) => (
        <Flex vertical gap={8}>
          {record.entries.length > 0 ? (
            record.entries.map((entry, idx) => (
              <Card
                key={idx}
                size="small"
                styles={{ body: { padding: "8px 12px" } }}
                style={{
                  backgroundColor: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex vertical gap={4}>
                  <Flex justify="space-between">
                    <Space>
                      <ProjectOutlined style={{ color: token.colorPrimary }} />
                      <Text strong style={{ fontSize: 13 }}>
                        {entry.project_name}
                      </Text>
                    </Space>
                    <Tag color="processing" style={{ margin: 0 }}>
                      {entry.hours} ชม.
                    </Tag>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ฟีเจอร์: {entry.feature_name}
                  </Text>
                  <Text style={{ fontSize: 13, whiteSpace: "pre-line" }}>
                    {entry.description || "-"}
                  </Text>
                  {entry.backlogDescription.note && (
                    <Text italic type="warning" style={{ fontSize: 12 }}>
                      หมายเหตุ: {entry.backlogDescription.note}
                    </Text>
                  )}
                </Flex>
              </Card>
            ))
          ) : (
            <Text type="secondary" italic>
              ไม่พบข้อมูลการบันทึกงาน
            </Text>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
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
          <Button
            icon={<CopyOutlined />}
            onClick={requestCopyIncompleteList}
            disabled={loading || filteredRecords.length === 0}
            shape="round"
          >
            คัดลอกรายชื่อผู้ยังไม่ลง Timesheet
          </Button>
        </Flex>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          loading={loading}
          rowKey="admin_id"
          scroll={{ x: 1200 }}
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
