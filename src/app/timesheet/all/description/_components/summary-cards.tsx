"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Col, Row, theme } from "antd";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectSummaryStats,
  useDescriptionStore,
} from "../_stores/description-store";

/**
 * บัตรสรุป 4 รายการ: พนักงานทั้งหมด, กรอกครบ, ยังไม่ครบ, ชั่วโมงรวม
 * คำนวณจาก raw records ใน store โดยตรง
 */
export const SummaryCards: React.FC = () => {
  const { token } = theme.useToken();

  const loading = useDescriptionStore((s) => s.loading);
  const stats = useDescriptionStore(useShallow(selectSummaryStats));

  const metrics = [
    {
      title: "พนักงานทั้งหมด",
      value: `${stats.totalMembers}/${stats.totalMembers}`,
      icon: <UserOutlined />,
      color: token.colorPrimary,
      suffix: "คน",
    },
    {
      title: "กรอกครบถ้วน",
      value: `${stats.completedMembers}/${stats.totalMembers}`,
      icon: <CalendarOutlined />,
      color: token.colorSuccess,
      suffix: "คน",
    },
    {
      title: "ยังไม่ครบ",
      value: `${stats.incompleteMembers}/${stats.totalMembers}`,
      icon: <FieldTimeOutlined />,
      color: token.colorError,
      suffix: "คน",
    },
    {
      title: "ชั่วโมงรวม",
      value: `${stats.totalHours}/${stats.requiredHours}`,
      icon: <ClockCircleOutlined />,
      color: token.colorInfo,
      suffix: "ชม.",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {metrics.map((m, i) => (
        <Col xs={24} sm={12} md={6} key={i}>
          <SummaryCard
            title={m.title}
            value={m.value}
            icon={m.icon}
            color={m.color}
            suffix={m.suffix}
            isLoading={loading}
          />
        </Col>
      ))}
    </Row>
  );
};
