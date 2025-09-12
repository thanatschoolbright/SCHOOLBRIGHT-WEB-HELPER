// ใช้ client side
"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import Link from "next/link";
import Swal from "sweetalert2";
// นำเข้า Ant Design Components
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Space,
  Tag,
  Spin,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

// ประกาศ interface สำหรับข้อมูลโปรเจค
interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  by: number;
  createdBy: number;
}

interface ProjectForm {
  id?: number;
  name: string;
  description: string;
  by: number;
}

export default function Page() {
  const [antdForm] = Form.useForm();
  // ใช้ Redux store สำหรับข้อมูล authentication
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const limit = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "" | "create" | "edit" | "delete" | "detail"
  >("");
  const [formState, setFormState] = useState<
    ProjectForm & { confirmText?: string }
  >({
    name: "",
    description: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // ฟังก์ชันโหลดข้อมูลโปรเจค
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit, page: currentPage }),
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.data || []);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      setProjects([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสร้างหรือแก้ไขโปรเจค
  const createOrUpdateProject = async (project: ProjectForm) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error("Failed to create or update project");
      toast.success("สร้าง/อัปเดต ข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("สร้าง/อัปเดต ข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  // ฟังก์ชันลบโปรเจค
  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        }),
      });
      if (!res.ok) throw new Error("Failed to delete project");
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  // โหลดข้อมูลโปรเจคเมื่อเปลี่ยนหน้า
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ตรวจสอบสิทธิ์การเข้าถึง
  useEffect(() => {
    const role = AUTHENTICATION?.response?.data?.user_data?.position;
    if (!role) return;
    if (role.trim().toLowerCase() !== "admin") {
      Swal.fire({
        icon: "warning",
        title: "ต้องการรหัสผ่าน",
        input: "text",
        inputLabel: "กรอกรหัสเพื่อเข้าถึง",
        inputPlaceholder: "พิมพ์รหัสที่นี่",
        confirmButtonText: "ยืนยัน",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
      }).then((result) => {
        if (result.isConfirmed && result.value !== "NARIN") {
          window.location.href = "/";
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AUTHENTICATION]);

  // เมื่อเปิด modal สร้างโปรเจค
  const openCreateModal = () => {
    setFormState({
      name: "",
      description: "",
      by: AUTHENTICATION.response.data.user_data.admin_id,
      confirmText: "",
    });
    setModalType("create");
  };

  // เมื่อเปิด modal แก้ไขโปรเจค
  const openEditModal = (project: Project) => {
    setFormState({
      id: project.id,
      name: project.name,
      description: project.description,
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModalType("edit");
  };

  // เมื่อเปิด modal ลบโปรเจค
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setFormState((prev) => ({ ...prev, confirmText: "" }));
    setModalType("delete");
  };

  // เมื่อเปิด modal ดูรายละเอียดโปรเจค
  const openDetailModal = (project: Project) => {
    setDetailProject(project);
    setModalType("detail");
  };

  // ฟังก์ชัน submit สำหรับสร้าง/แก้ไขโปรเจค
  const handleSubmit = async (values: {
    name: string;
    description: string;
  }) => {
    if (!values.name.trim()) return;
    await createOrUpdateProject({
      ...formState,
      name: values.name,
      description: values.description,
    });
    setModalType("");
    await fetchProjects();
  };

  // ฟังก์ชันยืนยันลบโปรเจค
  const confirmDelete = async () => {
    if (deleteId === null) return;
    await deleteProject(deleteId);
    setModalType("");
    setDeleteId(null);
    await fetchProjects();
  };

  // กำหนด columns สำหรับตารางโปรเจค
  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      align: "center" as const,
      render: (_: any, __: any, idx: number) =>
        idx + 1 + (currentPage - 1) * limit,
      width: 80,
    },
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      align: "left" as const,
      render: (text: string) => <Typography.Text>{text}</Typography.Text>,
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      align: "left" as const,
      render: (text: string) =>
        text ? (
          <Typography.Text type="secondary">{text}</Typography.Text>
        ) : (
          <Tag color="default">-</Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: Project) => (
        <Space>
          <Button
            icon={<InfoCircleOutlined />}
            onClick={() => openDetailModal(record)}
            aria-label="View Details"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            aria-label="Edit Project"
            type="primary"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => openDeleteModal(record.id)}
            aria-label="Delete Project"
          />
          <Link href={`/timesheet/project/sub-project/${record.id}`}>
            <Button
              icon={<ArrowRightOutlined />}
              aria-label="Go to Sub Project"
              type="default"
            />
          </Link>
        </Space>
      ),
    },
  ];

  // แสดง loading ขณะโหลดข้อมูล
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="กำลังโหลด...">
            <div style={{ height: 100, width: 100 }} />
          </Spin>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* ปุ่มเพิ่มโปรเจค */}
        <div className="w-full flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateModal}
            style={{ minWidth: 160 }}
          >
            เพิ่มโปรเจค
          </Button>
        </div>

        {/* Card รายการโปรเจค */}
        <Card title="รายการโปรเจค" className="w-full">
          {/* ตารางโปรเจค */}
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: limit,
              total: totalItems,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
            }}
            locale={{
              emptyText: "ไม่พบข้อมูลโปรเจค",
            }}
          />
        </Card>

        {/* Modal สร้าง/แก้ไขโปรเจค */}
        <Modal
          open={modalType === "create" || modalType === "edit"}
          onCancel={() => setModalType("")}
          title={formState.id ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"}
          footer={null}
          destroyOnHidden
        >
          {/* ฟอร์มโปรเจค */}
          <Form
            form={antdForm}
            layout="vertical"
            initialValues={{
              name: formState.name,
              description: formState.description,
            }}
            onFinish={handleSubmit}
          >
            <Form.Item
              label="ชื่อโปรเจค"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}
            >
              <Input
                placeholder="กรอกชื่อโปรเจค"
                prefix={<InfoCircleOutlined />}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item label="คำอธิบายโปรเจค" name="description">
              <Input
                placeholder="กรอกคำอธิบายโปรเจค"
                prefix={<EditOutlined />}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Form.Item>
            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setModalType("")}>ยกเลิก</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                >
                  บันทึก
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal ยืนยันลบโปรเจค */}
        <Modal
          open={modalType === "delete"}
          onCancel={() => setModalType("")}
          title="ยืนยันการลบ"
          onOk={confirmDelete}
          okText="ลบ"
          okType="danger"
          cancelText="ยกเลิก"
          okButtonProps={{
            disabled: formState.confirmText !== "Delete",
          }}
          destroyOnHidden
        >
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="danger" strong>
              คุณต้องการยืนยันที่จะลบโปรเจคนี้จริงหรือไม่
            </Typography.Text>
            <br />
            <Typography.Text>
              โปรดพิมพ์ <b style={{ color: "#f5222d" }}>Delete</b> เพื่อยืนยัน
            </Typography.Text>
            <Input
              style={{ marginTop: 10 }}
              placeholder="พิมพ์ Delete เพื่อยืนยัน"
              value={formState.confirmText}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
            />
          </div>
        </Modal>

        {/* Modal รายละเอียดโปรเจค */}
        <Modal
          open={modalType === "detail" && !!detailProject}
          onCancel={() => {
            setModalType("");
            setDetailProject(null);
          }}
          title="รายละเอียดโปรเจค"
          footer={[
            <Button
              key="close"
              onClick={() => {
                setModalType("");
                setDetailProject(null);
              }}
            >
              ปิด
            </Button>,
          ]}
          destroyOnHidden
        >
          {detailProject && (
            <div className="space-y-3 mt-2">
              <Typography.Paragraph>
                <strong>ชื่อโปรเจค:</strong> {detailProject.name}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>คำอธิบาย:</strong> {detailProject.description}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>สร้างโดย (id):</strong> {detailProject.createdBy}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>สร้างเมื่อ:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.createdAt)}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>แก้ไขล่าสุด:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.updatedAt)}
              </Typography.Paragraph>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
