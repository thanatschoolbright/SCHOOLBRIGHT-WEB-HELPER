"use client";

import React from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Select,
  Button,
  Flex,
  Typography,
  theme,
  DatePicker,
  InputNumber,
} from "antd";
import { FilterOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { LogFilters } from "../_state/server-status.state";
import dayjs from "dayjs";

interface LogFilterSectionProps {
  onSearch: (values: LogFilters) => void;
  onReset: () => void;
  form: any;
}

/**
 * ส่วนตัวกรองข้อมูล Log (Log Filter Section)
 * กรองตาม Server, สถานะ, ช่วงวันที่ หรือจำนวนวันย้อนหลัง
 */
const LogFilterSection: React.FC<LogFilterSectionProps> = ({ onSearch, onReset, form }) => {
  const { token } = theme.useToken();

  // ✨ แปลงค่า form เป็น LogFilters ก่อนส่งออกไป
  const handleFinish = (values: any) => {
    const filters: LogFilters = {
      status: values.status ?? undefined,
      days: values.date_range ? undefined : (values.days ?? 7),
      date_from: values.date_range?.[0]
        ? dayjs(values.date_range[0]).format("YYYY-MM-DD")
        : undefined,
      date_to: values.date_range?.[1]
        ? dayjs(values.date_range[1]).format("YYYY-MM-DD")
        : undefined,
    };
    onSearch(filters);
  };

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ color: token.colorPrimary, fontSize: "1rem" }} />
        <Typography.Text style={{ fontWeight: 600, fontSize: "1rem" }}>
          ตัวกรอง
        </Typography.Text>
      </Flex>

      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ days: 7 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="status" label="สถานะการทำงาน">
              <Select
                allowClear
                placeholder="ทั้งหมด"
                options={[
                  { label: "ทำงานปกติ (Online)", value: "Online" },
                  { label: "หยุดทำงาน (Offline)", value: "Offline" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="days" label="ย้อนหลัง (วัน)">
              <InputNumber
                min={1}
                max={30}
                style={{ width: "100%" }}
                placeholder="จำนวนวันย้อนหลัง (สูงสุด 30 วัน)"
                addonAfter="วัน"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="date_range" label="หรือระบุช่วงวันที่">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>

        <Flex justify="end" gap="small" style={{ marginTop: 8 }}>
          <Button icon={<ClearOutlined />} onClick={onReset}>
            ล้างการค้นหา
          </Button>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            ค้นหาข้อมูล
          </Button>
        </Flex>
      </Form>
    </Card>
  );
};

export default LogFilterSection;
