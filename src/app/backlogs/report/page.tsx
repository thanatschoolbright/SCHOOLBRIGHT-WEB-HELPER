"use client";

/**
 * Dashboard ระบบรายงานโปรเจ็กต์ Backlog
 * มาตรฐาน Enterprise รองรับ Light/Dark Mode
 */

import {
  BookOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  CopyOutlined,
  ExportOutlined,
  FileOutlined,
  FileTextOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  GithubOutlined,
  InboxOutlined,
  NodeIndexOutlined,
  PartitionOutlined,
  PieChartOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShareAltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  StatusModalComponent,
  StatusModalType,
} from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  Badge,
  Button,
  Card,
  Col,
  Flex,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const { Text, Title } = Typography;

/**
 * ประเภทข้อมูลโปรเจ็กต์จาก Backlog
 */
interface BacklogProject {
  id: number;
  projectKey: string;
  name: string;
  chartEnabled: boolean;
  useResolvedForChart: boolean;
  subtaskingEnabled: boolean;
  projectLeaderCanEditProjectLeader: boolean;
  useWiki: boolean;
  useDocument: boolean;
  useFileSharing: boolean;
  useWikiTreeView: boolean;
  useSubversion: boolean;
  useGit: boolean;
  useOriginalImageSizeAtWiki: boolean;
  textFormattingRule: string;
  archived: boolean;
  displayOrder: number;
  useDevAttributes: boolean;
  useParentChildIssue?: boolean;
}

