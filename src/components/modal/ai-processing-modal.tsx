import React from "react";
import { Modal, Steps, Typography, Progress, Spin } from "antd";
import {
  LoadingOutlined,
  RobotOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface AIProcessingStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "wait" | "process" | "finish" | "error";
}

interface AIProcessingModalProps {
  open: boolean;
  currentStep: number;
  steps: AIProcessingStep[];
  processingTime: number;
  onCancel?: () => void;
}

const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  open,
  currentStep,
  steps,
  processingTime,
  onCancel,
}) => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} วินาที`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} นาที ${remainingSeconds} วินาที`;
  };

  const currentStepData = steps[currentStep];
  const progressPercent = Math.min(
    ((currentStep + 1) / steps.length) * 100,
    100
  );

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={isMobile ? "95vw" : 800}
      maskClosable={false}
      styles={{
        content: {
          padding: isMobile ? "16px" : "32px",
          borderRadius: "16px",
          margin: isMobile ? "8px" : "auto",
        },
        mask: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
          <RobotOutlined
            style={{
              fontSize: isMobile ? "36px" : "48px",
              color: "#1890ff",
              marginBottom: isMobile ? "12px" : "16px",
              display: "block",
            }}
          />
          <Title
            level={isMobile ? 4 : 3}
            style={{ margin: 0, marginBottom: "8px" }}
          >
            กำลังประมวลผลด้วย AI
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
            กรุณารอสักครู่ ระบบกำลังสรุปและปรับแต่งคำอธิบาย
          </Text>
        </div>

        {/* Progress Overview */}
        <div style={{ marginBottom: isMobile ? "20px" : "32px" }}>
          <Progress
            percent={progressPercent}
            strokeColor={{
              "0%": "#87d068",
              "100%": "#1890ff",
            }}
            trailColor="#f5f5f5"
            size={isMobile ? 6 : 8}
            showInfo={false}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              fontSize: isMobile ? "12px" : "14px",
              color: "#666",
            }}
          >
            <span>
              ขั้นที่ {currentStep + 1} จาก {steps.length}
            </span>
            <span>{formatTime(processingTime)}</span>
          </div>
        </div>

        {/* Current Step Animation */}
        {currentStepData && (
          <div
            style={{
              background: "linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)",
              border: "2px solid #1890ff",
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "20px 16px" : "32px 24px",
              marginBottom: isMobile ? "20px" : "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Animation */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(24, 144, 255, 0.1) 50%, transparent 100%)",
                animation: "shimmer 2s infinite linear",
                zIndex: 0,
              }}
            />

            <style jsx>{`
              @keyframes shimmer {
                0% {
                  transform: translateX(-100%);
                }
                100% {
                  transform: translateX(100%);
                }
              }

              @keyframes pulse {
                0%,
                100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.7;
                }
              }

              @keyframes bounce {
                0%,
                20%,
                50%,
                80%,
                100% {
                  transform: translateY(0);
                }
                40% {
                  transform: translateY(-5px);
                }
                60% {
                  transform: translateY(-3px);
                }
              }
            `}</style>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: isMobile ? "32px" : "40px",
                  marginBottom: isMobile ? "12px" : "16px",
                  color: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: isMobile ? "48px" : "64px",
                    height: isMobile ? "48px" : "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(45deg, #1890ff, #52c41a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 20px rgba(24, 144, 255, 0.3)",
                  }}
                >
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: isMobile ? 20 : 28, color: "white" }}
                      />
                    }
                  />
                </div>
              </div>
              <Title
                level={isMobile ? 4 : 3}
                style={{
                  margin: 0,
                  marginBottom: "12px",
                  color: "#1890ff",
                  textAlign: "center",
                }}
              >
                {currentStepData.title}
              </Title>
              <Text
                style={{
                  fontSize: isMobile ? "14px" : "16px",
                  color: "#666",
                  display: "block",
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                {currentStepData.description}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Steps Progress - Horizontal Delivery Tracking Style */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          marginBottom: "16px",
        }}
      >
        <Steps
          direction={isMobile ? "vertical" : "horizontal"}
          size={isMobile ? "small" : "default"}
          current={currentStep}
          labelPlacement={isMobile ? "horizontal" : "vertical"}
          responsive={false}
          items={steps.map((step, index) => ({
            title: (
              <div
                style={{
                  color:
                    index < currentStep
                      ? "#52c41a"
                      : index === currentStep
                      ? "#1890ff"
                      : "#8c8c8c",
                  fontWeight: index === currentStep ? "bold" : "normal",
                  fontSize: isMobile ? "12px" : "14px",
                  textAlign: isMobile ? "left" : "center",
                  marginTop: isMobile ? "0" : "8px",
                  marginLeft: isMobile ? "8px" : "0",
                }}
              >
                {step.title}
                {index < currentStep && (
                  <div
                    style={{
                      color: "#52c41a",
                      fontSize: isMobile ? "10px" : "12px",
                      fontWeight: "normal",
                      marginTop: "4px",
                    }}
                  >
                    ✓ เสร็จสิ้น
                  </div>
                )}
              </div>
            ),
            description: (
              <div
                style={{
                  color:
                    index < currentStep
                      ? "#73d13d"
                      : index === currentStep
                      ? "#69c0ff"
                      : "#d9d9d9",
                  fontSize: isMobile ? "10px" : "12px",
                  lineHeight: "1.3",
                  textAlign: isMobile ? "left" : "center",
                  marginTop: "4px",
                  marginLeft: isMobile ? "8px" : "0",
                  maxWidth: isMobile ? "200px" : "120px",
                }}
              >
                {isMobile
                  ? step.description.slice(0, 50) +
                    (step.description.length > 50 ? "..." : "")
                  : step.description}
              </div>
            ),
            icon: (
              <div
                style={{
                  fontSize: isMobile ? "14px" : "16px",
                  color:
                    index < currentStep
                      ? "#52c41a"
                      : index === currentStep
                      ? "#1890ff"
                      : "#d9d9d9",
                  width: isMobile ? "32px" : "40px",
                  height: isMobile ? "32px" : "40px",
                  borderRadius: "50%",
                  background:
                    index < currentStep
                      ? "#f6ffed"
                      : index === currentStep
                      ? "#e6f7ff"
                      : "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `${isMobile ? "2px" : "3px"} solid ${
                    index < currentStep
                      ? "#52c41a"
                      : index === currentStep
                      ? "#1890ff"
                      : "#d9d9d9"
                  }`,
                  transition: "all 0.3s ease",
                  boxShadow:
                    index === currentStep
                      ? "0 0 12px rgba(24, 144, 255, 0.4)"
                      : index < currentStep
                      ? "0 0 8px rgba(82, 196, 26, 0.3)"
                      : "none",
                }}
              >
                {index < currentStep ? (
                  "✓"
                ) : index === currentStep ? (
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{
                          fontSize: isMobile ? 14 : 16,
                          color: "#1890ff",
                        }}
                      />
                    }
                  />
                ) : (
                  step.icon
                )}
              </div>
            ),
          }))}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          textAlign: "center",
          padding: isMobile ? "16px 12px" : "20px 16px",
          background: "linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)",
          borderRadius: "12px",
          border: "1px solid #e6f7ff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <RobotOutlined
            style={{
              fontSize: isMobile ? "16px" : "18px",
              color: "#1890ff",
              animation: "pulse 2s infinite",
            }}
          />
          <Text
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "bold",
              color: "#1890ff",
            }}
          >
            AI กำลังทำงาน
          </Text>
        </div>
        <Text
          type="secondary"
          style={{
            fontSize: isMobile ? "12px" : "14px",
            color: "#666",
            lineHeight: "1.4",
          }}
        >
          กรุณารอสักครุ่ ระบบกำลังวิเคราะห์และปรับปรุงเนื้อหาให้ดีขึ้น
        </Text>
      </div>
    </Modal>
  );
};

export default AIProcessingModal;
