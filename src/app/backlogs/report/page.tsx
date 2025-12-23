"use client";
/**
 * 📦 Enterprise Backlog Projects Dashboard
 * Modern, enterprise-grade UI with Ant Design components
 * Features: Project cards, advanced filtering, responsive grid layout
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  Space,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Button,
  Empty,
  Input,
  Select,
  Statistic,
  Divider,
  Badge,
  Typography,
  Flex,
} from "antd";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  FileTextOutlined,
  ProjectOutlined,
  SearchOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  CopyOutlined,
  ExportOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import SpaceInputCard from "@components/backlog/space-input-card";
import type { BacklogProject } from "@components/backlog/types";

const { Text, Title } = Typography;

/**
 * 🎯 Main Component: Backlog Projects Dashboard
 * Enterprise-grade project management interface
 */
export default function Page(): JSX.Element {
  const router = useRouter();

  // State Management
  const [space, setSpace] = useState<string>("jabjai");
  const [loading, setLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<BacklogProject[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /**
   * 🚀 Fetch Projects from Backlog API
   */
  const fetchProjects = async (): Promise<void> => {
    if (!space.trim()) {
      toast.warning("กรุณากรอก Space (โดเมนย่อย)");
      return;
    }

    const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์...");
    setLoading(true);

    try {
      const { data } = await axios.get<{ data: BacklogProject[] }>(
        "/api/v1/backlog/projects",
        { params: { space } }
      );

      const projectList = data?.data ?? [];
      setProjects(projectList);
      toast.success(`โหลดสำเร็จ ${projectList.length} โปรเจ็กต์`, {
        id: toastId,
      });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message ?? "โหลดโปรเจ็กต์ไม่สำเร็จ", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * 🔍 Filtered Projects with Search & Status
   */
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.projectKey.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((p) => !p.archived);
    } else if (statusFilter === "archived") {
      result = result.filter((p) => p.archived);
    }

    return result;
  }, [projects, searchQuery, statusFilter]);

  /**
   * 📊 Statistics Calculation
   */
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => !p.archived).length;
    const archived = projects.filter((p) => p.archived).length;

    return { total, active, archived };
  }, [projects]);

  /**
   * 🎯 Navigate to Project Issues
   */
  const handleProjectClick = (project: BacklogProject) => {
    router.push(
      `/backlogs/projects/${project.id}/issues?space=${encodeURIComponent(
        space
      )}&name=${encodeURIComponent(project.name)}`
    );
  };

  /**
   * 📋 Copy Project ID to Clipboard
   */
  const handleCopyId = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    toast.success("คัดลอกรหัสโปรเจ็กต์แล้ว");
  };

  /**
   * 🔗 Open Project in Backlog
   */
  const handleOpenExternal = (projectKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://${encodeURIComponent(
      space
    )}.backlog.com/projects/${projectKey}`;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      {/* 📌 Header Section */}
      <HeaderBar
        title="Backlog Projects"
        subTitle="Enterprise Project Management Dashboard"
        icon={<ProjectOutlined />}
        color="none"
      />

      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", marginTop: 24 }}
      >
        {/* 🎛️ Control Panel: Space Input & Actions */}
        <Card style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Backlog Space
                </Text>
                <Input
                  size="large"
                  placeholder="ระบุ Space (เช่น jabjai)"
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  prefix={<FolderOpenOutlined style={{ color: "#bfbfbf" }} />}
                  disabled={loading}
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={fetchProjects}
                  loading={loading}
                >
                  โหลดโปรเจ็กต์
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 📊 Statistics Cards */}
        {projects.length > 0 && (
          <Row gutter={[16, 16]}>
            {/* Total Projects */}
            <Col xs={24} sm={8}>
              <Card
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                      Total Projects
                    </Text>
                  }
                  value={stats.total}
                  valueStyle={{ color: "#fff", fontWeight: 600 }}
                  prefix={<ProjectOutlined />}
                />
              </Card>
            </Col>

            {/* Active Projects */}
            <Col xs={24} sm={8}>
              <Card
                style={{
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                      Active Projects
                    </Text>
                  }
                  value={stats.active}
                  valueStyle={{ color: "#fff", fontWeight: 600 }}
                  prefix={<FolderOpenOutlined />}
                />
              </Card>
            </Col>

            {/* Archived Projects */}
            <Col xs={24} sm={8}>
              <Card
                style={{
                  background:
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                      Archived Projects
                    </Text>
                  }
                  value={stats.archived}
                  valueStyle={{ color: "#fff", fontWeight: 600 }}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 🔍 Filter & Search Section */}
        <Card style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
          <Row gutter={[16, 16]}>
            {/* Search Input */}
            <Col xs={24} md={16}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <SearchOutlined /> ค้นหาโปรเจ็กต์
                </Text>
                <Input
                  size="large"
                  placeholder="ค้นหาจากชื่อหรือรหัสโปรเจ็กต์..."
                  allowClear
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                />
              </Space>
            </Col>

            {/* Status Filter */}
            <Col xs={24} md={8}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <FilterOutlined /> กรองสถานะ
                </Text>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "ทั้งหมด", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Archived", value: "archived" },
                  ]}
                />
              </Space>
            </Col>
          </Row>

          {/* Filter Result Count */}
          {(searchQuery || statusFilter !== "all") && (
            <>
              <Divider style={{ margin: "16px 0" }} />
              <Text type="secondary">
                แสดง {filteredProjects.length} จาก {projects.length} โปรเจ็กต์
              </Text>
            </>
          )}
        </Card>

        {/* 🗂️ Projects Grid */}
        <Card
          style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
          title={
            <Flex justify="space-between" align="center">
              <Space>
                <FileTextOutlined />
                <Text strong>โปรเจ็กต์ทั้งหมด</Text>
                <Badge
                  count={filteredProjects.length}
                  showZero
                  style={{ backgroundColor: "#52c41a" }}
                />
              </Space>
            </Flex>
          }
        >
          {/* Loading State */}
          {loading && (
            <Row gutter={[16, 16]}>
              {[...Array(8)].map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                  <Card loading bordered />
                </Col>
              ))}
            </Row>
          )}

          {/* Projects Grid */}
          {!loading && filteredProjects.length > 0 && (
            <Row gutter={[16, 16]}>
              {filteredProjects.map((project) => (
                <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
                  {/* Project Card */}
                  <Badge.Ribbon
                    text={project.archived ? "Archived" : "Active"}
                    color={project.archived ? "default" : "green"}
                  >
                    <Card
                      hoverable
                      onClick={() => handleProjectClick(project)}
                      style={{
                        height: "100%",
                        borderRadius: 8,
                        transition: "all 0.3s ease",
                      }}
                      styles={{
                        body: { padding: 16 },
                      }}
                    >
                      {/* Project Header */}
                      <Space
                        direction="vertical"
                        size={12}
                        style={{ width: "100%" }}
                      >
                        {/* Project Name */}
                        <Tooltip title={project.name}>
                          <Title
                            level={5}
                            ellipsis={{ rows: 2 }}
                            style={{ margin: 0, minHeight: 44 }}
                          >
                            {project.name}
                          </Title>
                        </Tooltip>

                        <Divider style={{ margin: 0 }} />

                        {/* Project Info */}
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: "100%" }}
                        >
                          <Flex justify="space-between" align="center">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Project ID
                            </Text>
                            <Text strong style={{ fontSize: 12 }}>
                              {project.id}
                            </Text>
                          </Flex>

                          <Flex justify="space-between" align="center">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Project Key
                            </Text>
                            <Tag color="blue" style={{ margin: 0 }}>
                              {project.projectKey}
                            </Tag>
                          </Flex>
                        </Space>

                        <Divider style={{ margin: 0 }} />

                        {/* Action Buttons */}
                        <Flex gap={8} wrap="wrap">
                          <Button
                            type="primary"
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                            style={{ flex: 1 }}
                          >
                            Issues
                          </Button>

                          <Tooltip title="เปิดใน Backlog">
                            <Button
                              size="small"
                              icon={<ExportOutlined />}
                              onClick={(e) =>
                                handleOpenExternal(project.projectKey, e)
                              }
                            />
                          </Tooltip>

                          <Tooltip title="คัดลอก ID">
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={(e) => handleCopyId(project.id, e)}
                            />
                          </Tooltip>
                        </Flex>
                      </Space>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && projects.length > 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Text type="secondary">
                    ไม่พบโปรเจ็กต์ที่ตรงกับเงื่อนไขการค้นหา
                  </Text>
                  <Button
                    type="link"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    ล้างตัวกรอง
                  </Button>
                </Space>
              }
            />
          )}

          {/* No Projects State */}
          {!loading && projects.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Text type="secondary">ยังไม่มีโปรเจ็กต์</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    กรุณาโหลดโปรเจ็กต์จาก Backlog Space
                  </Text>
                </Space>
              }
            />
          )}
        </Card>
      </Space>
    </DashboardLayout>
  );
}
