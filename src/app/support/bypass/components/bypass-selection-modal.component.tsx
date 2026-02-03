"use client";

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  FileProtectOutlined,
  FireOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  RestOutlined,
  SmileOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  Divider,
  Flex,
  Modal,
  Row,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import type { SchoolDetail } from "../types/bypass.types";
import { BYPASS_TARGETS } from "../utils/bypass-targets";

const { Text, Title } = Typography;

const TARGET_ICON_MAP: Record<string, React.ReactNode> = {
  system: <AppstoreOutlined />,
  academic: <ReadOutlined />,
  accounting: <WalletOutlined />,
  library: <BookOutlined />,
  canteen: <RestOutlined />,
  kindergarten: <SmileOutlined />,
  activity: <FireOutlined />,
  exam: <FileProtectOutlined />,
};

const TARGET_DESC_MAP: Record<string, string> = {
  system: "จัดการข้อมูลพื้นฐาน, โครงสร้างโรงเรียน และการตั้งค่าหลัก",
  academic: "จัดการเกรด, เช็คชื่อ, แผนการสอน และข้อมูลการเรียน",
  accounting: "จัดการค่าธรรมเนียมการเรียน, ใบเสร็จ และการเงิน",
  library: "จัดการยืม-คืนหนังสือ และทรัพยากรห้องสมุด",
  canteen: "จัดการร้านค้า, เมนูอาหาร และการใช้จ่ายในโรงอาหาร",
  kindergarten: "จัดการพัฒนาการเด็กเล็ก และกิจกรรมช่วงวัยอนุบาล",
  activity: "บันทึกคะแนนกิจกรรมพัฒนาผู้เรียน และชุมนุม",
  exam: "คลังข้อสอบ, จัดสอบออนไลน์ และวิเคราะห์ผลสอบ",
};

const ENV_DESC_MAP: Record<string, string> = {
  production: "เข้าสู่ระบบที่โรงเรียนใช้งานอยู่จริงในปัจจุบัน",
  staging: "เข้าสู่ระบบทดสอบสำหรับดูฟีเจอร์ใหม่ที่กำลังจะออนไลน์",
  development: "สำหรับทีมพัฒนาเท่านั้น (ข้อมูลอาจไม่เป็นปัจจุบัน)",
  ui: "สำหรับตรวจสอบหน้าตาระบบใหม่ (ทีมดีไซน์)",
  legacy: "ระบบเวอร์ชั่นเดิมที่ยังเปิดให้ใช้งานอยู่",
};

const ENV_NAME_MAP: Record<string, string> = {
  production: "PRODUCTION",
  staging: "STAGING (BETA)",
  development: "DEVELOPMENT",
  ui: "UI / DESIGN",
  legacy: "LEGACY SYSTEM",
};

type BypassSelectionModalProps = {
  open: boolean;
  onClose: () => void;
  school: SchoolDetail | null;
  onSelect: (targetKey: string, envKey: string) => void;
};

