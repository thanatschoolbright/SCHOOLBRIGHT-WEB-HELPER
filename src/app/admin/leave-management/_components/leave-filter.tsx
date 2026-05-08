"use client";

import {
  ClearOutlined,
  FilterOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Row,
  Select,
  Typography,
} from "antd";
import { useEffect } from "react";
import { useLeaveManagementStore } from "../_state/leave-management-store";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const LeaveFilter = () => {
  const {
    filters,
    setFilter,
    resetFilters,
    fetchData,
    isLoading,
    schoolUsers,
    isLoadingUsers,
    fetchSchoolUsers,
  } = useLeaveManagementStore();

  // โหลดรายชื่อผู้ใช้งานครั้งแรก
  useEffect(() => {
    fetchSchoolUsers();
  }, [fetchSchoolUsers]);

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
            ผู้ใช้งาน
          </Text>
          <Select
            showSearch
            allowClear
            placeholder="เลือกผู้ใช้งานเพื่อดูรายการลา"
            style={{ width: "100%" }}
            loading={isLoadingUsers}
            value={filters.user_id ?? undefined}
            onChange={(value) => setFilter("user_id", value)}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            suffixIcon={<UserOutlined />}
            options={schoolUsers.map((u) => ({
              value: u.UserID,
              label: `${u.BarCode ?? ""} ${u.Name ?? ""} ${u.LastName ?? ""}`.trim() || u.username || String(u.UserID),
            }))}
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
              disabled={!filters.user_id}
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
