"use client";

import { sendTestLineReport } from "@/app/health-check/online-status/school-line-group/_api/school-line-group-service";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Modal,
  Progress,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useState } from "react";
import type { TLineGroupItem } from "../_api/school-line-group-service";

const { Text } = Typography;

// สถานะของแต่ละรายการใน batch
type BatchItemStatus = "pending" | "sending" | "success" | "error";

interface BatchItem {
  lineGroupId: number;
  schoolId: number;
  schoolName: string;
  status: BatchItemStatus;
  message: string;
  detail: string | null;
}

interface BatchSendModalProps {
  open: boolean;
  selected: TLineGroupItem[];
  onClose: () => void;
}

// ไอคอนสถานะแต่ละแบบ
const StatusIcon = ({ status }: { status: BatchItemStatus }) => {
  switch (status) {
    case "sending":
      return <LoadingOutlined style={{ color: "#1677ff" }} />;
    case "success":
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    case "error":
      return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
    default:
      return <Text type="secondary">รอดำเนินการ</Text>;
  }
};

/**
 * Modal สำหรับส่ง LINE แบบ Batch — แสดง Step Loading ทีละรายการพร้อม Log ผลลัพธ์
 */
export const BatchSendModal = ({
  open,
  selected,
  onClose,
}: BatchSendModalProps) => {
  const [phase, setPhase] = useState<"confirm" | "running" | "done">("confirm");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // สร้าง batch items เริ่มต้น
  const initBatchItems = useCallback((): BatchItem[] => {
    return selected
      .filter((s) => s.SchoolId !== null)
      .map((s) => ({
        lineGroupId: s.LineGroupId,
        schoolId: s.SchoolId as number,
        schoolName: `โรงเรียน ${s.SchoolId}`,
        status: "pending",
        message: "-",
        detail: null,
      }));
  }, [selected]);

  // เริ่มส่ง batch ทีละรายการ (sequential)
  const handleStartBatch = async () => {
    const items = initBatchItems();
    setBatchItems(items);
    setPhase("running");
    setCurrentIndex(0);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      setCurrentIndex(i);
      // อัพเดทสถานะเป็น "กำลังส่ง"
      updated[i] = { ...updated[i], status: "sending" };
      setBatchItems([...updated]);

      try {
        const res = await sendTestLineReport(updated[i].schoolId);
        const isSuccess = (res?.status ?? res?.status_code) === 200;

        updated[i] = {
          ...updated[i],
          status: isSuccess ? "success" : "error",
          message: isSuccess ? "ส่งสำเร็จ" : res?.message_th ?? "ส่งไม่สำเร็จ",
          schoolName: res?.data?.school_name ?? updated[i].schoolName,
          detail: isSuccess
            ? `อุปกรณ์รวม ${res?.data?.total_devices ?? "-"} | ออนไลน์ ${
                res?.data?.online_devices ?? "-"
              } | ออฟไลน์ ${res?.data?.offline_devices ?? "-"}`
            : res?.message_th ?? null,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        updated[i] = {
          ...updated[i],
          status: "error",
          message: "ส่งไม่สำเร็จ",
          detail: msg,
        };
      }

      setBatchItems([...updated]);
    }

    setPhase("done");
  };

  // ปิด Modal และ reset state
  const handleClose = () => {
    setPhase("confirm");
    setBatchItems([]);
    setCurrentIndex(0);
    setExpandedLog(null);
    onClose();
  };

  const successCount = batchItems.filter((i) => i.status === "success").length;
  const errorCount = batchItems.filter((i) => i.status === "error").length;
  const progress =
    batchItems.length > 0
      ? Math.round(
          (batchItems.filter(
            (i) => i.status === "success" || i.status === "error",
          ).length /
            batchItems.length) *
            100,
        )
      : 0;

  const batchColumns: ColumnsType<BatchItem> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    {
      title: "โรงเรียน",
      key: "school",
      render: (_: unknown, record: BatchItem) => (
        <Flex vertical gap={2}>
          <Text style={{ fontWeight: 600, fontSize: 13 }}>
            {record.schoolName}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            รหัส: {record.schoolId}
          </Text>
        </Flex>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 130,
      align: "center",
      render: (_: unknown, record: BatchItem) => {
        const tagColor: Record<BatchItemStatus, string> = {
          pending: "default",
          sending: "processing",
          success: "success",
          error: "error",
        };
        const tagLabel: Record<BatchItemStatus, string> = {
          pending: "รอดำเนินการ",
          sending: "กำลังส่ง...",
          success: "สำเร็จ",
          error: "ล้มเหลว",
        };
        return (
          <Flex align="center" gap={6} justify="center">
            <StatusIcon status={record.status} />
            <Tag color={tagColor[record.status]}>{tagLabel[record.status]}</Tag>
          </Flex>
        );
      },
    },
    {
      title: "ผลลัพธ์",
      key: "message",
      render: (_: unknown, record: BatchItem) => (
        <Text
          style={{
            fontSize: 12,
            color: record.status === "error" ? "#ff4d4f" : undefined,
          }}
        >
          {record.message}
        </Text>
      ),
    },
    {
      title: "รายละเอียด",
      key: "detail",
      width: 130,
      align: "center",
      render: (_: unknown, record: BatchItem) =>
        record.detail ? (
          <Button
            size="small"
            type="link"
            onClick={() =>
              setExpandedLog(
                expandedLog === record.lineGroupId ? null : record.lineGroupId,
              )
            }
          >
            {expandedLog === record.lineGroupId ? "ซ่อน" : "ดูรายละเอียด"}
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>
            -
          </Text>
        ),
    },
  ];

  const validCount = selected.filter((s) => s.SchoolId !== null).length;

  return (
    <Modal
      open={open}
      onCancel={phase === "running" ? undefined : handleClose}
      closable={phase !== "running"}
      maskClosable={false}
      width={800}
      title={
        phase === "confirm"
          ? "ยืนยันการส่งรายงาน LINE"
          : phase === "running"
          ? "กำลังส่งรายงาน..."
          : "ผลการส่งรายงาน LINE"
      }
      footer={
        phase === "confirm" ? (
          <Flex justify="flex-end" gap={8}>
            <Button onClick={handleClose}>ยกเลิก</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleStartBatch}
              disabled={validCount === 0}
            >
              ตกลง — ส่งรายงาน {validCount} โรงเรียน
            </Button>
          </Flex>
        ) : phase === "done" ? (
          <Flex justify="flex-end">
            <Button type="primary" onClick={handleClose}>
              ปิด
            </Button>
          </Flex>
        ) : null
      }
      destroyOnClose={false}
    >
      {/* หน้ายืนยัน */}
      {phase === "confirm" && (
        <Flex vertical gap={16}>
          <Text>
            คุณต้องการส่งรายงานสถานะอุปกรณ์ไปยัง LINE ของ{" "}
            <Text strong>{validCount} โรงเรียน</Text> ที่เลือกใช่หรือไม่?
          </Text>
          <Table
            rowKey="LineGroupId"
            size="small"
            dataSource={selected.filter((s) => s.SchoolId !== null)}
            pagination={false}
            scroll={{ y: 300 }}
            columns={[
              {
                title: "ลำดับ",
                key: "index",
                width: 60,
                align: "center",
                render: (_: unknown, __: unknown, idx: number) => idx + 1,
              },
              {
                title: "รหัสโรงเรียน",
                dataIndex: "SchoolId",
                key: "SchoolId",
                render: (val: number) => (
                  <Tag color="blue" style={{ fontFamily: "monospace" }}>
                    {val}
                  </Tag>
                ),
              },
              {
                title: "Group ID",
                dataIndex: "GroupId",
                key: "GroupId",
                render: (val: string | null) => (
                  <Text code style={{ fontSize: 11 }}>
                    {val ?? "-"}
                  </Text>
                ),
              },
              {
                title: "ประเภท",
                dataIndex: "GroupType",
                key: "GroupType",
                render: (val: string | null) => (
                  <Tag color="purple">{val ?? "ไม่ระบุ"}</Tag>
                ),
              },
            ]}
          />
        </Flex>
      )}

      {/* หน้า running + done */}
      {(phase === "running" || phase === "done") && (
        <Flex vertical gap={16}>
          {/* Progress bar */}
          <Flex vertical gap={4}>
            <Flex justify="space-between">
              <Text style={{ fontSize: 13 }}>
                {phase === "running"
                  ? `กำลังส่ง ${currentIndex + 1} / ${batchItems.length}`
                  : "ส่งครบทั้งหมดแล้ว"}
              </Text>
              <Text style={{ fontSize: 13 }}>{progress}%</Text>
            </Flex>
            <Progress
              percent={progress}
              status={
                phase === "running"
                  ? "active"
                  : errorCount > 0
                  ? "exception"
                  : "success"
              }
              strokeColor={
                phase === "running"
                  ? "#1677ff"
                  : errorCount > 0
                  ? "#ff4d4f"
                  : "#52c41a"
              }
            />
          </Flex>

          {/* สรุปผล */}
          {phase === "done" && (
            <Row gutter={16}>
              <Col span={8}>
                <Flex
                  vertical
                  align="center"
                  style={{
                    background: "#f6ffed",
                    borderRadius: 8,
                    padding: "12px 0",
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <Text
                    style={{ fontSize: 22, fontWeight: 600, color: "#52c41a" }}
                  >
                    {successCount}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#52c41a" }}>สำเร็จ</Text>
                </Flex>
              </Col>
              <Col span={8}>
                <Flex
                  vertical
                  align="center"
                  style={{
                    background: "#fff2f0",
                    borderRadius: 8,
                    padding: "12px 0",
                    border: "1px solid #ffccc7",
                  }}
                >
                  <Text
                    style={{ fontSize: 22, fontWeight: 600, color: "#ff4d4f" }}
                  >
                    {errorCount}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#ff4d4f" }}>
                    ล้มเหลว
                  </Text>
                </Flex>
              </Col>
              <Col span={8}>
                <Flex
                  vertical
                  align="center"
                  style={{
                    background: "#f5f5f5",
                    borderRadius: 8,
                    padding: "12px 0",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: 600 }}>
                    {batchItems.length}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>ทั้งหมด</Text>
                </Flex>
              </Col>
            </Row>
          )}

          {/* ตาราง step tracking */}
          <Table
            rowKey="lineGroupId"
            size="small"
            dataSource={batchItems}
            columns={batchColumns}
            pagination={false}
            scroll={{ y: 320 }}
            expandable={{
              expandedRowKeys: expandedLog !== null ? [expandedLog] : [],
              expandedRowRender: (record: BatchItem) => (
                <Flex
                  style={{
                    background: "#1a1a2e",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontFamily: "monospace",
                  }}
                >
                  <Text
                    style={{
                      color: "#e0e0e0",
                      fontSize: 12,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {record.detail}
                  </Text>
                </Flex>
              ),
              showExpandColumn: false,
            }}
            locale={{ emptyText: "ยังไม่มีรายการ" }}
          />
        </Flex>
      )}
    </Modal>
  );
};
