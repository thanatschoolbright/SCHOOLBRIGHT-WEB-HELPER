"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MailOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Flex,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

const { Text } = Typography;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "รออนุมัติ",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "ปฏิเสธ",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
  paid: {
    label: "จ่ายเงินแล้ว",
    color: "cyan",
    icon: <DollarOutlined />,
  },
  payment_failed: {
    label: "จ่ายเงินล้มเหลว",
    color: "volcano",
    icon: <CloseCircleOutlined />,
  },
};

interface AdminOtTableProps {
  onViewDetail: (record: any) => void;
  onApprove: (id: string | number) => void;
  onReject: (id: string | number) => void;
  onSendMail: (record: any) => void;
  onViewLog: (id: string | number) => void;
  pagination: { current: number; pageSize: number; total: number };
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  selectedKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
}

/**
 * ตาราง OT ฝั่งผู้ดูแลระบบ — แสดงทุกรายการพร้อมปุ่มอนุมัติ/ปฏิเสธ/ส่งเมล/ประวัติสถานะ
 * รองรับ row selection สำหรับ bulk actions
 */
const AdminOtTable: React.FC<AdminOtTableProps> = ({
  onViewDetail,
  onApprove,
  onReject,
  onSendMail,
  onViewLog,
  pagination,
  onTableChange,
  selectedKeys,
  onSelectionChange,
}) => {
  const { dataSource, isLoading } = useAdminOvertimeStore();
  const router = useRouter();

  const columns = useMemo(
    () => [
      {
        title: "รหัส OT",
        dataIndex: "id",
        key: "id",
        sorter: true,
        width: 90,
        render: (id: any) => (
          <Text type="secondary" style={{ fontWeight: 600 }}>
            #{id}
          </Text>
        ),
      },
      {
        title: "พนักงาน",
        key: "requester",
        sorter: false,
        render: (_: any, record: any) => {
          const firstName =
            record.requester_firstname_th || record.requester_name || "";
          const lastName = record.requester_lastname_th || "";
          const fullName = `${firstName} ${lastName}`.trim() || "ไม่ระบุ";
          const empCode = record.requester_employee_code;
          return (
            <Flex align="center" gap={8}>
              <Avatar size={32} icon={<UserOutlined />} />
              <Flex vertical gap={0}>
                <Text style={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {fullName}
                </Text>
                {empCode && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {empCode}
                  </Text>
                )}
              </Flex>
            </Flex>
          );
        },
      },
      {
        title: "แผนก",
        key: "department",
        sorter: false,
        width: 140,
        render: (_: any, record: any) => {
          const dept = record.requester_department || "-";
          return (
            <Text style={{ fontSize: 12 }} type={dept === "-" ? "secondary" : undefined}>
              {dept}
            </Text>
          );
        },
      },
      {
        title: "วันที่ขอ",
        dataIndex: "request_date",
        key: "request_date",
        sorter: true,
        width: 120,
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "-",
      },
      {
        title: "ชั่วโมง OT",
        key: "hours",
        sorter: false,
        width: 110,
        render: (_: any, record: any) => {
          const total = (record.descriptions || []).reduce(
            (s: number, d: any) => s + (Number(d.duration) || 0),
            0,
          );
          return (
            <Badge
              count={`${total} ชม.`}
              style={{
                backgroundColor: total > 0 ? "#1677ff" : "#d9d9d9",
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        sorter: true,
        width: 140,
        filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({
          text: v.label,
          value: k,
        })),
        render: (status: string) => {
          const cfg = STATUS_CONFIG[status] || {
            label: status,
            color: "default",
            icon: null,
          };
          return (
            <Tag color={cfg.color} icon={cfg.icon}>
              {cfg.label}
            </Tag>
          );
        },
      },
      {
        title: "วันที่อัปเดต",
        dataIndex: "updated_at",
        key: "updated_at",
        sorter: true,
        width: 130,
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: "การดำเนินการ",
        key: "actions",
        width: 220,
        fixed: "right" as const,
        render: (_: any, record: any) => {
          const isPending = record.status === "pending";
          return (
            <Space size={4}>
              <Tooltip title="ดูรายละเอียด">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onViewDetail(record)}
                />
              </Tooltip>

              <Tooltip title="พิมพ์ / ดาวน์โหลด PDF">
                <Button
                  size="small"
                  icon={<FilePdfOutlined />}
                  onClick={() =>
                    router.push(`/timesheet/overtime/preview/${record.id}`)
                  }
                />
              </Tooltip>

              <Tooltip title="ประวัติสถานะ">
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => onViewLog(record.id)}
                />
              </Tooltip>

              {isPending && (
                <>
                  <Tooltip title="อนุมัติ">
                    <Popconfirm
                      title="ยืนยันการอนุมัติ?"
                      description={`อนุมัติคำขอ OT #${record.id} ใช่หรือไม่`}
                      onConfirm={() => onApprove(record.id)}
                      okText="อนุมัติ"
                      cancelText="ยกเลิก"
                    >
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                      />
                    </Popconfirm>
                  </Tooltip>

                  <Tooltip title="ปฏิเสธ">
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => onReject(record.id)}
                    />
                  </Tooltip>
                </>
              )}

              <Tooltip title="ส่งอีเมลแจ้งเตือน">
                <Button
                  size="small"
                  icon={<MailOutlined />}
                  onClick={() => onSendMail(record)}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [onViewDetail, onApprove, onReject, onSendMail, onViewLog, router],
  );

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={12}>
        <Flex align="center" gap={8}>
          <UnorderedListOutlined style={{ fontSize: "1rem" }} />
          <Text strong>รายการคำขอ OT ทั้งหมด</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            (แสดงทุกพนักงาน)
          </Text>
          {selectedKeys.length > 0 && (
            <Tag color="blue">เลือกแล้ว {selectedKeys.length} รายการ</Tag>
          )}
        </Flex>

        <Table
          dataSource={dataSource}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 950 }}
          size="small"
          onChange={onTableChange}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: onSelectionChange,
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            pageSizeOptions: ["20", "50", "100"],
          }}
          expandable={{
            expandedRowRender: (record: any) => {
              const descs: any[] = record.descriptions || [];
              if (!descs.length)
                return <Text type="secondary">ไม่มีรายละเอียด</Text>;
              return (
                <Flex vertical gap={4} style={{ paddingLeft: 8 }}>
                  {descs.map((d: any, i: number) => (
                    <Flex key={i} gap={12} align="center">
                      <FileTextOutlined style={{ color: "#1677ff" }} />
                      <Text style={{ fontSize: 12 }}>
                        {d.date
                          ? dayjs(d.date).format("DD/MM/YYYY")
                          : d.startDate
                            ? `${dayjs(d.startDate).format("DD/MM/YYYY")} – ${dayjs(d.endDate).format("DD/MM/YYYY")}`
                            : ""}
                      </Text>
                      <Text style={{ fontSize: 12 }}>
                        {d.duration} ชม. — {d.description || "-"}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              );
            },
          }}
        />
      </Flex>
    </Card>
  );
};

export default AdminOtTable;
