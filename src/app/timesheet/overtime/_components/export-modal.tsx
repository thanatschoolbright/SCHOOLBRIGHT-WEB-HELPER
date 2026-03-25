"use client";

import {
  CloudDownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Flex,
  Modal,
  Progress,
  Result,
  Row,
  Space,
  Steps,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React from "react";

dayjs.extend(buddhistEra);

interface ExportModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onExport: (dateRange?: [dayjs.Dayjs, dayjs.Dayjs]) => Promise<boolean>;
  loading: boolean;
  exportStepCount: number;
  setExportStepCount: (v: number) => void;
  isExportOperationSuccess: boolean;
  setIsExportOperationSuccess: (v: boolean) => void;
  exportSelectedDateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  setExportSelectedDateRange: (v: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
}

/**
 * Modal สำหรับเลือกช่วงวันที่และส่งออกรายงาน OT
 */
const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  setVisible,
  onExport,
  loading,
  exportStepCount,
  setExportStepCount,
  isExportOperationSuccess,
  setIsExportOperationSuccess,
  exportSelectedDateRange,
  setExportSelectedDateRange,
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      title={
        <Space>
          <CloudDownloadOutlined /> ศูนย์บริการการนำออกข้อมูลรายงาน
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={560}
      centered
    >
      {isExportOperationSuccess ? (
        // แสดงผลลัพธ์หลังส่งออกสำเร็จ
        <Result
          status="success"
          title="ระบบปฏิบัติการประมวลผลสำเร็จ"
          subTitle="ข้อมูลรายงาน OT ถูกส่งมอบไปยังเบราว์เซอร์ของท่านแล้ว โปรดตรวจสอบที่ไฟล์ดาวน์โหลด"
          extra={[
            <Button key="close" size="large" onClick={() => setVisible(false)}>
              ปิดการทำงาน
            </Button>,
            <Button
              key="retry"
              type="link"
              onClick={() => {
                setIsExportOperationSuccess(false);
                setExportStepCount(0);
              }}
            >
              ส่งออกรายงานชุดอื่น
            </Button>,
          ]}
        />
      ) : (
        <Flex vertical gap={40} style={{ paddingBlock: 32 }}>
          {/* ส่วนเลือกช่วงวันที่ */}
          <Flex vertical gap={12} align="center">
            <Typography.Text strong>
              กำหนดช่วงเวลาในการส่งออก (Start - End Date)
            </Typography.Text>
            <DatePicker.RangePicker
              size="large"
              allowClear={false}
              value={exportSelectedDateRange}
              onChange={(dates) =>
                setExportSelectedDateRange(
                  dates as [dayjs.Dayjs, dayjs.Dayjs],
                )
              }
              style={{ width: "100%" }}
              format="DD / MM / BBBB"
            />
            <Typography.Text type="secondary">
              ระบบจะประมวลผลตามช่วงวันที่ระบุ รวมถึงสรุปยอดสะสม (Payroll)
            </Typography.Text>
          </Flex>

          {/* แสดงขั้นตอนการส่งออก */}
          <Flex
            vertical
            gap={16}
            style={{
              background: token.colorFillQuaternary,
              padding: 32,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Steps
              direction="vertical"
              size="small"
              current={exportStepCount > 0 ? exportStepCount - 1 : undefined}
              status={loading ? "process" : "wait"}
              items={[
                {
                  title: "ขั้นตอนตรวจสอบสิทธิ์และข้อมูล",
                  description: "ระบบกำลัง Mapping โครงสร้างข้อมูลสมาชิก",
                },
                {
                  title: "ขั้นตอนประมวลผลสูตรคำนวณ",
                  description: "กำลังคำนวณชั่วโมงงานล่วงเวลาทั้งหมดในงวด",
                },
                {
                  title: "ขั้นตอนเข้ารหัสและจัดส่งไฟล์",
                  description: "กำลัง Generate ไฟล์รูปแบบ .xlsx และส่งมอบ",
                },
              ]}
            />
          </Flex>

          {/* ปุ่มส่งออก */}
          {exportStepCount === 0 && (
            <Row gutter={20}>
              <Col span={12}>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  loading={loading}
                  onClick={() => onExport(exportSelectedDateRange ?? undefined)}
                  block
                  size="large"
                  style={{ fontWeight: 600 }}
                >
                  Export Excel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  disabled
                  icon={<FilePdfOutlined />}
                  block
                  size="large"
                  style={{ fontWeight: 600 }}
                >
                  Export PDF
                </Button>
              </Col>
            </Row>
          )}

          {/* แสดงความคืบหน้าขณะประมวลผล */}
          {loading && (
            <Flex vertical align="center" gap={16}>
              <Progress
                percent={
                  exportStepCount === 1 ? 33 : exportStepCount === 2 ? 66 : 100
                }
                status="active"
                strokeColor={{
                  "0%": token.colorPrimary,
                  "100%": token.colorSuccess,
                }}
                style={{ width: "80%" }}
              />
              <Typography.Text type="secondary" italic>
                ระบบกำลังเชื่อมต่อกับ Cloud Infrastructure...
              </Typography.Text>
            </Flex>
          )}
        </Flex>
      )}
    </Modal>
  );
};

export default ExportModal;
