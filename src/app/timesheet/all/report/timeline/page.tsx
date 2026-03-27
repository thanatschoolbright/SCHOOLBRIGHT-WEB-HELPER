"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { AreaChartOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { Card, theme } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FilterSection from "./_components/filter-section";
import { SubProjectFormModal } from "./_components/sub-project-form-modal";
import SummarySection from "./_components/summary-section";
import TimelineChart from "./_components/timeline-chart";
import { useTimelineStore } from "./_state/timeline-store";

export default function Page() {
  const { token } = theme.useToken();
  const { modal, setModal, fetchTimeline } = useTimelineStore();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ดึงข้อมูล Admin ID จาก Store กลาง
  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id;

  // โหลดสถานะโครงการสำหรับ Modal
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const res = await axios.post("/api/v1/timesheet/project/status/read/");
        if (res.data?.status === 200) {
          setStatuses(res.data.data);
        }
      } catch (error) {
        console.error("Load status error:", error);
      }
    };
    loadStatuses();
  }, []);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        project_id: values.project_id || modal.data?.project_id,
        by: adminId || 1, // ใช้ adminId จริงจาก Backend
      };

      const res = await axios.post(
        "/api/v1/timesheet/project/sub-project/insert",
        payload,
      );

      if (res.data?.status === 200) {
        toast.success(
          values.id ? "อัปเดตโครงการย่อยสำเร็จ" : "สร้างใหม่สำเร็จ",
        );
        await fetchTimeline();
        return true;
      } else {
        throw new Error(res.data?.message_th || "Operation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      return false;
    } finally {
      setIsSubmitting(false);
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
        </div>

        {/* Modal สำหรับแก้ไขโครงการย่อย */}
        <SubProjectFormModal
          open={modal.open}
          mode={modal.mode}
          data={modal.data}
          loading={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setModal({ open: false, data: null })}
          statuses={statuses}
        />
      </PermissionLayout>
    </DashboardLayout>
  );
}
