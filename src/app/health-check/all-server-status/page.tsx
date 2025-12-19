"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Skeleton,
  Tag,
  Avatar,
  Badge,
  Typography,
  Space,
  Descriptions,
  Divider,
  Input,
  Statistic,
  Grid,
  Flex,
  Tooltip,
  Alert, // Added Tooltip for better UX
} from "antd";
import {
  CloudOutlined,
  LinkOutlined,
  CodeOutlined,
  EyeOutlined,
  ReloadOutlined,
  CopyOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";

// ==================== Types ====================
type ServerStatus = ResponseGetServerStatusV2["draftValues"]["Array"][number];

// ==================== Constants ====================
const RESPONSE_TIME_THRESHOLDS = {
  GOOD: 1,
  MODERATE: 2,
} as const;

const STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
} as const;

// ==================== Utility Functions ====================
const getResponseTimeColor = (time: number): string => {
  if (time < RESPONSE_TIME_THRESHOLDS.GOOD) return "success";
  if (time < RESPONSE_TIME_THRESHOLDS.MODERATE) return "warning";
  return "error";
};

const calculateStats = (servers: ServerStatus[]) => {
  const online = servers.filter((s) => s.status === STATUS.ONLINE).length;
  const offline = servers.length - online;
  const avgResponseTime = servers.length
    ? servers.reduce((sum, s) => sum + (Number(s.response_time) || 0), 0) /
      servers.length
    : 0;

  return { online, offline, avgResponseTime };
};

const getLatestTimestamp = (servers: ServerStatus[]): string => {
  if (!servers.length) return "-";
  const sorted = [...servers].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted[0]?.timestamp || "-";
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// ==================== Custom Hooks ====================
const useResponsive = () => {
  const screens = Grid.useBreakpoint();
  return {
    isMobile: !screens.md,
    isTablet: screens.md && !screens.lg,
    isDesktop: screens.lg,
  };
};

const useServerStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  const serverStatusState = useAppSelector(
    (state) => state.callGetServerStatusV2
  );
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchServerStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(GET_SERVER_STATUS_V2());
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchServerStatus();
  }, [fetchServerStatus]);

  useEffect(() => {
    const response = serverStatusState?.response?.data?.data;
    setServers(response || []);
  }, [serverStatusState]);

  return { servers, isLoading, refresh: fetchServerStatus, setServers };
};

// ==================== Components ====================
const ResponseTimeTag: React.FC<{ time: number }> = ({ time }) => (
  <Tag color={getResponseTimeColor(time)} icon={<ClockCircleOutlined />}>
    {time.toFixed(3)} ms
  </Tag>
);

const ServerStatusTag: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <Tag
    color={isOnline ? "success" : "error"}
    icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
  >
    {isOnline ? "ออนไลน์" : "ออฟไลน์"}
  </Tag>
);

