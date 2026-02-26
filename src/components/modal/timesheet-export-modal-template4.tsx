"use client";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Modal,
  Row,
  Select,
  Space,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ExportModalTemplate4Props = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onExport: (payloads: { from: string; to: string }[]) => Promise<void> | void;
};

const MONTH_OPTIONS = [
  { label: "มกราคม", value: 0 },
  { label: "กุมภาพันธ์", value: 1 },
  { label: "มีนาคม", value: 2 },
  { label: "เมษายน", value: 3 },
  { label: "พฤษภาคม", value: 4 },
  { label: "มิถุนายน", value: 5 },
  { label: "กรกฎาคม", value: 6 },
  { label: "สิงหาคม", value: 7 },
  { label: "กันยายน", value: 8 },
  { label: "ตุลาคม", value: 9 },
  { label: "พฤศจิกายน", value: 10 },
  { label: "ธันวาคม", value: 11 },
];

/**
 * คอมโพเนนต์ Modal สำหรับส่งออกรายงานไทม์ชีท Template 4 แยกตามรายเดือน
 */
export default function ExportModalTemplate4({
  visible,
  loading,
  onClose,
  onExport,
}: ExportModalTemplate4Props) {
  const { token } = theme.useToken();

  // --- States ---
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    dayjs().month(),
  ]);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  /**
   * จัดการคำขอส่งออกข้อมูลรายเดือนที่เลือก
   */
  const requestExportMonthlyReport = useCallback(async () => {
    if (selectedMonths.length === 0) {
      toast.error("โปรดเลือกอย่างน้อย 1 เดือน");
      return;
    }

    try {
      const payloads = selectedMonths
        .sort((a, b) => a - b)
        .map((month) => {
          const startOfMonth = dayjs()
            .year(selectedYear)
            .month(month)
            .startOf("month");
          const endOfMonth = dayjs()
            .year(selectedYear)
            .month(month)
            .endOf("month");
          return {
            from: startOfMonth.format("YYYY-MM-DD"),
            to: endOfMonth.format("YYYY-MM-DD"),
          };
        });

      toast.info(`กำลังจัดเตรียมข้อมูล ${selectedMonths.length} เดือน...`);
      await onExport(payloads);
      toast.success("ส่งออกข้อมูลสำเร็จ");
      onClose();
    } catch (error) {
      console.error("[ExportModalTemplate4][error]", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  }, [selectedMonths, selectedYear, onExport, onClose]);

  // --- Options ---
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: `พ.ศ. ${currentYear - 2 + i + 543}`,
    value: currentYear - 2 + i,
  }));

  return (
    <Modal
      title={
        <Space size={12}>
          <FileTextOutlined style={{ color: token.colorPrimary }} />
          <Typography.Text style={{ fontWeight: 600, fontSize: 16 }}>
            Export Audit Report (Template 4)
          </Typography.Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
      centered
      styles={{
        body: { padding: "12px 0 0 0" },
      }}
    >
      <Flex vertical gap={24}>
        {/* รายละเอียดคำแนะนำ */}
        <Flex
          style={{
            padding: "12px 16px",
            background: token.colorInfoBg,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorInfoBorder}`,
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            ระบบจะสร้างไฟล์ Excel แยกตามรายเดือนที่คุณเลือก (วันที่ 1 -
            สิ้นเดือน) โดยหนึ่งเดือนจะถูกส่งออกเป็น 1 ไฟล์
          </Typography.Text>
        </Flex>

        {/* ส่วนเลือกปีและเดือน */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            background: token.colorFillAlter,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={20}>
            {/* ส่วนหัวการเลือก และ เลือกปี */}
            <Flex justify="space-between" align="center">
              <Space size={8}>
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                <Typography.Text style={{ fontWeight: 600 }}>
                  โปรดเลือกปีและเดือน
                </Typography.Text>
              </Space>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 140 }}
                options={yearOptions}
                size="middle"
              />
            </Flex>

            {/* รายการเดือน */}
            <Card
              bordered={false}
              styles={{ body: { padding: 16 } }}
              style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadius,
              }}
            >
              <Checkbox.Group
                value={selectedMonths}
                onChange={(values) => setSelectedMonths(values as number[])}
                style={{ width: "100%" }}
              >
                <Row gutter={[0, 16]}>
                  {MONTH_OPTIONS.map((month) => (
                    <Col span={6} key={month.value}>
                      <Checkbox value={month.value}>{month.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Card>
          </Flex>
        </Card>

        {/* ปุ่มดำเนินการ */}
        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose} size="large" shape="round">
            ยกเลิก
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={requestExportMonthlyReport}
            disabled={selectedMonths.length === 0}
            size="large"
            shape="round"
            icon={<FileTextOutlined />}
            style={{ fontWeight: 500 }}
          >
            ส่งออกรวม {selectedMonths.length} เดือน
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
