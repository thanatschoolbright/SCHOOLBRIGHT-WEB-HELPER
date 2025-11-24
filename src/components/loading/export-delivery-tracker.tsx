"use client";
import React from "react";
import { motion } from "framer-motion";
import { theme, Typography } from "antd";
import {
  CheckOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SyncOutlined,
} from "@ant-design/icons";

interface ExportDeliveryTrackerProps {
  currentStep: number;
}

const STEPS = [
  { title: "เตรียมข้อมูล", icon: <CloudUploadOutlined /> },
  { title: "ประมวลผล", icon: <SyncOutlined spin /> },
  { title: "สร้างไฟล์ Excel", icon: <FileExcelOutlined /> },
  { title: "ดาวน์โหลด", icon: <CloudDownloadOutlined /> },
];

export const ExportDeliveryTracker: React.FC<ExportDeliveryTrackerProps> = ({
  currentStep,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 24px",
        width: "100%",
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > index;
        const isActive = currentStep === index;
        const isLast = index === STEPS.length - 1;

        return (
          <React.Fragment key={index}>
            {/* Step Item */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
                minWidth: 80,
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  backgroundColor:
                    isCompleted || isActive
                      ? token.colorPrimary
                      : token.colorFillSecondary,
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive
                    ? `0 0 0 4px ${token.colorPrimaryBg}`
                    : "none",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color:
                    isCompleted || isActive ? "#fff" : token.colorTextDisabled,
                  fontSize: 20,
                  marginBottom: 8,
                  cursor: "default",
                }}
              >
                {isCompleted ? (
                  <CheckOutlined />
                ) : isActive && index === 1 ? (
                  <SyncOutlined spin />
                ) : (
                  step.icon
                )}
              </motion.div>
              <Typography.Text
                style={{
                  fontSize: 13,
                  color: isActive
                    ? token.colorPrimary
                    : token.colorTextSecondary,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {step.title}
              </Typography.Text>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  backgroundColor: token.colorFillSecondary,
                  margin: "0 4px",
                  position: "relative",
                  top: -14,
                  borderRadius: 2,
                }}
              >
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{
                    height: "100%",
                    backgroundColor: token.colorPrimary,
                    borderRadius: 2,
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