// Updated StatisticsCard to look more modern
const StatisticsCard: React.FC<{
  stats: ReturnType<typeof calculateStats>;
  lastChecked: string;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ stats, lastChecked, onRefresh, isLoading }) => {
  return (
    <Card
      styles={{ body: { padding: "24px" } }}
      className="shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {" "}
      {/* Added shadow and transition */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space size="large" align="center">
          <Avatar
            size={64}
            icon={<CloudOutlined />}
            style={{ backgroundColor: "#1890ff", color: "#fff" }} // Brand color bg
          />
          <Space direction="vertical" size={2}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              สถานะเซิร์ฟเวอร์
            </Typography.Title>
            <Typography.Text type="secondary">
              รายงานสถานะและความหน่วงของเซิร์ฟเวอร์ทั้งหมด
            </Typography.Text>
          </Space>
        </Space>

        <Flex gap="large" wrap="wrap">
          {" "}
          {/* Changed Space to Flex for better control */}
          <Statistic
            title="ออนไลน์"
            value={stats.online}
            valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
            prefix={<CheckCircleOutlined />}
          />
          <Divider type="vertical" style={{ height: "auto" }} />{" "}
          {/* Divider for visual separation */}
          <Statistic
            title="ออฟไลน์"
            value={stats.offline}
            valueStyle={{ color: "#ff4d4f", fontWeight: "bold" }}
            prefix={<CloseCircleOutlined />}
          />
          <Divider type="vertical" style={{ height: "auto" }} />
          <Statistic
            title="เวลาตอบสนองเฉลี่ย"
            value={stats.avgResponseTime.toFixed(3)}
            suffix="ms"
            valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
            prefix={<ClockCircleOutlined />}
          />
        </Flex>

        <Space direction="vertical" align="end" size={4}>
          <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
            อัพเดตล่าสุด
          </Typography.Text>
          <Typography.Text strong>{lastChecked}</Typography.Text>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={isLoading}
            shape="round" // Modern rounded button
          >
            รีเฟรชข้อมูล
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

// Updated ServerCard for cleaner info presentation
const ServerCard: React.FC<{
  server: ServerStatus;
  onViewDetails: () => void;
  onEdit: () => void;
}> = ({ server, onViewDetails, onEdit }) => {
  const isOnline = server.status === STATUS.ONLINE;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Badge.Ribbon
      text={!isOnline ? "Offline" : "Online"}
      color={!isOnline ? "error" : "success"}
      placement="end" // Changed placement to end
    >
      <Card
        hoverable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        styles={{ body: { height: "100%", padding: "20px" } }}
        className="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg" // Hover animation classes (Tailwind logic applied via className if available, or Antd style)
        style={{ borderRadius: "12px", border: "1px solid #f0f0f0" }} // Rounded corners
      >
        <Flex
          vertical
          justify="space-between"
          gap="middle"
          style={{ height: "100%" }}
        >
          {/* Header Section */}
          <Flex gap="middle" align="start">
            <Avatar
              size={48}
              icon={<CloudOutlined />}
              style={{
                backgroundColor: isOnline ? "#f6ffed" : "#fff1f0",
                color: isOnline ? "#52c41a" : "#ff4d4f",
              }}
            />
            <Space
              direction="vertical"
              size={0}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Typography.Title level={5} ellipsis style={{ margin: 0 }}>
                {server.server_name_th || server.server_name}
              </Typography.Title>
              <Typography.Text
                type="secondary"
                ellipsis
                style={{ fontSize: "13px" }}
              >
                {server.description || "ไม่มีรายละเอียด"}
              </Typography.Text>
            </Space>
          </Flex>

          {/* Metrics Section */}
          <Flex
            justify="space-between"
            align="center"
            style={{
              backgroundColor: "#fafafa",
              padding: "8px 12px",
              borderRadius: "8px",
            }}
          >
            <Space>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                Latency:
              </Typography.Text>
              <ResponseTimeTag time={Number(server.response_time) || 0} />
            </Space>
            {/* You could add more quick stats here if available */}
          </Flex>

          <Divider style={{ margin: "12px 0" }} />

          {/* Info Section */}
          <Space
            direction="vertical"
            size="small"
            style={{ width: "100%", fontSize: "13px" }}
          >
            <Flex justify="space-between">
              <Typography.Text type="secondary">
                <ClockCircleOutlined /> Updated:
              </Typography.Text>
              <Typography.Text>{server.timestamp}</Typography.Text>
            </Flex>

            <Flex justify="space-between">
              <Typography.Text type="secondary">
                <LinkOutlined /> URL:
              </Typography.Text>
              <Typography.Link
                href={server.url}
                target="_blank"
                rel="noreferrer"
                ellipsis
                style={{ maxWidth: "150px" }}
              >
                {server.url}
              </Typography.Link>
            </Flex>

            <Flex justify="space-between">
              <Typography.Text type="secondary">
                <CodeOutlined /> Endpoint:
              </Typography.Text>
              <Typography.Text code ellipsis style={{ maxWidth: "150px" }}>
                {server.endpoint}
              </Typography.Text>
            </Flex>
          </Space>

          {/* Action Section */}
          <Flex
            justify="end"
            gap="small"
            style={{ marginTop: "auto", paddingTop: "16px" }}
          >
            <Tooltip title="แก้ไขรายละเอียด">
              <Button size="small" icon={<EditOutlined />} onClick={onEdit} />
            </Tooltip>
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={onViewDetails}
            >
              ดูรายละเอียด
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Badge.Ribbon>
  );
};

// ... [ServerDetailsModal and EditDescriptionModal remain mostly the same,
// ensuring they use consistent spacing and maybe rounded corners for the modal content] ...

const ServerDetailsModal: React.FC<{
  server: ServerStatus | null;
  visible: boolean;
  onClose: () => void;
}> = ({ server, visible, onClose }) => {
  const { isMobile } = useResponsive(); // เรียกใช้ Hook ที่มีอยู่แล้ว

  if (!server) return null;

  const isOnline = server.status === STATUS.ONLINE;

  const handleCopy = async () => {
    const success = await copyToClipboard(JSON.stringify(server, null, 2));
    toast[success ? "success" : "error"](
      success ? "คัดลอกข้อมูลเรียบร้อย" : "คัดลอกข้อมูลล้มเหลว"
    );
  };

  return (
    <Modal
      title={
        <Space>
          <CloudOutlined />
          <span>รายละเอียดเซิร์ฟเวอร์</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95%" : 820}
      destroyOnHidden
      centered
    >
      <Card bordered={false}>
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="middle"
          style={{ marginBottom: "24px" }}
        >
          <Space align="center">
            <Avatar
              size={64}
              icon={<CloudOutlined />}
              style={{
                backgroundColor: isOnline ? "#f6ffed" : "#fff1f0",
                color: isOnline ? "#52c41a" : "#ff4d4f",
              }}
            />
            <Space direction="vertical" size={0}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {server.server_name_th || server.server_name}
              </Typography.Title>
              <Typography.Text type="secondary">
                {server.description}
              </Typography.Text>
            </Space>
          </Space>

          <Space direction="vertical" align="end" size={4}>
            <ServerStatusTag isOnline={isOnline} />
            <Space>
              <Typography.Text type="secondary">Response Time:</Typography.Text>
              <ResponseTimeTag time={Number(server.response_time) || 0} />
            </Space>
          </Space>
        </Flex>

        {/* --- แก้ไขส่วน Descriptions ตรงนี้ --- */}
        <Descriptions
          bordered
          // ปรับ column ให้เป็นค่าเดี่ยวตามขนาดหน้าจอ เพื่อให้คำนวณ span ง่ายขึ้น
          column={isMobile ? 1 : 2}
          size="middle"
        >
          <Descriptions.Item label="Server Name">
            {server.server}
          </Descriptions.Item>
          <Descriptions.Item label="Environment">
            <Tag color="blue">{server.environment}</Tag>
          </Descriptions.Item>

          {/* ปรับ span แบบ Dynamic: มือถือ=1 (เต็มจอ), Desktop=2 (เต็มจอ) */}
          <Descriptions.Item label="URL" span={isMobile ? 1 : 2}>
            <Typography.Link href={server.url} target="_blank" rel="noreferrer">
              {server.url} <LinkOutlined />
            </Typography.Link>
          </Descriptions.Item>

          <Descriptions.Item label="Endpoint" span={isMobile ? 1 : 2}>
            <Typography.Text code copyable>
              {server.endpoint}
            </Typography.Text>
          </Descriptions.Item>

          <Descriptions.Item label="Last Checked">
            {server.timestamp}
          </Descriptions.Item>
          <Descriptions.Item label="HTTP Status">
            {(server as any)?.status_code ? (
              <Tag color="green">{(server as any).status_code}</Tag>
            ) : (
              "-"
            )}
          </Descriptions.Item>

          {/* รายการสุดท้ายให้ span เต็มเพื่อความสวยงามของตาราง */}
          <Descriptions.Item label="Severity Level" span={isMobile ? 1 : 2}>
            {(server as any)?.response_time_severity_level ?? "-"}
          </Descriptions.Item>
        </Descriptions>
        {/* ------------------------------------- */}

        <Flex justify="flex-end" gap="small" style={{ marginTop: "24px" }}>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            Copy JSON
          </Button>
          <Button type="primary" onClick={onClose}>
            ปิดหน้าต่าง
          </Button>
        </Flex>
      </Card>
    </Modal>
  );
};

const EditDescriptionModal: React.FC<{
  server: ServerStatus | null;
  visible: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
}> = ({ server, visible, onClose, onSave }) => {
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (server && visible) {
      setEditValue(server.description || "");
    }
  }, [server, visible]);

  const handleSave = () => {
    onSave(editValue);
    onClose();
  };

  return (
    <Modal
      title="แก้ไขรายละเอียด"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      centered
    >
      <Flex vertical gap="middle">
        <Alert
          message="คำแนะนำ"
          description="ช่องนี้สำหรับ Developer หรือ QA ใส่บันทึกการทำงานของ Bot หรือหมายเหตุเพิ่มเติม"
          type="info"
          showIcon
        />
        <Input.TextArea
          rows={6}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="กรอกรายละเอียดที่ต้องการบันทึก..."
          showCount
          maxLength={500}
        />
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            onClick={handleSave}
            icon={<CheckCircleOutlined />}
          >
            บันทึกข้อมูล
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

// ==================== Main Component ====================
const ServerStatusPage: React.FC = () => {
  const router = useRouter();
  const { servers, isLoading, refresh, setServers } = useServerStatus();
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(
    null
  );
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const stats = useMemo(() => calculateStats(servers), [servers]);
  const lastChecked = useMemo(() => getLatestTimestamp(servers), [servers]);

  const handleViewDetails = useCallback((server: ServerStatus) => {
    setSelectedServer(server);
    setDetailsModalVisible(true);
  }, []);

  const handleEdit = useCallback((server: ServerStatus) => {
    setSelectedServer(server);
    setEditModalVisible(true);
  }, []);

  const handleSaveDescription = useCallback(
    (description: string) => {
      if (!selectedServer) return;

      setServers((prev) =>
        prev.map((s) =>
          s.server_name_th === selectedServer.server_name_th &&
          s.timestamp === selectedServer.timestamp
            ? { ...s, description }
            : s
        )
      );

      setSelectedServer((prev) => (prev ? { ...prev, description } : prev));
      toast.success("บันทึกเรียบร้อย (ข้อมูลถูกอัพเดตใน Local State)");
    },
    [selectedServer, setServers]
  );

  return (
    <DashboardLayout>
      <HeaderBar
        title="Server Status Monitor" // More professional title
        subTitle="Real-time operational status overview"
        icon={<CloudOutlined />}
        color="none"
      />
      <Divider style={{ margin: "12px 0 24px 0" }} />

      {/* Action Bar */}
      <Flex justify="end" align="center" style={{ marginBottom: "24px" }}>
        <div className="relative inline-block">
          {/* Animated Badge for 'New' */}
          <span className="absolute -top-2 -left-2 z-10 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          {/* Or use the text badge from your prompt */}
          <span className="absolute -top-3 -left-4 z-10 rounded-full bg-red-500 px-2 py-[2px] text-[10px] font-bold text-white shadow-sm ring-2 ring-white transform -rotate-6">
            NEW
          </span>

          <Button
            type="default" // Changed to default for a solid look, or dashed if preferred
            onClick={() => {
              router.push("/health-check/v2/server-status");
            }}
            icon={<ArrowRightOutlined />} // Added icon
            className="hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            ตรวจสอบมอนิเตอร์ระบบหลังบ้าน SB App
          </Button>
        </div>
      </Flex>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Statistics Section */}
        <StatisticsCard
          stats={stats}
          lastChecked={lastChecked}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* Server Grid Section */}
        <Card
          title={
            <Space>
              <CloudOutlined />
              <span>ระบบทั้งหมด ({servers.length})</span>
            </Space>
          }
          bordered={false} // Cleaner look
          className="shadow-sm"
        >
          {isLoading ? (
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                  <Card>
                    <Skeleton active avatar paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : servers.length > 0 ? (
            <Row gutter={[24, 24]}>
              {" "}
              {/* Increased gutter for breathability */}
              {servers.map((server, index) => (
                <Col
                  key={`${server.server_name_th}-${index}`}
                  xs={24}
                  sm={12}
                  lg={8}
                  xl={6}
                >
                  <ServerCard
                    server={server}
                    onViewDetails={() => handleViewDetails(server)}
                    onEdit={() => handleEdit(server)}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Typography.Text type="secondary">
                ไม่พบข้อมูลเซิร์ฟเวอร์
              </Typography.Text>
            </div>
          )}
        </Card>
      </Space>

      {/* Modals */}
      <ServerDetailsModal
        server={selectedServer}
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
      />

      <EditDescriptionModal
        server={selectedServer}
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveDescription}
      />
    </DashboardLayout>
  );
};

export default ServerStatusPage;
