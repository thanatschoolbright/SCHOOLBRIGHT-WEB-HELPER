"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
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
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useOvertimeStore } from "../_state/overtime-store";

const QUOTA_STORAGE_KEY = "sb_ot_quota_per_employee";
const DEFAULT_QUOTA_HOURS = 20;

/** โหลด quota map จาก localStorage: { [requester_id]: hours } */
const loadQuotaMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/** บันทึก quota map ลง localStorage */
const persistQuotaMap = (map: Record<string, number>) => {
  localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(map));
};

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
  /** ปฏิเสธคำขอ OT พร้อมเหตุผล */
  onReject: (id: string | number, reason: string) => void;
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
  onReject,
  onSendMail,
  onShowAnalytics,
  onShowExport,
  selectedRowKeys,
  setSelectedRowKeys,
  pagination,
}) => {
  const { token } = theme.useToken();
  const { overtimeDataSource, isLoadingOvertimeData } = useOvertimeStore();

  // จัดการ state เหตุผลการปฏิเสธแยกตาม record id
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [rejectOpenMap, setRejectOpenMap] = useState<Record<string, boolean>>({});

  // Quota state — โหลดจาก localStorage
  const [quotaMap, setQuotaMap] = useState<Record<string, number>>(() => loadQuotaMap());
  // เก็บ draft quota ขณะ inline edit
  const [editingQuota, setEditingQuota] = useState<Record<string, number>>({});

  /** คำนวณ hours OT รวมของแต่ละคนเดือนปัจจุบัน (approved/paid เท่านั้น) */
  const usedHoursByEmployee = useMemo(() => {
    const currentMonthKey = dayjs().format("YYYY-MM");
    const map: Record<string, number> = {};
    overtimeDataSource.forEach((record: any) => {
      if (!["approved", "paid", "payment_failed"].includes(record.status || "")) return;
      const dateKey = dayjs(record.request_date).format("YYYY-MM");
      if (dateKey !== currentMonthKey) return;
      const id = String(record.requester_id || "");
      const hrs = (record.descriptions || []).reduce(
        (s: number, d: any) => s + Number(d.duration || 0), 0,
      );
      map[id] = (map[id] || 0) + hrs;
    });
    return map;
  }, [overtimeDataSource]);

  /** อัปเดต quota ของพนักงาน */
  const handleSaveQuota = (requesterId: string) => {
    const newVal = editingQuota[requesterId] ?? DEFAULT_QUOTA_HOURS;
    const updated = { ...quotaMap, [requesterId]: newVal };
    setQuotaMap(updated);
    persistQuotaMap(updated);
    setEditingQuota((prev) => {
      const next = { ...prev };
      delete next[requesterId];
      return next;
    });
  };

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

        const empId = String(record.requester_id || "");
        const quota = quotaMap[empId] ?? DEFAULT_QUOTA_HOURS;
        const used = usedHoursByEmployee[empId] || 0;
        const isOverQuota = used > quota;

        return (
          <Flex align="center" gap={12}>
            <Badge
              dot
              status={isOverQuota ? "error" : "default"}
              offset={[-4, 36]}
            >
              <Avatar
                size={40}
                src={userObj?.profile_image}
                icon={<UserOutlined />}
              />
            </Badge>
            <Flex vertical>
              <Flex align="center" gap={6}>
                <Text strong>{name}</Text>
                {isOverQuota && (
                  <Tooltip title={`เกิน Quota ${(used - quota).toFixed(1)} ชม. เดือนนี้`}>
                    <WarningOutlined style={{ color: token.colorError, fontSize: 13 }} />
                  </Tooltip>
                )}
              </Flex>
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
      title: (
        <Tooltip title="ชม. OT ที่ approved เดือนนี้ / Quota ที่กำหนด">
          <span>Quota เดือนนี้</span>
        </Tooltip>
      ),
      key: "quota",
      width: 200,
      render: (record: any) => {
        const id = String(record.requester_id || "");
        const quota = quotaMap[id] ?? DEFAULT_QUOTA_HOURS;
        const used = usedHoursByEmployee[id] || 0;
        const percent = Math.min(Math.round((used / quota) * 100), 100);
        const isOver = used > quota;
        const isDrafting = id in editingQuota;

        const progressColor = isOver
          ? token.colorError
          : percent >= 80
            ? token.colorWarning
            : token.colorSuccess;

        return (
          <Flex vertical gap={4}>
            <Flex align="center" justify="space-between">
              <Typography.Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isOver ? token.colorError : token.colorText,
                }}
              >
                {used.toFixed(1)} / {quota} ชม.
              </Typography.Text>
              {/* Inline edit quota */}
              {isDrafting ? (
                <Flex gap={4} align="center">
                  <InputNumber
                    size="small"
                    min={1}
                    max={999}
                    value={editingQuota[id]}
                    onChange={(v) =>
                      setEditingQuota((prev) => ({
                        ...prev,
                        [id]: Number(v) || DEFAULT_QUOTA_HOURS,
                      }))
                    }
                    style={{ width: 60 }}
                  />
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleSaveQuota(id)}
                    style={{ borderRadius: 4, padding: "0 6px" }}
                  >
                    ✓
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      setEditingQuota((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      })
                    }
                    style={{ borderRadius: 4, padding: "0 6px" }}
                  >
                    ✕
                  </Button>
                </Flex>
              ) : (
                <Tooltip title="แก้ไข Quota">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ fontSize: 11 }} />}
                    onClick={() =>
                      setEditingQuota((prev) => ({ ...prev, [id]: quota }))
                    }
                  />
                </Tooltip>
              )}
            </Flex>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={progressColor}
              trailColor={token.colorBorderSecondary}
              size={["100%", 5] as any}
              style={{ margin: 0 }}
            />
            {isOver && (
              <Typography.Text style={{ fontSize: 10, color: token.colorError }}>
                ⚠️ เกิน quota {(used - quota).toFixed(1)} ชม.
              </Typography.Text>
            )}
          </Flex>
        );
      },
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

              {/* Quick Approve พร้อม Popconfirm แสดงรายละเอียด */}
              <Popconfirm
                title={
                  <Flex vertical gap={4}>
                    <Text strong style={{ fontSize: 13 }}>
                      ยืนยันการอนุมัติคำขอ OT?
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      OT-{String(record.id).padStart(4, "0")} •{" "}
                      {dayjs(record.request_date).format("DD/MM/YYYY")}
                    </Text>
                  </Flex>
                }
                okText="อนุมัติ"
                cancelText="ยกเลิก"
                okButtonProps={{ style: { background: token.colorSuccess, borderColor: token.colorSuccess } }}
                icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                onConfirm={() => onApprove(record.id)}
              >
                <Tooltip title="อนุมัติทันที">
                  <Button
                    type="text"
                    icon={
                      <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                    }
                  />
                </Tooltip>
              </Popconfirm>

              {/* Quick Reject พร้อม Input เหตุผล */}
              <Popconfirm
                open={rejectOpenMap[String(record.id)] ?? false}
                title={
                  <Flex vertical gap={8} style={{ minWidth: 260 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      ปฏิเสธคำขอ OT?
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      OT-{String(record.id).padStart(4, "0")} •{" "}
                      {dayjs(record.request_date).format("DD/MM/YYYY")}
                    </Text>
                    <Input.TextArea
                      placeholder="ระบุเหตุผลการปฏิเสธ (ถ้ามี)"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      value={rejectReasons[String(record.id)] ?? ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [String(record.id)]: e.target.value,
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Flex>
                }
                okText="ปฏิเสธ"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true }}
                icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
                onConfirm={() => {
                  onReject(record.id, rejectReasons[String(record.id)] ?? "");
                  setRejectReasons((prev) => {
                    const next = { ...prev };
                    delete next[String(record.id)];
                    return next;
                  });
                  setRejectOpenMap((prev) => ({ ...prev, [String(record.id)]: false }));
                }}
                onCancel={() =>
                  setRejectOpenMap((prev) => ({ ...prev, [String(record.id)]: false }))
                }
              >
                <Tooltip title="ปฏิเสธคำขอ">
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectOpenMap((prev) => ({
                        ...prev,
                        [String(record.id)]: true,
                      }));
                    }}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          <Tooltip title="ดู PDF">
            <Button
              type="text"
              icon={<FilePdfOutlined style={{ color: token.colorError }} />}
              onClick={() =>
                window.open(`/timesheet/overtime/preview/${record.id}`, "_blank")
              }
            />
          </Tooltip>
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
