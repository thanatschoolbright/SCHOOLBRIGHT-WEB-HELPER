"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import ExportModalTemplate4 from "@components/modal/timesheet-export-modal-template4";
import { getUserData } from "@helpers/local_storage/user.storage";
import { setUsers } from "@stores/reducers/timesheet.reducer";
import { useAppSelector } from "@stores/store";
import { FilterSection } from "./_components/filter-section";
import { SummaryCards } from "./_components/summary-cards";
import { TableSection } from "./_components/table-section";
import { useTimesheetAllStore } from "./_stores/timesheet-all-store";
import { useExportHandlers } from "./hooks/use-export-handlers.data";

/**
 * หน้าจอหลักสำหรับจัดการและดูรายงานความคืบหน้าการบันทึกเวลาทำงานของพนักงานทั้งหมด
 */
export default function TimesheetAllPage() {
  const dispatch = useDispatch();

  const fetchSummary = useTimesheetAllStore((s) => s.fetchSummary);
  const loading = useTimesheetAllStore((s) => s.loading);
  const metadata = useTimesheetAllStore((s) => s.metadata);
  const statusModal = useTimesheetAllStore((s) => s.statusModal);
  const closeStatusModal = useTimesheetAllStore((s) => s.closeStatusModal);
  const modalFlags = useTimesheetAllStore((s) => s.modalFlags);
  const closeModal = useTimesheetAllStore((s) => s.closeModal);

  const { exportLoading } = useAppSelector((state) => state.timesheetAll);
  const { requestExportTemplate4 } = useExportHandlers();

  // โหลด users จาก local storage เข้า Redux store และดึงข้อมูลครั้งแรก
  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) dispatch(setUsers(allUsers));
    fetchSummary();
  }, [dispatch, fetchSummary]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Flex vertical gap={24} style={{ padding: 24 }}>
          {/* ส่วนที่ 1: Header */}
          <HeaderBar
            icon={<ClockCircleOutlined />}
            title="จัดการบันทึกเวลา"
            subTitle={
              metadata
                ? `ช่วงวันที่: ${metadata.range.label_th}`
                : "ระบบบริหารจัดการข้อมูลการลงเวลาทำงาน"
            }
            extra={
              <Button
                icon={<ClockCircleOutlined />}
                onClick={fetchSummary}
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

          {/* ส่วนที่ 4: Table + Actions + Footer */}
          <TableSection />
        </Flex>

        {/* Modals */}
        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={closeStatusModal}
          onConfirm={statusModal.onConfirm}
        />

        <ExportModalTemplate4
          visible={modalFlags.exportModal4}
          onClose={() => closeModal("exportModal4")}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
