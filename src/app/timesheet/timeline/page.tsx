"use client";

import React, { useState } from "react";
import { theme } from "antd";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { HeaderSectionComponent } from "./components/header-section.component";
import SummaryCards from "@/components/card/summary-card/summary-card.component";
import { FilterBarComponent } from "./components/filter-bar.component";
import { TimelineChartComponent } from "./components/timeline-chart.component";
import { ProjectEditModalComponent } from "./components/project-edit-modal.component";
import { useTimelineData } from "./hooks/use-timeline-data.data";
import { ModalState } from "./types/timeline.types";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

export default function TimelinePage() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const currentAdminId = AUTHENTICATION?.response?.data?.user_data?.admin_id;
  const { token } = theme.useToken();

  const { loading, data, metrics, filters, setFilters, fetchData } =
    useTimelineData();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    type: "project",
  });

  const [projectStatuses, setProjectStatuses] = useState<any[]>([]);

  // Fetch project statuses
  React.useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch("/api/v1/timesheet/project/status/read/", {
          method: "POST",
        });
        const json = await res.json();
        if (json.status === 200 && json.data) {
          setProjectStatuses(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch project statuses:", error);
      }
    };
    fetchStatuses();
  }, []);

  // Prepare custom items for SummaryCards
  const tooltipContent = (
    label: string,
    source: string,
    calc: string,
    utility: string,
  ) => (
    <div style={{ padding: "4px" }}>
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          paddingBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
          ที่มา:
        </span>{" "}
        <span style={{ fontSize: 11 }}>{source}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
          การคำนวณ:
        </span>{" "}
        <span style={{ fontSize: 11 }}>{calc}</span>
      </div>
      <div>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
          ประโยชน์:
        </span>{" "}
        <span style={{ fontSize: 11 }}>{utility}</span>
      </div>
    </div>
  );

  const timelineMetricItems = [
    {
      label: "โครงการทั้งหมด",
      value: metrics.totalProjects,
      percent: 100,
      color: token.colorPrimary,
      bg: token.colorPrimaryBg,
      icon: <ProjectOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "โครงการทั้งหมด",
        "ดึงข้อมูลจากฐานข้อมูลโครงการ (ยกเว้นที่ถูกลบ)",
        "นับจำนวนโครงการหลักทั้งหมดที่อยู่ในระบบ",
        "ใช้ดูภาพรวมปริมาณโครงการทั้งหมดที่อยู่ในการจัดการ",
      ),
    },
    {
      label: "โครงการย่อย",
      value: metrics.totalSubProjects,
      percent:
        metrics.totalProjects > 0
          ? (metrics.totalSubProjects / metrics.totalProjects) * 100
          : 0,
      color: "#8b5cf6",
      bg: token.colorPrimaryBg,
      icon: <AppstoreOutlined />,
      suffix: "งาน",
      tooltip: tooltipContent(
        "โครงการย่อย",
        "งานย่อยภายใต้โครงการหลัก (Features)",
        "นับจำนวน sub-projects ทั้งหมด",
        "ดูรายละเอียดงานย่อยที่แตกแขนงออกมาจากโครงการหลัก",
      ),
    },
    {
      label: "กำลังดำเนินการ",
      value: metrics.inProgress,
      percent:
        metrics.totalProjects > 0
          ? (metrics.inProgress / metrics.totalProjects) * 100
          : 0,
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <SyncOutlined spin={loading} />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "กำลังดำเนินการ",
        "โครงการที่มีสถานะเป็น 'เปิดใช้งาน' (Open)",
        "กรองโครงการที่มีสถานะ Open",
        "ติดตามความคืบหน้าของงานที่กำลังทำอยู่",
      ),
    },
    {
      label: "เสร็จสมบูรณ์",
      value: metrics.completed,
      percent:
        metrics.totalProjects > 0
          ? (metrics.completed / metrics.totalProjects) * 100
          : 0,
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <CheckCircleOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "เสร็จสมบูรณ์",
        "โครงการที่มีสถานะเป็น 'ปิดโครงการ' (Close)",
        "กรองโครงการที่มีสถานะ Close",
        "ดูโครงการที่ดำเนินการเสร็จสิ้นแล้ว",
      ),
    },
    {
      label: "เกินกำหนด",
      value: metrics.overdue,
      percent:
        metrics.totalProjects > 0
          ? (metrics.overdue / metrics.totalProjects) * 100
          : 0,
      color: token.colorError,
      bg: token.colorErrorBg,
      icon: <WarningOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "เกินกำหนด",
        "โครงการที่เลยวันที่กำหนดเสร็จ",
        "เปรียบเทียบวันปัจจุบันกับวันที่สิ้นสุด",
        "เตือนโครงการที่ต้องเร่งดำเนินการ",
      ),
    },
  ];

  const statsForSummaryCard = {
    health: {
      total: metrics.totalProjects,
      active: metrics.inProgress,
      closed: metrics.completed,
      success_rate:
        metrics.totalProjects > 0
          ? Math.round((metrics.completed / metrics.totalProjects) * 100)
          : 0,
    },
  };

  const handleCreateProject = () => {
    setModal({
      open: true,
      mode: "create",
      type: "project",
    });
  };

  const handleAddSubProject = (projectId: number) => {
    setModal({
      open: true,
      mode: "create",
      type: "sub-project",
      parentId: projectId,
    });
  };

  const handleItemClick = (item: any) => {
    setModal({
      open: true,
      mode: "edit",
      type: item.type,
      initialValues: item,
    });
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderSectionComponent />

        <div className="space-y-6">
          {/* Project Status Dashboard */}

          {/* Metrics */}
          <SummaryCards
            stats={statsForSummaryCard}
            token={token}
            items={timelineMetricItems}
            title="สรุปภาพรวม Timeline"
            icon={<ProjectOutlined />}
            loading={loading}
          />

          {/* Filters & Actions */}
          <FilterBarComponent
            filters={filters}
            setFilters={setFilters}
            onRefresh={fetchData}
            onCreateProject={handleCreateProject}
            loading={loading}
          />

          {/* Timeline Chart */}
          <TimelineChartComponent
            data={data}
            onItemClick={handleItemClick}
            onAddSubProject={handleAddSubProject}
            loading={loading}
            showChildren={filters.viewType === "all"}
            zoomLevel={filters.zoomLevel}
          />
        </div>

        {/* Edit Modal */}
        <ProjectEditModalComponent
          modal={modal}
          currentAdminId={currentAdminId}
          allProjects={data}
          projectStatuses={projectStatuses}
          onCancel={() => setModal({ ...modal, open: false })}
          onSuccess={() => {
            setModal({ ...modal, open: false });
            fetchData();
          }}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
