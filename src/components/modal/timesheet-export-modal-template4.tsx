"use client";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Modal,
  Row,
  Select,
  Space,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

type Props = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onExport: (payloads: { from: string; to: string }[]) => Promise<void> | void;
};

const MONTHS = [
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

export default function ExportModalTemplate4({
  visible,
  loading,
  onClose,
  onExport,
}: Props) {
  const { token } = theme.useToken();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    dayjs().month(),
  ]);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const handleExport = async () => {
    if (selectedMonths.length === 0) return;

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

    await onExport(payloads);
    onClose();
  };

  const currentYear = dayjs().year();
  const years = Array.from({ length: 5 }, (_, i) => ({
    label: `พ.ศ. ${currentYear - 2 + i + 543}`,
    value: currentYear - 2 + i,
  }));

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Export Template 4 - รายงานรายเดือนสำหรับ Audit</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={600}
      centered
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div style={{ padding: "8px 0" }}>
          <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
            ระบบจะสร้างไฟล์ Excel แยกตามรายเดือนที่คุณเลือก (วันที่ 1 -
            สิ้นเดือน) โดยหนึ่งเดือนจะถูกส่งออกเป็น 1 ไฟล์
          </Typography.Text>
        </div>

        <Card
          size="small"
          bordered={false}
          style={{
            background: token.colorBgLayout,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Row justify="space-between" align="middle">
              <Col>
                <Typography.Text strong>
                  <CalendarOutlined
                    style={{ marginRight: 8, color: token.colorPrimary }}
                  />
                  โปรดเลือกปีและเดือนที่ต้องการส่งออก
                </Typography.Text>
              </Col>
              <Col>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 120 }}
                  options={years}
                  size="small"
                />
              </Col>
            </Row>

            <div
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: token.borderRadius,
              }}
            >
              <Checkbox.Group
                value={selectedMonths}
                onChange={(vals) => setSelectedMonths(vals as number[])}
                style={{ width: "100%" }}
              >
                <Row gutter={[0, 16]}>
                  {MONTHS.map((m) => (
                    <Col span={6} key={m.value}>
                      <Checkbox value={m.value}>{m.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>
          </Space>
        </Card>

        <Space
          style={{ width: "100%", justifyContent: "flex-end", paddingTop: 8 }}
        >
          <Button onClick={onClose} size="large">
            ยกเลิก
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleExport}
            disabled={selectedMonths.length === 0}
            size="large"
            icon={<FileTextOutlined />}
          >
            Export รวม {selectedMonths.length} เดือน
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
