"use client";

import {
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Flex,
  Progress,
  Typography,
  theme,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { useServerStatusStore } from "../_state/server-status.state";

// ✨ ขั้นตอนที่แสดงระหว่าง aggregate (ใช้ simulate progress)
const AGGREGATE_STEPS = [
  { label: "กำลังเชื่อมต่อฐานข้อมูล...", target: 8 },
  { label: "ตรวจสอบ log ที่ยังไม่ได้สรุป...", target: 18 },
  { label: "กำลังประมวลผลข้อมูลรายวัน...", target: 35 },
  { label: "คำนวณ Uptime / Downtime...", target: 55 },
  { label: "บันทึก Daily Summary ลงฐานข้อมูล...", target: 72 },
  { label: "ตรวจสอบความถูกต้องของข้อมูล...", target: 85 },
  { label: "กำลังเสร็จสิ้น...", target: 94 },
];

const DELETE_STEPS = [
  { label: "กำลังเชื่อมต่อฐานข้อมูล...", target: 10 },
  { label: "ตรวจสอบ log ที่สรุปแล้ว...", target: 28 },
  { label: "กำลังลบข้อมูลออกจากระบบ...", target: 55 },
  { label: "ล้างข้อมูล cache...", target: 78 },
  { label: "ยืนยันการลบเสร็จสมบูรณ์...", target: 93 },
];

// ✨ hook สำหรับ simulate progress แบบ exponential-decay จนกว่า API จะตอบกลับ
function useSimulatedProgress(
  active: boolean,
  steps: { label: string; target: number }[],
) {
  const [percent, setPercent] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);
  const currentRef = useRef(0);
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // reset ผ่าน refs เพื่อหลีกเลี่ยง setState synchronously ใน effect body
    stepIndexRef.current = 0;
    currentRef.current = 0;

    intervalRef.current = setInterval(() => {
      // tick แรก: reset state ผ่าน callback (ปลอดภัย)
      if (currentRef.current === 0) {
        setPercent(0);
        setStepLabel(stepsRef.current[0]?.label ?? "");
      }

      currentRef.current += 1;
      const current = currentRef.current;

      // ขยับ step label ตาม target
      const nextStep = stepsRef.current[stepIndexRef.current + 1];
      if (nextStep && current >= nextStep.target) {
        stepIndexRef.current = Math.min(
          stepIndexRef.current + 1,
          stepsRef.current.length - 1,
        );
        setStepLabel(stepsRef.current[stepIndexRef.current]?.label ?? "");
      }

      // เพิ่ม % แบบ exponential-decay หยุดที่ 94 เพื่อรอ API
      setPercent((prev) => {
        if (prev >= 94) return prev;
        const gap = 94 - prev;
        return Math.min(94, prev + Math.max(0.3, gap * 0.045));
      });
    }, 300);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  // ✨ เรียกเมื่อ API สำเร็จ — กระโดดไป 100%
  const complete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPercent(100);
  };

  return { percent, stepLabel, complete };
}

