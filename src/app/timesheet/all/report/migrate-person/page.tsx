"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import StatusModal from "@/components/modal/status-modal";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { PERMISSIONS } from "@/constants/permission.constant";
import {
  CheckCircleOutlined,
  ClearOutlined,
  FilterOutlined,
  LoadingOutlined,
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
  Empty,
  Flex,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const { Text } = Typography;

interface TimesheetEntry {
  id: number;
  date: string;
  hours: number;
  description: string;
  projectId: number;
  featureId: number;
  project: { name: string };
  feature: { name: string; ticket_number: string };
  hasIssue: boolean;
  issueTypes: string[];
}

interface UserSummary {
  admin_id: number;
  firstname_th: string;
  lastname_th: string;
  nickname: string;
  employee_code: string;
}

export default function MigratePersonPage() {
  const { token } = theme.useToken();
  const { modal: antdModal } = App.useApp();

  // Data States
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);

  // Selection States
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);
  const [targetFeatureId, setTargetFeatureId] = useState<number | null>(null);

  // UI States
  const [loading, setLoading] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");

  // AI Automate States
  const [automateLoading, setAutomateLoading] = useState(false);
  const [automateStep, setAutomateStep] = useState(0);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [savingAutomate, setSavingAutomate] = useState(false);

  // Modal State
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title?: string;
    message?: string;
    errorDetails?: any;
  }>({
    open: false,
    type: "success",
  });

  // Initial Data
  useEffect(() => {
    requestInitialData();
  }, []);

  /**
   * ดึงข้อมูลพนักงานและโปรเจกต์เริ่มต้นสำหรับใช้งานในฟอร์ม
   */
  const requestInitialData = async () => {
    try {
      const [userResponse, projectResponse] = await Promise.all([
        axios.get("/api/v1/timesheet/migration/read?action=users"),
        axios.get("/api/v1/timesheet/migration/read?action=projects"),
      ]);
      setUsers(userResponse.data?.data || []);
      setProjects(projectResponse.data?.data || []);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลเบื้องต้นได้");
    }
  };

  useEffect(() => {
    if (selectedUser) {
      requestTimesheetEntries(selectedUser, showOnlyIssues);
    } else {
      setEntries([]);
    }
  }, [selectedUser, showOnlyIssues]);

  /**
   * ดึงรายการ Timesheet ของพนักงานที่เลือก และกรองเฉพาะที่มีปัญหาหากเปิด Flag ไว้
   */
  const requestTimesheetEntries = async (
    adminId: number,
    issuesOnly: boolean,
  ) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/migration/read?action=entries&admin_id=${adminId}&has_issues=${issuesOnly}`,
      );
      setEntries(response.data?.data || []);
      setSelectedRowKeys([]);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลไทม์ชีทได้");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ดึงรายชื่อ Feature เมื่อมีการเปลี่ยนโปรเจกต์ต้นทาง/ปลายทาง
   */
  const handleTargetProjectChange = async (value: number) => {
    setTargetProjectId(value);
    setTargetFeatureId(null);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/migration/read?action=features&project_id=${value}`,
      );
      setFeatures(response.data?.data || []);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูล Feature ได้");
    }
  };

  /**
   * ดำเนินการย้ายรายการ Timesheet ที่เลือกไปยังโปรเจกต์และ Feature เป้าหมาย
   */
  const requestMigrateTimesheet = async () => {
    if (!targetProjectId || !targetFeatureId || selectedRowKeys.length === 0) {
      toast.error("กรุณาเลือกรายการและเป้าหมายที่จะย้าย");
      return;
    }

    setMigrationLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/migration/create", {
        entry_ids: selectedRowKeys,
        target_project_id: targetProjectId,
        target_feature_id: targetFeatureId,
      });

      setStatusModal({
        open: true,
        type: "success",
        title: "ย้ายข้อมูลสำเร็จ",
        message: response.data?.message_th || "ย้ายข้อมูลรายวันเรียบร้อยแล้ว",
      });

      if (selectedUser) requestTimesheetEntries(selectedUser, showOnlyIssues);
    } catch (error: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "เกิดข้อผิดพลาดในการย้ายข้อมูล",
        message:
          error.response?.data?.message_th ||
          error.response?.data?.error ||
          "ไม่สามารถดำเนินการได้",
        errorDetails: error.response?.data || error.message,
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  /**
   * วิเคราะห์และสร้างรายละเอียดงานด้วย AI
   */
  const requestAiGenerateDescriptions = async () => {
    if (selectedRowKeys.length === 0 || !selectedUser) {
      toast.warning("กรุณาเลือกรายการและพนักงานที่ต้องการให้ AI ช่วยสรุป");
      return;
    }

    setAutomateLoading(true);
    setAutomateStep(0);
    setGeneratedResults([]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAutomateStep(1);

      const response = await axios.post(
        "/api/v1/timesheet/migration/automate-fill",
        {
          admin_id: selectedUser,
          entry_ids: selectedRowKeys,
        },
      );

      setGeneratedResults(response.data?.data || []);
      setAutomateStep(2);
      setReviewModalVisible(true);
    } catch (error: any) {
      toast.error(
        `AI Generation Failed: ${error.response?.data?.message_th || error.message}`,
      );
    } finally {
      setAutomateLoading(false);
    }
  };

  /**
   * บันทึกรายละเอียดงานที่ AI แนะนำ
   */
  const requestUpdateDescriptionsByAi = async () => {
    setSavingAutomate(true);
    try {
      const response = await axios.patch(
        "/api/v1/timesheet/migration/automate-fill",
        {
          updates: generatedResults.map((item) => ({
            id: item.id,
            description: item.suggested_description,
          })),
        },
      );

      toast.success(
        `อัปเดตรายละเอียดงาน ${response.data?.data?.count || 0} รายการสำเร็จ`,
      );

      setReviewModalVisible(false);
      if (selectedUser) requestTimesheetEntries(selectedUser, showOnlyIssues);
    } catch (error: any) {
      toast.error(error.response?.data?.message_th || error.message);
    } finally {
      setSavingAutomate(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.firstname_th} ${u.lastname_th} ${u.nickname} ${u.employee_code}`
        .toLowerCase()
        .includes(userSearchText.toLowerCase()),
    );
  }, [users, userSearchText]);

  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      width: 120,
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "โปรเจกต์เดิม",
      key: "original",
      render: (_: any, record: TimesheetEntry) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12, fontWeight: 600 }}>
            {record.project?.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.feature?.name}
          </Text>
        </Space>
      ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      render: (desc: string, record: TimesheetEntry) => (
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          {record.hasIssue ? (
            <Tag color="error" icon={<WarningOutlined />}>
              ไม่มีรายละเอียด
            </Tag>
          ) : (
            <Text>{desc}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      width: 80,
      align: "center" as const,
      sorter: (a: any, b: any) => a.hours - b.hours,
      render: (h: number) => (
        <Badge count={h} color={h > 8 ? "orange" : "blue"} />
      ),
    },
  ];

  /**
   * ล้างการค้นหาทั้งหมด
   */
  const handleClearFilters = () => {
    setSelectedUser(null);
    setShowOnlyIssues(false);
    setTargetProjectId(null);
    setTargetFeatureId(null);
    setEntries([]);
    setSelectedRowKeys([]);
    toast.info("ล้างข้อมูลการค้นหาเรียบร้อย");
  };

  return (
    <DashboardLayout>
      <PermissionLayout permission={[PERMISSIONS.TIMESHEET_WRITE]}>
        {/* ส่วนที่ 1: หัวเรื่องของหน้า */}
        <HeaderBar
          title="ย้ายข้อมูล Timesheet (รายบุคคล)"
          description="ระบบจัดการย้ายรายการที่คีย์ผิดโปรเจกต์ หรือรายการที่ไม่มีคำอธิบาย"
          icon={<SwapOutlined />}
        />

        <Space
          direction="vertical"
          size={24}
          style={{ width: "100%", marginTop: 24 }}
        >
          {/* ส่วนที่ 3: ฟิลเตอร์ข้อมูล (Filter) และ ปุ่มที่เกี่ยวข้อง */}
          <Card
            title={
              <Space>
                <FilterOutlined />
                <span>ตัวกรอง</span>
              </Space>
            }
            styles={{ body: { padding: 16 } }}
            style={{
              borderRadius: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Row gutter={[24, 16]}>
              {/* แถวที่ 1: เลือกพนักงาน และ เลือกโปรเจกต์ปลายทาง */}
              <Col xs={24} lg={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    เลือกพนักงาน
                  </Text>
                  <Select
                    showSearch
                    placeholder="ค้นหาชื่อพนักงาน หรือรหัส"
                    style={{ width: "100%" }}
                    value={selectedUser}
                    onChange={setSelectedUser}
                    onSearch={setUserSearchText}
                    filterOption={false}
                    notFoundContent={loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
                  >
                    {filteredUsers.map((user) => (
                      <Select.Option key={user.admin_id} value={user.admin_id}>
                        <Space>
                          <Avatar
                            size="small"
                            style={{ backgroundColor: token.colorPrimary }}
                          >
                            {user.nickname?.[0] || user.firstname_th?.[0]}
                          </Avatar>
                          {user.firstname_th} {user.lastname_th} (
                          {user.nickname})
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Space>
              </Col>

              <Col xs={24} lg={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    โปรเจกต์เป้าหมาย
                  </Text>
                  <Select
                    placeholder="เลือกโปรเจกต์เป้าหมายที่จะย้ายไป"
                    style={{ width: "100%" }}
                    value={targetProjectId}
                    onChange={handleTargetProjectChange}
                    options={projects.map((p) => ({
                      label: p.name,
                      value: p.id,
                    }))}
                  />
                </Space>
              </Col>

              {/* แถวที่ 2: ตั้งค่าฟิลเตอร์อื่น ๆ และ Feature เป้ามหาย */}
              <Col xs={24} lg={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    เงื่อนไขเพิ่มเติม
                  </Text>
                  <Checkbox
                    checked={showOnlyIssues}
                    onChange={(e) => setShowOnlyIssues(e.target.checked)}
                  >
                    แสดงเฉพาะรายการที่มีปัญหา (ไม่มีคำอธิบาย)
                  </Checkbox>
                </Space>
              </Col>

              <Col xs={24} lg={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    Feature เป้าหมาย
                  </Text>
                  <Select
                    placeholder="เลือก Feature ในโปรเจกต์เป้าหมาย"
                    style={{ width: "100%" }}
                    value={targetFeatureId}
                    onChange={setTargetFeatureId}
                    disabled={!targetProjectId}
                    options={features.map((f) => ({
                      label: f.ticket_number
                        ? `[${f.ticket_number}] ${f.name}`
                        : f.name,
                      value: f.id,
                    }))}
                  />
                </Space>
              </Col>

              {/* ปุ่มควบคุม (ปุ่มค้นหาและล้างการค้นหา) */}
              <Col span={24}>
                <Flex justify="end" gap={12} style={{ marginTop: 8 }}>
                  <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                    ล้างการค้นหา
                  </Button>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    loading={loading}
                    onClick={() =>
                      selectedUser &&
                      requestTimesheetEntries(selectedUser, showOnlyIssues)
                    }
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
              <Space>
                <CheckCircleOutlined />
                <Text style={{ fontWeight: 600 }}>รายการ Timesheet</Text>
                {selectedRowKeys.length > 0 && (
                  <Tag color="blue" bordered={false}>
                    เลือกอยู่ {selectedRowKeys.length} รายการ
                  </Tag>
                )}
              </Space>
            }
            extra={
              // ปุ่มที่เกี่ยวข้อง จัดวางไว้ที่ด้านบนขวามือเสมอ
              <Space>
                <Button
                  icon={<RobotOutlined />}
                  disabled={selectedRowKeys.length === 0}
                  loading={automateLoading}
                  onClick={requestAiGenerateDescriptions}
                  style={{
                    borderColor: token.colorSuccess,
                    color: token.colorSuccess,
                  }}
                >
                  AI ช่วยเติมงาน
                </Button>
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  disabled={selectedRowKeys.length === 0 || !targetFeatureId}
                  loading={migrationLoading}
                  onClick={requestMigrateTimesheet}
                >
                  ย้ายโปรเจกต์
                </Button>
              </Space>
            }
          >
            {selectedUser ? (
              <Table
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
                columns={columns}
                dataSource={entries}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 15 }}
                locale={{
                  emptyText: <Empty description="ไม่พบรายการไทม์ชีท" />,
                }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" align="center">
                    <Text type="secondary">
                      กรุณาเลือกพนักงานและกดปุ่มค้นหาเพื่อดูข้อมูล
                    </Text>
                    <SearchOutlined
                      style={{
                        fontSize: 32,
                        color: token.colorTextQuaternary,
                        marginTop: 12,
                      }}
                    />
                  </Space>
                }
                style={{ padding: "40px 0" }}
              />
            )}
          </Card>
        </Space>

        {/* ส่วนที่ 5: โมดอลตรวจสอบผลลัพธ์จาก AI */}
        <Modal
          title={
            <Space>
              <RobotOutlined style={{ color: token.colorSuccess }} />
              <span style={{ fontWeight: 600 }}>
                ตรวจสอบรายละเอียดงานที่ AI แนะนำ
              </span>
            </Space>
          }
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          width={800}
          maskClosable={false}
          footer={[
            <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
              ยกเลิก
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={savingAutomate}
              onClick={requestUpdateDescriptionsByAi}
              style={{ backgroundColor: token.colorSuccess }}
            >
              บันทึกข้อมูล
            </Button>,
          ]}
        >
          {/* สถานะการทำงานของ AI (Steps) */}
          <div style={{ marginBottom: 24 }}>
            <Steps
              current={automateStep}
              size="small"
              items={[
                { title: "วิเคราะห์ข้อมูล", icon: <SearchOutlined /> },
                { title: "AI กำลังสร้างเนื้อหา", icon: <LoadingOutlined /> },
                { title: "ตรวจสอบความเหมาะสม", icon: <CheckCircleOutlined /> },
              ]}
            />
          </div>

          <Table
            dataSource={generatedResults}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 400 }}
            columns={[
              {
                title: "วันที่",
                dataIndex: "date",
                width: 100,
                render: (d) => dayjs(d).format("DD/MM/YYYY"),
              },
              {
                title: "เนื้อหาที่แนะนำ",
                dataIndex: "suggested_description",
                render: (val, record) => (
                  <Space
                    direction="vertical"
                    size={2}
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: token.colorSuccessBg,
                        border: `1px solid ${token.colorSuccessBorder}`,
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      {val}
                    </div>
                    {record.history_used > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        * อ้างอิงจากสไตล์การเขียนเดิม {record.history_used}{" "}
                        รายการ
                      </Text>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Modal>

        {/* ส่วนที่ 6: โมดอลแสดงสถานะการทำงาน (Success/Error) */}
        <StatusModal
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          errorDetails={statusModal.errorDetails}
          onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        />
      </PermissionLayout>
    </DashboardLayout>
  );
}
