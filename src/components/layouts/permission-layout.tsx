import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Space, Typography, message } from "antd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

interface Props {
  role?: string[]; // รองรับการเช็ค Role (Legacy)
  permission?: string[]; // รองรับการเช็ค Permission Code (New Standard)
  children: React.ReactNode;
}

export default function PermissionLayout({
  role = [],
  permission = [],
  children,
}: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const AUTH_USER = session?.user as any;

  const [isBypassed, setIsBypassed] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  // เช็คจาก LocalStorage ว่าเคยกรอกรหัสไปแล้วหรือยัง
  useEffect(() => {
    const savedBypass = localStorage.getItem("sb_permission_bypassed");
    if (savedBypass === "true") {
      setIsBypassed(true);
    }
  }, []);

  // คำนวณสิทธิ์
  const userPermissions = AUTH_USER?.permissions || [];

  const hasRole =
    role.length === 0 ||
    role.includes("ALL") ||
    (AUTH_USER &&
      (role.includes(AUTH_USER?.role_name) ||
        role.includes(AUTH_USER?.position_name) ||
        role.includes(AUTH_USER?.position)));

  const hasPerm =
    permission.length === 0 ||
    permission.some((p) => userPermissions.includes(p));

  const isSuperAdmin = Number(AUTH_USER?.admin_id) === 117;

  const hasPermission = isSuperAdmin || (hasRole && hasPerm);

  useEffect(() => {
    // เช็คว่าโหลดเสร็จแล้วเท่านั้น
    if (status === "loading") return;

    // ถ้าไม่มี user เลย (ยังไม่ได้ login) -> redirect
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
        // จำไว้ในเครื่องว่าเคยกรอกแล้ว
        localStorage.setItem("sb_permission_bypassed", "true");
      } else {
        message.error("ACCESS DENIED: Incorrect Secret Code.");
        router.replace("/login");
      }
      setLoading(false);
    }, 800);
  };

  // ยังโหลดอยู่
  if (status === "loading") {
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

  // ถ้าไม่มีข้อมูลผู้ใช้
  if (!AUTH_USER) {
    return null; // หรือแสดงปุ่มให้กลับไป Login
  }

  // ถ้ามีสิทธิ์ หรือ Bypass แล้ว ให้แสดงเนื้อหา
  if (hasPermission || isBypassed) {
    return <>{children}</>;
  }

  // ถ้าไม่มีสิทธิ์ ให้แสดง Modal
  return (
    <div>
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
    </div>
  );
}
