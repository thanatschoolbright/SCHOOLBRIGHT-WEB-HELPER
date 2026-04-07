"use client";

import {
  AuditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Row,
  Space,
  Typography,
  theme,
} from "antd";
import { App } from "antd";
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
    handleDeleteSinglePermission,
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
        // ลบทีละชุด — ใช้ bulk delete
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
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      {/* Toolbar ด้านบน */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Text type="secondary" style={{ fontSize: 14 }}>
          จัดการรายการสิทธิ์เข้าถึงพื้นฐานของระบบ จัดกลุ่มตาม Module
        </Text>
        <Space wrap>
          {selectedPermKeys.length > 0 && (
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={() => handleBulkDeletePermissions(modal.confirm as (config: import("antd").ModalFuncProps) => void)}
              style={{ borderRadius: 8 }}
            >
              ลบที่เลือก ({selectedPermKeys.length})
            </Button>
          )}
          <Button
            icon={<AuditOutlined />}
            onClick={handleSeedPermissions}
            loading={isLoading}
            style={{
              borderRadius: 8,
              background: token.colorSuccessBg,
              color: token.colorSuccess,
              borderColor: token.colorSuccessBorder,
            }}
          >
            Seed IPO Standard
          </Button>
        </Space>
      </div>

      {/* Permission Groups */}
      {Object.entries(groups).length === 0 && !isLoading && (
        <Card
          style={{ borderRadius: 16, textAlign: "center", padding: 48 }}
          styles={{ body: { padding: 48 } }}
        >
          <Text type="secondary">
            ยังไม่มีข้อมูล Permissions กด &quot;Seed IPO Standard&quot; เพื่อเพิ่มข้อมูลเริ่มต้น
          </Text>
        </Card>
      )}

      {Object.entries(groups).map(([groupName, groupPerms]) => {
        // ตรวจสอบว่า checkbox ในกลุ่มนี้ checked ทั้งหมดหรือไม่
        const groupIds = groupPerms.map((p) => p.id);
        const checkedInGroup = groupIds.filter((id) =>
          selectedPermKeys.includes(id)
        ).length;
        const allChecked = checkedInGroup === groupIds.length;
        const someChecked = checkedInGroup > 0 && !allChecked;

        return (
          <Card
            key={groupName}
            style={{
              borderRadius: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            styles={{ body: { padding: 20 } }}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {/* ชื่อกลุ่ม + Badge */}
                <Space size={8} align="center">
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // เพิ่ม ids ทั้งกลุ่มเข้า selectedPermKeys
                        const newKeys = Array.from(
                          new Set([...selectedPermKeys, ...groupIds])
                        );
                        setSelectedPermKeys(newKeys);
                      } else {
                        // ลบ ids ของกลุ่มออก
                        setSelectedPermKeys(
                          selectedPermKeys.filter(
                            (k) => !groupIds.includes(k as number)
                          )
                        );
                      }
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: token.colorPrimary,
                      flexShrink: 0,
                    }}
                  />
                  <Title
                    level={5}
                    style={{ margin: 0, fontSize: 14, fontFamily: "monospace" }}
                  >
                    {groupName}
                  </Title>
                  <Badge
                    count={groupPerms.length}
                    style={{
                      background: `${token.colorPrimary}20`,
                      color: token.colorPrimary,
                      border: "none",
                      fontWeight: 600,
                    }}
                  />
                </Space>

                {/* ปุ่มลบกลุ่ม */}
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteGroup(groupPerms)}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  ลบกลุ่ม
                </Button>
              </div>
            }
          >
            <Row gutter={[12, 12]}>
              {groupPerms.map((perm) => (
                <Col xs={24} sm={12} md={8} lg={6} key={perm.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${
                        selectedPermKeys.includes(perm.id)
                          ? token.colorPrimaryBorder
                          : token.colorBorderSecondary
                      }`,
                      background: selectedPermKeys.includes(perm.id)
                        ? token.colorPrimaryBg
                        : token.colorBgContainer,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (selectedPermKeys.includes(perm.id)) {
                        setSelectedPermKeys(
                          selectedPermKeys.filter((k) => k !== perm.id)
                        );
                      } else {
                        setSelectedPermKeys([...selectedPermKeys, perm.id]);
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedPermKeys.includes(perm.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedPermKeys([...selectedPermKeys, perm.id]);
                        } else {
                          setSelectedPermKeys(
                            selectedPermKeys.filter((k) => k !== perm.id)
                          );
                        }
                      }}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />

                    {/* ข้อมูล Permission */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 4 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "1px 8px",
                            borderRadius: 20,
                            background: `${token.colorWarning}15`,
                            color: token.colorWarning,
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: "monospace",
                            border: `1px solid ${token.colorWarning}25`,
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={perm.p_code}
                        >
                          {perm.p_code}
                        </span>
                      </div>
                      <Text
                        style={{ fontSize: 12, fontWeight: 500, display: "block" }}
                      >
                        {perm.name_th}
                      </Text>
                    </div>

                    {/* ปุ่มลบ */}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{ flexShrink: 0, padding: "2px 4px", borderRadius: 6 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSinglePermission(perm, modal.confirm as (config: import("antd").ModalFuncProps) => void);
                      }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        );
      })}
    </Space>
  );
};
