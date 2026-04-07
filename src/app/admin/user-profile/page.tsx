"use client";

import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Modal,
  Row,
  Space,
  theme,
  Typography,
} from "antd";
import { useEffect } from "react";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import { useAppSelector } from "@stores/store";

import { BulkUpdateModal } from "./_components/bulk-update-modal";
import { DetailModal } from "./_components/detail-modal";
import { FilterSection } from "./_components/filter-section";
import { ResetPasswordModal } from "./_components/reset-password-modal";
import { SyncModal } from "./_components/sync-modal";
import { UserTable } from "./_components/user-table";
import { useUserProfileStore } from "./_stores/user-profile-store";

export default function UserManagementPage() {
  const { token } = theme.useToken();

  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  const {
    users,
    isLoading,
    syncModalOpen,
    roleDrawerOpen,
    deleteModalOpen,
    trackingModalOpen,
    usersToReset,
    statusModal,
    selectedUser,
    fetchInitialData,
    setSyncModalOpen,
    setRoleDrawerOpen,
    closeDeleteModal,
    closeTrackingModal,
    closeStatusModal,
    deleteUser,
  } = useUserProfileStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // คำนวณ Summary Metrics จาก Raw State
  const summaryMetrics = [
    {
      title: "พนักงานทั้งหมด",
      value: users.length,
      icon: <TeamOutlined />,
      color: token.colorPrimary,
    },
    {
      title: "สถานะ Active",
      value: users.filter((u) => u.status === "ACTIVE").length,
      icon: <CheckCircleOutlined />,
      color: token.colorSuccess,
    },
    {
      title: "โดนระงับ (Locked)",
      value: users.filter((u) => (u.failed_login_attempts ?? 0) >= 5).length,
      icon: <LockOutlined />,
      color: token.colorError,
    },
    {
      title: "จำนวน Admin",
      value: users.filter((u) => u.role?.id === 1).length,
      icon: <SafetyCertificateOutlined />,
      color: "#722ed1",
    },
  ];

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <SyncModal
          open={syncModalOpen}
          onCancel={() => setSyncModalOpen(false)}
          onSuccess={fetchInitialData}
        />

        <HeaderBar
          icon={<TeamOutlined />}
          title="จัดการผู้ใช้งาน"
          subTitle="ระบบจัดการพนักงานและสิทธิ์การเข้าใช้งาน"
          extra={
            <Space>
              <Button
                onClick={fetchInitialData}
                icon={<ReloadOutlined />}
                shape="round"
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<CloudSyncOutlined />}
                onClick={() => setSyncModalOpen(true)}
                shape="round"
              >
                ซิงค์ข้อมูลชุดเก่า
              </Button>
              <Button
                icon={<SolutionOutlined />}
                onClick={() => setRoleDrawerOpen(true)}
                shape="round"
              >
                จัดการบทบาท
              </Button>
            </Space>
          }
        />

        <Row gutter={[24, 24]} className="mb-8">
          {summaryMetrics.map((metrics, index) => (
            <Col key={index} xs={24} md={12} lg={6}>
              <SummaryCard {...metrics} isLoading={isLoading} />
            </Col>
          ))}
        </Row>

        <FilterSection onSearch={fetchInitialData} />

        <UserTable />

        {/* Role Management Drawer */}
        <Drawer
          title="จัดการบทบาทและสิทธิ์"
          open={roleDrawerOpen}
          onClose={() => setRoleDrawerOpen(false)}
          width={600}
        >
          <div className="text-center p-10">
            <Typography.Text type="secondary">
              <SafetyCertificateOutlined
                className="mb-4"
                style={{ fontSize: 40 }}
              />
              <p>ระบบจัดการบทบาทและสิทธิ์การใช้งาน อยู่ระหว่างการพัฒนา</p>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                สามารถจัดการได้ผ่านตารางฐานข้อมูล: Role, RolePermission
              </Typography.Text>
            </Typography.Text>
          </div>
        </Drawer>

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <Space style={{ color: token.colorError }}>
              <ExclamationCircleOutlined /> ยืนยันการลบ
            </Space>
          }
          open={deleteModalOpen}
          onCancel={closeDeleteModal}
          onOk={() => deleteUser(adminId)}
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณแน่ใจหรือไม่ที่จะลบพนักงาน:{" "}
            <span style={{ fontWeight: 600 }}>
              {selectedUser?.firstname_th} {selectedUser?.lastname_th}
            </span>
          </p>
          <Typography.Text
            type="danger"
            style={{ fontSize: "12px", display: "block" }}
          >
            *ข้อมูลพนักงานจะยังคงอยู่ในระบบแต่จะไม่ถูกนำมาแสดงผลเพื่อให้สามารถเรียกดูประวัติย้อนหลังได้
          </Typography.Text>
        </Modal>

        <DetailModal />

        <ResetPasswordModal
          open={trackingModalOpen}
          users={usersToReset}
          adminId={adminId}
          onComplete={() => {
            closeTrackingModal();
            useUserProfileStore.getState().setSelectedRowKeys([]);
            fetchInitialData();
          }}
          onCancel={closeTrackingModal}
        />

        <BulkUpdateModal />

        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          loading={statusModal.loading}
          confirmLabel={statusModal.confirmLabel}
          cancelLabel={statusModal.cancelLabel}
          onClose={closeStatusModal}
          onConfirm={statusModal.onConfirm}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
