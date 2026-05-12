"use client";

import { TeamOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { Flex } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { FilterSection } from "./_components/filter-section";
import { LinePreviewModal } from "./_components/line-preview-modal";
import { SchoolLineGroupModal } from "./_components/school-line-group-modal";
import { SchoolLineGroupTable } from "./_components/school-line-group-table";
import { SummarySection } from "./_components/summary-section";
import { useSchoolLineGroupStore } from "./_state/use-school-line-group-store";

dayjs.locale("th");

/**
 * หน้ารายการ LINE Group ตามโรงเรียน
 * ปรับปรุง Layout ให้มีความโปร่ง (Spacious) และมีระเบียบมากขึ้น
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full pb-16 pt-2"
      >
        <HeaderBar
          icon={<TeamOutlined />}
          title="รายชื่อกลุ่ม LINE ตามโรงเรียน"
          subTitle="จัดการและทดสอบการส่งรายงานสถานะฮาร์ดแวร์ไปยังกลุ่ม LINE ของแต่ละโรงเรียน"
        />

        <Flex vertical gap={32} style={{ marginTop: 32 }}>
          {/* ส่วนสรุปข้อมูล */}
          <SummarySection />

          {/* ส่วนตัวกรองและตารางข้อมูล */}
          <Flex vertical gap={32}>
            <FilterSection />
            <SchoolLineGroupTable />
          </Flex>
        </Flex>

        {/* Modal สำหรับ Create/Update */}
        <SchoolLineGroupModal />

        {/* Modal สำหรับ Preview LINE */}
        <LinePreviewModal />

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
      </motion.div>
    </DashboardLayout>
  );
}
