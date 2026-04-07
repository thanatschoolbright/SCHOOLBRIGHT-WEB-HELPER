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
  Divider,
  Flex,
  Input,
  Row,
  theme,
  Typography,
} from "antd";
import { Dayjs } from "dayjs";

import { useCapturableStore } from "../_state/use-capturable-store";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

export const FilterSection: React.FC = () => {
  const { token } = theme.useToken();
  const {
    searchText,
    dateRange,
    loading,
    setSearchText,
    setDateRange,
    fetchReport,
    clearFilters,
  } = useCapturableStore();

  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 16 }}
      styles={{ body: { padding: 24 } }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
        <Title level={4} style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
          ตัวกรอง
        </Title>
      </Flex>

      <Row gutter={[24, 16]}>
        <Col xs={24} lg={12}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            ค้นหาโครงการ
          </Text>
          <Input
            size="large"
            placeholder="ค้นหาด้วยรหัส หรือ ชื่อโครงการ..."
            prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} lg={12}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            ช่วงเวลาที่วิเคราะห์
          </Text>
          <RangePicker
            style={{ width: "100%" }}
            size="large"
            value={dateRange}
            onChange={(dates) =>
              dates &&
              dates[0] &&
              dates[1] &&
              setDateRange([dates[0] as Dayjs, dates[1] as Dayjs])
            }
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <Flex justify="end" gap={12}>
        <Button
          size="large"
          icon={<ClearOutlined />}
          onClick={clearFilters}
          style={{ fontWeight: 600 }}
        >
          ล้างการค้นหา
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          loading={loading}
          onClick={fetchReport}
          style={{ fontWeight: 600, padding: "0 32px" }}
        >
          วิเคราะห์ข้อมูล
        </Button>
      </Flex>
    </Card>
  );
};
