import React from "react";
import { Card, Form, Row, Col, Input, Select, Button, Flex, Typography, theme } from "antd";
import { FilterOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";

interface FilterSectionProps {
  onSearch: (values: any) => void;
  onReset: () => void;
  form: any;
}

/**
 * ส่วนตัวกรองข้อมูล (Filter Section)
 * จัดวางตามมาตรฐาน 2 column ต่อ 1 row พร้อมปุ่มควบคุมทางด้านขวา
 */
const FilterSection: React.FC<FilterSectionProps> = ({ onSearch, onReset, form }) => {
  const { token } = theme.useToken();

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

      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="ค้นหาชื่อเซิร์ฟเวอร์ / ระบบ">
              <Input
                prefix={<SearchOutlined />}
                placeholder="ระบุชื่อเซิร์ฟเวอร์ที่ต้องการค้นหา..."
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="สถานะการทำงาน"
              initialValue="all"
            >
              <Select
                options={[
                  { label: "ทั้งหมด", value: "all" },
                  { label: "ทำงานปกติ (Online)", value: "Online" },
                  { label: "หยุดทำงาน (Offline)", value: "Offline" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Flex justify="end" gap="small" style={{ marginTop: 8 }}>
          <Button icon={<ClearOutlined />} onClick={onReset}>
            ล้างการค้นหา
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
          >
            ค้นหาข้อมูล
          </Button>
        </Flex>
      </Form>
    </Card>
  );
};

export default FilterSection;
