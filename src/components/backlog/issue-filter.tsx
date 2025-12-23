"use client";

import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Skeleton,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Badge,
} from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import type { Dayjs } from "dayjs";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetFilters, setFilters } from "@stores/reducers/issues-slice";
import { RootState } from "@stores/store";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";

type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

interface IssueFilterProps {
  onSearch: () => void;
  elevatedCardStyle: React.CSSProperties;
}

const IssueFilter: React.FC<IssueFilterProps> = ({
  onSearch,
  elevatedCardStyle,
}) => {
  const dispatch = useDispatch();
  const {
    optionsLoading,
    filters,
    statusOptions,
    priorityOptions,
    issueTypeOptions,
    assigneeOptions,
  } = useSelector((state: RootState) => state.issues);
  const {
    keyword,
    statusIds,
    priorityIds,
    issueTypeIds,
    assigneeIds,
    dateRange,
    aiSummaryFilter,
  } = filters;

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ keyword: e.target.value }));
  };

  const handleStatusChange = (values: number[]) => {
    dispatch(setFilters({ statusIds: values }));
  };

  const handlePriorityChange = (values: number[]) => {
    dispatch(setFilters({ priorityIds: values }));
  };

  const handleIssueTypeChange = (values: number[]) => {
    dispatch(setFilters({ issueTypeIds: values }));
  };

  const handleAssigneeChange = (values: number[]) => {
    dispatch(setFilters({ assigneeIds: values }));
  };

  const handleDateRangeChange: RangePickerProps["onChange"] = (range) => {
    const normalizedRange: DateRangeValue =
      range && Array.isArray(range) && range.length === 2 ? range : null;
    dispatch(setFilters({ dateRange: normalizedRange }));
  };

  const handleAiSummaryFilterChange = (
    value: "all" | "with_ai" | "without_ai"
  ) => {
    dispatch(setFilters({ aiSummaryFilter: value }));
  };

  const handleReset = () => {
    dispatch(resetFilters());
    onSearch();
  };

  return (
    <Card
      size="small"
      styles={{
        body: {
          padding: 20,
        },
      }}
      style={{ ...elevatedCardStyle, borderRadius: 16 }}
      title={
        <Space>
          <SearchOutlined />
          <span>ตัวกรองข้อมูล (Filters)</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<ClearOutlined />}
          onClick={handleReset}
          danger
        >
          ล้างค่า
        </Button>
      }
    >
      <Skeleton
        active
        loading={optionsLoading}
        paragraph={{ rows: 4 }}
        title={false}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Row 1: Keyword & Date Range */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Typography.Text type="secondary" className="block mb-1">
                คำค้นหา (Keyword)
              </Typography.Text>
              <Input
                placeholder="ค้นหา Title, Key, หรือ Description"
                value={keyword}
                onChange={handleKeywordChange}
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Typography.Text type="secondary" className="block mb-1">
                ช่วงวันที่อัปเดต (Updated Date)
              </Typography.Text>
              <DatePicker.RangePicker
                value={dateRange ?? null}
                onChange={handleDateRangeChange}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Typography.Text type="secondary" className="block mb-1">
                ผู้รับผิดชอบ (Assignee)
              </Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="เลือกผู้รับผิดชอบ"
                value={assigneeIds}
                onChange={handleAssigneeChange}
                options={assigneeOptions}
                style={{ width: "100%" }}
                maxTagCount="responsive"
              />
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} dashed />

          {/* Row 2: Status, Priority, Issue Type */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary" className="block mb-1">
                สถานะ (Status)
              </Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="เลือกสถานะ"
                value={statusIds}
                onChange={handleStatusChange}
                options={statusOptions}
                style={{ width: "100%" }}
                maxTagCount="responsive"
              />
            </Col>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary" className="block mb-1">
                ความสำคัญ (Priority)
              </Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="เลือกความสำคัญ"
                value={priorityIds}
                onChange={handlePriorityChange}
                options={priorityOptions}
                style={{ width: "100%" }}
                maxTagCount="responsive"
              />
            </Col>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary" className="block mb-1">
                ประเภทงาน (Issue Type)
              </Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="เลือกประเภทงาน"
                value={issueTypeIds}
                onChange={handleIssueTypeChange}
                options={issueTypeOptions}
                style={{ width: "100%" }}
                maxTagCount="responsive"
              />
            </Col>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary" className="block mb-1">
                สถานะ AI Summary <Badge count="ใหม่" color="#52c41a" />
              </Typography.Text>
              <Select
                value={aiSummaryFilter}
                onChange={handleAiSummaryFilterChange}
                style={{ width: "100%" }}
                options={[
                  { label: "ทั้งหมด", value: "all" },
                  { label: "มี AI Summary", value: "with_ai" },
                  { label: "ไม่มี AI Summary", value: "without_ai" },
                ]}
              />
            </Col>
          </Row>

          {/* Action Buttons */}
          <Row justify="end" style={{ marginTop: 8 }}>
            <Col>
              <Button
                type="primary"
                onClick={onSearch}
                icon={<SearchOutlined />}
                size="large"
                style={{ minWidth: 120 }}
              >
                ค้นหา (Search)
              </Button>
            </Col>
          </Row>
        </Space>
      </Skeleton>
    </Card>
  );
};

export default IssueFilter;
