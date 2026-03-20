"use client";

import { loginAction } from "@/actions/auth";
import LogoHeader from "@/components/auth/logo-header";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import {
  CloseCircleOutlined,
  GoogleOutlined,
  LoadingOutlined,
  LockOutlined,
  RocketOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Steps,
  Tag,
  theme,
  Typography,
} from "antd";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Title, Text, Paragraph } = Typography;

export default function SignInPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();
  const router = useRouter();

  // Force Light Mode for this page
  const lightToken = {
    ...token,
    colorBgContainer: "#ffffff",
    colorBgBase: "#f8fafc",
    colorText: "#1e293b",
    colorTextSecondary: "#64748b",
    colorBorder: "#e2e8f0",
  };

  // Login Tracking States
  /* ... existing states ... */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loginStatus, setLoginStatus] = useState<
    "process" | "finish" | "error"
  >("process");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/main");
    }
  }, [sessionStatus, router]);

  // Check session when window regains focus (e.g. user logged in on another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== "undefined") {
        router.refresh();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  const getErrorContent = () => {
    switch (errorCode) {
      case "MAX_ATTEMPTS_EXCEEDED":
        return {
          title: "บัญชีของคุณถูกล็อกชั่วคราว",
          icon: (
            <LockOutlined
              style={{ fontSize: 32, color: lightToken.colorWarning }}
            />
          ),
          bg: lightToken.colorWarningBg,
          steps: [
            "โปรดรอประมาณ 15 นาที ระบบจะปลดล็อกอัตโนมัติ",
            "หากจำเป็นต้องใช้งานด่วน โปรดติดต่อฝ่ายบุคคล (HR) หรือ Admin",
            "ตรวจสอบให้แน่ใจว่าไม่ได้เปิด Caps Lock ค้างไว้",
          ],
        };
      case "ACCOUNT_LOCKED_OR_INACTIVE":
        return {
          title: "บัญชีไม่สามารถใช้งานได้",
          icon: (
            <CloseCircleOutlined
              style={{ fontSize: 32, color: lightToken.colorError }}
            />
          ),
          bg: lightToken.colorErrorBg,
          steps: [
            "บัญชีของคุณอาจถูกระงับหรือยังไม่อนุญาตให้เข้าใช้งาน",
            "โปรดติดต่อ Admin เพื่อตรวจสอบสถานะบัญชี",
          ],
        };
      case "INVALID_CREDENTIALS":
        return {
          title: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง",
          icon: (
            <UserOutlined
              style={{ fontSize: 32, color: lightToken.colorError }}
            />
          ),
          bg: lightToken.colorErrorBg,
          steps: [
            "ตรวจสอบอีเมล หรือ รหัสพนักงานของคุณอีกครั้ง",
            "ตรวจสอบรหัสผ่าน (ระวังตัวพิมพ์เล็ก-ใหญ่)",
            "หากลืมรหัสผ่าน สามารถคลิก 'ลืมรหัสผ่าน' เพื่อรีเซ็ตได้",
          ],
        };
      default:
        return {
          title: "การยืนยันตัวตนล้มเหลว",
          icon: (
            <CloseCircleOutlined
              style={{ fontSize: 32, color: lightToken.colorError }}
            />
          ),
          bg: lightToken.colorErrorBg,
          steps: [
            "โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
            "หากปัญหายังคงอยู่ โปรดติดต่อทีมพัฒนาระบบ",
          ],
        };
    }
  };

  const errorContent = getErrorContent();

  const onFinish = async (values: any) => {
    setLoading(true);
    setIsModalVisible(true);
    setCurrentStep(0);
    setLoginStatus("process");
    setErrorMessage(null);
    setErrorCode(null);
    setDebugData(null);

    // Step 0: Connecting
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating network latency
      setCurrentStep(1);

      // Step 1: Verifying
      const result = await loginAction(values);

      if (result?.error) {
        setLoginStatus("error");
        setErrorMessage(result.error);
        setErrorCode(result?.code || "AUTH_FAILED");
        setDebugData({
          timestamp: new Date().toISOString(),
          username: values.username,
          errorCode: result?.code || "AUTH_FAILED",
          serverMessage: result.error,
        });
      } else {
        setCurrentStep(2);
        // Step 2: Session processing
        await new Promise((resolve) => setTimeout(resolve, 600));
        setCurrentStep(3);
        setLoginStatus("finish");

        setTimeout(() => {
          window.location.href = "/main";
        }, 1000);
      }
    } catch (error: any) {
      const isActionError =
        error.message?.includes("Server Action") ||
        error.message?.includes("not found") ||
        error.digest?.includes("ACTION_NOT_FOUND");

      if (isActionError) {
        setLoginStatus("error");
        setErrorMessage(
          "ตรวจพบการอัปเดตระบบ (Version Mismatch) กำลังรีเฟรชหน้าจออัตโนมัติ...",
        );
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        setLoginStatus("error");
        setErrorMessage(
          error.message?.includes("fetch") || error.message?.includes("network")
            ? "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ โปรดตรวจสอบการเชื่อมต่อ"
            : "เกิดข้อผิดพลาดที่ไม่คาดคิดในการเข้าสู่ระบบ",
        );
      }

      setDebugData({
        timestamp: new Date().toISOString(),
        error: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const shouldShowGate =
    sessionStatus === "loading" || sessionStatus === "authenticated";

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm, // Force Light Algorithm
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
          position: "relative",
          display: "flex",
        }}
      >
        {/* Gat Overlay: ป้องกันการเห็นหน้า Login หากเข้าสู่ระบบแล้วหรือกำลังโหลด */}
        {shouldShowGate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              backgroundColor: lightToken.colorBgBase,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <LoadingOutlined
              style={{ fontSize: 48, color: lightToken.colorPrimary }}
            />
            <Text type="secondary">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</Text>
          </div>
        )}

        <Row style={{ width: "100%", margin: 0 }}>
          {/* ฝั่งซ้าย: แบรนด์ดิ้งและคำต้อนรับ */}
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
                  <RocketOutlined style={{ color: "#F97316" }} />
                </div>
                <Text style={{ color: "#FFF", fontWeight: 600, fontSize: 16 }}>
                  Next Generation Education
                </Text>
              </div>

              <div>
                <Title
                  level={1}
                  style={{
                    color: "#FFF",
                    margin: 0,
                    fontSize: "clamp(40px, 4vw, 64px)",
                    fontWeight: 850,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  ยกระดับ <br />{" "}
                  <span style={{ color: "#FFD6AE" }}>การบริหาร</span> <br />{" "}
                  สู่โลกอนาคต
                </Title>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "22px",
                    marginTop: 32,
                    maxWidth: 480,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  ก้าวข้ามงานบริหารที่ซ้ำซ้อน
                  ด้วยระบบอัตโนมัติที่แม่นยำและรวดเร็วที่สุด
                  เพื่อเวลาที่มีค่าของบุคลากรทางการศึกษาทุกคน
                </Paragraph>
              </div>

              {/* SVG Illustration */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "320px",
                  marginTop: 20,
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))",
                }}
              >
                <Image
                  src="/photo/undraw/undraw_login_weas.svg"
                  alt="Login Illustration"
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
                Privacy Policy
              </Text>
            </div>
          </Col>

          {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
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
              {/* หัวข้อด้านบน */}
              <div
                style={{
                  marginBottom: 80,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <LogoHeader />
                <Tag
                  color="orange"
                  style={{ borderRadius: 6, padding: "2px 10px" }}
                >
                  v2.0.0
                </Tag>
              </div>

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
                  ลงชื่อเข้าใช้งาน
                </Title>
                <Text style={{ fontSize: "18px", color: "#64748b" }}>
                  หากมีข้อสงสัย โปรดติดต่อฝ่ายสนับสนุนระบบ
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
                  label={
                    <Text strong style={{ fontSize: 15, color: "#475569" }}>
                      อีเมล หรือ รหัสพนักงาน
                    </Text>
                  }
                  name="username"
                  rules={[
                    {
                      required: true,
                      message: "กรุณาระบุอีเมล หรือ รหัสพนักงาน",
                    },
                    {
                      transform: (value) => value.trim(),
                    },
                  ]}
                >
                  <Input
                    placeholder="example@schoolbright.co"
                    onChange={(e) => {
                      const { value } = e.target;
                      e.target.value = value.trim();
                    }}
                    prefix={
                      <UserOutlined
                        style={{
                          color: "#94a3b8",
                          marginRight: 12,
                        }}
                      />
                    }
                    style={{
                      height: 60,
                      borderRadius: 16,
                      fontSize: "17px",
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      color: "#1e293b", // Force Black Text
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <Text strong style={{ fontSize: 15, color: "#475569" }}>
                      รหัสผ่าน
                    </Text>
                  }
                  name="password"
                  rules={[{ required: true, message: "กรุณาระบุรหัสผ่าน" }]}
                  style={{ marginTop: 24, marginBottom: 8 }}
                >
                  <Input.Password
                    placeholder="••••••••"
                    prefix={
                      <LockOutlined
                        style={{
                          color: "#94a3b8",
                          marginRight: 12,
                        }}
                      />
                    }
                    style={{
                      height: 60,
                      borderRadius: 16,
                      fontSize: "17px",
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      color: "#1e293b", // Force Black Text
                    }}
                  />
                </Form.Item>

                <div style={{ textAlign: "right", marginBottom: 24 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => router.push("/auth/v2/forgot-password")}
                    style={{
                      padding: 0,
                      fontSize: 14,
                      color: "#F97316",
                      fontWeight: 600,
                    }}
                  >
                    ลืมรหัสผ่าน?
                  </Button>
                </div>

                <Form.Item style={{ marginTop: 24 }}>
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
                      boxShadow: "0 10px 20px rgba(30, 41, 59, 0.15)",
                    }}
                  >
                    เข้าสู่ระบบด้วยชื่อผู้ใช้งาน
                  </Button>
                </Form.Item>

                <Divider plain style={{ margin: "40px 0" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    หรือใช้บริการจากภายนอก
                  </Text>
                </Divider>

                <Badge.Ribbon text="เร็วๆนี้" color="#F97316">
                  <Button
                    block
                    disabled
                    icon={<GoogleOutlined />}
                    style={{
                      height: 60,
                      borderRadius: 18,
                      fontSize: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderColor: "#e2e8f0",
                      background: "#fff",
                      color: "#64748b",
                    }}
                  >
                    Continue with Google Workspace
                  </Button>
                </Badge.Ribbon>

                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: "16px", color: "#64748b" }}>
                    ยังไม่มีบัญชีผู้ใช้งาน?{" "}
                    <Button
                      type="link"
                      style={{
                        padding: 0,
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "#F97316",
                      }}
                    >
                      ลงทะเบียนที่นี่
                    </Button>
                  </Text>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        {/* Login Processing Modal */}
        <Modal
          open={isModalVisible && loginStatus === "process"}
          footer={null}
          closable={false}
          centered
          width={640}
          styles={{
            mask: {
              backdropFilter: "blur(12px)",
              background: "rgba(15, 23, 42, 0.4)",
            },
            content: {
              borderRadius: 32,

              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            },
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: "#f1f5f9",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <LoadingOutlined style={{ fontSize: 32, color: "#F97316" }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              กำลังตรวจสอบข้อมูล
            </Title>
            <Text style={{ color: "#64748b", fontSize: 16 }}>
              โปรดรอสักครู่ ระบบกำลังนำคุณเข้าสู่ portal
            </Text>
          </div>

          <Steps
            current={currentStep}
            status="process"
            labelPlacement="vertical"
            items={[
              {
                title: "Connection",
                description: "เชื่อมต่อเซิร์ฟเวอร์",
              },
              {
                title: "Audit",
                description: "ตรวจสอบสิทธิ์",
              },
              {
                title: "Policy",
                description: "ดึงข้อมูลสิทธิ์",
              },
              {
                title: "Setup",
                description: "เตรียมหน้าจอ",
              },
            ]}
          />
        </Modal>

        {/* Login Success Modal */}
        <StatusModalComponent
          open={isModalVisible && loginStatus === "finish"}
          type="success"
          title="ยินดีต้อนรับ"
          message="บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว"
          onClose={() => setIsModalVisible(false)}
        />

        {/* Login Error Modal */}
        <StatusModalComponent
          open={isModalVisible && loginStatus === "error"}
          type="error"
          title={errorContent.title}
          message={errorMessage ?? "เข้าสู่ระบบไม่สำเร็จ"}
          errorDetails={debugData}
          confirmLabel="ลองใหม่อีกครั้ง"
          onClose={() => setIsModalVisible(false)}
        />

        <style jsx global>{`
          .ant-input-affix-wrapper:hover,
          .ant-input-affix-wrapper:focus,
          .ant-input-affix-wrapper-focused {
            border-color: #f97316 !important;
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1) !important;
            background: #fff !important;
          }
          .ant-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(30, 41, 59, 0.25) !important;
            background: #0f172a !important;
          }
          .ant-steps-item-title {
            line-height: 1.4 !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
