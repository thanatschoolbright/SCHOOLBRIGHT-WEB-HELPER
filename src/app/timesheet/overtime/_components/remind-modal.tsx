"use client";

import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Modal,
  Progress,
  Row,
  Segmented,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useOvertimeStore } from "../_state/overtime-store";

interface RemindModalProps {
  visible: boolean;
  onClose: () => void;
  hrEmail?: string;
}

type UrgencyFilter = "all" | "urgent" | "normal";

/** จำนวนวันขั้นต่ำที่ถือว่า "รอนาน" */
const URGENT_THRESHOLD_DAYS = 3;

/**
 * Modal ส่ง Email แจ้งเตือนซ้ำสำหรับคำขอ OT ที่รออนุมัตินานเกินไป
 */
const RemindModal: React.FC<RemindModalProps> = ({
  visible,
  onClose,
  hrEmail,
}) => {
  const { token } = theme.useToken();
  const { overtimeDataSource, isLoadingOvertimeData } = useOvertimeStore();

  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sendingMap, setSendingMap] = useState<
    Record<number, "sending" | "done" | "error">
  >({});
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // รีเซ็ต state เมื่อเปิด modal ใหม่
  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set());
      setSendingMap({});
      setSentCount(0);
      setUrgencyFilter("all");
    }
  }, [visible]);

  // กรองเฉพาะรายการ pending + คำนวณจำนวนวันที่รอ
  const pendingRecords = useMemo(() => {
    return overtimeDataSource
      .filter((r) => r.status === "pending")
      .map((r) => {
        const created = r.created_at || r.request_date;
        const waitDays = created
          ? Math.floor(
              Math.abs(new Date().getTime() - new Date(created).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        return { ...r, waitDays };
      })
      .sort((a, b) => b.waitDays - a.waitDays); // เรียงจากรอนานสุด
  }, [overtimeDataSource]);

  const urgentRecords = useMemo(
    () => pendingRecords.filter((r) => r.waitDays >= URGENT_THRESHOLD_DAYS),
    [pendingRecords],
  );
  const normalRecords = useMemo(
    () => pendingRecords.filter((r) => r.waitDays < URGENT_THRESHOLD_DAYS),
    [pendingRecords],
  );

  const displayRecords = useMemo(() => {
    if (urgencyFilter === "urgent") return urgentRecords;
    if (urgencyFilter === "normal") return normalRecords;
    return pendingRecords;
  }, [urgencyFilter, pendingRecords, urgentRecords, normalRecords]);

  // เลือกทั้งหมดในหน้าปัจจุบัน
  const isAllSelected =
    displayRecords.length > 0 &&
    displayRecords.every((r) => selectedIds.has(Number(r.id)));

  const handleToggleAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      displayRecords.forEach((r) => next.delete(Number(r.id)));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      displayRecords.forEach((r) => next.add(Number(r.id)));
      setSelectedIds(next);
    }
  };

  const handleToggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ส่ง email สำหรับ record เดียว
  const sendReminder = async (record: any): Promise<boolean> => {
    const id = Number(record.id);
    setSendingMap((prev) => ({ ...prev, [id]: "sending" }));
    try {
      const previewUrl = `${window.location.origin}/timesheet/overtime/preview/${id}`;
      const res = await axios.post("/api/v1/timesheet/overtime/send-email", {
        id: String(id),
        link: previewUrl,
        to: hrEmail || "manager.hr@schoolbright.co",
      });
      const ok = res.data?.status === 200 || res.data?.status === 201;
      setSendingMap((prev) => ({ ...prev, [id]: ok ? "done" : "error" }));
      return ok;
    } catch {
      setSendingMap((prev) => ({ ...prev, [id]: "error" }));
      return false;
    }
  };

  // ส่งทั้งหมดที่เลือก
  const handleSendSelected = async () => {
    const targets = displayRecords.filter((r) => selectedIds.has(Number(r.id)));
    if (targets.length === 0) return;
    setIsSendingAll(true);
    setSentCount(0);
    let count = 0;
    for (const record of targets) {
      const ok = await sendReminder(record);
      if (ok) count++;
      setSentCount(count);
      // ดีเลย์เล็กน้อยให้ UI ตอบสนอง
      await new Promise((r) => setTimeout(r, 400));
    }
    setIsSendingAll(false);
  };

  const selectedCount = selectedIds.size;
  const doneCount = Object.values(sendingMap).filter(
    (v) => v === "done",
  ).length;
  const errorCount = Object.values(sendingMap).filter(
    (v) => v === "error",
  ).length;
  const allSentDone =
    selectedCount > 0 && doneCount + errorCount >= selectedCount;
  const sendProgress =
    selectedCount > 0
      ? Math.round(((doneCount + errorCount) / selectedCount) * 100)
      : 0;

  const columns = [
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={selectedIds.size > 0 && !isAllSelected}
          onChange={handleToggleAll}
        />
      ),
      width: 40,
      render: (_: any, record: any) => {
        const id = Number(record.id);
        const state = sendingMap[id];
        return (
          <Checkbox
            checked={selectedIds.has(id)}
            onChange={() => handleToggleOne(id)}
            disabled={state === "sending" || state === "done"}
          />
        );
      },
    },
    {
      title: "พนักงาน",
      key: "requester",
      render: (_: any, record: any) => (
        <Flex vertical gap={2}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {record.requester_name || "-"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {record.requester_employee_code || ""}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "วันที่ยื่น",
      key: "created_at",
      width: 130,
      render: (_: any, record: any) => (
        <Typography.Text style={{ fontSize: 13 }}>
          {record.created_at
            ? dayjs(record.created_at).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Typography.Text>
      ),
    },
    {
      title: "รอนาน",
      key: "waitDays",
      width: 90,
      render: (_: any, record: any) => (
        <Tag
          color={record.waitDays >= URGENT_THRESHOLD_DAYS ? "red" : "orange"}
          style={{ fontWeight: 700 }}
        >
          {record.waitDays} วัน
        </Tag>
      ),
    },
    {
      title: "สถานะส่ง",
      key: "sendStatus",
      width: 100,
      render: (_: any, record: any) => {
        const id = Number(record.id);
        const state = sendingMap[id];
        if (state === "sending")
          return (
            <Tag color="processing" icon={<MailOutlined />}>
              กำลังส่ง
            </Tag>
          );
        if (state === "done")
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              ส่งแล้ว
            </Tag>
          );
        if (state === "error")
          return (
            <Tooltip title="ส่งอีเมลล้มเหลว กด Retry">
              <Tag
                color="error"
                icon={<ExclamationCircleOutlined />}
                style={{ cursor: "pointer" }}
                onClick={() => sendReminder(record)}
              >
                ล้มเหลว
              </Tag>
            </Tooltip>
          );
        return <Tag color="default">ยังไม่ส่ง</Tag>;
      },
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_: any, record: any) => {
        const id = Number(record.id);
        const state = sendingMap[id];
        return (
          <Button
            size="small"
            icon={<SendOutlined />}
            loading={state === "sending"}
            disabled={state === "done" || isSendingAll}
            onClick={() => sendReminder(record)}
          >
            ส่ง
          </Button>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              background: token.colorWarningBg,
              padding: 8,
              borderRadius: 10,
              display: "flex",
            }}
          >
            <BellOutlined style={{ color: token.colorWarning, fontSize: 18 }} />
          </div>
          <Flex vertical gap={0}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              แจ้งเตือนซ้ำ — OT รออนุมัติ
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ส่ง Email เตือนผู้อนุมัติสำหรับรายการที่ค้างนานเกินไป
            </Typography.Text>
          </Flex>
        </Flex>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={820}
      centered
      styles={{ body: { padding: "0 24px 24px 24px" } }}
    >
      <Flex vertical gap={16} style={{ paddingTop: 16 }}>
        {/* Summary Cards */}
        <Row gutter={[12, 12]}>
          <Col span={8}>
            <Card
              variant="borderless"
              styles={{ body: { padding: "14px 18px" } }}
              style={{
                background: token.colorFillQuaternary,
                borderRadius: 12,
              }}
            >
              <Flex align="center" gap={10}>
                <ClockCircleOutlined
                  style={{ fontSize: 20, color: token.colorWarning }}
                />
                <Flex vertical gap={0}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    รออนุมัติทั้งหมด
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{ fontSize: 22, lineHeight: 1.2 }}
                  >
                    {pendingRecords.length}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              variant="borderless"
              styles={{ body: { padding: "14px 18px" } }}
              style={{
                background:
                  urgentRecords.length > 0
                    ? token.colorErrorBg
                    : token.colorFillQuaternary,
                borderRadius: 12,
                border:
                  urgentRecords.length > 0
                    ? `1px solid ${token.colorErrorBorder}`
                    : undefined,
              }}
            >
              <Flex align="center" gap={10}>
                <ExclamationCircleOutlined
                  style={{
                    fontSize: 20,
                    color:
                      urgentRecords.length > 0
                        ? token.colorError
                        : token.colorTextTertiary,
                  }}
                />
                <Flex vertical gap={0}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    รอนานกว่า {URGENT_THRESHOLD_DAYS} วัน
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 22,
                      lineHeight: 1.2,
                      color:
                        urgentRecords.length > 0 ? token.colorError : undefined,
                    }}
                  >
                    {urgentRecords.length}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              variant="borderless"
              styles={{ body: { padding: "14px 18px" } }}
              style={{ background: token.colorSuccessBg, borderRadius: 12 }}
            >
              <Flex align="center" gap={10}>
                <CheckCircleOutlined
                  style={{ fontSize: 20, color: token.colorSuccess }}
                />
                <Flex vertical gap={0}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    ส่งเตือนแล้วรอบนี้
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 22,
                      lineHeight: 1.2,
                      color: token.colorSuccess,
                    }}
                  >
                    {doneCount}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Card>
          </Col>
        </Row>

        {/* Alert เมื่อมีรายการด่วน */}
        {urgentRecords.length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={
              <Typography.Text strong>
                มีคำขอรอนานกว่า {URGENT_THRESHOLD_DAYS} วัน จำนวน{" "}
                <span style={{ color: token.colorError }}>
                  {urgentRecords.length}
                </span>{" "}
                รายการ — ควรส่งแจ้งเตือนโดยด่วน
              </Typography.Text>
            }
          />
        )}

        {/* Filter + Toolbar */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Segmented
            value={urgencyFilter}
            onChange={(v) => {
              setUrgencyFilter(v as UrgencyFilter);
              setSelectedIds(new Set());
            }}
            options={[
              { label: `ทั้งหมด (${pendingRecords.length})`, value: "all" },
              {
                label: (
                  <Badge
                    count={urgentRecords.length}
                    size="small"
                    color="red"
                    offset={[6, -2]}
                  >
                    <span style={{ paddingRight: 10 }}>ด่วน</span>
                  </Badge>
                ),
                value: "urgent",
              },
              { label: `ปกติ (${normalRecords.length})`, value: "normal" },
            ]}
          />

          <Flex gap={8} align="center">
            {selectedCount > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                เลือก {selectedCount} รายการ
              </Typography.Text>
            )}
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={selectedCount === 0 || isSendingAll || allSentDone}
              loading={isSendingAll}
              onClick={handleSendSelected}
              style={{
                background: token.colorWarning,
                borderColor: token.colorWarning,
              }}
            >
              ส่งเตือนที่เลือก ({selectedCount})
            </Button>
          </Flex>
        </Flex>

        {/* Progress bar เมื่อกำลังส่ง */}
        {isSendingAll && (
          <Progress
            percent={sendProgress}
            status="active"
            strokeColor={token.colorWarning}
            format={() => `${doneCount + errorCount} / ${selectedCount}`}
          />
        )}

        {/* ผลลัพธ์หลังส่งครบ */}
        {allSentDone && !isSendingAll && (
          <Alert
            type={errorCount === 0 ? "success" : "warning"}
            showIcon
            message={
              errorCount === 0
                ? `ส่งอีเมลเตือนสำเร็จทั้งหมด ${doneCount} รายการ`
                : `ส่งสำเร็จ ${doneCount} รายการ, ล้มเหลว ${errorCount} รายการ (กดที่ Tag "ล้มเหลว" เพื่อลองส่งใหม่)`
            }
          />
        )}

        {/* ตารางรายการ */}
        <Table
          dataSource={displayRecords}
          columns={columns}
          rowKey="id"
          size="small"
          loading={isLoadingOvertimeData}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
          locale={{ emptyText: "ไม่มีรายการรออนุมัติ" }}
          rowClassName={(record) =>
            record.waitDays >= URGENT_THRESHOLD_DAYS
              ? "ant-table-row-urgent"
              : ""
          }
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        />

        <Flex justify="flex-end">
          <Button onClick={onClose}>ปิด</Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default RemindModal;
