"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Space,
  theme,
  Row,
  Col,
  Divider,
  Badge, // เพิ่ม Badge เข้ามา
} from "antd";
import { LockOutlined, UserOutlined, GoogleOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import LogoHeader from "@/components/auth/logo-header";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

const { Title, Text, Paragraph } = Typography;

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    const tId = toast.loading("กำลังตรวจสอบข้อมูล...");

    try {
      const result = await loginAction(values);

      if (result?.error) {
        toast.error("เข้าสู่ระบบไม่สำเร็จ", {
          description: result.error,
          id: tId,
        });
      } else {
        toast.success("เข้าสู่ระบบสำเร็จ", {
          description: "กำลังนำคุณเข้าสู่ระบบ...",
          id: tId,
        });
        // ✅ ปล่อยให้ NextAuth จัดการการ Redirect เองผ่าน Server Action
        // เพื่อให้แน่ใจว่า Session และ Cookie ถูกเซ็ตเรียบร้อยก่อนย้ายหน้า
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: "โปรดติดต่อทีมพัฒนาหรือลองใหม่อีกครั้ง",
        id: tId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: token.colorBgBase,
        overflow: "hidden",
      }}
    >
      <Row style={{ minHeight: "100vh" }}>
        {/* ฝั่งซ้าย: แบรนด์ดิ้งและคำต้อนรับ */}
        <Col
          xs={0}
          sm={0}
          md={12}
          lg={12}
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #F59E0B 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 10%",
            color: "#FFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* วงกลมตกแต่ง */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              right: "-10%",
              width: "500px",
              height: "500px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              left: "-5%",
              width: "300px",
              height: "300px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />

          <Space
            direction="vertical"
            size={24}
            style={{ position: "relative", zIndex: 1 }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                background: "rgba(255,255,255,0.15)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "44px",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              }}
            >
              ✨
            </div>

            <div style={{ marginTop: 20 }}>
              <Title
                level={1}
                style={{
                  color: "#FFF",
                  margin: 0,
                  fontSize: "52px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                สวัสดี <br /> SchoolBright! 👋
              </Title>
              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "20px",
                  marginTop: 24,
                  maxWidth: 450,
                  fontWeight: 300,
                }}
              >
                ก้าวข้ามงานบริหารโรงเรียนที่ซ้ำซ้อน
                เพิ่มประสิทธิภาพการทำงานด้วยระบบอัตโนมัติ
                และประหยัดเวลาที่มีค่าของคุณ!
              </Paragraph>
            </div>
          </Space>

          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: "10%",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
            }}
          >
            © {new Date().getFullYear()} SchoolBright. สงวนลิขสิทธิ์ทั้งหมด
          </div>
        </Col>

        {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={12}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            backgroundColor: token.colorBgContainer,
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* พื้นที่โลโก้ */}
            <div
              style={{
                marginBottom: 60,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <LogoHeader />
            </div>

            <div style={{ marginBottom: 40 }}>
              <Title
                level={2}
                style={{
                  margin: "0 0 12px 0",
                  fontWeight: 700,
                  fontSize: "32px",
                }}
              >
                ยินดีต้อนรับกลับมา!
              </Title>
              <Text type="secondary" style={{ fontSize: "15px" }}>
                ยังไม่มีบัญชีผู้ใช้งาน?{" "}
                <Button
                  type="link"
                  style={{ padding: 0, fontWeight: 600, fontSize: "15px" }}
                >
                  สร้างบัญชีใหม่ตอนนี้
                </Button>
              </Text>
            </div>

            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุอีเมล หรือ รหัสพนักงาน",
                  },
                ]}
              >
                <Input
                  placeholder="อีเมล / รหัสพนักงาน"
                  prefix={
                    <UserOutlined
                      style={{
                        color: token.colorTextPlaceholder,
                        marginRight: 8,
                      }}
                    />
                  }
                  style={{
                    border: "none",
                    borderBottom: `1.5px solid ${token.colorBorder}`,
                    borderRadius: 0,
                    paddingLeft: 0,
                    paddingBottom: 12,
                    background: "transparent",
                    boxShadow: "none",
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "กรุณาระบุรหัสผ่าน" }]}
                style={{ marginTop: 24 }}
              >
                <Input.Password
                  placeholder="รหัสผ่าน"
                  prefix={
                    <LockOutlined
                      style={{
                        color: token.colorTextPlaceholder,
                        marginRight: 8,
                      }}
                    />
                  }
                  style={{
                    border: "none",
                    borderBottom: `1.5px solid ${token.colorBorder}`,
                    borderRadius: 0,
                    paddingLeft: 0,
                    paddingBottom: 12,
                    background: "transparent",
                    boxShadow: "none",
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 48 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: 56,
                    borderRadius: 14,
                    fontSize: "16px",
                    fontWeight: 700,
                    background: "#111", // สีดำตามดีไซน์
                    border: "none",
                  }}
                >
                  เข้าสู่ระบบ
                </Button>
              </Form.Item>

              <Divider plain>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  หรือ
                </Text>
              </Divider>

              {/* ปรับปรุงปุ่ม Google Login พร้อม Badge */}
              <Badge.Ribbon text="พบกันเร็วๆนี้" color="orange">
                <Button
                  block
                  disabled // ปิดการใช้งาน
                  icon={<GoogleOutlined />}
                  style={{
                    height: 56,
                    borderRadius: 14,
                    fontSize: "16px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: token.colorBorder,
                    backgroundColor: token.colorBgContainerDisabled, // สีพื้นหลังแบบ disabled
                    cursor: "not-allowed",
                  }}
                >
                  เข้าสู่ระบบด้วย Google
                </Button>
              </Badge.Ribbon>

              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  ลืมรหัสผ่านใช่หรือไม่?{" "}
                  <Button type="link" style={{ padding: 0, fontWeight: 600 }}>
                    คลิกที่นี่
                  </Button>
                </Text>
              </div>
            </Form>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-bottom-color: ${token.colorPrimary} !important;
        }
        .ant-input-affix-wrapper .ant-input {
          background: transparent !important;
        }
        .ant-btn-primary:hover {
          background: #333 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
