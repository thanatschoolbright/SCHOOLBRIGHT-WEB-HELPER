"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { MetricSummary } from "./components/MetricSummary";
import { TimelineChart } from "./components/TimelineChart";
import { ProjectEditModal } from "./components/ProjectEditModal";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function TimelinePage() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const currentAdminId = AUTHENTICATION?.response?.data?.user_data?.admin_id;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    totalSubProjects: 0,
    overdue: 0,
    completed: 0,
    inProgress: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "All",
    keyword: "",
    viewType: "all", // 'all' | 'project'
    dateRange: [dayjs().startOf("month"), dayjs().endOf("month")] as any,
  });

  // Modal State
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    type: "project" | "sub-project";
    initialValues?: any;
    parentId?: number;
  }>({
    open: false,
    mode: "create",
    type: "project",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.keyword) params.append("keyword", filters.keyword);
      // Add date range params if needed
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append("startDate", filters.dateRange[0].toISOString());
        params.append("endDate", filters.dateRange[1].toISOString());
      }

      const res = await fetch(
        `/api/v1/timesheet/project/timeline?${params.toString()}`
      );
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setMetrics(json.metrics);
      }
    } catch (error) {
      console.error("Failed to fetch timeline data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleCreateProject = () => {
    setModal({
      open: true,
      mode: "create",
      type: "project",
    });
  };

  const handleAddSubProject = (projectId: number) => {
    setModal({
      open: true,
      mode: "create",
      type: "sub-project",
      parentId: projectId,
    });
  };

  const handleItemClick = (item: any) => {
    setModal({
      open: true,
      mode: "edit",
      type: item.type,
      initialValues: item,
    });
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Enterprise Project Timeline"
          subTitle="Overview of all projects and sub-projects"
          icon={<FilterOutlined />}
          color="none"
        />

        <div className="space-y-6">
          {/* Metrics */}
          <MetricSummary metrics={metrics} loading={loading} />

          {/* Filters & Actions */}
          <Card bordered={false} className="shadow-sm">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} md={18}>
                <Space wrap>
                  <Input
                    placeholder="Search projects..."
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                    allowClear
                    onChange={(e) =>
                      setFilters({ ...filters, keyword: e.target.value })
                    }
                  />
                  <Select
                    defaultValue="All"
                    style={{ width: 150 }}
                    onChange={(val) => setFilters({ ...filters, status: val })}
                  >
                    <Option value="All">All Status</Option>
                    <Option value="open">Open</Option>
                    <Option value="close">Closed</Option>
                  </Select>
                  <Select
                    defaultValue="all"
                    style={{ width: 150 }}
                    onChange={(val) =>
                      setFilters({ ...filters, viewType: val })
                    }
                  >
                    <Option value="all">Full Detail</Option>
                    <Option value="project">Projects Only</Option>
                  </Select>
                  <RangePicker
                    style={{ width: 250 }}
                    value={filters.dateRange}
                    onChange={(dates) =>
                      setFilters({ ...filters, dateRange: dates })
                    }
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchData}
                    loading={loading}
                  />
                </Space>
              </Col>
              <Col xs={24} md={6} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleCreateProject}
                >
                  New Project
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Timeline Chart */}
          <TimelineChart
            data={data}
            onItemClick={handleItemClick}
            onAddSubProject={handleAddSubProject}
            loading={loading}
            showChildren={filters.viewType === "all"}
          />
        </div>

        {/* Edit Modal */}
        <ProjectEditModal
          open={modal.open}
          mode={modal.mode}
          type={modal.type}
          initialValues={modal.initialValues}
          parentId={modal.parentId}
          currentAdminId={currentAdminId}
          onCancel={() => setModal({ ...modal, open: false })}
          onSuccess={() => {
            setModal({ ...modal, open: false });
            fetchData();
          }}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
