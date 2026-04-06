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
import { Dayjs } from "dayjs";
import React, { useCallback } from "react";
import { useDescriptionStore } from "../_stores/description-store";

const { RangePicker } = DatePicker;
const { Text } = Typography;

/**
 * ส่วนกรองข้อมูล: ค้นหาพนักงาน, ช่วงวันที่, แผนก
 * อ่าน/เขียน state ผ่าน useDescriptionStore
 */
export const FilterSection: React.FC = () => {
  const { token } = theme.useToken();

  const keyword = useDescriptionStore((s) => s.keyword);
  const dateRange = useDescriptionStore((s) => s.dateRange);
  const departmentIds = useDescriptionStore((s) => s.departmentIds);
  const departments = useDescriptionStore((s) => s.departments);
  const loading = useDescriptionStore((s) => s.loading);
  const setKeyword = useDescriptionStore((s) => s.setKeyword);
  const setDateRange = useDescriptionStore((s) => s.setDateRange);
  const setDepartmentIds = useDescriptionStore((s) => s.setDepartmentIds);
  const resetFilters = useDescriptionStore((s) => s.resetFilters);
  const fetchDailyReport = useDescriptionStore((s) => s.fetchDailyReport);

  const responseDateRangeChange = useCallback(
    (
      range: Parameters<
        NonNullable<React.ComponentProps<typeof RangePicker>["onChange"]>
      >[0],
    ) => {
      if (range && range[0] && range[1]) {
        setDateRange([range[0] as Dayjs, range[1] as Dayjs]);
      }
    },
    [setDateRange],
  );

  return (
    <Card styles={{ body: { padding: 24 } }}>
      <Flex vertical gap={16}>
        <Space size={8}>
          <FilterOutlined
            style={{ fontSize: "1rem", color: token.colorPrimary }}
          />
          <Text strong style={{ fontSize: "1rem" }}>
            ตัวกรอง
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary">ค้นหาพนักงาน</Text>
              <Input
                placeholder="ระบุชื่อ, นามสกุล, ชื่อเล่น หรือรหัสพนักงาน"
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextPlaceholder }}
                  />
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary">ช่วงวันที่</Text>
              <RangePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={responseDateRangeChange}
                format="DD/MM/YYYY"
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary">แผนก</Text>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="เลือกแผนก"
                options={departments.map((d) => ({
                  label: d.name_th,
                  value: d.id,
                }))}
                value={departmentIds}
                onChange={setDepartmentIds}
                allowClear
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex justify="flex-end" align="flex-end" style={{ height: "100%" }}>
              <Space>
                <Button icon={<ClearOutlined />} onClick={resetFilters}>
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={fetchDailyReport}
                  loading={loading}
                >
                  ค้นหา
                </Button>
              </Space>
            </Flex>
          </Col>
        </Row>
      </Flex>
    </Card>
  );
};
