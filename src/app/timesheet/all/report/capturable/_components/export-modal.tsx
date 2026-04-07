"use client";

import { FileExcelOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Modal,
  Progress,
  theme,
  Typography,
} from "antd";
import { useEffect } from "react";

import { useCapturableStore } from "../_state/use-capturable-store";

const { Text, Title } = Typography;

export const ExportModal: React.FC = () => {
  const { token } = theme.useToken();
  const {
    exportModalVisible,
    countdown,
    isCounting,
    dateRange,
    setExportModalVisible,
    setCountdown,
    setIsCounting,
    exportExcel,
  } = useCapturableStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isCounting && countdown === 0) {
      setIsCounting(false);
      setExportModalVisible(false);
      setCountdown(3);
      void exportExcel();
    }
    return () => clearTimeout(timer);
  }, [isCounting, countdown, setCountdown, setIsCounting, setExportModalVisible, exportExcel]);

  return (
    <Modal
      open={exportModalVisible}
      onCancel={() => {
        if (!isCounting) {
          setExportModalVisible(false);
          setIsCounting(false);
        }
      }}
      footer={null}
      centered
      width={500}
      styles={{ body: { padding: "32px 24px" } }}
    >
      <Flex vertical align="center" gap={24}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: token.colorSuccessBg,
          }}
        >
          <FileExcelOutlined style={{ fontSize: 40, color: token.colorSuccess }} />
        </Flex>

        <Flex vertical align="center" gap={4}>
          <Title level={3} style={{ margin: 0 }}>
            ดาวน์โหลดรายงาน Excel
          </Title>
          <Text type="secondary">
            ตรวจสอบความถูกต้องของช่วงเวลาและชื่อไฟล์ก่อนดำเนินการ
          </Text>
        </Flex>

        <Flex
          vertical
          gap={4}
          style={{
            width: "100%",
            padding: 16,
            backgroundColor: token.colorFillAlter,
            borderRadius: 12,
            border: `1px solid ${token.colorBorder}`,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            ชื่อไฟล์ที่จะได้รับ:
          </Text>
          <Text strong style={{ fontSize: 13, color: token.colorText }}>
            รายงานการบันทึกทรัพย์สินบริษัท (Capitalization Report) ประจำวันที่{" "}
            {dateRange[0].format("DD/MM/YYYY")} ถึง วันที่{" "}
            {dateRange[1].format("DD/MM/YYYY")}
          </Text>
        </Flex>

        {isCounting ? (
          <Flex vertical align="center" gap={16}>
            <Progress
              type="circle"
              percent={(countdown / 3) * 100}
              format={() => (
                <Text strong style={{ fontSize: 24, color: token.colorError }}>
                  {countdown}
                </Text>
              )}
              size={80}
              strokeColor={token.colorError}
            />
            <Text strong type="danger" style={{ fontSize: 16 }}>
              กำลังเตรียมการดาวน์โหลด...
            </Text>
          </Flex>
        ) : (
          <Flex gap={12} style={{ width: "100%" }}>
            <Button
              block
              size="large"
              onClick={() => setExportModalVisible(false)}
              style={{ borderRadius: 8, height: 48 }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              block
              size="large"
              onClick={() => setIsCounting(true)}
              style={{
                borderRadius: 8,
                backgroundColor: token.colorSuccess,
                borderColor: token.colorSuccess,
                fontWeight: 600,
                height: 48,
              }}
            >
              ยืนยันและเริ่มดาวน์โหลด
            </Button>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};