// ✨ Panel จัดการ LOG — สรุปรายวัน + ลบ log เก่า พร้อม progress tracking
const LogManagementPanel: React.FC = () => {
  const { token } = theme.useToken();
  const {
    isAggregating,
    isDeletingLogs,
    aggregateLogs,
    deleteOldLogs,
    fetchDailySummary,
    fetchLogSummary,
    fetchLogs,
  } = useServerStatusStore();

  const [confirmAggregateOpen, setConfirmAggregateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [aggregateResult, setAggregateResult] = useState<{
    processed_dates: number;
    rows_created: number;
  } | null>(null);
  const [showDeleteSuggestion, setShowDeleteSuggestion] = useState(false);
  const [successAggregateOpen, setSuccessAggregateOpen] = useState(false);
  const [successDeleteOpen, setSuccessDeleteOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const aggregateProgress = useSimulatedProgress(
    isAggregating,
    AGGREGATE_STEPS,
  );
  const deleteProgress = useSimulatedProgress(isDeletingLogs, DELETE_STEPS);

  // ✨ ขั้นตอนที่ 1: ยืนยัน → สรุป log
  const handleAggregateConfirm = async () => {
    setConfirmAggregateOpen(false);
    const result = await aggregateLogs();
    aggregateProgress.complete();
    if (result.success) {
      setAggregateResult({
        processed_dates: result.processed_dates,
        rows_created: result.rows_created,
      });
      setShowDeleteSuggestion(result.processed_dates > 0);
      setTimeout(() => setSuccessAggregateOpen(true), 400);
      fetchDailySummary();
      fetchLogSummary();
    }
  };

  // ✨ ขั้นตอนที่ 2: แนะนำลบ → เปิด confirm delete
  const handleSuggestDelete = () => {
    setSuccessAggregateOpen(false);
    setConfirmDeleteOpen(true);
  };

  // ✨ ขั้นตอนที่ 3: ยืนยัน → ลบ log เก่า
  const handleDeleteConfirm = async () => {
    setConfirmDeleteOpen(false);
    const result = await deleteOldLogs();
    deleteProgress.complete();
    if (result.success) {
      setDeletedCount(result.deleted_count);
      setShowDeleteSuggestion(false);
      setTimeout(() => setSuccessDeleteOpen(true), 400);
      fetchLogs(1);
      fetchLogSummary();
    }
  };

  const handleAggregateSuccessClose = () => {
    setSuccessAggregateOpen(false);
    if (showDeleteSuggestion) {
      toast.info("แนะนำให้กด 'ลบ LOG เก่า' เพื่อประหยัดพื้นที่ฐานข้อมูล");
    }
  };

  return (
    <>
      <Card
        styles={{ body: { padding: "20px 24px" } }}
        style={{
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
        title={
          <Flex align="center" gap={12} style={{ padding: "6px 0" }}>
            <div
              style={{
                background: token.colorWarning,
                padding: 8,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 8px ${token.colorWarning}50`,
              }}
            >
              <DatabaseOutlined style={{ fontSize: "1.1rem", color: "#fff" }} />
            </div>
            <Flex vertical gap={1}>
              <Typography.Text strong style={{ fontSize: "1rem", lineHeight: 1.3 }}>
                จัดการข้อมูล LOG
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                สรุปข้อมูลรายวันและล้าง log เก่าเพื่อประหยัดพื้นที่ฐานข้อมูล
              </Typography.Text>
            </Flex>
          </Flex>
        }
      >
        <Flex gap={16} wrap="wrap">
          {/* --- ปุ่มสรุป LOG --- */}
          <Flex
            vertical
            gap={10}
            style={{
              flex: 1,
              minWidth: 260,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <Flex align="center" gap={8}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: token.colorPrimary,
                  flexShrink: 0,
                }}
              />
              <Typography.Text strong style={{ fontSize: 13 }}>
                ขั้นตอนที่ 1 — สรุปรายวัน
              </Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
              รวม log ทุกวันที่ยังไม่ได้สรุปลงตาราง Daily Summary
            </Typography.Text>

            {isAggregating ? (
              <Flex vertical gap={6} style={{ marginTop: 4 }}>
                <Flex justify="space-between" align="center">
                  <Typography.Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                    {aggregateProgress.stepLabel}
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: 12, color: token.colorPrimary }}>
                    {Math.round(aggregateProgress.percent)}%
                  </Typography.Text>
                </Flex>
                <Progress
                  percent={Math.round(aggregateProgress.percent)}
                  showInfo={false}
                  strokeColor={{
                    "0%": token.colorPrimary,
                    "100%": token.colorSuccess,
                  }}
                  trailColor={token.colorFillSecondary}
                  strokeLinecap="round"
                  size={["100%", 6]}
                />
              </Flex>
            ) : (
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => setConfirmAggregateOpen(true)}
                style={{ width: "fit-content", borderRadius: 8 }}
              >
                สรุปข้อมูล LOG รายวัน
              </Button>
            )}
          </Flex>

          {/* --- ปุ่มลบ LOG เก่า --- */}
          <Flex
            vertical
            gap={10}
            style={{
              flex: 1,
              minWidth: 260,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <Flex align="center" gap={8}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: token.colorError,
                  flexShrink: 0,
                }}
              />
              <Typography.Text strong style={{ fontSize: 13 }}>
                ขั้นตอนที่ 2 — ลบ log เก่า
              </Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
              ลบ log เฉพาะวันก่อนหน้า — log วันนี้จะไม่ถูกลบ
            </Typography.Text>

            {isDeletingLogs ? (
              <Flex vertical gap={6} style={{ marginTop: 4 }}>
                <Flex justify="space-between" align="center">
                  <Typography.Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                    {deleteProgress.stepLabel}
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: 12, color: token.colorError }}>
                    {Math.round(deleteProgress.percent)}%
                  </Typography.Text>
                </Flex>
                <Progress
                  percent={Math.round(deleteProgress.percent)}
                  showInfo={false}
                  strokeColor={{
                    "0%": token.colorWarning,
                    "100%": token.colorError,
                  }}
                  trailColor={token.colorFillSecondary}
                  strokeLinecap="round"
                  size={["100%", 6]}
                />
              </Flex>
            ) : (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={isDeletingLogs}
                onClick={() => setConfirmDeleteOpen(true)}
                style={{ width: "fit-content", borderRadius: 8 }}
              >
                ลบ LOG เก่า
              </Button>
            )}
          </Flex>
        </Flex>

        {showDeleteSuggestion && !isAggregating && (
          <Alert
            style={{ marginTop: 16, borderRadius: 10 }}
            type="warning"
            icon={<ExclamationCircleOutlined />}
            showIcon
            message="แนะนำให้ลบ LOG เก่าเพื่อประหยัดพื้นที่"
            description="สรุปข้อมูลเสร็จแล้ว — กด 'ลบ LOG เก่า' เพื่อลบ log ที่สรุปไปแล้ว ระบบจะเก็บไว้เฉพาะ log วันนี้"
            action={
              <Button size="small" danger onClick={() => setConfirmDeleteOpen(true)}>
                ลบ LOG เก่า
              </Button>
            }
          />
        )}
      </Card>

      {/* --- Modals --- */}
      <StatusModalComponent
        open={confirmAggregateOpen}
        type="confirm"
        title="ยืนยันการสรุปข้อมูล LOG"
        message="ระบบจะสรุปข้อมูล LOG ทุกวันที่ยังไม่ได้สรุปลงตาราง Daily Summary ใช้เวลาประมาณ 20–30 วินาที ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="สรุปข้อมูล"
        cancelLabel="ยกเลิก"
        onClose={() => setConfirmAggregateOpen(false)}
        onConfirm={handleAggregateConfirm}
      />

      <StatusModalComponent
        open={successAggregateOpen}
        type="success"
        title="สรุปข้อมูลสำเร็จ"
        message={
          aggregateResult && aggregateResult.processed_dates > 0
            ? `สรุปข้อมูลสำเร็จ ${aggregateResult.processed_dates} วัน รวม ${aggregateResult.rows_created.toLocaleString()} รายการ${showDeleteSuggestion ? "\n\nแนะนำให้กด 'ลบ LOG เก่า' เพื่อประหยัดพื้นที่ฐานข้อมูล" : ""}`
            : "ไม่มีข้อมูล log ที่ยังไม่ได้สรุปในขณะนี้"
        }
        confirmLabel={showDeleteSuggestion ? "ลบ LOG เก่าเลย" : "ตกลง"}
        cancelLabel={showDeleteSuggestion ? "ปิด" : undefined}
        onClose={handleAggregateSuccessClose}
        onConfirm={showDeleteSuggestion ? handleSuggestDelete : handleAggregateSuccessClose}
      />

      <StatusModalComponent
        open={confirmDeleteOpen}
        type="delete"
        title="ยืนยันการลบ LOG เก่า"
        message="ระบบจะลบ log การตรวจสอบสถานะ Server ทั้งหมดที่เป็นของวันก่อนหน้า (log วันนี้จะไม่ถูกลบ) การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ LOG เก่า"
        cancelLabel="ยกเลิก"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <StatusModalComponent
        open={successDeleteOpen}
        type="success"
        title="ลบ LOG เก่าสำเร็จ"
        message={`ลบ log เรียบร้อยแล้ว ${deletedCount.toLocaleString()} รายการ`}
        onClose={() => setSuccessDeleteOpen(false)}
      />
    </>
  );
};

export default LogManagementPanel;
