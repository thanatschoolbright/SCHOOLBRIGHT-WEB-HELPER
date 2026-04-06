// ✨ Component ตัวกรองข้อมูล Project Timeline (Re-designed)
"use client";

import { categoryType as CATEGORY_TYPES } from "@/data/timesheet.category.type";
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import React, { useEffect } from "react";
import { useTimelineStore } from "../_stores/timeline-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const APPROVAL_OPTIONS = [
  { value: "pending", label: "รออนุมัติ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ปฏิเสธ" },
];

const HAS_SUB_OPTIONS = [
  { value: "true", label: "มีโครงการย่อย" },
  { value: "false", label: "ไม่มีโครงการย่อย" },
];

const FilterSection: React.FC = () => {
  const [form] = Form.useForm();
  const {
    filters,
    setFilters,
    fetchTimelineData,
    resetFilters,
    projectStatuses,
    projectList,
    groupList,
    fetchProjectList,
    fetchGroupList,
  } = useTimelineStore();

  // โหลด Dropdown data ครั้งแรก
  useEffect(() => {
    fetchProjectList();
    fetchGroupList();
  }, [fetchProjectList, fetchGroupList]);

  /**
   * ✨ ค้นหาข้อมูลตามตัวกรอง
   */
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const range = values.dateRange;

    setFilters({
      start_date: range?.[0]?.toISOString(),
      end_date: range?.[1]?.toISOString(),
      project_id: values.project_id ?? undefined,
      group_id: values.group_id ?? undefined,
      status_id: values.status_id ?? undefined,
      category_type: values.category_type ?? undefined,
      approval: values.approval ?? undefined,
      sub_status_id: values.sub_status_id ?? undefined,
      has_sub_projects:
        values.has_sub_projects === "true"
          ? true
          : values.has_sub_projects === "false"
            ? false
            : undefined,
      search: values.search || undefined,
    });

    fetchTimelineData();
  };

  /**
   * ✨ ล้างตัวกรอง
   */
  const handleReset = () => {
    form.resetFields();
    resetFilters();
    fetchTimelineData();
  };

  // นับจำนวนตัวกรองที่ active อยู่
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== "",
  ).length;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Text>
        {activeFilterCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            (กำลังใช้ {activeFilterCount} ตัวกรอง)
          </Text>
        )}
      </Space>

      <Form form={form} layout="vertical">
        {/* ── แถวที่ 1: ค้นหาชื่อ + ช่วงวันที่ ── */}
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item name="search" label="ค้นหาชื่อโครงการ">
              <Input
                placeholder="พิมพ์ชื่อโครงการ (ไทย / อังกฤษ)"
                allowClear
                onPressEnter={handleSearch}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item name="dateRange" label="ช่วงวันที่โครงการ">
              <RangePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── แถวที่ 2: Dropdown กรอง ── */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="project_id" label="โครงการ">
              <Select
                placeholder="เลือกโครงการ"
                allowClear
                showSearch
                optionFilterProp="label"
                options={projectList.map((p: any) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="group_id" label="กลุ่มโครงการ">
              <Select
                placeholder="เลือกกลุ่ม"
                allowClear
                showSearch
                optionFilterProp="label"
                options={groupList.map((g: any) => ({
                  value: g.id,
                  label: g.name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="status_id" label="สถานะโครงการ">
              <Select
                placeholder="เลือกสถานะ"
                allowClear
                options={projectStatuses.map((s: any) => ({
                  value: s.id,
                  label: s.nameTh || s.name_th,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="sub_status_id" label="สถานะโครงการย่อย">
              <Select
                placeholder="เลือกสถานะย่อย"
                allowClear
                options={projectStatuses.map((s: any) => ({
                  value: s.id,
                  label: s.nameTh || s.name_th,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── แถวที่ 3: ประเภท + การอนุมัติ + มีโครงการย่อย ── */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="category_type" label="ประเภทโครงการ">
              <Select
                placeholder="เลือกประเภท"
                allowClear
                options={CATEGORY_TYPES.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="approval" label="สถานะการอนุมัติ">
              <Select
                placeholder="เลือกสถานะอนุมัติ"
                allowClear
                options={APPROVAL_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="has_sub_projects" label="โครงการย่อย">
              <Select
                placeholder="ทั้งหมด"
                allowClear
                options={HAS_SUB_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item label=" " style={{ marginBottom: 0 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  ล้าง
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  ค้นหา
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default FilterSection;
