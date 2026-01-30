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
  Result,
  Alert,
} from "antd";
import {
  MailOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { forgotPasswordAction } from "@/actions/auth";
import LogoHeader from "@/components/auth/logo-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = theme.useToken();
  const router = useRouter();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await forgotPasswordAction(values.email);
      if (result.success) {
        setIsSuccess(true);
        toast.success("ส่งรหัสผ่านใหม่ไปที่อีเมลเรียบร้อยแล้ว");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
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
        {/* ฝั่งซ้าย: แบรนด์ดิ้ง (Match Sign-in) */}
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
              }}
            >
              <ThunderboltOutlined style={{ color: "#FFF" }} />
            </div>
            <Title
              level={1}
              style={{ color: "#FFF", margin: 0, fontSize: "48px" }}
            >
              กู้คืนบัญชีของคุณ
            </Title>
            <Paragraph style={{ color: "rgba(255,255,255,0.85)", fontSize: "18px" }}>
              ความปลอดภัยของคุณคือหัวใจสำคัญของเรา <br />
              หากจำรหัสผ่านไม่ได้ เราพร้อมช่วยให้คุณกลับมาใช้งานได้อีกครั้ง
            </Paragraph>
          </Space>
        </Col>

        {/* ฝั่งขวา: ฟอร์มกู้คืนรหัสผ่าน */}
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
            <div style={{ marginBottom: 40, display: "flex", justifyContent: "flex-end" }}>
              <LogoHeader />
            </div>

            {isSuccess ? (
              <Result
                status="success"
                title="ส่งรหัสผ่านเรียบร้อย!"
                subTitle="ระบบได้ส่งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบใน Inbox หรือ Junk Mail"
                icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                extra={[
                  <Button
                    type="primary"
                    key="login"
                    block
                    size="large"
                    onClick={() => router.push("/auth/v2/signin")}
                    style={{ background: "#111", border: "none", borderRadius: 12, height: 50 }}
                  >
                    กลับไปยังหน้าเข้าสู่ระบบ
                  </Button>,
                ]}
              />
            ) : (
              <>
                <div style={{ marginBottom: 40 }}>
                  <Button
                    type="link"
                    onClick={() => router.back()}
                    icon={<ArrowLeftOutlined />}
                    style={{ padding: 0, marginBottom: 16, color: token.colorTextSecondary }}
                  >
                    กลับ
                  </Button>
                  <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                    ลืมรหัสผ่าน?
                  </Title>
                  <Text type="secondary" style={{ fontSize: "15px" }}>
                    ระบุอีเมลที่ลงทะเบียนไว้เพื่อรับรหัสผ่านใหม่
                  </Text>
                </div>

                {error && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                )}

                <Form
                  name="forgot_password"
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "กรุณาระบุอีเมล" },
                      { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                    ]}
                  >
                    <Input
                      placeholder="อีเมลของคุณ (เช่น example@schoolbright.co)"
                      prefix={<MailOutlined style={{ color: token.colorTextPlaceholder, marginRight: 8 }} />}
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
                      background: "#111",
                      border: "none",
                      marginTop: 32,
                    }}
                  >
                    ส่งรหัสผ่านไปที่อีเมล
                  </Button>
                </Form>
              </>
            )}

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                ต้องการความช่วยเหลือเพิ่มเติม? <br />
                ติดต่อแผนกไอที หรือ ผู้ดูแลระบบของท่าน
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .ant-input:focus { border-bottom-color: ${token.colorPrimary} !important; }
      `}</style>
    </div>
  );
}
