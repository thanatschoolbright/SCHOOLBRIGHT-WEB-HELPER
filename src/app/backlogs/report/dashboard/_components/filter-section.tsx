"use client";

import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * ส่วนกรองข้อมูลหลักของแดชบอร์ด
 */
export const FilterSection = () => {
  const { space, setSpace, dateRange, setDateRange, fetchAnalytics, loading } =
    useBacklogDashboardStore();

  return (
    <Card variant="borderless" className="shadow-sm">
      <Space style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Text>
      </Space>

      <Row gutter={[24, 16]} align="bottom">
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ชื่อ Space (Sub-domain)
            </Text>
            <Select
              className="w-full"
              size="large"
              value={space}
              onChange={setSpace}
              options={[
                { label: "Jabjai (jabjai)", value: "jabjai" },
                {
                  label: "School Bright (schoolbright)",
                  value: "schoolbright",
                },
              ]}
            />
          </Space>
        </Col>
        <Col xs={24} md={12}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ช่วงเวลาที่ตรวจสอบ
            </Text>
            <RangePicker
              className="w-full"
              size="large"
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates: any) => setDateRange(dates)}
            />
          </Space>
        </Col>
      </Row>

      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                const store = useBacklogDashboardStore.getState();
                store.setDateRange(null);
              }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchAnalytics}
              loading={loading}
            >
              ค้นหา
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
