import {
  FilterFilled,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  InputNumber,
  Row,
  Typography,
  theme,
} from "antd";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";
import { motion } from "framer-motion";

const { Text } = Typography;

/**
 * ส่วนกรองข้อมูลสำหรับค้นหาตามรหัสโรงเรียน
 * ปรับปรุง Padding และ Margin ให้มีความโปร่งสบายตามากขึ้น
 */
export const FilterSection = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { loading, setFilterSchoolId, fetchData, resetFilters } =
    useSchoolLineGroupStore();

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
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card
        className="shadow-sm hover:shadow-md transition-shadow duration-300 border-none rounded-2xl overflow-hidden"
        styles={{
          body: { padding: "32px" },
        }}
      >
        <Flex align="center" gap={12} className="mb-8">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <FilterFilled
              style={{ fontSize: "1.1rem", color: token.colorPrimary }}
            />
          </div>
          <Flex
            vertical
            gap={2}
            style={{
              marginBottom: "1rem",
            }}
          >
            <Text strong className="text-base tracking-tight">
              ค้นหาข้อมูล
            </Text>
            <Text
              type="secondary"
              className="text-[11px] uppercase tracking-widest font-medium"
            >
              Filters & Search
            </Text>
          </Flex>
        </Flex>

        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Row gutter={32} align="bottom">
            <Col xs={24} sm={14} md={16} lg={18}>
              <Form.Item
                label={
                  <Text
                    type="secondary"
                    className="text-xs font-semibold uppercase tracking-widest ml-1 mb-1"
                  >
                    รหัสโรงเรียน (School ID)
                  </Text>
                }
                name="school_id"
                className="mb-0"
              >
                <InputNumber
                  placeholder="ค้นหาด้วยรหัสโรงเรียน เช่น 1001"
                  style={{ width: "100%" }}
                  className="h-12 rounded-xl flex items-center border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all text-sm px-2"
                  min={1}
                  controls={false}
                  prefix={<SearchOutlined className="text-slate-300 mr-2" />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10} md={8} lg={6}>
              <Flex gap={12} className="sm:mt-0 mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="flex-1 h-12 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none font-bold bg-blue-600 hover:bg-blue-500 border-none transition-all active:scale-95"
                >
                  ค้นหา
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleClear}
                  className="h-12 w-12 flex items-center justify-center rounded-xl border-slate-200 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 bg-slate-50 dark:bg-slate-800 border-none"
                />
              </Flex>
            </Col>
          </Row>
        </Form>
      </Card>
    </motion.div>
  );
};
