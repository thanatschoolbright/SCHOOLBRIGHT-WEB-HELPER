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
  Select,
  Skeleton,
  Descriptions,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ProjectOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { categoryType } from "@data/timesheet.category.type";
import { getUserById, getUserData } from "@helpers/local_storage/user.storage";
import { UserProfile } from "@/stores/type";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useRouter } from "next/navigation";

// ประกาศ interface สำหรับข้อมูลโปรเจค
interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  by: number;
  createdBy: number;
  categoryType: string;
  status: string;
}

interface ProjectForm {
  id?: number;
  name: string;
  description: string;
  by: number;
  categoryType: string;
  status: string;
}

export default function Page() {
  const router = useRouter();
  const [antdForm] = Form.useForm();
  // ใช้ Redux store สำหรับข้อมูล authentication
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const [limit, setLimit] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "" | "create" | "edit" | "delete" | "detail"
  >("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [formState, setFormState] = useState<
    ProjectForm & { confirmText?: string }
  >({
    name: "",
    description: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
    categoryType: "",
    status: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // ฟังก์ชันโหลดข้อมูลโปรเจค
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit,
        page: currentPage,
      });
      const data = response.data;
      setProjects(data.data || []);
      setTotalItems(data.pagination?.total || 0);
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
      setActionLoading(true);
      const response = await axios.post(
        `/api/v1/timesheet/project/insert/`,
        project
      );
      toast.success("สร้าง/อัปเดต ข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("สร้าง/อัปเดต ข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันลบโปรเจค
  const deleteProject = async (id: number) => {
    try {
      const response = await axios.post(`/api/v1/timesheet/project/delete/`, {
        id,
        by: AUTHENTICATION.response.data.user_data.admin_id,
      });
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  // โหลดข้อมูลโปรเจคเมื่อเปลี่ยนหน้า หรือ limit
  useEffect(() => {
    fetchProjects();
  }, [currentPage, limit]);

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
      categoryType: "",
      status: "open",
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
      categoryType: project.categoryType,
      status: project.status,
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
    categoryType: string;
  }) => {
    if (!values.name.trim()) return;
    await createOrUpdateProject({
      ...formState,
      name: values.name,
      description: values.description,
      categoryType: values.categoryType,
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
  const columns: ColumnsType<Project> = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      render: (_: any, __: any, idx: number) =>
        idx + 1 + (currentPage - 1) * limit,
      width: 80,
    },
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      align: "left" as const,
      sorter: (a: Project, b: Project) => a.name.localeCompare(b.name),
      filterSearch: true,
      onFilter: (value, record) => record.name === String(value),
      filters: Array.from(new Set(projects.map((p) => p.name))).map((name) => ({
        text: name,
        value: String(name),
      })),
      render: (text: string) => <Typography.Text>{text}</Typography.Text>,
    },

    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      align: "left" as const,
      sorter: (a: Project, b: Project) =>
        (a.description || "").localeCompare(b.description || ""),
      render: (text: string) =>
        text ? (
          <Typography.Text type="secondary">{text}</Typography.Text>
        ) : (
          <Tag color="default">-</Tag>
        ),
    },
    {
      title: "ประเภทโครงการ",
      dataIndex: "categoryType",
      key: "categoryType",
      align: "center" as const,
      filters: categoryType.map((data) => ({
        text: data.name,
        value: String(data.id),
      })),
      onFilter: (value, record) => record.categoryType === String(value),
      sorter: (a: Project, b: Project) =>
        a.categoryType.localeCompare(b.categoryType),
      render: (text: string) => {
        const category = categoryType.find((c) => c.id === text);
        return category ? (
          <Tag color="blue">{category.name}</Tag>
        ) : (
          <Tag color="default">ไม่ระบุ</Tag>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (text: string) => {
        const isOpen = text === "open";
        return (
          <Tag
            icon={isOpen ? <CheckCircleOutlined /> : <StopOutlined />}
            color={isOpen ? "success" : "error"}
            bordered={false}
            style={{
              fontSize: "13px",
              padding: "4px 12px",
              borderRadius: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
            }}
          >
            {isOpen ? "เปิดโครงการ" : "ปิดโครงการ"}
          </Tag>
        );
      },
    },
    {
      title: "จำนวนโครงการย่อย",
      dataIndex: "subProjectCount",
      key: "subProjectCount",
      align: "center" as const,
      render: (_: any, record: any) => {
        const features = Array.isArray(record.features) ? record.features : [];
        // Count features that are not marked deleted
        const count = features.filter((f: any) => !f?.is_deleted).length;
        return <Tag color="green">{count}</Tag>;
      },
    },
    {
      title: "สร้างเมื่อ",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center" as const,
      sorter: (a: Project, b: Project) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text: string) => convertToThaiDateDDMMYYY(text),
    },
    {
      title: "แก้ไขล่าสุด",
      dataIndex: "updatedAt",
      key: "updatedAt",
      align: "center" as const,
      sorter: (a: Project, b: Project) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (text: string) => convertToThaiDateDDMMYYY(text),
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

  // ยกเลิก Spin loading เต็มหน้า, ใช้ Skeleton ใน Card แทน

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Projects"
          subTitle="จัดการโครงการ Timesheet"
          icon={<ProjectOutlined />}
          color="none"
        />
        <div className="w-full space-y-4">
          <div className="w-full flex justify-end gap-4">
            {/* ปุ่มดู Project Timeline */}
            <Button
              type="link"
              icon={<ArrowRightOutlined />}
              size="large"
              onClick={() => router.push("/timesheet/timeline")}
              style={{ minWidth: 160 }}
            >
              ดู Project Timeline
            </Button>

            {/* ปุ่มเพิ่มโครงการใหม่ */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreateModal}
              style={{ minWidth: 160 }}
            >
              เพิ่มโครงการใหม่
            </Button>
          </div>

          {/* Card รายการโครงการ */}
          <Card title="รายการโครงการ" className="w-full">
            {/* ตารางโครงการ */}
            <Skeleton active loading={loading}>
              <Table
                columns={columns}
                dataSource={projects}
                rowKey="id"
                pagination={{
                  current: currentPage,
                  pageSize: limit,
                  total: totalItems,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    if (typeof pageSize === "number") {
                      setLimit(pageSize);
                    }
                  },
                }}
                locale={{
                  emptyText: "ไม่พบข้อมูลโปรเจค",
                }}
              />
            </Skeleton>
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
                categoryType: formState.categoryType,
                status: formState.status,
              }}
              onFinish={handleSubmit}
            >
              <Form.Item
                label="ชื่อโครงการ"
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
              <Form.Item label="คำอธิบายโครงการ" name="description">
                <Input
                  placeholder="กรอกคำอธิบายโครงการ (ถ้ามี)"
                  prefix={<EditOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="ประเภทโครงการ"
                name="categoryType"
                rules={[{ required: true, message: "กรุณาเลือกประเภทโครงการ" }]}
              >
                <Select
                  showSearch
                  placeholder="เลือกประเภทโครงการ"
                  options={categoryType.map((data) => ({
                    label: `${data.name} (${data.id})`,
                    value: String(data.id),
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="สถานะ"
                name="status"
                rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
              >
                <Select
                  showSearch
                  placeholder="เลือกสถานะ"
                  options={[
                    { label: "เปิดโครงการ", value: "open" },
                    { label: "ปิดโครงการ", value: "close" },
                  ]}
                />
              </Form.Item>
              <Form.Item>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={() => setModalType("")}>ยกเลิก</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                    disabled={actionLoading}
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
              <div className="mt-4">
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="ชื่อโครงการ">
                    {detailProject.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="คำอธิบาย">
                    {detailProject.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="สร้างโดย (ID)">
                    {getUserById(detailProject.createdBy)?.firstname}{" "}
                    {getUserById(detailProject.createdBy)?.lastname}
                  </Descriptions.Item>
                  <Descriptions.Item label="สร้างเมื่อ">
                    {convertToThaiDateDDMMYYY(detailProject.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="แก้ไขล่าสุด">
                    {convertToThaiDateDDMMYYY(detailProject.updatedAt)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
