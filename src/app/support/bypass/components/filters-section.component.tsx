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

  /*
   * * Ensure hasActiveFilters is a boolean
   * * Fixes: Type 'string' is not assignable to type 'boolean | undefined'
   */
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.province ||
      filters.schoolType ||
      filters.grade ||
      filters.status ||
      filters.schoolGroup
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Search Input & Actions */}
      <div className="flex gap-2">
        <Input
          size="large"
          placeholder="ค้นหาโรงเรียน (ชื่อ, รหัส, จังหวัด)..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          allowClear
          className="flex-1"
        />
        <Button
          size="large"
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          type="default"
          danger={hasActiveFilters}
        >
          ล้างตัวกรอง
        </Button>
      </div>

      {/* Filter Row 1 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="จังหวัด"
            options={filterOptions.provinces}
            value={filters.province}
            onChange={(value) => onFilterChange("province", value)}
            allowClear
            showSearch
            style={{ width: "100%" }}
            size="large"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="ประเภทโรงเรียน"
            options={filterOptions.schoolTypes}
            value={filters.schoolType}
            onChange={(value) => onFilterChange("schoolType", value)}
            allowClear
            style={{ width: "100%" }}
            size="large"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="กลุ่มโรงเรียน"
            options={filterOptions.schoolGroups}
            value={filters.schoolGroup}
            onChange={(value) => onFilterChange("schoolGroup", value)}
            allowClear
            showSearch
            style={{ width: "100%" }}
            size="large"
          />
        </Col>
      </Row>

      {/* Filter Row 2 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="ระดับชั้น"
            options={filterOptions.grades}
            value={filters.grade}
            onChange={(value) => onFilterChange("grade", value)}
            allowClear
            style={{ width: "100%" }}
            size="large"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="สถานะ"
            options={[
              {
                label: "ใช้งานอยู่ (Active)",
                value: "active",
              },
              {
                label: "ไม่ได้ใช้งาน (Inactive)",
                value: "inactive",
              },
            ]}
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
            allowClear
            style={{ width: "100%" }}
            size="large"
          />
        </Col>
        {/* Empty Col for alignment if needed, or remove */}
      </Row>
    </Space>
  );
}
