"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CodeOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOpenFilled,
  InfoCircleOutlined,
  CloseOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import {
  Modal,
  Space,
  Tag,
  theme,
  Typography,
  Row,
  Col,
  Divider,
  Button,
} from "antd";
import dayjs from "dayjs";
import React from "react";
import { TimesheetEntry } from "@/stores/type";

// --- Mock Data & Helpers ---
const STATUS_OPTIONS = [
  { value: "DONE", label_th: "สำเร็จ", label_en: "Done" },
  { value: "IN_PROGRESS", label_th: "กำลังดำเนินการ", label_en: "In Progress" },
  { value: "REVIEW", label_th: "รอการตรวจสอบ", label_en: "Review" },
  { value: "CANCELLED", label_th: "ยกเลิก", label_en: "Cancelled" },
  { value: "DRAFT", label_th: "ฉบับร่าง", label_en: "Draft" },
];

const i18next = { language: "th" };

// Map สีให้เข้ากับ Theme ของ Ant Design (Token)
const getStatusConfig = (status: string, token: any) => {
  const map: Record<
    string,
    { color: string; icon: React.ReactNode; bg: string }
  > = {
    DONE: {
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <CheckCircleFilled />,
    },
    IN_PROGRESS: {
      color: token.colorPrimary,
      bg: token.colorPrimaryBg,
      icon: <ClockCircleFilled />,
    },
    REVIEW: {
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <InfoCircleOutlined />,
    },
    CANCELLED: {
      color: token.colorError,
      bg: token.colorErrorBg,
      icon: <CloseOutlined />,
    },
    DRAFT: {
      color: token.colorTextSecondary,
      bg: token.colorFillQuaternary,
      icon: <EditOutlined />,
    },
  };
  return map[status] || map.DRAFT;
};

interface DetailModalProps {
  open: boolean;
  onCancel: () => void;
  record: TimesheetEntry | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onCancel,
  record,
}) => {
  const { token } = theme.useToken();

  if (!record) return null;

  const statusConfig = getStatusConfig(record.status, token);

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find((item) => item.value === status);
    if (!option) return status;
    return i18next.language === "th" ? option.label_th : option.label_en;
  };

  // --- Components ---

  // การ์ดแสดงข้อมูลย่อย (Stat Card)
  const InfoCard = ({ title, value, icon, color, delay }: any) => (
    <div
      className="info-card"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 16,
        padding: 16,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0, // Start hidden for animation
        transform: "translateY(20px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div
          style={{
            background: color ? `${color}20` : token.colorFillQuaternary,
            color: color || token.colorText,
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            marginRight: 12,
          }}
        >
          {icon}
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {title}
        </Typography.Text>
      </div>
      <Typography.Text strong style={{ fontSize: 16, display: "block" }}>
        {value}
      </Typography.Text>
    </div>
  );

  return (
    <>
      {/* Global Style for this modal's animations */}
      <style jsx global>{`
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .info-card {
          transition: all 0.3s ease;
        }
        .info-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          border-color: ${token.colorPrimary} !important;
        }
      `}</style>

      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={700}
        centered
        closeIcon={
          <div
            style={{
              background: token.colorFillAlter,
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorTextSecondary,
            }}
          >
            <CloseOutlined style={{ fontSize: 14 }} />
          </div>
        }
        styles={{
          content: {
            borderRadius: 24,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          },
          body: { padding: 0 },
        }}
      >
        {/* --- 1. Header Section (Hero) --- */}
        <div
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
            padding: "32px 32px 24px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* Badges Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <Tag
                bordered={false}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  color: token.colorTextSecondary,
                }}
              >
                <CalendarOutlined style={{ marginRight: 6 }} />
                {dayjs(record.date).format("DD MMMM YYYY")}
              </Tag>

              <Tag
                color={statusConfig.bg}
                style={{
                  color: statusConfig.color,
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {statusConfig.icon}
                {getStatusLabel(record.status)}
              </Tag>
            </div>

            {/* Project Title */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    background: token.colorPrimary,
                    color: "#fff",
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <FolderOpenFilled style={{ fontSize: 20 }} />
                </div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {record.project_name}
                </Typography.Title>
              </div>
              <Typography.Text type="secondary" style={{ marginLeft: 52 }}>
                ID: #{record.id || "Unknown"}
              </Typography.Text>
            </div>
          </Space>
        </div>

        {/* --- 2. Body Section --- */}
        <div style={{ padding: 32 }}>
          {/* Stats Grid */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col span={12} sm={8}>
              <InfoCard
                title="ชั่วโมงงาน"
                value={`${record.hours} ชม.`}
                icon={<ClockCircleFilled />}
                color={token.colorInfo}
                delay={100}
              />
            </Col>
            <Col span={12} sm={8}>
              <InfoCard
                title="ฟีเจอร์"
                value={record.feature_name || "-"}
                icon={<CodeOutlined />}
                delay={200}
              />
            </Col>
            <Col span={24} sm={8}>
              <InfoCard
                title="กิจกรรม"
                value="Development" // ตัวอย่าง Mock หรือดึงจาก record.activity_type
                icon={<ThunderboltFilled />}
                color={token.colorWarning}
                delay={300}
              />
            </Col>
          </Row>

          {/* Description Section */}
          <div
            style={{
              animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              animationDelay: "400ms",
              opacity: 0,
              transform: "translateY(20px)",
            }}
          >
            <Typography.Text
              strong
              style={{ fontSize: 16, display: "block", marginBottom: 12 }}
            >
              <FileTextOutlined
                style={{ marginRight: 8, color: token.colorPrimary }}
              />
              รายละเอียดงาน
            </Typography.Text>

            <div
              style={{
                background: token.colorFillQuaternary,
                borderRadius: 16,
                padding: 20,
                border: `1px dashed ${token.colorBorder}`,
                minHeight: 100,
              }}
            >
              <Typography.Paragraph
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: token.colorText,
                  whiteSpace: "pre-wrap",
                }}
              >
                {record.description || (
                  <span
                    style={{
                      color: token.colorTextQuaternary,
                      fontStyle: "italic",
                    }}
                  >
                    ไม่มีรายละเอียดระบุไว้...
                  </span>
                )}
              </Typography.Paragraph>
            </div>
          </div>

          <Divider style={{ margin: "32px 0 24px" }} />

          {/* --- 3. Footer Meta --- */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={2}>
                <Typography.Text
                  style={{ fontSize: 11, color: token.colorTextQuaternary }}
                >
                  สร้างเมื่อ:{" "}
                  {record.created_at
                    ? dayjs(record.created_at).format("DD MMM YYYY, HH:mm")
                    : "-"}
                </Typography.Text>
                <Typography.Text
                  style={{ fontSize: 11, color: token.colorTextQuaternary }}
                >
                  แก้ไขล่าสุด:{" "}
                  {record.updated_at
                    ? dayjs(record.updated_at).format("DD MMM YYYY, HH:mm")
                    : "-"}
                </Typography.Text>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={onCancel}
                style={{ borderRadius: 20, padding: "0 24px" }}
              >
                ปิดหน้าต่าง
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
};
