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
  Divider,
  Flex,
  Input,
  Row,
  Select,
  theme,
  Typography,
} from "antd";

import { useUserProfileStore } from "../_stores/user-profile-store";

const { Text, Title } = Typography;

interface FilterSectionProps {
  onSearch: () => void;
}

export const FilterSection = ({ onSearch }: FilterSectionProps) => {
  const { token } = theme.useToken();
  const { filters, positions, departments, setFilters, resetFilters } =
    useUserProfileStore();

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 24,
      }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <FilterOutlined
          style={{ color: token.colorPrimary, fontSize: "1rem" }}
        />
        <Title
          level={4}
          style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}
        >
          ตัวกรอง
        </Title>
      </Flex>

      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Text
            strong
            style={{ fontSize: 13, display: "block", marginBottom: 8 }}
          >
            ค้นหาคำสำคัญ (ชื่อ, นามสกุล, รหัสพนักงาน)
          </Text>
          <Input
            prefix={
              <SearchOutlined style={{ color: token.colorTextDescription }} />
            }
            placeholder="ระบุข้อมูลที่ต้องการค้นหา..."
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text
            strong
            style={{ fontSize: 13, display: "block", marginBottom: 8 }}
          >
            ตำแหน่งงาน
          </Text>
          <Select
            placeholder="เลือกตำแหน่งงาน"
            size="large"
            allowClear
            showSearch
            className="w-full"
            optionFilterProp="label"
            value={filters.position}
            onChange={(v) => setFilters({ position: v })}
            options={(positions as { id: number; name_th: string }[]).map(
              (p) => ({
                label: p.name_th,
                value: p.id,
              }),
            )}
            style={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text
            strong
            style={{ fontSize: 13, display: "block", marginBottom: 8 }}
          >
            แผนก / ฝ่าย
          </Text>
          <Select
            placeholder="เลือกแผนก"
            size="large"
            allowClear
            showSearch
            className="w-full"
            optionFilterProp="label"
            value={filters.department}
            onChange={(v) => setFilters({ department: v })}
            options={(departments as { id: number; name_th: string }[]).map(
              (d) => ({
                label: d.name_th,
                value: d.id,
              }),
            )}
            style={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text
            strong
            style={{ fontSize: 13, display: "block", marginBottom: 8 }}
          >
            สถานะบัญชีรายชื่อ
          </Text>
          <Select
            placeholder="เลือกสถานะ"
            size="large"
            allowClear
            className="w-full"
            value={filters.status}
            onChange={(v) => setFilters({ status: v })}
            options={[
              { label: "กำลังใช้งาน", value: "ACTIVE" },
              { label: "ระงับการใช้งาน", value: "INACTIVE" },
              { label: "บัญชีที่ถูกล็อก", value: "BLOCKED" },
            ]}
            style={{ borderRadius: 8 }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <Flex justify="flex-end" gap={12}>
        <Button
          icon={<ClearOutlined />}
          type="default"
          ghost
          shape="round"
          onClick={resetFilters}
          style={{ minWidth: 120 }}
        >
          ล้างการค้นหา
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          shape="round"
          onClick={onSearch}
          style={{ minWidth: 120 }}
        >
          ค้นหาข้อมูล
        </Button>
      </Flex>
    </Card>
  );
};
