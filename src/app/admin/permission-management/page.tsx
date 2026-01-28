"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Space,
  Button,
  theme,
  Input,
  Modal,
  Form,
  Tag,
  Table,
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Tabs,
  Checkbox,
  Divider,
  Tooltip,
  Badge,
  App,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  AuditOutlined,
  UnlockOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { PERMISSIONS } from "@/constants/permission.constant";

const { Text } = Typography;

// --- Interfaces ---
interface Permission {
  id: number;
  p_code: string;
  name_th: string;
  description?: string;
}

interface Role {
  id: number;
  role_name: string;
  description?: string;
  is_active: boolean;
  permissions: {
    permission_id: number;
    permission: Permission;
  }[];
  _count?: {
    users: number;
  };
}

export default function PermissionManagementPage() {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        axios.get("/api/v2/admin/role-management/read", { params: { search } }),
        axios.get("/api/v2/admin/permission-management/read"),
      ]);
      setRoles(roleRes?.data?.data?.items || []);
      setPermissions(permRes?.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.info("โหมดแสดงผล (API ยังไม่พร้อม)");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        permission_ids: values.permission_ids || [],
      };

      if (modalMode === "create") {
        await axios.post("/api/v2/admin/role-management/create", payload);
        toast.success("สร้างบทบาทสำเร็จ");
      } else {
        await axios.post("/api/v2/admin/role-management/update", {
          ...payload,
          id: selectedRole?.id,
        });
        toast.success("อัปเดตสิทธิ์บทบาทสำเร็จ");
      }
      setModalMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message_th || "เกิดข้อผิดพลาด");
    }
  };

  const handleCopyPermissions = (roleId: number) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (targetRole) {
      const pIds = targetRole.permissions.map((p) => p.permission_id);
      form.setFieldsValue({ permission_ids: pIds });
      toast.info(`คัดลอกสิทธิ์จาก ${targetRole.role_name} แล้ว`);
    }
  };

  const handleSeedPermissions = async () => {
    modal.confirm({
      title: "ติดตั้งสิทธิ์มาตรฐาน (IPO Seeding)",
      content: "ระบบจะสร้าง Permission พื้นฐานที่จำเป็นตามมาตรฐาน IPO",
      onOk: async () => {
        try {
          const permList = Object.entries(PERMISSIONS).map(([key, value]) => ({
            p_code: value,
            name_th: key.replace(/_/g, " ").toLowerCase(),
          }));
          await axios.post("/api/v2/admin/permission-management/seed", {
            permissions: permList,
          });
          toast.success("Seed สำเร็จ");
          fetchData();
        } catch (err) {
          toast.error("Seed ล้มเหลว (อาจมีข้อมูลอยู่แล้ว)");
        }
      },
    });
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await axios.post("/api/v2/admin/role-management/delete", {
        id: selectedRole.id,
      });
      toast.success("ลบบทบาทเรียบร้อยแล้ว");
      setDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error("ไม่สามารถลบได้เนื่องจากมีผู้ใช้ใช้บทบาทนี้อยู่");
    }
  };

  // --- Columns ---
  const roleColumns: ColumnsType<Role> = [
    {
      title: "บทบาท & รายละเอียด",
      dataIndex: "role_name",
      render: (text, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.description || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "สิทธิ์",
      dataIndex: "permissions",
      align: "center",
      render: (p) => <Tag color="purple">{p?.length || 0} รายการ</Tag>,
    },
    {
      title: "ผู้ใช้งาน",
      dataIndex: ["_count", "users"],
      align: "center",
      render: (count) => <Tag color="blue">{count || 0} คน</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      align: "center",
      render: (active: boolean) => (
        <Badge
          status={active ? "success" : "error"}
          text={active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        />
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="แก้ไขสิทธิ์">
            <Button
              type="text"
              icon={<EditOutlined className="text-orange-500" />}
              onClick={() => {
                setSelectedRole(r);
                setModalMode("edit");
                form.setFieldsValue({
                  role_name: r.role_name,
                  description: r.description,
                  is_active: r.is_active,
                  permission_ids: r.permissions.map((p) => p.permission_id),
                });
              }}
            />
          </Tooltip>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={r._count?.users! > 0 || r.role_name === "ADMIN"}
            onClick={() => {
              setSelectedRole(r);
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
          icon={<SafetyCertificateOutlined />}
          title="จัดการบทบาทและสิทธิ์ (RBAC)"
          subTitle="กำหนดโครงสร้างการเข้าถึงตามหลัก Separation of Duties (IPO Standard)"
          extra={
            <Space>
              <Button onClick={handleSeedPermissions} icon={<AuditOutlined />}>
                Seed IPO
              </Button>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                รีเฟรช
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
                สร้าง Role ใหม่
              </Button>
            </Space>
          }
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: (
                <span>
                  <LockOutlined /> จัดการบทบาท (Roles)
                </span>
              ),
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="ค้นหาบทบาท..."
                    className="mb-4"
                    style={{ width: 300 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Table
                    columns={roleColumns}
                    dataSource={roles}
                    loading={loading}
                    rowKey="id"
                  />
                </Card>
              ),
            },
            {
              key: "2",
              label: (
                <span>
                  <UnlockOutlined /> รายสิทธิ์ (Permissions)
                </span>
              ),
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Table
                    dataSource={permissions}
                    columns={[
                      {
                        title: "Code",
                        dataIndex: "p_code",
                        render: (c) => <Tag color="orange">{c}</Tag>,
                      },
                      { title: "ชื่อสิทธิ์", dataIndex: "name_th" },
                      { title: "รายละเอียด", dataIndex: "description" },
                    ]}
                    rowKey="id"
                  />
                </Card>
              ),
            },
          ]}
        />

        <Modal
          open={!!modalMode}
          title={
            modalMode === "create"
              ? "เพิ่มบทบาทใหม่"
              : `แก้ไขบทบาท: ${selectedRole?.role_name}`
          }
          onCancel={() => setModalMode(null)}
          onOk={() => form.submit()}
          width={850}
          okText="บันทึกข้อมูล"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={10}>
                <Form.Item
                  name="role_name"
                  label="ชื่อบทบาท (English)"
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder="เช่น MANAGER_HR"
                    disabled={selectedRole?.role_name === "ADMIN"}
                  />
                </Form.Item>
                <Form.Item name="description" label="คำอธิบาย">
                  <Input.TextArea rows={2} placeholder="ใช้สำหรับทำอะไร..." />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Alert
                  type="info"
                  showIcon
                  message="คัดลอกสิทธิ์ (UX Template)"
                  description="เลือกบทบาทต้นฉบับเพื่อนำสิทธิ์ทั้งหมดมาใส่ในฟอร์มนี้"
                  className="mb-3"
                />
                <Space wrap>
                  {roles.map((r) => (
                    <Button
                      key={r.id}
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyPermissions(r.id)}
                    >
                      Copy {r.role_name}
                    </Button>
                  ))}
                </Space>
              </Col>
            </Row>

            <Divider orientation="left">Matrix: กำหนดสิทธิ์รายย่อย</Divider>

            <Form.Item name="permission_ids">
              <Checkbox.Group style={{ width: "100%" }}>
                <Row gutter={[8, 8]}>
                  {permissions.map((p) => (
                    <Col span={8} key={p.id}>
                      <Card size="small" hoverable style={{ height: "100%" }}>
                        <Checkbox value={p.id}>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <Text strong style={{ fontSize: 12 }}>
                              {p.name_th}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {p.p_code}
                            </Text>
                          </div>
                        </Checkbox>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="ยืนยันการลบ"
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDelete}
          okButtonProps={{ danger: true }}
        >
          <Text>
            คุณต้องการลบบทบาท <strong>{selectedRole?.role_name}</strong>{" "}
            หรือไม่?
          </Text>
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
