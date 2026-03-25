"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Col, Row } from "antd";
import React, { useMemo } from "react";
import { useServerStatusStore } from "../_state/server-status-store";

/**
 * คอมโพเนนต์แสดงสรุปสถิติสถานะเซิร์ฟเวอร์
 */
const SummarySection: React.FC = () => {
  const { serverHealthData } = useServerStatusStore();

  /**
   * คำนวณข้อมูลสรุปจาก Raw Data โดยตรงตามมาตรฐาน
   */
  const stats = useMemo(() => {
    const total = serverHealthData.length;
    const online = serverHealthData.filter((item) =>
      ["200", "404"].includes(item.status),
    ).length;
    const offline = total - online;
    const healthScore = total === 0 ? 0 : Math.round((online / total) * 100);

    return { total, online, offline, healthScore };
  }, [serverHealthData]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="สถานะระบบทั้งหมด"
          value={stats.total}
          unit="รายการ"
          icon={<ThunderboltOutlined style={{ color: "#1890ff" }} />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="ออนไลน์ (Online)"
          value={stats.online}
          unit="ระบบ"
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="ผิดพลาด (Error)"
          value={stats.offline}
          unit="ระบบ"
          icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="คะแนนความพร้อม"
          value={stats.healthScore}
          unit="%"
          icon={<LineChartOutlined style={{ color: "#13c2c2" }} />}
        />
      </Col>
    </Row>
  );
};

export default SummarySection;
