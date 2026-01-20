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
  Row,
  Col,
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
  StarOutlined,
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
  setRulesVisible?: (visible: boolean) => void;
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
  setRulesVisible,
}) => {
  const hasSelected = selectedRowKeys.length > 0;
  const { token } = useToken();

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 16,
        },
      }}
    >
      <Card
        className="shadow-lg hover:shadow-xl transition-all duration-500 mb-6 overflow-hidden relative"
        bodyStyle={{ padding: "24px 28px" }}
        style={{
          background: `linear-gradient(135deg, #667eea15 0%, #764ba215 100%)`,
          border: "2px solid #667eea30",
        }}
      >
        {/* Decorative background elements */}
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #667eea 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />

        <Row gutter={[16, 16]} align="middle">
          {/* ฝั่งซ้าย: การจัดการรายการที่เลือก */}
          <Col xs={24} lg={14}>
            <Space wrap size="middle">
              {hasSelected ? (
                <>
                  <Badge
                    count={selectedRowKeys.length}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                    }}
                    showZero={false}
                  >
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                      <StarOutlined
                        style={{ color: "#667eea", fontSize: "16px" }}
                      />
                      <Text
                        strong
                        style={{ fontSize: "15px", color: "#667eea" }}
                      >
                        เลือกไว้แล้ว
                      </Text>
                    </div>
                  </Badge>

                  <Tooltip
                    title={
                      <div className="text-center">
                        <div className="font-semibold mb-1">
                          📄 ดูเอกสาร PDF แบบกลุ่ม
                        </div>
                        <div className="text-xs">
                          รวมรายการที่เลือกทั้งหมดในเอกสารเดียว
                          สะดวกต่อการพิมพ์และเก็บเป็นหลักฐาน
                        </div>
                      </div>
                    }
                    overlayStyle={{ maxWidth: "300px" }}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<FilePdfOutlined />}
                      onClick={() => {
                        const ids = selectedRowKeys.join(",");
                        router.push(
                          `/timesheet/overtime/preview/bulk?ids=${ids}`,
                        );
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      ดูแบบกลุ่ม (PDF)
                    </Button>
                  </Tooltip>

                  <Tooltip
                    title={
                      <div className="text-center">
                        <div className="font-semibold mb-1">
                          ✅ จัดการสถานะพร้อมกัน
                        </div>
                        <div className="text-xs">
                          เปลี่ยนสถานะหลายรายการในคราวเดียว เช่น อนุมัติ,
                          ปฏิเสธ, หรือรอการพิจารณา
                        </div>
                      </div>
                    }
                    overlayStyle={{ maxWidth: "300px" }}
                  >
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => setBatchStatusModalVisible(true)}
                      loading={batchProcessing}
                      style={{
                        background:
                          "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(17, 153, 142, 0.3)",
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      จัดการสถานะ
                    </Button>
                  </Tooltip>

                  <Tooltip
                    title={
                      <div className="text-center">
                        <div className="font-semibold mb-1">
                          📧 ส่งอีเมลแจ้งเตือน
                        </div>
                        <div className="text-xs">
                          ส่งอีเมลแจ้งเตือนไปยัง HR
                          และผู้เกี่ยวข้องสำหรับรายการที่เลือกทั้งหมด
                        </div>
                      </div>
                    }
                    overlayStyle={{ maxWidth: "300px" }}
                  >
                    <Button
                      icon={<MailOutlined />}
                      onClick={batchSendEmail}
                      loading={batchProcessing}
                      style={{
                        borderColor: "#ff6b6b",
                        color: "#ff6b6b",
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      ส่งอีเมล
                    </Button>
                  </Tooltip>

                  <Tooltip title="ยกเลิกการเลือกทั้งหมดและเริ่มต้นใหม่">
                    <Button
                      type="text"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        setSelectedRowKeys([]);
                        setProcessedItems(new Set());
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      ยกเลิก
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: token.colorInfoBg,
                    border: `1px solid ${token.colorInfoBorder}`,
                  }}
                >
                  <div
                    className="p-2 rounded-lg shadow-sm"
                    style={{
                      background: token.colorBgContainer,
                    }}
                  >
                    <InfoCircleOutlined
                      style={{ color: token.colorPrimary, fontSize: "20px" }}
                    />
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        color: token.colorPrimary,
                        display: "block",
                        fontSize: "14px",
                      }}
                    >
                      💡 เคล็ดลับการใช้งาน
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      คลิกเลือกรายการในตารางด้านล่างเพื่อใช้งานฟีเจอร์จัดการแบบกลุ่ม
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </Col>

          {/* ฝั่งขวา: การจัดการทั่วไป */}
          <Col xs={24} lg={10}>
            <Space
              wrap
              style={{ justifyContent: "flex-end", width: "100%" }}
              size="middle"
            >
              <Tooltip
                title={
                  <div className="text-center">
                    <div className="font-semibold mb-1">
                      📋 ระเบียบการทำงาน OT
                    </div>
                    <div className="text-xs">
                      อ่านระเบียบและเงื่อนไขการขอทำงานล่วงเวลาให้ครบถ้วนก่อนยื่นคำขอ
                      เพื่อให้การดำเนินการถูกต้องตามขั้นตอน
                    </div>
                  </div>
                }
                overlayStyle={{ maxWidth: "300px" }}
              >
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => setRulesVisible?.(true)}
                  style={{
                    borderColor: "#ee5a6f",
                    color: "#ee5a6f",
                    background: "#fff",
                  }}
                  className="hover:scale-105 transition-transform"
                >
                  ระเบียบการ OT
                </Button>
              </Tooltip>

              <Tooltip
                title={
                  <div className="text-center">
                    <div className="font-semibold mb-1">📊 วิเคราะห์ข้อมูล</div>
                    <div className="text-xs">
                      ดูภาพรวมสถิติการทำงานล่วงเวลา กราฟ และรายงานต่างๆ
                      สำหรับผู้บริหารและ HR
                    </div>
                  </div>
                }
                overlayStyle={{ maxWidth: "300px" }}
              >
                <Button
                  icon={<RiseOutlined />}
                  onClick={() => setAnalyticsVisible(true)}
                  style={{
                    borderColor: "#667eea",
                    color: "#667eea",
                    background: "#fff",
                  }}
                  className="hover:scale-105 transition-transform"
                >
                  วิเคราะห์ข้อมูล
                </Button>
              </Tooltip>

              <Divider
                type="vertical"
                style={{ height: "36px", borderColor: "#667eea40" }}
              />

              <Tooltip
                title={
                  <div className="text-center">
                    <div className="font-semibold mb-1">✨ สร้างคำขอใหม่</div>
                    <div className="text-xs">
                      กรอกฟอร์มขอทำงานล่วงเวลาใหม่ พร้อมระบุวันที่ เวลา
                      และรายละเอียดงาน
                    </div>
                  </div>
                }
                overlayStyle={{ maxWidth: "300px" }}
              >
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => setVisible(true)}
                  size="large"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                  className="hover:scale-105 hover:shadow-2xl transition-all duration-300"
                >
                  สร้างคำขอ OT ใหม่
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>
    </ConfigProvider>
  );
};
