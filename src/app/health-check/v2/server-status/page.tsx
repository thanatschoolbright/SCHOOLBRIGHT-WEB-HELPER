"use client";

import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  CloudServerOutlined,
  DiscordOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Flex, Progress, Space, Typography, theme } from "antd";
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

// ✨ ขั้นตอนที่แสดงระหว่างโหลด — ใช้ match กับ progress %
const FETCH_STEPS = [
  { label: "เชื่อมต่อ API...", at: 0 },
  { label: "ตรวจสอบสถานะ Server...", at: 20 },
  { label: "รวบรวมข้อมูล Endpoint ทั้งหมด...", at: 40 },
  { label: "ประมวลผลผลลัพธ์...", at: 65 },
  { label: "กำลังแสดงข้อมูล...", at: 85 },
];

export default function ServerStatusPage() {
  const { token } = theme.useToken();
  const {
    lastFetchTimestamp,
    isFetchingStatus,
    isSendingDiscord,
    fetchProgress,
    fetchServerStatus,
  } = useServerStatusStore();

  useEffect(() => {
    fetchServerStatus("normal");
  }, [fetchServerStatus]);

  const stepLabel =
    [...FETCH_STEPS].reverse().find((s) => fetchProgress >= s.at)?.label ??
    "เชื่อมต่อ API...";

  return (
    <DashboardLayout>
      {/* Loading Overlay */}
      {isFetchingStatus && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: token.colorBgMask,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Flex
            vertical
            align="center"
            gap={20}
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 16,
              padding: "36px 48px",
              width: 360,
              boxShadow: token.boxShadowSecondary,
            }}
          >
            <CloudServerOutlined
              style={{ fontSize: 36, color: token.colorPrimary }}
            />
            <Flex vertical align="center" gap={6} style={{ width: "100%" }}>
              <Typography.Text strong style={{ fontSize: 15 }}>
                กำลังตรวจสอบสถานะระบบ
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, minHeight: 18 }}
              >
                {stepLabel}
              </Typography.Text>
            </Flex>
            <Flex vertical gap={6} style={{ width: "100%" }}>
              <Progress
                percent={Math.round(fetchProgress)}
                showInfo={false}
                strokeColor={{
                  "0%": token.colorPrimary,
                  "100%": token.colorSuccess,
                }}
                trailColor={token.colorFillSecondary}
                strokeLinecap="round"
                size={["100%", 6]}
              />
              <Flex justify="flex-end">
                <Typography.Text
                  strong
                  style={{ fontSize: 12, color: token.colorPrimary }}
                >
                  {Math.round(fetchProgress)}%
                </Typography.Text>
              </Flex>
            </Flex>
          </Flex>
        </div>
      )}

      <Flex vertical gap={24} style={{ padding: 24 }}>
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

        <SummarySection />
        <FilterSection />
        <ServerStatusTable />

        <DetailModal />
        <ExportModal />
      </Flex>
    </DashboardLayout>
  );
}
