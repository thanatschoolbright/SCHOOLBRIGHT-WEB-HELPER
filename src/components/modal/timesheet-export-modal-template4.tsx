"use client";
import React, { useState } from "react";
import {
  Modal,
  Space,
  Button,
  Typography,
  DatePicker,
  Row,
  Col,
  Card,
  theme,
} from "antd";
import dayjs from "dayjs";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";

type Props = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onExport: (payload: { from: string; to: string }) => Promise<void> | void;
};

export default function ExportModalTemplate4({
  visible,
  loading,
  onClose,
  onExport,
}: Props) {
  const { token } = theme.useToken();
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    dayjs().startOf("month"),
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    dayjs().endOf("month"),
  );

  const handleExport = async () => {
    if (!startDate || !endDate) return;

    await onExport({
      from: startDate.format("YYYY-MM-DD"),
      to: endDate.format("YYYY-MM-DD"),
    });
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Export Template 4 - รายงานสำหรับ Audit</span>
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
        <div style={{ padding: "12px 0" }}>
          <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
            รายงานนี้จะแสดงข้อมูลภาพรวมและหลักฐานการลงเวลาแยกตามโครงการย่อย
            พร้อมรหัสโครงการ ประเภทสินทรัพย์ และสัดส่วนการใช้เวลา
            โดยสามารถกำหนดช่วงเวลาได้ตามต้องการ
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
            <Typography.Text strong>
              <CalendarOutlined style={{ marginRight: 8 }} />
              ระบุช่วงเวลาที่ต้องการข้อมูล
            </Typography.Text>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  วันที่เริ่มต้น (Start Date)
                </Typography.Text>
                <DatePicker
                  style={{ width: "100%" }}
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  format="DD/MM/YYYY"
                  placeholder="เลือกวันที่เริ่มต้น"
                  size="large"
                />
              </Col>
              <Col span={12}>
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  วันที่สิ้นสุด (End Date)
                </Typography.Text>
                <DatePicker
                  style={{ width: "100%" }}
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  format="DD/MM/YYYY"
                  placeholder="เลือกวันที่สิ้นสุด"
                  size="large"
                  minDate={startDate || undefined}
                />
              </Col>
            </Row>
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
            disabled={!startDate || !endDate}
            size="large"
            icon={<FileTextOutlined />}
          >
            Export รายงาน
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
