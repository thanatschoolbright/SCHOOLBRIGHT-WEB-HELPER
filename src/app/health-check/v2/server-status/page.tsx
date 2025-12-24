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
} from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  NotificationOutlined,
  EyeOutlined,
  CopyOutlined,
  ApiOutlined,
  SearchOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  GlobalOutlined,
  CodeOutlined,
  DashboardOutlined,
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

  // --- State Management (Full Word Naming) ---
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

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedServerStatusItem, setSelectedServerStatusItem] =
    useState<ServerStatusData | null>(null);

  const [searchQueryString, setSearchQueryString] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "ALL" | "ONLINE" | "ERROR"
  >("ALL");

  // --- Styles for Animation ---
  const hoverCardStyle: React.CSSProperties = {
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "default",
  };

  // --- API Actions ---
  const fetchServerHealthStatus = useCallback(
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
          setIsFetchingServerStatus(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchServerHealthStatus("normal");
  }, [fetchServerHealthStatus]);

  const handleGenerateExcelReport = async () => {
    if (serverHealthData.length === 0) {
      toast.warning("ไม่พบข้อมูลสำหรับสร้างรายงาน");
      return;
    }

    try {
      setIsGeneratingExcelReport(true);
      const fileBuffer = await ExportServerStatusService.generateReport(
        serverHealthData
      );

      const fileBlob = new Blob([fileBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileUrl = window.URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = `รายงานสถานะเซิร์ฟเวอร์_${new Date().getTime()}.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
    } finally {
      setIsGeneratingExcelReport(false);
    }
  };

  // --- Computed Data ---
  const filteredServerHealthData = useMemo(() => {
    return serverHealthData.filter((serverItem) => {
      const lowerCaseSearchQuery = searchQueryString.toLowerCase();
      const matchesSearchQuery =
        serverItem.module.toLowerCase().includes(lowerCaseSearchQuery) ||
        serverItem.service.toLowerCase().includes(lowerCaseSearchQuery) ||
        serverItem.name_th.toLowerCase().includes(lowerCaseSearchQuery) ||
        serverItem.name_en.toLowerCase().includes(lowerCaseSearchQuery);

      const isServerOnline = serverItem.status === "200";

      if (selectedStatusFilter === "ONLINE")
        return matchesSearchQuery && isServerOnline;
      if (selectedStatusFilter === "ERROR")
        return matchesSearchQuery && !isServerOnline;
      return matchesSearchQuery;
    });
  }, [serverHealthData, searchQueryString, selectedStatusFilter]);

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

  const headerActionMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "discord",
        label: "ทดสอบแจ้งเตือนทาง Discord",
        icon: <NotificationOutlined />,
        onClick: () => fetchServerHealthStatus("discord"),
        disabled: isSendingDiscordNotification,
      },
      {
        type: "divider",
      },
      {
        key: "export",
        label: "ดาวน์โหลดรายงาน Excel",
        icon: <FileExcelOutlined />,
        onClick: handleGenerateExcelReport,
        disabled: isGeneratingExcelReport || serverHealthData.length === 0,
      },
    ],
    [
      fetchServerHealthStatus,
      handleGenerateExcelReport,
      isSendingDiscordNotification,
      isGeneratingExcelReport,
      serverHealthData.length,
    ]
  );

  const handleOpenDetailModal = (record: ServerStatusData) => {
    setSelectedServerStatusItem(record);
    setIsDetailModalVisible(true);
  };

  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success("คัดลอกคำสั่งเรียบร้อย");
  };

  // --- Table Configuration ---
  const tableColumns: ColumnsType<ServerStatusData> = [
    {
      title: "ลำดับ",
      key: "index",
      align: "center",
      width: 70,
      render: (_value, _record, index) => index + 1,
      responsive: ["sm"],
    },
    {
      title: "ชื่อระบบ (Module)",
      key: "name_th",
      render: (_value, record) => (
        <Flex vertical>
          <Text strong style={{ fontSize: token.fontSize }}>
            {record.name_th}
          </Text>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {record.name_en}
          </Text>
        </Flex>
      ),
    },
    {
      title: "จุดเชื่อมต่อ (Service Endpoint)",
      dataIndex: "service",
      key: "service",
      responsive: ["md"],
      render: (text, record) => (
        <Flex vertical>
          <Space size={4}>
            <Tag
              bordered={false}
              color="processing"
              style={{ margin: 0, fontSize: 10 }}
            >
              API
            </Tag>
            <Text style={{ fontSize: token.fontSizeSM }}>{text}</Text>
          </Space>
          <Text
            type="secondary"
            ellipsis
            style={{ fontSize: 10, maxWidth: 250, marginTop: 4 }}
          >
            {record.request.url}
          </Text>
        </Flex>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const isStatusOk = status === "200";
        return (
          <Badge
            status={isStatusOk ? "success" : "error"}
            text={
              isStatusOk ? (
                <Tag
                  color="success"
                  bordered={false}
                  icon={<CheckCircleOutlined />}
                >
                  ปกติ
                </Tag>
              ) : (
                <Tag
                  color="error"
                  bordered={false}
                  icon={<CloseCircleOutlined />}
                >
                  ผิดพลาด ({status})
                </Tag>
              )
            }
          />
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 90,
      align: "center",
      render: (_value, record) => (
        <Tooltip title="กดเพื่อดูรายละเอียด">
          <Button
            type={record.status !== "200" ? "primary" : "text"}
            danger={record.status !== "200"}
            size="small"
            shape="circle"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetailModal(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Flex vertical gap="large" style={{ width: "100%", paddingBottom: 24 }}>
        {/* --- ส่วนหัวของหน้า (Page Header) ---
          ประกอบด้วย: ปุ่มย้อนกลับ, ชื่อหน้า, สถานะการอัปเดตล่าสุด, และปุ่ม Action หลัก
        */}
        <Flex
          justify="space-between"
          align={screenBreakpoints.md ? "center" : "start"}
          vertical={!screenBreakpoints.md}
          gap="middle"
        >
          <Flex align="start" gap="middle">
            <Button
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
              aria-label="ย้อนกลับ"
              style={{
                border: "none",
                background: "transparent",
                boxShadow: "none",
              }}
            />
            <Flex vertical>
              <Title level={3} style={{ margin: 0 }}>
                ระบบตรวจสอบสุขภาพเซิร์ฟเวอร์
              </Title>
              <Text
                type="secondary"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {isFetchingServerStatus ? (
                  <Skeleton.Input active size="small" style={{ width: 100 }} />
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    ข้อมูลล่าสุดเมื่อ:{" "}
                    {lastFetchTimestamp
                      ? lastFetchTimestamp.toLocaleTimeString("th-TH")
                      : "-"}
                  </>
                )}
              </Text>
            </Flex>
          </Flex>

          <Space
            style={{
              width: !screenBreakpoints.md ? "100%" : "auto",
              justifyContent: !screenBreakpoints.md ? "end" : "start",
            }}
          >
            {isFetchingServerStatus ||
            isGeneratingExcelReport ||
            isSendingDiscordNotification ? (
              <Skeleton.Button active shape="default" style={{ width: 150 }} />
            ) : (
              <Dropdown.Button
                type="primary"
                icon={<DownOutlined />}
                menu={{ items: headerActionMenuItems }}
                onClick={() => fetchServerHealthStatus("normal")}
                style={{ transition: "all 0.3s" }}
              >
                <Space>
                  <ReloadOutlined spin={isFetchingServerStatus} />
                  ตรวจสอบสถานะ
                </Space>
              </Dropdown.Button>
            )}
          </Space>
        </Flex>

        {/* --- ส่วนแสดงสถิติ (Statistic Cards) ---
          แสดงข้อมูลภาพรวม: Health Score, จำนวนระบบทั้งหมด, ระบบที่ทำงานปกติ, ระบบที่พบปัญหา
          มีการใช้ Animation Hover Effect เพื่อความสวยงาม
        */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" hoverable style={hoverCardStyle}>
              <Flex justify="space-between" align="center">
                {isFetchingServerStatus ? (
                  <Skeleton active paragraph={{ rows: 1 }} />
                ) : (
                  <>
                    <Flex vertical>
                      <Text type="secondary">ความสมบูรณ์</Text>
                      <Statistic
                        value={serverHealthStatistics.healthScorePercentage}
                        suffix="%"
                        valueStyle={{
                          color:
                            serverHealthStatistics.healthScorePercentage === 100
                              ? token.colorSuccess
                              : token.colorError,
                          fontWeight: 600,
                        }}
                      />
                    </Flex>
                    <Progress
                      type="circle"
                      percent={serverHealthStatistics.healthScorePercentage}
                      size={50}
                      strokeColor={{
                        "0%": token.colorError,
                        "100%": token.colorSuccess,
                      }}
                      showInfo={false}
                    />
                  </>
                )}
              </Flex>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" hoverable style={hoverCardStyle}>
              {isFetchingServerStatus ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text type="secondary">ระบบทั้งหมด</Text>
                    <Statistic
                      value={serverHealthStatistics.totalCount}
                      suffix="รายการ"
                      valueStyle={{ fontWeight: 600 }}
                    />
                  </Flex>
                  <Avatar
                    size={48}
                    icon={
                      <GlobalOutlined style={{ color: token.colorPrimary }} />
                    }
                    style={{ background: token.colorPrimaryBg }}
                  />
                </Flex>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" hoverable style={hoverCardStyle}>
              {isFetchingServerStatus ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text type="secondary">ทำงานปกติ</Text>
                    <Statistic
                      value={serverHealthStatistics.onlineCount}
                      valueStyle={{
                        color: token.colorSuccess,
                        fontWeight: 600,
                      }}
                      suffix="รายการ"
                    />
                  </Flex>
                  <Avatar
                    size={48}
                    icon={
                      <SafetyCertificateOutlined
                        style={{ color: token.colorSuccess }}
                      />
                    }
                    style={{ background: token.colorSuccessBg }}
                  />
                </Flex>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              hoverable
              style={{
                ...hoverCardStyle,
                border:
                  !isFetchingServerStatus &&
                  serverHealthStatistics.offlineCount > 0
                    ? `1px solid ${token.colorErrorBorder}`
                    : undefined,
              }}
            >
              {isFetchingServerStatus ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text type="secondary">พบปัญหา</Text>
                    <Statistic
                      value={serverHealthStatistics.offlineCount}
                      valueStyle={{ color: token.colorError, fontWeight: 600 }}
                      suffix="รายการ"
                    />
                  </Flex>
                  <Avatar
                    size={48}
                    icon={<BugOutlined style={{ color: token.colorError }} />}
                    style={{ background: token.colorErrorBg }}
                  />
                </Flex>
              )}
            </Card>
          </Col>
        </Row>

        {/* --- ส่วนแจ้งเตือน (Alert Section) ---
          แสดงเมื่อพบข้อผิดพลาดในระบบ
        */}
        {!isFetchingServerStatus && serverHealthStatistics.offlineCount > 0 && (
          <Alert
            message="พบความผิดปกติในระบบ"
            description={`ตรวจพบปัญหาจำนวน ${serverHealthStatistics.offlineCount} รายการที่ไม่สามารถใช้งานได้ กรุณาแจ้งทีม Developer หรือตรวจสอบรายละเอียดด้านล่าง`}
            type="error"
            showIcon
            banner
            style={{
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          />
        )}

        {/* --- ตารางและตัวกรอง (Table & Filter Section) ---
          ประกอบด้วย: Tab เลือกสถานะ, ช่องค้นหา, และตารางแสดงข้อมูล
        */}
        <Card
          variant="borderless"
          style={{ boxShadow: token.boxShadowTertiary }}
        >
          <Flex vertical gap="middle">
            <Flex
              justify="space-between"
              align="center"
              gap="middle"
              vertical={!screenBreakpoints.md}
            >
              <div style={{ width: !screenBreakpoints.md ? "100%" : "auto" }}>
                <Segmented
                  block={!screenBreakpoints.md}
                  options={[
                    { label: "ทั้งหมด", value: "ALL", icon: <ApiOutlined /> },
                    {
                      label: "ปกติ",
                      value: "ONLINE",
                      icon: <CheckCircleOutlined />,
                    },
                    {
                      label: `พบปัญหา (${serverHealthStatistics.offlineCount})`,
                      value: "ERROR",
                      icon: <CloseCircleOutlined />,
                    },
                  ]}
                  value={selectedStatusFilter}
                  onChange={(value) => setSelectedStatusFilter(value as any)}
                  disabled={isFetchingServerStatus}
                />
              </div>
              <Input
                placeholder="ค้นหาชื่อระบบ, URL..."
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                }
                value={searchQueryString}
                onChange={(event) => setSearchQueryString(event.target.value)}
                allowClear
                disabled={isFetchingServerStatus}
                style={{
                  width: !screenBreakpoints.md ? "100%" : 320,
                  borderRadius: token.borderRadius,
                }}
              />
            </Flex>

            {isFetchingServerStatus ? (
              <div style={{ padding: "20px" }}>
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            ) : (
              <Table<ServerStatusData>
                columns={tableColumns}
                dataSource={filteredServerHealthData}
                loading={false}
                rowKey={(record) => record.module}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                  size: "small",
                }}
                bordered
                scroll={{ x: 700 }}
                locale={{ emptyText: "ไม่พบข้อมูลที่ค้นหา" }}
              />
            )}
          </Flex>
        </Card>
      </Flex>

      {/* --- หน้าต่างรายละเอียด (Modal Detail Section) ---
        แสดงข้อมูลเชิงลึก Request/Response และ cURL
      */}
      <Modal
        title={
          <Space>
            <Badge
              status={
                selectedServerStatusItem?.status === "200" ? "success" : "error"
              }
            />
            <Text strong>
              รายละเอียดระบบ: {selectedServerStatusItem?.name_th || ""}
            </Text>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            ปิดหน้าต่าง
          </Button>,
        ]}
        width={850}
        centered
        styles={{ body: { padding: 0 } }}
      >
        {selectedServerStatusItem && (
          <Tabs
            defaultActiveKey="1"
            tabBarStyle={{ padding: "0 24px" }}
            items={[
              {
                key: "1",
                label: (
                  <span>
                    <DashboardOutlined /> สรุปข้อมูล
                  </span>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="ชื่อระบบ">
                        {selectedServerStatusItem.name_th} (
                        {selectedServerStatusItem.name_en})
                      </Descriptions.Item>
                      <Descriptions.Item label="สถานะ">
                        {selectedServerStatusItem.status === "200" ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            200 OK (ปกติ)
                          </Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>
                            {selectedServerStatusItem.status} (เกิดข้อผิดพลาด)
                          </Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="URL">
                        <Paragraph copyable style={{ margin: 0 }}>
                          {selectedServerStatusItem.request.url}
                        </Paragraph>
                      </Descriptions.Item>
                      <Descriptions.Item label="Response Preview">
                        <Text
                          type="secondary"
                          style={{ wordBreak: "break-all" }}
                        >
                          {typeof selectedServerStatusItem.response === "string"
                            ? selectedServerStatusItem.response
                            : JSON.stringify(
                                selectedServerStatusItem.response
                              ).slice(0, 150) + "..."}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "2",
                label: (
                  <span>
                    <CodeOutlined /> Dev Tools (cURL)
                  </span>
                ),
                children: (
                  <div style={{ padding: 24 }}>
                    <Alert
                      message="cURL Command สำหรับ Developer"
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <div style={{ position: "relative" }}>
                      <Input.TextArea
                        value={selectedServerStatusItem.curl}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        readOnly
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          background: token.colorFillQuaternary,
                          border: `1px solid ${token.colorBorder}`,
                          borderRadius: token.borderRadius,
                        }}
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleCopyToClipboard(selectedServerStatusItem.curl)
                        }
                        style={{ position: "absolute", top: 8, right: 8 }}
                      >
                        คัดลอก
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                key: "3",
                label: "JSON Response",
                children: (
                  <div style={{ padding: 24 }}>
                    <div
                      style={{
                        maxHeight: 400,
                        overflow: "auto",
                        padding: 16,
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <pre
                        style={{
                          fontSize: 12,
                          margin: 0,
                          fontFamily: "monospace",
                        }}
                      >
                        {JSON.stringify(
                          selectedServerStatusItem.response,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ),
              },
              {
                key: "4",
                label: "Request Info",
                children: (
                  <div style={{ padding: 24 }}>
                    <div
                      style={{
                        maxHeight: 400,
                        overflow: "auto",
                        padding: 16,
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <pre
                        style={{
                          fontSize: 12,
                          margin: 0,
                          fontFamily: "monospace",
                        }}
                      >
                        {JSON.stringify(
                          selectedServerStatusItem.request,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
