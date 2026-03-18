"use client";

import { forgotPasswordAction } from "@/actions/auth";
import LogoHeader from "@/components/auth/logo-header";
import {
  ArrowLeftOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Input,
  Result,
  Row,
  Space,
  theme,
  Typography,
} from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = theme.useToken();
  const router = useRouter();

  // Force Light Mode for this page (Match Sign-in)
  const lightToken = {
    ...token,
    colorBgContainer: "#ffffff",
    colorBgBase: "#f8fafc",
    colorText: "#1e293b",
    colorTextSecondary: "#64748b",
    colorBorder: "#e2e8f0",
  };

  const onFinish = async (values: { email: string }) => {
    /* ... existing onFinish ... */
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
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#F97316",
          borderRadius: 12,
        },
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: lightToken.colorBgBase,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <Row style={{ width: "100%", margin: 0 }}>
          {/* ฝั่งซ้าย: แบรนด์ดิ้ง (Match Sign-in) */}
          <Col
            xs={0}
            sm={0}
            md={10}
            lg={10}
            xl={11}
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 8%",
              color: "#FFF",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* วงกลมตกแต่ง */}
            <div
              style={{
                position: "absolute",
                top: "-10%",
                right: "-10%",
                width: "600px",
                height: "600px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            <Space direction="vertical" size={48} style={{ zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "8px 24px 8px 8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "100px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#FFF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <SafetyCertificateOutlined style={{ color: "#F97316" }} />
                </div>
                <Text style={{ color: "#FFF", fontWeight: 600, fontSize: 16 }}>
                  Security & Access Recovery
                </Text>
              </div>

              <div>
                <Title
                  level={1}
                  style={{
                    color: "#FFF",
                    margin: 0,
                    fontSize: "clamp(32px, 3.5vw, 56px)",
                    fontWeight: 850,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  กู้คืน <br />{" "}
                  <span style={{ color: "#FFD6AE" }}>ความปลอดภัย</span> <br />{" "}
                  บัญชีของคุณ
                </Title>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "20px",
                    marginTop: 32,
                    maxWidth: 480,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  ความปลอดภัยของคุณคือหัวใจสำคัญของเรา หากคุณลืมรหัสผ่าน
                  เราพร้อมช่วยให้คุณกลับเข้าสู่ระบบ
                  ได้อย่างรวดเร็วและปลอดภัยที่สุด
                </Paragraph>
              </div>

              {/* SVG Illustration */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "300px",
                  marginTop: 20,
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))",
                }}
              >
                <Image
                  src="/photo/undraw/undraw_forgot-password_nttj.svg"
                  alt="Forgot Password Illustration"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </Space>

            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: "8%",
                color: "rgba(255,255,255,0.6)",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)" }}>
                © {new Date().getFullYear()} SchoolBright
              </Text>
              <Divider
                type="vertical"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              />
              <Text style={{ color: "rgba(255,255,255,0.6)" }}>
                Security Policy
              </Text>
            </div>
          </Col>

          {/* ฝั่งขวา: ฟอร์มกู้คืนรหัสผ่าน */}
          <Col
            xs={24}
            sm={24}
            md={14}
            lg={14}
            xl={13}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 10%",
              backgroundColor: "#FFF",
            }}
          >
            <div style={{ width: "100%", maxWidth: 520 }}>
              <div
                style={{
                  marginBottom: 80,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <LogoHeader />
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/auth/v2/signin")}
                  style={{ color: "#64748b", fontWeight: 600 }}
                >
                  กลับหน้าเข้าสู่ระบบ
                </Button>
              </div>

              {isSuccess ? (
                <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                  <Result
                    status="success"
                    title={
                      <Title level={2} style={{ fontWeight: 800, margin: 0 }}>
                        ส่งรหัสผ่านเรียบร้อย!
                      </Title>
                    }
                    subTitle={
                      <Text style={{ fontSize: 18, color: "#64748b" }}>
                        ระบบได้ส่งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว <br />
                        กรุณาตรวจสอบใน Inbox หรือ Junk Mail
                      </Text>
                    }
                    extra={[
                      <Button
                        type="primary"
                        key="login"
                        block
                        size="large"
                        onClick={() => router.push("/auth/v2/signin")}
                        style={{
                          height: 64,
                          borderRadius: 18,
                          fontSize: "18px",
                          fontWeight: 700,
                          background: "#1e293b",
                          border: "none",
                          boxShadow: "0 10px 20px rgba(30, 41, 59, 0.15)",
                        }}
                      >
                        กลับไปยังหน้าเข้าสู่ระบบ
                      </Button>,
                    ]}
                  />
                </div>
              ) : (
                <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                  <div style={{ marginBottom: 56 }}>
                    <Title
                      level={1}
                      style={{
                        margin: "0 0 16px 0",
                        fontWeight: 800,
                        fontSize: "42px",
                        color: "#0f172a",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ลืมรหัสผ่าน?
                    </Title>
                    <Text style={{ fontSize: "18px", color: "#64748b" }}>
                      ระบุอีเมลที่ลงทะเบียนไว้เพื่อรับรหัสผ่านใหม่
                    </Text>
                  </div>

                  {error && (
                    <Alert
                      message={error}
                      type="error"
                      showIcon
                      style={{
                        marginBottom: 32,
                        borderRadius: 16,
                        padding: "12px 16px",
                      }}
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
                      label={
                        <Text strong style={{ fontSize: 15, color: "#475569" }}>
                          อีเมลที่ลงทะเบียน
                        </Text>
                      }
                      name="email"
                      rules={[
                        { required: true, message: "กรุณาระบุอีเมล" },
                        { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                      ]}
                    >
                      <Input
                        placeholder="example@schoolbright.co"
                        prefix={
                          <MailOutlined
                            style={{ color: "#94a3b8", marginRight: 12 }}
                          />
                        }
                        style={{
                          height: 60,
                          borderRadius: 16,
                          fontSize: "17px",
                          background: "#f8fafc",
                          border: "1.5px solid #e2e8f0",
                        }}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height: 64,
                        borderRadius: 18,
                        fontSize: "18px",
                        fontWeight: 700,
                        background: "#1e293b",
                        border: "none",
                        marginTop: 40,
                        boxShadow: "0 10px 20px rgba(30, 41, 59, 0.15)",
                      }}
                    >
                      ส่งรหัสผ่านไปที่อีเมล
                    </Button>
                  </Form>

                  <div style={{ textAlign: "center", marginTop: 48 }}>
                    <Text style={{ fontSize: "16px", color: "#64748b" }}>
                      ต้องการความช่วยเหลือเพิ่มเติม? <br />
                      <Button
                        type="link"
                        style={{
                          padding: 0,
                          fontWeight: 700,
                          color: "#F97316",
                        }}
                      >
                        ติดต่อเจ้าหน้าที่ดูแลระบบ
                      </Button>
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .ant-input:hover,
          .ant-input:focus {
            border-color: #f97316 !important;
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1) !important;
            background: #fff !important;
          }
          .ant-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(30, 41, 59, 0.25) !important;
            background: #0f172a !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
