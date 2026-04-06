"use client";

import SummaryCard from "@/components/card/summary-card";
import { useTimesheetAllStore } from "@/app/timesheet/all/_state/timesheet-all-store";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Col, Row, theme } from "antd";
import React from "react";

/**
 * บัตรสรุปข้อมูล 4 รายการ: รายการทั้งหมด, วันทำงาน, โครงการ, พนักงาน
 * คำนวณจาก raw records ใน store โดยตรง
 */
export const SummaryCards: React.FC = () => {
  const { token } = theme.useToken();

  const records = useTimesheetAllStore((s) => s.records);
  const metadata = useTimesheetAllStore((s) => s.metadata);
  const loading = useTimesheetAllStore((s) => s.loading);

  const metrics = [
    {
      title: "รายการทั้งหมด",
      value: records.length,
      icon: <AppstoreOutlined />,
      color: token.colorPrimary,
      subtitle: "รายการที่ถูกบันทึกในหน้าเว็บช่วยสอน (SB Web Helper)",
      suffix: "รายการ",
    },
    {
      title: "วันทำงานจริง",
      value: metadata?.working_days || 0,
      icon: <CalendarOutlined />,
      color: token.colorSuccess,
      subtitle: "จำนวนวันทำงานทั้งหมดในช่วงวันที่เลือก (ไม่รวมวันเสาร์-อาทิตย์)",
      suffix: "วัน",
    },
    {
      title: "โครงการ",
      value: new Set(records.map((r) => r.admin_id)).size,
      icon: <ProjectOutlined />,
      color: token.colorWarning,
      subtitle: "จำนวนโครงการที่พนักงานเข้าไปกรอกเวลาทำงาน",
      suffix: "โครงการ",
    },
    {
      title: "พนักงาน",
      value: new Set(records.map((r) => r.admin_id)).size,
      icon: <TeamOutlined />,
      color: token.colorInfo,
      subtitle: "จำนวนพนักงานทั้งหมดที่มีข้อมูลในรายงานนี้",
      suffix: "คน",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {metrics.map((metric, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <SummaryCard
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            color={metric.color}
            suffix={metric.suffix}
            isLoading={loading}
          />
        </Col>
      ))}
    </Row>
  );
};
