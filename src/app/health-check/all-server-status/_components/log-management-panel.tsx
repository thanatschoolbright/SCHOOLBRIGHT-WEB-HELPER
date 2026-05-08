"use client";

import {
  CheckCircleOutlined,
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
  Space,
  Statistic,
  Typography,
  theme,
} from "antd";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { useServerStatusStore } from "../_state/server-status.state";

// ✨ Panel จัดการ LOG — สรุปรายวัน + ลบ log เก่า พร้อม confirm ทุกขั้นตอน
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

  // State สำหรับ confirm modal
  const [confirmAggregateOpen, setConfirmAggregateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // State สำหรับผลลัพธ์หลังสรุป
  const [aggregateResult, setAggregateResult] = useState<{
    processed_dates: number;
    rows_created: number;
  } | null>(null);
  const [showDeleteSuggestion, setShowDeleteSuggestion] = useState(false);

  // State สำหรับ success modal
  const [successAggregateOpen, setSuccessAggregateOpen] = useState(false);
  const [successDeleteOpen, setSuccessDeleteOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  // ✨ ขั้นตอนที่ 1: ผู้ใช้กด "สรุปข้อมูล LOG รายวัน" → confirm modal
  const handleAggregateConfirm = async () => {
    setConfirmAggregateOpen(false);
    const result = await aggregateLogs();
    if (result.success) {
      setAggregateResult({ processed_dates: result.processed_dates, rows_created: result.rows_created });
      setShowDeleteSuggestion(result.processed_dates > 0);
      setSuccessAggregateOpen(true);
      // รีเฟรช graph และ summary
      fetchDailySummary();
      fetchLogSummary();
    }
  };

  // ✨ ขั้นตอนที่ 2: หลังสรุปเสร็จ → แนะนำให้ลบ log → confirm delete modal
  const handleSuggestDelete = () => {
    setSuccessAggregateOpen(false);
    setConfirmDeleteOpen(true);
  };

  // ✨ ขั้นตอนที่ 3: ผู้ใช้ยืนยันลบ → ลบ log เก่า
  const handleDeleteConfirm = async () => {
    setConfirmDeleteOpen(false);
    const result = await deleteOldLogs();
    if (result.success) {
      setDeletedCount(result.deleted_count);
      setShowDeleteSuggestion(false);
      setSuccessDeleteOpen(true);
      // รีเฟรช log list
      fetchLogs(1);
      fetchLogSummary();
    }
  };

  // ✨ ปิด success modal หลังสรุป (ไม่ลบ)
  const handleAggregateSuccessClose = () => {
    setSuccessAggregateOpen(false);
    if (showDeleteSuggestion) {
      toast.info("แนะนำให้กด 'ลบ LOG เก่า' เพื่อประหยัดพื้นที่ฐานข้อมูล");
    }
  };

  return (
    <>
      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
        title={
          <Flex align="center" gap={12} style={{ padding: "8px 0" }}>
            <div
              style={{
                background: token.colorWarning,
                padding: 8,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 8px ${token.colorWarning}40`,
              }}
            >
              <DatabaseOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
            </div>
            <Flex vertical>
              <Typography.Text strong style={{ fontSize: "1rem", lineHeight: 1.2 }}>
                จัดการข้อมูล LOG
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                สรุปข้อมูลรายวันและล้าง log เก่าเพื่อประหยัดพื้นที่ฐานข้อมูล
              </Typography.Text>
            </Flex>
          </Flex>
        }
      >
        <Flex gap={16} wrap="wrap" align="center">
          <Flex vertical gap={4} style={{ flex: 1, minWidth: 240 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ขั้นตอนที่ 1 — สรุปข้อมูล log ทุกวันที่ยังไม่ได้สรุป บันทึกลงตาราง Daily Summary
            </Typography.Text>
            <Button
              type="primary"
              icon={<SyncOutlined spin={isAggregating} />}
              loading={isAggregating}
              onClick={() => setConfirmAggregateOpen(true)}
              style={{ width: "fit-content" }}
            >
              สรุปข้อมูล LOG รายวัน
            </Button>
          </Flex>

          <Flex vertical gap={4} style={{ flex: 1, minWidth: 240 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ขั้นตอนที่ 2 — ลบ log เฉพาะวันก่อนหน้า (log วันนี้จะไม่ถูกลบ)
            </Typography.Text>
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={isDeletingLogs}
              onClick={() => setConfirmDeleteOpen(true)}
              style={{ width: "fit-content" }}
            >
              ลบ LOG เก่า
            </Button>
          </Flex>
        </Flex>

        {showDeleteSuggestion && (
          <Alert
            style={{ marginTop: 16, borderRadius: 8 }}
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

      {/* Confirm: สรุปข้อมูล */}
      <StatusModalComponent
        open={confirmAggregateOpen}
        type="confirm"
        title="ยืนยันการสรุปข้อมูล LOG"
        message="ระบบจะสรุปข้อมูล LOG ทุกวันที่ยังไม่ได้สรุปลงตาราง Daily Summary ใช้เวลาสักครู่ ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="สรุปข้อมูล"
        cancelLabel="ยกเลิก"
        loading={isAggregating}
        onClose={() => setConfirmAggregateOpen(false)}
        onConfirm={handleAggregateConfirm}
      />

      {/* Success: หลังสรุป — แสดงผลลัพธ์ + แนะนำลบ */}
      <StatusModalComponent
        open={successAggregateOpen}
        type="success"
        title="สรุปข้อมูลสำเร็จ"
        message={
          aggregateResult && aggregateResult.processed_dates > 0
            ? `สรุปข้อมูลสำเร็จ ${aggregateResult.processed_dates} วัน รวม ${aggregateResult.rows_created} รายการ${showDeleteSuggestion ? "\n\nแนะนำให้กด 'ลบ LOG เก่า' เพื่อประหยัดพื้นที่ฐานข้อมูล" : ""}`
            : "ไม่มีข้อมูล log ที่ยังไม่ได้สรุปในขณะนี้"
        }
        confirmLabel={showDeleteSuggestion ? "ลบ LOG เก่าเลย" : "ตกลง"}
        cancelLabel={showDeleteSuggestion ? "ปิด" : undefined}
        onClose={handleAggregateSuccessClose}
        onConfirm={showDeleteSuggestion ? handleSuggestDelete : handleAggregateSuccessClose}
      />

      {/* Confirm: ลบ log เก่า */}
      <StatusModalComponent
        open={confirmDeleteOpen}
        type="delete"
        title="ยืนยันการลบ LOG เก่า"
        message="ระบบจะลบ log การตรวจสอบสถานะ Server ทั้งหมดที่เป็นของวันก่อนหน้า (log วันนี้จะไม่ถูกลบ) การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ LOG เก่า"
        cancelLabel="ยกเลิก"
        loading={isDeletingLogs}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success: หลังลบ */}
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
