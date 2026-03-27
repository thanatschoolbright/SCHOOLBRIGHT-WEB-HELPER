"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { AreaChartOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { Card, theme } from "antd";
import { useEffect } from "react";
import { toast } from "sonner";
import FilterSection from "./_components/filter-section";
import { SubProjectFormModal } from "./_components/sub-project-form-modal";
import SummarySection from "./_components/summary-section";
import TimelineChart from "./_components/timeline-chart";
import WorkloadTimeSeries from "./_components/workload-time-series";
import { useTimelineStore } from "./_state/timeline-store";

export default function Page() {
  const { token } = theme.useToken();
  const {
    modal,
    setModal,
    projectStatuses,
    fetchTimelineData,
    fetchProjectStatusList,
    submitSubProject,
    isSubmitting,
  } = useTimelineStore();

  // ดึงข้อมูล Admin ID จาก Store กลาง
  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id || 1;

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    fetchTimelineData();
    fetchProjectStatusList();
  }, [fetchTimelineData, fetchProjectStatusList]);

  /**
   * ✨ จัดการการบันทึกข้อมูลจาก Modal
   */
  const handleFormSubmit = async (values: any) => {
    const success = await submitSubProject(values, adminId);
    if (success) {
      toast.success(values.id ? "อัปเดตโครงการย่อยสำเร็จ" : "สร้างใหม่สำเร็จ");
      return true;
    } else {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      return false;
    }
  };

  return (
    <DashboardLayout>
      <PermissionLayout permission={["ADMIN_TIMESHEET_VIEW"]}>
        <HeaderBar
          title="รายงานภาพรวมโครงการ (Project Timeline)"
          subTitle="แสดงรายละเอียดความคืบหน้าโครงการและโครงการย่อยในรูปแบบ Gantt Chart"
          icon={<AreaChartOutlined />}
        />

        <div style={{ padding: 16 }}>
          <Card
            styles={{ body: { padding: 16 } }}
            style={{
              marginBottom: 24,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <FilterSection />
          </Card>

          <SummarySection />

          <TimelineChart />

          <WorkloadTimeSeries />
        </div>

        {/* Modal สำหรับแก้ไขโครงการย่อย */}
        <SubProjectFormModal
          open={modal.open}
          mode={modal.mode}
          data={modal.data}
          loading={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={() => setModal({ open: false, data: null })}
          statuses={projectStatuses}
        />
      </PermissionLayout>
    </DashboardLayout>
  );
}
