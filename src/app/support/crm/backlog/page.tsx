"use client";

import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  AlertOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Flex, Tabs, theme } from "antd";
import { useEffect } from "react";
import { CrmFormDrawer } from "./_components/crm-form-drawer";
import { CrmTable } from "./_components/crm-table";
import { DashboardSection } from "./_components/dashboard-section";
import { FilterSection } from "./_components/filter-section";
import { useCrmStore } from "./_state/crm-store";
import DashboardLayout from "@components/layouts/backend-layout";

const TAB_ITEMS = [
  { key: "all", label: "เคสทั้งหมด", icon: <UnorderedListOutlined /> },
  { key: "upcoming", label: "ใกล้ครบกำหนด", icon: <CalendarOutlined /> },
  { key: "follow_up", label: "ต้องติดตาม", icon: <AlertOutlined /> },
  { key: "overdue", label: "เลยกำหนด", icon: <FieldTimeOutlined /> },
];

export default function CrmBacklogPage() {
  const { token } = theme.useToken();
  const { fetchList, setFilters, summary, isLoading } = useCrmStore();

  // โหลดข้อมูลครั้งแรกเมื่อหน้าจอเปิด
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key: string) => {
    setFilters({ tab: key as "all" | "upcoming" | "follow_up" | "overdue" });
  };

  return (
    <DashboardLayout>
      <Flex
        vertical
        gap={16}
        style={{
          padding: 24,
          minHeight: "100vh",
          backgroundColor: token.colorBgLayout,
        }}
      >
        {/* ส่วนหัวหน้าจอ */}
        <HeaderBar
          icon={<AlertOutlined />}
          title="ระบบจัดการเคส CRM"
          subTitle="บริหารและติดตามเคสการสนับสนุนลูกค้าทั้งหมด"
        />

        {/* Summary Dashboard */}
        <DashboardSection summary={summary} isLoading={isLoading} />

        {/* Filter */}
        <FilterSection />

        {/* Tab สลับมุมมอง */}
        <Tabs
          defaultActiveKey="all"
          items={TAB_ITEMS}
          onChange={handleTabChange}
          style={{
            backgroundColor: token.colorBgContainer,
            padding: "0 16px",
            borderRadius: token.borderRadius,
          }}
        />

        {/* ตารางรายการเคส */}
        <CrmTable />

        {/* Drawer สำหรับสร้าง/แก้ไขเคส */}
        <CrmFormDrawer />
      </Flex>
    </DashboardLayout>
  );
}
