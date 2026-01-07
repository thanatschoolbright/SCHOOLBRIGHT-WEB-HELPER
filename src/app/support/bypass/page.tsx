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

const { Title, Text } = Typography;

/**
 * * BypassPage Component
 * * --------------------------------------------------------------------------
 * * Displays a dashboard for managing and accessing school systems (Bypass).
 * * Features:
 * * - Summary Statistics Cards (Total, Active, Inactive, Grade A)
 * * - Filter Section for advanced searching
 * * - Dynamic Data Table for schools
 * * - Ranking Modals (Province & Sale)
 * * - Modern, Dark Mode compatible UI
 * * --------------------------------------------------------------------------
 */
export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state, handlers } = useBypassPageData();
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);

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
        {/* 1. Header Section with Enhanced Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl shadow-sm border transition-colors duration-200"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div className="flex items-center gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                }}
              >
                <LoginOutlined />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                  {TRANSLATION("bypass_page.title")}
                </Title>
                <Text type="secondary" className="text-base">
                  {TRANSLATION("bypass_page.subtitle")}
                </Text>
              </div>
            </div>

            <Space size="middle" wrap>
              <Button
                type="default"
                size="large"
                icon={<TrophyOutlined style={{ color: "#8b5cf6" }} />}
                onClick={() => setShowProvinceRanking(true)}
                className="font-semibold border-violet-200 text-violet-600 hover:!text-violet-700 hover:!border-violet-300 bg-violet-50"
              >
                {TRANSLATION("bypass_page.view_province_ranking")}
              </Button>
              <Button
                type="default"
                size="large"
                icon={<TeamOutlined style={{ color: "#f59e0b" }} />}
                onClick={() => setShowSaleRanking(true)}
                className="font-semibold border-amber-200 text-amber-600 hover:!text-amber-700 hover:!border-amber-300 bg-amber-50"
              >
                {TRANSLATION("bypass_page.view_sale_ranking")}
              </Button>
            </Space>
          </div>
        </motion.div>

        {/* 2. Modern Summary Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Row gutter={[16, 16]}>
            {/* Total Schools */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-2xl overflow-hidden relative h-full border transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer,
                }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08] pointer-events-none rotate-12"
                  style={{ color: token.colorPrimary }}
                >
                  <BankOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    className="font-semibold text-xs uppercase tracking-wider"
                  >
                    โรงเรียนทั้งหมด
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                      {state.statistics.total}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      แห่ง
                    </Text>
                  </div>
                  <div className="mt-3 w-fit px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/30">
                    Total Schools
                  </div>
                </div>
              </Card>
            </Col>

            {/* Active Schools */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-2xl overflow-hidden relative h-full border transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer,
                }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08] pointer-events-none rotate-12"
                  style={{ color: token.colorSuccess }}
                >
                  <ThunderboltOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    style={{ color: token.colorSuccess }}
                    className="font-semibold text-xs uppercase tracking-wider"
                  >
                    ใช้งานอยู่ (Active)
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorSuccess,
                      }}
                    >
                      {state.statistics.active}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      แห่ง
                    </Text>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircleOutlined /> <span>Online Systems</span>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Inactive Schools */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-2xl overflow-hidden relative h-full border transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer,
                }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08] pointer-events-none rotate-12"
                  style={{ color: token.colorError }}
                >
                  <CloseCircleOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    style={{ color: token.colorError }}
                    className="font-semibold text-xs uppercase tracking-wider"
                  >
                    ไม่ได้ใช้งาน (Inactive)
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorError,
                      }}
                    >
                      {state.statistics.inactive}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      แห่ง
                    </Text>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-rose-600">
                    <WarningOutlined /> <span>Needs Attention</span>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Grade A Schools */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-2xl overflow-hidden relative h-full border transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer,
                }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08] pointer-events-none rotate-12"
                  style={{ color: token.colorWarning }}
                >
                  <TrophyOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    style={{ color: token.colorWarning }}
                    className="font-semibold text-xs uppercase tracking-wider"
                  >
                    เกรด A (Top Tier)
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorWarning,
                      }}
                    >
                      {state.statistics.gradeA}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      แห่ง
                    </Text>
                  </div>
                  <div className="mt-3 w-fit px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30">
                    High Performance
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </motion.div>

        {/* 3. Filters Section - Clean Design (No Nested Card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div
            className="p-6 rounded-2xl shadow-sm border"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <Space className="mb-4">
              <FilterOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <span className="font-bold text-lg">ค้นหาและกรองข้อมูล</span>
            </Space>

            <FiltersSection
              filters={state.filters}
              filterOptions={state.filterOptions}
              onFilterChange={handlers.handleFilterChange}
              onClearFilters={handlers.handleClearFilters}
            />
          </div>
        </motion.div>

        {/* 4. Main Table Section - Clean Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className="rounded-2xl shadow-sm border overflow-hidden"
            style={{
              borderColor: token.colorBorderSecondary,
              background: token.colorBgContainer,
            }}
          >
            {/* Custom Table Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              <Space>
                <TableOutlined
                  style={{ color: token.colorPrimary, fontSize: 18 }}
                />
                <span className="font-bold text-lg">รายชื่อโรงเรียน</span>
                <Badge
                  count={state.filteredSchools.length}
                  overflowCount={999}
                  style={{
                    backgroundColor: token.colorPrimary,
                    boxShadow: "none",
                  }}
                />
              </Space>
            </div>

            {/* Table Content */}
            <div className="p-0">
              <SchoolTableSection
                dataSource={state.filteredSchools}
                loading={state.loading}
                pageSize={state.pageSize}
                openDropdownFor={state.openDropdownFor}
                onTableChange={handlers.handleTableChange}
                onBypassClick={handlers.handleBypassClick}
                onDropdownOpenChange={handlers.handleDropdownOpenChange}
              />
            </div>
          </div>
        </motion.div>

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
      </div>
    </DashboardLayout>
  );
}
