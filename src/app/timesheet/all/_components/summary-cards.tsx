"use client";

import { useTimesheetAllStore } from "@/app/timesheet/all/_stores/timesheet-all-store";
import SummaryCard from "@/components/card/summary-card";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, theme, Tooltip, Typography } from "antd";
import React from "react";

const { Text } = Typography;

// ====================================================================
// HoursDistributionBar — mini bar แสดงกระจาย 0-4h / 4-8h / >8h
// ====================================================================

interface DistributionBarProps {
  counts: { low: number; mid: number; high: number };
  total: number;
  isLoading: boolean;
}

const HoursDistributionBar: React.FC<DistributionBarProps> = ({
  counts,
  total,
  isLoading,
}) => {
  const { token } = theme.useToken();
  if (isLoading || total === 0) {
    return (
      <div
        style={{
          height: 10,
          borderRadius: 6,
          background: token.colorFillSecondary,
          width: "100%",
        }}
      />
    );
  }

  const segments = [
    {
      key: "low",
      pct: (counts.low / total) * 100,
      color: token.colorError,
      label: `0–4 ชม. (${counts.low} คน)`,
    },
    {
      key: "mid",
      pct: (counts.mid / total) * 100,
      color: token.colorWarning,
      label: `4–8 ชม. (${counts.mid} คน)`,
    },
    {
      key: "high",
      pct: (counts.high / total) * 100,
      color: token.colorSuccess,
      label: `>8 ชม. (${counts.high} คน)`,
    },
  ];

  return (
    <Flex vertical gap={6}>
      <Flex
        style={{
          height: 10,
          borderRadius: 6,
          overflow: "hidden",
          width: "100%",
        }}
      >
        {segments.map((seg) =>
          seg.pct > 0 ? (
            <Tooltip key={seg.key} title={seg.label}>
              <div
                style={{
                  width: `${seg.pct}%`,
                  background: seg.color,
                  transition: "width 0.4s ease",
                }}
              />
            </Tooltip>
          ) : null,
        )}
      </Flex>
      <Flex gap={12}>
        {segments.map((seg) => (
          <Flex key={seg.key} align="center" gap={4}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <Text style={{ fontSize: 10, color: token.colorTextSecondary }}>
              {seg.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

// ====================================================================
// SummaryCards
// ====================================================================

/**
 * บัตรสรุปข้อมูล 4 รายการ + Insight Cards (Late/Missing/Distribution)
 * คำนวณจาก raw records ใน store โดยตรง
 */
export const SummaryCards: React.FC = () => {
  const { token } = theme.useToken();

  const records = useTimesheetAllStore((s) => s.records);
  const metadata = useTimesheetAllStore((s) => s.metadata);
  const loading = useTimesheetAllStore((s) => s.loading);

  // คำนวณ Insight metrics จาก records
  const lateCount = records.filter(
    (r) => r.total_hours > 0 && r.hours_gap > 0,
  ).length;
  const missingCount = records.filter((r) => r.total_hours === 0).length;
  const distribution = records.reduce(
    (acc, r) => {
      if (r.total_hours === 0 || r.total_hours < 4) acc.low++;
      else if (r.total_hours < 8) acc.mid++;
      else acc.high++;
      return acc;
    },
    { low: 0, mid: 0, high: 0 },
  );

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
      subtitle:
        "จำนวนวันทำงานทั้งหมดในช่วงวันที่เลือก (ไม่รวมวันเสาร์-อาทิตย์)",
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
    <Flex vertical gap={16}>
      {/* แถวที่ 1: Summary Cards เดิม */}
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

      {/* แถวที่ 2: Insight Cards */}
      <Row gutter={[16, 16]}>
        {/* Late Clock-in */}
        <Col xs={24} sm={12} md={8}>
          <Card
            styles={{ body: { padding: "16px 20px" } }}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${
                lateCount > 0
                  ? token.colorWarningBorder
                  : token.colorBorderSecondary
              }`,
              background:
                lateCount > 0 ? token.colorWarningBg : token.colorBgContainer,
            }}
          >
            <Flex align="center" gap={14}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: token.borderRadiusLG,
                  background:
                    lateCount > 0
                      ? token.colorWarning
                      : token.colorFillSecondary,
                  flexShrink: 0,
                }}
              >
                <ClockCircleOutlined
                  style={{
                    fontSize: 20,
                    color: lateCount > 0 ? "#fff" : token.colorTextDisabled,
                  }}
                />
              </Flex>
              <Flex vertical gap={2}>
                <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                  บันทึกไม่ครบ (ชั่วโมงขาด)
                </Text>
                {loading ? (
                  <div
                    style={{
                      height: 28,
                      width: 60,
                      background: token.colorFillSecondary,
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <Flex align="baseline" gap={4}>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color:
                          lateCount > 0
                            ? token.colorWarning
                            : token.colorTextDisabled,
                        lineHeight: 1,
                      }}
                    >
                      {lateCount}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: token.colorTextSecondary }}
                    >
                      / {records.length} คน
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Card>
        </Col>

        {/* Missing Timesheet */}
        <Col xs={24} sm={12} md={8}>
          <Card
            styles={{ body: { padding: "16px 20px" } }}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${
                missingCount > 0
                  ? token.colorErrorBorder
                  : token.colorBorderSecondary
              }`,
              background:
                missingCount > 0 ? token.colorErrorBg : token.colorBgContainer,
            }}
          >
            <Flex align="center" gap={14}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: token.borderRadiusLG,
                  background:
                    missingCount > 0
                      ? token.colorError
                      : token.colorFillSecondary,
                  flexShrink: 0,
                }}
              >
                <WarningOutlined
                  style={{
                    fontSize: 20,
                    color: missingCount > 0 ? "#fff" : token.colorTextDisabled,
                  }}
                />
              </Flex>
              <Flex vertical gap={2}>
                <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                  ไม่มีข้อมูลเวลาทำงานเลย
                </Text>
                {loading ? (
                  <div
                    style={{
                      height: 28,
                      width: 60,
                      background: token.colorFillSecondary,
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <Flex align="baseline" gap={4}>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color:
                          missingCount > 0
                            ? token.colorError
                            : token.colorTextDisabled,
                        lineHeight: 1,
                      }}
                    >
                      {missingCount}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: token.colorTextSecondary }}
                    >
                      / {records.length} คน
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Card>
        </Col>

        {/* Hours Distribution Bar */}
        <Col xs={24} md={8}>
          <Card
            styles={{ body: { padding: "16px 20px" } }}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer,
            }}
          >
            <Flex vertical gap={10}>
              <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                การกระจายชั่วโมงทำงาน
              </Text>
              <HoursDistributionBar
                counts={distribution}
                total={records.length}
                isLoading={loading}
              />
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  );
};
