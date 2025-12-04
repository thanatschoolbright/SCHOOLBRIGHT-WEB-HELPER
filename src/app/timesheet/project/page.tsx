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
  Tooltip,
  Badge,
  DatePicker,
  Row,
  Col,
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
  CalendarOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { categoryType } from "@data/timesheet.category.type";
import { getUserById, getUserData } from "@helpers/local_storage/user.storage";
import { UserProfile } from "@/stores/type";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useRouter } from "next/navigation";

// ประกาศ interface สำหรับข้อมูลโครงการ
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
  name_en?: string;
  description: string;
  by: number;
  categoryType: string;
  status: string;
  start_date?: Date;
  end_date?: Date;
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

  // ฟังก์ชันโหลดข้อมูลโครงการ
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

  // ฟังก์ชันสร้างหรือแก้ไขโครงการ
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

  // ฟังก์ชันลบโครงการ
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

  // โหลดข้อมูลโครงการเมื่อเปลี่ยนหน้า หรือ limit
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
        if (result.isConfirmed && result.value !== "LIGHT") {
          window.location.href = "/";
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AUTHENTICATION]);

  // เมื่อเปิด modal สร้างโครงการ
  const openCreateModal = () => {
    setFormState({
      name: "",
      name_en: "",
      description: "",
      by: AUTHENTICATION.response.data.user_data.admin_id,
      confirmText: "",
      categoryType: "",
      status: "open",
      start_date: new Date(),
      end_date: new Date(),
    });
    setModalType("create");
  };

  // เมื่อเปิด modal แก้ไขโครงการ
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

  // เมื่อเปิด modal ลบโครงการ
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setFormState((prev) => ({ ...prev, confirmText: "" }));
    setModalType("delete");
  };

  // เมื่อเปิด modal ดูรายละเอียดโครงการ
  const openDetailModal = (project: Project) => {
    setDetailProject(project);
    setModalType("detail");
  };

  // ฟังก์ชัน submit สำหรับสร้าง/แก้ไขโครงการ
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

  // ฟังก์ชันยืนยันลบโครงการ
  const confirmDelete = async () => {
    if (deleteId === null) return;
    await deleteProject(deleteId);
    setModalType("");
    setDeleteId(null);
    await fetchProjects();
  };

  // กำหนด columns สำหรับตารางโครงการ
  const columns: ColumnsType<Project> = [
    {
      title: (
        <Space>
          <NumberOutlined />
          ลำดับ
        </Space>
      ),
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      width: 90,
      render: (_: any, __: any, idx: number) => (
        <span style={{ fontWeight: 600, color: "#8c8c8c" }}>
          {idx + 1 + (currentPage - 1) * limit}
        </span>
      ),
    },
    {
      title: "รหัสโครงการ",
      dataIndex: "id",
      key: "id",
      align: "center" as const,
      width: 120,
      sorter: (a: Project, b: Project) => a.id - b.id,
      render: (text: number) => (
        <Tag
          color="cyan"
          style={{
            borderRadius: "14px",
            padding: "4px 18px",
            fontWeight: 700,
            fontSize: "1.15em",
            letterSpacing: "0.15em",
            border: "1.5px solid #13c2c2",
            background: "linear-gradient(90deg, #e6fffb 0%, #b5f5ec 100%)",
            color: "#08979c",
            boxShadow: "0 2px 8px 0 #b5f5ec55",
            fontFamily: "Fira Mono, Menlo, monospace",
          }}
        >
          {text.toString().padStart(4, "0")}
        </Tag>
      ),
    },
    {
      title: "ชื่อโครงการ",
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
      render: (text: string) => (
        <Space>
          <div
            style={{
              backgroundColor: "#e6f7ff",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #91d5ff",
            }}
          >
            <ProjectOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
          </div>
          <Typography.Text strong style={{ fontSize: "15px" }}>
            {text}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      align: "left" as const,
      width: 250,
      sorter: (a: Project, b: Project) =>
        (a.description || "").localeCompare(b.description || ""),
      render: (text: string) =>
        text ? (
          <Typography.Paragraph
            ellipsis={{ rows: 2, tooltip: true }}
            style={{ margin: 0, color: "#595959", fontSize: "13px" }}
          >
            {text}
          </Typography.Paragraph>
        ) : (
          <Tag
            color="default"
            style={{
              border: "none",
              background: "transparent",
              color: "#bfbfbf",
            }}
          >
            -
          </Tag>
        ),
    },
    {
      title: "ประเภท",
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
          <Tag
            color="geekblue"
            style={{
              borderRadius: "12px",
              padding: "2px 10px",
              fontWeight: 500,
              border: "1px solid #adc6ff",
            }}
          >
            {category.name}
          </Tag>
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
      width: 140,
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
              fontWeight: 600,
              boxShadow: isOpen
                ? "0 2px 0 rgba(82, 196, 26, 0.1)"
                : "0 2px 0 rgba(255, 77, 79, 0.1)",
            }}
          >
            {isOpen ? "เปิด" : "ปิด"}
          </Tag>
        );
      },
    },
    {
      title: "Sub-Projects",
      dataIndex: "subProjectCount",
      key: "subProjectCount",
      align: "center" as const,
      render: (_: any, record: any) => {
        const features = Array.isArray(record.features) ? record.features : [];
        const count = features.filter((f: any) => !f?.is_deleted).length;
        return (
          <Badge
            count={count}
            showZero
            overflowCount={99}
            style={{ backgroundColor: "#52c41a", boxShadow: "0 0 0 1px #fff" }}
          />
        );
      },
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center" as const,
      sorter: (a: Project, b: Project) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text: string) => (
        <Space>
          <CalendarOutlined style={{ color: "#8c8c8c" }} />
          <Typography.Text style={{ fontSize: "13px", color: "#595959" }}>
            {convertToThaiDateDDMMYYY(text)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "แก้ไขล่าสุด",
      dataIndex: "updatedAt",
      key: "updatedAt",
      align: "center" as const,
      sorter: (a: Project, b: Project) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (text: string) => (
        <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
          {convertToThaiDateDDMMYYY(text)}
        </Typography.Text>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      width: 180,
      render: (_: any, record: Project) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              shape="circle"
              icon={<InfoCircleOutlined style={{ color: "#1890ff" }} />}
              onClick={() => openDetailModal(record)}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: "#faad14" }} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              shape="circle"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => openDeleteModal(record.id)}
            />
          </Tooltip>
          <Tooltip title="ไปยังโครงการย่อย">
            <Link href={`/timesheet/project/sub-project/${record.id}`}>
              <Button
                type="text"
                shape="circle"
                icon={<ArrowRightOutlined style={{ color: "#52c41a" }} />}
              />
            </Link>
          </Tooltip>
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
                  emptyText: "ไม่พบข้อมูลโครงการ",
                }}
              />
            </Skeleton>
          </Card>

          {/* Modal สร้าง/แก้ไขโครงการ */}
          <Modal
            open={modalType === "create" || modalType === "edit"}
            onCancel={() => setModalType("")}
            title={formState.id ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"}
            footer={null}
            destroyOnHidden
            width={800} // 1. เพิ่มความกว้าง Modal เพื่อให้จัด 2 คอลัมน์ได้สวยไม่อึดอัด
            centered // จัดกึ่งกลางหน้าจอ
          >
            <Form
              form={antdForm}
              layout="vertical"
              initialValues={{
                name: formState.name,
                name_en: formState.name_en, // อย่าลืมใส่ initialValue ของ name_en
                description: formState.description,
                categoryType: formState.categoryType,
                status: formState.status,
                // start_date และ end_date ควรจัดการ format ให้เป็น dayjs object ก่อนส่งเข้า initialValues
              }}
              onFinish={handleSubmit}
            >
              {/* แถวที่ 1: ชื่อโครงการ (ไทย - อังกฤษ) */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ชื่อโครงการ (TH)"
                    name="name"
                    rules={[
                      { required: true, message: "กรุณากรอกชื่อโครงการ" },
                    ]}
                  >
                    <Input
                      placeholder="ชื่อโครงการภาษาไทย"
                      prefix={
                        <InfoCircleOutlined className="site-form-item-icon" />
                      }
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ชื่อโครงการ (EN)"
                    name="name_en"
                    rules={[
                      {
                        required: true,
                        message: "กรุณากรอกชื่อโครงการ (ภาษาอังกฤษ)",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Project Name (English)"
                      prefix={
                        <InfoCircleOutlined className="site-form-item-icon" />
                      }
                      // แก้ไข logic: ต้อง set เป็น name_en ไม่ใช่ name
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          name_en: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* แถวที่ 2: ประเภทและสถานะ */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ประเภทโครงการ"
                    name="categoryType"
                    rules={[
                      { required: true, message: "กรุณาเลือกประเภทโครงการ" },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="เลือกประเภทโครงการ"
                      options={categoryType.map((data) => ({
                        label: `${data.name} (${data.id})`,
                        value: String(data.id),
                      }))}
                      onChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          categoryType: value,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="สถานะ"
                    name="status"
                    rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                  >
                    <Select
                      placeholder="เลือกสถานะ"
                      options={[
                        { label: "เปิดโครงการ", value: "open" },
                        { label: "ปิดโครงการ", value: "close" },
                      ]}
                      onChange={(value) =>
                        setFormState((prev) => ({ ...prev, status: value }))
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* แถวที่ 3: วันที่เริ่ม - สิ้นสุด */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="วันที่เปิดโครงการ" name="start_date">
                    <DatePicker
                      style={{ width: "100%" }} // DatePicker ต้องสั่ง width 100% ถึงจะเต็มช่อง
                      placeholder="วว/ดด/ปปปป"
                      format="DD/MM/YYYY"
                      onChange={(date) =>
                        setFormState((prev) => ({ ...prev, start_date: date }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="วันที่ปิดโครงการ" name="end_date">
                    <DatePicker
                      style={{ width: "100%" }}
                      placeholder="วว/ดด/ปปปป"
                      format="DD/MM/YYYY"
                      onChange={(date) =>
                        setFormState((prev) => ({ ...prev, end_date: date }))
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* แถวที่ 4: คำอธิบาย (เต็มบรรทัด) */}
              <Form.Item label="คำอธิบายโครงการ" name="description">
                <Input.TextArea
                  rows={4} // ใช้ TextArea แทน Input ธรรมดา เพื่อความสวยงาม
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับโครงการ..."
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "flex-end",
                    marginTop: 16,
                  }}
                >
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

          {/* Modal ยืนยันลบโครงการ */}
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
                คุณต้องการยืนยันที่จะลบโครงการนี้จริงหรือไม่
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

          {/* Modal รายละเอียดโครงการ */}
          <Modal
            open={modalType === "detail" && !!detailProject}
            onCancel={() => {
              setModalType("");
              setDetailProject(null);
            }}
            title="รายละเอียดโครงการ"
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
