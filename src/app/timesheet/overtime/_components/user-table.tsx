"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  MailOutlined,
  UnorderedListOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
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
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";
import { useOvertimeStore } from "../_state/overtime-store";

const { Text } = Typography;

const OT_STATUS = [
  { text: "รออนุมัติ", value: "pending", color: "gold" },
  { text: "อนุมัติ", value: "approved", color: "green" },
  { text: "ปฏิเสธ", value: "rejected", color: "red" },
  { text: "จ่าย OT สำเร็จ", value: "paid", color: "cyan" },
  { text: "จ่าย OT ล้มเหลว", value: "payment_failed", color: "volcano" },
];

interface UserTableProps {
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  onViewDetail: (record: any) => void;
  onEdit: (record: any) => void;
  onDelete: (id: string | number) => void;
  onApprove: (id: string | number) => void;
  onSendMail: (record: any) => void;
  onShowAnalytics: () => void;
  onShowExport: () => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

/**
 * คอมโพเนนต์แสดงตารางรายการคำขอ OT ทั้งหมด
 * แยก Logic การแสดงผลและการจัดการ Action Buttons ตามมาตรฐาน Modular Architecture
 */
const UserTable: React.FC<UserTableProps> = ({
  onTableChange,
  onViewDetail,
  onEdit,
  onDelete,
  onApprove,
  onSendMail,
  onShowAnalytics,
  onShowExport,
  selectedRowKeys,
  setSelectedRowKeys,
  pagination,
}) => {
  const { token } = theme.useToken();
  const { overtimeDataSource, isLoadingOvertimeData } = useOvertimeStore();

  /**
   * ระบบตรวจสอบความสมบูรณ์ของข้อมูลเบื้องต้น
   */
  const validateOvertimeRecordCompleteness = (record: any) => {
    const firstDescription = record.descriptions?.[0];
    const proofData = firstDescription?.proof || {};
    const missingItems = [];

    if (!proofData.signature_1) missingItems.push("ลายเซ็นรับรอง");
    const requiredImageKeys = ["image_1", "image_2", "image_3", "image_4"];
    const missingImages = requiredImageKeys.filter((key) => !proofData[key]);
    if (missingImages.length > 0) {
      const displayIndices = missingImages.map((k) => k.split("_")[1]);
      missingItems.push(`รูปภาพหลักฐานชุดที่ ${displayIndices.join(", ")}`);
    }

    const hasEmptyDescription =
      !record.descriptions ||
      record.descriptions.length === 0 ||
      record.descriptions.some((d: any) => !d.description?.trim());
    if (hasEmptyDescription) missingItems.push("รายละเอียดภาระงาน");

    return missingItems;
  };

  const columns = [
    {
      title: "",
      key: "completeness_alert",
      width: 50,
      render: (record: any) => {
        const errors = validateOvertimeRecordCompleteness(record);
        if (errors.length === 0) return null;
        return (
          <Tooltip
            title={
              <Flex vertical gap={4}>
                <Text strong style={{ color: "#fff", fontSize: 12 }}>
                  <WarningOutlined style={{ marginRight: 8 }} />
                  ข้อมูลไม่ครบถ้วน
                </Text>
                {errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 11 }}>
                    - {err}
                  </div>
                ))}
              </Flex>
            }
          >
            <Badge dot status="warning">
              <WarningOutlined
                style={{ color: token.colorWarning, fontSize: 18 }}
              />
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      title: "รหัสอ้างอิง",
      dataIndex: "id",
      key: "id",
      width: 120,
      sorter: true,
      render: (id: string) => (
        <Text strong style={{ color: token.colorPrimary }}>
          OT-{String(id).padStart(4, "0")}
        </Text>
      ),
    },
    {
      title: "พนักงานผู้ยื่นคำขอ",
      key: "requester",
      width: 280,
      sorter: true,
      render: (record: any) => {
        const localUser = getUserById(record.requester_id);
        const userObj = localUser || record.requester_user;
        const name = userObj
          ? `${userObj.firstname || ""} ${userObj.lastname || ""}`.trim() ||
            record.requester_name
          : record.requester_name;

        return (
          <Flex align="center" gap={12}>
            <Avatar
              size={40}
              src={userObj?.profile_image}
              icon={<UserOutlined />}
            />
            <Flex vertical>
              <Text strong>{name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {record.requester_id}
              </Text>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "วันที่ขอ OT",
      dataIndex: "request_date",
      key: "request_date",
      width: 150,
      sorter: true,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        const config = OT_STATUS.find((s) => s.value === status) || {
          text: status,
          color: "default",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 220,
      fixed: "right" as const,
      render: (record: any) => (
        <Space size="middle">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
          {record.status === "pending" && (
            <>
              <Tooltip title="แก้ไข">
                <Button
                  type="text"
                  icon={<EditOutlined style={{ color: token.colorWarning }} />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="ยืนยันการอนุมัติคำขอ?"
                onConfirm={() => onApprove(record.id)}
              >
                <Tooltip title="อนุมัติทันที">
                  <Button
                    type="text"
                    icon={
                      <CheckCircleOutlined
                        style={{ color: token.colorSuccess }}
                      />
                    }
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          <Tooltip title="ส่งอีเมลแจ้ง HR">
            <Button
              type="text"
              icon={<MailOutlined style={{ color: token.colorInfo }} />}
              onClick={() => onSendMail(record)}
            />
          </Tooltip>
          <Popconfirm
            title="ยืนยันการลบรายการ?"
            description="การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            onConfirm={() => onDelete(record.id)}
            okText="ลบข้อมูล"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="ลบรายการ">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex vertical gap={16}>
        {/* Header ส่วนของตารางและ Action Buttons */}
        <Flex justify="space-between" align="center">
          <Space>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Text strong style={{ fontSize: "1rem" }}>
              รายการคำขอ OT ทั้งหมดในระบบ
            </Text>
          </Space>

          <Space>
            <Button icon={<BarChartOutlined />} onClick={onShowAnalytics}>
              ดูสถิติภาพรวม
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={onShowExport}
            >
              ส่งออกรายงาน
            </Button>
          </Space>
        </Flex>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={overtimeDataSource}
          loading={isLoadingOvertimeData}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `รวมทั้งหมด ${total} รายการ`,
          }}
          onChange={onTableChange}
          scroll={{ x: 1200 }}
          style={{ borderRadius: 12 }}
        />
      </Flex>
    </Card>
  );
};

export default UserTable;
