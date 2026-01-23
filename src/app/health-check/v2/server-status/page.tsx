"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Progress,
  Segmented,
  Alert,
  Flex,
  Row,
  Col,
  theme,
  Grid,
  Avatar,
  Empty,
  Spin,
  Select,
  Steps,
  Result,
  Tabs,
  Descriptions,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  NotificationOutlined,
  EyeOutlined,
  CopyOutlined,
  ApiOutlined,
  FileExcelOutlined,
  LoadingOutlined,
  CloudServerOutlined,
  UserOutlined,
  ScanOutlined,
  BellOutlined,
  BankOutlined,
  IdcardOutlined,
  CodeOutlined,
  DatabaseOutlined,
  SolutionOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  BugOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

// การตั้งค่าสำหรับการใช้งานวันที่แบบไทย
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// --- Interfaces ---
interface ServerStatusData {
  module: string;
  group: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: {
    url: string;
    method: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
    data?: any;
  };
  response: any;
}

interface ServerStatusApiResponse {
  status: number;
  message_th: string;
  message_en: string;
  data: ServerStatusData[];
}

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

/**
 * คอมโพเนนต์ Modal สำหรับแสดงสถานะการส่งออกข้อมูลแบบลำดับขั้นตอน
 */
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
            <Text strong style={{ fontSize: "22px", fontWeight: 600 }}>
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
                fontWeight: 600,
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
            <Text strong style={{ fontSize: "18px", fontWeight: 600 }}>
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
          fontWeight: 600,
        },
      }}
      cancelButtonProps={{
        style: {
          display: loading || isExportSuccess ? "none" : "inline-block",
          borderRadius: "8px",
          fontWeight: 600,
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
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedServerStatusItem, setSelectedServerStatusItem] =
    useState<ServerStatusData | null>(null);

  // Filter States
  const [searchQueryString, setSearchQueryString] = useState("");
  const [tempSearchQueryString, setTempSearchQueryString] = useState("");
  const [statusFilterType, setStatusFilterType] = useState<
    "ALL" | "ONLINE" | "ERROR"
  >("ALL");
  const [groupFilterType, setGroupFilterType] = useState<string>("ALL");
  const [methodFilterType, setMethodFilterType] = useState<string>("ALL");

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [isExportSuccess, setIsExportSuccess] = useState(false);

  // --- Options ---
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

  // --- API Actions ---

  /**
   * ฟังก์ชันสำหรับการดึงข้อมูลสถานะเซิร์ฟเวอร์จาก API
   */
  const handleRequestServerStatus = useCallback(
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
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล", {
          description:
            error?.response?.data?.message_th ||
            "ไม่สามารถเชื่อมต่อกับ Server ได้",
        });
      } finally {
        if (isDiscordMode) {
          setIsSendingDiscordNotification(false);
        } else {
          setTimeout(() => setIsFetchingServerStatus(false), 500);
        }
      }
    },
    [],
  );

  useEffect(() => {
    handleRequestServerStatus("normal");
  }, [handleRequestServerStatus]);

  /**
   * ฟังก์ชันสำหรับการส่งออกข้อมูลเป็นไฟล์ Excel พร้อม Tracking สถานะ
   */
  const handleExportExcelReport = async () => {
    if (serverHealthData.length === 0) {
      toast.warning("ไม่พบข้อมูลสำหรับสร้างรายงาน");
      return;
    }

    setIsGeneratingExcelReport(true);
    setExportStep(1);
    setIsExportSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setExportStep(2);

      const response = await axios.post(
        "/api/v1/health-check/server/system/export",
        { data: filteredServerHealthData },
        { responseType: "blob" },
      );

      setExportStep(3);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `Server_Health_Report_${dayjs().format("DD_MM_BBBB")}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setExportStep(4);
      setIsExportSuccess(true);
      toast.success("ส่งออกรายงานสำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน");
      setExportStep(0);
    } finally {
      setIsGeneratingExcelReport(false);
    }
  };

  /**
   * ฟังก์ชันสำหรับการล้างตัวกรองข้อมูลทั้งหมด
   */
  const handleClearSearchFilters = () => {
    setSearchQueryString("");
    setTempSearchQueryString("");
    setStatusFilterType("ALL");
    setGroupFilterType("ALL");
    setMethodFilterType("ALL");
    toast.success("ล้างการค้นหาเรียบร้อย");
  };

  /**
   * ฟังก์ชันสำหรับการกดปุ่มค้นหาข้อมูล
   */
  const handleSearchFilterApply = () => {
    setSearchQueryString(tempSearchQueryString);
    toast.success("กำลังค้นหาข้อมูล...");
  };

  // --- Computed Data ---

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

  // --- UI Columns & Icons ---

  const getModuleIcon = (moduleName: string) => {
    const iconStyle = { fontSize: 20 };
    if (moduleName.includes("login")) return <UserOutlined style={iconStyle} />;
    if (moduleName.includes("notification"))
      return <BellOutlined style={iconStyle} />;
    if (moduleName.includes("scan")) return <ScanOutlined style={iconStyle} />;
    if (moduleName.includes("school"))
      return <BankOutlined style={iconStyle} />;
    if (moduleName.includes("verification"))
      return <IdcardOutlined style={iconStyle} />;
    if (moduleName.includes("server"))
      return <CloudServerOutlined style={iconStyle} />;
    return <ApiOutlined style={iconStyle} />;
  };

  const tableColumns: ColumnsType<ServerStatusData> = [
    {
      title: "กลุ่มระบบ",
      dataIndex: "group",
      width: 150,
      sorter: (a, b) => a.group.localeCompare(b.group),
      render: (group) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
          {group?.toUpperCase() || "OTHER"}
        </Tag>
      ),
    },
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      sorter: (a, b) => a.name_th.localeCompare(b.name_th),
      render: (_, record) => {
        const isOnline = ["200", "404"].includes(record.status);
        return (
          <Space>
            <Avatar
              shape="square"
              size="large"
              style={{
                backgroundColor: isOnline
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
                color: isOnline ? token.colorSuccess : token.colorError,
                border: `1px solid ${isOnline ? token.colorSuccessBorder : token.colorErrorBorder}`,
              }}
              icon={getModuleIcon(record.module)}
            />
            <Flex vertical>
              <Text strong style={{ fontWeight: 600 }}>
                {record.name_th}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.module}
              </Text>
            </Flex>
          </Space>
        );
      },
    },
    {
      title: "จุดเชื่อมต่อ (Endpoint)",
      dataIndex: "service",
      responsive: ["md"],
      sorter: (a, b) => a.service.localeCompare(b.service),
      render: (serviceName, record) => {
        const method = record.request?.method || "GET";
        const methodColor = method === "POST" ? "red" : "green";
        return (
          <Flex vertical>
            <Space size={4}>
              <Tag
                color={methodColor}
                bordered={false}
                style={{ margin: 0, fontWeight: 600 }}
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
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (statusCode) => {
        const isSuccess = ["200", "404"].includes(statusCode);
        return (
          <Tag
            color={isSuccess ? "success" : "error"}
            style={{ borderRadius: 12, paddingInline: 12, fontWeight: 600 }}
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
      title: "จัดการ",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedServerStatusItem(record);
            setIsDetailModalVisible(true);
          }}
          style={{ fontWeight: 600 }}
        >
          รายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: screens.md ? "0 24px" : "0 12px" }}>
        {/* ส่วนที่ 1: หัวข้อหน้าจอระดับ Enterprise */}
        <HeaderBar
          icon={<CloudServerOutlined />}
          title="แดชบอร์ดสถานะเซิร์ฟเวอร์"
          subTitle={`อัปเดตล่าสุด: ${lastFetchTimestamp ? dayjs(lastFetchTimestamp).format("HH:mm:ss") : "รอกดปุ่มอัปเดต"}`}
          showBackButton={true}
          extra={
            <Space>
              <Button
                icon={<NotificationOutlined />}
                onClick={() => handleRequestServerStatus("discord")}
                loading={isSendingDiscordNotification}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                แจ้งเตือน Discord
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => handleRequestServerStatus("normal")}
                loading={isFetchingServerStatus}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                อัปเดตสถานะ
              </Button>
            </Space>
          }
        />

        {/* ส่วนที่ 2: สรุปภาพรวม (Summary Cards) */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="รายการทั้งหมด"
              value={serverHealthStatistics.totalCount}
              subtitle="API ที่อยู่ในการตรวจสอบ"
              icon={<DatabaseOutlined />}
              suffix="ระบบ"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="ปกติ (Online)"
              value={serverHealthStatistics.onlineCount}
              subtitle="ทำงานได้ปกติ"
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              iconBg="#f6ffed"
              percent={
                (serverHealthStatistics.onlineCount /
                  serverHealthStatistics.totalCount) *
                100
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="ขัดข้อง (Critical)"
              value={serverHealthStatistics.offlineCount}
              subtitle="ความเสี่ยงสูง"
              icon={<CloseCircleFilled />}
              color="#ff4d4f"
              iconBg="#fff1f0"
              percent={
                (serverHealthStatistics.offlineCount /
                  serverHealthStatistics.totalCount) *
                100
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="Health Score"
              value={serverHealthStatistics.healthScorePercentage}
              subtitle="ภาพรวมความเสถียร"
              icon={<ApiOutlined />}
              suffix="%"
              color="#1677ff"
              percent={serverHealthStatistics.healthScorePercentage}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ฟิลเตอร์ข้อมูล (Filter Section) */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Space style={{ marginBottom: 20 }}>
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
            <Text strong style={{ fontSize: 16, fontWeight: 600 }}>
              ตัวกรอง
            </Text>
          </Space>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Flex vertical gap={8}>
                <Text type="secondary">ค้นหาชื่อระบบหรือโมดูล</Text>
                <input
                  placeholder="พิมพ์คำค้นหา..."
                  value={tempSearchQueryString}
                  onChange={(e) => setTempSearchQueryString(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSearchFilterApply()
                  }
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                    padding: "0 12px",
                    outline: "none",
                    background: token.colorBgContainer,
                    color: token.colorText,
                  }}
                />
              </Flex>
            </Col>
            <Col xs={24} md={12}>
              <Flex vertical gap={8}>
                <Text type="secondary">เลือกกลุ่มระบบ</Text>
                <Select
                  style={{ width: "100%", height: 40 }}
                  options={groupOptions}
                  value={groupFilterType}
                  onChange={setGroupFilterType}
                />
              </Flex>
            </Col>
            <Col xs={24} md={12}>
              <Flex vertical gap={8}>
                <Text type="secondary">สถานะการทำงาน</Text>
                <Select
                  style={{ width: "100%", height: 40 }}
                  options={statusOptions}
                  value={statusFilterType}
                  onChange={setStatusFilterType}
                />
              </Flex>
            </Col>
            <Col xs={24} md={12}>
              <Flex vertical gap={8}>
                <Text type="secondary">ประเภท HTTP Method</Text>
                <Segmented
                  block
                  options={methodOptions}
                  value={methodFilterType}
                  onChange={(v) => setMethodFilterType(v as string)}
                  style={{ height: 40, padding: 4 }}
                />
              </Flex>
            </Col>
          </Row>

          <Flex justify="flex-end" gap={12} style={{ marginTop: 24 }}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearSearchFilters}
              style={{ borderRadius: 8 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchFilterApply}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              ค้นหาข้อมูล
            </Button>
          </Flex>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        <Card
          bordered={false}
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 32,
          }}
          title={
            <Space>
              <DatabaseOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: 18, fontWeight: 600 }}>
                รายการ Monitoring ข้อมูล API
              </Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => setIsExportModalVisible(true)}
              style={{ borderRadius: 8, fontWeight: 600 }}
              disabled={serverHealthData.length === 0}
            >
              ส่งออกรายการ (Excel)
            </Button>
          }
        >
          {filteredServerHealthData.length > 0 || isFetchingServerStatus ? (
            <Table
              columns={tableColumns}
              dataSource={filteredServerHealthData}
              rowKey={(record) => record.module + record.service}
              loading={isFetchingServerStatus}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `รวมข้อมูลทั้งหมด ${total} รายการ`,
              }}
              scroll={{ x: 1000 }}
            />
          ) : (
            <Empty
              description="ไม่พบข้อมูลที่คุณกำลังมองหา"
              style={{ padding: 48 }}
            />
          )}
        </Card>

        {/* --- ส่วนของ Modal รายละเอียดทางเทคนิค --- */}
        <Modal
          title={
            <Space align="center" style={{ paddingBottom: 16 }}>
              <div
                style={{
                  background: token.colorFillSecondary,
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <BugOutlined
                  style={{ color: token.colorPrimary, fontSize: 20 }}
                />
              </div>
              <Flex vertical gap={0}>
                <Text strong style={{ fontSize: 18, fontWeight: 600 }}>
                  Developer Debug Console
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ตรวจสอบรายละเอียดการทำงานของ API อย่างละเอียด
                </Text>
              </Flex>
            </Space>
          }
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[
            <Button
              key="curl"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(
                  selectedServerStatusItem?.curl || "",
                );
                toast.success("คัดลอก cURL เรียบร้อย");
              }}
              style={{ borderRadius: 8 }}
            >
              คัดลอก cURL
            </Button>,
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(selectedServerStatusItem, null, 2),
                );
                toast.success("คัดลอก JSON ทั้งหมดเรียบร้อย");
              }}
              style={{ borderRadius: 8 }}
            >
              คัดลอก JSON
            </Button>,
            <Button
              key="close"
              type="primary"
              onClick={() => setIsDetailModalVisible(false)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              ปิดหน้าต่าง
            </Button>,
          ]}
          width={900}
          centered
          styles={{ body: { padding: "0 24px 24px 24px" } }}
        >
          {selectedServerStatusItem && (
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <Space>
                      <ApiOutlined />
                      <span>ภาพรวม (Overview)</span>
                    </Space>
                  ),
                  children: (
                    <Flex vertical gap={20} style={{ paddingTop: 16 }}>
                      <Descriptions
                        bordered
                        column={2}
                        size="small"
                        labelStyle={{ fontWeight: 600, width: 150 }}
                      >
                        <Descriptions.Item label="ชื่อระบบ (TH)" span={2}>
                          {selectedServerStatusItem.name_th}
                        </Descriptions.Item>
                        <Descriptions.Item label="ชื่อระบบ (EN)" span={2}>
                          {selectedServerStatusItem.name_en}
                        </Descriptions.Item>
                        <Descriptions.Item label="โมดูล">
                          <Tag color="processing">
                            {selectedServerStatusItem.module}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="กลุ่มระบบ">
                          <Tag color="cyan">
                            {selectedServerStatusItem.group}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="สถานะ HTTP">
                          <Tag
                            color={
                              ["200", "404"].includes(
                                selectedServerStatusItem.status,
                              )
                                ? "success"
                                : "error"
                            }
                          >
                            {selectedServerStatusItem.status}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="โดเมน">
                          {selectedServerStatusItem.service}
                        </Descriptions.Item>
                      </Descriptions>

                      <Flex vertical gap={8}>
                        <Text strong>cURL Command:</Text>
                        <pre
                          style={{
                            background: token.colorFillQuaternary,
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 12,
                            border: `1px solid ${token.colorBorder}`,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {selectedServerStatusItem.curl}
                        </pre>
                      </Flex>
                    </Flex>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <Space>
                      <CloudServerOutlined />
                      <span>ข้อมูล Request</span>
                    </Space>
                  ),
                  children: (
                    <Flex vertical gap={20} style={{ paddingTop: 16 }}>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        labelStyle={{ fontWeight: 600, width: 120 }}
                      >
                        <Descriptions.Item label="URL">
                          <Text copyable>
                            {selectedServerStatusItem.request.url}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Method">
                          <Tag
                            color={
                              selectedServerStatusItem.request.method === "POST"
                                ? "red"
                                : "green"
                            }
                          >
                            {selectedServerStatusItem.request.method}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>

                      {selectedServerStatusItem.request.headers && (
                        <Flex vertical gap={8}>
                          <Text strong>Headers:</Text>
                          <pre
                            style={{
                              background: token.colorFillQuaternary,
                              padding: 12,
                              borderRadius: 8,
                              fontSize: 12,
                              border: `1px solid ${token.colorBorder}`,
                            }}
                          >
                            {JSON.stringify(
                              selectedServerStatusItem.request.headers,
                              null,
                              2,
                            )}
                          </pre>
                        </Flex>
                      )}

                      {(selectedServerStatusItem.request.params ||
                        selectedServerStatusItem.request.body ||
                        selectedServerStatusItem.request.data) && (
                        <Flex vertical gap={8}>
                          <Text strong>Payload (Params / Body):</Text>
                          <pre
                            style={{
                              background: token.colorFillQuaternary,
                              padding: 12,
                              borderRadius: 8,
                              fontSize: 12,
                              border: `1px solid ${token.colorBorder}`,
                            }}
                          >
                            {JSON.stringify(
                              selectedServerStatusItem.request.params ||
                                selectedServerStatusItem.request.body ||
                                selectedServerStatusItem.request.data,
                              null,
                              2,
                            )}
                          </pre>
                        </Flex>
                      )}
                    </Flex>
                  ),
                },
                {
                  key: "3",
                  label: (
                    <Space>
                      <DatabaseOutlined />
                      <span>ข้อมูล Response</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <pre
                        style={{
                          background: token.colorFillQuaternary,
                          padding: 16,
                          borderRadius: 12,
                          maxHeight: 500,
                          overflow: "auto",
                          border: `1px solid ${token.colorBorder}`,
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(
                          selectedServerStatusItem.response,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Modal>

        {/* --- ส่วนของ Modal ส่งออกรายงานแบบ Tracking --- */}
        <ExportModal
          visible={isExportModalVisible}
          setVisible={setIsExportModalVisible}
          onExport={handleExportExcelReport}
          loading={isGeneratingExcelReport}
          exportStep={exportStep}
          isExportSuccess={isExportSuccess}
          setIsExportSuccess={setIsExportSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
