"use client";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  ScanOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Flex,
  Space,
  Tag,
  Typography,
} from "antd";
import { useFaceScanStore } from "../_state/face-scan-store";

const { Title, Text } = Typography;

/**
 * Component ส่วนการแสกนใบหน้า (Simulation Section)
 */
export const FaceScanSection = () => {
  const { requestFaceScan, isLoading, scanResult } = useFaceScanStore();

  const handleScanOperation = async () => {
    /** การจำลองการแสกนใบหน้า (ส่ง schoolId, userCode, sID ตาม cURL) */
    await requestFaceScan({
      school_id: "39",
      user_code: "1233762",
      s_id: "1233762",
    });
  };

  /** ดึงข้อมูลชิ้นแรกจาก data array */
  const userData = scanResult?.data?.[0];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical align="center" gap={24} style={{ padding: "40px 0" }}>
        <ScanOutlined style={{ fontSize: "60px", color: "#1890ff" }} />
        <Flex vertical align="center">
          <Title level={4}>ระบบบันทึกเวลาด้วยใบหน้า</Title>
          <Text type="secondary">
            กรุณาคลิกปุ่มด้านล่างเพื่อแสกนใบหน้าจำลอง
          </Text>
        </Flex>

        <Button
          type="primary"
          icon={<ScanOutlined />}
          size="large"
          loading={isLoading}
          onClick={handleScanOperation}
          style={{ width: "220px", height: "50px", borderRadius: "8px" }}
        >
          เริ่มแสกนใบหน้า
        </Button>

        {userData && (
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>ข้อมูลการบันทึกเวลา</span>
              </Space>
            }
            size="small"
            style={{ width: "100%", maxWidth: "500px", marginTop: "24px" }}
          >
            <Flex vertical gap={16}>
              <Flex align="center" gap={16}>
                <Avatar
                  size={80}
                  src={userData.pictuer}
                  icon={<UserOutlined />}
                  style={{ border: "2px solid #f0f0f0" }}
                />
                <Flex vertical>
                  <Title level={5} style={{ margin: 0 }}>
                    {userData.sName}
                  </Title>
                  <Text type="secondary">
                    <IdcardOutlined /> รหัส: {userData.UserCode}
                  </Text>
                  <Tag
                    color="success"
                    style={{ width: "fit-content", marginTop: 4 }}
                  >
                    บันทึกสำเร็จ
                  </Tag>
                </Flex>
              </Flex>

              <Divider style={{ margin: "8px 0" }} />

              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item
                  label={
                    <Space>
                      <CalendarOutlined /> วันที่
                    </Space>
                  }
                >
                  {userData.LogDate
                    ? new Date(userData.LogDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <ClockCircleOutlined /> เวลา
                    </Space>
                  }
                >
                  <Text strong>{userData.LogTime || "-"} น.</Text>
                </Descriptions.Item>
                <Descriptions.Item label="ประเภทการบันทึก">
                  {userData.LogType === "1" ? (
                    <Tag color="blue">ลงชื่อเข้าเมือง</Tag>
                  ) : (
                    <Tag color="cyan">ลงชื่อออกเมือง</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="สถานะการแสกน">
                  {userData.LogScanStatus === "2" ? (
                    <Badge status="success" text="สำเร็จ" />
                  ) : (
                    <Badge status="processing" text="รอดำเนินการ" />
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
};
