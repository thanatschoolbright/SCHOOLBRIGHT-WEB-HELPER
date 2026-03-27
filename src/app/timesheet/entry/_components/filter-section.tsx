"use client";

import {
  ClearOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Row,
  Select,
  theme,
  Typography,
} from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface FilterSectionProps {
  /** รายชื่อโครงการสำหรับ Select */
  projects: any[];
  /** สถานะการโหลดโครงการ */
  projectsLoading: boolean;
  /** ฟังก์ชันเมื่อกดค้นหา */
  onSearch: (values: any) => void;
  /** ฟังก์ชันเมื่อกดล้างตัวกรอง */
  onReset: () => void;
  /** สถานะการโหลดข้อมูลในตาราง เพื่อ Disable ปุ่ม */
  loading?: boolean;
}

/**
 * Component ส่วนตัวกรองข้อมูล (Advanced Search)
 * ตามมาตรฐาน Front-end Development Standard
 */
export const FilterSection: React.FC<FilterSectionProps> = ({
  projects,
  projectsLoading,
  onSearch,
  onReset,
  loading,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  /** ฟังก์ชันจัดการเมื่อกดปุ่มค้นหา */
  const handleSearch = () => {
    const values = form.getFieldsValue();
    onSearch(values);
  };

  /** ฟังก์ชันจัดการเมื่อกดปุ่มล้างตัวกรอง */
  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card
      variant="outlined"
      styles={{ body: { padding: 16 } }}
      style={{
        marginBottom: 24,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem" }} />
        <Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Text>
      </Flex>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        initialValues={{ status: undefined, project_id: undefined }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="project_id"
              label="โปรเจกต์ (Project)"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="เลือกโปรเจกต์เพื่อกรองข้อมูล"
                allowClear
                loading={projectsLoading}
                showSearch
                optionFilterProp="children"
                style={{ width: "100%" }}
              >
                {projects.map((p) => {
                  // ดึงชื่อชื่อโปรเจกต์จากโครงสร้างข้อมูลของ API
                  const projectName =
                    p.name ||
                    p.name_en ||
                    p.project_name_th ||
                    p.project_name_en ||
                    p.project_name ||
                    `Project #${p.id}`;

                  return (
                    <Select.Option key={p.id} value={p.id}>
                      {projectName}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="สถานะ (Status)"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="เลือกสถานะ"
                allowClear
                style={{ width: "100%" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.label_th}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Flex justify="end" gap={8} style={{ marginTop: 20 }}>
          <Button
            icon={<ClearOutlined />}
            onClick={handleReset}
            disabled={loading}
          >
            ล้างการค้นหา
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            ค้นหา
          </Button>
        </Flex>
      </Form>
    </Card>
  );
};
