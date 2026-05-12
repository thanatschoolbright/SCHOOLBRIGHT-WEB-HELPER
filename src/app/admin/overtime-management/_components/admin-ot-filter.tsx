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
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const OT_STATUS_OPTIONS = [
  { label: "รออนุมัติ", value: "pending" },
  { label: "อนุมัติแล้ว", value: "approved" },
  { label: "ปฏิเสธ", value: "rejected" },
  { label: "จ่ายเงินสำเร็จ", value: "paid" },
  { label: "จ่ายเงินล้มเหลว", value: "payment_failed" },
];

interface AdminOtFilterProps {
  userOptions: { label: string; value: string }[];
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

/**
 * ส่วนตัวกรองข้อมูล OT สำหรับผู้ดูแลระบบ
 * รองรับกรองตาม: ชื่อ/เลขพนักงาน, สถานะ, ผู้ใช้, ช่วงวันที่
 */
const AdminOtFilter: React.FC<AdminOtFilterProps> = ({
  userOptions,
  onSearch,
  isLoading,
}) => {
  const {
    filterSearchText,
    filterStatus,
    filterUserId,
    filterDateRange,
    setFilterSearchText,
    setFilterStatus,
    setFilterUserId,
    setFilterDateRange,
    resetFilters,
  } = useAdminOvertimeStore();

  /**
   * ส่งพารามิเตอร์การค้นหาไปยัง parent
   */
  const handleSearch = () => {
    onSearch({
      searchText: filterSearchText,
      status: filterStatus,
      userId: filterUserId,
      dateRange: filterDateRange,
      page: 1,
    });
  };

  /**
   * ล้างตัวกรองทั้งหมดและโหลดข้อมูลใหม่
   */
  const handleReset = () => {
    resetFilters();
    onSearch({ page: 1 });
  };

  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <FilterOutlined style={{ fontSize: "1rem" }} />
          <Text strong>ตัวกรองและค้นหา</Text>
        </Flex>
      }
      styles={{ body: { padding: 16 } }}
    >
      <Flex vertical gap={12}>
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ค้นหาชื่อ / รหัสพนักงาน / รหัส OT
              </Text>
              <Input
                value={filterSearchText}
                onChange={(e) => setFilterSearchText(e.target.value)}
                onPressEnter={handleSearch}
                placeholder="ค้นหา..."
                allowClear
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                สถานะ
              </Text>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="ทุกสถานะ"
                allowClear
                options={OT_STATUS_OPTIONS}
                style={{ width: "100%" }}
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                พนักงาน
              </Text>
              <Select
                value={filterUserId}
                onChange={setFilterUserId}
                placeholder="พนักงานทุกคน"
                allowClear
                showSearch
                optionFilterProp="label"
                options={userOptions}
                style={{ width: "100%" }}
              />
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ช่วงวันที่ขอ OT
              </Text>
              <RangePicker
                value={
                  filterDateRange
                    ? [dayjs(filterDateRange[0]), dayjs(filterDateRange[1])]
                    : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setFilterDateRange([
                      dates[0].startOf("day").toISOString(),
                      dates[1].endOf("day").toISOString(),
                    ]);
                  } else {
                    setFilterDateRange(null);
                  }
                }}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
              />
            </Flex>
          </Col>
        </Row>

        <Flex justify="flex-end">
          <Space>
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
              onClick={handleSearch}
              loading={isLoading}
            >
              ค้นหา
            </Button>
          </Space>
        </Flex>
      </Flex>
    </Card>
  );
};

export default AdminOtFilter;
