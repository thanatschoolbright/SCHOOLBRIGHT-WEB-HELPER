"use client";

import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { useEffect } from "react";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * ส่วนกรองข้อมูลหลักของแดชบอร์ด
 * รองรับตัวกรอง: Space, ช่วงเวลา, Project, Issue Type, Priority, Status, Assignee
 */
export const FilterSection = () => {
  const {
    space,
    setSpace,
    dateRange,
    setDateRange,
    fetchAnalytics,
    loading,
    metaLoading,

    // Filter state
    selectedProjectIds,
    setSelectedProjectIds,
    selectedIssueTypeIds,
    setSelectedIssueTypeIds,
    selectedPriorityIds,
    setSelectedPriorityIds,
    selectedStatusIds,
    setSelectedStatusIds,
    selectedAssigneeIds,
    setSelectedAssigneeIds,
    resetFilters,

    // Options
    projectOptions,
    issueTypeOptions,
    priorityOptions,
    statusOptions,
    assigneeOptions,

    // Load metadata actions
    loadProjectOptions,
    loadIssueTypeOptions,
    loadPriorityOptions,
    loadStatusOptions,
    loadAssigneeOptions,
  } = useBacklogDashboardStore();

  // โหลด projects, priorities เมื่อ space เปลี่ยน
  useEffect(() => {
    loadProjectOptions();
    loadPriorityOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space]);

  // โหลด issue types และ assignees เมื่อเลือก project (เฉพาะ project แรกที่เลือก)
  useEffect(() => {
    if (selectedProjectIds.length > 0) {
      loadIssueTypeOptions(selectedProjectIds[0]);
      loadAssigneeOptions(selectedProjectIds[0]);
      loadStatusOptions(selectedProjectIds[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectIds]);

  const handleSpaceChange = (value: string) => {
    setSpace(value);
    resetFilters();
  };

  return (
    <Card variant="borderless" className="shadow-sm">
      <Space style={{ marginBottom: 16 }}>
        <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
        <Text strong style={{ fontSize: "1rem" }}>
          ตัวกรอง
        </Text>
      </Space>

      <Row gutter={[16, 16]}>
        {/* Space */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ชื่อ Space (Sub-domain)
            </Text>
            <Select
              className="w-full"
              size="large"
              value={space}
              onChange={handleSpaceChange}
              options={[
                { label: "Jabjai (jabjai)", value: "jabjai" },
                { label: "School Bright (schoolbright)", value: "schoolbright" },
              ]}
            />
          </Space>
        </Col>

        {/* Date Range */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ช่วงเวลาที่ตรวจสอบ
            </Text>
            <RangePicker
              className="w-full"
              size="large"
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates: any) => setDateRange(dates)}
            />
          </Space>
        </Col>

        {/* Project */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              โปรเจกต์ (Project)
            </Text>
            <Select
              mode="multiple"
              className="w-full"
              size="large"
              placeholder="เลือกโปรเจกต์..."
              allowClear
              showSearch
              optionFilterProp="label"
              loading={metaLoading}
              value={selectedProjectIds}
              onChange={setSelectedProjectIds}
              options={projectOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Issue Type */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ประเภท Issue (Issue Type)
            </Text>
            <Select
              mode="multiple"
              className="w-full"
              size="large"
              placeholder={selectedProjectIds.length === 0 ? "เลือกโปรเจกต์ก่อน..." : "เลือกประเภท Issue..."}
              allowClear
              disabled={selectedProjectIds.length === 0}
              loading={metaLoading}
              value={selectedIssueTypeIds}
              onChange={setSelectedIssueTypeIds}
              options={issueTypeOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Priority */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ลำดับความสำคัญ (Priority)
            </Text>
            <Select
              mode="multiple"
              className="w-full"
              size="large"
              placeholder="เลือกลำดับความสำคัญ..."
              allowClear
              loading={metaLoading}
              value={selectedPriorityIds}
              onChange={setSelectedPriorityIds}
              options={priorityOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Status */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              สถานะ (Status)
            </Text>
            <Select
              mode="multiple"
              className="w-full"
              size="large"
              placeholder="เลือกสถานะ..."
              allowClear
              loading={metaLoading}
              value={selectedStatusIds}
              onChange={setSelectedStatusIds}
              options={statusOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>

        {/* Assignee */}
        <Col xs={24} md={12} lg={8}>
          <Space direction="vertical" className="w-full" size={4}>
            <Text strong style={{ fontSize: "0.85rem" }}>
              ผู้รับผิดชอบ (Assignee)
            </Text>
            <Select
              mode="multiple"
              className="w-full"
              size="large"
              placeholder={selectedProjectIds.length === 0 ? "เลือกโปรเจกต์ก่อน..." : "เลือกพนักงาน..."}
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={selectedProjectIds.length === 0}
              loading={metaLoading}
              value={selectedAssigneeIds}
              onChange={setSelectedAssigneeIds}
              options={assigneeOptions}
              maxTagCount="responsive"
            />
          </Space>
        </Col>
      </Row>

      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={fetchAnalytics}
              loading={loading}
            >
              ค้นหา
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
