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
} from "@ant-design/icons";
import { motion } from "framer-motion";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
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

export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state, handlers } = useBypassPageData();
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);

  const provinceStatistics = useMemo<ProvinceStatistics[]>(
    () => calculateProvinceStatistics(state.filteredSchools),
    [state.filteredSchools]
  );

  const saleStatistics = useMemo<SaleStatistics[]>(
    () => calculateSaleStatistics(state.filteredSchools),
    [state.filteredSchools]
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Header Section with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            variant="borderless"
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
              borderRadius: 16,
              boxShadow: `0 8px 32px ${token.colorPrimary}30`,
            }}
            styles={{ body: { padding: "32px" } }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Space align="center" size="middle">
                  <div
                    style={{
                      width: 6,
                      height: 48,
                      background: "white",
                      borderRadius: 8,
                      boxShadow: "0 0 20px rgba(255,255,255,0.5)",
                    }}
                  />
                  <div>
                    <Typography.Title
                      level={2}
                      style={{
                        margin: 0,
                        color: "white",
                        fontWeight: 700,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      🔐 {TRANSLATION("bypass_page.title")}
                    </Typography.Title>
                    <Typography.Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 16,
                      }}
                    >
                      {TRANSLATION("bypass_page.subtitle")}
                    </Typography.Text>
                  </div>
                </Space>
              </div>

              <Space size="middle" wrap>
                <Tooltip title="ดูอันดับจังหวัดที่มีโรงเรียนมากที่สุด">
                  <Button
                    type="primary"
                    size="large"
                    icon={<TrophyOutlined />}
                    onClick={() => setShowProvinceRanking(true)}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px 0 rgba(102, 126, 234, 0.4)",
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    <span className="hidden md:inline">
                      {TRANSLATION("bypass_page.view_province_ranking")}
                    </span>
                    <span className="md:hidden">จังหวัด</span>
                  </Button>
                </Tooltip>

                <Tooltip title="ดูอันดับเซลส์ที่ขายได้มากที่สุด">
                  <Button
                    type="primary"
                    size="large"
                    icon={<TeamOutlined />}
                    onClick={() => setShowSaleRanking(true)}
                    style={{
                      background:
                        "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px 0 rgba(255, 165, 0, 0.4)",
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    <span className="hidden md:inline">
                      {TRANSLATION("bypass_page.view_sale_ranking")}
                    </span>
                    <span className="md:hidden">เซลส์</span>
                  </Button>
                </Tooltip>
              </Space>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${token.colorPrimary}`,
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <TableOutlined style={{ color: token.colorPrimary }} />
                      <span>โรงเรียนทั้งหมด</span>
                    </Space>
                  }
                  value={state.statistics.total}
                  suffix="แห่ง"
                  valueStyle={{
                    color: token.colorPrimary,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${token.colorSuccess}`,
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <ThunderboltOutlined
                        style={{ color: token.colorSuccess }}
                      />
                      <span>ใช้งานอยู่</span>
                    </Space>
                  }
                  value={state.statistics.active}
                  suffix="แห่ง"
                  valueStyle={{
                    color: token.colorSuccess,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${token.colorError}`,
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <InfoCircleOutlined style={{ color: token.colorError }} />
                      <span>ไม่ได้ใช้งาน</span>
                    </Space>
                  }
                  value={state.statistics.inactive}
                  suffix="แห่ง"
                  valueStyle={{
                    color: token.colorError,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${token.colorWarning}`,
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <TrophyOutlined style={{ color: token.colorWarning }} />
                      <span>เกรด A</span>
                    </Space>
                  }
                  value={state.statistics.gradeA}
                  suffix="แห่ง"
                  valueStyle={{
                    color: token.colorWarning,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>
          </Row>
        </motion.div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <span className="font-semibold">คำแนะนำการใช้งาน</span>
              </Space>
            }
            description={
              <div className="space-y-1">
                <p className="m-0">
                  • ใช้ <strong>ตัวกรอง</strong>{" "}
                  เพื่อค้นหาโรงเรียนที่ต้องการได้อย่างรวดเร็ว
                </p>
                <p className="m-0">
                  • คลิก <strong>"เข้าสู่ระบบ"</strong>{" "}
                  เพื่อเข้าสู่ระบบโรงเรียนโดยตรง
                </p>
                <p className="m-0">
                  • ดู <strong>อันดับจังหวัด</strong> และ{" "}
                  <strong>อันดับเซลส์</strong> ได้จากปุ่มด้านบน
                </p>
              </div>
            }
            type="info"
            showIcon
            closable
            style={{ borderRadius: 12 }}
          />
        </motion.div>

        {/* Statistics Section - Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Collapse
            defaultActiveKey={[]}
            items={[
              {
                key: "statistics",
                label: (
                  <Space>
                    <BarChartOutlined style={{ color: token.colorPrimary }} />
                    <span className="font-semibold">
                      {TRANSLATION("bypass_page.statistics_section")}
                    </span>
                    <Badge
                      count="รายละเอียด"
                      style={{
                        backgroundColor: token.colorPrimaryBg,
                        color: token.colorPrimary,
                      }}
                    />
                  </Space>
                ),
                children: <StatisticsSection statistics={state.statistics} />,
              },
            ]}
            style={{
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
            }}
          />
        </motion.div>

        {/* Filters Section - Expanded by default */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Collapse
            defaultActiveKey={["filters"]}
            items={[
              {
                key: "filters",
                label: (
                  <Space>
                    <FilterOutlined style={{ color: token.colorSuccess }} />
                    <span className="font-semibold">
                      {TRANSLATION("bypass_page.filters_title")}
                    </span>
                    <Tooltip title="ใช้ตัวกรองเพื่อค้นหาโรงเรียนที่ต้องการ">
                      <InfoCircleOutlined
                        style={{ color: token.colorTextSecondary }}
                      />
                    </Tooltip>
                  </Space>
                ),
                children: (
                  <FiltersSection
                    filters={state.filters}
                    filterOptions={state.filterOptions}
                    onFilterChange={handlers.handleFilterChange}
                    onClearFilters={handlers.handleClearFilters}
                  />
                ),
              },
            ]}
            style={{
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
            }}
          />
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card
            
            title={
              <Space>
                <TableOutlined style={{ color: token.colorPrimary }} />
                <span className="font-semibold">
                  {TRANSLATION("bypass_page.table_title")}
                </span>
                <Badge
                  count={state.filteredSchools.length}
                  showZero
                  style={{
                    backgroundColor: token.colorPrimaryBg,
                    color: token.colorPrimary,
                  }}
                />
              </Space>
            }
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <SchoolTableSection
              dataSource={state.filteredSchools}
              loading={state.loading}
              pageSize={state.pageSize}
              openDropdownFor={state.openDropdownFor}
              onTableChange={handlers.handleTableChange}
              onBypassClick={handlers.handleBypassClick}
              onDropdownOpenChange={handlers.handleDropdownOpenChange}
            />
          </Card>
        </motion.div>

        {/* Province Ranking Modal */}
        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => setShowProvinceRanking(false)}
          data={provinceStatistics}
        />

        {/* Sale Ranking Modal */}
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => setShowSaleRanking(false)}
          data={saleStatistics}
        />
      </div>
    </DashboardLayout>
  );
}
