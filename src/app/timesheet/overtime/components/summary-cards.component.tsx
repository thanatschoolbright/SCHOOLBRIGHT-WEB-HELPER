"use client";

import React from "react";
import { Row, Col, Tooltip, Progress, Typography, Space, Badge } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { OvertimeStats } from "../types/overtime.types";
import { SummaryCard } from "./summary-card.component";

const { Text } = Typography;

interface SummaryCardsProps {
  stats: OvertimeStats;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  loading,
}) => {
  // คำนวณเปอร์เซ็นต์สำหรับ Progress Bar เล็กๆ ในการ์ด
  const pendingRate = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;
  const approvedRate =
    stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  return (
    <Row gutter={[24, 24]} className="mb-6">
      {/* 1. รายการคำขอทั้งหมด */}
      <Col xs={24} sm={12} lg={8}>
        <Tooltip
          title="ยอดรวมคำขอทำงานล่วงเวลาทั้งหมดที่คุณเคยส่งในระบบ (รวมทุกสถานะ)"
          placement="topLeft"
          arrow
        >
          <div style={{ cursor: "pointer" }}>
            <SummaryCard
              title={
                <Space>
                  <span>คำขอทั้งหมด</span>
                  <InfoCircleOutlined
                    style={{ fontSize: "14px", color: "#bfbfbf" }}
                  />
                </Space>
              }
              value={stats.total}
              subValue="รายการคำขอที่บันทึกเข้าระบบ"
              icon={<FileTextOutlined style={{ fontSize: "24px" }} />}
              color="#1890ff"
              loading={loading}
            />
          </div>
        </Tooltip>
      </Col>

      {/* 2. รายการที่รออนุมัติ */}
      <Col xs={24} sm={12} lg={8}>
        <Tooltip
          title={`มีอีก ${stats.pending} รายการที่กำลังรอหัวหน้างานตรวจสอบ`}
          placement="topLeft"
        >
          <div style={{ cursor: "pointer", position: "relative" }}>
            <SummaryCard
              title={
                <Space>
                  <span>รอการพิจารณา</span>
                  <Badge status="processing" color="#faad14" />
                </Space>
              }
              value={stats.pending}
              subValue={
                <div style={{ width: "100%" }}>
                  <Text type="secondary" size="small">
                    คิดเป็น {pendingRate.toFixed(1)}% ของคำขอทั้งหมด
                  </Text>
                  <Progress
                    percent={pendingRate}
                    size="small"
                    showInfo={false}
                    strokeColor="#faad14"
                    trailColor="#fff1b8"
                    style={{ marginTop: 4 }}
                  />
                </div>
              }
              icon={<ClockCircleOutlined style={{ fontSize: "24px" }} />}
              color="#faad14"
              loading={loading}
            />
          </div>
        </Tooltip>
      </Col>

      {/* 3. รายการที่อนุมัติแล้ว */}
      <Col xs={24} sm={12} lg={8}>
        <Tooltip
          title="รายการที่ผ่านการอนุมัติเรียบร้อยแล้วและพร้อมสำหรับการจ่ายเงินงวดถัดไป"
          placement="topLeft"
        >
          <div style={{ cursor: "pointer" }}>
            <SummaryCard
              title={
                <Space>
                  <span>อนุมัติแล้ว</span>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                </Space>
              }
              value={stats.approved}
              subValue={
                <div style={{ width: "100%" }}>
                  <Text type="secondary" size="small">
                    ดำเนินการสำเร็จ {stats.approved} รายการ
                  </Text>
                  <Progress
                    percent={approvedRate}
                    size="small"
                    showInfo={false}
                    strokeColor="#52c41a"
                    trailColor="#f6ffed"
                    style={{ marginTop: 4 }}
                  />
                </div>
              }
              icon={<CheckCircleOutlined style={{ fontSize: "24px" }} />}
              color="#52c41a"
              loading={loading}
            />
          </div>
        </Tooltip>
      </Col>
    </Row>
  );
};
