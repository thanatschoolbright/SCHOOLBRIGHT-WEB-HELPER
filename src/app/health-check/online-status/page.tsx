// src/app/health-check/online-status/page.tsx

"use client";

import SummaryCard from "@/components/card/summary-card";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  AlertOutlined,
  DesktopOutlined,
  FilterFilled,
  GlobalOutlined,
  NotificationOutlined,
  SyncOutlined,
  ThunderboltFilled,
  WifiOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { CallAPI as fetchSchoolList } from "@stores/actions/support/call-get-school-list-detail";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Button,
  Col,
  Collapse,
  Flex,
  Row,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import DeviceTable from "./_components/device-table";
import FilterSection from "./_components/filter-section";
import { useOnlineStatusStore } from "./_state/online-status-store";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text: AntText } = Typography;

// ไอคอน Discord (SVG) สำหรับใช้ในปุ่ม
const DiscordIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ marginBottom: -2 }}
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

/**
 * หน้าตรวจสอบสถานะอุปกรณ์แบบเรียลไทม์ (Online Status Dashboard)
 */
export default function OnlineDeviceDashboard() {
  const { token } = theme.useToken();
  const { isFetching, deviceList, pagination, fetchData } =
    useOnlineStatusStore();
  const dispatch = useDispatch<AppDispatch>();
  const schoolListState = useAppSelector(
    (state) => state.callGetSchoolListDetail,
  );

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
  }>({ open: false, type: "success", title: "", message: "" });

  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    fetchData(1, 20);

    // โหลดรายชื่อโรงเรียนเข้า Redux เพื่อให้ FilterSection ใช้งาน Dropdown ได้
    const hasSchoolData =
      Array.isArray(schoolListState.response?.data?.data) &&
      schoolListState.response.data.data.length > 0;
    if (!hasSchoolData && !schoolListState.loading) {
      void dispatch(fetchSchoolList());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // สรุปสถิติจากข้อมูลที่ดึงมา
  const summaryStatistics = useMemo(
    () => ({
      totalDevices: pagination.total,
      onlineCount: deviceList.filter((d) => d.Online).length,
      offlineCount: deviceList.filter((d) => !d.Online).length,
      loginCount: deviceList.filter((d) => d.Login).length,
    }),
    [deviceList, pagination.total],
  );

  // สร้าง school_map จาก Redux สำหรับส่งไปพร้อม Discord payload
  const schoolMap = useMemo(() => {
    const raw = schoolListState.response?.data?.data ?? [];
    return Array.isArray(raw)
      ? raw.map((s: any) => ({
          SchoolID: Number(s.school_id ?? s.SchoolID ?? 0),
          SchoolName: String(s.company_name ?? s.SchoolName ?? ""),
        }))
      : [];
  }, [schoolListState.response?.data?.data]);

  // ดึงข้อมูลอุปกรณ์ทั้งหมดจาก DB (ไม่ใช้ pagination) แล้วส่งรายงานไปยัง Discord webhook
  const handleNotifyDiscord = async () => {
    try {
      setIsNotifying(true);

      // ดึงข้อมูลทุกเครื่องจาก DB โดยไม่จำกัด pagination
      // ใช้ limit สูงเพื่อให้ได้ครบทุกเครื่อง — API รองรับ
      const fetchAllResponse = await callApiService.post(
        "/api/v2/hardware/check-device-status",
        { page: 1, limit: 9999 },
      );

      const fetchRes = fetchAllResponse?.data;
      if (
        !fetchRes ||
        (fetchRes.status_code !== 200 && fetchRes.status !== 200)
      ) {
        throw new Error(fetchRes?.message_th ?? "ดึงข้อมูลอุปกรณ์ไม่สำเร็จ");
      }

      const allDevices: any[] = Array.isArray(fetchRes.data)
        ? fetchRes.data
        : [];
      const totalAll = fetchRes.pagination?.total ?? allDevices.length;

      if (allDevices.length === 0) {
        setStatusModal({
          open: true,
          type: "error",
          title: "ไม่มีข้อมูลอุปกรณ์",
          message: "ไม่พบข้อมูลเครื่องใน Database กรุณาตรวจสอบการเชื่อมต่อ",
        });
        return;
      }

      // ส่งข้อมูลทั้งหมดไปยัง Discord
      const response = await callApiService.post(
        "/api/v1/hardware/machine-monitoring",
        {
          devices: allDevices,
          school_map: schoolMap,
          total_in_db: totalAll,
        },
      );

      const res = response?.data;
      if (res?.status_code === 200 || res?.status === 200) {
        const d = res.data;
        const emailNote = d?.email_sent
          ? ` · ส่งอีเมลแจ้งเตือน narin@schoolbright.co แล้ว`
          : d?.email_error
          ? ` · ส่งอีเมลไม่สำเร็จ: ${d.email_error}`
          : "";
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งแจ้งเตือน Discord สำเร็จ",
          message: `รายงานสถานะ ${
            d?.total ?? allDevices.length
          } เครื่อง · ออนไลน์ ${d?.online} · ออฟไลน์ ${
            d?.offline
          } เครื่อง ส่งไปยัง Discord เรียบร้อยแล้ว${emailNote}`,
        });
      } else {
        throw new Error(res?.message_th ?? "ส่งไม่สำเร็จ");
      }
    } catch (err: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งแจ้งเตือนไม่สำเร็จ",
        message:
          err?.response?.data?.message_th ??
          err?.message ??
          "ไม่สามารถส่งรายงานไปยัง Discord ได้ในขณะนี้",
      });
    } finally {
      setIsNotifying(false);
    }
  };

  const collapseItems = [
    {
      key: "1",
      label: (
        <Flex align="center" gap={8}>
          <FilterFilled style={{ color: token.colorPrimary }} />
          <AntText strong style={{ fontSize: 14 }}>
            ตัวกรองข้อมูลขั้นสูง
          </AntText>
        </Flex>
      ),
      children: <FilterSection deviceList={deviceList} />,
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 32 }}>
        <HeaderBar
          icon={<GlobalOutlined />}
          title="ตรวจสอบสถานะอุปกรณ์"
          subTitle="ติดตามสถานะการเชื่อมต่อและการใช้งานของเครื่อง POS แบบเรียลไทม์"
          extra={
            <Space size={12} wrap>
              {/* ปุ่มแจ้งเตือน Discord แบบตกแต่งพิเศษ */}
              <Button
                icon={<DiscordIcon />}
                onClick={handleNotifyDiscord}
                loading={isNotifying}
                className="flex items-center gap-2"
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 14,
                  backgroundColor: isNotifying
                    ? token.colorFillTertiary
                    : "#5865F2",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 4px 14px 0 rgba(88, 101, 242, 0.39)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isNotifying) {
                    e.currentTarget.style.backgroundColor = "#4752C4";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(88, 101, 242, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNotifying) {
                    e.currentTarget.style.backgroundColor = "#5865F2";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px 0 rgba(88, 101, 242, 0.39)";
                  }
                }}
              >
                <span>ส่งรายงานไปยัง Discord</span>
                {summaryStatistics.offlineCount > 0 && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      marginLeft: 4,
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <NotificationOutlined
                      style={{ marginRight: 4, fontSize: 10 }}
                    />
                    {summaryStatistics.offlineCount} ออฟไลน์
                  </div>
                )}
              </Button>

              {/* สถานะการอัปเดต */}
              <Space direction="vertical" align="end" size={0}>
                <Tag
                  icon={<SyncOutlined spin={isFetching} />}
                  color={isFetching ? "processing" : "default"}
                >
                  {isFetching ? "กำลังอัปเดตข้อมูล..." : "ข้อมูลล่าสุด"}
                </Tag>
                <AntText type="secondary" style={{ fontSize: 11 }}>
                  อัปเดตเมื่อ: {dayjs().format("HH:mm:ss")}
                </AntText>
              </Space>
            </Space>
          }
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24, marginTop: 24 }}>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="อุปกรณ์ทั้งหมด"
              value={summaryStatistics.totalDevices}
              unit="เครื่อง"
              icon={<DesktopOutlined />}
              isLoading={isFetching}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="ออนไลน์พร้อมใช้งาน"
              value={summaryStatistics.onlineCount}
              unit="เครื่อง"
              icon={<WifiOutlined />}
              color={token.colorSuccess}
              isLoading={isFetching}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="ออฟไลน์"
              value={summaryStatistics.offlineCount}
              unit="เครื่อง"
              icon={<AlertOutlined />}
              color={
                summaryStatistics.offlineCount >= 5
                  ? token.colorError
                  : summaryStatistics.offlineCount > 0
                  ? token.colorWarning
                  : token.colorSuccess
              }
              isLoading={isFetching}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="กำลังใช้งาน"
              value={summaryStatistics.loginCount}
              unit="เครื่อง"
              icon={<ThunderboltFilled />}
              color={token.colorPrimary}
              isLoading={isFetching}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 24 }}>
          <Collapse
            defaultActiveKey={["1"]}
            ghost
            expandIconPosition="end"
            items={collapseItems}
            destroyOnHidden={false}
            style={{
              background: token.colorBgContainer,
              borderRadius: 16,
              border: "none",
            }}
          />
        </div>

        <DeviceTable />
      </div>

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
      />
    </DashboardLayout>
  );
}
