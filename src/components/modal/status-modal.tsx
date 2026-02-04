import { Button, Modal, Result, Typography } from "antd";
import React from "react";

const { Paragraph, Text } = Typography;

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  type: "success" | "error";
  title?: string;
  message?: string;
  errorDetails?: any;
  loading?: boolean;
}

const StatusModal: React.FC<StatusModalProps> = ({
  open,
  onClose,
  type,
  title,
  message,
  errorDetails,
  loading = false,
}) => {
  const isSuccess = type === "success";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      width={isSuccess ? 480 : 640}
      loading={loading}
    >
      <Result
        status={type}
        title={title || (isSuccess ? "ทำรายการสำเร็จ" : "เกิดข้อผิดพลาด")}
        subTitle={message}
        extra={[
          <Button
            type="primary"
            key="close"
            onClick={onClose}
            size="large"
            style={{ minWidth: 120 }}
          >
            ตกลง
          </Button>,
        ]}
      >
        {!isSuccess && errorDetails && (
          <div
            style={{
              marginTop: 16,
              background: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
          >
            <Paragraph>
              <Text strong style={{ color: "#ff4d4f" }}>
                Debug Information:
              </Text>
            </Paragraph>
            <Paragraph
              copyable
              style={{
                margin: 0,
                maxHeight: "240px",
                overflowY: "auto",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}
              >
                {typeof errorDetails === "object"
                  ? JSON.stringify(errorDetails, null, 2)
                  : String(errorDetails)}
              </pre>
            </Paragraph>
          </div>
        )}
      </Result>
    </Modal>
  );
};

export default StatusModal;
