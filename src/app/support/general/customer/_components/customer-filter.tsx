"use client";

import { FilterOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Input, Row, Select, Typography } from "antd";
import { useCustomerStore } from "../_stores/use-customer-store";

// ส่วน Filter สำหรับค้นหาลูกค้า — กรองตามชื่อและโรงเรียน
export default function CustomerFilter() {
  const { filters, setFilters, fetchCustomers, isLoading, companies } = useCustomerStore();

  const handleReset = () => {
    setFilters({ keyword: "", company_id: undefined, page: 1 });
    setTimeout(() => fetchCustomers(), 0);
  };

  const handleSearch = () => {
    setFilters({ page: 1 });
    fetchCustomers();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Typography.Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Typography.Text>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
            ค้นหาลูกค้า
          </Typography.Text>
          <Input
            placeholder="ชื่อ, นามสกุล, username, อีเมล, เบอร์โทร"
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleReset}
          />
        </Col>

        <Col xs={24} md={10}>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
            โรงเรียน
          </Typography.Text>
          <Select
            style={{ width: "100%" }}
            placeholder="เลือกโรงเรียน (ทั้งหมด)"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filters.company_id ?? undefined}
            onChange={(v) => setFilters({ company_id: v })}
            options={companies.map((c) => ({
              value: c.nCompany,
              label: `[${c.nCompany}] ${c.sCompany ?? "-"}`,
            }))}
          />
        </Col>

        <Col xs={24} md={4}>
          <div style={{ height: 22 }} />
          <Flex gap={8}>
            <Button icon={<ReloadOutlined />} onClick={handleReset} block>
              ล้าง
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={isLoading}
              block
            >
              ค้นหา
            </Button>
          </Flex>
        </Col>
      </Row>
    </div>
  );
}
