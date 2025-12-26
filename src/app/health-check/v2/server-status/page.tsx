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
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-hover-effect {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover-effect:hover {
          transform: translateY(-4px);
        }
        .animate-fade-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        /* Dark Mode Scrollbar for JSON Viewer */
        .json-viewer::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .json-viewer::-webkit-scrollbar-track {
          background: ${token.colorFillQuaternary};
        }
        .json-viewer::-webkit-scrollbar-thumb {
          background: ${token.colorTextQuaternary};
          border-radius: 4px;
        }
      `}</style>

      {/* --- Loading Modal Overlay (Adaptive Theme) --- */}
      <Modal
        open={isFetchingServerStatus}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{
          content: {
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            background: token.colorBgContainer, // Use Token
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <Flex vertical align="center" gap={16}>
          <div style={{ position: "relative" }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 64 }} spin />}
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
                style={{ fontSize: 24, color: token.colorPrimary }}
              />
            </div>
          </div>
          <Flex vertical gap={4}>
            <Title level={4} style={{ margin: 0 }}>
              กำลังตรวจสอบระบบ Server
            </Title>
            <Text type="secondary">
              กำลังเชื่อมต่อและรวบรวมสถานะ API ทั้งหมด...
            </Text>
          </Flex>
          <div style={{ width: "100%", padding: "0 16px" }}>
            <Progress
              percent={loadingProgress}
              status="active"
              strokeColor={{
                "0%": token.colorPrimary,
                "100%": token.colorSuccess,
              }}
              showInfo={false}
            />
            <Flex justify="space-between" style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connecting...
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {loadingProgress}%
              </Text>
            </Flex>
          </div>
        </Flex>
      </Modal>

      <Flex vertical gap={24} style={{ paddingBottom: 40 }}>
        {/* --- Header Section --- */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Space size={16}>
            <Button
              icon={<ArrowLeftOutlined />}
              shape="circle"
              onClick={() => router.back()}
              style={{ border: "none", background: "transparent" }}
            />
            <Flex vertical>
              <Title level={3} style={{ margin: 0 }}>
                ระบบตรวจสอบสถานะเซิร์ฟเวอร์
              </Title>
              <Space>
                <Badge status="processing" color={token.colorSuccess} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  อัปเดตล่าสุด:{" "}
                  {lastFetchTimestamp
                    ? lastFetchTimestamp.toLocaleTimeString("th-TH")
                    : "-"}
                </Text>
              </Space>
            </Flex>
          </Space>

          <Space>
            <Dropdown.Button
              type="primary"
              menu={{ items: actionMenuItems }}
              onClick={() => handleFetchServerStatus("normal")}
              icon={<DownOutlined />}
              loading={
                isFetchingServerStatus ||
                isSendingDiscordNotification ||
                isGeneratingExcelReport
              }
            >
              <ReloadOutlined /> ตรวจสอบสถานะ
            </Dropdown.Button>
          </Space>
        </Flex>

        {/* --- Dashboard Overview --- */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14} lg={16}>
            <Card
              className="card-hover-effect animate-fade-in"
              style={{
                height: "100%",
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
                border: `1px solid ${token.colorBorderSecondary}`, // Add border for dark mode contrast
              }}
            >
              <Flex
                align="center"
                justify="space-between"
                style={{ height: "100%" }}
                gap={24}
                wrap="wrap"
              >
                <Flex vertical gap={8} flex={1}>
                  <Tag
                    icon={<ThunderboltFilled />}
                    color="blue"
                    style={{ width: "fit-content" }}
                  >
                    การตรวจสอบแบบเรียลไทม์
                  </Tag>
                  <Title level={2} style={{ margin: 0 }}>
                    {serverHealthStatistics.healthScorePercentage >= 90
                      ? "ระบบทำงานปกติสมบูรณ์"
                      : serverHealthStatistics.healthScorePercentage >= 70
                      ? "ระบบทำงานปกติ"
                      : "ระบบอยู่ในสภาวะวิกฤต"}
                  </Title>
                  <Text type="secondary">
                    กำลังตรวจสอบจุดเชื่อมต่อระบบทั้งหมด{" "}
                    {serverHealthStatistics.totalCount} รายการ
                    {serverHealthStatistics.offlineCount > 0 && (
                      <span style={{ color: token.colorError }}>
                        {" "}
                        พบปัญหาที่ต้องแก้ไข{" "}
                        {serverHealthStatistics.offlineCount} รายการ
                      </span>
                    )}
                  </Text>

                  <div style={{ marginTop: 16 }}>
                    <Flex justify="space-between" style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>อัตราความสำเร็จ</Text>
                      <Text strong style={{ fontSize: 12 }}>
                        {serverHealthStatistics.healthScorePercentage}%
                      </Text>
                    </Flex>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        background: token.colorFillSecondary, // Use Token
                        borderRadius: 4,
                        overflow: "hidden",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: `${serverHealthStatistics.healthScorePercentage}%`,
                          background: token.colorSuccess,
                          height: "100%",
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                </Flex>

                <Flex
                  justify="center"
                  align="center"
                  style={{ position: "relative" }}
                >
                  <Progress
                    type="circle"
                    percent={serverHealthStatistics.healthScorePercentage}
                    strokeColor={
                      serverHealthStatistics.healthScorePercentage === 100
                        ? token.colorSuccess
                        : serverHealthStatistics.healthScorePercentage > 70
                        ? token.colorWarning
                        : token.colorError
                    }
                    strokeWidth={8}
                    size={140}
                    trailColor={token.colorFillSecondary} // Use Token
                  />
                  {/* Pulse Effect only for Light/Green state if desired, keeping animation generic */}
                  <div
                    style={{
                      position: "absolute",
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      animation:
                        serverHealthStatistics.healthScorePercentage === 100
                          ? "pulse-green 2s infinite"
                          : "none",
                    }}
                  />
                </Flex>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} md={10} lg={8}>
            <Flex vertical gap={16} style={{ height: "100%" }}>
              <Card
                className="card-hover-effect animate-fade-in"
                style={{
                  flex: 1,
                  animationDelay: "0.1s",
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex align="center" gap={16}>
                  <Avatar
                    shape="square"
                    size={54}
                    style={{
                      background: token.colorSuccessBg,
                      color: token.colorSuccess,
                    }}
                    icon={<SafetyCertificateFilled style={{ fontSize: 24 }} />}
                  />
                  <Flex vertical>
                    <Text type="secondary">ใช้งานได้ปกติ</Text>
                    <Title
                      level={3}
                      style={{ margin: 0, color: token.colorSuccess }}
                    >
                      {serverHealthStatistics.onlineCount}
                    </Title>
                  </Flex>
                </Flex>
              </Card>

              <Card
                className="card-hover-effect animate-fade-in"
                style={{
                  flex: 1,
                  animationDelay: "0.2s",
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex align="center" gap={16}>
                  <Avatar
                    shape="square"
                    size={54}
                    style={{
                      background: token.colorErrorBg,
                      color: token.colorError,
                    }}
                    icon={<BugOutlined style={{ fontSize: 24 }} />}
                  />
                  <Flex vertical>
                    <Text type="secondary">พบปัญหา / หยุดชะงัก</Text>
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
              </Card>
            </Flex>
          </Col>
        </Row>

        {/* --- Alert Banner --- */}
        {serverHealthStatistics.offlineCount > 0 && !isFetchingServerStatus && (
          <Alert
            message="ตรวจพบปัญหาระบบขั้นวิกฤต"
            description={`มีระบบที่ไม่สามารถใช้งานได้จำนวน ${serverHealthStatistics.offlineCount} รายการ แนะนำให้ตรวจสอบและแก้ไขทันที`}
            type="error"
            showIcon
            className="animate-fade-in"
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          />
        )}

        {/* --- Main Content --- */}
        <Card
          className="animate-fade-in"
          style={{
            animationDelay: "0.3s",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={20}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
              <Segmented
                options={[
                  {
                    label: "ทั้งหมด",
                    value: "ALL",
                    icon: <ApiOutlined />,
                  },
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
                      <CloseCircleFilled style={{ color: token.colorError }} />
                    ),
                  },
                ]}
                value={statusFilterType}
                onChange={(selectedValue) =>
                  setStatusFilterType(selectedValue as any)
                }
              />
              <Input
                placeholder="ค้นหาชื่อระบบ หรือ Endpoint..."
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextPlaceholder }}
                  />
                }
                value={searchQueryString}
                onChange={(event) => setSearchQueryString(event.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Flex>

            {isFetchingServerStatus ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table<ServerStatusData>
                columns={tableColumns}
                dataSource={filteredServerHealthData}
                rowKey="module"
                pagination={{
                  pageSize: 8,
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: (
                    <Empty
                      description="ไม่พบข้อมูลระบบ"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            )}
          </Flex>
        </Card>
      </Flex>

      {/* --- Detail Modal --- */}
      <Modal
        title={
          <Space>
            <DashboardOutlined />
            <Text strong>วิเคราะห์ข้อมูลระบบ (System Diagnostics)</Text>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
        centered
        styles={{
          content: {
            background: token.colorBgContainer, // Use Token
          },
        }}
      >
        {selectedServerStatusItem && (
          <Flex vertical gap={16}>
            <div style={{ padding: "16px 0" }}>
              <Flex
                align="center"
                gap={16}
                style={{
                  background: token.colorFillQuaternary, // Adaptive background
                  padding: 16,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Avatar
                  size={64}
                  shape="square"
                  style={{
                    background:
                      selectedServerStatusItem.status === "200"
                        ? token.colorSuccessBg
                        : token.colorErrorBg,
                    color:
                      selectedServerStatusItem.status === "200"
                        ? token.colorSuccess
                        : token.colorError,
                  }}
                  icon={
                    selectedServerStatusItem.status === "200" ? (
                      <CheckCircleFilled />
                    ) : (
                      <CloseCircleFilled />
                    )
                  }
                />
                <Flex vertical flex={1}>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedServerStatusItem.name_th}
                  </Title>
                  <Text type="secondary">
                    {selectedServerStatusItem.name_en}
                  </Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag>{selectedServerStatusItem.module}</Tag>
                    <Tag
                      color={
                        selectedServerStatusItem.status === "200"
                          ? "success"
                          : "error"
                      }
                    >
                      {selectedServerStatusItem.status === "200"
                        ? "HTTP 200 OK (ปกติ)"
                        : `Error ${selectedServerStatusItem.status}`}
                    </Tag>
                  </Space>
                </Flex>
              </Flex>
            </div>

            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: "overview",
                  label: "ภาพรวม (Overview)",
                  children: (
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="ลิงก์ Endpoint">
                        <Paragraph copyable style={{ margin: 0, fontSize: 13 }}>
                          {selectedServerStatusItem.request.url}
                        </Paragraph>
                      </Descriptions.Item>
                      <Descriptions.Item label="เมธอด (Method)">
                        <Tag color="blue">
                          {selectedServerStatusItem.request.method || "GET"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="ตัวอย่างข้อมูลตอบกลับ">
                        <Text code style={{ fontSize: 12 }}>
                          {JSON.stringify(
                            selectedServerStatusItem.response
                          ).substring(0, 200)}
                          ...
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "curl",
                  label: "คำสั่ง cURL",
                  children: (
                    <div style={{ position: "relative" }}>
                      <Input.TextArea
                        value={selectedServerStatusItem.curl}
                        readOnly
                        autoSize={{ minRows: 4, maxRows: 10 }}
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          // Dark Mode Friendly Code Block
                          background:
                            token.id === "dark" ? "#1f1f1f" : "#f5f5f5",
                          color: token.id === "dark" ? "#e6e6e6" : "#262626",
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        style={{ position: "absolute", top: 8, right: 8 }}
                        onClick={() =>
                          handleCopyToClipboard(selectedServerStatusItem.curl)
                        }
                      >
                        คัดลอก
                      </Button>
                    </div>
                  ),
                },
                {
                  key: "json",
                  label: "ข้อมูลตอบกลับเต็ม (JSON)",
                  children: (
                    <div
                      className="json-viewer"
                      style={{
                        background:
                          token.id === "dark"
                            ? token.colorFillQuaternary
                            : "#fafafa",
                        padding: 12,
                        borderRadius: token.borderRadius,
                        maxHeight: 400,
                        overflow: "auto",
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: token.colorText,
                        }}
                      >
                        {JSON.stringify(
                          selectedServerStatusItem.response,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  ),
                },
              ]}
            />
          </Flex>
        )}
      </Modal>
    </DashboardLayout>
  );
}
