"use client";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  CloseOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SolutionOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Position Type
interface Position {
  id: number;
  name_th: string;
  name_en?: string;
  description?: string;
  is_active: boolean;
  _count?: {
    users: number; // For showing how many users hold this position
  };
}

const TECH_ROLES = [
  {
    name_th: "Chief Technology Officer (CTO)",
    name_en: "Chief Technology Officer (CTO)",
  },
  { name_th: "VP of Engineering", name_en: "VP of Engineering" },
  { name_th: "Engineering Manager", name_en: "Engineering Manager" },
  { name_th: "Tech Lead", name_en: "Tech Lead" },
  { name_th: "Software Architect", name_en: "Software Architect" },
  { name_th: "Senior Software Engineer", name_en: "Senior Software Engineer" },
  { name_th: "Software Engineer", name_en: "Software Engineer" },
  { name_th: "Junior Software Engineer", name_en: "Junior Software Engineer" },
  { name_th: "Full-Stack Developer", name_en: "Full-Stack Developer" },
  { name_th: "Front-end Developer", name_en: "Front-end Developer" },
  { name_th: "Back-end Developer", name_en: "Back-end Developer" },
  { name_th: "Mobile Developer (iOS)", name_en: "Mobile Developer (iOS)" },
  {
    name_th: "Mobile Developer (Android)",
    name_en: "Mobile Developer (Android)",
  },
  { name_th: "DevOps Engineer", name_en: "DevOps Engineer" },
  {
    name_th: "Site Reliability Engineer (SRE)",
    name_en: "Site Reliability Engineer (SRE)",
  },
  { name_th: "Cloud Engineer", name_en: "Cloud Engineer" },
  { name_th: "QA Engineer", name_en: "QA Engineer" },
  { name_th: "QA Automation Engineer", name_en: "QA Automation Engineer" },
  { name_th: "UI/UX Designer", name_en: "UI/UX Designer" },
  { name_th: "Product Manager", name_en: "Product Manager" },
  { name_th: "Product Owner", name_en: "Product Owner" },
  { name_th: "Scrum Master", name_en: "Scrum Master" },
  { name_th: "Data Scientist", name_en: "Data Scientist" },
  { name_th: "Data Engineer", name_en: "Data Engineer" },
  { name_th: "Data Analyst", name_en: "Data Analyst" },
  {
    name_th: "Machine Learning Engineer",
    name_en: "Machine Learning Engineer",
  },
  { name_th: "Security Engineer", name_en: "Security Engineer" },
  { name_th: "Network Engineer", name_en: "Network Engineer" },
  { name_th: "System Administrator", name_en: "System Administrator" },
  {
    name_th: "Database Administrator (DBA)",
    name_en: "Database Administrator (DBA)",
  },
  { name_th: "IT Support Specialist", name_en: "IT Support Specialist" },
  { name_th: "Business Analyst", name_en: "Business Analyst" },
];

