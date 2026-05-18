"use client";

import { RobotOutlined } from "@ant-design/icons";
import { Col, Row, Skeleton, Typography } from "antd";
import { useEffect } from "react";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import { useAppSelector } from "@stores/store";
import { BotCard } from "./_components/bot-card";
import { useBotManagementStore } from "./_state/use-bot-management-store";

// หน้าจัดการ Bot ทั้งหมดในระบบ — ดูสถานะและเปิด/ปิด Bot ได้
export default function BotManagementPage() {
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;
  const isAdmin = adminId === 117;

  const { bots, isLoading, togglingKey, statusModal, loadBots, handleToggle, closeStatusModal } =
    useBotManagementStore();

  useEffect(() => {
    void loadBots();
  }, [loadBots]);

  const activeCount = bots.filter((b) => b.enabled).length;

  return (
    <DashboardLayout>
      <HeaderBar
        title="จัดการ Bot"
        subTitle={`Bot ทั้งหมด ${bots.length} ตัว · กำลังทำงาน ${activeCount} ตัว`}
        icon={<RobotOutlined />}
      />

      {!isAdmin && (
        <Typography.Text type="warning" style={{ display: "block", marginBottom: 16 }}>
          คุณมีสิทธิ์ดูข้อมูลเท่านั้น — การเปิด/ปิด Bot ต้องใช้สิทธิ์ Admin
        </Typography.Text>
      )}

      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((i) => (
            <Col xs={24} sm={24} md={12} lg={8} key={i}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {bots.map((bot) => (
            <Col xs={24} sm={24} md={12} lg={8} key={bot.key}>
              <BotCard
                bot={bot}
                isAdmin={isAdmin}
                isToggling={togglingKey === bot.key}
                onToggle={handleToggle}
              />
            </Col>
          ))}
        </Row>
      )}

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </DashboardLayout>
  );
}
