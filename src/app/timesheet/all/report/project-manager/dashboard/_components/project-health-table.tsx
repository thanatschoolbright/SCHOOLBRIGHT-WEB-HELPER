"use client";

import { UnorderedListOutlined } from "@ant-design/icons";
import { Card, Progress, Space, Table, Tag, Typography } from "antd";
import React from "react";
import { usePMDashboardStore } from "../_state/use-pm-dashboard-store";

const { Text } = Typography;

/**
 * ✨ ตารางแสดงสุขภาพโครงการ (Actual vs Estimate)
 */
const ProjectHealthTable: React.FC = () => {
  const { projectHealth, isLoading } = usePMDashboardStore();

  const columns = [
    {
      title: "ชื่อโครงการ",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "ประเมิน (ชม.)",
      dataIndex: "estimate",
      key: "estimate",
      sorter: (a: any, b: any) => a.estimate - b.estimate,
      render: (val: number) => `${val || 0} ชม.`,
    },
    {
      title: "ใช้ไปจริง (ชม.)",
      dataIndex: "actual",
      key: "actual",
      sorter: (a: any, b: any) => a.actual - b.actual,
      render: (val: number, record: any) => (
        <Text
          type={
            val > record.estimate && record.estimate > 0
              ? "danger"
              : "secondary"
          }
        >
          {val || 0} ชม.
        </Text>
      ),
    },
    {
      title: "ความคืบหน้า (สุขภาพ)",
      key: "health",
      render: (_: any, record: any) => (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Progress
            percent={record.percent}
            size="small"
            status={record.percent > 100 ? "exception" : "active"}
            strokeColor={
              record.percent > 100
                ? "#ff4d4f"
                : record.percent > 80
                  ? "#faad14"
                  : "#52c41a"
            }
          />
          <Text style={{ fontSize: "12px" }}>
            {record.percent}% ของชั่วโมงประเมิน
          </Text>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "processing";
        if (status === "Over Budget") color = "error";
        if (status === "Warning") color = "warning";
        if (status === "Healthy") color = "success";
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UnorderedListOutlined style={{ fontSize: "1rem" }} />
          <span>ตรวจสอบสุขภาพโครงการ</span>
        </Space>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table
        columns={columns}
        dataSource={projectHealth}
        loading={isLoading}
        pagination={{ pageSize: 5 }}
        rowKey="id"
        locale={{ emptyText: "ไม่พบข้อมูลสุขภาพโครงการ" }}
      />
    </Card>
  );
};

export default ProjectHealthTable;
