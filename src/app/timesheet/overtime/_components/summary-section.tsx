"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Alert, Col, Flex, Row, theme, Typography } from "antd";
import React, { useMemo } from "react";
import { useOvertimeStore } from "../_state/overtime-store";

/**
 * คอมโพเนนต์แสดงบัตรสรุปข้อมูล (Summary Cards) สำหรับหน้าจัดการ OT
 * คำนวณข้อมูลจาก Raw Data ใน Store โดยตรง
 * รวม Notification Badge แจ้งเตือน pending requests ที่รออนุมัติ
 */
const SummarySection: React.FC = () => {
  const { token } = theme.useToken();
  const { overtimeDataSource, isLoadingOvertimeData, totalRecords } =
    useOvertimeStore();

  // คำนวณข้อมูลสรุปจาก Raw Data
  const overtimeStatistics = useMemo(() => {
    const totalCountValue = totalRecords;
    const pendingCountValue = overtimeDataSource.filter(
      (item) => item.status === "pending",
    ).length;
    const approvedCountValue = overtimeDataSource.filter((item) =>
      ["approved", "paid", "payment_failed"].includes(item.status || ""),
    ).length;

    // รายการ pending ที่รอนานกว่า 3 วัน (ต้องด่วน)
    const urgentPendingCountValue = overtimeDataSource.filter((item) => {
      if (item.status !== "pending") return false;
      const created = item.created_at || item.request_date;
      if (!created) return false;
      const diffDays = Math.abs(
        new Date().getTime() - new Date(created).getTime(),
      ) / (1000 * 60 * 60 * 24);
      return diffDays > 3;
    }).length;

    return {
      total: totalCountValue,
      pending: pendingCountValue,
      approved: approvedCountValue,
      urgentPending: urgentPendingCountValue,
    };
  }, [overtimeDataSource, totalRecords]);

  return (
    <Flex vertical gap={12}>
      {/* Notification Alert — แสดงเมื่อมี pending รออนุมัติ */}
      {!isLoadingOvertimeData && overtimeStatistics.pending > 0 && (
        <Alert
          type={overtimeStatistics.urgentPending > 0 ? "error" : "warning"}
          showIcon
          icon={
            <BellOutlined
              style={{
                color:
                  overtimeStatistics.urgentPending > 0
                    ? token.colorError
                    : token.colorWarning,
                fontSize: 16,
              }}
            />
          }
          message={
            <Flex align="center" gap={8} wrap="wrap">
              <Typography.Text strong>
                มีคำขอ OT รออนุมัติ{" "}
                <Typography.Text
                  strong
                  style={{
                    color:
                      overtimeStatistics.urgentPending > 0
                        ? token.colorError
                        : token.colorWarning,
                    fontSize: 16,
                  }}
                >
                  {overtimeStatistics.pending}
                </Typography.Text>{" "}
                รายการ
              </Typography.Text>
              {overtimeStatistics.urgentPending > 0 && (
                <Typography.Text
                  style={{ color: token.colorError, fontSize: 12 }}
                >
                  ⚠️ รอนานกว่า 3 วันแล้ว{" "}
                  <strong>{overtimeStatistics.urgentPending}</strong> รายการ —
                  ควรอนุมัติโดยด่วน
                </Typography.Text>
              )}
            </Flex>
          }
          style={{
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${overtimeStatistics.urgentPending > 0 ? token.colorErrorBorder : token.colorWarningBorder}`,
          }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <SummaryCard
            title="รายการทั้งหมด"
            value={overtimeStatistics.total}
            unit="รายการ"
            icon={
              <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            }
            isLoading={isLoadingOvertimeData}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <SummaryCard
            title="รออนุมัติ"
            value={overtimeStatistics.pending}
            unit="รายการ"
            icon={
              <ClockCircleOutlined style={{ fontSize: 24, color: "#faad14" }} />
            }
            isLoading={isLoadingOvertimeData}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={8}>
          <SummaryCard
            title="อนุมัติแล้ว"
            value={overtimeStatistics.approved}
            unit="รายการ"
            icon={
              <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
            }
            isLoading={isLoadingOvertimeData}
            color="#52c41a"
          />
        </Col>
      </Row>
    </Flex>
  );
};

export default SummarySection;
