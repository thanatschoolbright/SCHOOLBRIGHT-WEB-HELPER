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
import Loading from "@/components/loading/ant-loading-spin-component";
import axios from "axios";

// ประกาศ interface สำหรับข้อมูลโปรเจค
interface UserProfile {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  by: number;
  createdBy: number;
}

interface UserProfileForm {
  id?: number;
  name: string;
  description: string;
  by: number;
}

export default function Page() {
  const [antdForm] = Form.useForm();
  // ใช้ Redux store สำหรับข้อมูล authentication
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const [pageSize, setPageSize] = useState<number>(10);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "" | "create" | "edit" | "delete" | "detail"
  >("");
  const [formState, setFormState] = useState<
    UserProfileForm & { confirmText?: string }
  >({
    name: "",
    description: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);

  // ฟังก์ชันโหลดข้อมูลโปรเจค
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await axios.get("/api/v1/admin/user/");
      console.info("data", data?.data?.data?.data);
      setUsers(data?.data?.data?.data || []);
    } catch (error) {
      setUsers([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสร้างหรือแก้ไขโปรเจค
  const createOrUpdateUser = async (user: UserProfileForm) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Failed to create or update project");
      toast.success("สร้าง/อัปเดต ข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("สร้าง/อัปเดต ข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  // ฟังก์ชันลบโปรเจค
  const deleteUser = async (id: number) => {
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

  // โหลดข้อมูลโปรเจคเมื่อ mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const openCreateUserModal = () => {
    setFormState({
      name: "",
      description: "",
      by: AUTHENTICATION.response.data.user_data.admin_id,
      confirmText: "",
    });
    setModalType("create");
  };

  // เมื่อเปิด modal แก้ไขโปรเจค
  const openEditUserModal = (user: UserProfile) => {
    setFormState({
      id: user.id,
      name: user.name,
      description: user.description,
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModalType("edit");
  };

  // เมื่อเปิด modal ลบโปรเจค
  const openDeleteUserModal = (id: number) => {
    setDeleteId(id);
    setFormState((prev) => ({ ...prev, confirmText: "" }));
    setModalType("delete");
  };

  // เมื่อเปิด modal ดูรายละเอียดโปรเจค
  const openDetailUserModal = (user: UserProfile) => {
    setDetailUser(user);
    setModalType("detail");
  };

  // ฟังก์ชัน submit สำหรับสร้าง/แก้ไขโปรเจค
  const handleUserSubmit = async (values: {
    name: string;
    description: string;
  }) => {
    if (!values.name.trim()) return;
    await createOrUpdateUser({
      ...formState,
      name: values.name,
      description: values.description,
    });
    setModalType("");
    await fetchUsers();
  };

  // ฟังก์ชันยืนยันลบโปรเจค
  const confirmDeleteUser = async () => {
    if (deleteId === null) return;
    await deleteUser(deleteId);
    setModalType("");
    setDeleteId(null);
    await fetchUsers();
  };

  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      align: "center" as const,
      render: (_: any, __: any, idx: number) => idx + 1,
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
      render: (_: any, record: UserProfile) => (
        <Space>
          <Button
            icon={<InfoCircleOutlined />}
            onClick={() => openDetailUserModal(record)}
            aria-label="View Details"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditUserModal(record)}
            aria-label="Edit Project"
            type="primary"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => openDeleteUserModal(record.id)}
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
    return <Loading />;
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* ปุ่มเพิ่มโครงการใหม่ */}
        <div className="w-full flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateUserModal}
            style={{ minWidth: 160 }}
          >
            เพิ่มผู้ใช้งาน
          </Button>
        </div>

        {/* Card รายการผู้ใช้งาน */}
        <Card title="รายการผู้ใช้งาน" className="w-full">
          {/* ตารางผู้ใช้งาน */}
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "30", "50"],
              onShowSizeChange: (_current, size) => setPageSize(size),
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
            onFinish={handleUserSubmit}
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
          onOk={confirmDeleteUser}
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
          open={modalType === "detail" && !!detailUser}
          onCancel={() => {
            setModalType("");
            setDetailUser(null);
          }}
          title="รายละเอียดโปรเจค"
          footer={[
            <Button
              key="close"
              onClick={() => {
                setModalType("");
                setDetailUser(null);
              }}
            >
              ปิด
            </Button>,
          ]}
          destroyOnHidden
        >
          {detailUser && (
            <div className="space-y-3 mt-2">
              <Typography.Paragraph>
                <strong>ชื่อโครงการ:</strong> {detailUser.name}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>คำอธิบาย:</strong> {detailUser.description}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>สร้างโดย (id):</strong> {detailUser.createdBy}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>สร้างเมื่อ:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailUser.createdAt)}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>แก้ไขล่าสุด:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailUser.updatedAt)}
              </Typography.Paragraph>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