export default function BypassSelectionModal({
  open,
  onClose,
  school,
  onSelect,
}: BypassSelectionModalProps) {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  if (!school) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1300}
      centered
      styles={{
        content: {
          borderRadius: 32,
          padding: 0,
          overflow: "hidden",
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
          padding: 0,
        },
      }}
      title={null}
      closable={false}
    >
      <Row gutter={0} style={{ minHeight: 600 }}>
        {/* Left Side: School Info */}
        <Col
          xs={24}
          md={8}
          style={{
            padding: 40,
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex
            vertical
            gap={40}
            justify="space-between"
            style={{ height: "100%" }}
          >
            <Flex vertical gap={24}>
              <Flex
                justify="center"
                align="center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  fontSize: 32,
                  color: "#fff",
                  boxShadow: `0 8px 16px ${token.colorPrimary}40`,
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                }}
              >
                <BankOutlined />
              </Flex>

              <Flex vertical gap={8}>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  เข้าสู่ระบบโรงเรียน
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  ระบุระบบที่ต้องการ Bypass ไปยังโรงเรียน:
                </Text>
                <Text
                  strong
                  style={{
                    color: token.colorPrimary,
                    fontSize: 22,
                    marginTop: 8,
                  }}
                >
                  {school.company_name}
                </Text>
              </Flex>

              <Divider style={{ margin: "8px 0" }} />

              <Flex vertical gap={24}>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    School ID
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: 24, fontFamily: "monospace" }}
                  >
                    {school.school_id || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    จังหวัด
                  </Text>
                  <Text strong style={{ fontSize: 20 }}>
                    {school.province || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    กลุ่มโรงเรียน
                  </Text>
                  <Tag
                    color="blue"
                    bordered={false}
                    style={{
                      fontSize: 16,
                      width: "fit-content",
                      padding: "4px 12px",
                    }}
                  >
                    {school.school_group || "ทั่วไป"}
                  </Tag>
                </Flex>
              </Flex>
            </Flex>

            <Button
              block
              size="large"
              onClick={onClose}
              style={{
                borderRadius: 16,
                height: 54,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              ยกเลิกและปิดหน้าต่าง
            </Button>
          </Flex>
        </Col>

        {/* Right Side: Selection Grid */}
        <Col
          xs={24}
          md={16}
          style={{
            padding: 40,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Flex vertical gap={32}>
            {/* CS Guide Section */}
            <Alert
              message={
                <Text strong style={{ fontSize: 16 }}>
                  คำแนะนำสำหรับการใช้งาน (Staff Guide)
                </Text>
              }
              description={
                <Flex vertical gap={6} style={{ marginTop: 8 }}>
                  <Text>
                    1. เลือกระบบย่อยที่ต้องการตรวจสอบข้อมูล (เช่น วิชาการ,
                    บัญชี)
                  </Text>
                  <Text>
                    2. เลือกเซิร์ฟเวอร์{" "}
                    <Text strong style={{ color: token.colorSuccess }}>
                      PRODUCTION
                    </Text>{" "}
                    สำหรับข้อมูลที่โรงเรียนเวทงานปัจจุบัน
                  </Text>
                  <Text>
                    3. ระบบจะทำการยืนยันสิทธิ์และเข้าสู่โรงเรียนโดยอัตโนมัติ
                  </Text>
                </Flex>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ fontSize: 24 }} />}
              style={{ borderRadius: 20, padding: 20 }}
            />

            <Flex vertical gap={20}>
              {Object.entries(BYPASS_TARGETS).map(([targetKey, target]) => {
                const isExamDisabled = targetKey === "exam";

                return (
                  <Card
                    key={targetKey}
                    variant="borderless"
                    style={{
                      background: isExamDisabled
                        ? token.colorFillTertiary
                        : token.colorFillAlter,
                      borderRadius: 24,
                      opacity: isExamDisabled ? 0.6 : 1,
                    }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <Flex vertical gap={20}>
                      <Flex justify="space-between" align="start">
                        <Flex gap={16}>
                          <Flex
                            justify="center"
                            align="center"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              fontSize: 24,
                              background: token.colorBgContainer,
                              color: isExamDisabled
                                ? token.colorTextDisabled
                                : token.colorPrimary,
                            }}
                          >
                            {TARGET_ICON_MAP[targetKey] || <GlobalOutlined />}
                          </Flex>
                          <Flex vertical gap={4}>
                            <Flex align="center" gap={8}>
                              <Title
                                level={4}
                                style={{ margin: 0, fontWeight: 700 }}
                              >
                                {target.label}
                              </Title>
                              {isExamDisabled && (
                                <Tag color="warning" bordered={false}>
                                  ปิดปรับปรุง
                                </Tag>
                              )}
                            </Flex>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {isExamDisabled
                                ? "ระบบกำลังปรับปรุงระบบชุดใหม่ จะกลับมาให้บริการเร็วๆ นี้"
                                : TARGET_DESC_MAP[targetKey]}
                            </Text>
                          </Flex>
                        </Flex>
                        <Tooltip title={TARGET_DESC_MAP[targetKey]}>
                          <InfoCircleOutlined
                            style={{ color: token.colorTextQuaternary }}
                          />
                        </Tooltip>
                      </Flex>

                      <Row gutter={[12, 12]}>
                        {Object.entries(target.environments).map(
                          ([envKey, env]) => {
                            const isProd = envKey === "production";
                            return (
                              <Col xs={12} sm={8} key={envKey}>
                                <Tooltip title={ENV_DESC_MAP[envKey]}>
                                  <Button
                                    block
                                    size="large"
                                    type={isProd ? "primary" : "default"}
                                    icon={<ArrowRightOutlined />}
                                    iconPosition="end"
                                    onClick={() => onSelect(targetKey, envKey)}
                                    disabled={isExamDisabled}
                                    style={{
                                      height: 50,
                                      borderRadius: 14,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontWeight: 800,
                                      fontSize: 13,
                                      letterSpacing: "0.5px",
                                      fontFamily:
                                        "'Segoe UI', Roboto, sans-serif",
                                      boxShadow: isProd
                                        ? `0 4px 12px ${token.colorPrimary}40`
                                        : "none",
                                    }}
                                  >
                                    {ENV_NAME_MAP[envKey] || env.label}
                                  </Button>
                                </Tooltip>
                              </Col>
                            );
                          },
                        )}
                      </Row>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Flex>
        </Col>
      </Row>
    </Modal>
  );
}
