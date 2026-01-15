import React from "react";
import {
  Card,
  Space,
  Button,
  Input,
  Row,
  Col,
  Select,
  theme,
  Typography,
  Flex,
} from "antd";
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

  const { token } = theme.useToken();

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={18} lg={20}>
          <Input
            size="large"
            placeholder="ค้นหาชื่อโรงเรียน, รหัสโรงเรียน, หรือจังหวัด..."
            prefix={
              <SearchOutlined style={{ color: token.colorTextQuaternary }} />
            }
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            allowClear
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} md={6} lg={4}>
          <Button
            block
            size="large"
            icon={<ClearOutlined />}
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            style={{
              borderRadius: 12,
              fontWeight: 600,
              background: hasActiveFilters
                ? token.colorErrorBg
                : token.colorBgContainer,
              color: hasActiveFilters
                ? token.colorError
                : token.colorTextDisabled,
              borderColor: hasActiveFilters
                ? token.colorErrorBorder
                : token.colorBorder,
            }}
          >
            ล้างตัวกรอง
          </Button>
        </Col>
      </Row>

      {/* Advanced Filters Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Typography.Text
            strong
            className="block mb-2 text-xs uppercase opacity-60 ml-1"
          >
            จังหวัด
          </Typography.Text>
          <Select
            className="w-full"
            placeholder="ทุกจังหวัด"
            options={filterOptions.provinces}
            value={filters.province}
            onChange={(value) => onFilterChange("province", value)}
            allowClear
            showSearch
            size="large"
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Typography.Text
            strong
            className="block mb-2 text-xs uppercase opacity-60 ml-1"
          >
            ประเภทโรงเรียน
          </Typography.Text>
          <Select
            className="w-full"
            placeholder="ทุกประเภท"
            options={filterOptions.schoolTypes}
            value={filters.schoolType}
            onChange={(value) => onFilterChange("schoolType", value)}
            allowClear
            size="large"
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Typography.Text
            strong
            className="block mb-2 text-xs uppercase opacity-60 ml-1"
          >
            กลุ่มโรงเรียน
          </Typography.Text>
          <Select
            className="w-full"
            placeholder="ทุกกลุ่ม"
            options={filterOptions.schoolGroups}
            value={filters.schoolGroup}
            onChange={(value) => onFilterChange("schoolGroup", value)}
            allowClear
            showSearch
            size="large"
            style={{ borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Typography.Text
            strong
            className="block mb-2 text-xs uppercase opacity-60 ml-1"
          >
            ระดับชั้น / สถานะ
          </Typography.Text>
          <Flex gap={8}>
            <Select
              className="flex-1"
              placeholder="เกรด"
              options={filterOptions.grades}
              value={filters.grade}
              onChange={(value) => onFilterChange("grade", value)}
              allowClear
              size="large"
              style={{ borderRadius: 12 }}
            />
            <Select
              className="flex-1"
              placeholder="สถานะ"
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
              allowClear
              size="large"
              style={{ borderRadius: 12 }}
            />
          </Flex>
        </Col>
      </Row>
    </div>
  );
}
