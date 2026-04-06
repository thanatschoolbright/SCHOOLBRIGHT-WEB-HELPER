"use client";

import { ClockCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Switch, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import ExportModalTemplate4 from "@components/modal/timesheet-export-modal-template4";
import { getUserData } from "@helpers/local_storage/user.storage";
import { setUsers } from "@stores/reducers/timesheet.reducer";
import { FilterSection } from "./_components/filter-section";
import { SummaryCards } from "./_components/summary-cards";
import { TableSection } from "./_components/table-section";
import {
  AUTO_REFRESH_INTERVAL_SEC,
  useTimesheetAllStore,
} from "./_stores/timesheet-all-store";

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
  const lastUpdated = useTimesheetAllStore((s) => s.lastUpdated);
  const autoRefresh = useTimesheetAllStore((s) => s.autoRefresh);
  const setAutoRefresh = useTimesheetAllStore((s) => s.setAutoRefresh);

  // นับถอยหลังสำหรับ auto-refresh (วินาที)
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // จัดการ auto-refresh และ countdown
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!autoRefresh) {
      setCountdown(AUTO_REFRESH_INTERVAL_SEC);
      return;
    }
    setCountdown(AUTO_REFRESH_INTERVAL_SEC);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchSummary();
          return AUTO_REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchSummary]);

  // โหลด users จาก local storage เข้า Redux store และดึงข้อมูลครั้งแรก
  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) dispatch(setUsers(allUsers));
    fetchSummary();
  }, [dispatch, fetchSummary]);

  // แปลง countdown เป็น mm:ss
  const countdownLabel = `${String(Math.floor(countdown / 60)).padStart(
    2,
    "0",
  )}:${String(countdown % 60).padStart(2, "0")}`;

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
              <Flex align="center" gap={16}>
                {/* Last updated timestamp */}
                {lastUpdated && (
                  <Flex vertical align="flex-end" gap={2}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      อัปเดตล่าสุด
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 12, fontWeight: 600 }}>
                      {dayjs(lastUpdated).format("HH:mm:ss")}
                    </Typography.Text>
                  </Flex>
                )}

                {/* Auto-refresh toggle + countdown */}
                <Flex vertical align="center" gap={4}>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    checkedChildren={<SyncOutlined spin />}
                    unCheckedChildren={<SyncOutlined />}
                    size="small"
                  />
                  {autoRefresh && (
                    <Tag
                      color="processing"
                      style={{ fontSize: 10, margin: 0, lineHeight: "16px" }}
                    >
                      {countdownLabel}
                    </Tag>
                  )}
                </Flex>

                {/* Refresh button */}
                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={fetchSummary}
                  loading={loading}
                  shape="round"
                  size="large"
                >
                  รีเฟรชข้อมูล
                </Button>
              </Flex>
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
