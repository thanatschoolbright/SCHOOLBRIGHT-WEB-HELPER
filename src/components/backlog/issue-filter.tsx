"use client";

import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import type { Dayjs } from "dayjs";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetFilters, setFilters } from "@stores/reducers/issues-slice";
import { RootState } from "@stores/store";

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
  } = useSelector((state: RootState) => state.issues);
  const { keyword, statusIds, priorityIds, issueTypeIds, dateRange } = filters;

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

  const handleDateRangeChange: RangePickerProps["onChange"] = (range) => {
    const normalizedRange: DateRangeValue =
      range && Array.isArray(range) && range.length === 2 ? range : null;
    dispatch(setFilters({ dateRange: normalizedRange }));
  };

  const handleReset = () => {
    dispatch(resetFilters());
    onSearch();
  };

  const wideFilterItemStyle: React.CSSProperties = {
    flex: "1 1 320px",
    minWidth: 280,
  };

  return (
    <Card
      size="small"
      styles={{
        body: {
          padding: 16,
        },
      }}
      style={elevatedCardStyle}
      title="ตัวกรองข้อมูล"
    >
      <Skeleton
        active
        loading={optionsLoading}
        paragraph={{ rows: 4 }}
        title={false}
      >
        <Tabs
          defaultActiveKey="primary"
          items={[
            {
              key: "primary",
              label: "ตัวกรองหลัก",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Space size={12} style={{ width: "100%" }} wrap>
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ flex: "1 1 240px", minWidth: 200 }}
                    >
                      <Typography.Text type="secondary">
                        คำค้นหา
                      </Typography.Text>
                      <Input
                        placeholder="ค้นหา (คีย์เวิร์ด)"
                        value={keyword}
                        onChange={handleKeywordChange}
                      />
                    </Space>
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ flex: "1 1 260px", minWidth: 240 }}
                    >
                      <Typography.Text type="secondary">สถานะ</Typography.Text>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="เลือกสถานะ"
                        value={statusIds}
                        onChange={handleStatusChange}
                        options={statusOptions}
                      />
                    </Space>
                    <Space
                      direction="vertical"
                      size={6}
                      style={wideFilterItemStyle}
                    >
                      <Typography.Text type="secondary">
                        ความสำคัญ
                      </Typography.Text>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="เลือกความสำคัญ"
                        value={priorityIds}
                        onChange={handlePriorityChange}
                        options={priorityOptions}
                      />
                    </Space>
                  </Space>
                </Space>
              ),
            },
            {
              key: "advanced",
              label: "ตัวกรองเพิ่มเติม",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Space size={12} style={{ width: "100%" }} wrap>
                    <Space
                      direction="vertical"
                      size={6}
                      style={wideFilterItemStyle}
                    >
                      <Typography.Text type="secondary">
                        ประเภทงาน
                      </Typography.Text>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="เลือกประเภทงาน"
                        value={issueTypeIds}
                        onChange={handleIssueTypeChange}
                        options={issueTypeOptions}
                      />
                    </Space>
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ flex: "1 1 260px", minWidth: 200 }}
                    >
                      <Typography.Text type="secondary">
                        ช่วงวันที่อัปเดต
                      </Typography.Text>
                      <DatePicker.RangePicker
                        value={dateRange ?? null}
                        onChange={handleDateRangeChange}
                      />
                    </Space>
                  </Space>
                </Space>
              ),
            },
          ]}
        />
        {/* * ปุ่มล้างค่าและแสดงผล * */}
        <Space
          align="center"
          size={8}
          style={{ marginLeft: "auto", marginTop: 12 }}
        >
          <Button onClick={handleReset}>ล้างค่า</Button>
          <Button type="primary" onClick={onSearch}>
            แสดงผล
          </Button>
        </Space>
      </Skeleton>
    </Card>
  );
};

export default IssueFilter;
