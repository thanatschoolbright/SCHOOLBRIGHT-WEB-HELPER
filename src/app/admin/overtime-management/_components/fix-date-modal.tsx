"use client";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ScanOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DatePicker,
  Flex,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface AnomalousRecord {
  description_id: number;
  overtime_id: number;
  overtime_status: string;
  request_date: string | null;
  start_date: string;
  end_date: string;
  suggested_end_date: string;
  duration: number;
  description: string;
}

interface FixDateModalProps {
  open: boolean;
  onClose: () => void;
  /** กรองเฉพาะ OT ID เดียว — ถ้าไม่ส่งจะโหลดทั้งหมด */
  overtimeId?: number | null;
  onFixed?: () => void;
}

/**
 * Modal สำหรับผู้ดูแลระบบ เพื่อแสดงและแก้ไขรายการ OT ที่วันที่ผิดปกติ (end_date < start_date)
 */
const FixDateModal: React.FC<FixDateModalProps> = ({
  open,
  onClose,
  overtimeId,
  onFixed,
}) => {
  const [records, setRecords] = useState<AnomalousRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [fixMode, setFixMode] = useState<"auto" | "manual">("auto");
  const [manualEndDate, setManualEndDate] = useState<dayjs.Dayjs | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  // โหลดรายการที่วันผิดเมื่อ modal เปิด
  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setFixMode("auto");
    setManualEndDate(null);
    void loadAnomalousRecords();
  }, [open, overtimeId]);

  const loadAnomalousRecords = async () => {
    setLoading(true);
    try {
      const url = overtimeId
        ? `/api/v1/timesheet/overtime/fix-dates?overtime_id=${overtimeId}`
        : `/api/v1/timesheet/overtime/fix-dates`;
      const res = await callApiService.get(url);
      if (res?.data?.status === 200) {
        setRecords(res.data.data ?? []);
      } else {
        toast.error("ไม่สามารถโหลดรายการวันที่ผิดได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? records.map((r) => r.description_id) : []);
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleFix = async () => {
    if (selectedIds.length === 0) {
      toast.warning("โปรดเลือกรายการที่ต้องการแก้ไข");
      return;
    }
    if (fixMode === "manual" && !manualEndDate) {
      toast.warning("โปรดระบุวันที่สิ้นสุดที่ถูกต้อง");
      return;
    }

    setIsFixing(true);
    try {
      const res = await callApiService.patch(
        "/api/v1/timesheet/overtime/fix-dates",
        {
          description_ids: selectedIds,
          mode: fixMode,
          ...(fixMode === "manual"
            ? { manual_end_date: manualEndDate!.toISOString() }
            : {}),
        },
      );

      if (res?.data?.status === 200) {
        toast.success(res.data.message_th || "แก้ไขวันที่สำเร็จ");
        onFixed?.();
        // โหลดใหม่เพื่อแสดงรายการที่เหลือ
        await loadAnomalousRecords();
        setSelectedIds([]);
      } else {
        toast.error("แก้ไขไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขวันที่");
    } finally {
      setIsFixing(false);
    }
  };

  const formatDateTime = (iso: string) => dayjs(iso).format("DD/MM/YYYY HH:mm");

  const columns = [
    {
      title: "",
      key: "select",
      width: 48,
      render: (_: any, record: AnomalousRecord) => (
        <Checkbox
          checked={selectedIds.includes(record.description_id)}
          onChange={() => handleToggle(record.description_id)}
        />
      ),
    },
    {
      title: "OT ID",
      dataIndex: "overtime_id",
      key: "overtime_id",
      width: 80,
      render: (id: number) => (
        <Typography.Text type="secondary" style={{ fontWeight: 600 }}>
          #{id}
        </Typography.Text>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "overtime_status",
      key: "overtime_status",
      width: 110,
      render: (s: string) => {
        const map: Record<string, string> = {
          pending: "gold",
          approved: "green",
          rejected: "red",
          paid: "cyan",
        };
        const label: Record<string, string> = {
          pending: "รออนุมัติ",
          approved: "อนุมัติแล้ว",
          rejected: "ปฏิเสธ",
          paid: "จ่ายแล้ว",
        };
        return <Tag color={map[s] ?? "default"}>{label[s] ?? s}</Tag>;
      },
    },
    {
      title: "วันที่เริ่ม (ปัจจุบัน)",
      dataIndex: "start_date",
      key: "start_date",
      render: (v: string) => formatDateTime(v),
    },
    {
      title: "วันที่สิ้นสุด (ผิด)",
      dataIndex: "end_date",
      key: "end_date",
      render: (v: string) => (
        <Flex align="center" gap={6}>
          <CloseCircleOutlined style={{ color: "#ef4444" }} />
          <Typography.Text style={{ color: "#ef4444", fontWeight: 600 }}>
            {formatDateTime(v)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "วันที่สิ้นสุด (แนะนำ)",
      dataIndex: "suggested_end_date",
      key: "suggested_end_date",
      render: (v: string) => (
        <Flex align="center" gap={6}>
          <CheckCircleOutlined style={{ color: "#22c55e" }} />
          <Typography.Text style={{ color: "#22c55e", fontWeight: 600 }}>
            {formatDateTime(v)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "ชั่วโมง (ปัจจุบัน)",
      dataIndex: "duration",
      key: "duration",
      width: 130,
      render: (v: number) => (
        <Badge
          count={`${v} ชม.`}
          style={{ backgroundColor: "#1677ff", fontWeight: 600 }}
        />
      ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      render: (v: string) => (
        <Tooltip title={v}>
          <Typography.Text ellipsis style={{ maxWidth: 200, display: "block" }}>
            {v}
          </Typography.Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Flex align="center" gap={10}>
          <ToolOutlined style={{ color: "#f97316", fontSize: 18 }} />
          <Typography.Text strong style={{ fontSize: 16 }}>
            แก้ไขวันที่ผิดปกติ (end_date &lt; start_date)
          </Typography.Text>
          {records.length > 0 && <Tag color="red">{records.length} รายการ</Tag>}
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      centered
    >
      <Flex vertical gap={16} style={{ marginTop: 8 }}>
        {/* คำอธิบาย */}
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="ระบบตรวจพบรายการที่ end_date มีค่าน้อยกว่า start_date"
          description="สาเหตุมาจาก Bug ขณะบันทึกข้อมูลข้ามเที่ยงคืน โดย end_date ถูกบันทึกผิดวัน (-1 วัน) ระบบแนะนำให้เพิ่ม 1 วันเพื่อแก้ไข"
          style={{ borderRadius: 8 }}
        />

        {/* ตัวเลือกโหมดแก้ไข */}
        <Flex align="center" gap={24} wrap="wrap">
          <Typography.Text strong>โหมดแก้ไข:</Typography.Text>
          <Radio.Group
            value={fixMode}
            onChange={(e) => setFixMode(e.target.value)}
          >
            <Radio value="auto">อัตโนมัติ — เพิ่ม 1 วันจาก end_date เดิม</Radio>
            <Radio value="manual">กำหนดเอง — ระบุ end_date ที่ถูกต้อง</Radio>
          </Radio.Group>
          {fixMode === "manual" && (
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="DD/MM/YYYY HH:mm"
              placeholder="ระบุวันที่สิ้นสุดที่ถูกต้อง"
              value={manualEndDate}
              onChange={setManualEndDate}
              style={{ height: 36, borderRadius: 8 }}
            />
          )}
        </Flex>

        {/* ตาราง */}
        <Table
          dataSource={records}
          columns={columns}
          rowKey="description_id"
          loading={loading}
          size="small"
          pagination={false}
          scroll={{ x: "max-content" }}
          title={() => (
            <Flex justify="space-between" align="center">
              <Checkbox
                checked={
                  selectedIds.length === records.length && records.length > 0
                }
                indeterminate={
                  selectedIds.length > 0 && selectedIds.length < records.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                <Typography.Text style={{ fontWeight: 600 }}>
                  เลือกทั้งหมด ({records.length} รายการ)
                </Typography.Text>
              </Checkbox>
              <Space>
                <Button
                  icon={<ScanOutlined />}
                  size="small"
                  onClick={loadAnomalousRecords}
                  loading={loading}
                >
                  โหลดใหม่
                </Button>
              </Space>
            </Flex>
          )}
          locale={{ emptyText: "ไม่พบรายการที่มีวันที่ผิดปกติ" }}
        />

        {/* Footer Actions */}
        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose} style={{ borderRadius: 8, height: 40 }}>
            ปิด
          </Button>
          <Button
            type="primary"
            icon={<ToolOutlined />}
            loading={isFixing}
            disabled={selectedIds.length === 0}
            onClick={handleFix}
            style={{ borderRadius: 8, height: 40, paddingInline: 24 }}
          >
            แก้ไข {selectedIds.length > 0 ? `${selectedIds.length} รายการ` : ""}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export { FixDateModal };
