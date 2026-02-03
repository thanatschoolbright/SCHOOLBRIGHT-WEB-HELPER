import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Input, Row, Select, theme, Typography } from "antd";
import type { FilterOptions, FilterState } from "../types/bypass.types";

const { Text } = Typography;

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
  const { token } = theme.useToken();

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.province ||
    filters.schoolType ||
    filters.grade ||
    filters.status ||
    filters.schoolGroup,
  );

  return (
    <Flex vertical gap={24}>
      {/* Search & Actions Bar */}
      <Flex gap="middle" align="center" wrap="wrap">
        <Input
          size="large"
          placeholder="Search school name, code, or province..."
          prefix={
            <SearchOutlined style={{ color: token.colorTextQuaternary }} />
          }
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          allowClear
          style={{ flex: 1, minWidth: 280, borderRadius: 12 }}
        />
        <Button
          size="large"
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          style={{
            borderRadius: 12,
            minWidth: 140,
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
          Reset Filters
        </Button>
      </Flex>

      {/* Advanced Filters Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Flex vertical gap={8}>
            <Text
              strong
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                opacity: 0.5,
                paddingLeft: 4,
              }}
            >
              Province
            </Text>
            <Select
              placeholder="All Provinces"
              options={filterOptions.provinces}
              value={filters.province}
              onChange={(value) => onFilterChange("province", value)}
              allowClear
              showSearch
              size="large"
              style={{ width: "100%", borderRadius: 12 }}
            />
          </Flex>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Flex vertical gap={8}>
            <Text
              strong
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                opacity: 0.5,
                paddingLeft: 4,
              }}
            >
              School Type
            </Text>
            <Select
              placeholder="All Types"
              options={filterOptions.schoolTypes}
              value={filters.schoolType}
              onChange={(value) => onFilterChange("schoolType", value)}
              allowClear
              size="large"
              style={{ width: "100%", borderRadius: 12 }}
            />
          </Flex>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Flex vertical gap={8}>
            <Text
              strong
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                opacity: 0.5,
                paddingLeft: 4,
              }}
            >
              School Group
            </Text>
            <Select
              placeholder="All Groups"
              options={filterOptions.schoolGroups}
              value={filters.schoolGroup}
              onChange={(value) => onFilterChange("schoolGroup", value)}
              allowClear
              showSearch
              size="large"
              style={{ width: "100%", borderRadius: 12 }}
            />
          </Flex>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Flex vertical gap={8}>
            <Text
              strong
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                opacity: 0.5,
                paddingLeft: 4,
              }}
            >
              Grade / Status
            </Text>
            <Flex gap={8}>
              <Select
                placeholder="Grade"
                options={filterOptions.grades}
                value={filters.grade}
                onChange={(value) => onFilterChange("grade", value)}
                allowClear
                size="large"
                style={{ flex: 1, borderRadius: 12 }}
              />
              <Select
                placeholder="Status"
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                value={filters.status}
                onChange={(value) => onFilterChange("status", value)}
                allowClear
                size="large"
                style={{ flex: 1, borderRadius: 12 }}
              />
            </Flex>
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
}
