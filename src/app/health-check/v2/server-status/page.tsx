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
  const [isFetching, setIsFetching] = useState(false);
  const [isDiscordSending, setIsDiscordSending] = useState(false);
  const [isExcelGenerating, setIsExcelGenerating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServerStatusData | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ONLINE" | "ERROR">(
    "ALL"
  );

  // --- API Actions ---
  const fetchData = useCallback(
    async (mode: "normal" | "discord" = "normal") => {
      const isDiscord = mode === "discord";
      isDiscord ? setIsDiscordSending(true) : setIsFetching(true);

      try {
        const res = await axios.post<ServerStatusApiResponse>(
          "/api/v1/health-check/server/system",
          { mode },
          { headers: { "Content-Type": "application/json" } }
        );

        if (res.data?.data) {
          setServerHealthData(res.data.data);
          setLastFetchTimestamp(new Date());
          const msg = isDiscord
            ? "ส่งรายงานไปยัง Discord สำเร็จ"
            : "อัปเดตข้อมูลล่าสุดเรียบร้อย";
          toast.success(msg);
        }
      } catch (error: any) {
        toast.error("การเชื่อมต่อล้มเหลว", {
          description:
            error?.response?.data?.message_th || "กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        isDiscord ? setIsDiscordSending(false) : setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData("normal");
  }, [fetchData]);

  const handleExportExcel = async () => {
    if (!serverHealthData.length) return toast.warning("ไม่พบข้อมูล");
    setIsExcelGenerating(true);
    try {
      const buffer = await ExportServerStatusService.generateReport(
        serverHealthData
      );
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Server_Health_Report_${Date.now()}.xlsx`;
      link.click();
      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์");
    } finally {
      setIsExcelGenerating(false);
    }
  };

  // --- Computed Statistics ---
  const stats = useMemo(() => {
    const total = serverHealthData.length;
    const online = serverHealthData.filter((i) => i.status === "200").length;
    const offline = total - online;
    const score = total === 0 ? 0 : Math.round((online / total) * 100);

    return { total, online, offline, score };
  }, [serverHealthData]);

  const filteredData = useMemo(() => {
    return serverHealthData.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        item.name_th.toLowerCase().includes(query) ||
        item.service.toLowerCase().includes(query) ||
        item.module.toLowerCase().includes(query);

      if (filterStatus === "ONLINE")
        return matchSearch && item.status === "200";
      if (filterStatus === "ERROR") return matchSearch && item.status !== "200";
      return matchSearch;
    });
  }, [serverHealthData, searchQuery, filterStatus]);

  // --- UI Helpers ---
  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("คัดลอกเรียบร้อย");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "discord",
      label: "แจ้งเตือนทาง Discord",
      icon: <NotificationOutlined />,
      onClick: () => fetchData("discord"),
      disabled: isDiscordSending,
    },
    { type: "divider" },
    {
      key: "export",
      label: "ดาวน์โหลดรายงาน Excel",
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel,
      disabled: isExcelGenerating || !serverHealthData.length,
    },
  ];

  const columns: ColumnsType<ServerStatusData> = [
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      render: (_, r) => (
        <Space>
          <Avatar
            shape="square"
            style={{
              backgroundColor:
                r.status === "200" ? token.colorSuccessBg : token.colorErrorBg,
              color: r.status === "200" ? token.colorSuccess : token.colorError,
            }}
            icon={
              r.status === "200" ? <SafetyCertificateFilled /> : <BugOutlined />
            }
          />
          <Flex vertical>
            <Text strong>{r.name_th}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.module}
            </Text>
          </Flex>
        </Space>
      ),
    },
    {
      title: "จุดเชื่อมต่อ (Endpoint)",
      dataIndex: "service",
      responsive: ["md"],
      render: (val, r) => (
        <Flex vertical>
          <Space size={4}>
            <Tag color="blue" bordered={false} style={{ margin: 0 }}>
              API
            </Tag>
            <Text style={{ fontSize: 13 }}>{val}</Text>
          </Space>
          <Text
            type="secondary"
            style={{ fontSize: 11 }}
            ellipsis={{ tooltip: r.request.url }}
          >
            {r.request.url}
          </Text>
        </Flex>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={status === "200" ? "success" : "error"}
          style={{
            width: "100%",
            textAlign: "center",
            borderRadius: 12,
            padding: "4px 0",
          }}
          icon={
            status === "200" ? <CheckCircleFilled /> : <CloseCircleFilled />
          }
        >
          {status === "200" ? "ปกติ" : `ขัดข้อง ${status}`}
        </Tag>
      ),
    },
    {
      title: "",
      width: 60,
      align: "center",
      render: (_, r) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedItem(r);
            setModalVisible(true);
          }}
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* CSS Animation Injection */}
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
      `}</style>

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
              menu={{ items: menuItems }}
              onClick={() => fetchData("normal")}
              icon={<DownOutlined />}
              loading={isFetching || isDiscordSending || isExcelGenerating}
            >
              <ReloadOutlined /> ตรวจสอบสถานะ
            </Dropdown.Button>
          </Space>
        </Flex>

        {/* --- Dashboard Overview (Grid) --- */}
        <Row gutter={[16, 16]}>
          {/* Health Score Card (Large) */}
          <Col xs={24} md={14} lg={16}>
            <Card
              className="card-hover-effect animate-fade-in"
              bordered={false}
              style={{
                height: "100%",
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
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
                    {stats.score >= 90
                      ? "ระบบทำงานปกติสมบูรณ์"
                      : stats.score >= 70
                      ? "ระบบทำงานปกติ"
                      : "ระบบอยู่ในสภาวะวิกฤต"}
                  </Title>
                  <Text type="secondary">
                    กำลังตรวจสอบจุดเชื่อมต่อระบบทั้งหมด {stats.total} รายการ
                    {stats.offline > 0 && (
                      <span style={{ color: token.colorError }}>
                        {" "}
                        พบปัญหาที่ต้องแก้ไข {stats.offline} รายการ
                      </span>
                    )}
                  </Text>

                  {/* Visual Distribution Bar */}
                  <div style={{ marginTop: 16 }}>
                    <Flex justify="space-between" style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>อัตราความสำเร็จ</Text>
                      <Text strong style={{ fontSize: 12 }}>
                        {stats.score}%
                      </Text>
                    </Flex>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        background: token.colorErrorBg,
                        borderRadius: 4,
                        overflow: "hidden",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: `${stats.score}%`,
                          background: token.colorSuccess,
                          height: "100%",
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                </Flex>

                {/* Circular Progress */}
                <Flex
                  justify="center"
                  align="center"
                  style={{ position: "relative" }}
                >
                  <Progress
                    type="circle"
                    percent={stats.score}
                    strokeColor={
                      stats.score === 100
                        ? token.colorSuccess
                        : stats.score > 70
                        ? token.colorWarning
                        : token.colorError
                    }
                    strokeWidth={8}
                    size={140} // 🛠️ Fixed: Changed 'width' to 'size'
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      animation:
                        stats.score === 100
                          ? "pulse-green 2s infinite"
                          : "none",
                    }}
                  />
                </Flex>
              </Flex>
            </Card>
          </Col>

          {/* Stat Cards (Small) */}
          <Col xs={24} md={10} lg={8}>
            <Flex vertical gap={16} style={{ height: "100%" }}>
              {/* Online Stat */}
              <Card
                className="card-hover-effect animate-fade-in"
                style={{ flex: 1, animationDelay: "0.1s" }}
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
                      {stats.online}
                    </Title>
                  </Flex>
                </Flex>
              </Card>

              {/* Offline Stat */}
              <Card
                className="card-hover-effect animate-fade-in"
                bordered={false}
                style={{ flex: 1, animationDelay: "0.2s" }}
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
                          stats.offline > 0
                            ? token.colorError
                            : token.colorText,
                      }}
                    >
                      {stats.offline}
                    </Title>
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          </Col>
        </Row>

        {/* --- Alert Banner (Conditional) --- */}
        {stats.offline > 0 && !isFetching && (
          <Alert
            message="ตรวจพบปัญหาระบบขั้นวิกฤต"
            description={`มีระบบที่ไม่สามารถใช้งานได้จำนวน ${stats.offline} รายการ แนะนำให้ตรวจสอบและแก้ไขทันที`}
            type="error"
            showIcon
            className="animate-fade-in"
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          />
        )}

        {/* --- Main Content (Table & Filters) --- */}
        <Card
          bordered={false}
          className="animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Flex vertical gap={20}>
            {/* Toolbar */}
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
                    icon: <CheckCircleFilled className="text-green-500" />,
                  },
                  {
                    label: "พบปัญหา",
                    value: "ERROR",
                    icon: <CloseCircleFilled className="text-red-500" />,
                  },
                ]}
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as any)}
              />
              <Input
                placeholder="ค้นหาชื่อระบบ หรือ Endpoint..."
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextPlaceholder }}
                  />
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Flex>

            {/* Table */}
            {isFetching ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table<ServerStatusData>
                columns={columns}
                dataSource={filteredData}
                rowKey="module"
                pagination={{
                  pageSize: 8,
                  showTotal: (t) => `ทั้งหมด ${t} รายการ`,
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
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {selectedItem && (
          <Flex vertical gap={16}>
            <div style={{ padding: "16px 0" }}>
              <Flex
                align="center"
                gap={16}
                style={{
                  background: token.colorFillAlter,
                  padding: 16,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Avatar
                  size={64}
                  shape="square"
                  style={{
                    background:
                      selectedItem.status === "200"
                        ? token.colorSuccessBg
                        : token.colorErrorBg,
                    color:
                      selectedItem.status === "200"
                        ? token.colorSuccess
                        : token.colorError,
                  }}
                  icon={
                    selectedItem.status === "200" ? (
                      <CheckCircleFilled />
                    ) : (
                      <CloseCircleFilled />
                    )
                  }
                />
                <Flex vertical flex={1}>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedItem.name_th}
                  </Title>
                  <Text type="secondary">{selectedItem.name_en}</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag>{selectedItem.module}</Tag>
                    <Tag
                      color={
                        selectedItem.status === "200" ? "success" : "error"
                      }
                    >
                      {selectedItem.status === "200"
                        ? "HTTP 200 OK (ปกติ)"
                        : `Error ${selectedItem.status}`}
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
                          {selectedItem.request.url}
                        </Paragraph>
                      </Descriptions.Item>
                      <Descriptions.Item label="เมธอด (Method)">
                        <Tag color="blue">
                          {selectedItem.request.method || "GET"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="ตัวอย่างข้อมูลตอบกลับ">
                        <Text code style={{ fontSize: 12 }}>
                          {JSON.stringify(selectedItem.response).substring(
                            0,
                            200
                          )}
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
                        value={selectedItem.curl}
                        readOnly
                        autoSize={{ minRows: 4, maxRows: 10 }}
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          background: "#1e1e1e",
                          color: "#d4d4d4",
                          border: "none",
                        }}
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        style={{ position: "absolute", top: 8, right: 8 }}
                        onClick={() => copyToClipboard(selectedItem.curl)}
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
                      style={{
                        background: token.colorFillQuaternary,
                        padding: 12,
                        borderRadius: token.borderRadius,
                        maxHeight: 400,
                        overflow: "auto",
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: 11 }}>
                        {JSON.stringify(selectedItem.response, null, 2)}
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
