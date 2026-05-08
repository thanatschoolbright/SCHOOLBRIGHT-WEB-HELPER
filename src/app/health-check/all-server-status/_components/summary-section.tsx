import React from "react";
import { Row, Col, theme } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { useServerStatusStore } from "../_state/server-status.state";

/**
 * ส่วนแสดงผลสรุปตัวเลขสถิติ (Summary Metrics)
 * ดึงข้อมูลสรุปโดยการคำนวณจาก Raw Data ใน Store โดยตรงตามมาตรฐาน
 */
const SummarySection: React.FC = () => {
  const { token } = theme.useToken();
  const { getStats, getLatestTimestamp, isLoading } = useServerStatusStore();
  
  const stats = getStats();
  const lastChecked = getLatestTimestamp();

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="ทำงานปกติ (Online)"
          value={stats.online}
          subtitle="เซิร์ฟเวอร์ที่พร้อมให้บริการ"
          icon={<CheckCircleOutlined />}
          color={token.colorSuccess}
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="หยุดทำงาน (Offline)"
          value={stats.offline}
          subtitle="เซิร์ฟเวอร์ที่ขัดข้อง"
          icon={<CloseCircleOutlined />}
          color={token.colorError}
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="เวลาตอบสนองเฉลี่ย"
          value={stats.avgResponseTime.toFixed(2)}
          suffix="ms"
          subtitle={`อัปเดตล่าสุด: ${lastChecked}`}
          icon={<ClockCircleOutlined />}
          color={token.colorPrimary}
          isLoading={isLoading}
        />
      </Col>
    </Row>
  );
};

export default SummarySection;
