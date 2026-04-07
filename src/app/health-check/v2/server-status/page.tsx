"use client";

import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  CloudServerOutlined,
  DiscordOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Flex, Space } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { useEffect } from "react";
import { DetailModal } from "./_components/detail-modal";
import { ExportModal } from "./_components/export-modal";
import FilterSection from "./_components/filter-section";
import ServerStatusTable from "./_components/server-status-table";
import SummarySection from "./_components/summary-section";
import { useServerStatusStore } from "./_state/server-status-store";

dayjs.extend(buddhistEra);
dayjs.locale("th");

export default function ServerStatusPage() {
  const {
    lastFetchTimestamp,
    isFetchingStatus,
    isSendingDiscord,
    fetchServerStatus,
  } = useServerStatusStore();

  useEffect(() => {
    fetchServerStatus("normal");
  }, [fetchServerStatus]);

  return (
    <DashboardLayout>
      <Flex vertical gap={24} style={{ padding: 24 }}>
        {/* ส่วนที่ 1: หัวข้อหน้า */}
        <HeaderBar
          icon={<CloudServerOutlined />}
          title="แดชบอร์ดสถานะเซิร์ฟเวอร์"
          subTitle={`อัปเดตล่าสุด: ${
            lastFetchTimestamp
              ? dayjs(lastFetchTimestamp).format("HH:mm:ss")
              : "รอกดปุ่มอัปเดต"
          }`}
          showBackButton
          extra={
            <Space>
              <Button
                type="primary"
                style={{
                  backgroundColor: "#5865F2",
                  borderColor: "#5865F2",
                  boxShadow: "none",
                }}
                icon={<DiscordOutlined />}
                onClick={() => void fetchServerStatus("discord")}
                loading={isSendingDiscord}
              >
                แจ้งเตือน Discord
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => fetchServerStatus("normal")}
                loading={isFetchingStatus}
                style={{ fontWeight: 600 }}
              >
                อัปเดตสถานะ
              </Button>
            </Space>
          }
        />

        {/* ส่วนที่ 2: Summary Cards */}
        <SummarySection />

        {/* ส่วนที่ 3: ตัวกรอง */}
        <FilterSection />

        {/* ส่วนที่ 4: ตารางข้อมูล */}
        <ServerStatusTable />

        {/* Modals */}
        <DetailModal />
        <ExportModal />
      </Flex>
    </DashboardLayout>
  );
}
