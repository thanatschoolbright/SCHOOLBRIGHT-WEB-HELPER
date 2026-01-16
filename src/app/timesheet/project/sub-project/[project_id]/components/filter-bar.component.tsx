import React from "react";
import { Input, Select, Button, Row, Col, Typography, Space, Flex } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FilterState } from "../types/sub-project.types";
import { ASSET_OPTIONS } from "../utils/constants";

const { Title, Text } = Typography;

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
  statuses?: any[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClear,
  statuses = [],
}) => {
  const { t } = useTranslation();

  const statusOptions = [
    { value: null, label: t("sub_project_page.all_status") },
    ...statuses
      .sort((a, b) => a.priority - b.priority)
      .map((s) => ({ label: s.nameTh, value: s.id })),
  ];

  return (
    <div
      className="mb-6 px-6 py-5 rounded-2xl shadow-sm border-0"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <Flex vertical gap={20}>
        <Flex align="center" justify="space-between" className="w-full">
          <Space align="center" size={10}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500">
              <FilterOutlined style={{ fontSize: 16 }} />
            </div>
            <Title
              level={5}
              style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3 }}
            >
              {t("sub_project_page.filter_title")}
            </Title>
          </Space>

          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={onClear}
            className="text-gray-400 hover:text-red-500 flex items-center gap-1"
          >
            {t("sub_project_page.clear_filters")}
          </Button>
        </Flex>

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <div className="flex flex-col gap-1.5">
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginLeft: 4,
                }}
              >
                ค้นหาฟีเจอร์
              </Text>
              <Input
                placeholder={t("sub_project_page.search_placeholder")}
                prefix={<SearchOutlined className="text-gray-400" />}
                value={filters.searchText}
                onChange={(e) =>
                  onFilterChange({ ...filters, searchText: e.target.value })
                }
                allowClear
                className="rounded-xl border-gray-200 hover:border-indigo-400 focus:border-indigo-500 h-11"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={7}>
            <div className="flex flex-col gap-1.5">
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginLeft: 4,
                }}
              >
                ประเภทงาน
              </Text>
              <Select
                placeholder={t("sub_project_page.all_types")}
                value={filters.assetType}
                onChange={(value) =>
                  onFilterChange({ ...filters, assetType: value })
                }
                allowClear
                className="w-full h-11 custom-select-rounded"
                dropdownStyle={{ borderRadius: "12px" }}
                options={[
                  ...ASSET_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })),
                ]}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={7}>
            <div className="flex flex-col gap-1.5">
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginLeft: 4,
                }}
              >
                สถานะล่าสุด
              </Text>
              <Select
                placeholder={t("sub_project_page.all_status")}
                value={filters.statusFilter}
                onChange={(value) =>
                  onFilterChange({ ...filters, statusFilter: value })
                }
                allowClear
                className="w-full h-11 custom-select-rounded"
                dropdownStyle={{ borderRadius: "12px" }}
                options={statusOptions.slice(1)} // Remove "All" from options since we have allowClear
              />
            </div>
          </Col>
        </Row>
      </Flex>

      <style jsx global>{`
        .custom-select-rounded .ant-select-selector {
          border-radius: 12px !important;
          border-color: #e5e7eb !important;
          display: flex !important;
          align-items: center !important;
        }
        .custom-select-rounded .ant-select-selector:hover {
          border-color: #818cf8 !important;
        }
      `}</style>
    </div>
  );
};
