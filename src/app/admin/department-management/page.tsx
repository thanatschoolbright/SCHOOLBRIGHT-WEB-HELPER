"use client";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  CloseOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
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
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Department Type
interface Department {
  id: number;
  name_th: string;
  name_en?: string;
  is_active: boolean;
  _count?: {
    users: number; // For showing how many users are in this department
  };
}

const DEFAULT_DEPARTMENTS = [
  { name_th: "บริหารงานทั่วไป", name_en: "General Administration" },
  { name_th: "เทคโนโลยีสารสนเทศ", name_en: "Information Technology" },
  { name_th: "ทรัพยากรบุคคล", name_en: "Human Resources" },
  { name_th: "บัญชีและการเงิน", name_en: "Accounting and Finance" },
  { name_th: "การตลาด", name_en: "Marketing" },
  { name_th: "ฝ่ายขาย", name_en: "Sales" },
  { name_th: "พัฒนาผลิตภัณฑ์", name_en: "Product Development" },
  { name_th: "วิศวกรรม", name_en: "Engineering" },
  { name_th: "ประกันคุณภาพ", name_en: "Quality Assurance" },
  { name_th: "บริการลูกค้า", name_en: "Customer Service" },
  { name_th: "วิจัยและพัฒนา", name_en: "Research and Development" },
  { name_th: "ฝ่ายปฏิบัติการ", name_en: "Operations" },
];

