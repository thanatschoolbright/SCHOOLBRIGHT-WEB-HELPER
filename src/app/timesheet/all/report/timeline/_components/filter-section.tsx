// ✨ Component สำหรับกรองข้อมูลในหน้า Timeline
"use client";

import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Col, DatePicker, Form, Row, Space, Typography } from "antd";
import React from "react";
import { useTimelineStore } from "../_state/timeline-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const FilterSection: React.FC = () => {
  const [form] = Form.useForm();
  const { setFilters, fetchTimelineData, resetFilters } = useTimelineStore();

  /**
   * ✨ ค้นหาข้อมูลตามตัวกรอง
   */
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const range = values.dateRange;

    setFilters({
      start_date: range?.[0]?.toISOString(),
      end_date: range?.[1]?.toISOString(),
    });

    fetchTimelineData();
  };

  /**
   * ✨ ล้างตัวกรอง
   */
  const handleReset = () => {
    form.resetFields();
    resetFilters();
    fetchTimelineData();
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Text>
      </Space>

      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item name="dateRange" label="ระยะเวลาโครงการ">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          {/* สามารถเพิ่มโครงการ Dropdown ได้ที่นี่ในอนาคต */}
        </Row>

        <Row justify="end">
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                ค้นหา
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default FilterSection;
