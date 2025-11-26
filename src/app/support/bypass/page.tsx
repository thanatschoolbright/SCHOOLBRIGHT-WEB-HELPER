"use client";

import React, { useState, useMemo } from "react";
import { Space, Button } from "antd";
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

export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { state, handlers } = useBypassPageData();
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);

  const provinceStatistics = useMemo(
    () => calculateProvinceStatistics(state.filteredSchools),
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
        </div>

        {/* Statistics Section */}
        <StatisticsSection statistics={state.statistics} />

        {/* Filters Section */}
        <FiltersSection
          filters={state.filters}
          filterOptions={state.filterOptions}
          onFilterChange={handlers.handleFilterChange}
          onClearFilters={handlers.handleClearFilters}
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
      </Space>
    </DashboardLayout>
  );
}
