"use client";

import React from "react";
import { Space } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useTranslation } from "react-i18next";
import { useBypassPageData } from "./hooks/bypass.data";
import StatisticsSection from "./components/statistics-section.component";
import FiltersSection from "./components/filters-section.component";
import SchoolTableSection from "./components/school-table-section.component";

export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { state, handlers } = useBypassPageData();

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header Section */}
        <HeaderBar
          title={TRANSLATION("bypass_page.title")}
          subTitle={TRANSLATION("bypass_page.subtitle")}
          icon={<LoginOutlined />}
          color="none"
        />

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
      </Space>
    </DashboardLayout>
  );
}
