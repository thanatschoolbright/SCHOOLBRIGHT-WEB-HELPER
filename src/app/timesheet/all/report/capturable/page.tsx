"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Col, Row, theme } from "antd";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

import { CapturableTable } from "./_components/capturable-table";
import { DetailModal } from "./_components/detail-modal";
import { ExportModal } from "./_components/export-modal";
import { FilterSection } from "./_components/filter-section";
import { useCapturableStore } from "./_state/use-capturable-store";

/**
 * * CapturableReportPage — หน้ารายงานวิเคราะห์ทรัพย์สิน (Capitalization Report)
 */
export default function CapturableReportPage() {
  const { token } = theme.useToken();
  const { summaryData } = useCapturableStore();

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Row gutter={[0, 32]}>
          {/* ส่วนที่ 1: หัวข้อหน้าเว็ป */}
          <Col span={24}>
            <HeaderBar
              icon={<ProjectOutlined />}
              title="รายงานวิเคราะห์ทรัพย์สิน (Capitalization Report)"
              subTitle="เครื่องมือวิเคราะห์สัดส่วนงานรายโครงการเพื่อแยกประเภทสินทรัพย์และค่าใช้จ่าย"
              showBackButton={true}
            />
          </Col>

          {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) */}
          <Col span={24}>
            <Row gutter={[20, 20]}>
              <Col xs={24} sm={12} lg={6}>
                <SummaryCard
                  title="โครงการทั้งหมด"
                  value={summaryData.totalProjects}
                  subtitle="จำนวนโครงการที่วิเคราะห์"
                  icon={<ProjectOutlined />}
                  color={token.colorPrimary}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <SummaryCard
                  title="ชั่วโมงรวม"
                  value={summaryData.totalHours.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  subtitle="บันทึกในช่วงเวลานี้"
                  icon={<ClockCircleOutlined />}
                  color={token.colorInfo}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <SummaryCard
                  title="เฉลี่ยงานสร้างใหม่"
                  value={`${summaryData.avgCapturable.toFixed(1)}%`}
                  subtitle="สัดส่วน Capitalization ทรัพย์สิน"
                  icon={<CheckCircleOutlined />}
                  color={token.colorSuccess}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <SummaryCard
                  title="เฉลี่ยงานดูแล"
                  value={`${summaryData.avgUncapturable.toFixed(1)}%`}
                  subtitle="สัดส่วน Expense รายจ่าย"
                  icon={<CloseCircleOutlined />}
                  color={token.colorError}
                />
              </Col>
            </Row>
          </Col>

          {/* ส่วนที่ 3: ฟิลเตอร์และปุ่มค้นหา */}
          <Col span={24}>
            <FilterSection />
          </Col>

          {/* ส่วนที่ 4: ตารางข้อมูล */}
          <Col span={24}>
            <CapturableTable />
          </Col>
        </Row>

        {/* Modals */}
        <DetailModal />
        <ExportModal />
      </DashboardLayout>
    </PermissionLayout>
  );
}
