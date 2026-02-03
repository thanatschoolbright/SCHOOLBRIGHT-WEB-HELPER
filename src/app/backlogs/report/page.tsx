"use client";
/**
 * 📦 Enterprise Backlog Projects Dashboard (Thai Version)
 * Styled with Tailwind CSS & Ant Design Theme
 */

import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CheckCircleOutlined,
  CopyOutlined,
  ExportOutlined,
  FileTextOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { BacklogProject } from "@components/backlog/types";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";

const { Text, Title } = Typography;

export default function Page(): JSX.Element {
  const router = useRouter();

  // State Management
  const [space, setSpace] = useState<string>("jabjai");
  const [loading, setLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<BacklogProject[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  /**
   * 🚀 Fetch Projects from Backlog API
   */
  const fetchProjects = async (): Promise<void> => {
    if (!space.trim()) {
      toast.warning("กรุณากรอกชื่อ Space (โดเมนย่อย)");
      return;
    }

    const toastId = toast.loading("กำลังเชื่อมต่อระบบ Backlog...");
    setLoading(true);

    try {
      const { data } = await axios.get<{ data: BacklogProject[] }>(
        "/api/v1/backlog/projects",
        { params: { space } },
      );

      const projectList = data?.data ?? [];
      setProjects(projectList);
      toast.success(`โหลดข้อมูลสำเร็จ พบ ${projectList.length} โปรเจ็กต์`, {
        id: toastId,
      });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(
        error.response?.data?.message ?? "ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่",
        {
          id: toastId,
        },
      );
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
          p.projectKey.toLowerCase().includes(query),
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
        space,
      )}&name=${encodeURIComponent(project.name)}`,
    );
  };

  /**
   * 📋 Copy Project ID to Clipboard
   */
  const handleCopyId = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    message.success("คัดลอกรหัสโปรเจ็กต์แล้ว");
  };

  /**
   * 🔗 Open Project in Backlog
   */
  const handleOpenExternal = (projectKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://${encodeURIComponent(
      space,
    )}.backlog.com/projects/${projectKey}`;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      {/* 📌 Header Section */}
      <HeaderBar
        title="ระบบจัดการโปรเจ็กต์ (Backlog)"
        subTitle="แดชบอร์ดสำหรับดูภาพรวมและเลือกโปรเจ็กต์เพื่อจัดการงาน (Issues)"
        icon={<ProjectOutlined />}
        color="none"
      />

      <div className="mt-6 flex w-full flex-col gap-6">
        {/* 🎛️ Control Panel: Space Input & Actions */}
        <Card className="hidden shadow-sm" variant="borderless">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <div className="flex w-full flex-col gap-1">
                <Text type="secondary" className="text-xs">
                  ชื่อ Space (Sub-domain)
                </Text>
                <Input
                  size="large"
                  placeholder="เช่น jabjai (ไม่ต้องใส่ .backlog.com)"
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  prefix={<FolderOpenOutlined className="text-gray-400" />}
                  disabled={loading}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="flex w-full justify-end">
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={fetchProjects}
                  loading={loading}
                  className="min-w-[120px]"
                >
                  โหลดข้อมูลใหม่
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 📊 Statistics Cards */}
        {projects.length > 0 && (
          <Row gutter={[16, 16]}>
            {/* Total Projects */}
            <Col xs={24} sm={8}>
              <Card variant="borderless" className="shadow-sm">
                <Statistic
                  title={<Text type="secondary">โปรเจ็กต์ทั้งหมด</Text>}
                  value={stats.total}
                  valueStyle={{ fontWeight: 700 }}
                  prefix={<ProjectOutlined />}
                  suffix="รายการ"
                />
              </Card>
            </Col>

            {/* Active Projects */}
            <Col xs={24} sm={8}>
              <Card variant="borderless" className="shadow-sm">
                <Statistic
                  title={<Text type="secondary">กำลังใช้งาน (Active)</Text>}
                  value={stats.active}
                  valueStyle={{ fontWeight: 700 }}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  suffix="รายการ"
                />
              </Card>
            </Col>

            {/* Archived Projects */}
            <Col xs={24} sm={8}>
              <Card variant="borderless" className="shadow-sm">
                <Statistic
                  title={<Text type="secondary">จัดเก็บแล้ว (Archived)</Text>}
                  value={stats.archived}
                  valueStyle={{ fontWeight: 700 }}
                  prefix={<InboxOutlined className="text-gray-400" />}
                  suffix="รายการ"
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 🔍 Filter & Search Section */}
        <Card variant="borderless" className="shadow-sm">
          <Row gutter={[16, 16]}>
            {/* Search Input */}
            <Col xs={24} md={16}>
              <div className="flex w-full flex-col gap-1">
                <Text strong className="text-sm">
                  <SearchOutlined /> ค้นหาโปรเจ็กต์
                </Text>
                <Input
                  size="large"
                  placeholder="พิมพ์ชื่อโปรเจ็กต์ หรือรหัสย่อ (Key)..."
                  allowClear
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined className="text-gray-400" />}
                />
              </div>
            </Col>

            {/* Status Filter */}
            <Col xs={24} md={8}>
              <div className="flex w-full flex-col gap-1">
                <Text strong className="text-sm">
                  <FilterOutlined /> เลือกสถานะ
                </Text>
                <Select
                  size="large"
                  className="w-full"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "✅ กำลังใช้งาน (Active)", value: "active" },
                    { label: "📦 จัดเก็บแล้ว (Archived)", value: "archived" },
                    { label: "📋 ทั้งหมด (All)", value: "all" },
                  ]}
                />
              </div>
            </Col>
          </Row>

          {/* Filter Result Count */}
          {(searchQuery || statusFilter !== "all") && (
            <>
              <Divider className="my-4" />
              <Text type="secondary">
                🔍 ผลลัพธ์การค้นหา: พบ <b>{filteredProjects.length}</b>{" "}
                จากทั้งหมด {projects.length} โปรเจ็กต์
              </Text>
            </>
          )}
        </Card>

        {/* 🗂️ Projects Grid */}
        <Card
          variant="borderless"
          className="shadow-sm"
          title={
            <Flex justify="space-between" align="center">
              <Space>
                <ProjectOutlined />
                <Title level={5} className="!m-0">
                  รายชื่อโปรเจ็กต์
                </Title>
              </Space>
              <Tag color="blue">{filteredProjects.length} รายการ</Tag>
            </Flex>
          }
        >
          {/* Loading State */}
          {loading && (
            <Row gutter={[16, 16]}>
              {[...Array(8)].map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                  <Card loading variant="borderless" />
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
                    text={project.archived ? "จัดเก็บแล้ว" : "ใช้งานอยู่"}
                    color={project.archived ? "default" : "green"}
                    placement="end" // ✅ ย้าย Ribbon ไปด้านขวา
                  >
                    <Card
                      hoverable
                      onClick={() => handleProjectClick(project)}
                      // ✅ ลบ border border-gray-100 ออก ให้เหลือแต่ shadow
                      className="h-full overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md"
                      styles={{
                        body: { padding: "24px 16px 16px 16px" },
                      }}
                    >
                      {/* Project Header */}
                      <div className="flex w-full flex-col gap-3">
                        {/* Project Name */}
                        <Tooltip title={`ชื่อเต็ม: ${project.name}`}>
                          <Title
                            level={5}
                            ellipsis={{ rows: 2 }}
                            className="!m-0 min-h-[48px] pr-6" // เพิ่ม padding right กันทับ Ribbon
                          >
                            {project.name}
                          </Title>
                        </Tooltip>

                        <Divider className="!my-1" />

                        {/* Project Info Block */}
                        <div className="flex w-full flex-col gap-1 rounded-md bg-gray-50 p-2 dark:bg-white/5">
                          <Flex justify="space-between" align="center">
                            <Text type="secondary" className="text-xs">
                              รหัสย่อ (Key)
                            </Text>
                            <Tag className="!m-0 font-medium">
                              {project.projectKey}
                            </Tag>
                          </Flex>

                          <Flex justify="space-between" align="center">
                            <Text type="secondary" className="text-xs">
                              System ID
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {project.id}
                            </Text>
                          </Flex>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2 flex w-full flex-col gap-2">
                          <Button
                            type="primary"
                            block
                            icon={<FileTextOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                          >
                            ดูงาน (Issues)
                          </Button>

                          <div className="flex gap-2">
                            <Tooltip title="เปิดดูบนเว็บ Backlog.com">
                              <Button
                                size="small"
                                block
                                icon={<ExportOutlined />}
                                onClick={(e) =>
                                  handleOpenExternal(project.projectKey, e)
                                }
                              >
                                เปิดเว็บ
                              </Button>
                            </Tooltip>

                            <Tooltip title="คัดลอก ID">
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={(e) => handleCopyId(project.id, e)}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      </div>
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
                <div className="flex flex-col items-center gap-2">
                  <Text type="secondary" strong>
                    ไม่พบโปรเจ็กต์ที่ค้นหา
                  </Text>
                  <Text type="secondary" className="text-xs">
                    ลองตรวจสอบคำค้นหา หรือเปลี่ยนสถานะตัวกรอง
                  </Text>
                  <Button
                    type="dashed"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    ล้างตัวกรองทั้งหมด
                  </Button>
                </div>
              }
            />
          )}

          {/* No Projects State */}
          {!loading && projects.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="flex flex-col gap-1">
                  <Text type="secondary">ยังไม่มีข้อมูลโปรเจ็กต์</Text>
                  <Text type="secondary" className="text-xs">
                    กรุณากดปุ่ม "โหลดข้อมูลใหม่" ด้านบน
                  </Text>
                </div>
              }
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
