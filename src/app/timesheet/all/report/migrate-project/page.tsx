"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  SwapOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const { Text, Title } = Typography;

interface MigrationItem {
  id: number;
  date: string;
  hours: number;
  description: string;
  createdBy: number;
  user?: {
    firstname_th: string;
    lastname_th: string;
    nickname: string;
  };
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

export default function MigrateProjectPage() {
  const { token } = theme.useToken();

  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [sourceFeatures, setSourceFeatures] = useState<any[]>([]);
  const [targetFeatures, setTargetFeatures] = useState<any[]>([]);

  // Selection States
  const [sourceProject, setSourceProject] = useState<number | null>(null);
  const [sourceFeature, setSourceFeature] = useState<number | null>(null);
  const [targetProject, setTargetProject] = useState<number | null>(null);
  const [targetFeature, setTargetFeature] = useState<number | null>(null);

  // Migration States
  const [entries, setEntries] = useState<MigrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initial Data
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        "/api/v1/timesheet/migration?action=projects",
      );
      setProjects(res.data.data);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการได้");
    }
  };

  const fetchFeatures = async (
    projectId: number,
    setFn: (data: any[]) => void,
  ) => {
    try {
      const res = await axios.get(
        `/api/v1/timesheet/migration?action=features&projectId=${projectId}`,
      );
      setFn(res.data.data);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการย่อยได้");
    }
  };

  const fetchEntries = async () => {
    if (!sourceProject || !sourceFeature) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/timesheet/migration?action=entries&sourceProjectId=${sourceProject}&sourceFeatureId=${sourceFeature}`,
      );
      const data = res.data.data.map((item: any) => ({
        ...item,
        status: "pending",
      }));
      setEntries(data);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลบันทึกเวลาได้");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSourceProjectChange = (id: number) => {
    setSourceProject(id);
    setSourceFeature(null);
    setSourceFeatures([]);
    fetchFeatures(id, setSourceFeatures);
  };

  const handleTargetProjectChange = (id: number) => {
    setTargetProject(id);
    setTargetFeature(null);
    setTargetFeatures([]);
    fetchFeatures(id, setTargetFeatures);
  };

  const startMigration = async () => {
    if (!targetProject || !targetFeature) {
      toast.warning("กรุณาเลือกโครงการปลายทาง");
      return;
    }

    if (entries.length === 0) {
      toast.warning("ไม่มีข้อมูลที่จะย้าย");
      return;
    }

    setIsMigrating(true);
    setProgress(0);

    const updatedEntries = [...entries];
    let successCount = 0;

    for (let i = 0; i < updatedEntries.length; i++) {
      const entry = updatedEntries[i];

      // Update state to processing
      updatedEntries[i].status = "processing";
      setEntries([...updatedEntries]);

      try {
        await axios.post("/api/v1/timesheet/migration", {
          timesheetId: entry.id,
          targetProjectId: targetProject,
          targetFeatureId: targetFeature,
        });

        updatedEntries[i].status = "success";
        successCount++;
      } catch (err: any) {
        updatedEntries[i].status = "error";
        updatedEntries[i].error = err.response?.data?.error || "Unknown Error";
      }

      const newProgress = Math.round(((i + 1) / updatedEntries.length) * 100);
      setProgress(newProgress);
      setEntries([...updatedEntries]);

      // Artificial delay to show processing status (Optional but good for tracking feel)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsMigrating(false);
    toast.success(
      `ย้ายข้อมูลเสร็จสิ้น สำเร็จ ${successCount}/${entries.length} รายการ`,
    );
  };

  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "พนักงาน",
      key: "user",
      render: (record: MigrationItem) => (
        <Space>
          <UserOutlined />
          <Text>
            {record.user?.firstname_th || "ไม่ระบุ"} (
            {record.user?.nickname || "-"})
          </Text>
        </Space>
      ),
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      render: (h: number) => <Text strong>{Number(h)}</Text>,
    },
    {
      title: "สถานะการย้าย",
      key: "status",
      render: (record: MigrationItem) => {
        if (record.status === "pending")
          return <Badge status="default" text="รอการดำเนินการ" />;
        if (record.status === "processing")
          return <Badge status="processing" text="กำลังย้ายข้อมูล..." />;
        if (record.status === "success")
          return <Badge status="success" text="สำเร็จ" />;
        return (
          <Space>
            <Badge status="error" text="ล้มเหลว" />
            <Text type="danger" style={{ fontSize: 12 }}>
              ({record.error})
            </Text>
          </Space>
        );
      },
    },
  ];

  const sourceProjectData = projects.find((p) => p.id === sourceProject);
  const targetProjectData = projects.find((p) => p.id === targetProject);
  const sourceFeatureData = sourceFeatures.find((f) => f.id === sourceFeature);
  const targetFeatureData = targetFeatures.find((f) => f.id === targetFeature);

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          title="ระบบย้ายข้อมูล Timesheet (Migration Tool)"
          subTitle="จัดการย้ายบันทึกเวลาจากโครงการ/โครงการย่อยที่ยกเลิกไปยังรายการที่ถูกต้อง"
          icon={<SwapOutlined />}
        />

        <Row gutter={[24, 24]}>
          {/* Selection Area */}
          <Col span={24}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Row gutter={48} align="middle">
                {/* Source Column */}
                <Col xs={24} md={10}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={16}
                  >
                    <Flex align="center" gap={8}>
                      <div
                        style={{
                          padding: 8,
                          background: token.colorErrorBg,
                          borderRadius: 8,
                          color: token.colorError,
                        }}
                      >
                        <ExclamationCircleOutlined />
                      </div>
                      <Title level={5} style={{ margin: 0 }}>
                        ต้นทาง (Source Project)
                      </Title>
                    </Flex>

                    <Select
                      placeholder="เลือกโครงการ"
                      style={{ width: "100%" }}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                      onChange={handleSourceProjectChange}
                      loading={loading}
                    >
                      {projects.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          <Space>
                            {p.name}
                            {p.is_deleted && <Tag color="error">ถูกลบ</Tag>}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>

                    <Select
                      placeholder="เลือกโครงการย่อย (Sub-project / Feature)"
                      style={{ width: "100%" }}
                      size="large"
                      disabled={!sourceProject}
                      value={sourceFeature}
                      onChange={setSourceFeature}
                      loading={loading}
                    >
                      {sourceFeatures.map((f) => (
                        <Select.Option key={f.id} value={f.id}>
                          <Space>
                            {f.name}
                            {f.is_deleted ? (
                              <Tag color="error">ถูกลบ</Tag>
                            ) : (
                              <Tag color="success">ใช้งานอยู่</Tag>
                            )}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>

                    <Button
                      type="primary"
                      icon={<SyncOutlined />}
                      disabled={!sourceProject || !sourceFeature}
                      onClick={fetchEntries}
                      loading={loading}
                      block
                    >
                      ตรวจสอบข้อมูลที่ค้างอยู่
                    </Button>
                  </Space>
                </Col>

                <Col xs={24} md={4} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, color: token.colorTextDisabled }}>
                    <ArrowRightOutlined />
                  </div>
                </Col>

                {/* Target Column */}
                <Col xs={24} md={10}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={16}
                  >
                    <Flex align="center" gap={8}>
                      <div
                        style={{
                          padding: 8,
                          background: token.colorSuccessBg,
                          borderRadius: 8,
                          color: token.colorSuccess,
                        }}
                      >
                        <CheckCircleOutlined />
                      </div>
                      <Title level={5} style={{ margin: 0 }}>
                        ปลายทาง (Target Project)
                      </Title>
                    </Flex>

                    <Select
                      placeholder="เลือกโครงการ"
                      style={{ width: "100%" }}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                      onChange={handleTargetProjectChange}
                    >
                      {projects
                        .filter((p) => !p.is_deleted)
                        .map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name}
                          </Select.Option>
                        ))}
                    </Select>

                    <Select
                      placeholder="เลือกโครงการย่อย (Sub-project / Feature)"
                      style={{ width: "100%" }}
                      size="large"
                      disabled={!targetProject}
                      value={targetFeature}
                      onChange={setTargetFeature}
                    >
                      {targetFeatures
                        .filter((f) => !f.is_deleted)
                        .map((f) => (
                          <Select.Option key={f.id} value={f.id}>
                            {f.name}
                          </Select.Option>
                        ))}
                    </Select>

                    <Button
                      type="primary"
                      danger
                      icon={<PlayCircleOutlined />}
                      disabled={
                        !targetProject ||
                        !targetFeature ||
                        entries.length === 0 ||
                        isMigrating
                      }
                      onClick={startMigration}
                      block
                      style={{ fontWeight: 600 }}
                    >
                      เริ่มการย้ายข้อมูลทั้งหมด
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Status & Progress Area */}
          {entries.length > 0 && (
            <Col span={24}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex vertical gap={24}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-200">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          สรุปรายการที่รอการย้าย
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <Space direction="vertical">
                            <Text>
                              จาก: <Tag>{sourceProjectData?.name}</Tag> /{" "}
                              <Tag
                                color={
                                  sourceFeatureData?.is_deleted
                                    ? "error"
                                    : "success"
                                }
                              >
                                {sourceFeatureData?.name}
                              </Tag>
                            </Text>
                            <Text>
                              ไปที่:{" "}
                              <Tag color="blue">{targetProjectData?.name}</Tag>{" "}
                              /{" "}
                              <Tag color="cyan">
                                {targetFeatureData?.name || "ยังไม่ได้เลือก"}
                              </Tag>
                            </Text>
                          </Space>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="text-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 h-full flex flex-col justify-center">
                        <Title
                          level={3}
                          style={{ margin: 0, color: token.colorPrimary }}
                        >
                          {entries.length}
                        </Title>
                        <Text type="secondary">จำนวนบันทึกเวลาทั้งหมด</Text>
                      </div>
                    </Col>
                  </Row>

                  {(isMigrating || progress > 0) && (
                    <div>
                      <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: 8 }}
                      >
                        <Text strong>ความคืบหน้าการทำงาน</Text>
                        <Text>{progress}%</Text>
                      </Flex>
                      <Progress
                        percent={progress}
                        status={isMigrating ? "active" : "normal"}
                        strokeColor={{
                          "0%": token.colorPrimary,
                          "100%": token.colorSuccess,
                        }}
                      />
                    </div>
                  )}

                  <Table
                    dataSource={entries}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="rounded-lg overflow-hidden border border-gray-100"
                  />
                </Flex>
              </Card>
            </Col>
          )}

          {entries.length === 0 && !loading && (
            <Col span={24}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                <Empty
                  description={
                    <Text type="secondary">
                      เลือกต้นทางเพื่อตรวจสอบรายการที่ต้องการย้าย
                    </Text>
                  }
                />
              </Card>
            </Col>
          )}
        </Row>
      </DashboardLayout>
    </PermissionLayout>
  );
}
