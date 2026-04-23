"use client";

import { UnorderedListOutlined } from "@ant-design/icons";
import { Card, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  LeaveItem,
  useLeaveManagementStore,
} from "../_state/leave-management-store";

export const LeaveTable = () => {
  const { leaves, isLoading, pagination, setFilter, fetchData } =
    useLeaveManagementStore();

  const columns: ColumnsType<LeaveItem> = [
    {
      title: "นักเรียน",
      dataIndex: "student_name",
      key: "student_name",
      sorter: true,
    },
    {
      title: "ประเภทการลา",
      dataIndex: "leave_type",
      key: "leave_type",
      render: (type: string) => (
        <Tag
          color={
            type === "ลาป่วย" ? "red" : type === "ลากิจ" ? "orange" : "blue"
          }
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "ตั้งแต่วันที่",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: true,
    },
    {
      title: "ถึงวันที่",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "เหตุผล",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "อนุมัติ") color = "success";
        if (status === "รออนุมัติ") color = "processing";
        if (status === "ไม่อนุมัติ") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <Card
      title={
        <Typography.Text strong style={{ fontSize: "1rem" }}>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          รายการลาหยุด
        </Typography.Text>
      }
      styles={{ body: { padding: 16 } }}
    >
      <Table
        columns={columns}
        dataSource={leaves}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: pagination.total,
          current: pagination.current_page,
          pageSize: pagination.per_page,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setFilter("page", page);
            setFilter("limit", pageSize);
            fetchData();
          },
        }}
      />
    </Card>
  );
};
