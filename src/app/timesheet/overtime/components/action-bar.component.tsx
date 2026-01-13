"use client";

import React from "react";
import {
  Card,
  Space,
  Button,
  Tooltip,
  Badge,
  Typography,
  Divider,
  ConfigProvider,
  theme,
} from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  CheckOutlined,
  MailOutlined,
  FileTextOutlined,
  RiseOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { useToken } = theme;

interface ActionBarProps {
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedItems: (items: Set<React.Key>) => void;
  batchProcessing: boolean;
  setVisible: (visible: boolean) => void;
  setBatchStatusModalVisible: (visible: boolean) => void;
  batchSendEmail: () => void;
  router: any;
  setAnalyticsVisible: (visible: boolean) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedItems,
  batchProcessing,
  setVisible,
  setBatchStatusModalVisible,
  batchSendEmail,
  router,
  setAnalyticsVisible,
}) => {
  const hasSelected = selectedRowKeys.length > 0;
  const { token } = useToken();

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
        },
      }}
    >
      <Card
        className="shadow-md mb-6"
        bodyStyle={{ padding: "16px 24px" }}
        style={{ borderLeft: "4px solid #1890ff" }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* ฝั่งซ้าย: การจัดการรายการที่เลือก (Bulk Actions) */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <Space wrap size="middle">
              {hasSelected ? (
                <>
                  <Badge
                    count={selectedRowKeys.length}
                    color="#1890ff"
                    showZero={false}
                  >
                    <Text strong style={{ fontSize: "16px", marginRight: 8 }}>
                      รายการที่เลือก
                    </Text>
                  </Badge>

                  <Tooltip title="ดาวน์โหลดหรือดูเอกสาร PDF สำหรับรายการที่เลือกทั้งหมด">
                    <Button
                      type="primary"
                      ghost
                      icon={<FilePdfOutlined />}
                      onClick={() => {
                        const ids = selectedRowKeys.join(",");
                        router.push(
                          `/timesheet/overtime/preview/bulk?ids=${ids}`
                        );
                      }}
                    >
                      ดูแบบกลุ่ม (PDF)
                    </Button>
                  </Tooltip>

                  <Tooltip title="เปลี่ยนสถานะคำขอ (เช่น อนุมัติ/ปฏิเสธ) พร้อมกันหลายรายการ">
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => setBatchStatusModalVisible(true)}
                      loading={batchProcessing}
                    >
                      จัดการสถานะ
                    </Button>
                  </Tooltip>

                  <Tooltip title="ส่งอีเมลแจ้งเตือนไปยังผู้ที่เกี่ยวข้องสำหรับรายการที่เลือก">
                    <Button
                      icon={<MailOutlined />}
                      onClick={batchSendEmail}
                      loading={batchProcessing}
                    >
                      ส่งอีเมลแจ้งเตือน
                    </Button>
                  </Tooltip>

                  <Tooltip title="ยกเลิกการเลือกทั้งหมด">
                    <Button
                      type="text"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        setSelectedRowKeys([]);
                        setProcessedItems(new Set());
                      }}
                    >
                      ยกเลิก
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <Space>
                  <InfoCircleOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                  <Text type="secondary">
                    เลือกรายการในตารางด้านล่างเพื่อเปิดใช้งานการจัดการแบบกลุ่ม
                  </Text>
                </Space>
              )}
            </Space>
          </div>

          {/* ฝั่งขวา: การจัดการทั่วไป (Global Actions) */}
          <Space wrap>
            <Tooltip title="อ่านระเบียบการและเงื่อนไขการเบิก OT เพื่อความถูกต้อง">
              <Button
                icon={<FileTextOutlined />}
                onClick={() =>
                  window.open(
                    "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?usp=sharing",
                    "_blank"
                  )
                }
                danger
                ghost
              >
                ระเบียบการ OT
              </Button>
            </Tooltip>

            <Tooltip title="เปิดดูสถิติและภาพรวมการทำ OT สำหรับผู้บริหาร">
              <Button
                icon={<RiseOutlined />}
                onClick={() => setAnalyticsVisible(true)}
                style={{
                  borderColor: "#1890ff",
                  color: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ภาพรวมวิเคราะห์ข้อมูล
              </Button>
            </Tooltip>

            <Divider type="vertical" style={{ height: "32px" }} />

            <Tooltip title="สร้างคำขอทำงานล่วงเวลาใบใหม่">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setVisible(true)}
                size="large"
                style={{
                  boxShadow: "0 4px 10px rgba(24, 144, 255, 0.3)",
                  fontWeight: "bold",
                }}
              >
                เพิ่มคำขอ OT
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>
    </ConfigProvider>
  );
};
