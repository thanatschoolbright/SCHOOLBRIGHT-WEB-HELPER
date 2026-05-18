"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { CalendarOutlined, ReloadOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Space } from "antd";
import { LeaveFilter } from "./_components/leave-filter";
import { LeaveTable } from "./_components/leave-table";
import { useLeaveManagementStore } from "./_state/leave-management-store";

export default function LeaveManagementPage() {
  const { fetchData, isLoading, filters } = useLeaveManagementStore();

  return (
    <PermissionLayout>
      <DashboardLayout>
        {/* Header */}
        <HeaderBar
          icon={<CalendarOutlined />}
          title="จัดการการลาหยุด"
          subTitle="ตรวจสอบและบริหารจัดการข้อมูลการลาของนักเรียนและบุคลากร"
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                loading={isLoading}
                disabled={!filters.user_id}
                onClick={() => fetchData()}
              >
                รีเฟรช
              </Button>
            </Space>
          }
        />

        <div style={{ marginTop: 24 }}>
          {/* ส่วนตัวกรอง */}
          <LeaveFilter />

          {/* ตารางแสดงข้อมูล */}
          <LeaveTable />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
