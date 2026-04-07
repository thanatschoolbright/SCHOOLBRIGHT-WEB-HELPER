"use client";

import {
  CheckCircleOutlined,
  DeleteOutlined,
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  requestCreateRole,
  requestDeleteRole,
  requestUpdateRolePermissions,
  responseAllPermissions,
  responseAllRoles,
} from "../_api/role-permission-api";

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
  permissions: { permission: Permission }[];
  _count?: { users: number };
}

interface RolePermissionDrawerProps {
  open: boolean;
  onClose: () => void;
}

// จัดกลุ่ม permissions ตาม prefix ของ p_code (เช่น "USER_", "REPORT_")
const groupPermissions = (permissions: Permission[]) => {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const prefix = p.p_code.includes("_")
      ? (p.p_code.split("_")[0] ?? "GENERAL")
      : "GENERAL";
    if (!groups[prefix]) groups[prefix] = [];
    (groups[prefix] as Permission[]).push(p);
  }
  return groups;
};

export const RolePermissionDrawer = ({
  open,
  onClose,
}: RolePermissionDrawerProps) => {
  const { token } = theme.useToken();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  // โหลด roles + permissions พร้อมกัน
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        responseAllRoles(),
        responseAllPermissions(),
      ]);
      const rolesData: Role[] = rolesRes.data?.data?.items ?? [];
      const permsData: Permission[] = permsRes.data?.data ?? [];
      setRoles(rolesData);
      setPermissions(permsData);
      // reset selected ถ้า role ที่เลือกถูกลบไปแล้ว
      setSelectedRole((prev) =>
        prev ? rolesData.find((r) => r.id === prev.id) ?? null : null,
      );
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูล Role/Permission ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  // sync checkboxes เมื่อเลือก role
  useEffect(() => {
    if (selectedRole) {
      setCheckedIds(selectedRole.permissions.map((p) => p.permission.id));
    } else {
      setCheckedIds([]);
    }
  }, [selectedRole]);

  const permissionGroups = useMemo(
    () => groupPermissions(permissions),
    [permissions],
  );

  // ตรวจว่ามีการแก้ไขหรือยัง
  const isDirty = useMemo(() => {
    if (!selectedRole) return false;
    const original = selectedRole.permissions.map((p) => p.permission.id).sort();
    const current = [...checkedIds].sort();
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [selectedRole, checkedIds]);

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await requestUpdateRolePermissions(selectedRole.id, checkedIds);
      toast.success(`บันทึก permissions ของ "${selectedRole.role_name}" สำเร็จ`);
      await fetchData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.role_name === "ADMIN") {
      toast.error("ไม่สามารถลบ ADMIN role ได้");
      return;
    }
    Modal.confirm({
      title: `ลบ Role "${role.role_name}"?`,
      content: `มีผู้ใช้งาน ${role._count?.users ?? 0} คนที่ใช้ role นี้อยู่`,
      okButtonProps: { danger: true },
      okText: "ลบ",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await requestDeleteRole(role.id);
          toast.success("ลบ Role สำเร็จ");
          if (selectedRole?.id === role.id) setSelectedRole(null);
          await fetchData();
        } catch {
          toast.error("เกิดข้อผิดพลาดในการลบ Role");
        }
      },
    });
  };

  const handleCreateRole = async () => {
    const values = await form.validateFields();
    setCreateLoading(true);
    try {
      await requestCreateRole({ role_name: values.role_name, description: values.description });
      toast.success(`สร้าง Role "${values.role_name}" สำเร็จ`);
      form.resetFields();
      setCreateModalOpen(false);
      await fetchData();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้าง Role");
    } finally {
      setCreateLoading(false);
    }
  };

  // toggle permission ทีละกลุ่ม
  const toggleGroup = (groupPerms: Permission[], checked: boolean) => {
    const ids = groupPerms.map((p) => p.id);
    if (checked) {
      setCheckedIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      setCheckedIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  return (
    <>
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
            <span>จัดการบทบาทและสิทธิ์การใช้งาน</span>
          </Flex>
        }
        open={open}
        onClose={onClose}
        width={860}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={isLoading} size="small" shape="round">
              รีเฟรช
            </Button>
            <Button icon={<PlusOutlined />} type="primary" size="small" shape="round" onClick={() => setCreateModalOpen(true)}>
              สร้าง Role ใหม่
            </Button>
          </Space>
        }
      >
        <Spin spinning={isLoading}>
          <Row gutter={16} style={{ height: "100%" }}>
            {/* ── ซ้าย: รายการ Roles ── */}
            <Col span={8}>
              <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                <TeamOutlined style={{ marginRight: 6 }} />
                Roles ({roles.length})
              </Typography.Text>
              <Flex vertical gap={8}>
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  return (
                    <Card
                      key={role.id}
                      size="small"
                      onClick={() => setSelectedRole(role)}
                      hoverable
                      style={{
                        cursor: "pointer",
                        borderColor: isSelected ? token.colorPrimary : token.colorBorderSecondary,
                        backgroundColor: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
                        transition: "all 0.2s",
                      }}
                      styles={{ body: { padding: "10px 12px" } }}
                    >
                      <Flex justify="space-between" align="center">
                        <div>
                          <Flex align="center" gap={6}>
                            <KeyOutlined style={{ color: isSelected ? token.colorPrimary : token.colorTextSecondary, fontSize: 12 }} />
                            <Typography.Text strong style={{ fontSize: 13, color: isSelected ? token.colorPrimary : token.colorText }}>
                              {role.role_name}
                            </Typography.Text>
                            {!role.is_active && <Tag color="default" style={{ fontSize: 10, margin: 0 }}>ปิดใช้งาน</Tag>}
                          </Flex>
                          <Flex align="center" gap={4} style={{ marginTop: 4 }}>
                            <UserOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {role._count?.users ?? 0} คน
                            </Typography.Text>
                            <Divider type="vertical" style={{ margin: "0 2px" }} />
                            <CheckCircleOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {role.permissions.length} สิทธิ์
                            </Typography.Text>
                          </Flex>
                        </div>
                        {role.role_name !== "ADMIN" && (
                          <Tooltip title="ลบ Role">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                            />
                          </Tooltip>
                        )}
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Col>

            {/* ── ขวา: Permission Matrix ── */}
            <Col span={16}>
              {!selectedRole ? (
                <Empty description="เลือก Role เพื่อจัดการ Permissions" style={{ marginTop: 80 }} />
              ) : (
                <>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 15 }}>
                        <KeyOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
                        {selectedRole.role_name}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        {checkedIds.length} / {permissions.length} สิทธิ์
                      </Typography.Text>
                    </div>
                    <Button
                      type="primary"
                      onClick={handleSave}
                      loading={isSaving}
                      disabled={!isDirty}
                      shape="round"
                      size="small"
                      icon={<CheckCircleOutlined />}
                    >
                      บันทึกการเปลี่ยนแปลง
                    </Button>
                  </Flex>

                  {isDirty && (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: "6px 12px",
                        borderRadius: 8,
                        backgroundColor: token.colorWarningBg,
                        border: `1px solid ${token.colorWarningBorder}`,
                      }}
                    >
                      <Typography.Text style={{ fontSize: 12, color: token.colorWarning }}>
                        มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก — กด "บันทึก" เพื่อยืนยัน
                      </Typography.Text>
                    </div>
                  )}

                  <Flex vertical gap={12} style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: 4 }}>
                    {Object.entries(permissionGroups).map(([group, groupPerms]) => {
                      const groupChecked = groupPerms.filter((p) => checkedIds.includes(p.id)).length;
                      const allChecked = groupChecked === groupPerms.length;
                      const someChecked = groupChecked > 0 && !allChecked;

                      return (
                        <Card
                          key={group}
                          size="small"
                          styles={{ body: { padding: "12px 16px" } }}
                          style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                          title={
                            <Flex align="center" gap={8}>
                              <Checkbox
                                checked={allChecked}
                                indeterminate={someChecked}
                                onChange={(e) => toggleGroup(groupPerms, e.target.checked)}
                              />
                              <Typography.Text strong style={{ fontSize: 13 }}>
                                {group}
                              </Typography.Text>
                              <Badge
                                count={`${groupChecked}/${groupPerms.length}`}
                                color={allChecked ? "green" : someChecked ? "orange" : "default"}
                                style={{ fontSize: 10 }}
                              />
                            </Flex>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            {groupPerms.map((perm) => (
                              <Col key={perm.id} xs={24} sm={12}>
                                <Tooltip title={perm.description ?? perm.p_code} placement="topLeft">
                                  <Checkbox
                                    checked={checkedIds.includes(perm.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCheckedIds((prev) => [...prev, perm.id]);
                                      } else {
                                        setCheckedIds((prev) => prev.filter((id) => id !== perm.id));
                                      }
                                    }}
                                  >
                                    <Typography.Text style={{ fontSize: 12 }}>
                                      {perm.name_th}
                                    </Typography.Text>
                                    <Typography.Text type="secondary" style={{ fontSize: 10, display: "block", lineHeight: 1.2 }}>
                                      {perm.p_code}
                                    </Typography.Text>
                                  </Checkbox>
                                </Tooltip>
                              </Col>
                            ))}
                          </Row>
                        </Card>
                      );
                    })}
                  </Flex>
                </>
              )}
            </Col>
          </Row>
        </Spin>
      </Drawer>

      {/* Modal: สร้าง Role ใหม่ */}
      <Modal
        title={<Space><PlusOutlined />สร้าง Role ใหม่</Space>}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        onOk={handleCreateRole}
        confirmLoading={createLoading}
        okText="สร้าง Role"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="role_name"
            label="ชื่อ Role"
            rules={[{ required: true, message: "กรุณาระบุชื่อ Role" }]}
          >
            <Input placeholder="เช่น MANAGER, VIEWER" />
          </Form.Item>
          <Form.Item name="description" label="คำอธิบาย (ไม่บังคับ)">
            <Input.TextArea rows={3} placeholder="อธิบายหน้าที่ของ Role นี้..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
