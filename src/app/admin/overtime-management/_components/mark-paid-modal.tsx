"use client";

import {
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Flex,
  Modal,
  Progress,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

const { Text } = Typography;

interface MarkPaidModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onSuccess: () => void;
}

type ProcessState = "idle" | "processing" | "done";

/**
 * Modal สำหรับ Mark as Paid แบบ Batch
 * แสดงรายการ OT ที่ approved แล้ว ให้ admin เลือกและเปลี่ยนสถานะเป็น paid พร้อมกัน
 * พร้อม Export รายการที่จ่ายแล้วส่ง Finance
 */
const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  open,
  onClose,
  currentUserId,
  onSuccess,
}) => {
  const { dataSource } = useAdminOvertimeStore();

  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [processState, setProcessState] = useState<ProcessState>("idle");
  const [progress, setProgress] = useState(0);
  const [resultSummary, setResultSummary] = useState<{
    success: number;
    failed: number;
  }>({ success: 0, failed: 0 });
  const [isExporting, setIsExporting] = useState(false);

  // กรองเฉพาะรายการที่ approved และยังไม่ได้จ่าย
  const approvedItems = useMemo(
    () => dataSource.filter((r) => r.status === "approved"),
    [dataSource],
  );

  // คำนวณชั่วโมง OT รวมของรายการที่เลือก
  const selectedHours = useMemo(() => {
    const selectedSet = new Set(selectedKeys);
    return dataSource
      .filter((r) => selectedSet.has(r.id))
      .reduce((sum, r) => {
        const hrs = (r.descriptions || []).reduce(
          (s: number, d: any) => s + (Number(d.duration) || 0),
          0,
        );
        return sum + hrs;
      }, 0);
  }, [selectedKeys, dataSource]);

  // รีเซ็ตสถานะเมื่อปิด modal
  const handleClose = () => {
    if (processState === "processing") return;
    setSelectedKeys([]);
    setProcessState("idle");
    setProgress(0);
    setResultSummary({ success: 0, failed: 0 });
    onClose();
  };

  /**
   * ดำเนินการ Mark as Paid ทีละรายการพร้อม progress bar
   */
  const handleConfirmPaid = async () => {
    if (!selectedKeys.length) {
      toast.error("กรุณาเลือกรายการที่ต้องการทำเครื่องหมายจ่ายแล้ว");
      return;
    }

    setProcessState("processing");
    setProgress(0);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedKeys.length; i++) {
      const id = selectedKeys[i] as string | number;
      try {
        const res = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${id}`,
          { status: "paid", updated_by: Number(currentUserId) },
        );
        if (res?.data?.status === 200) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      setProgress(Math.round(((i + 1) / selectedKeys.length) * 100));
    }

    setResultSummary({ success: successCount, failed: failCount });
    setProcessState("done");

    if (successCount > 0) {
      toast.success(`ทำเครื่องหมายจ่ายเงินแล้ว ${successCount} รายการ`);
      onSuccess();
    }
    if (failCount > 0) {
      toast.error(`ไม่สามารถดำเนินการได้ ${failCount} รายการ`);
    }
  };

  /**
   * Export รายการที่เลือกเป็น Excel สำหรับส่ง Finance
   * ใช้ช่วงวันที่จากรายการที่เลือก
   */
  const handleExportForFinance = async () => {
    if (!selectedKeys.length) {
      toast.error("กรุณาเลือกรายการก่อน Export");
      return;
    }

    setIsExporting(true);
    try {
      const selectedSet = new Set(selectedKeys);
      const selectedRecords = dataSource.filter((r) => selectedSet.has(r.id));

      const timestamps = selectedRecords
        .map((r) => r.request_date || r.created_at)
        .filter(Boolean)
        .map((d) => dayjs(d).valueOf());

      const from =
        timestamps.length > 0
          ? dayjs(Math.min(...timestamps)).startOf("day").toISOString()
          : dayjs().startOf("month").toISOString();
      const to =
        timestamps.length > 0
          ? dayjs(Math.max(...timestamps)).endOf("day").toISOString()
          : dayjs().endOf("day").toISOString();

      const res = await callApiService.post(
        "/api/v1/timesheet/overtime/export",
        { from, to, status: "paid" },
        { responseType: "blob" },
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OT_Paid_Finance_${dayjs().format("YYYYMMDD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("ดาวน์โหลดรายงานสำหรับ Finance สำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการ Export");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      title: "รหัส OT",
      dataIndex: "id",
      width: 80,
      render: (id: any) => (
        <Text type="secondary" style={{ fontWeight: 600 }}>
          #{id}
        </Text>
      ),
    },
    {
      title: "พนักงาน",
      key: "name",
      render: (_: any, r: any) => {
        const name =
          `${r.requester_firstname_th || ""} ${r.requester_lastname_th || ""}`.trim() ||
          r.requester_name ||
          "ไม่ระบุ";
        return (
          <Flex vertical gap={0}>
            <Text style={{ fontWeight: 600 }}>{name}</Text>
            {r.requester_employee_code && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.requester_employee_code}
              </Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: "วันที่ขอ",
      dataIndex: "request_date",
      width: 110,
      render: (d: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "ชั่วโมง OT",
      key: "hours",
      width: 100,
      render: (_: any, r: any) => {
        const h = (r.descriptions || []).reduce(
          (s: number, d: any) => s + (Number(d.duration) || 0),
          0,
        );
        return <Tag color="blue">{h} ชม.</Tag>;
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      centered
      width={720}
      maskClosable={processState !== "processing"}
      closable={processState !== "processing"}
      title={
        <Flex align="center" gap={8}>
          <DollarOutlined style={{ color: "#52c41a" }} />
          <span>ทำเครื่องหมายจ่าย OT แล้ว (Batch)</span>
        </Flex>
      }
      footer={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportForFinance}
            loading={isExporting}
            disabled={processState === "processing" || !selectedKeys.length}
          >
            Export ส่ง Finance
          </Button>
          <Flex gap={8}>
            <Button
              onClick={handleClose}
              disabled={processState === "processing"}
            >
              {processState === "done" ? "ปิด" : "ยกเลิก"}
            </Button>
            {processState !== "done" && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmPaid}
                loading={processState === "processing"}
                disabled={!selectedKeys.length}
              >
                ยืนยันจ่ายแล้ว {selectedKeys.length > 0 ? `(${selectedKeys.length} รายการ)` : ""}
              </Button>
            )}
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={16} style={{ paddingBlock: 8 }}>
        {/* สรุปรายการที่เลือก */}
        {selectedKeys.length > 0 && processState === "idle" && (
          <Alert
            type="info"
            showIcon
            message={
              <Flex gap={12} align="center">
                <Text>
                  เลือก{" "}
                  <Text strong style={{ color: "#1677ff" }}>
                    {selectedKeys.length}
                  </Text>{" "}
                  รายการ
                </Text>
                <Text type="secondary">|</Text>
                <Text>
                  รวม{" "}
                  <Text strong style={{ color: "#1677ff" }}>
                    {selectedHours.toFixed(1)}
                  </Text>{" "}
                  ชั่วโมง
                </Text>
              </Flex>
            }
          />
        )}

        {/* Progress bar ระหว่างประมวลผล */}
        {processState === "processing" && (
          <Flex vertical gap={8}>
            <Text>กำลังดำเนินการ... โปรดรอ</Text>
            <Progress percent={progress} status="active" />
          </Flex>
        )}

        {/* ผลลัพธ์หลังเสร็จสิ้น */}
        {processState === "done" && (
          <Alert
            type={resultSummary.failed === 0 ? "success" : "warning"}
            showIcon
            message={
              <Flex gap={12}>
                {resultSummary.success > 0 && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    สำเร็จ {resultSummary.success} รายการ
                  </Tag>
                )}
                {resultSummary.failed > 0 && (
                  <Tag color="red">ล้มเหลว {resultSummary.failed} รายการ</Tag>
                )}
              </Flex>
            }
            action={
              resultSummary.success > 0 && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleExportForFinance}
                  loading={isExporting}
                >
                  Export ส่ง Finance
                </Button>
              )
            }
          />
        )}

        {/* ตารางรายการ approved */}
        {processState !== "done" && (
          <Table
            dataSource={approvedItems}
            columns={columns}
            rowKey="id"
            size="small"
            scroll={{ y: 360 }}
            pagination={false}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
              getCheckboxProps: () => ({
                disabled: processState === "processing",
              }),
            }}
            locale={{
              emptyText: "ไม่มีรายการที่อนุมัติแล้วรอจ่ายเงิน",
            }}
          />
        )}
      </Flex>
    </Modal>
  );
};

export default MarkPaidModal;
