"use client";

import React, { useState, useMemo } from "react";
import {
  Space,
  Button,
  Typography,
  Collapse,
  Card,
  Badge,
  Tooltip,
  Statistic,
  Row,
  Col,
  theme,
  Alert,
  Divider,
  Flex,
} from "antd";
import {
  LoginOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FilterOutlined,
  TableOutlined,
  RiseOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import { useBypassPageData } from "./hooks/bypass.data";
import StatisticsSection from "./components/statistics-section.component";
import FiltersSection from "./components/filters-section.component";
import SchoolTableSection from "./components/school-table-section.component";
import ProvinceRankingModal from "./components/province-ranking-modal.component";
import { calculateProvinceStatistics } from "./utils/province-stats.helpers";
import SaleRankingModal from "./components/sale-ranking-modal.component";
import { calculateSaleStatistics } from "./utils/sale-stats.helpers";
import type { SaleStatistics } from "./types/sale-stats.types";
import type { ProvinceStatistics } from "./types/province-stats.types";
import type { SchoolDetail } from "./types/bypass.types";
import BypassSelectionModal from "./components/bypass-selection-modal.component";

const { Title, Text } = Typography;

const getAvatarColor = (name: string) => {
  const colors = [
    "#f5222d",
    "#fa541c",
    "#fa8c16",
    "#faad14",
    "#fadb14",
    "#a0d911",
    "#52c41a",
    "#13c2c2",
    "#1890ff",
    "#2f54eb",
    "#722ed1",
    "#eb2f96",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const addAlpha = (color: string, alpha: number) => {
  if (!color) return "rgba(0,0,0,0)";
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const HeaderSection = ({
  TRANSLATION,
  onProvinceRanking,
  onSaleRanking,
}: any) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  return (
    <div
      className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-3xl border border-solid"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${addAlpha(
              token.colorPrimary,
              0.05
            )} 100%)`
          : `linear-gradient(135deg, #fff 0%, ${addAlpha(
              token.colorPrimary,
              0.03
            )} 100%)`,
        borderColor: addAlpha(token.colorBorder, 0.6),
      }}
    >
      <Space size={20}>
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
          }}
        >
          <LoginOutlined style={{ fontSize: 28, color: "#fff" }} />
        </div>
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 800,
              letterSpacing: "-1px",
              color: token.colorTextHeading,
            }}
          >
            {TRANSLATION("bypass_page.title")}
          </Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            {TRANSLATION("bypass_page.subtitle")}
          </Text>
        </div>
      </Space>
      <Space size="middle" wrap>
        <Button
          onClick={onProvinceRanking}
          size="large"
          shape="round"
          icon={<TrophyOutlined />}
          style={{
            height: 48,
            padding: "0 24px",
            fontWeight: 600,
            border: `1px solid ${addAlpha("#8b5cf6", 0.3)}`,
            background: addAlpha("#8b5cf6", 0.05),
            color: "#8b5cf6",
          }}
        >
          {TRANSLATION("bypass_page.view_province_ranking")}
        </Button>
        <Button
          onClick={onSaleRanking}
          size="large"
          shape="round"
          icon={<TeamOutlined />}
          style={{
            height: 48,
            padding: "0 24px",
            fontWeight: 600,
            border: `1px solid ${addAlpha("#f59e0b", 0.3)}`,
            background: addAlpha("#f59e0b", 0.05),
            color: "#f59e0b",
          }}
        >
          {TRANSLATION("bypass_page.view_sale_ranking")}
        </Button>
      </Space>
    </div>
  );
};
export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state, handlers } = useBypassPageData();
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);
  const [bypassModal, setBypassModal] = useState<{
    open: boolean;
    school: SchoolDetail | null;
  }>({
    open: false,
    school: null,
  });

  // * Calculate Province Ranking Data Memoized
  const provinceStatistics = useMemo<ProvinceStatistics[]>(
    () => calculateProvinceStatistics(state.filteredSchools),
    [state.filteredSchools]
  );

  // * Calculate Sale Ranking Data Memoized
  const saleStatistics = useMemo<SaleStatistics[]>(
    () => calculateSaleStatistics(state.filteredSchools),
    [state.filteredSchools]
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* 1. Header Section */}
        <HeaderSection
          TRANSLATION={TRANSLATION}
          onProvinceRanking={() => setShowProvinceRanking(true)}
          onSaleRanking={() => setShowSaleRanking(true)}
        />

        {/* 2. Summary Statistics Cards */}
        <Row gutter={[20, 20]} className="mb-8">
          {[
            {
              label: "โรงเรียนทั้งหมด",
              value: state.statistics.total,
              color: token.colorPrimary,
              icon: <BankOutlined />,
              desc: "จำนวนโรงเรียน",
            },
            {
              label: "ใช้งานอยู่",
              value: state.statistics.active,
              color: token.colorSuccess,
              icon: <ThunderboltOutlined />,
              desc: "ออนไลน์ปกติ",
            },
            {
              label: "ไม่ได้ใช้งาน",
              value: state.statistics.inactive,
              color: token.colorError,
              icon: <CloseCircleOutlined />,
              desc: "ควรตรวจสอบ",
            },
            {
              label: "เกรด A (ดีเยี่ยม)",
              value: state.statistics.gradeA,
              color: token.colorWarning,
              icon: <TrophyOutlined />,
              desc: "ประสิทธิภาพสูง",
            },
          ].map((m, idx) => (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <div
                className="p-6 rounded-2xl border border-solid h-full transition-all group overflow-hidden relative"
                style={{
                  background: token.colorBgContainer,
                  borderColor: addAlpha(m.color, 0.2),
                }}
              >
                <div
                  className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
                  style={{ fontSize: "100px", color: m.color }}
                >
                  {m.icon}
                </div>

                <Flex vertical gap={12} className="relative z-10">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                    style={{
                      backgroundColor: addAlpha(
                        m.color,
                        token.colorBgBase !== "#ffffff" ? 0.2 : 0.1
                      ),
                      color: m.color,
                    }}
                  >
                    {m.icon}
                  </div>

                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: addAlpha(token.colorTextSecondary, 0.8),
                      }}
                    >
                      {m.label}
                    </Text>
                    <div className="flex items-baseline gap-2 mt-1">
                      <Title
                        level={2}
                        style={{ margin: 0, fontWeight: 900, fontSize: 32 }}
                      >
                        {m.value.toLocaleString()}
                      </Title>
                    </div>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 12, opacity: 0.7 }}
                    >
                      {m.desc}
                    </Typography.Text>
                  </div>
                </Flex>
              </div>
            </Col>
          ))}
        </Row>

        {/* 3. Filters Section */}
        <div
          className="p-8 rounded-[32px] border border-solid mb-8"
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
          }}
        >
          <Flex align="center" gap={12} className="mb-6">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: addAlpha(token.colorPrimary, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.colorPrimary,
              }}
            >
              <FilterOutlined style={{ fontSize: 16 }} />
            </div>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              ค้นหาและกรองข้อมูล
            </Typography.Title>
          </Flex>

          <FiltersSection
            filters={state.filters}
            filterOptions={state.filterOptions}
            onFilterChange={handlers.handleFilterChange}
            onClearFilters={handlers.handleClearFilters}
          />
        </div>

        {/* 4. Main Table Section */}
        <div
          className="rounded-[32px] border border-solid overflow-hidden"
          style={{
            borderColor: token.colorBorderSecondary,
            background: token.colorBgContainer,
          }}
        >
          <div
            className="px-8 py-6 border-b border-solid flex items-center justify-between"
            style={{ borderColor: token.colorBorderSecondary }}
          >
            <Space size={12}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: addAlpha(token.colorInfo, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: token.colorInfo,
                }}
              >
                <TableOutlined style={{ fontSize: 18 }} />
              </div>
              <Typography.Title
                level={4}
                style={{ margin: 0, fontWeight: 700 }}
              >
                รายชื่อโรงเรียนในระบบ
              </Typography.Title>
              {!state.loading && (
                <Badge
                  count={state.filteredSchools.length}
                  overflowCount={9999}
                  showZero
                  style={{
                    backgroundColor: token.colorSuccess,
                    fontWeight: 700,
                    border: "none",
                  }}
                />
              )}
            </Space>
          </div>

          <div className="p-0">
            <SchoolTableSection
              dataSource={state.filteredSchools}
              loading={state.loading}
              pageSize={state.pageSize}
              onTableChange={handlers.handleTableChange}
              onOpenBypassModal={(school) =>
                setBypassModal({ open: true, school })
              }
            />
          </div>
        </div>

        {/* Hidden Rankings Modals */}
        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => setShowProvinceRanking(false)}
          data={provinceStatistics}
        />
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => setShowSaleRanking(false)}
          data={saleStatistics}
        />

        <BypassSelectionModal
          open={bypassModal.open}
          school={bypassModal.school}
          onClose={() => setBypassModal({ open: false, school: null })}
          onSelect={(targetKey, envKey) => {
            if (bypassModal.school) {
              void handlers.handleBypassClick(
                `${targetKey}|${envKey}`,
                bypassModal.school
              );
              setBypassModal({ open: false, school: null });
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
