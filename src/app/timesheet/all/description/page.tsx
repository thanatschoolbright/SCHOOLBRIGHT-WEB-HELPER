"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { useEffect } from "react";

import DashboardLayout from "@/components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { DeliveryTracker } from "./_components/delivery-tracker";
import { EmployeeNotifyDrawer } from "./_components/employee-notify-drawer";
import { FilterSection } from "./_components/filter-section";
import { SummaryCards } from "./_components/summary-cards";
import { TableSection } from "./_components/table-section";
import { useDescriptionStore } from "./_stores/description-store";

/**
 * หน้าตรวจสอบการลงเวลาทำงานรายวันของพนักงาน
 */
export default function TimesheetDailyReportPage() {
  const fetchDailyReport = useDescriptionStore((s) => s.fetchDailyReport);
  const fetchDepartments = useDescriptionStore((s) => s.fetchDepartments);
  const loading = useDescriptionStore((s) => s.loading);
  const metadata = useDescriptionStore((s) => s.metadata);
  const departmentIds = useDescriptionStore((s) => s.departmentIds);
  const departments = useDescriptionStore((s) => s.departments);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchDepartments();
    fetchDailyReport();
  }, [fetchDepartments, fetchDailyReport]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Flex vertical gap={24} style={{ padding: 24 }}>
          {/* ส่วนที่ 1: Header */}
          <HeaderBar
            icon={<ClockCircleOutlined />}
            title="รายงานการลงเวลาประจำวัน"
            showBackButton={true}
            subTitle={
              metadata
                ? `ช่วงวันที่: ${metadata.range.label_th} | แผนก: ${
                    departmentIds.length > 0
                      ? departmentIds
                          .map(
                            (id) =>
                              departments.find((d) => d.id === id)?.name_th ||
                              id,
                          )
                          .join(", ")
                      : "ทั้งหมด"
                  }`
                : "ตรวจสอบความเรียบร้อยในการกรอกไทม์ชีทรายวัน"
            }
            extra={
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                onClick={fetchDailyReport}
                loading={loading}
                shape="round"
                size="large"
              >
                รีเฟรชข้อมูล
              </Button>
            }
          />

          {/* ส่วนที่ 2: Summary Cards */}
          <SummaryCards />

          {/* ส่วนที่ 3: Filter */}
          <FilterSection />

          {/* ส่วนที่ 4: Table */}
          <TableSection />
        </Flex>

        <StatusModalComponent open={false} type="success" onClose={() => {}} />

        {/* Delivery Tracking Modal — แสดงเมื่อกำลังส่งการแจ้งเตือน */}
        <DeliveryTracker />

        {/* Employee Notify Drawer — แสดง progress การส่งอีเมลพนักงานทีละคน */}
        <EmployeeNotifyDrawer />
      </DashboardLayout>
    </PermissionLayout>
  );
}
