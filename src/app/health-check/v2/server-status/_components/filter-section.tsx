"use client";

import {
  ClearOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, Typography } from "antd";
import React, { useMemo } from "react";
import { useServerStatusStore } from "../_state/server-status-store";

const { Text } = Typography;

/**
 * คอมโพเนนต์สำหรับตัวกรองข้อมูล
 */
const FilterSection: React.FC = () => {
  const {
    serverHealthData,
    searchQuery,
    statusFilter,
    groupFilter,
    methodFilter,
    setSearchQuery,
    setStatusFilter,
    setGroupFilter,
    setMethodFilter,
    resetFilters,
  } = useServerStatusStore();

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(serverHealthData.map((item) => item.group || "other")),
    );
    return [
      { label: "ทุกกลุ่ม", value: "ALL" },
      ...groups.map((g) => ({
        label: g.toUpperCase().replace("-", " "),
        value: g,
      })),
    ];
  }, [serverHealthData]);

  const methodOptions = [
    { label: "ทุกโปรโตคอล", value: "ALL" },
    { label: "GET", value: "GET" },
    { label: "POST", value: "POST" },
  ];

  const statusOptions = [
    { label: "สถานะทั้งหมด", value: "ALL" },
    { label: "ปกติ (Online)", value: "ONLINE" },
    { label: "ผิดพลาด (Error)", value: "ERROR" },
  ];

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "24px",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #f0f0f0",
      }}
    >
      <Space align="center" style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", color: "#1677ff" }} />
        <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
          ตัวกรองข้อมูลสถานะ
        </Text>
      </Space>

      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            ค้นหาตามชื่อระบบ หรือ Endpoint
          </Text>
          <Input
            placeholder="เช่น school-info, /api/v1/..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: 40, borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            กรองตามกลุ่มระบบ
          </Text>
          <Select
            placeholder="เลือกกลุ่มระบบ"
            style={{ width: "100%", height: 40 }}
            options={groupOptions}
            value={groupFilter}
            onChange={setGroupFilter}
            styles={{ popup: { root: { borderRadius: 12 } } }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            กรองตามสถานะ
          </Text>
          <Select
            placeholder="เลือกสถานะ"
            style={{ width: "100%", height: 40 }}
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            styles={{ popup: { root: { borderRadius: 12 } } }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            กรองตาม HTTP Method
          </Text>
          <Select
            placeholder="เลือกโปรโตคอล"
            style={{ width: "100%", height: 40 }}
            options={methodOptions}
            value={methodFilter}
            onChange={setMethodFilter}
            styles={{ popup: { root: { borderRadius: 12 } } }}
          />
        </Col>

        <Col span={24}>
          <Flex justify="flex-end" gap={12}>
            <Button
              icon={<ClearOutlined />}
              onClick={resetFilters}
              style={{ borderRadius: 8, height: 40 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
            >
              ค้นหาข้อมูล
            </Button>
          </Flex>
        </Col>
      </Row>
    </div>
  );
};

export default FilterSection;