export default function PositionManagementPage() {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // Auto Gen State
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [genStep, setGenStep] = useState<
    "generating" | "review" | "executing" | "summary"
  >("generating");
  const [candidatePositions, setCandidatePositions] = useState<any[]>([]);
  const [executionStatus, setExecutionStatus] = useState<any[]>([]);
  const [currentExecutionIndex, setCurrentExecutionIndex] = useState(0);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/admin/position-management/read", {
        params: { search, limit: 100 },
      });
      setPositions(res?.data?.data?.items || []);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลตำแหน่งได้");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleOpenAutoGen = async () => {
    setAutoGenModalOpen(true);
    setGenStep("generating");

    // Simulate thinking/generating
    setTimeout(() => {
      const candidates = TECH_ROLES.map((role) => {
        const exists = positions.some((p) => p.name_th === role.name_th);
        return {
          ...role,
          status: exists ? "DUPLICATE" : "READY",
        };
      });
      setCandidatePositions(candidates);
      setGenStep("review");
    }, 1500);
  };

  const handleConfirmAutoGen = async () => {
    setGenStep("executing");
    setExecutionStatus(
      candidatePositions.map((c) => ({ ...c, execStatus: "pending" })),
    );
    setCurrentExecutionIndex(0);

    const results = [];
    for (let i = 0; i < candidatePositions.length; i++) {
      const item = candidatePositions[i];
      setCurrentExecutionIndex(i);

      // Skip explicit duplicates? Or try to create?
      // If duplicate, maybe we skip to avoid error, or just mark as skipped.
      if (item.status === "DUPLICATE") {
        results.push({
          ...item,
          execStatus: "skipped",
          message: "Already exists",
        });
        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = {
            ...item,
            execStatus: "skipped",
            message: "Already exists",
          };
          return next;
        });
        await new Promise((r) => setTimeout(r, 200)); // fast skip
        continue;
      }

      try {
        // Simulate API call delay for effect
        await new Promise((r) => setTimeout(r, 500));
        await axios.post("/api/v2/admin/position-management/create", {
          name_th: item.name_th,
          name_en: item.name_en,
          description: "Auto Generated Tech Role",
          is_active: true,
        });

        results.push({ ...item, execStatus: "success" });
        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = { ...item, execStatus: "success" };
          return next;
        });
      } catch (err) {
        results.push({
          ...item,
          execStatus: "error",
          message: "Failed to create",
        });
        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = { ...item, execStatus: "error" };
          return next;
        });
      }
    }

    setGenStep("summary");
    fetchData(); // Refresh main table
    setStatusModal({
      open: true,
      type: "success",
      title: "ดำเนินการสำเร็จ",
      message: "ระบบได้ทำการสร้างตำแหน่งงานจากเทมเพลตเรียบร้อยแล้ว",
    });
  };

  /**
   * ลบรายการ candidate ออกจากรายการที่จะสร้าง
   * @param index ลำดับของรายการ
   */
  const handleDeleteCandidate = (index: number) => {
    const newCandidates = [...candidatePositions];
    newCandidates.splice(index, 1);
    setCandidatePositions(newCandidates);
  };

  /**
   * บันทึกข้อมูลตำแหน่งงาน (สร้างใหม่ หรือ แก้ไข)
   * @param values ข้อมูลจากฟอร์ม
   */
  const handleSubmit = async (values: any) => {
    try {
      if (modalMode === "create") {
        await axios.post("/api/v2/admin/position-management/create", values);
        toast.success("สร้างตำแหน่งงานสำเร็จ");
      } else {
        await axios.post("/api/v2/admin/position-management/update", {
          ...values,
          id: selectedPos?.id,
        });
        toast.success("แก้ไขตำแหน่งงานสำเร็จ");
      }
      setModalMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  /**
   * ลบตำแหน่งงาน
   */
  const handleDelete = async () => {
    if (!selectedPos) return;
    try {
      await axios.post("/api/v2/admin/position-management/delete", {
        id: selectedPos.id,
      });
      toast.success("ลบตำแหน่งเรียบร้อยแล้ว");
      setDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  /**
   * ล้างค่าการค้นหา
   */
  const handleResetSearch = () => {
    setSearch("");
  };

  // --- Columns ---
  const columns: ColumnsType<Position> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text) => <span className="text-gray-400">#{text}</span>,
    },
    {
      title: "ชื่อตำแหน่ง (TH)",
      dataIndex: "name_th",
      sorter: (a, b) => a.name_th.localeCompare(b.name_th),
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "ชื่อตำแหน่ง (EN)",
      dataIndex: "name_en",
      render: (text) => text || "-",
    },
    {
      title: "ผู้ใช้งาน",
      dataIndex: ["_count", "users"],
      align: "center",
      render: (count) => <Tag color="blue">{count} คน</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      align: "center",
      sorter: (a, b) =>
        a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1,
      render: (active) =>
        active ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            เปิดใช้งาน
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseOutlined />}>
            ปิดใช้งาน
          </Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-yellow-500" />}
            onClick={() => {
              setSelectedPos(r);
              setModalMode("edit");
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={r._count?.users ? r._count.users > 0 : false} // Prevent delete if in use (optional safety)
            onClick={() => {
              setSelectedPos(r);
              setDeleteModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<SolutionOutlined />}
          title="จัดการตำแหน่งงาน"
          subTitle="บริหารจัดการตำแหน่งพนักงานในองค์กร"
          extra={
            <Space>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                รีเฟรช
              </Button>
            </Space>
          }
        />

        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={8}>
            <SummaryCard
              title="จำนวนตำแหน่งทั้งหมด"
              value={positions.length}
              unit="รายการ"
              icon={<SolutionOutlined />}
              color={token.colorPrimary}
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <SummaryCard
              title="ตำแหน่งที่เปิดใช้งาน"
              value={positions.filter((p) => p.is_active).length}
              unit="รายการ"
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <SummaryCard
              title="จำนวนพนักงานรวม"
              value={positions.reduce(
                (acc, curr) => acc + (curr._count?.users || 0),
                0,
              )}
              unit="คน"
              icon={<UserOutlined />}
              color={token.colorInfo}
              isLoading={loading}
            />
          </Col>
        </Row>

        <Card
          styles={{ body: { padding: 24 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 32,
          }}
        >
          <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
            <FilterOutlined
              style={{ fontSize: "1.2rem", color: token.colorPrimary }}
            />
            <Typography.Text strong style={{ fontSize: "1.1rem" }}>
              ตัวกรองข้อมูล
            </Typography.Text>
          </Flex>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item label="ค้นหาชื่อตำแหน่ง" style={{ marginBottom: 0 }}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="เช่น Software Engineer, Manager..."
                  size="large"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Flex justify="end" gap={12} style={{ marginTop: 32 }}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleResetSearch}
              size="large"
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchData}
              size="large"
            >
              ค้นหา
            </Button>
          </Flex>
        </Card>

        <Card
          styles={{ body: { padding: 24 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ marginBottom: 24 }}
          >
            <Space align="center" size={12}>
              <UnorderedListOutlined
                style={{ fontSize: "1.2rem", color: token.colorPrimary }}
              />
              <Typography.Text strong style={{ fontSize: "1.1rem" }}>
                รายการตำแหน่งงานทั้งหมด
              </Typography.Text>
            </Space>
            <Space size={12}>
              <Button
                onClick={handleOpenAutoGen}
                icon={<CloudServerOutlined />}
                size="large"
                style={{
                  backgroundColor: token.colorSuccessBg,
                  color: token.colorSuccess,
                  borderColor: token.colorSuccessBorder,
                }}
              >
                เทมเพลตตำแหน่งอัตโนมัติ
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  setModalMode("create");
                  form.resetFields();
                }}
              >
                เพิ่มตำแหน่ง
              </Button>
            </Space>
          </Flex>

          <Table
            columns={columns}
            dataSource={positions}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              style: { marginTop: 24 },
            }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={!!modalMode}
          title={modalMode === "create" ? "เพิ่มตำแหน่งใหม่" : "แก้ไขตำแหน่ง"}
          onCancel={() => setModalMode(null)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={
              modalMode === "edit" && selectedPos
                ? selectedPos
                : ({ is_active: true } as any)
            }
          >
            <Form.Item
              name="name_th"
              label="ชื่อตำแหน่ง (TH)"
              rules={[{ required: true, message: "กรุณาระบุชื่อภาษาไทย" }]}
            >
              <Input placeholder="เช่น ผู้จัดการฝ่ายขาย" />
            </Form.Item>
            <Form.Item name="name_en" label="ชื่อตำแหน่ง (EN)">
              <Input placeholder="e.g. Sales Manager" />
            </Form.Item>
            <Form.Item name="description" label="คำอธิบาย">
              <Input.TextArea
                rows={3}
                placeholder="รายละเอียดหน้าที่ความรับผิดชอบ"
              />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="สถานะการใช้งาน"
              valuePropName="checked"
            >
              <Button.Group>
                <Button
                  type={form.getFieldValue("is_active") ? "primary" : "default"}
                  onClick={() => form.setFieldsValue({ is_active: true })}
                  icon={<CheckOutlined />}
                >
                  เปิดใช้งาน
                </Button>
                <Button
                  type={
                    !form.getFieldValue("is_active") ? "primary" : "default"
                  }
                  danger={!form.getFieldValue("is_active")}
                  onClick={() => form.setFieldsValue({ is_active: false })}
                  icon={<CloseOutlined />}
                >
                  ปิดใช้งาน
                </Button>
              </Button.Group>
            </Form.Item>

            <Flex justify="end" gap={8} className="mt-6">
              <Button onClick={() => setModalMode(null)}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleOutlined />}
              >
                บันทึกข้อมูล
              </Button>
            </Flex>
          </Form>
        </Modal>

        {/* Delete Confirmation */}
        <StatusModalComponent
          open={deleteModalOpen}
          type="delete"
          title="ยืนยันการลบตำแหน่งงาน"
          message={`คุณต้องการลบตำแหน่ง "${selectedPos?.name_th}" หรือไม่? การดำเนินการนี้ไม่สามารถเรียกคืนได้`}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          confirmLabel="ลบทิ้ง"
          cancelLabel="ยกเลิก"
        />

        {/* Status Notification Modal */}
        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal({ ...statusModal, open: false })}
        />

        {/* Auto Gen Modal */}
        <Modal
          open={autoGenModalOpen}
          title={
            <Space>
              <CloudServerOutlined className="text-blue-500" />
              ระบบสร้างตำแหน่งอัตโนมัติ (Position Generator)
            </Space>
          }
          width={700}
          onCancel={() => {
            if (genStep === "executing") return; // Prevent close during exec
            setAutoGenModalOpen(false);
          }}
          footer={
            genStep === "review"
              ? [
                  <Button
                    key="cancel"
                    onClick={() => setAutoGenModalOpen(false)}
                  >
                    ยกเลิก
                  </Button>,
                  <Button
                    key="confirm"
                    type="primary"
                    onClick={handleConfirmAutoGen}
                  >
                    ยืนยันและเริ่มสร้าง (
                    {
                      candidatePositions.filter((c) => c.status === "READY")
                        .length
                    }
                    )
                  </Button>,
                ]
              : genStep === "summary"
                ? [
                    <Button
                      key="close"
                      type="primary"
                      onClick={() => setAutoGenModalOpen(false)}
                    >
                      ปิดหน้าต่าง
                    </Button>,
                  ]
                : null
          }
        >
          {genStep === "generating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin text-4xl text-blue-500 mb-4">
                <CloudServerOutlined />
              </div>
              <Typography.Text type="secondary">
                กำลังวิเคราะห์และสร้างรายการตำแหน่ง...
              </Typography.Text>
            </div>
          )}

          {genStep === "review" && (
            <div className="space-y-4">
              <Alert
                type="info"
                showIcon
                message="ตรวจสอบรายการตำแหน่ง"
                description="ระบบได้สร้างรายการตำแหน่ง Tech Standard ให้คุณแล้ว กรุณาตรวจสอบก่อนยืนยัน หากตำแหน่งใดมีอยู่แล้วระบบจะข้ามการสร้าง"
              />
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <Table
                  dataSource={candidatePositions}
                  pagination={false}
                  rowKey="name_th"
                  size="small"
                  columns={[
                    { title: "Position Name (TH)", dataIndex: "name_th" },
                    { title: "Position Name (EN)", dataIndex: "name_en" },
                    {
                      title: "Status",
                      dataIndex: "status",
                      width: 100,
                      render: (status) =>
                        status === "DUPLICATE" ? (
                          <Tooltip title="ตำแหน่งนี้มีอยู่แล้วในระบบ">
                            <Tag color="warning">Duplicate</Tag>
                          </Tooltip>
                        ) : (
                          <Tag color="success">Ready</Tag>
                        ),
                    },
                    {
                      title: "Action",
                      key: "action",
                      width: 60,
                      render: (_, r, idx) => (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteCandidate(idx)}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {(genStep === "executing" || genStep === "summary") && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="text-center">
                <Typography.Title level={4}>
                  {genStep === "executing"
                    ? "กำลังสร้างตำแหน่ง..."
                    : "ดำเนินการเสร็จสิ้น"}
                </Typography.Title>
                <Progress
                  percent={Math.round(
                    ((currentExecutionIndex + (genStep === "summary" ? 1 : 0)) /
                      candidatePositions.length) *
                      100,
                  )}
                  status={genStep === "summary" ? "success" : "active"}
                />
              </div>

              {/* Tracking List */}
              <div className="h-[300px] overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                <Steps
                  direction="vertical"
                  size="small"
                  current={currentExecutionIndex}
                  items={executionStatus.map((item, idx) => ({
                    title: item.name_th,
                    description:
                      item.execStatus === "skipped" ? (
                        "ข้าม (มีอยู่แล้ว)"
                      ) : item.execStatus === "error" ? (
                        <span className="text-red-500">เกิดข้อผิดพลาด</span>
                      ) : item.execStatus === "success" ? (
                        <span className="text-green-500">สร้างสำเร็จ</span>
                      ) : (
                        "รอการดำเนินการ"
                      ),
                    status:
                      item.execStatus === "pending"
                        ? "wait"
                        : item.execStatus === "success"
                          ? "finish"
                          : item.execStatus === "error"
                            ? "error" // finish for skipped too usually
                            : item.execStatus === "skipped"
                              ? "process"
                              : "wait",
                    icon:
                      item.execStatus === "pending" &&
                      idx === currentExecutionIndex ? (
                        <LoadingOutlined />
                      ) : item.execStatus === "skipped" ? (
                        <CheckCircleOutlined className="text-gray-400" />
                      ) : undefined,
                  }))}
                />
              </div>

              {genStep === "summary" && (
                <Alert
                  type="success"
                  showIcon
                  message="สรุปผลการดำเนินการ"
                  description={
                    <ul>
                      <li>
                        สร้างสำเร็จ:{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "success",
                          ).length
                        }{" "}
                        รายการ
                      </li>
                      <li>
                        ข้าม (มีอยู่แล้ว):{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "skipped",
                          ).length
                        }{" "}
                        รายการ
                      </li>
                      <li>
                        ผิดพลาด:{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "error",
                          ).length
                        }{" "}
                        รายการ
                      </li>
                    </ul>
                  }
                />
              )}
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
