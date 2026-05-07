"use client";

import {
  AuditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Row,
  Space,
  Typography,
  theme,
} from "antd";
import {
  Permission,
  usePermissionManagementStore,
} from "../_state/permission-management-store";

const { Text, Title } = Typography;

/**
 * จัดกลุ่ม permissions ตาม prefix ของ p_code
 * เช่น "menu.admin.xxx" → group "menu.admin"
 *       "admin.role.manage" → group "admin"
 */
const groupPermissions = (permissions: Permission[]) => {
  const groups: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    // แยก prefix ด้วย "." — ใช้ 2 ระดับแรก
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
 * Tab 2: รายสิทธิ์ (Permissions) จัดกลุ่มตาม prefix ใน Card
 */
export const PermissionsTab = () => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const {
    permissions,
    isLoading,
    selectedPermKeys,
    setSelectedPermKeys,
    handleBulkDeletePermissions,
    handleSeedPermissions,
    fetchData,
  } = usePermissionManagementStore();

  const groups = groupPermissions(permissions);

  // ลบทั้งกลุ่ม
  const handleDeleteGroup = (groupPerms: Permission[]) => {
    const ids = groupPerms.map((p) => p.id);
    modal.confirm({
      title: "ลบสิทธิ์ทั้งกลุ่ม",
      content: `คุณต้องการลบสิทธิ์จำนวน ${ids.length} รายการในกลุ่มนี้ใช่หรือไม่? การลบจะมีผลกับทุกบทบาทที่ถือสิทธิ์เหล่านี้`,
      okText: "ลบทั้งกลุ่ม",
      okButtonProps: { danger: true },
      onOk: async () => {
        const { requestDeletePermissions } = await import(
          "../_api/permission-management-api"
        );
        const { toast } = await import("sonner");
        try {
          await requestDeletePermissions(ids);
          toast.success(`ลบสิทธิ์ทั้งกลุ่มสำเร็จ (${ids.length} รายการ)`);
          await fetchData();
        } catch {
          toast.error("เกิดข้อผิดพลาดในการลบกลุ่ม");
        }
      },
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Space direction="vertical" style={{ width: "100%" }} size={32}>
        {/* Toolbar ด้านบน */}
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: "24px 32px",
            background: token.colorBgContainer,
            borderRadius: 20,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              จัดกลุ่มรายการสิทธิ์ (System Permissions)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              จัดการสิทธิ์การเข้าถึงแยกตามโมดูลหลักของระบบ
            </Text>
          </div>
          <Space wrap size={12}>
            {selectedPermKeys.length > 0 && (
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                onClick={() =>
                  handleBulkDeletePermissions(
                    modal.confirm as (
                      config: import("antd").ModalFuncProps,
                    ) => void,
                  )
                }
                style={{ borderRadius: 10, fontWeight: 600, height: 40 }}
              >
                ลบที่เลือก ({selectedPermKeys.length})
              </Button>
            )}
            <Button
              icon={<AuditOutlined />}
              onClick={handleSeedPermissions}
              loading={isLoading}
              style={{
                borderRadius: 10,
                fontWeight: 600,
                height: 40,
                background: token.colorSuccessBg,
                color: token.colorSuccess,
                borderColor: token.colorSuccessBorder,
              }}
            >
              ติดตั้งสิทธิ์พื้นฐาน
            </Button>
          </Space>
        </Flex>

        {/* Permission Groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.entries(groups).length === 0 && !isLoading && (
            <Card
              style={{
                borderRadius: 20,
                textAlign: "center",
                borderStyle: "dashed",
              }}
              styles={{ body: { padding: "80px 24px" } }}
            >
              <Space direction="vertical" align="center" size={16}>
                <FolderOpenOutlined
                  style={{ fontSize: 48, color: token.colorTextQuaternary }}
                />
                <Text type="secondary">
                  ยังไม่มีข้อมูลรายการสิทธิ์ กด &quot;ติดตั้งสิทธิ์พื้นฐาน&quot;
                  เพื่อเริ่มต้น
                </Text>
              </Space>
            </Card>
          )}

          {Object.entries(groups).map(([groupName, groupPerms]) => {
            const groupIds = groupPerms.map((p) => p.id);
            const checkedInGroup = groupIds.filter((id) =>
              selectedPermKeys.includes(id),
            ).length;
            const allChecked = checkedInGroup === groupIds.length;
            const someChecked = checkedInGroup > 0 && !allChecked;

            return (
              <Card
                key={groupName}
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
                styles={{
                  header: {
                    background: token.colorFillAlter,
                    padding: "16px 24px",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  },
                  body: { padding: "24px 32px" },
                }}
                title={
                  <Flex justify="space-between" align="center">
                    <Space size={16}>
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setSelectedPermKeys(
                              Array.from(
                                new Set([...selectedPermKeys, ...groupIds]),
                              ),
                            );
                          } else {
                            setSelectedPermKeys(
                              selectedPermKeys.filter(
                                (key) => !groupIds.includes(key as number),
                              ),
                            );
                          }
                        }}
                      />
                      <Text strong style={{ fontSize: 16 }}>
                        {groupName.toUpperCase()}
                      </Text>
                      <Badge
                        count={groupPerms.length}
                        style={{
                          backgroundColor: `${token.colorPrimary}15`,
                          color: token.colorPrimary,
                          boxShadow: "none",
                          border: "none",
                          fontWeight: 600,
                        }}
                      />
                    </Space>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleDeleteGroup(groupPerms)}
                      style={{ borderRadius: 6 }}
                    >
                      ลบกลุ่ม
                    </Button>
                  </Flex>
                }
              >
                <Row gutter={[20, 20]}>
                  {groupPerms.map((perm) => (
                    <Col key={perm.id} xs={24} sm={12} md={8} lg={6}>
                      <div
                        style={{
                          padding: "16px 20px",
                          borderRadius: 14,
                          background: selectedPermKeys.includes(perm.id)
                            ? token.colorPrimaryBg
                            : token.colorFillTertiary,
                          border: `1px solid ${
                            selectedPermKeys.includes(perm.id)
                              ? token.colorPrimaryBorder
                              : "transparent"
                          }`,
                          transition: "all 0.2s",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                        }}
                        onClick={() => {
                          if (selectedPermKeys.includes(perm.id)) {
                            setSelectedPermKeys(
                              selectedPermKeys.filter((k) => k !== perm.id),
                            );
                          } else {
                            setSelectedPermKeys([...selectedPermKeys, perm.id]);
                          }
                        }}
                      >
                        <Checkbox
                          checked={selectedPermKeys.includes(perm.id)}
                          style={{ marginTop: 4 }}
                        />
                        <div style={{ flex: 1 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: `${token.colorPrimary}10`,
                              color: token.colorPrimary,
                              fontSize: 10,
                              fontWeight: 700,
                              marginBottom: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            {perm.p_code.split(".")[1] || "ACTION"}
                          </span>
                          <Text
                            strong
                            style={{ display: "block", fontSize: 14 }}
                          >
                            {perm.p_name}
                          </Text>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              wordBreak: "break-all",
                              fontFamily: "monospace",
                            }}
                          >
                            {perm.p_code}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            );
          })}
        </div>
      </Space>
    </div>
  );
};
