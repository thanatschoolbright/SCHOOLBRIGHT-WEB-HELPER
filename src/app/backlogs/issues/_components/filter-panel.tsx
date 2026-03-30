"use client";

import {
  ClearOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Input,
  Row,
  Select,
  Space,
  theme,
  Typography,
} from "antd";
import type { AllIssuesFilters, IssueOption, ProjectOption } from "../_types/all-issues.types";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface FilterPanelProps {
  filters: AllIssuesFilters;
  onFilterChange: (patch: Partial<AllIssuesFilters>) => void;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
  optionsLoading: boolean;
  projectOptions: ProjectOption[];
  issueTypeOptions: IssueOption[];
  statusOptions: IssueOption[];
  priorityOptions: IssueOption[];
  assigneeOptions: IssueOption[];
  onProjectChange: (ids: number[]) => void;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onSearch,
  onReset,
  loading,
  optionsLoading,
  projectOptions,
  issueTypeOptions,
  statusOptions,
  priorityOptions,
  assigneeOptions,
  onProjectChange,
}: FilterPanelProps) {
  const { token } = theme.useToken();

  const handleProjectChange = (ids: number[]) => {
    onFilterChange({ projectIds: ids, issueTypeIds: [], statusIds: [], assigneeIds: [] });
    onProjectChange(ids);
  };

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: "transparent",
      }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ color: token.colorPrimary, fontSize: "1.25rem" }} />
        <span style={{ margin: 0, fontWeight: 600, fontSize: "1.25rem" }}>
          ตัวกรองข้อมูล
        </span>
      </Flex>

      <Row gutter={[16, 16]}>
        {/* Keyword */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>ค้นหาจากคำสำคัญ</Text>
            <Input
              placeholder="ระบุรหัสงาน หรือหัวข้องาน..."
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => onFilterChange({ keyword: e.target.value })}
              onPressEnter={onSearch}
            />
          </Space>
        </Col>

        {/* Project */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>โปรเจกต์</Text>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกโปรเจกต์..."
              allowClear
              showSearch
              optionFilterProp="label"
              loading={optionsLoading}
              value={filters.projectIds}
              onChange={handleProjectChange}
              options={projectOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Status */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>สถานะงาน</Text>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกสถานะงาน..."
              allowClear
              loading={optionsLoading}
              value={filters.statusIds}
              onChange={(val) => onFilterChange({ statusIds: val })}
              options={statusOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Issue Type */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>ประเภทงาน (Issue Type)</Text>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกประเภทงาน..."
              allowClear
              loading={optionsLoading}
              value={filters.issueTypeIds}
              onChange={(val) => onFilterChange({ issueTypeIds: val })}
              options={issueTypeOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Priority */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>ลำดับความสำคัญ</Text>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกลำดับความสำคัญ..."
              allowClear
              loading={optionsLoading}
              value={filters.priorityIds}
              onChange={(val) => onFilterChange({ priorityIds: val })}
              options={priorityOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Assignee */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>ผู้รับผิดชอบ</Text>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกผู้รับผิดชอบ..."
              allowClear
              showSearch
              optionFilterProp="label"
              loading={optionsLoading}
              value={filters.assigneeIds}
              onChange={(val) => onFilterChange({ assigneeIds: val })}
              options={assigneeOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* AI Summary Filter */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>สถานะ AI Summary</Text>
            <Select
              className="w-full"
              value={filters.aiSummaryFilter}
              onChange={(val) => onFilterChange({ aiSummaryFilter: val })}
              options={[
                { label: "ทั้งหมด", value: "all" },
                { label: "ถูกสรุปด้วย AI แล้ว", value: "with_ai" },
                { label: "ยังไม่ถูกสรุปด้วย AI", value: "without_ai" },
              ]}
            />
          </Space>
        </Col>

        {/* Date Range */}
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong>ช่วงเวลาอัปเดต</Text>
            <RangePicker
              className="w-full"
              format="DD/MM/YYYY"
              value={filters.dateRange}
              onChange={(dates) => onFilterChange({ dateRange: dates })}
            />
          </Space>
        </Col>
      </Row>

      <Flex justify="end" gap={12} style={{ marginTop: 24 }}>
        <Button icon={<ClearOutlined />} onClick={onReset}>
          ล้างการค้นหา
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={onSearch}
          loading={loading}
        >
          ค้นหาข้อมูล
        </Button>
      </Flex>
    </Card>
  );
}
