"use client";

import { loginAction } from "@/actions/auth";
import LogoHeader from "@/components/auth/logo-header";
import {
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GoogleOutlined,
  LoadingOutlined,
  LockOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Result,
  Row,
  Space,
  Steps,
  Tag,
  theme,
  Typography,
} from "antd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Title, Text, Paragraph } = Typography;

export default function SignInPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/main");
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading" || sessionStatus === "authenticated") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: token.colorBgBase,
        }}
      >
        <LoadingOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
      </div>
    );
  }

  // Login Tracking States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loginStatus, setLoginStatus] = useState<
    "process" | "finish" | "error"
  >("process");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  const getErrorContent = () => {
    switch (errorCode) {
      case "MAX_ATTEMPTS_EXCEEDED":
        return {
          title: "บัญชีของคุณถูกล็อกชั่วคราว",
          icon: (
            <LockOutlined style={{ fontSize: 32, color: token.colorWarning }} />
          ),
          bg: token.colorWarningBg,
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
              style={{ fontSize: 32, color: token.colorError }}
            />
          ),
          bg: token.colorErrorBg,
          steps: [
            "บัญชีของคุณอาจถูกระงับหรือยังไม่อนุญาตให้เข้าใช้งาน",
            "โปรดติดต่อ Admin เพื่อตรวจสอบสถานะบัญชี",
          ],
        };
      case "INVALID_CREDENTIALS":
        return {
          title: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง",
          icon: (
            <UserOutlined style={{ fontSize: 32, color: token.colorError }} />
          ),
          bg: token.colorErrorBg,
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
              style={{ fontSize: 32, color: token.colorError }}
            />
          ),
          bg: token.colorErrorBg,
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
              <ThunderboltOutlined style={{ color: "#FFF" }} />
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
                สวัสดี <br /> SchoolBright!{" "}
                <SmileOutlined
                  style={{ fontSize: "40px", verticalAlign: "middle" }}
                />
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
                  <Button
                    type="link"
                    style={{ padding: 0, fontWeight: 600 }}
                    onClick={() => router.push("/auth/v2/forgot-password")}
                  >
                    คลิกที่นี่
                  </Button>
                </Text>
              </div>
            </Form>
          </div>
        </Col>
      </Row>

      {/* Login Tracking Modal */}
      <Modal
        open={isModalVisible}
        footer={null}
        closable={loginStatus === "error"}
        onCancel={() => setIsModalVisible(false)}
        centered
        width={480}
        styles={{
          mask: { backdropFilter: "blur(8px)" },
          content: { borderRadius: 24, padding: 32 },
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {loginStatus === "process" && (
            <div
              style={{
                width: 64,
                height: 64,
                background: token.colorInfoBg,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <LoadingOutlined
                style={{ fontSize: 32, color: token.colorPrimary }}
              />
            </div>
          )}
          {loginStatus === "finish" && (
            <Result
              status="success"
              title="เข้าสู่ระบบสำเร็จ"
              subTitle="เชื่อมต่อกับดาวเทียม SchoolBright เรียบร้อยแล้ว"
              icon={
                <CheckCircleOutlined
                  style={{ color: token.colorSuccess, fontSize: 64 }}
                />
              }
            />
          )}
          {loginStatus === "error" && (
            <div
              style={{
                width: 64,
                height: 64,
                background: errorContent.bg,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              {errorContent.icon}
            </div>
          )}

          {loginStatus !== "finish" && (
            <Title level={4} style={{ margin: 0 }}>
              {loginStatus === "error"
                ? errorContent.title
                : "กำลังนำคุณเข้าสู่ระบบ..."}
            </Title>
          )}
        </div>

        <Steps
          direction="vertical"
          current={currentStep}
          status={loginStatus === "error" ? "error" : "process"}
          style={{ paddingLeft: 24 }}
          items={[
            {
              title: (
                <Text strong style={{ fontSize: 13 }}>
                  Initiating Connection
                </Text>
              ),
              subTitle: <Tag color="blue">Client</Tag>,
              description: "เตรียมการเชื่อมต่อจากเบราว์เซอร์ของคุณ...",
            },
            {
              title: (
                <Text strong style={{ fontSize: 13 }}>
                  Identity Verification
                </Text>
              ),
              subTitle: <Tag color="orange">Auth Gateway</Tag>,
              description: "กำลังส่งข้อมูลเพื่อตรวจสอบสิทธิ์เข้าใช้งาน",
            },
            {
              title: (
                <Text strong style={{ fontSize: 13 }}>
                  Secure Channel
                </Text>
              ),
              subTitle: <Tag color="purple">Session Node</Tag>,
              description: "สร้างช่องทางเชื่อมต่อที่ปลอดภัย (RSA-256)",
            },
            {
              title: (
                <Text strong style={{ fontSize: 13 }}>
                  Finalizing Access
                </Text>
              ),
              subTitle: <Tag color="green">Main Portal</Tag>,
              description: "จัดเตรียมหน้าหลักและสิทธิ์การใช้งาน",
            },
          ]}
        />

        {loginStatus === "error" && (
          <div style={{ marginTop: 24 }}>
            <Alert
              message="รายละเอียดข้อผิดพลาด"
              description={errorMessage}
              type="error"
              showIcon
              style={{ borderRadius: 12 }}
            />

            <div style={{ marginTop: 20 }}>
              <Text
                strong
                style={{ fontSize: 13, display: "block", marginBottom: 8 }}
              >
                แนวทางการแก้ไข:
              </Text>
              <ul
                style={{
                  paddingLeft: 20,
                  margin: 0,
                  color: token.colorTextSecondary,
                  fontSize: 13,
                }}
              >
                {errorContent.steps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Divider dashed style={{ margin: "24px 0" }} />

            <div
              style={{
                background: token.colorFillAlter,
                padding: 16,
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <BugOutlined style={{ color: token.colorTextSecondary }} />
                <Text strong style={{ fontSize: 13 }}>
                  Debug Information
                </Text>
              </div>
              <pre
                style={{
                  fontSize: 11,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  color: token.colorError,
                  fontFamily: "monospace",
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>

            <Button
              block
              type="primary"
              danger
              size="large"
              onClick={() => setIsModalVisible(false)}
              style={{ marginTop: 24, borderRadius: 12, height: 48 }}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        )}
      </Modal>

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
