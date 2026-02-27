"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Alert,
  Button,
  Card,
  Col,
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
  };

  const handleDeleteCandidate = (index: number) => {
    const newCandidates = [...candidateDepartments];
    newCandidates.splice(index, 1);
    setCandidateDepartments(newCandidates);
  };

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

  // --- Columns ---
  const columns: ColumnsType<Department> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text) => <span className="text-gray-400">#{text}</span>,
    },
    {
      title: "ชื่อแผนก (TH)",
      dataIndex: "name_th",
      sorter: (a, b) => a.name_th.localeCompare(b.name_th),
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "ชื่อแผนก (EN)",
      dataIndex: "name_en",
      render: (text) => text || "-",
    },
    {
      title: "จำนวนพนักงาน",
      dataIndex: ["_count", "users"],
      align: "center",
      render: (count) => <Tag color="blue">{count || 0} คน</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      align: "center",
      render: (active) =>
        active ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="default">Inactive</Tag>
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
          title="จัดการแผนก (Department)"
          subTitle="บริหารจัดการแผนกและโครงสร้างองค์กร"
          extra={
            <Space>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                รีเฟรช
              </Button>
            </Space>
          }
        />

        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Row justify="space-between" align="middle" className="mb-4">
            <Col>
              <Input
                prefix={<SearchOutlined />}
                placeholder="ค้นหาชื่อแผนก..."
                style={{ width: 300, borderRadius: 8 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col>
              <Space>
                <Button
                  onClick={handleOpenAutoGen}
                  icon={<CloudServerOutlined />}
                  className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                >
                  เทมเพลตแผนกอัตโนมัติ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setModalMode("create");
                    form.resetFields();
                    form.setFieldsValue({ is_active: true });
                  }}
                >
                  เพิ่มแผนก
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={departments}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 15 }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={!!modalMode}
          title={modalMode === "create" ? "เพิ่มแผนกใหม่" : "แก้ไขแผนก"}
          onCancel={() => setModalMode(null)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name_th"
              label="ชื่อแผนก (TH)"
              rules={[{ required: true, message: "กรุณาระบุชื่อแผนก" }]}
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
                >
                  เปิดใช้งาน
                </Button>
                <Button
                  type={
                    !form.getFieldValue("is_active") ? "primary" : "default"
                  }
                  danger={!form.getFieldValue("is_active")}
                  onClick={() => form.setFieldValue("is_active", false)}
                >
                  ปิดใช้งาน
                </Button>
              </Button.Group>
            </Form.Item>

            <Space className="w-full justify-end mt-4">
              <Button onClick={() => setModalMode(null)}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleOutlined />}
              >
                บันทึก
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          title={
            <Space className="text-red-500">
              <ExclamationCircleOutlined /> ยืนยันการลบ
            </Space>
          }
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDelete}
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณต้องการลบแผนก <strong>{selectedDept?.name_th}</strong> หรือไม่?
          </p>
          <p className="text-xs text-gray-400">
            *ไม่สามารถลบแผนกที่มีพนักงานสังกัดอยู่ได้
          </p>
        </Modal>

        {/* Auto Gen Modal */}
        <Modal
          open={autoGenModalOpen}
          title={
            <Space>
              <CloudServerOutlined className="text-purple-500" />
              ระบบสร้างแผนกอัตโนมัติ (Department Generator)
            </Space>
          }
          width={700}
          onCancel={() => {
            if (genStep === "executing") return;
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
                      candidateDepartments.filter((c) => c.status === "READY")
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
              <div className="animate-spin text-4xl text-purple-500 mb-4">
                <CloudServerOutlined />
              </div>
              <Typography.Text type="secondary">
                กำลังวิเคราะห์และสร้างรายการแผนกมาตรฐาน...
              </Typography.Text>
            </div>
          )}

          {genStep === "review" && (
            <div className="space-y-4">
              <Alert
                type="info"
                showIcon
                message="ตรวจสอบรายการแผนก"
                description="ระบบได้สร้างรายการแผนกมาตรฐานให้คุณแล้ว หากแผนกใดมีอยู่แล้วระบบจะข้ามการสร้าง"
              />
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <Table
                  dataSource={candidateDepartments}
                  pagination={false}
                  rowKey="name_th"
                  size="small"
                  columns={[
                    { title: "ชื่อแผนก (TH)", dataIndex: "name_th" },
                    { title: "ชื่อแผนก (EN)", dataIndex: "name_en" },
                    {
                      title: "สถานะ",
                      dataIndex: "status",
                      width: 100,
                      render: (status) =>
                        status === "DUPLICATE" ? (
                          <Tag color="warning">มีอยู่แล้ว</Tag>
                        ) : (
                          <Tag color="success">พร้อมสร้าง</Tag>
                        ),
                    },
                    {
                      title: "จัดการ",
                      key: "action",
                      width: 60,
                      render: (_, _r, idx) => (
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
              <div className="text-center">
                <Typography.Title level={4}>
                  {genStep === "executing"
                    ? "กำลังส่งข้อมูล..."
                    : "ดำเนินการเสร็จสิ้น"}
                </Typography.Title>
                <Progress
                  percent={Math.round(
                    ((currentExecutionIndex + (genStep === "summary" ? 1 : 0)) /
                      candidateDepartments.length) *
                      100,
                  )}
                  status={genStep === "summary" ? "success" : "active"}
                  strokeColor="#722ed1"
                />
              </div>

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
                            ? "error"
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
                  message="สรุปผล"
                  description={
                    <Space size="large">
                      <span>
                        สำเร็จ:{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "success",
                          ).length
                        }
                      </span>
                      <span>
                        ข้าม:{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "skipped",
                          ).length
                        }
                      </span>
                      <span>
                        ล้มเหลว:{" "}
                        {
                          executionStatus.filter(
                            (i) => i.execStatus === "error",
                          ).length
                        }
                      </span>
                    </Space>
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
