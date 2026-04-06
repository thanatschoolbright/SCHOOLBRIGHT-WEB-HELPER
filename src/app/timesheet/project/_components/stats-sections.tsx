"use client";

import {
  ApartmentOutlined,
  AppstoreOutlined,
  BugOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  CompassOutlined,
  DatabaseOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  MedicineBoxOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import SummaryCard from "@/components/card/summary-card";
import { categoryType } from "@data/timesheet.category.type";
import { Col, Flex, Row, theme, Typography } from "antd";
import React from "react";

import type { ProjectStatus } from "../types/project.types";

// ============================================================
// SDLC Style Helper
// ============================================================

const getSdlcStyle = (priority: number, nameTh: string, token: any) => {
  const name = nameTh.toLowerCase();
  if (name.includes("requirement") || name.includes("ความต้องการ") || priority === 1)
    return { color: token.colorInfo, bg: token.colorInfoBg, icon: <CompassOutlined /> };
  if (name.includes("design") || name.includes("ออกแบบ") || priority === 2)
    return { color: "#722ed1", bg: "#f9f0ff", icon: <FormatPainterOutlined /> };
  if (name.includes("develop") || name.includes("coding") || name.includes("พัฒนา") || priority === 3)
    return { color: "#13c2c2", bg: "#e6fffb", icon: <CodeOutlined /> };
  if (name.includes("test") || name.includes("qa") || name.includes("ทดสอบ") || priority === 4)
    return { color: token.colorWarning, bg: token.colorWarningBg, icon: <BugOutlined /> };
  if (name.includes("uat") || priority === 5)
    return { color: token.colorSuccess, bg: token.colorSuccessBg, icon: <SafetyCertificateOutlined /> };
  if (name.includes("deploy") || name.includes("release") || name.includes("ส่งมอบ") || priority >= 6)
    return { color: token.colorError, bg: token.colorErrorBg, icon: <CloudUploadOutlined /> };
  return { color: token.colorPrimary, bg: token.colorPrimaryBg, icon: <RocketOutlined /> };
};

const getCategoryStyle = (id: string, token: any) => {
  switch (id) {
    case "INTERNAL": return { color: token.colorPrimary, bg: token.colorPrimaryBg, icon: <ApartmentOutlined /> };
    case "EXTERNAL": return { color: token.colorSuccess, bg: token.colorSuccessBg, icon: <GlobalOutlined /> };
    case "MAINTENANCE": return { color: token.colorWarning, bg: token.colorWarningBg, icon: <ToolOutlined /> };
    case "LEAVE": return { color: "#eb2f96", bg: "#fff0f6", icon: <MedicineBoxOutlined /> };
    default: return { color: token.colorTextSecondary, bg: token.colorFillTertiary, icon: <AppstoreOutlined /> };
  }
};

const getAssetCaptureStyle = (id: string, token: any) => {
  switch (id) {
    case "CAPTUREABLE": return { color: token.colorSuccess, bg: token.colorSuccessBg, icon: <SafetyCertificateOutlined /> };
    case "UN_CAPTUREABLE": return { color: token.colorError, bg: token.colorErrorBg, icon: <DatabaseOutlined /> };
    default: return { color: token.colorTextSecondary, bg: token.colorFillTertiary, icon: <DatabaseOutlined /> };
  }
};

// ============================================================
// SdlcStatsSection
// ============================================================

interface SdlcStatsSectionProps {
  stats: { trackings?: Record<string, number>; health?: { total?: number } };
  statuses: ProjectStatus[];
}

export const SdlcStatsSection: React.FC<SdlcStatsSectionProps> = ({ stats, statuses }) => {
  const { token } = theme.useToken();

  if (!stats?.trackings) return null;

  const sortedActive = [...statuses].filter((s) => s.priority < 99).sort((a, b) => a.priority - b.priority);
  const total = stats.health?.total || 1;

  return (
    <Flex vertical gap={24} style={{ width: "100%" }}>
      <Flex align="center" gap={12}>
        <RocketOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
        <Typography.Title level={5} style={{ margin: 0 }}>สถานะการดำเนินการ (Trackings)</Typography.Title>
      </Flex>
      <Row gutter={[16, 16]}>
        {sortedActive.map((s) => {
          const count = (s.nameEn ? stats.trackings?.[s.nameEn] : 0) || 0;
          const style = getSdlcStyle(s.priority, s.nameTh, token);
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={s.id}>
              <SummaryCard
                title={s.nameTh}
                value={count}
                unit={`/ ${total}`}
                icon={style.icon}
                color={style.color}
                tooltip={`จำนวนโครงการที่อยู่ในสถานะ ${s.nameTh}`}
              />
            </Col>
          );
        })}
      </Row>
    </Flex>
  );
};

// ============================================================
// CategoryStatsSection
// ============================================================

interface CategoryStatsSectionProps {
  stats: { by_category?: Record<string, number>; health?: { total?: number } };
}

export const CategoryStatsSection: React.FC<CategoryStatsSectionProps> = ({ stats }) => {
  const { token } = theme.useToken();

  if (!stats?.by_category) return null;

  const total = stats.health?.total || 1;

  return (
    <Flex vertical gap={24} style={{ width: "100%", marginTop: "1rem" }}>
      <Flex align="center" gap={12}>
        <AppstoreOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
        <Typography.Title level={5} style={{ margin: 0 }}>แยกตามประเภท (By Category)</Typography.Title>
      </Flex>
      <Row gutter={[16, 16]}>
        {categoryType.map((cat) => {
          const count = stats.by_category?.[cat.id] || 0;
          const style = getCategoryStyle(cat.id, token);
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={cat.id}>
              <SummaryCard
                title={cat.name}
                value={count}
                unit={`/ ${total}`}
                icon={style.icon}
                color={style.color}
                tooltip={`จำนวนโครงการประเภท ${cat.name}`}
              />
            </Col>
          );
        })}
      </Row>
    </Flex>
  );
};

// ============================================================
// AssetCaptureStatsSection
// ============================================================

interface AssetCaptureStatsSectionProps {
  stats: { by_asset_capture?: Record<string, number>; health?: { total?: number } };
}

const ASSET_TYPES = [
  { id: "CAPTUREABLE", name: "บันทึกทรัพย์สิน" },
  { id: "UN_CAPTUREABLE", name: "ไม่บันทึกทรัพย์สิน" },
];

export const AssetCaptureStatsSection: React.FC<AssetCaptureStatsSectionProps> = ({ stats }) => {
  const { token } = theme.useToken();

  if (!stats?.by_asset_capture) return null;

  const total = stats.health?.total || 1;

  return (
    <Flex vertical gap={24} style={{ width: "100%", marginTop: "1rem" }}>
      <Flex align="center" gap={12}>
        <DatabaseOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
        <Typography.Title level={5} style={{ margin: 0 }}>แยกตามการบันทึกทรัพย์สิน (By Asset Capture)</Typography.Title>
      </Flex>
      <Row gutter={[16, 16]}>
        {ASSET_TYPES.map((type) => {
          const count = stats.by_asset_capture?.[type.id] || 0;
          const style = getAssetCaptureStyle(type.id, token);
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={type.id}>
              <SummaryCard
                title={type.name}
                value={count}
                unit={`/ ${total}`}
                icon={style.icon}
                color={style.color}
                tooltip={`จำนวนโครงการที่มีสิทธิ์ ${type.name}`}
              />
            </Col>
          );
        })}
      </Row>
    </Flex>
  );
};
