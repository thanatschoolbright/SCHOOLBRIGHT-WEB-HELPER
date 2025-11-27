"use client";

import React, { useState, useMemo } from "react";
import { Space, Button, Typography, Collapse } from "antd";
import { LoginOutlined, TrophyOutlined } from "@ant-design/icons";
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
  const { state, handlers } = useBypassPageData();
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);

  const provinceStatistics = useMemo<ProvinceStatistics[]>(
    () => calculateProvinceStatistics(state.filteredSchools),
    [state.filteredSchools]
  );

  const saleStatistics = useMemo<SaleStatistics[]>( // New calculation logic
    () => calculateSaleStatistics(state.filteredSchools), // Using state.filteredSchools from original
    [state.filteredSchools]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <HeaderBar
            title={TRANSLATION("bypass_page.title")}
            subTitle={TRANSLATION("bypass_page.subtitle")}
            icon={<LoginOutlined />}
            color="none"
          />
          <Space>
            {" "}
            {/* Wrap buttons in Space for consistent spacing */}
            <Button
              type="primary"
              size="large"
              icon={<TrophyOutlined />}
              onClick={() => setShowProvinceRanking(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 4px 15px 0 rgba(102, 126, 234, 0.4)",
              }}
            >
              {TRANSLATION("bypass_page.view_province_ranking")}
            </Button>
            {/* New Sale Ranking Button */}
            <Button
              type="primary"
              size="large"
              icon={<TrophyOutlined />}
              onClick={() => setShowSaleRanking(true)}
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                border: "none",
                boxShadow: "0 4px 15px 0 rgba(255, 165, 0, 0.4)",
              }}
            >
              {TRANSLATION("bypass_page.view_sale_ranking")}
            </Button>
          </Space>
        </div>

        {/* Statistics Section - Collapsed by default */}
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: "statistics",
              label: TRANSLATION("bypass_page.statistics_section"),
              children: <StatisticsSection statistics={state.statistics} />,
            },
          ]}
        />

        {/* Filters Section - Expanded by default */}
        <Collapse
          defaultActiveKey={["filters"]}
          items={[
            {
              key: "filters",
              label: TRANSLATION("bypass_page.filters_title"),
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
        />

        {/* Table Section */}
        <SchoolTableSection
          dataSource={state.filteredSchools}
          loading={state.loading}
          pageSize={state.pageSize}
          openDropdownFor={state.openDropdownFor}
          onTableChange={handlers.handleTableChange}
          onBypassClick={handlers.handleBypassClick}
          onDropdownOpenChange={handlers.handleDropdownOpenChange}
        />

        {/* Province Ranking Modal */}
        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => setShowProvinceRanking(false)}
          data={provinceStatistics}
        />
        {/* New Sale Ranking Modal */}
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => setShowSaleRanking(false)}
          data={saleStatistics}
        />
      </Space>
    </DashboardLayout>
  );
}
