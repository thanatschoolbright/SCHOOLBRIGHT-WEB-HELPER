"use client";

import {
  CalculatorOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  InputNumber,
  Modal,
  Row,
  Statistic,
  Typography,
} from "antd";
import React, { useMemo, useState } from "react";

const { Text } = Typography;

interface PayCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  // ชั่วโมง OT ที่อนุมัติแล้ว (ส่งมาจาก parent เพื่อให้ auto-populate)
  approvedOtHours?: number;
}

// คำนวณค่าล่วงเวลาตามกฎหมายแรงงานไทย
// สูตร: (เงินเดือน / 30 / 8) * 1.5 * จำนวนชั่วโมง OT
function calcOtPay(
  monthlySalary: number,
  otHours: number,
): {
  hourlyRate: number;
  otHourlyRate: number;
  totalPay: number;
} {
  const hourlyRate = monthlySalary / 30 / 8;
  const otHourlyRate = hourlyRate * 1.5;
  const totalPay = otHourlyRate * otHours;
  return { hourlyRate, otHourlyRate, totalPay };
}

// แสดงตัวเลขในรูปแบบสกุลเงินบาทไทย
function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Modal คำนวณค่าล่วงเวลา — ไม่บันทึกข้อมูลลงฐานข้อมูล
const PayCalculatorModal: React.FC<PayCalculatorModalProps> = ({
  open,
  onClose,
  approvedOtHours = 0,
}) => {
  const [monthlySalary, setMonthlySalary] = useState<number | null>(null);
  const [otHours, setOtHours] = useState<number | null>(
    approvedOtHours > 0 ? approvedOtHours : null,
  );

  // คำนวณผลลัพธ์เมื่อมีข้อมูลครบ
  const result = useMemo(() => {
    if (!monthlySalary || monthlySalary <= 0) return null;
    if (!otHours || otHours <= 0) return null;
    return calcOtPay(monthlySalary, otHours);
  }, [monthlySalary, otHours]);

  // รีเซ็ตค่าเมื่อปิด modal
  const handleClose = () => {
    setMonthlySalary(null);
    setOtHours(approvedOtHours > 0 ? approvedOtHours : null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      centered
      width={540}
      title={
        <Flex align="center" gap={8}>
          <CalculatorOutlined style={{ color: "#1677ff" }} />
          <span>คำนวณเงินที่ได้รับ</span>
        </Flex>
      }
      footer={
        <Flex justify="end">
          <Button onClick={handleClose}>ปิด</Button>
        </Flex>
      }
    >
      <Flex vertical gap={16} style={{ paddingBlock: 8 }}>
        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          message="การคำนวณนี้เป็นการประมาณเบื้องต้นเท่านั้น ไม่บันทึกข้อมูลใดลงระบบ"
          description="สูตร: (เงินเดือน / 30 วัน / 8 ชม.) x 1.5 x จำนวนชั่วโมง OT ตามกฎหมายแรงงานไทย"
        />

        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Flex vertical gap={4}>
              <Text strong>เงินเดือน (บาท/เดือน)</Text>
              <InputNumber
                value={monthlySalary}
                onChange={(v) => setMonthlySalary(v)}
                min={0}
                max={10000000}
                step={1000}
                formatter={(v) =>
                  v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                }
                parser={(v) => Number(String(v).replace(/,/g, "")) as any}
                placeholder="ระบุเงินเดือน"
                style={{ width: "100%" }}
                size="large"
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text strong>จำนวนชั่วโมง OT</Text>
              <Space.Compact style={{ width: "100%" }} size="large">
                <InputNumber
                  value={otHours}
                  onChange={(v) => setOtHours(v)}
                  min={0.5}
                  max={744}
                  step={0.5}
                  placeholder="จำนวนชั่วโมง"
                  style={{ width: "100%" }}
                />
                <Button disabled style={{ color: "inherit" }}>
                  ชม.
                </Button>
              </Space.Compact>
            </Flex>
          </Col>
        </Row>

        <Divider style={{ margin: "4px 0" }} />

        {result ? (
          <Card styles={{ body: { padding: 16 } }}>
            <Flex vertical gap={12}>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Statistic
                    title="อัตราค่าจ้างปกติต่อชั่วโมง"
                    value={formatBaht(result.hourlyRate)}
                    suffix="บาท"
                    valueStyle={{ fontSize: 16, fontWeight: 600 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="อัตรา OT (x1.5) ต่อชั่วโมง"
                    value={formatBaht(result.otHourlyRate)}
                    suffix="บาท"
                    valueStyle={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#fa8c16",
                    }}
                  />
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              <Flex align="center" justify="space-between">
                <Flex align="center" gap={8}>
                  <DollarOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                  <Text strong style={{ fontSize: 15 }}>
                    ค่า OT ที่คาดว่าจะได้รับ
                  </Text>
                </Flex>
                <Text
                  strong
                  style={{ fontSize: 22, fontWeight: 600, color: "#52c41a" }}
                >
                  {formatBaht(result.totalPay)} บาท
                </Text>
              </Flex>

              <Text type="secondary" style={{ fontSize: 11 }}>
                คำนวณจาก: {formatBaht(monthlySalary ?? 0)} / 30 / 8 x 1.5 x{" "}
                {otHours} ชม. = {formatBaht(result.totalPay)} บาท
              </Text>
            </Flex>
          </Card>
        ) : (
          <Card styles={{ body: { padding: 16 } }}>
            <Flex justify="center" align="center" style={{ minHeight: 80 }}>
              <Text type="secondary">
                กรอกเงินเดือนและจำนวนชั่วโมง OT เพื่อคำนวณ
              </Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </Modal>
  );
};

export default PayCalculatorModal;
