import { LoadingOutlined, RobotOutlined } from "@ant-design/icons";
import { Modal, Progress, Spin, Steps, theme, Typography } from "antd";
import React from "react";

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
}) => {
  const { token } = theme.useToken();
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
    100,
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
          backgroundColor: token.colorBgContainer, // Dynamic background
          boxShadow: "none",
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
              color: token.colorPrimary,
              marginBottom: isMobile ? "12px" : "16px",
              display: "block",
            }}
          />
          <Title
            level={isMobile ? 4 : 3}
            style={{ margin: 0, marginBottom: "8px", color: token.colorText }}
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
              "0%": token.colorSuccess,
              "100%": token.colorPrimary,
            }}
            trailColor={token.colorFillSecondary}
            size={isMobile ? 6 : 8}
            showInfo={false}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              fontSize: isMobile ? "12px" : "14px",
              color: token.colorTextSecondary,
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
              background: token.colorBgLayout, // Use layout background for contrast
              border: `2px solid ${token.colorPrimaryBorder}`,
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "20px 16px" : "32px 24px",
              marginBottom: isMobile ? "20px" : "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Animation - Subtle Shimmer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent 0%, ${token.colorPrimaryBg} 50%, transparent 100%)`, // Use theme-aware transparent color
                animation: "shimmer 2s infinite linear",
                zIndex: 0,
                opacity: 0.3,
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
            `}</style>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: isMobile ? "32px" : "40px",
                  marginBottom: isMobile ? "12px" : "16px",
                  color: token.colorPrimary,
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
                    background: `linear-gradient(45deg, ${token.colorPrimary}, ${token.colorSuccess})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                  }}
                >
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: isMobile ? 20 : 28, color: "#fff" }}
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
                  color: token.colorPrimary,
                  textAlign: "center",
                }}
              >
                {currentStepData.title}
              </Title>
              <Text
                style={{
                  fontSize: isMobile ? "14px" : "16px",
                  color: token.colorTextSecondary,
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
          background: token.colorBgContainer,
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "none",
          marginBottom: "16px",
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Steps
          direction={isMobile ? "vertical" : "horizontal"}
          size={isMobile ? "small" : "default"}
          current={currentStep}
          labelPlacement={isMobile ? "horizontal" : "vertical"}
          responsive={false}
          items={steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            // Colors based on state
            const iconColor = isCompleted
              ? token.colorSuccess
              : isCurrent
                ? token.colorPrimary
                : token.colorTextDisabled;

            const titleColor = isCompleted
              ? token.colorSuccessText
              : isCurrent
                ? token.colorPrimaryText
                : token.colorTextDisabled;

            const descColor = isCompleted
              ? token.colorSuccessTextActive
              : isCurrent
                ? token.colorPrimaryTextActive
                : token.colorTextQuaternary;

            const iconBg = isCompleted
              ? token.colorSuccessBg
              : isCurrent
                ? token.colorPrimaryBg
                : token.colorFillQuaternary;

            const iconBorder = isCompleted
              ? token.colorSuccess
              : isCurrent
                ? token.colorPrimary
                : token.colorBorder;

            return {
              title: (
                <div
                  style={{
                    color: titleColor,
                    fontWeight: isCurrent ? "bold" : "normal",
                    fontSize: isMobile ? "12px" : "14px",
                    textAlign: isMobile ? "left" : "center",
                    marginTop: isMobile ? "0" : "8px",
                    marginLeft: isMobile ? "8px" : "0",
                  }}
                >
                  {step.title}
                  {isCompleted && (
                    <div
                      style={{
                        color: token.colorSuccess,
                        fontSize: isMobile ? "10px" : "12px",
                        fontWeight: "normal",
                        marginTop: "4px",
                      }}
                    >
                      เสร็จสิ้น
                    </div>
                  )}
                </div>
              ),
              description: (
                <div
                  style={{
                    color: descColor,
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
                    color: iconColor,
                    width: isMobile ? "32px" : "40px",
                    height: isMobile ? "32px" : "40px",
                    borderRadius: "50%",
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `${isMobile ? "2px" : "3px"} solid ${iconBorder}`,
                    transition: "all 0.3s ease",
                    boxShadow: "none",
                  }}
                >
                  {isCompleted ? (
                    "(v)"
                  ) : isCurrent ? (
                    <Spin
                      indicator={
                        <LoadingOutlined
                          style={{
                            fontSize: isMobile ? 14 : 16,
                            color: token.colorPrimary,
                          }}
                        />
                      }
                    />
                  ) : (
                    step.icon
                  )}
                </div>
              ),
            };
          })}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          textAlign: "center",
          padding: isMobile ? "16px 12px" : "20px 16px",
          background: token.colorBgLayout, // Theme-aware background
          borderRadius: "12px",
          border: `1px solid ${token.colorBorderSecondary}`,
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
              color: token.colorPrimary,
              animation: "pulse 2s infinite",
            }}
          />
          <Text
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "bold",
              color: token.colorPrimary,
            }}
          >
            AI กำลังทำงาน
          </Text>
        </div>
        <Text
          type="secondary"
          style={{
            fontSize: isMobile ? "12px" : "14px",
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
