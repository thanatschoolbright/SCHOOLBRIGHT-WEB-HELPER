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
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useCrmStore } from "../_state/crm-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { label: "รอดำเนินการ", value: "OPEN" },
  { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
  { label: "แก้ไขแล้ว", value: "RESOLVED" },
  { label: "ปิดเคส", value: "CLOSED" },
];

const PRIORITY_OPTIONS = [
  { label: "สูงมาก", value: "CRITICAL" },
  { label: "สูง", value: "HIGH" },
  { label: "ปานกลาง", value: "MEDIUM" },
  { label: "ต่ำ", value: "LOW" },
];

const CHANNEL_OPTIONS = [
  { label: "โทรศัพท์", value: "PHONE" },
  { label: "Line", value: "LINE" },
  { label: "อีเมล", value: "EMAIL" },
  { label: "Walk-in", value: "WALK_IN" },
];

export const FilterSection: React.FC = () => {
  const { token } = theme.useToken();
  const { setFilters, resetFilters, isLoading } = useCrmStore();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [channel, setChannel] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const handleSearch = () => {
    setFilters({
      search: search || undefined,
      status,
      priority,
      channel,
      issue_date_from: dateRange?.[0],
      issue_date_to: dateRange?.[1],
    });
  };

  const handleReset = () => {
    setSearch("");
    setStatus(undefined);
    setPriority(undefined);
    setChannel(undefined);
    setDateRange(null);
    resetFilters();
  };

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{ border: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem" }} />
        <Text style={{ fontWeight: 600, fontSize: "1rem" }}>ตัวกรอง</Text>
      </Flex>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12}>
          <Input
            placeholder="ค้นหาหัวข้อเคส, รหัสอ้างอิง, ผู้ติดต่อ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12}>
          <Select
            placeholder="สถานะเคส"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Select
            placeholder="ระดับความสำคัญ"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={setPriority}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Select
            placeholder="ช่องทางติดต่อ"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <RangePicker
            placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
            style={{ width: "100%" }}
            value={
              dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null
            }
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
            }}
          />
        </Col>
        <Col xs={24}>
          <Flex justify="flex-end" gap={8}>
            <Button
              icon={<ClearOutlined />}
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
          </Flex>
        </Col>
      </Row>
    </Card>
  );
};
