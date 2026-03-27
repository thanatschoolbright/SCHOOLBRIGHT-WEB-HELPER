"use client";

import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";
import { usePMDashboardStore } from "../_state/use-pm-dashboard-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * ✨ ส่วนตัวกรองข้อมูลสำหรับหน้า PM Dashboard
 */
const FilterSection: React.FC = () => {
  const { dateRange, setDateRange, fetchDashboardData, isLoading } =
    usePMDashboardStore();

  /**
   * ล้างการค้นหาและรีเซ็ตวันที่
   */
  const handleReset = () => {
    const defaultRange: [dayjs.Dayjs, dayjs.Dayjs] = [
      dayjs().startOf("month"),
      dayjs().endOf("month"),
    ];
    setDateRange(defaultRange);
    // เรียก fetch ทันทีหลังจาก reset หรือให้ผู้กดค้นหาเองก็ได้ ตาม UX
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
          <Text strong style={{ fontSize: "1rem" }}>
            ตัวกรองข้อมูล
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary">ช่วงวันที่รายงาน</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  dates &&
                  setDateRange([
                    dates[0] as dayjs.Dayjs,
                    dates[1] as dayjs.Dayjs,
                  ])
                }
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Flex>
          </Col>
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary">กลุ่มโครงการ (เร็วๆ นี้)</Text>
              <Select
                placeholder="เลือกกลุ่มโครงการ"
                style={{ width: "100%" }}
                disabled
              >
                <Select.Option value="all">ทุกกลุ่มโครงการ</Select.Option>
              </Select>
            </Flex>
          </Col>
        </Row>

        <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={isLoading}
          >
            ล้างการค้นหา
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchDashboardData}
            loading={isLoading}
          >
            ค้นหาข้อมูล
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default FilterSection;
