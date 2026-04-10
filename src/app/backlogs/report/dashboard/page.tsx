"use client";

import { AppstoreOutlined } from "@ant-design/icons";
import BackendLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useEffect, type JSX } from "react";
import { BurndownChart } from "./_components/burndown-chart";
import { FilterSection } from "./_components/filter-section";
import { IssueTimelineModal } from "./_components/issue-timeline-modal";
import { PendingTasksTable } from "./_components/pending-tasks-table";
import { QuickReassignModal } from "./_components/quick-reassign-modal";
import { RankingSection } from "./_components/ranking-section";
import { SummarySection } from "./_components/summary-section";
import { WorkloadHeatmap } from "./_components/workload-heatmap";
import { useBacklogDashboardStore } from "./_state/use-backlog-dashboard-store";

/**
 * Backlog Performance Dashboard Orchestrator
 * หน้าจอหลักสำหรับประกอบส่วนประกอบต่างๆ เข้าด้วยกันตาม Modular Architecture
 */
export default function DashboardPage(): JSX.Element {
  const { fetchAnalytics } = useBacklogDashboardStore();

  useEffect(() => {
    // โหลดข้อมูลเริ่มต้นเมื่อเข้าหน้าจอ
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BackendLayout>
      <HeaderBar
        title="แดชบอร์ดติดตามประสิทธิภาพงาน (Backlog)"
        subTitle="วิเคราะห์ปริมาณงานรายพนักงานและประสิทธิภาพการปิดงานในช่วงเวลาที่กำหนด"
        icon={<AppstoreOutlined />}
      />

      <div className="mt-6 flex w-full flex-col gap-6">
        <FilterSection />
        <SummarySection />
        <BurndownChart />
        <WorkloadHeatmap />
        <PendingTasksTable />
        <RankingSection />
      </div>

      <IssueTimelineModal />
      <QuickReassignModal />
    </BackendLayout>
  );
}
