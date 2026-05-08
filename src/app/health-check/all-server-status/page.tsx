"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, Flex, Form, Space, Tabs } from "antd";
import {
  SafetyCertificateOutlined,
  MailOutlined,
  DiscordOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { StatusModalComponent } from "@components/modal/status-modal-component";

// Feature-based sub-components — แท็บ Real-time Status
import SummarySection from "./_components/summary-section";
import FilterSection from "./_components/filter-section";
import ServerTable from "./_components/server-table";
import DetailsModal from "./_components/details-modal";
import EditModal from "./_components/edit-modal";

// Feature-based sub-components — แท็บ LOG
import LogSummarySection from "./_components/log-summary-section";
import LogFilterSection from "./_components/log-filter-section";
import LogServerUptimeTable from "./_components/log-server-uptime-table";
import LogEntriesTable from "./_components/log-entries-table";
import LogDailySummaryChart from "./_components/log-daily-summary-chart";
import LogManagementPanel from "./_components/log-management-panel";

// Global State
import { useServerStatusStore, ServerStatus } from "./_state/server-status.state";

/**
 * หน้าจอระบบตรวจสอบสถานะเซิร์ฟเวอร์ (Server Status Monitoring)
 * พัฒนาตามมาตรฐาน Frontend Standard (Modular Architecture)
 * - แยก Logic ไปที่ Zustand Store
 * - แยก UI ไปที่ Sub-components ใน _components/
 */
export default function ServerStatusPage() {
  // --- Hooks ---
  const [filterForm] = Form.useForm();
  const [logFilterForm] = Form.useForm();
  const {
    servers,
    fetchServers,
    isSendingEmail,
    isNotifyingDiscord,
    sendEmailReport,
    notifyDiscord,
    fetchLogs,
    fetchLogSummary,
    setLogFilters,
    resetLogFilters,
  } = useServerStatusStore();

  // --- Local States for Modals ---
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // State สำหรับการกรองข้อมูลในตาราง Real-time
  const [filters, setFilters] = useState({ name: "", status: "all" });

  // State สำหรับ active tab
  const [activeTab, setActiveTab] = useState("status");

  // --- Effects ---
  useEffect(() => {
    /** ดึงข้อมูลสถานะเซิร์ฟเวอร์เริ่มต้น */
    fetchServers();
  }, [fetchServers]);

  // ✨ โหลดข้อมูล Log เมื่อเปิดแท็บ LOG ครั้งแรก
  useEffect(() => {
    if (activeTab === "log") {
      fetchLogSummary();
      fetchLogs(1);
    }
  }, [activeTab, fetchLogSummary, fetchLogs]);

  // --- Memos ---
  /** กรองข้อมูลเซิร์ฟเวอร์สำหรับแสดงผลในตารางเท่านั้น (Raw data ยังอยู่ใน Store) */
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const matchName = (server.server_name_th || server.server_name || "")
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchStatus =
        filters.status === "all" || server.status === filters.status;
      return matchName && matchStatus;
    });
  }, [servers, filters]);

  // --- Handlers — Real-time tab ---

  /** ฟังก์ชันจัดการการค้นหาข้อมูล */
  const handleFilterUpdate = (values: { name?: string; status?: string }) => {
    setFilters({
      name: values.name ?? "",
      status: values.status ?? "all",
    });
  };

  /** ฟังก์ชันล้างค่าการกรองข้อมูล */
  const handleFilterReset = () => {
    filterForm.resetFields();
    setFilters({ name: "", status: "all" });
  };

  /** ฟังก์ชันเปิดแสดงข้อมูลรายละเอียดเชิงลึก */
  const handleOpenDetails = (server: ServerStatus) => {
    setSelectedServer(server);
    setDetailsVisible(true);
  };

  /** ฟังก์ชันเปิดแสดงฟอร์มแก้ไขหมายเหตุ */
  const handleOpenEdit = (server: ServerStatus) => {
    setSelectedServer(server);
    setEditVisible(true);
  };

  /** ฟังก์ชันปิดหน้าต่าง Modal ทั้งหมด */
  const handleCloseModals = () => {
    setDetailsVisible(false);
    setEditVisible(false);
  };

  // --- Handlers — Log tab ---

  /** ฟังก์ชันค้นหา Log ตาม filter */
  const handleLogSearch = (values: any) => {
    setLogFilters(values);
    fetchLogSummary();
    fetchLogs(1);
  };

  /** ฟังก์ชันล้าง filter ของ Log tab */
  const handleLogReset = () => {
    logFilterForm.resetFields();
    resetLogFilters();
    fetchLogSummary();
    fetchLogs(1);
  };

  // --- Tab definitions ---
  const tabItems = [
    {
      key: "status",
      label: (
        <Space>
          <UnorderedListOutlined />
          สถานะ Real-time
        </Space>
      ),
      children: (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {/* Summary Section - ดึงค่าจาก Store อัตโนมัติ */}
          <SummarySection />

          {/* Filter Section */}
          <FilterSection
            form={filterForm}
            onSearch={handleFilterUpdate}
            onReset={handleFilterReset}
          />

          {/* Table & Content Section */}
          <ServerTable
            data={filteredServers}
            onViewDetails={handleOpenDetails}
            onEditDescription={handleOpenEdit}
          />
        </Space>
      ),
    },
    {
      key: "log",
      label: (
        <Space>
          <HistoryOutlined />
          LOG
        </Space>
      ),
      children: (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {/* จัดการ LOG — สรุปรายวัน + ลบ log เก่า */}
          <LogManagementPanel />

          {/* Graph Uptime รายวัน (จาก Daily Summary) */}
          <LogDailySummaryChart />

          {/* Log Filter */}
          <LogFilterSection
            form={logFilterForm}
            onSearch={handleLogSearch}
            onReset={handleLogReset}
          />

          {/* Summary Cards — Uptime/Downtime */}
          <LogSummarySection />

          {/* Per-Server Uptime Table */}
          <LogServerUptimeTable />

          {/* Raw Log Entries */}
          <LogEntriesTable />
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* 1. Header Section */}
      <HeaderBar
        title="ระบบตรวจสอบสถานะเซิร์ฟเวอร์"
        subTitle="ภาพรวมความพร้อมใช้งานและความเร็วในการตอบสนองของระบบทั้งหมดแบบเรียลไทม์"
        icon={<SafetyCertificateOutlined />}
        extra={
          <Flex gap="middle">
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={sendEmailReport}
              loading={isSendingEmail}
              style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
            >
              ส่งรายงานทาง Email
            </Button>
            <Button
              type="primary"
              style={{ backgroundColor: "#5865F2", borderColor: "#5865F2" }}
              icon={<DiscordOutlined />}
              onClick={notifyDiscord}
              loading={isNotifyingDiscord}
            >
              แจ้งเตือนผ่าน Discord
            </Button>
          </Flex>
        }
      />

      {/* 2. Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginTop: 8 }}
      />

      {/* --- Modals --- */}
      <DetailsModal
        server={selectedServer}
        open={detailsVisible}
        onClose={handleCloseModals}
      />

      <EditModal
        server={selectedServer}
        open={editVisible}
        onClose={handleCloseModals}
      />

      <StatusModalComponent
        open={false}
        type="success"
        title=""
        message=""
        onClose={() => {}}
      />
    </DashboardLayout>
  );
}
