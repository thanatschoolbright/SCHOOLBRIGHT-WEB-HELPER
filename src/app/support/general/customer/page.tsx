"use client";

import { ClockCircleOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Flex, Tabs, Typography } from "antd";
import { useEffect } from "react";

import BackendLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import ActivityLogTab from "./_components/activity-log-tab";
import CustomerFilter from "./_components/customer-filter";
import CustomerTable from "./_components/customer-table";
import UnlockAllModal from "./_components/unlock-all-modal";
import UnlockConfirmModal from "./_components/unlock-confirm-modal";
import { useCustomerStore } from "./_stores/use-customer-store";

// หน้าจัดการลูกค้า — รองรับการปลดล็อกบัญชีและ Activity Log
export default function CustomerManagementPage() {
  const { fetchCustomers, fetchCompanies } = useCustomerStore();

  useEffect(() => {
    fetchCompanies();
    fetchCustomers();
  }, [fetchCustomers, fetchCompanies]);

  return (
    <BackendLayout>
      <HeaderBar
        icon={<TeamOutlined />}
        title="จัดการลูกค้า"
        subTitle="Customer Management"
      />

      <Tabs
        defaultActiveKey="unlock"
        items={[
          {
            key: "unlock",
            label: (
              <Flex align="center" gap={6}>
                <LockOutlined />
                <span>ปลดล็อกบัญชี</span>
              </Flex>
            ),
            children: (
              <Card styles={{ body: { padding: 16 } }} style={{ marginBottom: 16 }}>
                <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  ลูกค้าจะถูกล็อกบัญชีอัตโนมัติเมื่อกรอกรหัสผ่านผิดครบ 5 ครั้ง ในระบบ SchoolBright
                  แสดงเฉพาะบัญชีที่มีสถานะถูกล็อกอยู่ในปัจจุบัน
                </Typography.Text>
                <CustomerFilter />
                <CustomerTable />
              </Card>
            ),
          },
          {
            key: "log",
            label: (
              <Flex align="center" gap={6}>
                <ClockCircleOutlined />
                <span>Log</span>
              </Flex>
            ),
            children: <ActivityLogTab />,
          },
        ]}
      />

      <UnlockConfirmModal />
      <UnlockAllModal />
    </BackendLayout>
  );
}
