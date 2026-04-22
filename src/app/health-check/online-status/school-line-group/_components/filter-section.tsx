import { FilterFilled, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Form, InputNumber, Row, Typography, theme } from "antd";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";

const { Text } = Typography;

/**
 * ส่วนกรองข้อมูลสำหรับค้นหาตามรหัสโรงเรียน
 */
export const FilterSection = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { loading, setFilterSchoolId, fetchData, resetFilters } = useSchoolLineGroupStore();

  /**
   * ค้นหาข้อมูลตามรหัสโรงเรียน
   */
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilterSchoolId(values.school_id ?? undefined);
    void fetchData(1);
  };

  /**
   * ล้างการค้นหา
   */
  const handleClear = () => {
    form.resetFields();
    resetFilters();
  };

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: 16 } }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterFilled
          style={{ fontSize: "1rem", color: token.colorPrimary }}
        />
        <Text strong style={{ fontSize: 14, fontWeight: 600 }}>
          ตัวกรอง
        </Text>
      </Flex>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="รหัสโรงเรียน" name="school_id">
              <InputNumber
                placeholder="เช่น 1234"
                style={{ width: "100%" }}
                min={1}
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label=" " colon={false}>
              <Flex justify="flex-end" gap={8}>
                <Button
                  icon={<FilterFilled />}
                  type="primary"
                  onClick={handleSearch}
                  loading={loading}
                >
                  ค้นหา
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleClear}>
                  ล้างการค้นหา
                </Button>
              </Flex>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};
