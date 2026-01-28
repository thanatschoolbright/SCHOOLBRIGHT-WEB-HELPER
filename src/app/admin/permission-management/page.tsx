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
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [selectedPermKeys, setSelectedPermKeys] = useState<React.Key[]>([]);

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
      title: "ติดตั้งสิทธิ์มาตรฐาน (System Menu Seeding)",
      content:
        "ระบบจะสร้าง Permission ตามโครงสร้างเมนูและมาตรฐาน IPO ปัจจุบัน (รวมถึงเมนูใหม่ที่คุณเพิ่มเข้ามา)",
      onOk: async () => {
        try {
          // 1. ดึงสิทธิ์จาก PERMISSIONS constant (IPO Standard)
          const standardPerms = Object.entries(PERMISSIONS).map(
            ([key, value]) => ({
              p_code: value,
              name_th: key.replace(/_/g, " ").toLowerCase(),
              description: `สิทธิ์มาตรฐานระบบ: ${key}`,
            }),
          );

          // 2. ดึงชื่อเมนูจาก i18next (ถ้าทำได้) หรือ Manual Map เบื้องต้น
          // ในที่นี้เราจะสร้าง Code ตามโครงสร้างโมดูลที่ปรากฏใน sidebar-menu
          const menuPerms = [
            // Admin System
            {
              p_code: "menu.admin.user_profile",
              name_th: "เข้าถึงเมนู: ข้อมูลผู้ใช้งาน",
            },
            {
              p_code: "menu.admin.role_management",
              name_th: "เข้าถึงเมนู: จัดการสิทธิ์",
            },
            {
              p_code: "menu.admin.position_management",
              name_th: "เข้าถึงเมนู: จัดการตำแหน่ง",
            },
            {
              p_code: "menu.admin.department_management",
              name_th: "เข้าถึงเมนู: จัดการแผนก",
            },
            // Testing
            {
              p_code: "menu.testing.load_testing",
              name_th: "เข้าถึงเมนู: Load Testing",
            },
            // Support
            {
              p_code: "menu.support.bypass_school",
              name_th: "เข้าถึงเมนู: Bypass School",
            },
            {
              p_code: "menu.support.test_nfc_card",
              name_th: "เข้าถึงเมนู: Test NFC Card",
            },
            {
              p_code: "menu.support.cancel_sales",
              name_th: "เข้าถึงเมนู: Cancel Sales",
            },
            // Health Check
            {
              p_code: "menu.health_check.server_status",
              name_th: "เข้าถึงเมนู: Server Status",
            },
            {
              p_code: "menu.health_check.all_server_status",
              name_th: "เข้าถึงเมนู: All Server Status",
            },
            {
              p_code: "menu.health_check.online_status",
              name_th: "เข้าถึงเมนู: Online Status",
            },
            {
              p_code: "menu.health_check.version_control",
              name_th: "เข้าถึงเมนู: Version Control",
            },
            {
              p_code: "menu.health_check.transaction_log",
              name_th: "เข้าถึงเมนู: Transaction Log",
            },
            {
              p_code: "menu.health_check.heartbeats",
              name_th: "เข้าถึงเมนู: Heartbeats",
            },
            // Mobile App
            {
              p_code: "menu.mobile.notification",
              name_th: "เข้าถึงเมนู: Mobile Notification",
            },
            {
              p_code: "menu.mobile.leave_letter",
              name_th: "เข้าถึงเมนู: Mobile Leave Letter",
            },
            {
              p_code: "menu.mobile.statistic",
              name_th: "เข้าถึงเมนู: Mobile Statistics",
            },
            {
              p_code: "menu.mobile.qrcode_health_check",
              name_th: "เข้าถึงเมนู: QR Health Check",
            },
            {
              p_code: "menu.mobile.check_attendance",
              name_th: "เข้าถึงเมนู: Check Attendance",
            },
            // Timesheet
            {
              p_code: "menu.timesheet.project",
              name_th: "เข้าถึงเมนู: Timesheet Project",
            },
            {
              p_code: "menu.timesheet.entry",
              name_th: "เข้าถึงเมนู: Timesheet Entry",
            },
            {
              p_code: "menu.timesheet.timeline",
              name_th: "เข้าถึงเมนู: Timesheet Timeline",
            },
            {
              p_code: "menu.timesheet.all",
              name_th: "เข้าถึงเมนู: Timesheet All (Admin)",
            },
            {
              p_code: "menu.timesheet.overtime",
              name_th: "เข้าถึงเมนู: Timesheet Overtime",
            },
            // Backlogs
            {
              p_code: "menu.backlogs.report",
              name_th: "เข้าถึงเมนู: Backlogs Report",
            },
            // Logger
            {
              p_code: "menu.logger.api_logs",
              name_th: "เข้าถึงเมนู: API Logs",
            },
          ].map((m) => ({ ...m, description: "สิทธิ์การเข้าถึงเมนูฝั่ง UI" }));

          const finalPerms = [...standardPerms, ...menuPerms];

          await axios.post("/api/v2/admin/permission-management/seed", {
            permissions: finalPerms,
          });
          toast.success("Seed รายสิทธิ์ตามเมนูสำเร็จ");
          fetchData();
        } catch (err) {
          toast.error("Seed ล้มเหลว (อาจมีข้อมูลบางส่วนอยู่แล้ว)");
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

  const handleBulkDeletePermissions = async () => {
    if (selectedPermKeys.length === 0) return;

    modal.confirm({
      title: "ลบสิทธิ์ที่เลือก",
      content: `คุณต้องการลบสิทธิ์จำนวน ${selectedPermKeys.length} รายการที่เลือกใช่หรือไม่?`,
      okText: "ลบทั้งหมด",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.post("/api/v2/admin/permission-management/delete", {
            ids: selectedPermKeys,
          });
          toast.success("ลบสิทธิ์ที่เลือกสำเร็จ");
          setSelectedPermKeys([]);
          fetchData();
        } catch (err) {
          toast.error("เกิดข้อผิดพลาดในการลบสิทธิ์แบบกลุ่ม");
        }
      },
    });
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
                router.push(`/admin/permission-management/edit/${r.id}`);
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
                  router.push("/admin/permission-management/create");
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
                  <div className="flex justify-between items-center mb-4">
                    <Text type="secondary">
                      จัดการรายการสิทธิ์เข้าถึงพื้นฐานของระบบ (Permissions)
                    </Text>
                    {selectedPermKeys.length > 0 && (
                      <Button
                        danger
                        type="primary"
                        icon={<DeleteOutlined />}
                        onClick={handleBulkDeletePermissions}
                      >
                        ลบสิทธิ์ที่เลือก ({selectedPermKeys.length})
                      </Button>
                    )}
                  </div>
                  <Table
                    dataSource={permissions}
                    rowSelection={{
                      selectedRowKeys: selectedPermKeys,
                      onChange: setSelectedPermKeys,
                    }}
                    columns={[
                      {
                        title: "Code",
                        dataIndex: "p_code",
                        render: (c) => <Tag color="orange">{c}</Tag>,
                      },
                      { title: "ชื่อสิทธิ์", dataIndex: "name_th" },
                      { title: "รายละเอียด", dataIndex: "description" },
                      {
                        title: "จัดการ",
                        align: "center",
                        render: (_, r) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              modal.confirm({
                                title: "ยืนยันการลบสิทธิ์",
                                content: `คุณต้องการลบสิทธิ์ ${r.name_th} (${r.p_code}) ใช่หรือไม่? การลบนี้จะมีผลกับทุกบทบาทที่ถือสิทธิ์นี้อยู่`,
                                okText: "ลบ",
                                okButtonProps: { danger: true },
                                onOk: async () => {
                                  try {
                                    await axios.post(
                                      "/api/v2/admin/permission-management/delete",
                                      { id: r.id },
                                    );
                                    toast.success("ลบสิทธิ์สำเร็จ");
                                    fetchData();
                                  } catch (err) {
                                    toast.error("ลบสิทธิ์ไม่สำเร็จ");
                                  }
                                },
                              });
                            }}
                          />
                        ),
                      },
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
