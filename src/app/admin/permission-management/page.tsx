"use client";

import { useEffect } from "react";
import { App, Button, Modal, Space, Tabs, Typography, theme } from "antd";
import {
  AuditOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { RolesTab } from "./_components/roles-tab";
import { PermissionsTab } from "./_components/permissions-tab";
import { RoleFormModal } from "./_components/role-form-modal";
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
        {/* Header */}
        <HeaderBar
          icon={<SafetyCertificateOutlined />}
          title="จัดการบทบาทและสิทธิ์ (RBAC)"
          subTitle="กำหนดโครงสร้างการเข้าถึงตามหลัก Separation of Duties (IPO Standard)"
          extra={
            <Space>
              <Button
                icon={<AuditOutlined />}
                onClick={onSeedClick}
                style={{ borderRadius: 8 }}
              >
                Seed IPO
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={isLoading}
                onClick={fetchData}
                style={{ borderRadius: 8 }}
              >
                รีเฟรช
              </Button>
            </Space>
          }
        />

        {/* Main Tabs */}
        <Tabs
          defaultActiveKey="1"
          size="large"
          style={{ marginTop: 8 }}
          tabBarStyle={{
            background: token.colorBgContainer,
            borderRadius: "12px 12px 0 0",
            padding: "0 16px",
            marginBottom: 0,
          }}
          items={[
            {
              key: "1",
              label: (
                <Space>
                  <LockOutlined />
                  <span>จัดการบทบาท (Roles)</span>
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <RolesTab />
                </div>
              ),
            },
            {
              key: "2",
              label: (
                <Space>
                  <UnlockOutlined />
                  <span>รายสิทธิ์ (Permissions)</span>
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <PermissionsTab />
                </div>
              ),
            },
          ]}
        />

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
