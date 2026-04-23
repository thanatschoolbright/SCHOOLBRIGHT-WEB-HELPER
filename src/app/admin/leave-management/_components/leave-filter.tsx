"use client";

import { ClearOutlined, FilterFilled, SearchOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Input, Row, Typography } from "antd";
import { useLeaveManagementStore } from "../_state/leave-management-store";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const LeaveFilter = () => {
  const { filters, setFilter, resetFilters, fetchData, isLoading } =
    useLeaveManagementStore();

  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Title
        level={5}
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FilterFilled style={{ fontSize: "1rem" }} />
        <span style={{ fontWeight: 600 }}>ตัวกรอง</span>
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>ค้นหาชื่อหรือรหัส</Text>
          <Input
            placeholder="ค้นชื่อ-นามสกุล หรือ รหัสนักเรียน"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            onPressEnter={() => fetchData()}
            allowClear
            style={{ marginTop: 8 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text strong>ช่วงวันที่ลา</Text>
          <RangePicker
            style={{ width: "100%", marginTop: 8 }}
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

        <Col
          xs={24}
          style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
        >
          <Button
            icon={<ClearOutlined />}
            onClick={resetFilters}
            disabled={isLoading}
          >
            ล้างการค้นหา
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => fetchData()}
            loading={isLoading}
          >
            ค้นหา
          </Button>
        </Col>
      </Row>
    </div>
  );
};
