"use client";

import { sendTestLineReport } from "@/app/health-check/online-status/school-line-group/_api/school-line-group-service";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  SendOutlined,
  UnorderedListOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
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
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useState, useMemo } from "react";
import type { TLineGroupItem } from "../_api/school-line-group-service";
import { motion, AnimatePresence } from "framer-motion";

const { Text, Title } = Typography;

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

/**
 * Modal สำหรับส่ง LINE แบบ Batch — แสดง Step Loading ทีละรายการพร้อม Log ผลลัพธ์
 * ออกแบบใหม่ให้มีความทันสมัย รองรับ Dark Mode และมี Animation ที่นุ่มนวล
 */
export const BatchSendModal = ({
  open,
  selected,
  onClose,
}: BatchSendModalProps) => {
  const { token } = theme.useToken();
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
        message: "รอดำเนินการ",
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
      updated[i] = { ...updated[i], status: "sending", message: "กำลังดำเนินการ..." };
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
  const progress = useMemo(() => {
    if (batchItems.length === 0) return 0;
    const completed = batchItems.filter(
      (i) => i.status === "success" || i.status === "error",
    ).length;
    return Math.round((completed / batchItems.length) * 100);
  }, [batchItems]);

  const batchColumns: ColumnsType<BatchItem> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: unknown, idx: number) => (
        <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>{idx + 1}</Text>
      ),
    },
    {
      title: "โรงเรียน",
      key: "school",
      render: (_: unknown, record: BatchItem) => (
        <Flex vertical gap={2}>
          <Text strong style={{ fontSize: 13 }}>
            {record.schoolName}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
            ID: {record.schoolId}
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
        const config: Record<BatchItemStatus, { color: string; icon: any; label: string }> = {
          pending: { color: "default", icon: null, label: "รอส่ง" },
          sending: { color: "processing", icon: <LoadingOutlined />, label: "กำลังส่ง" },
          success: { color: "success", icon: <CheckOutlined />, label: "สำเร็จ" },
          error: { color: "error", icon: <CloseOutlined />, label: "พลาด" },
        };
        const current = config[record.status];
        return (
          <Tag 
            color={current.color} 
            icon={current.icon} 
            className="rounded-full px-3 m-0"
          >
            {current.label}
          </Tag>
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
            color: record.status === "error" ? token.colorError : token.colorText,
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
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() =>
              setExpandedLog(
                expandedLog === record.lineGroupId ? null : record.lineGroupId,
              )
            }
            className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {expandedLog === record.lineGroupId ? "ซ่อน" : "ดูผล"}
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
      centered
      title={
        <Flex align="center" gap={8}>
          <SendOutlined style={{ color: token.colorPrimary }} />
          <Text strong>
            {phase === "confirm"
              ? "ยืนยันการส่งรายงาน LINE"
              : phase === "running"
              ? "กำลังส่งรายงาน..."
              : "ผลการส่งรายงาน LINE"}
          </Text>
        </Flex>
      }
      footer={
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Flex justify="flex-end" gap={12}>
            {phase === "confirm" ? (
              <>
                <Button onClick={handleClose} className="rounded-lg">ยกเลิก</Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleStartBatch}
                  disabled={validCount === 0}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
                >
                  ส่งรายงาน {validCount} โรงเรียน
                </Button>
              </>
            ) : phase === "done" ? (
              <Button 
                type="primary" 
                onClick={handleClose}
                className="rounded-lg px-8 h-10 shadow-lg bg-blue-600 hover:bg-blue-500"
              >
                เสร็จสิ้น
              </Button>
            ) : null}
          </Flex>
        </div>
      }
      styles={{
        body: { padding: "12px 0 0 0" },
        mask: { backdropFilter: "blur(4px)" },
      }}
      className="modern-modal"
    >
      <AnimatePresence mode="wait">
        {/* หน้ายืนยัน */}
        {phase === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5 px-6 pb-6"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <Text style={{ fontSize: 14 }}>
                คุณต้องการส่งรายงานสถานะอุปกรณ์ไปยัง LINE ของ{" "}
                <Text strong className="text-blue-600 dark:text-blue-400">
                  {validCount} โรงเรียน
                </Text>{" "}
                ที่เลือกใช่หรือไม่?
              </Text>
            </div>
            
            <Table
              rowKey="LineGroupId"
              size="small"
              dataSource={selected.filter((s) => s.SchoolId !== null)}
              pagination={false}
              scroll={{ y: 300 }}
              className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden"
              columns={[
                {
                  title: "ลำดับ",
                  key: "index",
                  width: 70,
                  align: "center",
                  render: (_: any, __: any, idx: number) => idx + 1,
                },
                {
                  title: "รหัสโรงเรียน",
                  dataIndex: "SchoolId",
                  key: "SchoolId",
                  render: (val: number) => (
                    <Tag color="blue" className="font-mono rounded-md m-0">
                      {val}
                    </Tag>
                  ),
                },
                {
                  title: "Group ID",
                  dataIndex: "GroupId",
                  key: "GroupId",
                  render: (val: string | null) => (
                    <Text code className="text-[11px] truncate max-w-[200px] inline-block">
                      {val ?? "-"}
                    </Text>
                  ),
                },
                {
                  title: "ประเภท",
                  dataIndex: "GroupType",
                  key: "GroupType",
                  render: (val: string | null) => (
                    <Tag color="purple" className="rounded-md m-0">{val ?? "ทั่วไป"}</Tag>
                  ),
                },
              ]}
            />
          </motion.div>
        )}

        {/* หน้า running + done */}
        {(phase === "running" || phase === "done") && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6 px-6 pb-6"
          >
            {/* Progress Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <Flex vertical gap={12}>
                <Flex justify="space-between" align="end">
                  <Flex vertical gap={4}>
                    <Text type="secondary" className="text-xs uppercase tracking-wider">
                      ความคืบหน้าการส่ง
                    </Text>
                    <Text strong className="text-lg">
                      {phase === "running"
                        ? `กำลังส่งรายการที่ ${currentIndex + 1} จากทั้งหมด ${batchItems.length}`
                        : "ส่งรายงานครบทุกรายการแล้ว"}
                    </Text>
                  </Flex>
                  <Title level={2} style={{ margin: 0, color: token.colorPrimary }}>
                    {progress}%
                  </Title>
                </Flex>
                <Progress
                  percent={progress}
                  showInfo={false}
                  strokeWidth={10}
                  strokeColor={{
                    "0%": token.colorPrimary,
                    "100%": phase === "done" && errorCount > 0 ? token.colorError : "#52c41a",
                  }}
                  trailColor={token.colorFillTertiary}
                  strokeLinecap="round"
                />
              </Flex>
            </div>

            {/* สรุปผล - แสดงเฉพาะเมื่อเสร็จสิ้น */}
            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
                        <CheckCircleFilled className="text-green-500 text-xl mb-1" />
                        <Text strong className="text-2xl text-green-600 dark:text-green-400">
                          {successCount}
                        </Text>
                        <Text type="secondary" className="text-[12px]">สำเร็จ</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
                        <CloseCircleFilled className="text-red-500 text-xl mb-1" />
                        <Text strong className="text-2xl text-red-600 dark:text-red-400">
                          {errorCount}
                        </Text>
                        <Text type="secondary" className="text-[12px]">ล้มเหลว</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
                        <UnorderedListOutlined className="text-slate-400 text-xl mb-1" />
                        <Text strong className="text-2xl">
                          {batchItems.length}
                        </Text>
                        <Text type="secondary" className="text-[12px]">ทั้งหมด</Text>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ตารางแสดงรายละเอียดทีละรายการ */}
            <Table
              rowKey="lineGroupId"
              size="small"
              dataSource={batchItems}
              columns={batchColumns}
              pagination={false}
              scroll={{ y: 280 }}
              className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
              expandable={{
                expandedRowKeys: expandedLog !== null ? [expandedLog] : [],
                expandedRowRender: (record: BatchItem) => (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f172a] dark:bg-black rounded-lg p-4 font-mono shadow-inner border border-slate-700/30"
                  >
                    <Text className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {record.detail}
                    </Text>
                  </motion.div>
                ),
                showExpandColumn: false,
              }}
              locale={{ emptyText: "ไม่มีรายการที่ต้องส่ง" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
