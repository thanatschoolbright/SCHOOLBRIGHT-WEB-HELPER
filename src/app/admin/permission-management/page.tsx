"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  AuditOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  App,
  Button,
  Modal,
  Space,
  Tabs,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useEffect } from "react";
import { PermissionsTab } from "./_components/permissions-tab";
import { RoleFormModal } from "./_components/role-form-modal";
import { RolesTab } from "./_components/roles-tab";
import { usePermissionManagementStore } from "./_state/permission-management-store";

const { Text } = Typography;

export default function PermissionManagementPage() {
  const { token } = theme.useToken();
  const { modal } = App.useApp();

  const {
    fetchData,
    isLoading,
    selectedRole,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeleteRole,
    handleSeedPermissions,
  } = usePermissionManagementStore();

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Seed พร้อม confirm dialog
  const onSeedClick = () => {
    modal.confirm({
      title: "ติดตั้งสิทธิ์มาตรฐาน (System Menu Seeding)",
      content:
        "ระบบจะสร้าง Permission ตามโครงสร้างเมนูและมาตรฐาน IPO ปัจจุบัน (รวมถึงเมนูใหม่ที่คุณเพิ่มเข้ามา)",
      okText: "ติดตั้งเลย",
      onOk: handleSeedPermissions,
    });
  };

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <div style={{ padding: "8px 24px 24px 24px" }}>
          {/* Header */}
          <HeaderBar
            icon={<SafetyCertificateOutlined />}
            title="จัดการบทบาทและความปลอดภัย"
            subTitle="กำหนดระดับการเข้าถึงข้อมูลตามบทบาทหน้าที่ (Role-Based Access Control)"
            extra={
              <Space size={12}>
                <Tooltip title="อัปเดตสิทธิ์พื้นฐานตามมาตรฐานระบบ">
                  <Button
                    icon={<AuditOutlined />}
                    onClick={onSeedClick}
                    style={{
                      borderRadius: 10,
                      height: 40,
                      fontWeight: 600,
                    }}
                  >
                    ติดตั้งค่าเริ่มต้น
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={isLoading}
                  onClick={fetchData}
                  style={{
                    borderRadius: 10,
                    height: 40,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${token.colorPrimary}40`,
                  }}
                >
                  รีเฟรชข้อมูล
                </Button>
              </Space>
            }
          />

          {/* Main Tabs */}
          <div style={{ marginTop: 32 }}>
            <Tabs
              defaultActiveKey="1"
              size="large"
              tabBarStyle={{
                borderBottom: `2px solid ${token.colorBorderSecondary}`,
                marginBottom: 0,
                paddingLeft: 4,
              }}
              items={[
                {
                  key: "1",
                  label: (
                    <Space style={{ padding: "4px 12px" }}>
                      <LockOutlined style={{ fontSize: 18 }} />
                      <span style={{ fontWeight: 700 }}>บทบาทหน้าที่</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ paddingTop: 32 }}>
                      <RolesTab />
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <Space style={{ padding: "4px 12px" }}>
                      <UnlockOutlined style={{ fontSize: 18 }} />
                      <span style={{ fontWeight: 700 }}>รายการสิทธิ์</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ paddingTop: 32 }}>
                      <PermissionsTab />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Modal: Create / Edit Role */}
        <RoleFormModal />

        {/* Modal: Confirm Delete Role */}
        <Modal
          title="ยืนยันการลบบทบาท"
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDeleteRole}
          okButtonProps={{ danger: true, style: { borderRadius: 8 } }}
          cancelButtonProps={{ style: { borderRadius: 8 } }}
          okText="ลบบทบาท"
          cancelText="ยกเลิก"
        >
          <Text>
            คุณต้องการลบบทบาท{" "}
            <Text strong style={{ color: token.colorError }}>
              {selectedRole?.role_name}
            </Text>{" "}
            หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Text>
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
