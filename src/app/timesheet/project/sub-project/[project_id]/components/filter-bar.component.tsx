import React from "react";
import { Input, Select, Button, Card, Row, Col, Typography, Space } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FilterState } from "../types/sub-project.types";
import { ASSET_OPTIONS } from "../utils/constants";

const { Title } = Typography;

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClear,
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space align="center">
          <FilterOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {t("sub_project_page.filter_title")}
          </Title>
        </Space>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              placeholder={t("sub_project_page.search_placeholder")}
              prefix={<SearchOutlined />}
              value={filters.searchText}
              onChange={(e) =>
                onFilterChange({ ...filters, searchText: e.target.value })
              }
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder={t("sub_project_page.asset_type_filter")}
              value={filters.assetType}
              onChange={(value) =>
                onFilterChange({ ...filters, assetType: value })
              }
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: null, label: t("sub_project_page.all_types") },
                ...ASSET_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder={t("sub_project_page.status_filter")}
              value={filters.statusFilter}
              onChange={(value) =>
                onFilterChange({ ...filters, statusFilter: value })
              }
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: null, label: t("sub_project_page.all_status") },
                {
                  value: "processing",
                  label: t("sub_project_page.status_in_progress"),
                },
                {
                  value: "success",
                  label: t("sub_project_page.status_completed"),
                },
                {
                  value: "default",
                  label: t("sub_project_page.status_not_started"),
                },
              ]}
            />
          </Col>
        </Row>
        <Button icon={<ClearOutlined />} onClick={onClear}>
          {t("sub_project_page.clear_filters")}
        </Button>
      </Space>
    </Card>
  );
};
