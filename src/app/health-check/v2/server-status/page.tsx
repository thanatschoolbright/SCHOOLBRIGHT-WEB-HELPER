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
  Statistic,
  Progress,
  Segmented,
  Badge,
  Alert,
  Dropdown,
  Flex,
  Row,
  Col,
  theme,
  Grid,
  Avatar,
  Empty,
  Spin,
  Divider,
  Descriptions,
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
  FileExcelOutlined,
  ArrowLeftOutlined,
  ThunderboltFilled,
  LoadingOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  UserOutlined,
  ScanOutlined,
  BellOutlined,
  BankOutlined,
  IdcardOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  ExportServerStatusService,
  ServerStatusData,
} from "@/services/backend/server-status/export-server-status.report.service";

const { Title, Text } = Typography;
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
  const screens = useBreakpoint();

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

  // --- Deep Insight Helper ---
  // Calculates specific metrics from known modules
  const insightMetrics = useMemo(() => {
    let unreadNotifications = 0;
    let loginStatus = "-";
    let verificationStatus = "-";
    let hardwareStatus = "-";
    let schoolCount = 0;

    serverHealthData.forEach((item) => {
      // Notification
      if (item.module === "notification" && item.response) {
        const resp = item.response as any;
        if (typeof resp.UnRead === "number") {
          unreadNotifications = resp.UnRead;
        }
      }
      // Login
      if (item.module === "login" && item.response) {
        const resp = item.response as any;
        loginStatus = resp.Desc || (item.status === "200" ? "OK" : "Fail");
      }
      // Verification
      if (item.module === "verification" && item.response) {
        const resp = item.response as any;
        if (resp.authentication?.resCode === 200) {
          verificationStatus = "ผ่านการตรวจสอบ";
        } else {
          verificationStatus = "รอตรวจสอบ";
        }
      }
      // Hardware / Facial Scan
      if (item.module === "facial-scan" && item.response) {
        if (Array.isArray(item.response) && item.response.length > 0) {
          const firstLog = item.response[0];
          hardwareStatus = firstLog.UserID ? "Active" : "No Data";
        }
      }
      // School List
      if (item.module === "get-school-list" && Array.isArray(item.response)) {
        schoolCount = item.response.length;
      }
    });

    return {
      unreadNotifications,
      loginStatus,
      verificationStatus,
      hardwareStatus,
      schoolCount,
    };
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

  const getModuleIcon = (moduleName: string) => {
    if (moduleName.includes("login")) return <UserOutlined />;
    if (moduleName.includes("notification")) return <BellOutlined />;
    if (moduleName.includes("scan")) return <ScanOutlined />;
    if (moduleName.includes("school")) return <BankOutlined />;
    if (moduleName.includes("verification")) return <IdcardOutlined />;
    if (moduleName.includes("server")) return <CloudServerOutlined />;
    return <ApiOutlined />;
  };

  const tableColumns: ColumnsType<ServerStatusData> = [
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            size="large"
            style={{
              backgroundColor:
                record.status === "200"
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
              color:
                record.status === "200" ? token.colorSuccess : token.colorError,
              border: `1px solid ${
                record.status === "200"
                  ? token.colorSuccessBorder
                  : token.colorErrorBorder
              }`,
            }}
            icon={getModuleIcon(record.module)}
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
            <Tag color="cyan" bordered={false} style={{ margin: 0 }}>
              {record.request?.method || "GET"}
            </Tag>
            <Text style={{ fontSize: 13 }}>{serviceName}</Text>
          </Space>
          <Text
            type="secondary"
            style={{ fontSize: 11 }}
            ellipsis={{ tooltip: record.request?.url }}
          >
            {record.request?.url || "-"}
          </Text>
        </Flex>
      ),
    },
    {
      title: "ตัวชี้วัด (Indicator)",
      key: "indicator",
      render: (_, record) => {
        // Custom indicators based on module
        let content = <Text type="secondary">-</Text>;

        if (
          record.module === "notification" &&
          (record.response as any)?.UnRead !== undefined
        ) {
          content = (
            <Badge
              count={(record.response as any).UnRead}
              overflowCount={999}
              color={token.colorError}
            />
          );
        } else if (
          record.module === "get-school-list" &&
          Array.isArray(record.response)
        ) {
          content = <Tag color="blue">{record.response.length} โรงเรียน</Tag>;
        } else if (
          record.module === "login" &&
          (record.response as any)?.Desc
        ) {
          content = <Tag color="green">{(record.response as any).Desc}</Tag>;
        } else if (record.status === "200") {
          content = (
            <Tag color="success" bordered={false}>
              ปกติ
            </Tag>
          );
        } else {
          content = (
            <Tag color="error" bordered={false}>
              พบปัญหา
            </Tag>
          );
        }

        return content;
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (statusCode) => (
        <Tag
          color={statusCode === "200" ? "success" : "error"}
          className="w-full text-center rounded-xl py-1 font-semibold"
          icon={
            statusCode === "200" ? <CheckCircleFilled /> : <CloseCircleFilled />
          }
        >
          {statusCode === "200" ? "ปกติ" : `รหัส ${statusCode}`}
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
            boxShadow: token.boxShadowSecondary,
          },
        }}
      >
        <Flex vertical align="center" gap={24}>
          <div className="relative animate-bounce">
            <Spin
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 80, color: token.colorPrimary }}
                  spin
                />
              }
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
          <div className="w-full px-6">
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
            <Flex justify="space-between" className="mt-2">
              <Text type="secondary" strong>
                {loadingProgress}%
              </Text>
              <Text type="secondary">กำลังรวบรวมข้อมูลหน่วยประมวลผล...</Text>
            </Flex>
          </div>
        </Flex>
      </Modal>

      <Flex vertical gap={24} className="py-4 pb-12">
        {/* --- Header Section --- */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={20}>
          <Space size={20}>
            <Button
              icon={<ArrowLeftOutlined />}
              shape="circle"
              size="large"
              onClick={() => router.back()}
              className="hover:scale-105 transition-transform"
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
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: token.colorSuccess }}
                />
                <Text type="secondary" strong>
                  ระบบตรวจสอบสถานะ V2
                </Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">
                  อัปเดตล่าสุด:{" "}
                  {lastFetchTimestamp
                    ? lastFetchTimestamp.toLocaleTimeString("th-TH")
                    : "รอดำเนินการ..."}
                </Text>
              </Space>
            </Flex>
          </Space>

          <Space size="middle">
            <Button
              icon={<NotificationOutlined />}
              onClick={() => handleFetchServerStatus("discord")}
              loading={isSendingDiscordNotification}
              size="large"
              className="hover:-translate-y-1 transition-transform duration-300 shadow-sm"
              style={{ borderRadius: 12 }}
            >
              แจ้งเตือน Discord
            </Button>
            <Dropdown menu={{ items: actionMenuItems }} trigger={["click"]}>
              <Button
                type="primary"
                size="large"
                style={{
                  borderRadius: 12,
                  height: 48,
                  fontWeight: 600,
                  paddingInline: 24,
                }}
                onClick={() => handleFetchServerStatus("normal")}
                loading={isFetchingServerStatus}
              >
                <ReloadOutlined /> อัปเดตสถานะ
              </Button>
            </Dropdown>
          </Space>
        </Flex>

        {/* --- 1. Summary Cards Overview (Redesigned) --- */}
        <Row gutter={[16, 16]}>
          {/* --- Health Score Card --- */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md"
              style={{
                height: "100%",
                borderRadius: 16,
                background: token.colorBgContainer, // Use token for dark mode support
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex justify="space-between" align="start">
                <Flex vertical gap={4}>
                  <Text type="secondary">คะแนนสุขภาพรวม</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {serverHealthStatistics.healthScorePercentage}%
                  </Title>
                </Flex>
                <Progress
                  type="dashboard"
                  percent={serverHealthStatistics.healthScorePercentage}
                  size={50}
                  strokeWidth={12}
                  showInfo={false}
                  strokeColor={token.colorSuccess}
                />
              </Flex>
              <Divider style={{ margin: "12px 0" }} />
              <Space size={4}>
                {serverHealthStatistics.healthScorePercentage >= 90 ? (
                  <CheckCircleFilled style={{ color: token.colorSuccess }} />
                ) : (
                  <BugOutlined style={{ color: token.colorError }} />
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  สถานะ:{" "}
                  {serverHealthStatistics.healthScorePercentage >= 90
                    ? "ทำงานปกติ"
                    : "ไม่เสถียร"}
                </Text>
              </Space>
            </Card>
          </Col>

          {/* --- Total Services Card --- */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md"
              style={{
                height: "100%",
                borderRadius: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" gap={16}>
                <div
                  style={{
                    background: token.colorFillSecondary,
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <ApiOutlined
                    style={{ fontSize: 24, color: token.colorPrimary }}
                  />
                </div>
                <Flex vertical>
                  <Text type="secondary">ระบบทั้งหมด</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {serverHealthStatistics.totalCount}
                  </Title>
                </Flex>
              </Flex>
              <Divider style={{ margin: "12px 0" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                โมดูลที่ถูกเฝ้าระวัง
              </Text>
            </Card>
          </Col>

          {/* --- Online Services Card --- */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md"
              style={{
                height: "100%",
                borderRadius: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" gap={16}>
                <div
                  style={{
                    background: token.colorSuccessBg,
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <CheckCircleFilled
                    style={{ fontSize: 24, color: token.colorSuccess }}
                  />
                </div>
                <Flex vertical>
                  <Text type="secondary">ทำงานปกติ</Text>
                  <Title
                    level={3}
                    style={{ margin: 0, color: token.colorSuccess }}
                  >
                    {serverHealthStatistics.onlineCount}
                  </Title>
                </Flex>
              </Flex>
              <Divider style={{ margin: "12px 0" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                จุดเชื่อมต่อพร้อมใช้งาน
              </Text>
            </Card>
          </Col>

          {/* --- Error/Issue Card --- */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md"
              style={{
                height: "100%",
                borderRadius: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" gap={16}>
                <div
                  style={{
                    background: token.colorErrorBg,
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <BugOutlined
                    style={{ fontSize: 24, color: token.colorError }}
                  />
                </div>
                <Flex vertical>
                  <Text type="secondary">พบปัญหา</Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color:
                        serverHealthStatistics.offlineCount > 0
                          ? token.colorError
                          : token.colorText,
                    }}
                  >
                    {serverHealthStatistics.offlineCount}
                  </Title>
                </Flex>
              </Flex>
              <Divider style={{ margin: "12px 0" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                ต้องได้รับการแก้ไข
              </Text>
            </Card>
          </Col>
        </Row>

        {/* --- 2. Deep Insights / Highlight Section (NEW) --- */}
        {serverHealthData.length > 0 && (
          <Card
            title={
              <Space>
                <ThunderboltFilled style={{ color: token.colorPrimary }} />{" "}
                <Text strong>ไฮไลท์ของระบบ (System Insights)</Text>
              </Space>
            }
            bordered={false}
            className="animate-fade-in"
            style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="การแจ้งเตือนที่ยังไม่อ่าน"
                  value={insightMetrics.unreadNotifications}
                  prefix={<BellOutlined />}
                  valueStyle={{
                    color:
                      insightMetrics.unreadNotifications > 0
                        ? token.colorWarning
                        : token.colorText,
                  }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="จำนวนโรงเรียน"
                  value={insightMetrics.schoolCount}
                  prefix={<BankOutlined />}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="บริการเข้าสู่ระบบ"
                  value={insightMetrics.loginStatus}
                  valueStyle={{
                    fontSize: 16,
                    color:
                      insightMetrics.loginStatus.includes("Success") ||
                      insightMetrics.loginStatus === "OK"
                        ? token.colorSuccess
                        : token.colorError,
                  }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="ระบบยืนยันตัวตน"
                  value={insightMetrics.verificationStatus}
                  valueStyle={{
                    fontSize: 18,
                    color:
                      insightMetrics.verificationStatus === "ผ่านการตรวจสอบ"
                        ? token.colorSuccess
                        : token.colorText,
                  }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* --- Alert Banner --- */}
        {serverHealthStatistics.offlineCount > 0 && !isFetchingServerStatus && (
          <Alert
            message="ตรวจพบความผิดปกติของระบบ"
            description={`พบระบบที่ไม่สามารถเชื่อมต่อได้ ${serverHealthStatistics.offlineCount} รายการ กรุณาตรวจสอบรายละเอียดด้านล่าง`}
            type="error"
            showIcon
            closable
            style={{
              borderRadius: 12,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          />
        )}

        {/* --- Filters & Search --- */}
        <Flex gap={16} wrap="wrap">
          <div className="w-full md:w-80">
            <input
              placeholder="ค้นหาชื่อระบบ, โมดูล หรือ จุดเชื่อมต่อ..."
              className="w-full px-4 py-2 rounded-xl border outline-none transition-colors"
              style={{
                background: token.colorBgContainer,
                borderColor: token.colorBorder,
                color: token.colorText,
              }}
              value={searchQueryString}
              onChange={(e) => setSearchQueryString(e.target.value)}
            />
          </div>
          <Segmented
            options={[
              { label: "ทั้งหมด", value: "ALL", icon: <GlobalOutlined /> },
              {
                label: "ปกติ (Online)",
                value: "ONLINE",
                icon: (
                  <CheckCircleFilled style={{ color: token.colorSuccess }} />
                ),
              },
              {
                label: "ขัดข้อง (Error)",
                value: "ERROR",
                icon: <CloseCircleFilled style={{ color: token.colorError }} />,
              },
            ]}
            value={statusFilterType}
            onChange={(value) => setStatusFilterType(value as any)}
            size="large"
          />
        </Flex>

        {/* --- Data Table --- */}
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: token.boxShadowTertiary,
          }}
          bodyStyle={{ padding: 0 }}
        >
          {filteredServerHealthData.length > 0 ? (
            <Table
              columns={tableColumns}
              dataSource={filteredServerHealthData}
              rowKey={(record) => record.module + record.service}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredServerHealthData.length,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              loading={isFetchingServerStatus}
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isFetchingServerStatus
                  ? "กำลังโหลดข้อมูล..."
                  : "ไม่พบข้อมูลที่ตรงกับเงื่อนไข"
              }
              style={{ padding: 48 }}
            />
          )}
        </Card>
      </Flex>

      {/* --- Detail Modal --- */}
      <Modal
        title={
          <Space>
            <CodeOutlined />
            <Text strong>ข้อมูลทางเทคนิค (Technical Details)</Text>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsDetailModalVisible(false)}
            style={{ borderRadius: 8 }}
          >
            ปิดหน้าต่าง
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() =>
              handleCopyToClipboard(
                JSON.stringify(selectedServerStatusItem, null, 2)
              )
            }
            style={{ borderRadius: 8 }}
          >
            คัดลอก JSON
          </Button>,
        ]}
        width={800}
        centered
        styles={{ content: { borderRadius: 16 } }}
      >
        {selectedServerStatusItem && (
          <Flex vertical gap={16} style={{ marginTop: 16 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="ชื่อระบบ">
                {selectedServerStatusItem.name_th} (
                {selectedServerStatusItem.name_en})
              </Descriptions.Item>
              <Descriptions.Item label="โมดูล">
                <Tag color="cyan">{selectedServerStatusItem.module}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <Badge
                  status={
                    selectedServerStatusItem.status === "200"
                      ? "success"
                      : "error"
                  }
                  text={
                    selectedServerStatusItem.status === "200"
                      ? "ทำงานปกติ (200)"
                      : `พบปัญหา (${selectedServerStatusItem.status})`
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="จุดเชื่อมต่อ">
                <Text ellipsis style={{ maxWidth: 300 }}>
                  {selectedServerStatusItem.service}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* CURL Command */}
            <Card
              size="small"
              title={
                <Text strong style={{ fontSize: 12 }}>
                  คำสั่ง CURL
                </Text>
              }
              style={{
                background: token.colorFillAlter,
                borderColor: token.colorBorderSecondary,
              }}
            >
              <Text
                code
                copyable
                style={{ fontSize: 12, wordBreak: "break-all" }}
              >
                {selectedServerStatusItem.curl}
              </Text>
            </Card>

            {/* Response Viewer */}
            <div>
              <Text strong style={{ marginBottom: 8, display: "block" }}>
                ข้อมูลตอบกลับ (Full API Response):
              </Text>
              <div
                className="p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono"
                style={{
                  background: token.colorFillQuaternary,
                  color: token.colorTextSecondary,
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(selectedServerStatusItem.response, null, 2)}
                </pre>
              </div>
            </div>
          </Flex>
        )}
      </Modal>
    </DashboardLayout>
  );
}
