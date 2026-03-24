import {
  ClearOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Typography,
  theme,
} from "antd";
import { usePositionStore } from "../_state/position-store";

/**
 * ส่วนตัวกรองข้อมูลตำแหน่งงาน
 */
export const FilterSection = () => {
  const { token } = theme.useToken();
  const { search, setSearch, loadPositions } = usePositionStore();

  const handleReset = () => {
    setSearch("");
  };

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 32,
      }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <FilterOutlined
          style={{ fontSize: "1rem", color: token.colorPrimary }}
        />
        <Typography.Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Typography.Text>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Form.Item label="ค้นหาชื่อตำแหน่ง" style={{ marginBottom: 0 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="เช่น Software Engineer, Manager..."
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Form.Item>
        </Col>
      </Row>

      <Flex justify="end" gap={12} style={{ marginTop: 32 }}>
        <Button icon={<ClearOutlined />} onClick={handleReset} size="large">
          ล้างการค้นหา
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => loadPositions()}
          size="large"
        >
          ค้นหา
        </Button>
      </Flex>
    </Card>
  );
};
