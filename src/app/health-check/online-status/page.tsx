// src/app/health-check/online-status/page.tsx

"use client";

import SummaryCard from "@/components/card/summary-card";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  AlertOutlined,
  CheckOutlined,
  DesktopOutlined,
  FileExcelOutlined,
  FilterFilled,
  GlobalOutlined,
  MailOutlined,
  NotificationOutlined,
  SettingOutlined,
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
  Dropdown,
  Flex,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import DeviceTable from "./_components/device-table";
import FilterSection from "./_components/filter-section";
import {
  DashboardSummary,
  LineGroup,
  onlineStatusService,
} from "./_services/online-status-service";
import { useOnlineStatusStore } from "./_state/online-status-store";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text: AntText } = Typography;

// ไอคอน LINE (SVG) สำหรับใช้ในปุ่ม
const LineIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ marginBottom: -2 }}
  >
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

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
  const { isFetching, deviceList, fetchData } = useOnlineStatusStore();
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
  const [isNotifyingLine, setIsNotifyingLine] = useState(false);
  const [isNotifyingEmail, setIsNotifyingEmail] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const loadDashboard = async () => {
    setIsDashboardLoading(true);
    try {
      const data = await onlineStatusService.fetchDashboardSummary();
      setDashboard(data);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const loadLineGroups = async () => {
    try {
      const result = await onlineStatusService.fetchLineGroups();
      setLineGroups(result.groups);
      setActiveGroupId(result.active_group_id);
    } catch {
      // ไม่แสดง error ถ้า LINE ยังไม่ได้ตั้งค่า
    }
  };

  const handleSelectLineGroup = async (groupId: string) => {
    try {
      await onlineStatusService.setActiveLineGroup(groupId);
      setActiveGroupId(groupId);
      const found = lineGroups.find((g) => g.group_id === groupId);
      setStatusModal({
        open: true,
        type: "success",
        title: "เลือกกลุ่ม LINE สำเร็จ",
        message: `ตั้งค่าส่งรายงานไปยัง "${found?.group_name ?? groupId}" แล้ว`,
      });
    } catch {
      setStatusModal({
        open: true,
        type: "error",
        title: "เลือกกลุ่ม LINE ไม่สำเร็จ",
        message: "ไม่สามารถตั้งค่ากลุ่มได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  useEffect(() => {
    fetchData(1, 20);
    void loadDashboard();
    void loadLineGroups();

    // โหลดรายชื่อโรงเรียนเข้า Redux เพื่อให้ FilterSection ใช้งาน Dropdown ได้
    const hasSchoolData =
      Array.isArray(schoolListState.response?.data?.data) &&
      schoolListState.response.data.data.length > 0;
    if (!hasSchoolData && !schoolListState.loading) {
      void dispatch(fetchSchoolList());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // สถิติ Dashboard มาจาก API แยก ไม่ขึ้นกับ filter ปัจจุบัน
  const offlineCount = dashboard?.offline ?? 0;

  // ส่งรายงานสถานะอุปกรณ์ไปยัง LINE Group ทันที
  const handleNotifyLine = async () => {
    try {
      setIsNotifyingLine(true);
      const res = await callApiService.get(
        "/api/v1/hardware/machine-monitoring/channel/line",
      );
      const data = res?.data;
      if (data?.status_code === 200 || data?.status === 200) {
        const d = data.data;
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งแจ้งเตือน LINE สำเร็จ",
          message: `รายงานสถานะเครื่อง ส่งไปยัง LINE แล้ว`,
        });
      } else {
        throw new Error(data?.message_th ?? "ส่งไม่สำเร็จ");
      }
    } catch (err: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งแจ้งเตือน LINE ไม่สำเร็จ",
        message:
          err?.response?.data?.message_th ??
          err?.message ??
          "ไม่สามารถส่งรายงานไปยัง LINE ได้ในขณะนี้",
      });
    } finally {
      setIsNotifyingLine(false);
    }
  };

  // ดึงข้อมูลจาก DB แล้วส่งรายงานสถานะเครื่อง POS ทางอีเมล
  const handleNotifyEmail = async () => {
    try {
      setIsNotifyingEmail(true);
      const res = await callApiService.get(
        "/api/v1/hardware/machine-monitoring/channel/email",
      );
      const data = res?.data;
      if (data?.status_code === 200 || data?.status === 200) {
        const d = data.data;
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งรายงานอีเมลสำเร็จ",
          message: `รายงานสถานะ ${d?.total} เครื่อง · ออนไลน์ ${d?.online} · ออฟไลน์ ${d?.offline} เครื่อง ส่งทางอีเมลเรียบร้อยแล้ว`,
        });
      } else {
        throw new Error(data?.message_th ?? "ส่งไม่สำเร็จ");
      }
    } catch (err: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งรายงานอีเมลไม่สำเร็จ",
        message:
          err?.response?.data?.message_th ??
          err?.message ??
          "ไม่สามารถส่งรายงานทางอีเมลได้ในขณะนี้",
      });
    } finally {
      setIsNotifyingEmail(false);
    }
  };

  // ดึงข้อมูลจาก DB แล้วส่งรายงานไปยัง Discord webhook แบบกระชับ
  const handleNotifyDiscord = async () => {
    try {
      setIsNotifying(true);
      const res = await callApiService.get(
        "/api/v1/hardware/machine-monitoring/channel/discord",
      );
      const data = res?.data;
      if (data?.status_code === 200 || data?.status === 200) {
        const d = data.data;
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งแจ้งเตือน Discord สำเร็จ",
          message: `รายงานสถานะ ${d?.total} เครื่อง · ออนไลน์ ${d?.online} · ออฟไลน์ ${d?.offline} เครื่อง ส่งไปยัง Discord เรียบร้อยแล้ว`,
        });
      } else {
        throw new Error(data?.message_th ?? "ส่งไม่สำเร็จ");
      }
    } catch (err: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งแจ้งเตือน Discord ไม่สำเร็จ",
        message:
          err?.response?.data?.message_th ??
          err?.message ??
          "ไม่สามารถส่งรายงานไปยัง Discord ได้ในขณะนี้",
      });
    } finally {
      setIsNotifying(false);
    }
  };

  /**
   * ส่งออกข้อมูลสถานะอุปกรณ์เป็นไฟล์ Excel
   */
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await onlineStatusService.exportDeviceStatusExcel();
      setStatusModal({
        open: true,
        type: "success",
        title: "ส่งออก Excel สำเร็จ",
        message: "ระบบได้สร้างไฟล์รายงานสถานะอุปกรณ์เรียบร้อยแล้ว",
      });
    } catch (err: any) {
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งออก Excel ไม่สำเร็จ",
        message:
          err?.response?.data?.message_th ??
          err?.message ??
          "ไม่สามารถสร้างไฟล์ Excel ได้ในขณะนี้",
      });
    } finally {
      setIsExportingExcel(false);
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
              {/* ปุ่มส่งรายงาน LINE + Dropdown เลือกกลุ่มจาก DB */}
              <Flex style={{ height: 44 }}>
                <Tooltip
                  title={
                    activeGroupId
                      ? `ส่งไปยัง: ${
                          lineGroups.find((g) => g.group_id === activeGroupId)
                            ?.group_name ?? activeGroupId
                        }`
                      : "กรุณาเลือกกลุ่ม LINE ก่อนส่ง"
                  }
                >
                  <Button
                    icon={<LineIcon />}
                    onClick={handleNotifyLine}
                    loading={isNotifyingLine}
                    disabled={!activeGroupId}
                    style={{
                      height: 44,
                      padding: "0 16px",
                      borderRadius: "12px 0 0 12px",
                      fontWeight: 600,
                      fontSize: 14,
                      backgroundColor: !activeGroupId
                        ? token.colorFillTertiary
                        : isNotifyingLine
                        ? token.colorFillTertiary
                        : "#06C755",
                      color: !activeGroupId
                        ? token.colorTextDisabled
                        : "#FFFFFF",
                      border: "none",
                      borderRight: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: activeGroupId
                        ? "0 4px 14px 0 rgba(6, 199, 85, 0.35)"
                        : "none",
                    }}
                  >
                    <span>ส่งรายงานไปยัง LINE</span>
                    {offlineCount > 0 && activeGroupId && (
                      <span
                        style={{
                          background: "rgba(255,255,255,0.25)",
                          padding: "1px 7px",
                          borderRadius: 6,
                          fontSize: 11,
                          marginLeft: 4,
                          border: "1px solid rgba(255,255,255,0.4)",
                        }}
                      >
                        <NotificationOutlined
                          style={{ fontSize: 10, marginRight: 4 }}
                        />
                        {offlineCount} ออฟไลน์
                      </span>
                    )}
                  </Button>
                </Tooltip>
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "group-header",
                        type: "group",
                        label: (
                          <Flex align="center" gap={6}>
                            <SettingOutlined style={{ fontSize: 11 }} />
                            <span style={{ fontSize: 11 }}>
                              เลือกกลุ่ม LINE สำหรับส่งรายงาน
                            </span>
                          </Flex>
                        ),
                      },
                      ...(lineGroups.length === 0
                        ? [
                            {
                              key: "empty",
                              disabled: true,
                              label: (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                  }}
                                >
                                  ยังไม่มีกลุ่มในระบบ — เพิ่ม Bot เข้ากลุ่มก่อน
                                </span>
                              ),
                            },
                          ]
                        : lineGroups.map((g) => ({
                            key: g.group_id,
                            label: (
                              <Flex align="center" gap={8}>
                                {g.group_id === activeGroupId ? (
                                  <CheckOutlined
                                    style={{ color: "#06C755", fontSize: 12 }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      width: 12,
                                      display: "inline-block",
                                    }}
                                  />
                                )}
                                <Flex vertical gap={1} flex={1}>
                                  <span
                                    style={{ fontSize: 13, fontWeight: 500 }}
                                  >
                                    {g.group_name ?? "ไม่ระบุชื่อกลุ่ม"}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: token.colorTextTertiary,
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {g.group_id}
                                  </span>
                                </Flex>
                                {g.group_id === activeGroupId && (
                                  <Tag
                                    color="green"
                                    style={{ fontSize: 10, margin: 0 }}
                                  >
                                    ใช้งานอยู่
                                  </Tag>
                                )}
                              </Flex>
                            ),
                            onClick: () => handleSelectLineGroup(g.group_id),
                          }))),
                    ],
                  }}
                >
                  <Button
                    style={{
                      height: 44,
                      width: 36,
                      padding: 0,
                      borderRadius: "0 12px 12px 0",
                      backgroundColor: activeGroupId
                        ? "#05b84a"
                        : token.colorFillTertiary,
                      color: activeGroupId
                        ? "#FFFFFF"
                        : token.colorTextTertiary,
                      border: "none",
                      boxShadow: activeGroupId
                        ? "0 4px 14px 0 rgba(6, 199, 85, 0.35)"
                        : "none",
                    }}
                    icon={
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="currentColor"
                      >
                        <path d="M5 7L1 3h8z" />
                      </svg>
                    }
                  />
                </Dropdown>
              </Flex>

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
                {offlineCount > 0 && (
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
                    {offlineCount} ออฟไลน์
                  </div>
                )}
              </Button>

              {/* ปุ่มส่งรายงานทางอีเมล */}
              <Button
                icon={<MailOutlined />}
                onClick={handleNotifyEmail}
                loading={isNotifyingEmail}
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 14,
                  backgroundColor: isNotifyingEmail
                    ? token.colorFillTertiary
                    : "#ea580c",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 4px 14px 0 rgba(234, 88, 12, 0.35)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isNotifyingEmail) {
                    e.currentTarget.style.backgroundColor = "#c2410c";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(234, 88, 12, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNotifyingEmail) {
                    e.currentTarget.style.backgroundColor = "#ea580c";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px 0 rgba(234, 88, 12, 0.35)";
                  }
                }}
              >
                <span>ส่งรายงานอีเมล</span>
                {offlineCount > 0 && (
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
                    {offlineCount} ออฟไลน์
                  </div>
                )}
              </Button>

              {/* ปุ่มส่งออก Excel ตกแต่งสวยงาม */}
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                loading={isExportingExcel}
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 14,
                  backgroundColor: isExportingExcel
                    ? token.colorFillTertiary
                    : "#16a34a",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 4px 14px 0 rgba(22, 163, 74, 0.35)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isExportingExcel) {
                    e.currentTarget.style.backgroundColor = "#15803d";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(22, 163, 74, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExportingExcel) {
                    e.currentTarget.style.backgroundColor = "#16a34a";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px 0 rgba(22, 163, 74, 0.35)";
                  }
                }}
              >
                <span>ส่งออก Excel</span>
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

              <Link href="/health-check/online-status/line-channel">
                <Button
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ marginBottom: -2 }}
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                  }
                  style={{
                    height: 44,
                    padding: "0 18px",
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      "linear-gradient(135deg, #06C755 0%, #05a548 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    boxShadow: "0 4px 14px 0 rgba(6, 199, 85, 0.35)",
                    transition: "all 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #05b84a 0%, #048c3e 100%)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(6, 199, 85, 0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #06C755 0%, #05a548 100%)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px 0 rgba(6, 199, 85, 0.35)";
                  }}
                >
                  ทดสอบ LINE Webhook
                </Button>
              </Link>
            </Space>
          }
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24, marginTop: 24 }}>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="อุปกรณ์ทั้งหมด"
              value={dashboard?.total ?? 0}
              unit="เครื่อง"
              icon={<DesktopOutlined />}
              color="#6366f1"
              isLoading={isDashboardLoading}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="โรงเรียนที่มีอุปกรณ์"
              value={dashboard?.totalSchools ?? 0}
              unit="แห่ง"
              icon={<GlobalOutlined />}
              color="#0ea5e9"
              subtitle="ครอบคลุมทุกแอปพลิเคชัน"
              isLoading={isDashboardLoading}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="ออนไลน์"
              value={dashboard?.online ?? 0}
              unit="เครื่อง"
              icon={<WifiOutlined />}
              color="#16a34a"
              subtitle={
                dashboard ? `${dashboard.onlineRate}% ของทั้งหมด` : undefined
              }
              isLoading={isDashboardLoading}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="ออฟไลน์"
              value={dashboard?.offline ?? 0}
              unit="เครื่อง"
              icon={<AlertOutlined />}
              color={
                (dashboard?.offline ?? 0) >= 5
                  ? "#dc2626"
                  : (dashboard?.offline ?? 0) > 0
                  ? "#d97706"
                  : "#16a34a"
              }
              subtitle={
                (dashboard?.offline ?? 0) >= 5
                  ? "ระดับวิกฤต"
                  : (dashboard?.offline ?? 0) > 0
                  ? "ต้องระวัง"
                  : "ปกติทุกเครื่อง"
              }
              isLoading={isDashboardLoading}
            />
          </Col>
          <Col xs={24} sm={6}>
            <SummaryCard
              title="กำลังใช้งาน"
              value={dashboard?.login ?? 0}
              unit="เครื่อง"
              icon={<ThunderboltFilled />}
              color="#2563eb"
              subtitle={
                dashboard
                  ? `${Math.round(
                      (dashboard.login / (dashboard.total || 1)) * 100,
                    )}% ของออนไลน์`
                  : undefined
              }
              isLoading={isDashboardLoading}
            />
          </Col>
        </Row>

        {/* สถิติแยกตามประเภทอุปกรณ์ (SB Canteen, etc.) */}
        {dashboard?.app_stats && dashboard.app_stats.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {dashboard.app_stats.map((app) => (
              <Col key={app.name} xs={24} sm={12} md={6}>
                <SummaryCard
                  title={app.name}
                  value={app.total}
                  unit="เครื่อง"
                  icon={
                    app.name.toLowerCase().includes("facial") ? (
                      <CheckOutlined />
                    ) : (
                      <DesktopOutlined />
                    )
                  }
                  color={token.colorPrimary}
                  subtitle={`ออนไลน์ ${app.online} เครื่อง`}
                  isLoading={isDashboardLoading}
                />
              </Col>
            ))}
          </Row>
        )}

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
