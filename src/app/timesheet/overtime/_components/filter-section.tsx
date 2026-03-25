"use client";

import {
  CalendarOutlined,
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
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import React from "react";
import { useOvertimeStore } from "../_state/overtime-store";

const { Text } = Typography;

const OT_STATUS = [
  { text: "รออนุมัติ", value: "pending", color: "gold" },
  { text: "อนุมัติ", value: "approved", color: "green" },
  { text: "ปฏิเสธ", value: "rejected", color: "red" },
  { text: "จ่าย OT สำเร็จ", value: "paid", color: "cyan" },
  { text: "จ่าย OT ล้มเหลว", value: "payment_failed", color: "volcano" },
];

interface FilterSectionProps {
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

/**
 * คอมโพเนนต์ส่วนตัวกรองและค้นหาข้อมูล (Filter & Search Section)
 * จัดการสถานะผ่าน Zustand Store และแสดงผลตามมาตรฐาน Ant Design V.5
 */
const FilterSection: React.FC<FilterSectionProps> = ({
  onSearch,
  isLoading,
}) => {
  const {
    filterSearchText,
    filterSelectedMonth,
    filterStatus,
    setFilterSearchText,
    setFilterSelectedMonth,
    setFilterStatus,
    resetFilters,
  } = useOvertimeStore();

  /**
   * ฟังก์ชันจัดการการค้นหาข้อมูลตามเงื่อนไขที่ระบุ
   */
  const handleSearchClick = () => {
    onSearch({
      page: 1,
      searchText: filterSearchText,
      monthValue: filterSelectedMonth,
      statusValue: filterStatus,
    });
  };

  /**
   * ฟังก์ชันล้างเงื่อนไขการกรองทั้งหมด
   */
  const handleResetClick = () => {
    resetFilters();
    onSearch({
      page: 1,
      searchText: "",
      monthValue: null,
      statusValue: null,
    });
  };

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}
    >
      <Flex vertical gap={24}>
        {/* หัวข้อตัวกรอง */}
        <Space style={{ marginBottom: 16 }}>
          <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
          <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
            ตัวกรอง
          </Text>
        </Space>

        <Row gutter={[24, 24]}>
          {/* ช่องค้นหาคำสำคัญ */}
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text strong type="secondary" style={{ fontSize: 13 }}>
                ระบุคำสำคัญในการค้นหา
              </Text>
              <Input
                placeholder="ค้นหาด้วยรหัสคำขอ หรือชื่อพนักงาน..."
                prefix={
                  <SearchOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                }
                value={filterSearchText}
                onChange={(e) => setFilterSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                style={{ height: 48, borderRadius: 12 }}
                allowClear
              />
            </Flex>
          </Col>

          {/* เลือกเดือน */}
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text strong type="secondary" style={{ fontSize: 13 }}>
                เลือกช่วงเวลาประจำเดือน
              </Text>
              <DatePicker
                picker="month"
                style={{ width: "100%", height: 48, borderRadius: 12 }}
                value={filterSelectedMonth}
                onChange={setFilterSelectedMonth}
                format="MMMM YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </Flex>
          </Col>

          {/* เลือกสถานะ */}
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text strong type="secondary" style={{ fontSize: 13 }}>
                สถานะการดำเนินการ
              </Text>
              <Select
                placeholder="ทั้งหมดที่แสดงผล..."
                style={{ width: "100%", height: 48 }}
                allowClear
                value={filterStatus}
                options={OT_STATUS.map((status) => ({
                  label: status.text,
                  value: status.value,
                }))}
                onChange={(value) => setFilterStatus(value ?? null)}
              />
            </Flex>
          </Col>
        </Row>

        {/* ปุ่มค้นหาและล้างเงื่อนไข */}
        <Flex justify="flex-end" gap={12} style={{ marginTop: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetClick}
            style={{ borderRadius: 12, height: 45, paddingInline: 24 }}
          >
            ล้างการค้นหา
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={isLoading}
            onClick={handleSearchClick}
            style={{
              borderRadius: 12,
              height: 45,
              paddingInline: 32,
              fontWeight: 600,
            }}
          >
            ค้นหา
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default FilterSection;
