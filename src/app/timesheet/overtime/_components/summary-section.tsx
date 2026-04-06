"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Card,
  Col,
  Flex,
  InputNumber,
  Progress,
  Row,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React, { useMemo, useState } from "react";
import { useOvertimeStore } from "../_state/overtime-store";

/** ชั่วโมง OT Budget เริ่มต้นต่อเดือน (ชม.) */
const DEFAULT_MONTHLY_BUDGET_HOURS = 160;

/**
 * คอมโพเนนต์แสดงบัตรสรุปข้อมูล (Summary Cards) สำหรับหน้าจัดการ OT
 * คำนวณข้อมูลจาก Raw Data ใน Store โดยตรง
 * รวม Notification Badge + OT Budget Tracker
 */
const SummarySection: React.FC = () => {
  const { token } = theme.useToken();
  const { overtimeDataSource, isLoadingOvertimeData, totalRecords } =
    useOvertimeStore();

  // Budget ที่ตั้งต่อเดือน — ปรับได้โดยผู้ใช้
  const [monthlyBudgetHours, setMonthlyBudgetHours] = useState<number>(
    DEFAULT_MONTHLY_BUDGET_HOURS,
  );

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
      const diffDays =
        Math.abs(new Date().getTime() - new Date(created).getTime()) /
        (1000 * 60 * 60 * 24);
      return diffDays > 3;
    }).length;

    // คำนวณ hours OT จริงที่ approved/paid รวม
    const approvedHours = overtimeDataSource
      .filter((item) =>
        ["approved", "paid", "payment_failed"].includes(item.status || ""),
      )
      .reduce((sum, item) => {
        const hrs =
          item.descriptions?.reduce(
            (s: number, d: any) => s + Number(d.duration || 0),
            0,
          ) || 0;
        return sum + hrs;
      }, 0);

    return {
      total: totalCountValue,
      pending: pendingCountValue,
      approved: approvedCountValue,
      urgentPending: urgentPendingCountValue,
      approvedHours,
    };
  }, [overtimeDataSource, totalRecords]);

  // คำนวณ % การใช้ Budget
  const budgetUsagePercent = useMemo(() => {
    if (monthlyBudgetHours <= 0) return 0;
    return Math.min(
      Math.round((overtimeStatistics.approvedHours / monthlyBudgetHours) * 100),
      100,
    );
  }, [overtimeStatistics.approvedHours, monthlyBudgetHours]);

  const budgetRemaining = Math.max(
    monthlyBudgetHours - overtimeStatistics.approvedHours,
    0,
  );
  const isOverBudget =
    overtimeStatistics.approvedHours > monthlyBudgetHours;

  // สีของ Progress ตามระดับการใช้งาน
  const budgetProgressColor =
    budgetUsagePercent >= 100
      ? token.colorError
      : budgetUsagePercent >= 80
        ? token.colorWarning
        : token.colorSuccess;

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
        {/* Card 1: รายการทั้งหมด */}
        <Col xs={24} sm={12} lg={6}>
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

        {/* Card 2: รออนุมัติ */}
        <Col xs={24} sm={12} lg={6}>
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

        {/* Card 3: อนุมัติแล้ว */}
        <Col xs={24} sm={12} lg={6}>
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

        {/* Card 4: OT Budget Tracker */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            styles={{
              body: {
                padding: "32px 28px",
                height: "100%",
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
              },
            }}
            style={{
              borderRadius: 24,
              border: `1px solid ${isOverBudget ? token.colorErrorBorder : token.colorBorderSecondary}`,
              background: isOverBudget
                ? token.colorErrorBg
                : token.colorBgContainer,
              height: "100%",
            }}
          >
            <Flex vertical justify="space-between" style={{ height: "100%", flex: 1 }}>
              {/* Header */}
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={12}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isOverBudget
                        ? `${token.colorError}20`
                        : `${token.colorSuccess}20`,
                    }}
                  >
                    <DollarOutlined
                      style={{
                        fontSize: 20,
                        color: isOverBudget
                          ? token.colorError
                          : token.colorSuccess,
                      }}
                    />
                  </div>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 16, fontWeight: 600 }}
                  >
                    OT Budget
                  </Typography.Text>
                </Flex>

                {/* ตั้งค่า Budget */}
                <Tooltip title="ตั้ง Budget ชั่วโมง OT ต่อเดือน">
                  <InputNumber
                    size="small"
                    min={1}
                    max={999}
                    value={monthlyBudgetHours}
                    onChange={(v) => setMonthlyBudgetHours(Number(v) || DEFAULT_MONTHLY_BUDGET_HOURS)}
                    suffix="ชม."
                    style={{ width: 90 }}
                    variant="outlined"
                  />
                </Tooltip>
              </Flex>

              {/* ตัวเลขหลัก + Progress */}
              <Flex vertical gap={8} style={{ marginTop: 16 }}>
                <Flex align="baseline" gap={6}>
                  <Typography.Text
                    style={{
                      fontSize: 40,
                      fontWeight: 900,
                      letterSpacing: "-1px",
                      lineHeight: 1,
                      color: isOverBudget ? token.colorError : token.colorText,
                    }}
                  >
                    {overtimeStatistics.approvedHours.toFixed(1)}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 16 }}
                  >
                    / {monthlyBudgetHours} ชม.
                  </Typography.Text>
                </Flex>

                <Progress
                  percent={budgetUsagePercent}
                  showInfo={false}
                  strokeColor={budgetProgressColor}
                  trailColor={token.colorBorderSecondary}
                  size={["100%", 8] as any}
                  style={{ margin: 0 }}
                />

                <Flex justify="space-between" align="center">
                  <Typography.Text
                    style={{
                      fontSize: 12,
                      color: budgetProgressColor,
                      fontWeight: 600,
                    }}
                  >
                    {budgetUsagePercent}% ใช้ไปแล้ว
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                  >
                    {isOverBudget
                      ? `เกิน ${(overtimeStatistics.approvedHours - monthlyBudgetHours).toFixed(1)} ชม.`
                      : `เหลือ ${budgetRemaining.toFixed(1)} ชม.`}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  );
};

export default SummarySection;
