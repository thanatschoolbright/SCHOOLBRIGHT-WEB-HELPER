"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Col, Row } from "antd";
import React, { useMemo } from "react";
import { useOvertimeStore } from "../_state/overtime-store";

/**
 * คอมโพเนนต์แสดงบัตรสรุปข้อมูล (Summary Cards) สำหรับหน้าจัดการ OT
 * คำนวณข้อมูลจาก Raw Data ใน Store โดยตรง
 */
const SummarySection: React.FC = () => {
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

    return {
      total: totalCountValue,
      pending: pendingCountValue,
      approved: approvedCountValue,
    };
  }, [overtimeDataSource, totalRecords]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="รายการทั้งหมด"
          value={overtimeStatistics.total}
          unit="รายการ"
          icon={<FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />}
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
  );
};

export default SummarySection;
