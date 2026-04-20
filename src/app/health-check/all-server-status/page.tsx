"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Form, Space } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { StatusModalComponent } from "@components/modal/status-modal-component";

// Feature-based sub-components
import SummarySection from "./_components/summary-section";
import FilterSection from "./_components/filter-section";
import ServerTable from "./_components/server-table";
import DetailsModal from "./_components/details-modal";
import EditModal from "./_components/edit-modal";

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
  const { servers, fetchServers } = useServerStatusStore();

  // --- Local States for Modals ---
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  
  // State สำหรับการกรองข้อมูลในตาราง
  const [filters, setFilters] = useState({ name: "", status: "all" });

  // --- Effects ---
  useEffect(() => {
    /** ดึงข้อมูลสถานะเซิร์ฟเวอร์เริ่มต้น */
    fetchServers();
  }, [fetchServers]);

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

  // --- Handlers ---
  
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

  return (
    <DashboardLayout>
      {/* 1. Header Section */}
      <HeaderBar
        title="ระบบตรวจสอบสถานะเซิร์ฟเวอร์"
        subTitle="ภาพรวมความพร้อมใช้งานและความเร็วในการตอบสนองของระบบทั้งหมดแบบเรียลไทม์"
        icon={<SafetyCertificateOutlined />}
      />

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* 2. Summary Section - ดึงค่าจาก Store อัตโนมัติ */}
        <SummarySection />

        {/* 3. Filter Section */}
        <FilterSection 
          form={filterForm} 
          onSearch={handleFilterUpdate} 
          onReset={handleFilterReset} 
        />

        {/* 4. Table & Content Section */}
        <ServerTable 
          data={filteredServers} 
          onViewDetails={handleOpenDetails} 
          onEditDescription={handleOpenEdit} 
        />
      </Space>

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

      {/* พื้นที่สำหรับ Status Modal กลาง หากจำเป็นต้องใช้งานในอนาคต */}
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
