"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Tooltip,
  Modal,
  Space,
  Tabs,
  Input,
  Descriptions,
  Statistic,
  Progress,
  Segmented,
  Badge,
  Alert,
  Dropdown,
  Skeleton,
  Flex,
  Row,
  Col,
  theme,
  Grid,
  Avatar,
  Empty,
  Spin,
  Divider,
} from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  NotificationOutlined,
  EyeOutlined,
  CopyOutlined,
  ApiOutlined,
  SearchOutlined,
  BugOutlined,
  SafetyCertificateFilled,
  FileExcelOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  DashboardOutlined,
  ThunderboltFilled,
  LoadingOutlined,
  CloudServerOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  CodeOutlined,
  FileTextOutlined,
  LinkOutlined,
  RocketOutlined,
  FieldTimeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  ExportServerStatusService,
  ServerStatusData,
} from "@/services/backend/server-status/export-server-status.report.service";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// --- Interfaces ---
interface ServerStatusApiResponse {
  status: number;
  message_th: string;
  message_en: string;
  data: ServerStatusData[];
}

export default function ServerStatusPage() {
  const router = useRouter();
  const { token } = theme.useToken();
  const screenBreakpoints = useBreakpoint();

  // --- State Management ---
  const [serverHealthData, setServerHealthData] = useState<ServerStatusData[]>(
    []
  );
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<Date | null>(
    null
  );

  const [isFetchingServerStatus, setIsFetchingServerStatus] = useState(false);
  const [isSendingDiscordNotification, setIsSendingDiscordNotification] =
    useState(false);
  const [isGeneratingExcelReport, setIsGeneratingExcelReport] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // Progress state

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedServerStatusItem, setSelectedServerStatusItem] =
    useState<ServerStatusData | null>(null);

  const [searchQueryString, setSearchQueryString] = useState("");
  const [statusFilterType, setStatusFilterType] = useState<
    "ALL" | "ONLINE" | "ERROR"
  >("ALL");

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQueryString, statusFilterType]);

  // --- Simulated Progress Effect ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFetchingServerStatus) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return prev; // Hold at 90% until finished
          return prev + Math.floor(Math.random() * 10) + 1;
        });
      }, 300);
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500); // Clear after finish
    }
    return () => clearInterval(interval);
  }, [isFetchingServerStatus]);

  // --- API Actions ---
  const handleFetchServerStatus = useCallback(
    async (executionMode: "normal" | "discord" = "normal") => {
      const isDiscordMode = executionMode === "discord";

      if (isDiscordMode) {
        setIsSendingDiscordNotification(true);
      } else {
        setIsFetchingServerStatus(true);
      }

      try {
        const apiResponse = await axios.post<ServerStatusApiResponse>(
          "/api/v1/health-check/server/system",
          { mode: executionMode },
          { headers: { "Content-Type": "application/json" } }
        );

        if (apiResponse.data && Array.isArray(apiResponse.data.data)) {
          setServerHealthData(apiResponse.data.data);
          setLastFetchTimestamp(new Date());

          if (isDiscordMode) {
            toast.success("ส่งรายงานเข้า Discord เรียบร้อยแล้ว");
          } else {
            toast.success("อัปเดตสถานะล่าสุดเรียบร้อย");
          }
        }
      } catch (error: any) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาด", {
          description:
            error?.response?.data?.message_th ||
            "ไม่สามารถเชื่อมต่อกับ Server ได้",
        });
      } finally {
        if (isDiscordMode) {
          setIsSendingDiscordNotification(false);
        } else {
          // Delay turning off loading slightly for better UX
          setTimeout(() => setIsFetchingServerStatus(false), 500);
        }
      }
    },
    []
  );

  useEffect(() => {
    handleFetchServerStatus("normal");
  }, [handleFetchServerStatus]);

  const handleGenerateExcelReport = async () => {
    if (serverHealthData.length === 0) {
      toast.warning("ไม่พบข้อมูลสำหรับสร้างรายงาน");
      return;
    }

    setIsGeneratingExcelReport(true);
    try {
      const fileBuffer = await ExportServerStatusService.generateReport(
        serverHealthData
      );
      const fileBlob = new Blob([fileBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileUrl = window.URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = `Server_Health_Report_${Date.now()}.xlsx`;
      downloadLink.click();
      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์");
    } finally {
      setIsGeneratingExcelReport(false);
    }
  };

  // --- Computed Statistics ---
  const serverHealthStatistics = useMemo(() => {
    const totalCount = serverHealthData.length;
    const onlineCount = serverHealthData.filter(
      (item) => item.status === "200"
    ).length;
    const offlineCount = totalCount - onlineCount;
    const healthScorePercentage =
      totalCount === 0 ? 0 : Math.round((onlineCount / totalCount) * 100);

    return { totalCount, onlineCount, offlineCount, healthScorePercentage };
  }, [serverHealthData]);

  const filteredServerHealthData = useMemo(() => {
    return serverHealthData.filter((item) => {
      const lowerCaseSearchQuery = searchQueryString.toLowerCase();
      const matchesSearch =
        item.name_th.toLowerCase().includes(lowerCaseSearchQuery) ||
        item.service.toLowerCase().includes(lowerCaseSearchQuery) ||
        item.module.toLowerCase().includes(lowerCaseSearchQuery);

      if (statusFilterType === "ONLINE")
        return matchesSearch && item.status === "200";
      if (statusFilterType === "ERROR")
        return matchesSearch && item.status !== "200";
      return matchesSearch;
    });
  }, [serverHealthData, searchQueryString, statusFilterType]);

  // --- UI Helpers ---
  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success("คัดลอกเรียบร้อย");
  };

  const actionMenuItems: MenuProps["items"] = [
    {
      key: "discord",
      label: "แจ้งเตือนทาง Discord",
      icon: <NotificationOutlined />,
      onClick: () => handleFetchServerStatus("discord"),
      disabled: isSendingDiscordNotification,
    },
    { type: "divider" },
    {
      key: "export",
      label: "ดาวน์โหลดรายงาน Excel",
      icon: <FileExcelOutlined />,
      onClick: handleGenerateExcelReport,
      disabled: isGeneratingExcelReport || !serverHealthData.length,
    },
  ];

  const tableColumns: ColumnsType<ServerStatusData> = [
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            style={{
              backgroundColor:
                record.status === "200"
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
              color:
                record.status === "200" ? token.colorSuccess : token.colorError,
            }}
            icon={
              record.status === "200" ? (
                <SafetyCertificateFilled />
              ) : (
                <BugOutlined />
              )
            }
          />
          <Flex vertical>
            <Text strong>{record.name_th}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.module}
            </Text>
          </Flex>
        </Space>
      ),
    },
    {
      title: "จุดเชื่อมต่อ (Endpoint)",
      dataIndex: "service",
      responsive: ["md"],
      render: (serviceName, record) => (
        <Flex vertical>
          <Space size={4}>
            <Tag color="blue" bordered={false} style={{ margin: 0 }}>
              API
            </Tag>
            <Text style={{ fontSize: 13 }}>{serviceName}</Text>
          </Space>
          <Text
            type="secondary"
            style={{ fontSize: 11 }}
            ellipsis={{ tooltip: record.request.url }}
          >
            {record.request.url}
          </Text>
        </Flex>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (statusCode) => (
        <Tag
          color={statusCode === "200" ? "success" : "error"}
          style={{
            width: "100%",
            textAlign: "center",
            borderRadius: 12,
            padding: "4px 0",
          }}
          icon={
            statusCode === "200" ? <CheckCircleFilled /> : <CloseCircleFilled />
          }
        >
          {statusCode === "200" ? "ปกติ" : `ขัดข้อง ${statusCode}`}
        </Tag>
      ),
    },
    {
      title: "",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedServerStatusItem(record);
            setIsDetailModalVisible(true);
          }}
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* Global CSS Injection */}
      <style jsx global>{`
        @keyframes pulse-green {
          0% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .card-hover-effect {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-hover-effect:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
        }
        .animate-fade-in {
          animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .json-viewer {
          scrollbar-width: thin;
          scrollbar-color: ${token.colorTextQuaternary}
            ${token.colorFillQuaternary};
        }
        .json-viewer::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .json-viewer::-webkit-scrollbar-track {
          background: ${token.colorFillQuaternary};
        }
        .json-viewer::-webkit-scrollbar-thumb {
          background: ${token.colorTextQuaternary};
          border-radius: 10px;
        }
        .custom-table .ant-table-thead > tr > th {
          background: ${token.colorBgContainer};
          font-weight: 700;
        }
      `}</style>

      {/* --- Loading Modal Overlay --- */}
      <Modal
        open={isFetchingServerStatus}
        footer={null}
        closable={false}
        centered
        width={450}
        styles={{
          content: {
            borderRadius: 24,
            padding: 40,
            textAlign: "center",
            background: token.colorBgContainer,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <Flex vertical align="center" gap={24}>
          <div className="animate-float" style={{ position: "relative" }}>
            <Spin
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 80, color: token.colorPrimary }}
                  spin
                />
              }
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <CloudServerOutlined
                style={{ fontSize: 32, color: token.colorPrimary }}
              />
            </div>
          </div>
          <Flex vertical gap={8}>
            <Title level={3} style={{ margin: 0 }}>
              กำลังวิเคราะห์ระบบ...
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              ตรวจสอบความเสถียรของ API ทั้งหมดในเครือข่าย
            </Text>
          </Flex>
          <div style={{ width: "100%", padding: "0 24px" }}>
            <Progress
              percent={loadingProgress}
              status="active"
              strokeColor={{
                "0%": token.colorPrimary,
                "100%": token.colorSuccess,
              }}
              size={{ height: 10 }}
              showInfo={false}
            />
            <Flex justify="space-between" style={{ marginTop: 8 }}>
              <Text type="secondary" strong>
                {loadingProgress}%
              </Text>
              <Text type="secondary">กำลังรวบรวมข้อมูลหน่วยประมวลผล...</Text>
            </Flex>
          </div>
        </Flex>
      </Modal>

      <Flex vertical gap={32} style={{ padding: "16px 0 48px 0" }}>
        {/* --- Header Section --- */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={20}>
          <Space size={20}>
            <Button
              icon={<ArrowLeftOutlined />}
              shape="circle"
              size="large"
              onClick={() => router.back()}
              className="card-hover-effect"
              style={{ border: "none", background: token.colorFillTertiary }}
            />
            <Flex vertical>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  background: "linear-gradient(45deg, #1677ff, #722ed1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                แดชบอร์ดสถานะเซิร์ฟเวอร์
              </Title>
              <Space>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: token.colorSuccess,
                    animation: "pulse-green 2s infinite",
                  }}
                />
                <Text type="secondary" strong>
                  สแกนระบบครั้งล่าสุด:{" "}
                  {lastFetchTimestamp
                    ? lastFetchTimestamp.toLocaleTimeString("th-TH")
                    : "ไม่ทราบข้อมูล"}
                </Text>
                <Tooltip title="ระบบจะทำการตรวจสอบสถานะการเชื่อมต่อ (Health Check) ทุกครั้งที่มีการเรียกข้อมูลใหม่">
                  <InfoCircleOutlined
                    style={{
                      color: token.colorTextPlaceholder,
                      cursor: "help",
                    }}
                  />
                </Tooltip>
              </Space>
            </Flex>
          </Space>

          <Space size="middle">
            <Tooltip title="แจ้งสถานการณ์ปัจจุบันเข้าห้อง Discord เพื่อให้ทีมเทคนิคติดตาม">
              <Button
                icon={<NotificationOutlined />}
                onClick={() => handleFetchServerStatus("discord")}
                loading={isSendingDiscordNotification}
                size="large"
                className="card-hover-effect"
                style={{ borderRadius: 12 }}
              >
                แจ้งเตือนทีม
              </Button>
            </Tooltip>

            <Dropdown menu={{ items: actionMenuItems }} trigger={["click"]}>
              <Button
                type="primary"
                size="large"
                style={{
                  borderRadius: 12,
                  height: 48,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)",
                }}
                onClick={() => handleFetchServerStatus("normal")}
                loading={isFetchingServerStatus}
              >
                <ReloadOutlined /> อัปเดตสถานะทันที
              </Button>
            </Dropdown>
          </Space>
        </Flex>

        {/* --- Dashboard Overview --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              className="card-hover-effect animate-fade-in"
              style={{
                height: "100%",
                borderRadius: 24,
                overflow: "hidden",
                border: `1px solid ${token.colorBorderSecondary}`,
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
              }}
            >
              <Flex
                align="center"
                justify="space-between"
                style={{ height: "100%", padding: 8 }}
                gap={32}
                wrap="wrap"
              >
                <Flex vertical gap={12} flex={1}>
                  <Space>
                    <Tag
                      icon={<ThunderboltFilled />}
                      color="processing"
                      style={{ borderRadius: 8, padding: "2px 10px" }}
                    >
                      ความเสถียรของระบบ (System Stability)
                    </Tag>
                    <Tooltip title="คะแนนความสมบูรณ์คำนวณจากสัดส่วน API ที่ทำงานปกติเทียบกับทั้งหมด">
                      <InfoCircleOutlined
                        style={{ color: token.colorTextPlaceholder }}
                      />
                    </Tooltip>
                  </Space>

                  <Title
                    level={1}
                    style={{ margin: 0, fontSize: 42, fontWeight: 900 }}
                  >
                    {serverHealthStatistics.healthScorePercentage === 100
                      ? "ยอดเยี่ยม"
                      : serverHealthStatistics.healthScorePercentage >= 80
                      ? "เสถียรดี"
                      : "เฝ้าระวัง"}
                  </Title>

                  <Paragraph
                    style={{ fontSize: 16, color: token.colorTextSecondary }}
                  >
                    ระบบตรวจสอบ {serverHealthStatistics.totalCount}{" "}
                    จุดเชื่อมต่อสำคัญ
                    {serverHealthStatistics.offlineCount > 0 ? (
                      <span
                        style={{ color: token.colorError, fontWeight: 700 }}
                      >
                        {" "}
                        ตรวจพบปัญหา {serverHealthStatistics.offlineCount}{" "}
                        จุดที่ต้องได้รับการแก้ไข
                      </span>
                    ) : (
                      " ทุกระบบทำงานได้เต็มประสิทธิภาพ ปราศจากข้อผิดพลาด"
                    )}
                  </Paragraph>

                  <div style={{ marginTop: 12 }}>
                    <Flex
                      justify="space-between"
                      align="end"
                      style={{ marginBottom: 8 }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        คะแนนสุขภาพรวม (Health Score)
                      </Text>
                      <Title
                        level={4}
                        style={{ margin: 0, color: token.colorPrimary }}
                      >
                        {serverHealthStatistics.healthScorePercentage}%
                      </Title>
                    </Flex>
                    <Progress
                      percent={serverHealthStatistics.healthScorePercentage}
                      strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
                      size={{ height: 12 }}
                      showInfo={false}
                      className="animate-fade-in"
                    />
                  </div>
                </Flex>

                <div style={{ position: "relative", padding: 20 }}>
                  <Progress
                    type="circle"
                    percent={serverHealthStatistics.healthScorePercentage}
                    strokeWidth={10}
                    size={180}
                    showInfo={false}
                    strokeColor={
                      serverHealthStatistics.healthScorePercentage >= 90
                        ? token.colorSuccess
                        : serverHealthStatistics.healthScorePercentage >= 60
                        ? token.colorWarning
                        : token.colorError
                    }
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    {serverHealthStatistics.healthScorePercentage === 100 ? (
                      <CheckCircleFilled
                        style={{
                          fontSize: 60,
                          color: token.colorSuccess,
                          filter:
                            "drop-shadow(0 4px 12px rgba(82, 196, 26, 0.4))",
                        }}
                      />
                    ) : (
                      <CloudServerOutlined
                        style={{
                          fontSize: 42,
                          color: token.colorTextPlaceholder,
                          marginBottom: 8,
                        }}
                      />
                    )}
                  </div>
                </div>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Flex vertical gap={24} style={{ height: "100%" }}>
              <Card
                className="card-hover-effect animate-fade-in"
                style={{ flex: 1, borderRadius: 24, animationDelay: "0.1s" }}
                bodyStyle={{ padding: 24 }}
              >
                <Flex align="center" gap={20}>
                  <div
                    style={{
                      background: token.colorSuccessBg,
                      color: token.colorSuccess,
                      padding: 20,
                      borderRadius: 20,
                    }}
                  >
                    <CheckCircleFilled style={{ fontSize: 32 }} />
                  </div>
                  <Flex vertical>
                    <Text type="secondary" strong>
                      ออนไลน์ปกติ (Online)
                    </Text>
                    <Title
                      level={2}
                      style={{ margin: 0, color: token.colorSuccess }}
                    >
                      {serverHealthStatistics.onlineCount}{" "}
                      <small style={{ fontSize: 14 }}>รายการ</small>
                    </Title>
                  </Flex>
                </Flex>
              </Card>

              <Card
                className="card-hover-effect animate-fade-in"
                style={{ flex: 1, borderRadius: 24, animationDelay: "0.2s" }}
                bodyStyle={{ padding: 24 }}
              >
                <Flex align="center" gap={20}>
                  <div
                    style={{
                      background: token.colorErrorBg,
                      color: token.colorError,
                      padding: 20,
                      borderRadius: 20,
                    }}
                  >
                    <BugOutlined style={{ fontSize: 32 }} />
                  </div>
                  <Flex vertical>
                    <Text type="secondary" strong>
                      ขัดข้อง (Offline/Error)
                    </Text>
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        color:
                          serverHealthStatistics.offlineCount > 0
                            ? token.colorError
                            : token.colorText,
                      }}
                    >
                      {serverHealthStatistics.offlineCount}{" "}
                      <small style={{ fontSize: 14 }}>รายการ</small>
                    </Title>
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          </Col>
        </Row>

        {/* --- Alert Banner --- */}
        {serverHealthStatistics.offlineCount > 0 && !isFetchingServerStatus && (
          <Alert
            message={
              <Text strong style={{ fontSize: 16 }}>
                ตรวจพบเหตุการณ์ผิดปกติในระบบ (Critical Alerts)
              </Text>
            }
            description={
              <Text>
                ขณะนี้มีระบบสำคัญจำนวน {serverHealthStatistics.offlineCount}{" "}
                รายการที่ไม่ตอบสนอง
                โปรดตรวจสอบความสมบูรณ์ของเครือข่ายหรือบริการหลังบ้านโดยด่วน
              </Text>
            }
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                danger
                ghost
                onClick={() => setStatusFilterType("ERROR")}
              >
                ดูรายการที่พบปัญหา
              </Button>
            }
            className="animate-fade-in"
            style={{
              borderRadius: 20,
              padding: 16,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          />
        )}

        {/* --- Main Table Card --- */}
        <Card
          className="animate-fade-in shadow-sm"
          style={{ borderRadius: 24, padding: 8, animationDelay: "0.3s" }}
        >
          <Flex vertical gap={24}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={20}>
              <Flex align="center" gap={12}>
                <Title level={4} style={{ margin: 0 }}>
                  รายละเอียดสถานะรายระบบ
                </Title>
                <Tooltip title="แสดงรายชื่อ Endpoint และสถานะการตอบสนองล่าสุด">
                  <InfoCircleOutlined
                    style={{ color: token.colorTextPlaceholder }}
                  />
                </Tooltip>
              </Flex>

              <Flex gap={16} wrap="wrap">
                <Segmented
                  size="large"
                  options={[
                    { label: "ทั้งหมด", value: "ALL", icon: <ApiOutlined /> },
                    {
                      label: "ปกติ",
                      value: "ONLINE",
                      icon: (
                        <CheckCircleFilled
                          style={{ color: token.colorSuccess }}
                        />
                      ),
                    },
                    {
                      label: "พบปัญหา",
                      value: "ERROR",
                      icon: (
                        <CloseCircleFilled
                          style={{ color: token.colorError }}
                        />
                      ),
                    },
                  ]}
                  value={statusFilterType}
                  onChange={(val) => setStatusFilterType(val as any)}
                  style={{ borderRadius: 12, padding: 4 }}
                />
                <Input
                  size="large"
                  placeholder="ค้นหาชื่อระบบ, บริการ หรือ Endpoint..."
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextPlaceholder }}
                    />
                  }
                  value={searchQueryString}
                  onChange={(e) => setSearchQueryString(e.target.value)}
                  style={{ width: 350, borderRadius: 12 }}
                  allowClear
                />
              </Flex>
            </Flex>

            <Table<ServerStatusData>
              className="custom-table"
              columns={tableColumns}
              dataSource={filteredServerHealthData}
              rowKey="module"
              loading={isFetchingServerStatus}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total) => `แสดงทั้งหมด ${total} รายการ`,
                onChange: (page, pSize) => {
                  setCurrentPage(page);
                  setPageSize(pSize);
                },
              }}
              scroll={{ x: 1000 }}
              rowClassName={() => "animate-fade-in"}
            />
          </Flex>
        </Card>
      </Flex>

      {/* --- Enhanced Detail Modal --- */}
      <Modal
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            size="large"
            onClick={() => setIsDetailModalVisible(false)}
            style={{
              borderRadius: 12,
              minWidth: 150,
              height: 48,
              fontWeight: 600,
            }}
          >
            ปิดหน้าต่างการวิเคราะห์
          </Button>,
        ]}
        width={1300}
        centered
        styles={{
          header: {
            padding: "24px 32px 16px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          },
          body: { padding: "40px 32px", backgroundColor: token.colorBgLayout },
          content: {
            borderRadius: 32,
            overflow: "hidden",
            boxShadow: "0 25px 80px rgba(0,0,0,0.3)",
          },
        }}
        title={
          <Flex align="center" gap={16}>
            <div
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                padding: 10,
                borderRadius: 14,
                display: "flex",
                color: "white",
              }}
            >
              <DashboardOutlined style={{ fontSize: 24 }} />
            </div>
            <Flex vertical gap={2}>
              <Title level={4} style={{ margin: 0 }}>
                ผลการวินิจฉัยระบบเชิงลึก (Advanced System Diagnostics)
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                รายละเอียดทางเทคนิคและการตอบสนองของ API แบบ Real-time
              </Text>
            </Flex>
          </Flex>
        }
      >
        {selectedServerStatusItem && (
          <Row gutter={[40, 40]}>
            <Col xs={24} lg={8}>
              <Flex vertical gap={32}>
                {/* Status Summary Card */}
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 24,
                    textAlign: "center",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }}
                  bodyStyle={{ padding: 40 }}
                >
                  <div
                    style={{
                      background:
                        selectedServerStatusItem?.status === "200"
                          ? token.colorSuccessBg
                          : token.colorErrorBg,
                      width: 120,
                      height: 120,
                      borderRadius: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      color:
                        selectedServerStatusItem?.status === "200"
                          ? token.colorSuccess
                          : token.colorError,
                      boxShadow: `0 10px 30px ${
                        selectedServerStatusItem?.status === "200"
                          ? "rgba(82, 196, 26, 0.2)"
                          : "rgba(255, 77, 79, 0.2)"
                      }`,
                    }}
                  >
                    {selectedServerStatusItem?.status === "200" ? (
                      <SafetyCertificateFilled style={{ fontSize: 60 }} />
                    ) : (
                      <BugOutlined style={{ fontSize: 60 }} />
                    )}
                  </div>

                  <Title
                    level={2}
                    style={{ margin: "0 0 8px 0", fontWeight: 800 }}
                  >
                    {selectedServerStatusItem?.name_th}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    {selectedServerStatusItem?.name_en}
                  </Text>

                  <Divider style={{ margin: "24px 0" }}>
                    <Tag color="cyan">{selectedServerStatusItem?.module}</Tag>
                  </Divider>

                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={12}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: 16,
                        background:
                          selectedServerStatusItem?.status === "200"
                            ? token.colorSuccessBg
                            : token.colorErrorBg,
                        border: `1px solid ${
                          selectedServerStatusItem?.status === "200"
                            ? token.colorSuccessBorder
                            : token.colorErrorBorder
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background:
                            selectedServerStatusItem?.status === "200"
                              ? token.colorSuccess
                              : token.colorError,
                          animation: "pulse-green 2s infinite",
                        }}
                      />
                      <Text
                        strong
                        style={{
                          fontSize: 18,
                          color:
                            selectedServerStatusItem?.status === "200"
                              ? token.colorSuccess
                              : token.colorError,
                        }}
                      >
                        {selectedServerStatusItem?.status === "200"
                          ? "สถานะ: ทำงานปกติ"
                          : `สถานะ: ขัดข้อง (${selectedServerStatusItem?.status})`}
                      </Text>
                    </div>
                  </Space>
                </Card>

                {/* Tech Specs Card */}
                <Card
                  title={
                    <Space>
                      <RocketOutlined /> ข้อมูลทางเทคนิค (Tech Specs)
                    </Space>
                  }
                  bordered={false}
                  style={{
                    borderRadius: 24,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }}
                >
                  <Descriptions
                    column={1}
                    size="middle"
                    styles={{
                      label: {
                        color: token.colorTextSecondary,
                        fontWeight: 500,
                      },
                    }}
                  >
                    <Descriptions.Item
                      label={
                        <Space>
                          <GlobalOutlined /> บริการ
                        </Space>
                      }
                    >
                      <Text strong>{selectedServerStatusItem?.service}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <CodeOutlined /> วิธีการ
                        </Space>
                      }
                    >
                      <Tag
                        color="purple"
                        style={{ fontWeight: 700, borderRadius: 6 }}
                      >
                        {selectedServerStatusItem?.request.method || "POST"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <FieldTimeOutlined /> ตอบสนอง
                        </Space>
                      }
                    >
                      <Text type="secondary">N/A (ตรวจสอบผ่าน Log)</Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <DatabaseOutlined /> โมดูล
                        </Space>
                      }
                    >
                      <Text code>{selectedServerStatusItem?.module}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Flex>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 24,
                  height: "100%",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Tabs
                  type="card"
                  size="large"
                  tabBarGutter={8}
                  style={{ padding: 12 }}
                  items={[
                    {
                      key: "request",
                      label: (
                        <Space style={{ padding: "0 12px" }}>
                          <LinkOutlined /> ข้อมูลการเรียก (Request)
                        </Space>
                      ),
                      children: (
                        <div style={{ padding: "16px 24px 32px 24px" }}>
                          <Flex vertical gap={24}>
                            <section>
                              <Title level={5} style={{ marginBottom: 12 }}>
                                <LinkOutlined /> API Endpoint URL
                              </Title>
                              <div
                                style={{
                                  background: token.colorFillAlter,
                                  padding: 20,
                                  borderRadius: 16,
                                  border: `1px solid ${token.colorBorderSecondary}`,
                                  position: "relative",
                                }}
                              >
                                <Paragraph
                                  copyable
                                  style={{
                                    margin: 0,
                                    fontFamily:
                                      "'Fira Code', 'Roboto Mono', monospace",
                                    fontSize: 14,
                                    wordBreak: "break-all",
                                    color: token.colorPrimary,
                                    paddingRight: 40,
                                  }}
                                >
                                  {selectedServerStatusItem?.request.url}
                                </Paragraph>
                              </div>
                            </section>

                            {selectedServerStatusItem?.request.headers && (
                              <section>
                                <Flex
                                  justify="space-between"
                                  align="center"
                                  style={{ marginBottom: 12 }}
                                >
                                  <Title level={5} style={{ margin: 0 }}>
                                    <FileTextOutlined /> Request Headers
                                  </Title>
                                  <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        JSON.stringify(
                                          selectedServerStatusItem?.request
                                            .headers,
                                          null,
                                          2
                                        )
                                      )
                                    }
                                  >
                                    คัดลอก Headers
                                  </Button>
                                </Flex>
                                <div
                                  className="json-viewer"
                                  style={{
                                    padding: 20,
                                    background: token.colorFillQuaternary,
                                    borderRadius: 16,
                                    maxHeight: 200,
                                    overflow: "auto",
                                  }}
                                >
                                  <pre
                                    style={{
                                      margin: 0,
                                      fontSize: 13,
                                      color: token.colorTextSecondary,
                                    }}
                                  >
                                    {JSON.stringify(
                                      selectedServerStatusItem?.request.headers,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </section>
                            )}

                            {selectedServerStatusItem?.request.params &&
                              Object.keys(
                                selectedServerStatusItem?.request.params
                              ).length > 0 && (
                                <section>
                                  <Flex
                                    justify="space-between"
                                    align="center"
                                    style={{ marginBottom: 12 }}
                                  >
                                    <Title level={5} style={{ margin: 0 }}>
                                      <DatabaseOutlined /> Query Parameters
                                    </Title>
                                    <Button
                                      size="small"
                                      icon={<CopyOutlined />}
                                      onClick={() =>
                                        handleCopyToClipboard(
                                          JSON.stringify(
                                            selectedServerStatusItem?.request
                                              .params,
                                            null,
                                            2
                                          )
                                        )
                                      }
                                    >
                                      คัดลอก Params
                                    </Button>
                                  </Flex>
                                  <div
                                    className="json-viewer"
                                    style={{
                                      padding: 20,
                                      background: token.colorFillQuaternary,
                                      borderRadius: 16,
                                      maxHeight: 200,
                                      overflow: "auto",
                                    }}
                                  >
                                    <pre
                                      style={{
                                        margin: 0,
                                        fontSize: 13,
                                        color: token.colorTextSecondary,
                                      }}
                                    >
                                      {JSON.stringify(
                                        selectedServerStatusItem?.request
                                          .params,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                </section>
                              )}

                            {selectedServerStatusItem?.request.body && (
                              <section>
                                <Flex
                                  justify="space-between"
                                  align="center"
                                  style={{ marginBottom: 12 }}
                                >
                                  <Title level={5} style={{ margin: 0 }}>
                                    <DatabaseOutlined /> Payload Body
                                  </Title>
                                  <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        JSON.stringify(
                                          selectedServerStatusItem?.request
                                            .body,
                                          null,
                                          2
                                        )
                                      )
                                    }
                                  >
                                    คัดลอก Body
                                  </Button>
                                </Flex>
                                <div
                                  className="json-viewer"
                                  style={{
                                    padding: 20,
                                    background: token.colorFillQuaternary,
                                    borderRadius: 16,
                                    maxHeight: 250,
                                    overflow: "auto",
                                  }}
                                >
                                  <pre
                                    style={{
                                      margin: 0,
                                      fontSize: 13,
                                      color: token.colorTextSecondary,
                                    }}
                                  >
                                    {JSON.stringify(
                                      selectedServerStatusItem?.request.body,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </section>
                            )}
                          </Flex>
                        </div>
                      ),
                    },
                    {
                      key: "response",
                      label: (
                        <Space style={{ padding: "0 12px" }}>
                          <ApiOutlined /> ผลลัพธ์ตอบกลับ (Response)
                        </Space>
                      ),
                      children: (
                        <div style={{ padding: "16px 24px 32px 24px" }}>
                          <Flex vertical gap={24}>
                            <Alert
                              message={
                                <Text strong style={{ fontSize: 16 }}>
                                  {selectedServerStatusItem?.status === "200"
                                    ? "การวิเคราะห์: ระบบปกติ"
                                    : "การวิเคราะห์: พบข้อผิดพลาด"}
                                </Text>
                              }
                              description={
                                <Paragraph style={{ margin: "8px 0 0 0" }}>
                                  {selectedServerStatusItem?.status === "200"
                                    ? "จุดเชื่อมต่อนี้ตอบสนองด้วยรหัส HTTP 200 OK ข้อมูลโครงสร้างถูกต้องและพร้อมสำหรับการให้บริการผู้ใช้งานทั่วไป"
                                    : "พบรหัสสถานะที่ผิดปกติ Service อาจจะหยุดทำงานหรือมีข้อผิดพลาดซอฟต์แวร์ภายใน โปรดตรวจสอบไฟล์บันทึก (Logs) ของโมดูลนี้ทันที"}
                                </Paragraph>
                              }
                              type={
                                selectedServerStatusItem?.status === "200"
                                  ? "success"
                                  : "error"
                              }
                              showIcon
                              style={{ borderRadius: 16, padding: 20 }}
                            />

                            <section>
                              <Flex
                                justify="space-between"
                                align="center"
                                style={{ marginBottom: 12 }}
                              >
                                <Title level={5} style={{ margin: 0 }}>
                                  <CodeOutlined /> Response JSON Data
                                </Title>
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      JSON.stringify(
                                        selectedServerStatusItem?.response,
                                        null,
                                        2
                                      )
                                    )
                                  }
                                >
                                  คัดลอก JSON ทั้งหมด
                                </Button>
                              </Flex>
                              <div
                                className="json-viewer"
                                style={{
                                  background: token.colorFillSecondary,
                                  padding: 24,
                                  borderRadius: 20,
                                  maxHeight: 500,
                                  overflow: "auto",
                                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
                                }}
                              >
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    color: token.colorTextSecondary,
                                    fontFamily: "'Fira Code', monospace",
                                  }}
                                >
                                  {JSON.stringify(
                                    selectedServerStatusItem?.response,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </section>
                          </Flex>
                        </div>
                      ),
                    },
                    {
                      key: "curl",
                      label: (
                        <Space style={{ padding: "0 12px" }}>
                          <ThunderboltFilled /> Debug (cURL)
                        </Space>
                      ),
                      children: (
                        <div style={{ padding: "16px 24px 32px 24px" }}>
                          <Paragraph
                            type="secondary"
                            style={{ marginBottom: 16 }}
                          >
                            <InfoCircleOutlined />{" "}
                            ใช้สคริปต์นี้เพื่อจำลองการเรียกใช้งานผ่าน Command
                            Line (Terminal) สำหรับการทดสอบโดย Developer:
                          </Paragraph>
                          <div style={{ position: "relative" }}>
                            <Input.TextArea
                              value={selectedServerStatusItem?.curl}
                              readOnly
                              autoSize={{ minRows: 12, maxRows: 20 }}
                              style={{
                                fontFamily:
                                  "'Fira Code', 'Courier New', monospace",
                                fontSize: 13,
                                background: token.colorFillAlter,
                                padding: 24,
                                borderRadius: 20,
                                border: `1px solid ${token.colorBorder}`,
                                color: token.colorText,
                              }}
                            />
                            <Button
                              type="primary"
                              size="large"
                              icon={<CopyOutlined />}
                              style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                borderRadius: 10,
                                fontWeight: 600,
                              }}
                              onClick={() =>
                                handleCopyToClipboard(
                                  selectedServerStatusItem?.curl
                                )
                              }
                            >
                              คัดลอกคำสั่ง cURL
                            </Button>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Modal>
    </DashboardLayout>
  );
}
