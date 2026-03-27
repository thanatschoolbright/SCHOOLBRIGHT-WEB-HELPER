"use client";

import { ExclamationCircleOutlined, ProjectOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { Card, Col, Flex, Row, Space, Typography } from "antd";
import { useEffect } from "react";

// --- Sub Components ---
import FilterSection from "./_components/filter-section";
import ProjectHealthTable from "./_components/project-health-table";
import SummarySection from "./_components/summary-section";
import WorkloadAnalysis from "./_components/workload-analysis";

// --- State Management ---
import { usePMDashboardStore } from "./_state/use-pm-dashboard-store";

const { Text } = Typography;

/**
 * ✨ Project Manager Dashboard (Modular Version)
 * @description หน้าแดชบอร์ดสำหรับ PM ดูภาพรวมสุขภาพโครงการและภาระงาน
 */
const ProjectManagerDashboardPage = () => {
  const { fetchDashboardData } = usePMDashboardStore();

  // ดึงข้อมูลครั้งแรกเมื่อโหลดหน้า
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <DashboardLayout>
      <HeaderBar
        icon={<ProjectOutlined />}
        title="แดชบอร์ดผู้จัดการโครงการ"
        subTitle="รายงานสรุปสุขภาพโครงการและภาระงานจริงรายบุคคล"
      />

      <Flex vertical gap={24} style={{ padding: "0 24px 24px" }}>
        {/* ส่วนตัวกรอง */}
        <FilterSection />

        {/* ส่วนบัตรสรุปข้อมูล */}
        <SummarySection />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* ส่วนตารางสุขภาพโครงการ */}
            <ProjectHealthTable />
          </Col>
          <Col xs={24} lg={8}>
            {/* ส่วนวิเคราะห์ภาระงาน */}
            <WorkloadAnalysis />
          </Col>
        </Row>

        {/* ส่วนคำแนะนำ / Alert */}
        <Card
          variant="borderless"
          style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f" }}
        >
          <Space align="start">
            <ExclamationCircleOutlined
              style={{ color: "#faad14", marginTop: 4 }}
            />
            <Flex vertical>
              <Text strong>
                คำแนะนำสำหรับผู้จัดการโครงการ (PM Instructions)
              </Text>
              <Text type="secondary">
                หากพบแถบสีแดงในตารางสุขภาพโครงการ
                หมายถึงโครงการนั้นใช้ชั่วโมงทำงานเกินจากที่ประเมินไว้
                ควรตรวจสอบความถูกต้องของงาน และหากภาระงานทีมงาน (Workload)
                สูงเกิน 90% ควรพิจารณาปรับสมดุลทรัพยากรบุคคล
              </Text>
            </Flex>
          </Space>
        </Card>
      </Flex>
    </DashboardLayout>
  );
};

export default ProjectManagerDashboardPage;
