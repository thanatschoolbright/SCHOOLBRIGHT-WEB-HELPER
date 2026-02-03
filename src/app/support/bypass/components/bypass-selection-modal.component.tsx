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
  Space,
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
      width={1100}
      centered
      styles={{
        content: {
          borderRadius: 24,
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
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side: School Info */}
        <div
          className="w-full md:w-1/3 p-8 flex flex-col justify-between"
          style={{
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              }}
            >
              <BankOutlined />
            </div>
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 800, fontSize: 26 }}
            >
              เลือกเข้าสู่ระบบ
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 14,
                display: "block",
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              ระบุระบบที่ต้องการ Bypass ไปยังโรงเรียน:
            </Text>
            <Text
              strong
              style={{
                color: token.colorPrimary,
                fontSize: 18,
                marginTop: 4,
                display: "block",
              }}
            >
              {school.company_name}
            </Text>

            <Divider />

            <Space direction="vertical" size={20} className="w-full">
              <div className="flex flex-col">
                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  School ID
                </Text>
                <Text strong style={{ fontSize: 20 }}>
                  {school.school_id || "-"}
                </Text>
              </div>
              <div className="flex flex-col">
                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  จังหวัด
                </Text>
                <Text strong style={{ fontSize: 20 }}>
                  {school.province || "-"}
                </Text>
              </div>
              <div className="flex flex-col">
                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  กลุ่มโรงเรียน
                </Text>
                <Text strong style={{ fontSize: 20 }}>
                  {school.school_group || "ทั่วไป"}
                </Text>
              </div>
            </Space>
          </div>

          <Button
            block
            size="large"
            onClick={onClose}
            style={{
              marginTop: 32,
              borderRadius: 12,
              height: 48,
              fontWeight: 600,
            }}
          >
            ปิดหน้าต่างนี้
          </Button>
        </div>

        {/* Right Side: Selection Grid */}
        <div className="w-full md:w-2/3 p-8 max-h-[85vh] overflow-y-auto">
          {/* CS Guide Section */}
          <Alert
            message={
              <Text strong style={{ fontSize: 16 }}>
                คู่มือแนะนำสำหรับ CS/Staff
              </Text>
            }
            description={
              <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                  1. เลือกระบบที่คุณต้องการตรวจสอบข้อมูล (เช่น วิชาการ หรือ
                  บัญชี)
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                  2. เลือก{" "}
                  <Tag
                    color="success"
                    style={{ margin: 0, fontSize: 12, fontWeight: 700 }}
                  >
                    ใช้งานจริง (Production)
                  </Tag>{" "}
                  เพื่อดูข้อมูลจริงที่โรงเรียนกำลังส่งเข้ามา
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                  3. ระบบจะทำการ Bypass และ Login ให้คุณอัตโนมัติใน Tab ใหม่
                </Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined style={{ fontSize: 20 }} />}
            style={{ borderRadius: 20, marginBottom: 24, padding: 16 }}
          />
          <Row gutter={[16, 16]}>
            {Object.entries(BYPASS_TARGETS).map(([targetKey, target]) => {
              const isExamDisabled = targetKey === "exam";

              return (
                <Col xs={24} key={targetKey}>
                  <div
                    className="p-6 rounded-2xl border border-solid transition-all"
                    style={{
                      background: isExamDisabled
                        ? isDark
                          ? "rgba(0,0,0,0.2)"
                          : "rgba(0,0,0,0.02)"
                        : token.colorBgContainer,
                      borderColor: isExamDisabled
                        ? token.colorBorder
                        : token.colorBorderSecondary,
                      opacity: isExamDisabled ? 0.6 : 1,
                      position: "relative",
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      className="mb-4"
                    >
                      <Space size={12}>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{
                            background: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.05)",
                            color: isExamDisabled
                              ? token.colorTextDisabled
                              : token.colorPrimary,
                          }}
                        >
                          {TARGET_ICON_MAP[targetKey] || <GlobalOutlined />}
                        </div>
                        <div>
                          <Space align="center" size={8}>
                            <Title
                              level={4}
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                color: isExamDisabled
                                  ? token.colorTextDisabled
                                  : undefined,
                              }}
                            >
                              {target.label}
                            </Title>
                            {isExamDisabled && (
                              <Tag
                                color="warning"
                                style={{
                                  margin: 0,
                                  fontWeight: 600,
                                  fontSize: 11,
                                  padding: "2px 8px",
                                }}
                              >
                                ปิดปรับปรุง
                              </Tag>
                            )}
                          </Space>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 13, // ปรับให้ใหญ่ขึ้นตามคอนเซปต์ใหม่
                              lineHeight: 1.6, // เพิ่มระยะห่างระหว่างบรรทัดไม่ให้อึดอัด
                              display: "block",
                              marginTop: 4,
                              color: isExamDisabled
                                ? token.colorTextDisabled
                                : undefined,
                            }}
                          >
                            {isExamDisabled
                              ? "ระบบกำลังปรับปรุงใหม่ จะกลับมาให้บริการเร็วๆ นี้"
                              : TARGET_DESC_MAP[targetKey] ||
                                "เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนงานนี้"}
                          </Text>
                        </div>
                      </Space>
                      <Tooltip
                        title={
                          isExamDisabled
                            ? "ระบบปิดปรับปรุงชั่วคราว"
                            : TARGET_DESC_MAP[targetKey]
                        }
                      >
                        <InfoCircleOutlined
                          style={{
                            color: isExamDisabled
                              ? token.colorTextDisabled
                              : token.colorTextQuaternary,
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    </Flex>

                    <Row gutter={[12, 12]}>
                      {Object.entries(target.environments).map(
                        ([envKey, env]) => (
                          <Col xs={12} sm={8} key={envKey}>
                            <Tooltip
                              title={
                                isExamDisabled
                                  ? "ระบบปิดปรับปรุงชั่วคราว ไม่สามารถใช้งานได้"
                                  : ENV_DESC_MAP[envKey] ||
                                    "คลิกเพื่อไปที่หน้านี้"
                              }
                            >
                              <Button
                                block
                                size="large"
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                onClick={() => onSelect(targetKey, envKey)}
                                disabled={isExamDisabled}
                                style={{
                                  height: 44,
                                  borderRadius: 10,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  textAlign: "left",
                                  background:
                                    envKey === "production"
                                      ? isDark
                                        ? "rgba(82, 196, 26, 0.1)"
                                        : "#f6ffed"
                                      : undefined,
                                  border:
                                    envKey === "production"
                                      ? `1px solid ${
                                          isDark
                                            ? "rgba(82, 196, 26, 0.3)"
                                            : "#b7eb8f"
                                        }`
                                      : undefined,
                                  color:
                                    envKey === "production" && !isExamDisabled
                                      ? isDark
                                        ? "#52c41a"
                                        : "#389e0d"
                                      : undefined,
                                  fontWeight: 700,
                                  cursor: isExamDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                {env.label}
                              </Button>
                            </Tooltip>
                          </Col>
                        ),
                      )}
                    </Row>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>
    </Modal>
  );
}
