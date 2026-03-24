"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { ReloadOutlined, SolutionOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Space } from "antd";
import { useEffect } from "react";
import { FilterSection } from "./_components/filter-section";
import { PositionModals } from "./_components/position-modals";
import { PositionTable } from "./_components/position-table";
import { SummarySection } from "./_components/summary-section";
import { usePositionStore } from "./_state/position-store";

/**
 * หน้าจัดการตำแหน่งงานหลัก (Orchestrator)
 */
export default function PositionManagementPage() {
  const { loadPositions } = usePositionStore();

  /**
   * เริ่มต้นโหลดข้อมูลเมื่อเข้าหน้า
   */
  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        {/* ส่วนหัวของหน้า */}
        <HeaderBar
          icon={<SolutionOutlined />}
          title="จัดการตำแหน่งงาน"
          subTitle="บริหารจัดการตำแหน่งพนักงานในองค์กร"
          extra={
            <Space>
              <Button onClick={() => loadPositions()} icon={<ReloadOutlined />}>
                รีเฟรช
              </Button>
            </Space>
          }
        />

        {/* ส่วนสรุปข้อมูลสถิติ */}
        <SummarySection />

        {/* ส่วนตัวกรองข้อมูล */}
        <FilterSection />

        {/* ส่วนตารางข้อมูล */}
        <PositionTable />

        {/* โมดอลจัดการข้อมูลต่างๆ */}
        <PositionModals />
      </DashboardLayout>
    </PermissionLayout>
  );
}
