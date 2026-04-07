"use client";

import { CopyOutlined, LockOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Switch,
  Typography,
  theme,
} from "antd";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Permission,
  usePermissionManagementStore,
} from "../_state/permission-management-store";

const { Text, Title } = Typography;

/**
 * จัดกลุ่ม permissions ตาม prefix 2 ระดับ
 */
const groupPermissions = (permissions: Permission[]) => {
  const groups: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const parts = perm.p_code.split(".");
    const first = parts[0] ?? perm.p_code;
    const second = parts[1];
    const prefix = second !== undefined ? `${first}.${second}` : first;
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(perm);
  }
  return groups;
};

/**
 * Modal: สร้าง / แก้ไข Role พร้อม Permission Matrix
 */
export const RoleFormModal = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    role_name: string;
    description?: string;
    is_active?: boolean;
    permission_ids?: number[];
  }>();

  const {
    modalMode,
    selectedRole,
    roles,
    permissions,
    setModalMode,
    handleSubmit,
  } = usePermissionManagementStore();

  const isOpen = modalMode !== null;
  const isAdmin = selectedRole?.role_name === "ADMIN";

  // เมื่อ modal เปิด ให้ populate form ด้วยข้อมูล role ที่เลือก
  useEffect(() => {
    if (modalMode === "edit" && selectedRole) {
      form.setFieldsValue({
        role_name: selectedRole.role_name,
        description: selectedRole.description || "",
        is_active: selectedRole.is_active,
        permission_ids: selectedRole.permissions.map((p) => p.permission_id),
      });
    } else if (modalMode === "create") {
      form.resetFields();
      form.setFieldsValue({ is_active: true, permission_ids: [] });
    }
  }, [modalMode, selectedRole, form]);

  // คัดลอกสิทธิ์จาก Role อื่น
  const handleCopyPermissions = (roleId: number) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (targetRole) {
      const pIds = targetRole.permissions.map((p) => p.permission_id);
      form.setFieldsValue({ permission_ids: pIds });
      toast.info(`คัดลอกสิทธิ์จาก ${targetRole.role_name} แล้ว (${pIds.length} สิทธิ์)`);
    }
  };

  const groups = groupPermissions(permissions);

  const onFinish = async (values: {
    role_name: string;
    description?: string;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    await handleSubmit(values as Record<string, unknown>);
    form.resetFields();
  };

  return (
    <Modal
      open={isOpen}
      title={
        <Space align="center" size={10}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${token.colorPrimary}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {modalMode === "create"
                ? "เพิ่มบทบาทใหม่"
                : `แก้ไขบทบาท: ${selectedRole?.role_name}`}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              กำหนดสิทธิ์การเข้าถึงสำหรับบทบาทนี้
            </Text>
          </div>
        </Space>
      }
      onCancel={() => {
        setModalMode(null);
        form.resetFields();
      }}
      onOk={() => form.submit()}
      width={1000}
      okText="บันทึกข้อมูล"
      cancelText="ยกเลิก"
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          padding: "16px 24px",
        },
      }}
      okButtonProps={{ size: "large", style: { borderRadius: 8 } }}
      cancelButtonProps={{ size: "large", style: { borderRadius: 8 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          {/* ซ้าย: ข้อมูลพื้นฐาน + Copy Template */}
          <Col span={8}>
            <div
              style={{
                background: `linear-gradient(180deg, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
                borderRadius: 12,
                padding: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
                marginBottom: 16,
              }}
            >
              <Title level={5} style={{ marginBottom: 16, color: token.colorTextSecondary }}>
                ข้อมูลบทบาท
              </Title>

              <Form.Item
                name="role_name"
                label="ชื่อบทบาท (English)"
                rules={[
                  { required: true, message: "กรุณาระบุชื่อบทบาท" },
                  {
                    pattern: /^[A-Z0-9_]+$/,
                    message: "ใช้ตัวพิมพ์ใหญ่และ _ เท่านั้น เช่น MANAGER_HR",
                  },
                ]}
              >
                <Input
                  placeholder="เช่น MANAGER_HR"
                  disabled={isAdmin}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item name="description" label="คำอธิบาย">
                <Input.TextArea
                  rows={3}
                  placeholder="ใช้สำหรับทำอะไร..."
                  style={{ borderRadius: 8, resize: "none" }}
                />
              </Form.Item>

              <Form.Item name="is_active" label="สถานะ" valuePropName="checked">
                <Switch
                  checkedChildren="เปิดใช้งาน"
                  unCheckedChildren="ปิดใช้งาน"
                />
              </Form.Item>
            </div>

            {/* Copy Template Section */}
            <Alert
              type="info"
              showIcon
              message="คัดลอกสิทธิ์จากบทบาทอื่น"
              description="เลือกบทบาทต้นฉบับเพื่อนำสิทธิ์ทั้งหมดมาใส่ในฟอร์ม"
              style={{ borderRadius: 10, marginBottom: 12 }}
            />
            <Space wrap>
              {roles
                .filter((r) => r.id !== selectedRole?.id)
                .map((r) => (
                  <Button
                    key={r.id}
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyPermissions(r.id)}
                    style={{ borderRadius: 6 }}
                  >
                    {r.role_name}
                  </Button>
                ))}
            </Space>
          </Col>

          {/* ขวา: Permission Matrix */}
          <Col span={16}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.permission_ids !== cur.permission_ids
              }
            >
              {({ getFieldValue }) => {
                const selectedIds: number[] =
                  getFieldValue("permission_ids") || [];
                const totalCount = permissions.length;
                const selectedCount = selectedIds.length;
                const pct =
                  totalCount > 0
                    ? Math.round((selectedCount / totalCount) * 100)
                    : 0;

                return (
                  <>
                    {/* Progress Header */}
                    <div
                      style={{
                        background: token.colorBgLayout,
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong style={{ fontSize: 13 }}>
                          สิทธิ์ที่เลือก
                        </Text>
                        <Text
                          style={{
                            color: token.colorPrimary,
                            fontWeight: 700,
                          }}
                        >
                          {selectedCount} / {totalCount} สิทธิ์
                        </Text>
                      </div>
                      <Progress
                        percent={pct}
                        strokeColor={token.colorPrimary}
                        showInfo={false}
                        size="small"
                        trailColor={token.colorFillTertiary}
                      />
                    </div>

                    {/* Permission Checkbox Groups */}
                    <Form.Item name="permission_ids">
                      <Checkbox.Group style={{ width: "100%" }}>
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={12}
                        >
                          {Object.entries(groups).map(
                            ([groupName, groupPerms]) => {
                              // ตรวจสอบว่ากลุ่มนี้เลือกทั้งหมดหรือไม่
                              const groupIds = groupPerms.map((p) => p.id);
                              const checkedInGroup = groupIds.filter((id) =>
                                selectedIds.includes(id)
                              ).length;
                              const allChecked =
                                checkedInGroup === groupIds.length;
                              const someChecked =
                                checkedInGroup > 0 && !allChecked;

                              return (
                                <div key={groupName}>
                                  <Divider
                                    orientation="left"
                                    style={{ margin: "8px 0", fontSize: 12 }}
                                  >
                                    <Space size={6} align="center">
                                      {/* เลือกทั้งกลุ่ม */}
                                      <Checkbox
                                        checked={allChecked}
                                        indeterminate={someChecked}
                                        onChange={(e) => {
                                          const current: number[] =
                                            form.getFieldValue(
                                              "permission_ids"
                                            ) || [];
                                          if (e.target.checked) {
                                            const merged = Array.from(
                                              new Set([...current, ...groupIds])
                                            );
                                            form.setFieldsValue({
                                              permission_ids: merged,
                                            });
                                          } else {
                                            form.setFieldsValue({
                                              permission_ids: current.filter(
                                                (id) => !groupIds.includes(id)
                                              ),
                                            });
                                          }
                                        }}
                                      />
                                      <Text
                                        style={{
                                          fontFamily: "monospace",
                                          fontSize: 12,
                                          color: token.colorPrimary,
                                        }}
                                      >
                                        {groupName}
                                      </Text>
                                      <span
                                        style={{
                                          padding: "0 6px",
                                          borderRadius: 10,
                                          background: `${token.colorPrimary}15`,
                                          color: token.colorPrimary,
                                          fontSize: 11,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {checkedInGroup}/{groupIds.length}
                                      </span>
                                    </Space>
                                  </Divider>
                                  <Row gutter={[8, 8]}>
                                    {groupPerms.map((p) => (
                                      <Col span={12} key={p.id}>
                                        <div
                                          style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: `1px solid ${
                                              selectedIds.includes(p.id)
                                                ? token.colorPrimaryBorder
                                                : token.colorBorderSecondary
                                            }`,
                                            background: selectedIds.includes(p.id)
                                              ? token.colorPrimaryBg
                                              : token.colorBgContainer,
                                            transition: "all 0.15s ease",
                                          }}
                                        >
                                          <Checkbox value={p.id}>
                                            <div
                                              style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 2,
                                              }}
                                            >
                                              <Text
                                                strong
                                                style={{ fontSize: 12, lineHeight: "16px" }}
                                              >
                                                {p.name_th}
                                              </Text>
                                              <Text
                                                type="secondary"
                                                style={{
                                                  fontSize: 10,
                                                  fontFamily: "monospace",
                                                  lineHeight: "14px",
                                                }}
                                              >
                                                {p.p_code}
                                              </Text>
                                            </div>
                                          </Checkbox>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              );
                            }
                          )}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                  </>
                );
              }}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
