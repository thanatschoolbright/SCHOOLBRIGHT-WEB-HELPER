"use client";

import React, { useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { HeaderSectionComponent } from "./components/header-section.component";
import { MetricSummaryComponent } from "./components/metric-summary.component";
import { FilterBarComponent } from "./components/filter-bar.component";
import { TimelineChartComponent } from "./components/timeline-chart.component";
import { ProjectEditModalComponent } from "./components/project-edit-modal.component";
import { useTimelineData } from "./hooks/use-timeline-data.data";
import { ModalState } from "./types/timeline.types";

export default function TimelinePage() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const currentAdminId = AUTHENTICATION?.response?.data?.user_data?.admin_id;

  const { loading, data, metrics, filters, setFilters, fetchData } =
    useTimelineData();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    type: "project",
  });

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
          {/* Metrics */}
          <MetricSummaryComponent metrics={metrics} loading={loading} />

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
          />
        </div>

        {/* Edit Modal */}
        <ProjectEditModalComponent
          modal={modal}
          currentAdminId={currentAdminId}
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
