"use client";

import {
  CheckCircleOutlined,
  ClearOutlined,
  FilterOutlined,
  RobotOutlined,
  SearchOutlined,
  SwapOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Divider,
  Empty,
  Flex,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Layout & Custom Components
import DashboardLayout from "@/components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import StatusModal from "@/components/modal/status-modal";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { PERMISSIONS } from "@/constants/permission.constant";

const { Text, Title } = Typography;

export default function MigratePersonPage() {
  const { token } = theme.useToken();
  const { modal: antdModal } = App.useApp();

  // --- States (คงเดิมตาม Logic ธุรกิจ) ---
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);
  const [targetFeatureId, setTargetFeatureId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [automateLoading, setAutomateLoading] = useState(false);
  const [automateStep, setAutomateStep] = useState(0);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [migrateModalVisible, setMigrateModalVisible] = useState(false);
  const [selectedAiRowKeys, setSelectedAiRowKeys] = useState<React.Key[]>([]);
  const [savingAutomate, setSavingAutomate] = useState(false);
  const [statusModal, setStatusModal] = useState<any>({
    open: false,
    type: "success",
  });

  // --- API Functions (สกัดออกมาให้สั้นลง) ---
  const requestInitialData = async () => {
    setInitialLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        axios.get("/api/v1/timesheet/migration/read?action=users"),
        axios.get("/api/v1/timesheet/migration/read?action=projects"),
      ]);
      setUsers(uRes.data?.data || []);
      setProjects(pRes.data?.data || []);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchEntries = async (id: number, issue: boolean) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/timesheet/migration/read?action=entries&admin_id=${id}&has_issues=${issue}`,
      );
      setEntries(res.data?.data || []);
      setSelectedRowKeys([]);
    } catch {
      toast.error("โหลดไทม์ชีทล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async (projectId: number) => {
    try {
      const res = await axios.get(
        `/api/v1/timesheet/migration/read?action=features&project_id=${projectId}`,
      );
      setFeatures(res.data?.data || []);
    } catch {
      toast.error("โหลดข้อมูล Feature ล้มเหลว");
    }
  };

  useEffect(() => {
    requestInitialData();
  }, []);
  useEffect(() => {
    if (selectedUser) fetchEntries(selectedUser, showOnlyIssues);
  }, [selectedUser, showOnlyIssues]);

  useEffect(() => {
    if (targetProjectId) fetchFeatures(targetProjectId);
    else {
      setFeatures([]);
      setTargetFeatureId(null);
    }
  }, [targetProjectId]);

  // --- Action Functions ---
  const handleAutomateFill = async () => {
    if (!selectedUser || selectedRowKeys.length === 0) {
      toast.warning("กรุณาเลือกพนักงานและรายการที่ต้องการเติมข้อมูล");
      return;
    }

    setAutomateLoading(true);
    setAutomateStep(0);
    try {
      const res = await axios.post(
        "/api/v1/timesheet/migration/automate-fill",
        {
          admin_id: Number(selectedUser),
          entry_ids: selectedRowKeys.map((k) => Number(k)),
        },
      );

      const data = res.data?.data || [];
      setGeneratedResults(data);
      setSelectedAiRowKeys(data.map((item: any) => item.id));
      setReviewModalVisible(true);
      setAutomateStep(2);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message_th || "AI ไม่สามารถสร้างเนื้อหาได้",
      );
    } finally {
      setAutomateLoading(false);
    }
  };

  const handleSaveAutomate = async () => {
    if (selectedAiRowKeys.length === 0) return;

    setSavingAutomate(true);
    try {
      const updates = generatedResults
        .filter((item) => selectedAiRowKeys.includes(item.id))
        .map((item) => ({
          id: item.id,
          description: item.suggested_description,
        }));

      await axios.patch("/api/v1/timesheet/migration/automate-fill", {
        updates,
      });

      toast.success("บันทึกข้อมูลสำเร็จ");
      setReviewModalVisible(false);
      fetchEntries(selectedUser!, showOnlyIssues);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSavingAutomate(false);
    }
  };

  const handleMigrate = async () => {
    setMigrateModalVisible(true);
  };

  const handleConfirmMigrate = async () => {
    if (
      selectedRowKeys.length === 0 ||
      !targetProjectId ||
      !targetFeatureId ||
      !selectedUser
    ) {
      toast.warning("กรุณากรอกข้อมูลเป้าหมายให้ครบถ้วน");
      return;
    }

    setMigrationLoading(true);
    try {
      await axios.post("/api/v1/timesheet/migration/create", {
        entry_ids: selectedRowKeys.map((k) => Number(k)),
        target_project_id: Number(targetProjectId),
        target_feature_id: Number(targetFeatureId),
      });

      toast.success(`ย้ายข้อมูลสำเร็จ ${selectedRowKeys.length} รายการ`);
      setMigrateModalVisible(false);
      fetchEntries(selectedUser, showOnlyIssues);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message_th ||
          error?.response?.data?.error ||
          "ย้ายข้อมูลล้มเหลว",
      );
    } finally {
      setMigrationLoading(false);
    }
  };

  // --- Table Configuration ---
  const projectFilters = Array.from(
    new Set(entries.map((e) => e.project?.name).filter(Boolean)),
  ).map((name) => ({ text: String(name), value: String(name) }));

  const featureFilters = Array.from(
    new Set(entries.map((e) => e.feature?.name).filter(Boolean)),
  ).map((name) => ({ text: String(name), value: String(name) }));

  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      width: 110,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "โปรเจกต์เดิม",
      dataIndex: ["project", "name"],
      width: 180,
      filters: projectFilters,
      onFilter: (value: any, record: any) => record.project?.name === value,
      filterSearch: true,
      render: (name: string) => (
        <Text strong style={{ fontSize: token.fontSizeSM }}>
          {name}
        </Text>
      ),
    },
    {
      title: "ฟีเจอร์เดิม",
      dataIndex: ["feature", "name"],
      width: 180,
      filters: featureFilters,
      onFilter: (value: any, record: any) => record.feature?.name === value,
      filterSearch: true,
      render: (name: string) => (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {name || "-"}
        </Text>
      ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      render: (desc: string, record: any) =>
        record.hasIssue ? (
          <Tag color="error" icon={<WarningOutlined />} bordered={false}>
            ไม่มีรายละเอียด
          </Tag>
        ) : (
          <Text>{desc}</Text>
        ),
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      width: 80,
      align: "center" as const,
      render: (h: number) => (
        <Badge count={h} color={h > 8 ? "orange" : "blue"} />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PermissionLayout permission={[PERMISSIONS.ADMIN_ACCESS]}>
        <HeaderBar
          title="ย้ายข้อมูล Timesheet (รายบุคคล)"
          subTitle="จัดการย้ายรายการโปรเจกต์ หรือเติมคำอธิบายที่ขาดหาย"
          icon={<SwapOutlined />}
        />

        {/* Global Config สำหรับจัดการสไตล์แบบไม่ต้องเขียน CSS */}
        <ConfigProvider
          theme={{
            components: {
              Card: { paddingLG: 24, borderRadiusLG: 16 },
              Select: { controlHeight: 40 },
              Button: { borderRadius: 8 },
            },
          }}
        >
          <Flex vertical gap="large" style={{ marginTop: token.marginLG }}>
            {/* --- Filter Section --- */}
            <Card
              title={
                <Space>
                  <FilterOutlined />
                  ตัวกรอง
                </Space>
              }
            >
              <Skeleton loading={initialLoading} active>
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Flex vertical gap={8}>
                      <Text strong type="secondary">
                        เลือกพนักงาน
                      </Text>
                      <Select
                        showSearch
                        placeholder="ค้นหาชื่อหรือรหัสพนักงาน"
                        value={selectedUser}
                        onChange={setSelectedUser}
                        // 1. ตั้งค่าการกรอง: ค้นหาคำที่พิมพ์ใน 'label' โดยไม่สนตัวพิมพ์เล็ก-ใหญ่
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        // 2. ปรับโครงสร้าง options ให้รวมข้อมูลที่จำเป็นในการกรอง
                        options={users.map((u) => ({
                          value: u.admin_id,
                          // เก็บ string สำหรับค้นหาไว้ที่ label
                          label: `${u.firstname_th} ${u.lastname_th} (${u.nickname}) ${u.employee_code || ""}`,
                          emoji: u.nickname?.[0] || u.firstname_th?.[0],
                        }))}
                        // 3. ใช้ optionRender เพื่อแสดงผล UI ที่สวยงาม (ไม่กระทบการค้นหา)
                        optionRender={(option) => (
                          <Space>
                            <Avatar
                              size="small"
                              style={{ backgroundColor: token.colorPrimary }}
                            >
                              {option.data.emoji}
                            </Avatar>
                            {option.data.label}
                          </Space>
                        )}
                      />
                    </Flex>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Flex vertical gap={8}>
                      <Text strong type="secondary">
                        โปรเจกต์เป้าหมาย
                      </Text>
                      <Select
                        placeholder="เลือกโปรเจกต์ปลายทาง"
                        value={targetProjectId}
                        onChange={(v) => {
                          setTargetProjectId(v);
                          setTargetFeatureId(null);
                        }}
                        options={projects.map((p) => ({
                          label: p.name,
                          value: p.id,
                        }))}
                      />
                    </Flex>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Checkbox
                      checked={showOnlyIssues}
                      onChange={(e) => setShowOnlyIssues(e.target.checked)}
                    >
                      แสดงเฉพาะรายการที่มีปัญหา (ไม่มีคำอธิบาย)
                    </Checkbox>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Flex vertical gap={8}>
                      <Text strong type="secondary">
                        Feature เป้าหมาย
                      </Text>
                      <Select
                        placeholder="เลือก Feature ปลายทาง"
                        value={targetFeatureId}
                        onChange={setTargetFeatureId}
                        disabled={!targetProjectId}
                        options={features.map((f) => ({
                          label: f.name,
                          value: f.id,
                        }))}
                      />
                    </Flex>
                  </Col>

                  <Col span={24}>
                    <Flex justify="end" gap="small">
                      <Button
                        icon={<ClearOutlined />}
                        onClick={() => setSelectedUser(null)}
                      >
                        ล้างฟิลเตอร์
                      </Button>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        loading={loading}
                        onClick={() =>
                          selectedUser &&
                          fetchEntries(selectedUser, showOnlyIssues)
                        }
                      >
                        ค้นหาข้อมูล
                      </Button>
                    </Flex>
                  </Col>
                </Row>
              </Skeleton>
            </Card>

            {/* --- Table Section --- */}
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  <Text strong>รายการ Timesheet</Text>
                  {selectedRowKeys.length > 0 && (
                    <Badge count={selectedRowKeys.length} color="blue" />
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Tooltip
                    title={
                      !selectedRowKeys.length
                        ? "กรุณาเลือกรายการไทม์ชีทที่ต้องการให้ AI ช่วยเติม"
                        : ""
                    }
                  >
                    <span>
                      <Button
                        icon={<RobotOutlined />}
                        disabled={!selectedRowKeys.length}
                        loading={automateLoading}
                        onClick={handleAutomateFill}
                        style={{
                          color: token.colorSuccess,
                          borderColor: token.colorSuccess,
                        }}
                      >
                        AI ช่วยเติมงาน
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      !targetProjectId
                        ? "กรุณาเลือกโปรเจกต์เป้าหมาย"
                        : !targetFeatureId
                          ? "กรุณาเลือก Feature เป้าหมาย"
                          : !selectedRowKeys.length
                            ? "กรุณาเลือกรายการไทม์ชีทที่ต้องการย้าย"
                            : ""
                    }
                  >
                    <span>
                      <Button
                        type="primary"
                        icon={<SwapOutlined />}
                        disabled={!selectedRowKeys.length || !targetFeatureId}
                        loading={migrationLoading}
                        onClick={handleMigrate}
                      >
                        ย้ายโปรเจกต์
                      </Button>
                    </span>
                  </Tooltip>
                </Space>
              }
            >
              <Table
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                columns={columns}
                dataSource={entries}
                rowKey="id"
                pagination={{
                  defaultPageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                  position: ["bottomCenter"],
                }}
                locale={{
                  emptyText: (
                    <Empty description="กรุณาเลือกพนักงานเพื่อดูข้อมูล" />
                  ),
                }}
              />
            </Card>
          </Flex>
        </ConfigProvider>

        {/* --- AI Review Modal --- */}
        <Modal
          title={
            <Space>
              <RobotOutlined style={{ color: token.colorSuccess }} />{" "}
              ตรวจสอบเนื้อหาจาก AI
            </Space>
          }
          open={reviewModalVisible}
          onCancel={() => !savingAutomate && setReviewModalVisible(false)}
          width={800}
          footer={[
            <Button
              key="cancel"
              onClick={() => setReviewModalVisible(false)}
              disabled={savingAutomate}
            >
              ยกเลิก
            </Button>,
            <Button
              key="save"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleSaveAutomate}
              loading={savingAutomate}
              disabled={selectedAiRowKeys.length === 0}
            >
              ยืนยันและบันทึก ({selectedAiRowKeys.length} รายการ)
            </Button>,
          ]}
        >
          <Flex vertical gap="large">
            <Steps
              current={automateStep}
              size="small"
              items={[
                { title: "วิเคราะห์" },
                { title: "สร้างเนื้อหา" },
                { title: "ตรวจสอบ" },
              ]}
            />
            <Table
              dataSource={generatedResults}
              rowKey="id"
              size="small"
              rowSelection={{
                selectedRowKeys: selectedAiRowKeys,
                onChange: setSelectedAiRowKeys,
              }}
              columns={[
                {
                  title: "วันที่",
                  dataIndex: "date",
                  width: 120,
                  render: (val) => dayjs(val).format("DD/MM/YYYY"),
                },
                {
                  title: "เนื้อหาแนะนำ",
                  dataIndex: "suggested_description",
                  render: (val) => (
                    <Card
                      size="small"
                      style={{
                        backgroundColor: token.colorSuccessBg,
                        border: `1px solid ${token.colorSuccessBorder}`,
                      }}
                    >
                      <Text style={{ fontSize: token.fontSizeSM }}>{val}</Text>
                    </Card>
                  ),
                },
              ]}
            />
          </Flex>
        </Modal>

        {/* --- Migrate Confirmation Modal --- */}
        <Modal
          title={
            <Space>
              <SwapOutlined style={{ color: token.colorPrimary }} />{" "}
              ยืนยันการย้ายโปรเจกต์
            </Space>
          }
          open={migrateModalVisible}
          onCancel={() => !migrationLoading && setMigrateModalVisible(false)}
          width={900}
          okText="ยืนยันการย้ายข้อมูล"
          cancelText="ยกเลิก"
          onOk={handleConfirmMigrate}
          confirmLoading={migrationLoading}
          maskClosable={false}
        >
          <Flex vertical gap="large">
            <Card
              size="small"
              styles={{ body: { backgroundColor: token.colorFillAlter } }}
              variant="borderless"
            >
              <Row gutter={24} align="middle">
                <Col span={11}>
                  <Flex vertical align="center">
                    <Text
                      type="secondary"
                      style={{ fontSize: token.fontSizeSM }}
                    >
                      ย้ายรายการที่เลือกทั้งหมด
                    </Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedRowKeys.length} รายการ
                    </Title>
                  </Flex>
                </Col>
                <Col span={2}>
                  <Flex justify="center">
                    <SwapOutlined
                      style={{ fontSize: 24, color: token.colorTextQuaternary }}
                    />
                  </Flex>
                </Col>
                <Col span={11}>
                  <Flex vertical>
                    <Text
                      type="secondary"
                      style={{ fontSize: token.fontSizeSM }}
                    >
                      ไปยังเป้าหมาย
                    </Text>
                    <Text strong>
                      {projects.find((p) => p.id === targetProjectId)?.name}
                    </Text>
                    <Text type="secondary">
                      {features.find((f) => f.id === targetFeatureId)?.name}
                    </Text>
                  </Flex>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left" style={{ margin: 0 }}>
              รายการที่จะถูกย้าย
            </Divider>

            <Table
              size="small"
              pagination={{ pageSize: 5 }}
              dataSource={entries.filter((e) => selectedRowKeys.includes(e.id))}
              rowKey="id"
              columns={[
                {
                  title: "วันที่",
                  dataIndex: "date",
                  width: 100,
                  render: (d) => dayjs(d).format("DD/MM/YYYY"),
                },
                {
                  title: "โปรเจกต์/Feature (เดิม)",
                  render: (_, record) => (
                    <Flex vertical>
                      <Text style={{ fontSize: token.fontSizeSM }}>
                        {record.project?.name}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 10 }}
                        ellipsis={{ tooltip: record.feature?.name }}
                      >
                        {record.feature?.name}
                      </Text>
                    </Flex>
                  ),
                },
                {
                  title: "รายละเอียด",
                  dataIndex: "description",
                  ellipsis: true,
                },
              ]}
            />
          </Flex>
        </Modal>

        <StatusModal
          {...statusModal}
          onClose={() => setStatusModal({ ...statusModal, open: false })}
        />
      </PermissionLayout>
    </DashboardLayout>
  );
}
