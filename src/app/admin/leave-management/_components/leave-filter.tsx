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
  Typography,
} from "antd";
import { useLeaveManagementStore } from "../_state/leave-management-store";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const LeaveFilter = () => {
  const { filters, setFilter, resetFilters, fetchData, isLoading } =
    useLeaveManagementStore();

  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid rgba(128,128,128,0.15)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
          ตัวกรอง
        </Text>
      </Flex>

      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Text
            type="secondary"
            style={{ fontSize: 13, display: "block", marginBottom: 6 }}
          >
            ค้นหาชื่อหรือรหัส
          </Text>
          <Input
            placeholder="ค้นชื่อ-นามสกุล หรือ รหัสนักเรียน"
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            onPressEnter={() => fetchData()}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text
            type="secondary"
            style={{ fontSize: 13, display: "block", marginBottom: 6 }}
          >
            ช่วงวันที่ลา
          </Text>
          <RangePicker
            style={{ width: "100%" }}
            onChange={(dates) => {
              if (dates) {
                setFilter("date_range", [
                  dates[0]?.format("YYYY-MM-DD") || "",
                  dates[1]?.format("YYYY-MM-DD") || "",
                ]);
              } else {
                setFilter("date_range", undefined);
              }
            }}
            placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
          />
        </Col>

        <Col xs={24}>
          <Flex gap={12} justify="flex-end" style={{ marginTop: 8 }}>
            <Button
              icon={<ClearOutlined />}
              onClick={resetFilters}
              disabled={isLoading}
              style={{ borderRadius: 8 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchData()}
              loading={isLoading}
              style={{
                borderRadius: 8,
                paddingLeft: 24,
                paddingRight: 24,
                fontWeight: 600,
              }}
            >
              ค้นหา
            </Button>
          </Flex>
        </Col>
      </Row>
    </Card>
  );
};
