"use client";

import { HeaderBar as HeaderBarComponent } from "@/components/typhography/header-bar-component";
import { ScanOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Col, Flex, Row } from "antd";
import { FaceScanSection } from "./_components/face-scan-section";

/**
 * หน้าหลักสำหรับแสกนใบหน้า (Simulation Mode)
 */
export default function FaceScanningPage() {
  return (
    <DashboardLayout>
      <Flex vertical gap={16} style={{ padding: 16 }}>
        {/* ส่วนหัวแสดงชื่อหน้าจอ ต้องเป็นภาษาไทย 100% */}
        <HeaderBarComponent
          title="แสกนใบหน้าเพื่อความสะดวก"
          subTitle="ระบบจำลองการบันทึกเวลาด้วยการแสกนใบหน้า"
          icon={<ScanOutlined />}
        />

        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            {/* ส่วนการแสกนใบหน้า (Simulation Component) */}
            <FaceScanSection />
          </Col>
        </Row>
      </Flex>
    </DashboardLayout>
  );
}