export default function DepartmentManagementPage() {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
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
  const [candidateDepartments, setCandidateDepartments] = useState<any[]>([]);
  const [executionStatus, setExecutionStatus] = useState<any[]>([]);
  const [currentExecutionIndex, setCurrentExecutionIndex] = useState(0);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/admin/department-management/read", {
        params: { search, limit: 100 },
      });
      setDepartments(res?.data?.data?.items || []);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลแผนกได้");
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
      const candidates = DEFAULT_DEPARTMENTS.map((dept) => {
        const exists = departments.some((d) => d.name_th === dept.name_th);
        return {
          ...dept,
          status: exists ? "DUPLICATE" : "READY",
        };
      });
      setCandidateDepartments(candidates);
      setGenStep("review");
    }, 1200);
  };

  const handleConfirmAutoGen = async () => {
    setGenStep("executing");
    setExecutionStatus(
      candidateDepartments.map((c) => ({ ...c, execStatus: "pending" })),
    );
    setCurrentExecutionIndex(0);

    for (let i = 0; i < candidateDepartments.length; i++) {
      const item = candidateDepartments[i];
      setCurrentExecutionIndex(i);

      if (item.status === "DUPLICATE") {
        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = {
            ...item,
            execStatus: "skipped",
            message: "Already exists",
          };
          return next;
        });
        await new Promise((r) => setTimeout(r, 150));
        continue;
      }

      try {
        await new Promise((r) => setTimeout(r, 400));
        await axios.post("/api/v2/admin/department-management/create", {
          name_th: item.name_th,
          name_en: item.name_en,
          is_active: true,
        });

        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = { ...item, execStatus: "success" };
          return next;
        });
      } catch (err) {
        setExecutionStatus((prev) => {
          const next = [...prev];
          next[i] = { ...item, execStatus: "error" };
          return next;
        });
      }
    }

    setGenStep("summary");
    fetchData();
    setStatusModal({
      open: true,
      type: "success",
      title: "ดำเนินการสำเร็จ",
      message: "ระบบได้ทำการสร้างแผนกจากเทมเพลตเรียบร้อยแล้ว",
    });
  };

  /**
   * ลบรายการ candidate ออกจากรายการที่จะสร้าง
   * @param index ลำดับของรายการ
   */
  const handleDeleteCandidate = (index: number) => {
    const newCandidates = [...candidateDepartments];
    newCandidates.splice(index, 1);
    setCandidateDepartments(newCandidates);
  };

  /**
   * บันทึกข้อมูลแผนก (สร้างใหม่ หรือ แก้ไข)
   * @param values ข้อมูลจากฟอร์ม
   */
  const handleSubmit = async (values: any) => {
    try {
      if (modalMode === "create") {
        await axios.post("/api/v2/admin/department-management/create", values);
        toast.success("สร้างแผนกสำเร็จ");
      } else {
        await axios.post("/api/v2/admin/department-management/update", {
          ...values,
          id: selectedDept?.id,
        });
        toast.success("แก้ไขแผนกสำเร็จ");
      }
      setModalMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message_th || "เกิดข้อผิดพลาด");
    }
  };

  /**
   * ลบแผนก
   */
  const handleDelete = async () => {
    if (!selectedDept) return;
    try {
      await axios.post("/api/v2/admin/department-management/delete", {
        id: selectedDept.id,
      });
      toast.success("ลบแผนกเรียบร้อยแล้ว");
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
  const columns: ColumnsType<Department> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text) => (
        <span style={{ color: token.colorTextDescription }}>#{text}</span>
      ),
    },
    {
      title: "ชื่อแผนก (TH)",
      dataIndex: "name_th",
      sorter: (a, b) => a.name_th.localeCompare(b.name_th),
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "ชื่อแผนก (EN)",
      dataIndex: "name_en",
      sorter: (a, b) => (a.name_en || "").localeCompare(b.name_en || ""),
      render: (text) => text || "-",
    },
    {
      title: "จำนวนพนักงาน",
      dataIndex: ["_count", "users"],
      align: "center",
      sorter: (a, b) => (a._count?.users || 0) - (b._count?.users || 0),
      render: (count) => <Tag color="blue">{count || 0} คน</Tag>,
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
            icon={<EditOutlined style={{ color: token.colorWarning }} />}
            onClick={() => {
              setSelectedDept(r);
              setModalMode("edit");
              form.setFieldsValue(r);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={r._count?.users ? r._count.users > 0 : false}
            onClick={() => {
              setSelectedDept(r);
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
          icon={<ApartmentOutlined />}
          title="จัดการแผนก"
          subTitle="บริหารจัดการแผนกและโครงสร้างองค์กร"
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
              title="จำนวนแผนกทั้งหมด"
              value={departments.length}
              unit="รายการ"
              icon={<ApartmentOutlined />}
              color={token.colorPrimary}
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <SummaryCard
              title="แผนกที่เปิดใช้งาน"
              value={departments.filter((d) => d.is_active).length}
              unit="รายการ"
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <SummaryCard
              title="พนักงานรวมทุกแผนก"
              value={departments.reduce(
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
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 32,
          }}
          styles={{ body: { padding: 24 } }}
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
              <Form.Item label="ค้นหาชื่อแผนก" style={{ marginBottom: 0 }}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="เช่น ฝ่ายบริหาร, IT..."
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
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          styles={{ body: { padding: 24 } }}
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
                รายการแผนกทั้งหมด
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
                เทมเพลตแผนกอัตโนมัติ
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  setModalMode("create");
                  form.resetFields();
                  form.setFieldsValue({ is_active: true });
                }}
              >
                เพิ่มแผนก
              </Button>
            </Space>
          </Flex>

          <Table
            columns={columns}
            dataSource={departments}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              style: { marginTop: 24 },
            }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={!!modalMode}
          title={modalMode === "create" ? "เพิ่มแผนกใหม่" : "แก้ไขแผนก"}
          onCancel={() => setModalMode(null)}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name_th"
              label="ชื่อแผนก (TH)"
              rules={[{ required: true, message: "กรุณาระบุชื่อแผนกภาษาไทย" }]}
            >
              <Input placeholder="เช่น ฝ่ายทรัพยากรบุคคล" />
            </Form.Item>
            <Form.Item name="name_en" label="ชื่อแผนก (EN)">
              <Input placeholder="e.g. Human Resources" />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="สถานะการใช้งาน"
              valuePropName="checked"
            >
              <Button.Group>
                <Button
                  type={form.getFieldValue("is_active") ? "primary" : "default"}
                  onClick={() => form.setFieldValue("is_active", true)}
                  icon={<CheckOutlined />}
                >
                  เปิดใช้งาน
                </Button>
                <Button
                  type={
                    !form.getFieldValue("is_active") ? "primary" : "default"
                  }
                  danger={!form.getFieldValue("is_active")}
                  onClick={() => form.setFieldValue("is_active", false)}
                  icon={<CloseOutlined />}
                >
                  ปิดใช้งาน
                </Button>
              </Button.Group>
            </Form.Item>

            <Flex justify="end" gap={12} style={{ marginTop: 24 }}>
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
          title="ยืนยันการลบแผนก"
          message={`คุณต้องการลบแผนก "${selectedDept?.name_th}" หรือไม่? การดำเนินการนี้ไม่สามารถเรียกคืนได้ และแผนกต้องไม่มีพนักงานสังกัดอยู่`}
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
          title={
            <Space align="center" size={12}>
              <CloudServerOutlined
                style={{ fontSize: "1.2rem", color: token.colorPrimary }}
              />
              <Typography.Text strong style={{ fontSize: "1.1rem" }}>
                สร้างแผนกจากเทมเพลตมาตรฐาน
              </Typography.Text>
            </Space>
          }
          open={autoGenModalOpen}
          onCancel={() => {
            if (genStep !== "executing") setAutoGenModalOpen(false);
          }}
          width={800}
          footer={
            genStep === "review" ? (
              <Flex justify="end" gap={12}>
                <Button onClick={() => setAutoGenModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  onClick={handleConfirmAutoGen}
                  disabled={candidateDepartments.length === 0}
                  icon={<CloudServerOutlined />}
                  size="large"
                >
                  เริ่มสร้างแผนก (
                  {
                    candidateDepartments.filter((c) => c.status === "READY")
                      .length
                  }{" "}
                  รายการ )
                </Button>
              </Flex>
            ) : genStep === "summary" ? (
              <Button
                type="primary"
                onClick={() => setAutoGenModalOpen(false)}
                size="large"
              >
                เสร็จสิ้น
              </Button>
            ) : null
          }
          closable={genStep !== "executing"}
          maskClosable={genStep !== "executing"}
        >
          {genStep === "generating" && (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "3rem",
                  color: token.colorPrimary,
                  marginBottom: 24,
                }}
              >
                <CloudServerOutlined className="animate-spin" />
              </div>
              <Typography.Text type="secondary" style={{ fontSize: "1.1rem" }}>
                กำลังวิเคราะห์และสร้างรายการแผนกมาตรฐาน...
              </Typography.Text>
            </div>
          )}

          {genStep === "review" && (
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: token.colorInfoBg,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: `1px solid ${token.colorInfoBorder}`,
                }}
              >
                <Typography.Text style={{ color: token.colorInfoText }}>
                  ระบบจะตรวจสอบรายชื่อแผนกมาตรฐานและข้ามรายการที่ซ้ำกับข้อมูลปัจจุบันของคุณ
                  คุณสามารถลบบางรายการที่ไม่ต้องการได้ก่อนกดยืนยัน
                </Typography.Text>
              </div>

              <Table
                size="small"
                dataSource={candidateDepartments}
                rowKey="name_th"
                pagination={false}
                scroll={{ y: 350 }}
                columns={[
                  {
                    title: "ชื่อแผนก (TH)",
                    dataIndex: "name_th",
                    render: (t) => (
                      <Typography.Text strong>{t}</Typography.Text>
                    ),
                  },
                  { title: "ชื่อแผนก (EN)", dataIndex: "name_en" },
                  {
                    title: "ตรวจสอบ",
                    dataIndex: "status",
                    width: 120,
                    render: (s) =>
                      s === "DUPLICATE" ? (
                        <Tag
                          color="warning"
                          icon={<ExclamationCircleOutlined />}
                        >
                          ซ้ำ
                        </Tag>
                      ) : (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          ใหม่
                        </Tag>
                      ),
                  },
                  {
                    title: "ลบ",
                    align: "center",
                    width: 60,
                    render: (_, __, i) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCandidate(i)}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}

          {(genStep === "executing" || genStep === "summary") && (
            <div style={{ padding: "16px 0" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Typography.Title level={4}>
                  {genStep === "executing"
                    ? "กำลังดำเนินการ..."
                    : "ดำเนินการเสร็จสิ้น"}
                </Typography.Title>
                <Progress
                  percent={Math.round(
                    ((currentExecutionIndex + (genStep === "summary" ? 1 : 0)) /
                      candidateDepartments.length) *
                      100,
                  )}
                  status={genStep === "summary" ? "success" : "active"}
                  strokeColor={{
                    "0%": token.colorPrimary,
                    "100%": token.colorSuccess,
                  }}
                  strokeWidth={12}
                />
              </div>

              <div
                style={{
                  height: 300,
                  overflowY: "auto",
                  backgroundColor: token.colorFillAlter,
                  padding: 24,
                  borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  marginBottom: 24,
                }}
              >
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
                        <span style={{ color: token.colorError }}>
                          เกิดข้อผิดพลาด
                        </span>
                      ) : item.execStatus === "success" ? (
                        <span style={{ color: token.colorSuccess }}>
                          สร้างสำเร็จ
                        </span>
                      ) : (
                        "รอการดำเนินการ"
                      ),
                    status:
                      item.execStatus === "pending"
                        ? "wait"
                        : item.execStatus === "success"
                          ? "finish"
                          : item.execStatus === "error"
                            ? "error"
                            : item.execStatus === "skipped"
                              ? "finish"
                              : "wait",
                  }))}
                />
              </div>

              {genStep === "summary" && (
                <div
                  style={{
                    padding: 16,
                    backgroundColor: token.colorSuccessBg,
                    border: `1px solid ${token.colorSuccessBorder}`,
                    borderRadius: 12,
                  }}
                >
                  <Flex justify="space-around" align="center">
                    <Typography.Text
                      strong
                      style={{ color: token.colorSuccessText }}
                    >
                      สำเร็จ:{" "}
                      {
                        executionStatus.filter(
                          (i) => i.execStatus === "success",
                        ).length
                      }
                    </Typography.Text>
                    <Typography.Text
                      strong
                      style={{ color: token.colorWarningText }}
                    >
                      ข้าม:{" "}
                      {
                        executionStatus.filter(
                          (i) => i.execStatus === "skipped",
                        ).length
                      }
                    </Typography.Text>
                    <Typography.Text
                      strong
                      style={{ color: token.colorErrorText }}
                    >
                      ล้มเหลว:{" "}
                      {
                        executionStatus.filter((i) => i.execStatus === "error")
                          .length
                      }
                    </Typography.Text>
                  </Flex>
                </div>
              )}
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
