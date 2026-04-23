"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import {
  LeaveItem,
  useLeaveManagementStore,
} from "../_state/leave-management-store";

export const LeaveTable = () => {
  const {
    leaves,
    isLoading,
    isApproving,
    pagination,
    selectedRowKeys,
    setFilter,
    fetchData,
    setSelectedRowKeys,
    clearSelection,
    approveLeave,
    rejectLeave,
  } = useLeaveManagementStore();

  // กำหนด rowSelection สำหรับ batch action
  const rowSelection: TableRowSelection<LeaveItem> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as number[]),
    getCheckboxProps: (record) => ({
      // ปิด checkbox สำหรับรายการที่อนุมัติ/ปฏิเสธไปแล้ว
      disabled:
        record.status === "อนุมัติ" ||
        record.status === "อนุญาต" ||
        record.status === "ไม่อนุญาต" ||
        record.status === "ยกเลิก",
    }),
  };

  const columns: ColumnsType<LeaveItem> = [
    {
      title: "นักเรียน",
      dataIndex: "student_name",
      key: "student_name",
      sorter: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
      title: "ประเภทการลา",
      dataIndex: "leave_type",
      key: "leave_type",
      render: (type: string) => (
        <Tag
          color={
            type === "ลาป่วย"
              ? "red"
              : type === "ลากิจ"
              ? "orange"
              : type.includes("ทำงาน")
              ? "blue"
              : "default"
          }
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "วันที่ยื่นเรื่อง",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "processing";
        if (status === "อนุญาต" || status === "อนุมัติ") color = "success";
        if (status === "รออนุมัติ" || status === "รออนุญาต") color = "warning";
        if (status === "ไม่อนุญาต" || status === "ยกเลิก") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "สถานศึกษา",
      dataIndex: "school_name",
      key: "school_name",
      render: (name?: string) => name || "-",
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, record) => {
        // ซ่อนปุ่มถ้ารายการนี้ตัดสินใจไปแล้ว
        const isSettled =
          record.status === "อนุมัติ" ||
          record.status === "อนุญาต" ||
          record.status === "ไม่อนุญาต" ||
          record.status === "ยกเลิก";

        if (isSettled)
          return <Typography.Text type="secondary">-</Typography.Text>;

        return (
          <Space size="small">
            <Popconfirm
              title="ยืนยันการอนุมัติ"
              description={`อนุมัติการลาของ "${record.student_name}" ?`}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              onConfirm={() => approveLeave([record.id])}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={isApproving}
              >
                อนุมัติ
              </Button>
            </Popconfirm>
            <Popconfirm
              title="ยืนยันการไม่อนุมัติ"
              description={`ไม่อนุมัติการลาของ "${record.student_name}" ?`}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => rejectLeave([record.id])}
            >
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                loading={isApproving}
              >
                ไม่อนุมัติ
              </Button>
            </Popconfirm>
          </Space>
        );
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
      {/* แถบ batch action — แสดงเมื่อเลือกรายการอย่างน้อย 1 รายการ */}
      {selectedRowKeys.length > 0 && (
        <Flex
          align="center"
          justify="space-between"
          style={{
            background: "var(--ant-color-primary-bg)",
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 12,
          }}
        >
          <Typography.Text>
            เลือกแล้ว{" "}
            <Typography.Text strong>{selectedRowKeys.length}</Typography.Text>{" "}
            รายการ
          </Typography.Text>
          <Space>
            <Popconfirm
              title={`ยืนยันอนุมัติ ${selectedRowKeys.length} รายการ`}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              onConfirm={() => approveLeave(selectedRowKeys)}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={isApproving}
              >
                อนุมัติทั้งหมด
              </Button>
            </Popconfirm>
            <Popconfirm
              title={`ยืนยันไม่อนุมัติ ${selectedRowKeys.length} รายการ`}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => rejectLeave(selectedRowKeys)}
            >
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                loading={isApproving}
              >
                ไม่อนุมัติทั้งหมด
              </Button>
            </Popconfirm>
            <Button size="small" onClick={clearSelection}>
              ยกเลิกการเลือก
            </Button>
          </Space>
        </Flex>
      )}

      <Table
        rowSelection={rowSelection}
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
