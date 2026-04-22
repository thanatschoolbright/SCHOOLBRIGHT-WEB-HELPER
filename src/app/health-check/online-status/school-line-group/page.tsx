"use client";

import { TeamOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { Flex } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useEffect } from "react";
import { FilterSection } from "./_components/filter-section";
import { SchoolLineGroupModal } from "./_components/school-line-group-modal";
import { SchoolLineGroupTable } from "./_components/school-line-group-table";
import { SummarySection } from "./_components/summary-section";
import { useSchoolLineGroupStore } from "./_state/use-school-line-group-store";

dayjs.locale("th");

/**
 * หน้ารายการ LINE Group ตามโรงเรียน
 * ทำหน้าที่เป็น Orchestrator สำหรับประกอบ Component และจัด Layout
 */
export default function SchoolLineGroupPage() {
  const { fetchData, statusModal, deleteId, loading, closeModal, removeItem } =
    useSchoolLineGroupStore();

  useEffect(() => {
    void fetchData(1);
  }, [fetchData]);

  /**
   * จัดการการยืนยันใน StatusModal
   */
  const handleConfirm = async () => {
    if (statusModal.type === "delete" && deleteId) {
      await removeItem(deleteId);
      closeModal();
    } else {
      closeModal();
    }
  };

  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 48 }}>
        <HeaderBar
          icon={<TeamOutlined />}
          title="รายชื่อกลุ่ม LINE ตามโรงเรียน"
          subTitle="จัดการและทดสอบการส่งรายงานสถานะฮาร์ดแวร์ไปยังกลุ่ม LINE ของแต่ละโรงเรียน"
        />

        <Flex vertical gap={24} style={{ marginTop: 24 }}>
          <SummarySection />
          <FilterSection />
          <SchoolLineGroupTable />
        </Flex>

        {/* Modal สำหรับ Create/Update */}
        <SchoolLineGroupModal />

        {/* Modal สำหรับแสดงสถานะและยืนยันการลบ */}
        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          errorDetails={statusModal.errorDetails}
          loading={loading}
          onClose={closeModal}
          onConfirm={handleConfirm}
        />
      </div>
    </DashboardLayout>
  );
}
