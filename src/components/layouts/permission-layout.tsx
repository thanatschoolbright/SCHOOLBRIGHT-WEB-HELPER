import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Modal,
  Input,
  Button,
  Typography,
  Space,
  message,
  ConfigProvider,
  theme,
} from "antd";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface Props {
  role: string[];
  children: React.ReactNode;
}

export default function PermissionLayout({ role, children }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const AUTH_USER = session?.user as any;

  const [isBypassed, setIsBypassed] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  // คำนวณสิทธิ์
  const hasPermission =
    role.includes("ALL") ||
    (AUTH_USER && role.includes(AUTH_USER?.role_name || AUTH_USER?.position));

  useEffect(() => {
    // ✅ เช็คว่าโหลดเสร็จแล้วเท่านั้น
    if (status === "loading") return;

    // ✅ ถ้าไม่มี user เลย (ยังไม่ได้ login) → redirect
    if (status === "unauthenticated") {
      router.replace("/auth/v2/signin");
    }
  }, [status, router]);

  const handleVerify = () => {
    setLoading(true);
    // Simulate a small delay for dramatic effect
    setTimeout(() => {
      if (secretCode === "LIGHTGOD") {
        message.success("ACCESS GRANTED: Welcome, Administrator.");
        setIsBypassed(true);
      } else {
        message.error("ACCESS DENIED: Incorrect Secret Code.");
        router.replace("/login");
      }
      setLoading(false);
    }, 800);
  };

  // ⏳ ยังโหลดอยู่
  if (AUTHENTICATION?.loading || !AUTH_USER) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f0f2f5",
        }}
      >
        <p>กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  // ✅ ถ้ามีสิทธิ์ หรือ Bypass แล้ว ให้แสดงเนื้อหา
  if (hasPermission || isBypassed) {
    return <>{children}</>;
  }

  // ❌ ถ้าไม่มีสิทธิ์ ให้แสดง Modal
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#faad14", // Warning/Gold color fits the "Secret" vibe
          borderRadius: 12,
        },
      }}
    >
      <div
        style={{
          height: "100vh",
          width: "100vw",
          background: "#f5f5f5",
          filter: "blur(5px)",
          position: "absolute",
          zIndex: 0,
        }}
      />
      <Modal
        open={true}
        closable={false}
        maskClosable={false}
        footer={null}
        centered
        width={420}
        styles={{
          mask: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.6)",
          },
          content: {
            padding: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
          },
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #faad14 100%)",
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(250, 173, 20, 0.4)",
              marginBottom: 8,
            }}
          >
            <SafetyCertificateOutlined
              style={{ fontSize: 40, color: "white" }}
            />
          </div>

          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              Restricted Access
            </Title>
            <Text type="secondary">ส่วนนี้สำหรับผู้ได้รับอนุญาตเท่านั้น</Text>
          </Space>

          <div style={{ width: "100%", marginTop: 24, textAlign: "left" }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              โปรดใส่รหัสลับจากท่านไลท์
            </Text>
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
              placeholder="Enter Secret Code"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              onPressEnter={handleVerify}
              style={{ padding: "10px 16px" }}
            />
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleVerify}
            loading={loading}
            style={{
              height: 48,
              fontSize: 16,
              marginTop: 16,
              background: "linear-gradient(90deg, #faad14 0%, #fadb14 100%)",
              border: "none",
            }}
            icon={<ArrowRightOutlined />}
          >
            ตรวจสอบรหัสลับ
          </Button>

          <Text type="secondary" style={{ fontSize: 12 }}>
            หากใส่ผิดระบบจะนำท่านกลับไปยังหน้าเข้าสู่ระบบทันที
          </Text>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
