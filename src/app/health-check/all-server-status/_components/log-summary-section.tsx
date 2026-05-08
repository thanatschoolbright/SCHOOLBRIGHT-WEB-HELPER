"use client";

import React from "react";
import { Row, Col, theme, Alert } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { useServerStatusStore } from "../_state/server-status.state";

/**
 * ส่วนสรุปสถิติ Uptime/Downtime จากข้อมูล Log (Log Summary Cards)
 * แสดงภาพรวมของทุก Server ในช่วงเวลาที่กำหนด
 */
const LogSummarySection: React.FC = () => {
  const { token } = theme.useToken();
  const { logSummary, isLoadingSummary } = useServerStatusStore();

  if (!logSummary && !isLoadingSummary) {
    return (
      <Alert
        message="ยังไม่มีข้อมูล Log"
        description="ระบบยังไม่มีข้อมูล log ในช่วงเวลานี้ อาจเป็นเพราะยังไม่เคยมีการตรวจสอบสถานะ Server หรือข้อมูลถูกลบออกไปแล้ว"
        type="info"
        showIcon
      />
    );
  }

  const overall = logSummary?.overall;
  const period = logSummary?.period;

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Uptime รวมทั้งระบบ"
          value={overall ? overall.uptime_percent.toFixed(2) : "-"}
          suffix="%"
          subtitle={period ? `ย้อนหลัง ${period.days} วัน` : ""}
          icon={<CheckCircleOutlined />}
          color={
            !overall
              ? token.colorPrimary
              : overall.uptime_percent >= 99
                ? token.colorSuccess
                : overall.uptime_percent >= 95
                  ? token.colorWarning
                  : token.colorError
          }
          isLoading={isLoadingSummary}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="จำนวนครั้งที่ Offline"
          value={overall?.total_downtime_count ?? "-"}
          unit="ครั้ง"
          subtitle="รวมทุก Server"
          icon={<CloseCircleOutlined />}
          color={overall && overall.total_downtime_count > 0 ? token.colorError : token.colorSuccess}
          isLoading={isLoadingSummary}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="จำนวนการตรวจสอบ"
          value={overall?.total_checks ?? "-"}
          unit="ครั้ง"
          subtitle="รวมทุก Server"
          icon={<BarChartOutlined />}
          color={token.colorPrimary}
          isLoading={isLoadingSummary}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Downtime รวม"
          value={overall ? overall.downtime_percent.toFixed(2) : "-"}
          suffix="%"
          subtitle="เปอร์เซ็นต์ที่ระบบหยุดทำงาน"
          icon={<ThunderboltOutlined />}
          color={overall && overall.downtime_percent > 0 ? token.colorError : token.colorSuccess}
          isLoading={isLoadingSummary}
        />
      </Col>
    </Row>
  );
};

export default LogSummarySection;
