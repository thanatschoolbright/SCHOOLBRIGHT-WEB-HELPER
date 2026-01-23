"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
import dayjs from "dayjs";
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
  Select,
  Steps,
  Result,
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
  ConsoleSqlOutlined,
  DatabaseOutlined,
  SolutionOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");
import {
  ExportServerStatusService,
  ServerStatusData,
} from "@/services/backend/server-status/export-server-status.report.service";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// --- Export Download Tracking Modal Component ---
interface ExportModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onExport: () => void;
  loading: boolean;
  exportStep: number;
  isExportSuccess: boolean;
  setIsExportSuccess: (success: boolean) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  setVisible,
  onExport,
  loading,
  exportStep,
  isExportSuccess,
  setIsExportSuccess,
}) => {
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setIsExportSuccess(false);
      }, 300);
    }
  }, [visible, setIsExportSuccess]);

  const renderContent = () => {
    if (isExportSuccess) {
      return (
        <Result
          status="success"
          title={
            <Text strong style={{ fontSize: "22px" }}>
              คุณดาวน์โหลดไฟล์สำเร็จ
            </Text>
          }
          subTitle="ระบบได้ทำการประมวลผลและส่งไฟล์รายงานสถานะเซิร์ฟเวอร์ให้คุณเรียบร้อยแล้ว"
          extra={[
            <Button
              type="primary"
              key="close"
              onClick={() => setVisible(false)}
              style={{
                borderRadius: "8px",
                height: "40px",
                padding: "0 30px",
              }}
            >
              ตกลง
            </Button>,
          ]}
        />
      );
    }

    if (loading || exportStep > 0) {
      return (
        <div style={{ padding: "20px 0" }}>
          <Steps
            direction="vertical"
            current={exportStep - 1}
            items={[
              {
                title: "รวบรวมข้อมูลสถานะ",
                description: "กำลังเตรียมข้อมูลจากแดชบอร์ดล่าสุด...",
                icon:
                  exportStep === 1 ? <LoadingOutlined /> : <DatabaseOutlined />,
              },
              {
                title: "ประมวลผลรายงาน Enterprise",
                description: "กำลังจัดรูปแบบไฟล์ Excel เพื่อความสวยงาม...",
                icon:
                  exportStep === 2 ? (
                    <LoadingOutlined />
                  ) : (
                    <FileExcelOutlined />
                  ),
              },
              {
                title: "ดาวน์โหลดไฟล์",
                description: "กำลังส่งไฟล์ไปยังอุปกรณ์ของคุณ...",
                icon:
                  exportStep === 3 ? (
                    <LoadingOutlined />
                  ) : (
                    <CloudDownloadOutlined />
                  ),
              },
              {
                title: "เสร็จสมบูรณ์",
                description: "พร้อมสำหรับการตรวจสอบ",
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </div>
      );
    }

    return (
      <div style={{ padding: "10px 0" }}>
        <Alert
          message="การส่งออกรายงานสถานะ API ในเครือข่าย SchoolBright"
          description="ไฟล์จะรวมข้อมูลสถานะล่าสุด, Endpoint, และโมดูลที่เกี่ยวข้องทั้งหมด"
          type="info"
          showIcon
          style={{ marginBottom: "20px", borderRadius: "12px" }}
        />

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <FileExcelOutlined
            style={{ fontSize: "48px", color: "#1677ff", marginBottom: "16px" }}
          />
          <br />
          <Text type="secondary">
            ต้องการเริ่มกระบวนการส่งออกรายงานแบบ Enterprise ใช่หรือไม่?
          </Text>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        !isExportSuccess && (
          <Space>
            <div
              style={{
                padding: "8px",
                background: "#1677ff",
                borderRadius: "8px",
                display: "flex",
              }}
            >
              <FileExcelOutlined style={{ color: "white" }} />
            </div>
            <Text strong style={{ fontSize: "18px" }}>
              ส่งออกรายงานสถานะเซิร์ฟเวอร์
            </Text>
          </Space>
        )
      }
      open={visible}
      onOk={onExport}
      onCancel={() => !loading && setVisible(false)}
      confirmLoading={loading}
      okText="เริ่มการส่งออก"
      cancelText="ยกเลิก"
      okButtonProps={{
        style: {
          display: loading || isExportSuccess ? "none" : "inline-block",
          borderRadius: "8px",
        },
      }}
      cancelButtonProps={{
        style: {
          display: loading || isExportSuccess ? "none" : "inline-block",
          borderRadius: "8px",
        },
      }}
      footer={loading || isExportSuccess ? null : undefined}
      width={480}
      centered
    >
      {renderContent()}
    </Modal>
  );
};

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
    [],
  );
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<Date | null>(
    null,
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
  const [groupFilterType, setGroupFilterType] = useState<string>("ALL");
  const [methodFilterType, setMethodFilterType] = useState<string>("ALL");

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [isExportSuccess, setIsExportSuccess] = useState(false);

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(serverHealthData.map((item) => item.group || "other")),
    );
    return [
      { label: "ทุกกลุ่ม", value: "ALL" },
      ...groups.map((g) => ({
        label: g.toUpperCase().replace("-", " "),
        value: g,
      })),
    ];
  }, [serverHealthData]);

  const methodOptions = [
    { label: "ทุกโปรโตคอล", value: "ALL" },
    { label: "GET", value: "GET" },
    { label: "POST", value: "POST" },
  ];

  const statusOptions = [
    { label: "สถานะทั้งหมด", value: "ALL" },
    { label: "ปกติ (Online)", value: "ONLINE" },
    { label: "ผิดพลาด (Error)", value: "ERROR" },
  ];

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQueryString, statusFilterType, groupFilterType]);

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
          { headers: { "Content-Type": "application/json" } },
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
    [],
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
    setExportStep(1); // ขั้นตอนที่ 1: รวบรวมข้อมูล
    setIsExportSuccess(false);

    try {
      // จำลองสถานะเพื่อให้เห็น UI Tracking
      await new Promise((resolve) => setTimeout(resolve, 800));
      setExportStep(2); // ขั้นตอนที่ 2: ประมวลผลบนเซิร์ฟเวอร์

      const response = await axios.post(
        "/api/v1/health-check/server/system/export",
        { data: filteredServerHealthData },
        { responseType: "blob" },
      );

      setExportStep(3); // ขั้นตอนที่ 3: กำลังดาวน์โหลด
      await new Promise((resolve) => setTimeout(resolve, 600));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `Server_Health_Report_${dayjs().format("DD_MM_BBBB")}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setExportStep(4); // สำเร็จ
      setIsExportSuccess(true);
      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์");
      setExportStep(0);
    } finally {
      setIsGeneratingExcelReport(false);
    }
  };

  // --- Computed Statistics ---
  const serverHealthStatistics = useMemo(() => {
    const totalCount = serverHealthData.length;
    const onlineCount = serverHealthData.filter((item) =>
      ["200", "404"].includes(item.status),
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

      const matchesStatus =
        statusFilterType === "ALL" ||
        (statusFilterType === "ONLINE" &&
          ["200", "404"].includes(item.status)) ||
        (statusFilterType === "ERROR" && !["200", "404"].includes(item.status));

      const matchesGroup =
        groupFilterType === "ALL" || item.group === groupFilterType;

      const matchesMethod =
        methodFilterType === "ALL" ||
        (item.request?.method || "GET") === methodFilterType;

      return matchesSearch && matchesStatus && matchesGroup && matchesMethod;
    });
  }, [
    serverHealthData,
    searchQueryString,
    statusFilterType,
    groupFilterType,
    methodFilterType,
  ]);

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
      title: "กลุ่มระบบ",
      dataIndex: "group",
      width: 150,
      render: (group) => (
        <Tag
          color="blue-inverse"
          style={{ borderRadius: 6, fontWeight: 500, border: "none" }}
        >
          {group?.toUpperCase() || "OTHER"}
        </Tag>
      ),
    },
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            size="large"
            style={{
              backgroundColor: ["200", "404"].includes(record.status)
                ? token.colorSuccessBg
                : token.colorErrorBg,
              color: ["200", "404"].includes(record.status)
                ? token.colorSuccess
                : token.colorError,
              border: `1px solid ${
                ["200", "404"].includes(record.status)
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
      render: (serviceName, record) => {
        const method = record.request?.method || "GET";
        const methodColor = method === "POST" ? "red" : "green";
        return (
          <Flex vertical>
            <Space size={4}>
              <Tag
                color={methodColor}
                bordered={false}
                style={{ margin: 0, fontWeight: "bold" }}
              >
                {method}
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
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (statusCode) => {
        const isSuccess = ["200", "404"].includes(statusCode);
        return (
          <Tag
            color={isSuccess ? "success" : "error"}
            className="w-full text-center rounded-xl py-1 font-semibold"
            icon={isSuccess ? <CheckCircleFilled /> : <CloseCircleFilled />}
          >
            {statusCode === "200"
              ? "ปกติ"
              : statusCode === "404"
                ? "ไม่พบข้อมูล (404)"
                : `รหัส ${statusCode}`}
          </Tag>
        );
      },
    },
    {
      title: "การกระทำ",
      key: "action",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedServerStatusItem(record);
            setIsDetailModalVisible(true);
          }}
          style={{ borderRadius: 8 }}
        >
          ดูรายละเอียด
        </Button>
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
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            background: token.colorBgContainer,
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Flex vertical gap={4}>
                <Text
                  strong
                  style={{ fontSize: 13, color: token.colorTextDescription }}
                >
                  ค้นหา
                </Text>
                <input
                  placeholder="ค้นหาชื่อระบบ, โมดูล หรือ จุดเชื่อมต่อ..."
                  className="w-full px-4 py-2 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{
                    background: token.colorFillQuaternary,
                    borderColor: token.colorBorder,
                    color: token.colorText,
                    height: 40,
                  }}
                  value={searchQueryString}
                  onChange={(e) => setSearchQueryString(e.target.value)}
                />
              </Flex>
            </Col>
            <Col xs={24} sm={8} lg={5}>
              <Flex vertical gap={4}>
                <Text
                  strong
                  style={{ fontSize: 13, color: token.colorTextDescription }}
                >
                  กลุ่มระบบ
                </Text>
                <Select
                  style={{ width: "100%", height: 40 }}
                  options={groupOptions}
                  value={groupFilterType}
                  onChange={setGroupFilterType}
                  placeholder="เลือกกลุ่มระบบ"
                  dropdownStyle={{ borderRadius: 12 }}
                />
              </Flex>
            </Col>
            <Col xs={24} sm={8} lg={5}>
              <Flex vertical gap={4}>
                <Text
                  strong
                  style={{ fontSize: 13, color: token.colorTextDescription }}
                >
                  สถานะ
                </Text>
                <Select
                  style={{ width: "100%", height: 40 }}
                  options={statusOptions}
                  value={statusFilterType}
                  onChange={setStatusFilterType}
                  placeholder="เลือกสถานะ"
                  dropdownStyle={{ borderRadius: 12 }}
                />
              </Flex>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Flex vertical gap={4}>
                <Text
                  strong
                  style={{ fontSize: 13, color: token.colorTextDescription }}
                >
                  ประเภท (Method)
                </Text>
                <Segmented
                  block
                  options={methodOptions}
                  value={methodFilterType}
                  onChange={(value) => setMethodFilterType(value as string)}
                  style={{ height: 40, padding: 4 }}
                />
              </Flex>
            </Col>
          </Row>
        </Card>

        {/* --- Data Table --- */}
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: token.boxShadowTertiary,
            background: token.colorBgContainer,
          }}
          title={
            <Space>
              <DatabaseOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: 18 }}>
                รายการ API Monitoring ทั้งหมด
              </Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => setIsExportModalVisible(true)}
              disabled={serverHealthData.length === 0}
            >
              ส่งออกรายการ (Excel)
            </Button>
          }
          bodyStyle={{ padding: screens.md ? "24px" : "12px" }}
        >
          {filteredServerHealthData.length > 0 ? (
            <Table
              columns={tableColumns}
              dataSource={filteredServerHealthData}
              rowKey={(record) => record.module + record.service}
              size="large"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                position: ["bottomRight"],
              }}
              loading={isFetchingServerStatus}
              scroll={{ x: 1000 }}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
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
          <Flex align="center" gap={12} style={{ paddingBottom: 16 }}>
            <div
              style={{
                background: token.colorFillSecondary,
                padding: 10,
                borderRadius: 12,
              }}
            >
              <CodeOutlined
                style={{ fontSize: 20, color: token.colorPrimary }}
              />
            </div>
            <Flex vertical gap={2}>
              <Title level={4} style={{ margin: 0 }}>
                ข้อมูลทางเทคนิค (Technical Details)
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                ตรวจสอบรายละเอียดการเชื่อมต่อและข้อมูลตอบกลับจากระบบ
              </Text>
            </Flex>
          </Flex>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsDetailModalVisible(false)}
            size="large"
            style={{ borderRadius: 12, minWidth: 120 }}
          >
            ปิดหน้าต่าง
          </Button>,
          <Button
            key="copy"
            type="primary"
            size="large"
            icon={<CopyOutlined />}
            onClick={() =>
              handleCopyToClipboard(
                JSON.stringify(selectedServerStatusItem, null, 2),
              )
            }
            style={{ borderRadius: 12, minWidth: 150 }}
          >
            คัดลอก JSON
          </Button>,
        ]}
        width={1100}
        centered
        styles={{
          content: { borderRadius: 24, padding: 32 },
          header: { marginBottom: 24 },
        }}
      >
        {selectedServerStatusItem && (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <Flex vertical gap={24}>
                {/* Basic Info */}
                <Card
                  size="small"
                  title="ข้อมูลพื้นฐาน"
                  bordered={false}
                  style={{
                    background: token.colorFillTertiary,
                    borderRadius: 16,
                  }}
                >
                  <Descriptions column={1} size="small" layout="vertical">
                    <Descriptions.Item label="ชื่อระบบ">
                      <Text strong style={{ fontSize: 16 }}>
                        {selectedServerStatusItem.name_th}
                      </Text>
                      <br />
                      <Text type="secondary">
                        {selectedServerStatusItem.name_en}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="โมดูล">
                      <Tag color="blue" style={{ borderRadius: 6 }}>
                        {selectedServerStatusItem.module}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="กลุ่มระบบ">
                      <Tag color="geekblue" style={{ borderRadius: 6 }}>
                        {selectedServerStatusItem.group}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะการเชื่อมต่อ">
                      <Badge
                        status={
                          selectedServerStatusItem.status === "200"
                            ? "success"
                            : "error"
                        }
                        text={
                          <Text
                            strong
                            style={{
                              color:
                                selectedServerStatusItem.status === "200"
                                  ? token.colorSuccess
                                  : token.colorError,
                            }}
                          >
                            {selectedServerStatusItem.status === "200"
                              ? "ปกติ (200 OK)"
                              : `ผิดพลาด (${selectedServerStatusItem.status})`}
                          </Text>
                        }
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* CURL Command */}
                <Card
                  size="small"
                  title={
                    <Flex justify="space-between" align="center">
                      <Space>
                        <ConsoleSqlOutlined /> คำสั่ง CURL
                      </Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleCopyToClipboard(selectedServerStatusItem.curl)
                        }
                      />
                    </Flex>
                  }
                  style={{
                    background: "#1e1e1e",
                    borderColor: token.colorBorderSecondary,
                    borderRadius: 16,
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "'Fira Code', 'Roboto Mono', monospace",
                      color: "#d4d4d4",
                      wordBreak: "break-all",
                      display: "block",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {selectedServerStatusItem.curl}
                  </Text>
                </Card>
              </Flex>
            </Col>

            <Col xs={24} lg={14}>
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Text strong style={{ fontSize: 16 }}>
                  ข้อมูลตอบกลับหน่วยประมวลผล (API Response):
                </Text>
                <div
                  className="rounded-xl overflow-auto custom-scrollbar"
                  style={{
                    background: "#1e1e1e",
                    color: "#9cdcfe",
                    padding: 24,
                    flex: 1,
                    minHeight: 500,
                    maxHeight: 700,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    fontFamily: "'Fira Code', 'Roboto Mono', monospace",
                    fontSize: 13,
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(selectedServerStatusItem.response, null, 2)}
                  </pre>
                </div>
              </Flex>
            </Col>
          </Row>
        )}
      </Modal>
      <ExportModal
        visible={isExportModalVisible}
        setVisible={setIsExportModalVisible}
        onExport={handleGenerateExcelReport}
        loading={isGeneratingExcelReport}
        exportStep={exportStep}
        isExportSuccess={isExportSuccess}
        setIsExportSuccess={setIsExportSuccess}
      />
    </DashboardLayout>
  );
}
