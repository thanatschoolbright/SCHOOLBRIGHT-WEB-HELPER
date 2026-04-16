"use client";

import {
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Modal,
  Row,
  Select,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";
import { toast } from "sonner";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { label: "ทุกสถานะ", value: "" },
  { label: "รออนุมัติ", value: "pending" },
  { label: "อนุมัติแล้ว", value: "approved" },
  { label: "ปฏิเสธ", value: "rejected" },
  { label: "จ่ายเงินแล้ว", value: "paid" },
  { label: "จ่ายเงินล้มเหลว", value: "payment_failed" },
];

interface AdminExportModalProps {
  open: boolean;
  onClose: () => void;
  userOptions: { label: string; value: string }[];
}

/**
 * Modal สำหรับ Export ข้อมูล OT เป็น Excel สำหรับผู้ดูแลระบบ
 * รองรับ filter ตามช่วงวันที่, สถานะ และพนักงาน
 */
const AdminExportModal: React.FC<AdminExportModalProps> = ({
  open,
  onClose,
  userOptions,
}) => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [status, setStatus] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  /**
   * ดาวน์โหลดไฟล์ Excel จาก API
   */
  const handleExport = async () => {
    if (!dateRange) {
      toast.error("กรุณาเลือกช่วงวันที่ก่อน Export");
      return;
    }

    setIsExporting(true);
    try {
      const body: any = {
        from: dateRange[0].startOf("day").toISOString(),
        to: dateRange[1].endOf("day").toISOString(),
      };
      if (status) body.status = status;
      if (userId) body.requester_id = userId;

      const res = await callApiService.post(
        "/api/v1/timesheet/overtime/export",
        body,
        { responseType: "blob" },
      );

      // สร้าง download link จาก blob
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fromLabel = dateRange[0].format("YYYYMM");
      const toLabel = dateRange[1].format("YYYYMM");
      const suffix = fromLabel === toLabel ? fromLabel : `${fromLabel}-${toLabel}`;
      a.href = url;
      a.download = `OT_Report_${suffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("ดาวน์โหลดรายงาน OT สำเร็จ");
      onClose();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการ Export ข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={520}
      title={
        <Flex align="center" gap={8}>
          <FileExcelOutlined style={{ color: "#52c41a" }} />
          <span>Export รายงาน OT เป็น Excel</span>
        </Flex>
      }
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose} disabled={isExporting}>
            ยกเลิก
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={isExporting}
            onClick={handleExport}
          >
            ดาวน์โหลด Excel
          </Button>
        </Flex>
      }
    >
      <Flex vertical gap={16} style={{ paddingBlock: 8 }}>
        <Alert
          type="info"
          showIcon
          message="ข้อมูลที่ Export จะรวมรายละเอียด OT ชั่วโมง สถานะ และผู้รับผิดชอบ"
        />

        <Row gutter={[16, 12]}>
          <Col span={24}>
            <Flex vertical gap={4}>
              <Text strong>ช่วงวันที่ (จำเป็น)</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(dates as [Dayjs, Dayjs] | null)
                }
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                presets={[
                  {
                    label: "เดือนนี้",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "เดือนที่แล้ว",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ],
                  },
                  {
                    label: "3 เดือนย้อนหลัง",
                    value: [dayjs().subtract(3, "month").startOf("month"), dayjs()],
                  },
                  {
                    label: "ปีนี้",
                    value: [dayjs().startOf("year"), dayjs().endOf("year")],
                  },
                ]}
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text strong>สถานะ</Text>
              <Select
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
                style={{ width: "100%" }}
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text strong>พนักงาน</Text>
              <Select
                value={userId || undefined}
                onChange={(v) => setUserId(v ?? "")}
                placeholder="พนักงานทุกคน"
                allowClear
                showSearch
                optionFilterProp="label"
                options={userOptions}
                style={{ width: "100%" }}
              />
            </Flex>
          </Col>
        </Row>
      </Flex>
    </Modal>
  );
};

export default AdminExportModal;
