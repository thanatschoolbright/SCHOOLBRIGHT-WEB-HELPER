import React from "react";
import { Card, Space, Button, Input, Row, Col, Select } from "antd";
import {
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FilterState, FilterOptions } from "../types/bypass.types";

type FiltersSectionProps = {
  filters: FilterState;
  filterOptions: FilterOptions;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
};

export default function FiltersSection({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
}: FiltersSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const hasActiveFilters =
    filters.search ||
    filters.province ||
    filters.schoolType ||
    filters.grade ||
    filters.status ||
    filters.schoolGroup;

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          <span>{TRANSLATION("bypass_page.filters_title")}</span>
        </Space>
      }
      extra={
        <Button
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
        >
          {TRANSLATION("bypass_page.clear_filters")}
        </Button>
      }
      
      className="shadow-sm"
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Search Input */}
        <Input
          size="large"
          placeholder={TRANSLATION("bypass_page.search_placeholder")}
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          allowClear
        />

        {/* Filter Row 1 */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder={TRANSLATION("bypass_page.filter_province")}
              options={filterOptions.provinces}
              value={filters.province}
              onChange={(value) => onFilterChange("province", value)}
              allowClear
              showSearch
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder={TRANSLATION("bypass_page.filter_school_type")}
              options={filterOptions.schoolTypes}
              value={filters.schoolType}
              onChange={(value) => onFilterChange("schoolType", value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder={TRANSLATION("bypass_page.filter_school_group")}
              options={filterOptions.schoolGroups}
              value={filters.schoolGroup}
              onChange={(value) => onFilterChange("schoolGroup", value)}
              allowClear
              showSearch
              style={{ width: "100%" }}
            />
          </Col>
        </Row>

        {/* Filter Row 2 */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder={TRANSLATION("bypass_page.filter_grade")}
              options={filterOptions.grades}
              value={filters.grade}
              onChange={(value) => onFilterChange("grade", value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder={TRANSLATION("bypass_page.filter_status")}
              options={[
                {
                  label: TRANSLATION("bypass_page.status_active"),
                  value: "active",
                },
                {
                  label: TRANSLATION("bypass_page.status_inactive"),
                  value: "inactive",
                },
              ]}
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Space>
    </Card>
  );
}