export default function Page(): JSX.Element {
  const router = useRouter();
  const { token } = theme.useToken();

  // State Management
  const [space, setSpace] = useState<string>("jabjai");
  const [loading, setLoading] = useState<boolean>(false);
  const [projectsList, setProjectsList] = useState<BacklogProject[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Status Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<StatusModalType>("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  /**
   * handleFetchBacklogProjectList: ดึงข้อมูลรายการโปรเจ็กต์จากระบบ Backlog
   */
  const handleFetchBacklogProjectList = async (): Promise<void> => {
    if (!space.trim()) {
      toast.warning("กรุณากรอกชื่อ Space (โดเมนย่อย)");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<{ data: BacklogProject[] }>(
        "/api/v1/backlog/projects",
        { params: { space } },
      );

      const data = response.data?.data ?? [];
      setProjectsList(data);
      toast.success(
        `โหลดข้อมูลแสดงรายการโครงการสมบูรณ์ พบ ${data.length} รายการ`,
      );
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMsg =
        error.response?.data?.message ?? "ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่";
      toast.error(errorMsg);

      // แสดง Modal แจ้งเตือนความผิดพลาด
      setModalType("error");
      setModalTitle("เกิดข้อผิดพลาด");
      setModalMessage(errorMsg);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลครั้งแรกเมื่อหน้าจอพร้อม
  useEffect(() => {
    handleFetchBacklogProjectList();
  }, []);

  /**
   * handleNavigateToProjectIssues: เปลี่ยนเส้นทางไปยังหน้ารายการงานของโปรเจ็กต์
   */
  const handleNavigateToProjectIssues = (project: BacklogProject) => {
    router.push(
      `/backlogs/projects/${project.id}/issues?space=${encodeURIComponent(
        space,
      )}&name=${encodeURIComponent(project.name)}`,
    );
  };

  /**
   * handleCopyProjectID: คัดลอกรหัสโปรเจ็กต์ไปยังคลิปบอร์ด
   */
  const handleCopyProjectID = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    message.success("คัดลอกรหัสโปรเจ็กต์แล้ว");
  };

  /**
   * handleOpenExternalBacklog: เปิดลิงก์ไปยังเว็บ Backlog โดยตรง
   */
  const handleOpenExternalBacklog = (
    projectKey: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const url = `https://${encodeURIComponent(space)}.backlog.com/projects/${projectKey}`;
    window.open(url, "_blank");
  };

  /**
   * handleResetFilters: ล้างการตั้งค่าตัวกรองทั้งหมด
   */
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    toast.info("ล้างตัวกรองการค้นหาเรียบร้อย");
  };

  /**
   * filteredProjects: การประมวลผลข้อมูลสำหรับแสดงผลในตาราง (รองรับ Search & Filter)
   */
  const filteredProjects = useMemo(() => {
    let result = [...projectsList];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.projectKey.toLowerCase().includes(query),
      );
    }

    if (statusFilter === "active") {
      result = result.filter((p) => !p.archived);
    } else if (statusFilter === "archived") {
      result = result.filter((p) => p.archived);
    }

    // เรียงลำดับตาม displayOrder เสมอเพื่อความสอดคล้องกับหน้าเว็บ Backlog
    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [projectsList, searchQuery, statusFilter]);

  /**
   * stats: คำนวณภาพรวมจากข้อมูลดั้งเดิม (ไม่ผ่านการ Filter ตาราง)
   */
  const stats = useMemo(() => {
    const total = projectsList.length;
    const active = projectsList.filter((p) => !p.archived).length;
    const archived = projectsList.filter((p) => p.archived).length;

    return { total, active, archived };
  }, [projectsList]);

  // นิยามคอลัมน์ของตารางข้อมูลโปรเจ็กต์
  const columns: ColumnsType<BacklogProject> = [
    {
      title: "ชื่อโปรเจ็กต์",
      dataIndex: "name",
      key: "name",
      width: 280,
      fixed: "left",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontWeight: 600 }}>
            {text}
          </Text>
          <Space size={4}>
            <Tag color="blue" style={{ fontWeight: 500, margin: 0 }}>
              {record.projectKey}
            </Tag>
            <Text type="secondary" className="text-xs">
              ID: {record.id}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "ฟีเจอร์การใช้งาน (Features)",
      key: "features",
      width: 220,
      render: (_, record) => (
        <Space size={12}>
          <Tooltip
            title={record.useWiki ? "เปิดใช้งาน Wiki" : "ปิดใช้งาน Wiki"}
          >
            <BookOutlined
              style={{
                color: record.useWiki
                  ? token.colorSuccess
                  : token.colorTextQuaternary,
                fontSize: "1.1rem",
              }}
            />
          </Tooltip>
          <Tooltip
            title={record.useDocument ? "เปิดใช้งานเอกสาร" : "ปิดใช้งานเอกสาร"}
          >
            <FileOutlined
              style={{
                color: record.useDocument
                  ? token.colorSuccess
                  : token.colorTextQuaternary,
                fontSize: "1.1rem",
              }}
            />
          </Tooltip>
          <Tooltip
            title={
              record.useFileSharing ? "เปิดใช้งานแชร์ไฟล์" : "ปิดใช้งานแชร์ไฟล์"
            }
          >
            <ShareAltOutlined
              style={{
                color: record.useFileSharing
                  ? token.colorSuccess
                  : token.colorTextQuaternary,
                fontSize: "1.1rem",
              }}
            />
          </Tooltip>
          <Tooltip
            title={
              record.subtaskingEnabled
                ? "รองรับงานย่อย (Sub-tasks)"
                : "ไม่รองรับงานย่อย"
            }
          >
            <NodeIndexOutlined
              style={{
                color: record.subtaskingEnabled
                  ? token.colorSuccess
                  : token.colorTextQuaternary,
                fontSize: "1.1rem",
              }}
            />
          </Tooltip>
          {record.useParentChildIssue && (
            <Tooltip title="รองรับงานแม่-ลูก">
              <PartitionOutlined
                style={{ color: token.colorInfo, fontSize: "1.1rem" }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "เวอร์ชันคอนโทรล (VCS)",
      key: "vcs",
      width: 150,
      render: (_, record) => (
        <Space>
          {record.useGit && (
            <Tag icon={<GithubOutlined />} color="orange">
              Git
            </Tag>
          )}
          {record.useSubversion && (
            <Tag icon={<CloudOutlined />} color="cyan">
              SVN
            </Tag>
          )}
          {!record.useGit && !record.useSubversion && (
            <Text type="secondary" disable>
              ไม่มี
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "การตั้งค่า (Settings)",
      key: "settings",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Tooltip title="รูปแบบข้อความ">
              <Tag color="default">{record.textFormattingRule}</Tag>
            </Tooltip>
            {record.chartEnabled && (
              <Tooltip title="เปิดใช้งานกราฟ">
                <PieChartOutlined style={{ color: token.colorWarning }} />
              </Tooltip>
            )}
          </Space>
          {record.useResolvedForChart && (
            <Text type="secondary" style={{ fontSize: "0.75rem" }}>
              ใช้ Resolved ในการคำนวณกราฟ
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "archived",
      key: "archived",
      width: 120,
      sorter: (a, b) => Number(a.archived) - Number(b.archived),
      render: (archived) => (
        <Badge
          status={archived ? "default" : "success"}
          text={archived ? "จัดเก็บแล้ว" : "ใช้งานอยู่"}
        />
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 200,
      fixed: "right",
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="เปิดดูบนเว็บ Backlog.com">
            <Button
              icon={<ExportOutlined />}
              onClick={(e) => handleOpenExternalBacklog(record.projectKey, e)}
            />
          </Tooltip>
          <Tooltip title="คัดลอก ID">
            <Button
              icon={<CopyOutlined />}
              onClick={(e) => handleCopyProjectID(record.id, e)}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => handleNavigateToProjectIssues(record)}
          >
            ยอดงาน
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* ส่วนที่ 1: หัวเรื่องของหน้า */}
      <HeaderBar
        title="ระบบรายงานโปรเจ็กต์ (Backlog)"
        subTitle="แดชบอร์ดสรุปภาพรวมและจัดการรายการโปรเจ็กต์ทั้งหมดจากระบบ Backlog"
        icon={<ProjectOutlined />}
        color="none"
      />

      <div className="mt-6 flex w-full flex-col gap-6">
        {/* ส่วนที่ 2: ภาพรวมข้อมูล (Summary Cards) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="โปรเจ็กต์ทั้งหมด"
              value={stats.total}
              icon={<ProjectOutlined />}
              color={token.colorPrimary}
              suffix="รายการ"
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="กำลังใช้งาน (Active)"
              value={stats.active}
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              suffix="รายการ"
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="จัดเก็บแล้ว (Archived)"
              value={stats.archived}
              icon={<InboxOutlined />}
              color={token.colorTextSecondary}
              suffix="รายการ"
              isLoading={loading}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ตัวกรองข้อมูล */}
        <Card
          variant="borderless"
          className="shadow-sm"
          styles={{ body: { padding: 24 } }}
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
            {/* Input ค้นชื่อโครงการ */}
            <Col xs={24} md={12}>
              <Space direction="vertical" className="w-full" size={4}>
                <Text strong style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  ค้นหาโปรเจ็กต์
                </Text>
                <Input
                  size="large"
                  placeholder="พิมพ์ชื่อโปรเจ็กต์ หรือรหัสย่อ Key..."
                  allowClear
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextQuaternary }}
                    />
                  }
                />
              </Space>
            </Col>

            {/* Select เลือกสถานะ */}
            <Col xs={24} md={12}>
              <Space direction="vertical" className="w-full" size={4}>
                <Text strong style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  เลือกสถานะ
                </Text>
                <Select
                  size="large"
                  className="w-full"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    {
                      label: (
                        <Space>
                          <CheckCircleOutlined
                            style={{ color: token.colorSuccess }}
                          />
                          กำลังใช้งาน (Active)
                        </Space>
                      ),
                      value: "active",
                    },
                    {
                      label: (
                        <Space>
                          <InboxOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                          จัดเก็บแล้ว (Archived)
                        </Space>
                      ),
                      value: "archived",
                    },
                    {
                      label: (
                        <Space>
                          <UnorderedListOutlined
                            style={{ color: token.colorPrimary }}
                          />
                          ทั้งหมด (All)
                        </Space>
                      ),
                      value: "all",
                    },
                  ]}
                />
              </Space>
            </Col>

            {/* ส่วน Input Space (ย้ายมาไว้ใน Filter เพื่อความเป็นสัดส่วน) */}
            <Col xs={24} md={12}>
              <Space direction="vertical" className="w-full" size={4}>
                <Text strong style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  ชื่อ Space (Sub-domain)
                </Text>
                <Input
                  size="large"
                  placeholder="เช่น jabjai"
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  prefix={
                    <FolderOpenOutlined
                      style={{ color: token.colorTextQuaternary }}
                    />
                  }
                />
              </Space>
            </Col>

            <Col xs={24} md={12} className="flex flex-col justify-end">
              <Flex justify="end" gap={8}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleFetchBacklogProjectList}
                  loading={loading}
                  className="min-w-[140px]"
                >
                  ค้นหาข้อมูล
                </Button>
              </Flex>
            </Col>
          </Row>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          title={
            <Flex justify="space-between" align="center">
              <Space>
                <UnorderedListOutlined style={{ color: token.colorPrimary }} />
                <Title
                  level={5}
                  style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}
                >
                  รายการโครงการ
                </Title>
              </Space>
              <Tag color="processing" style={{ borderRadius: 12 }}>
                {filteredProjects.length} รายการ
              </Tag>
            </Flex>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 800 }}
            className="enterprise-table"
          />
        </Card>
      </div>

      {/* Modal แสดงสถานะข้อมูล */}
      <StatusModalComponent
        open={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </DashboardLayout>
  );
}
