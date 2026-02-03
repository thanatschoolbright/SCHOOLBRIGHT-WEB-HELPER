"use client";

import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import {
  ApiOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Grid,
  Input,
  Modal,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const { Title, Text, Paragraph } = Typography;

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
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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
    (state) => state.callGetServerStatusV2,
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
    style={{ borderRadius: 12, padding: "2px 10px" }}
  >
    {isOnline ? "ทำงานปกติ" : "หยุดทำงาน"}
  </Tag>
);

const StatisticsCard: React.FC<{
  stats: ReturnType<typeof calculateStats>;
  lastChecked: string;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ stats, lastChecked, onRefresh, isLoading }) => {
  const { token } = theme.useToken();

  return (
    <Card
      styles={{ body: { padding: "24px" } }}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space size="large" align="center">
          <Avatar
            size={64}
            icon={<DashboardOutlined />}
            style={{
              backgroundColor: token.colorPrimaryBg,
              color: token.colorPrimary,
            }}
          />
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ margin: 0 }}>
              ภาพรวมสถานะระบบ
            </Title>
            <Text type="secondary">
              ตรวจสอบความพร้อมใช้งานและความเร็วในการตอบสนอง
            </Text>
          </Space>
        </Space>

        <Flex gap="large" wrap="wrap">
          <Statistic
            title="ทำงานปกติ (Online)"
            value={stats.online}
            valueStyle={{ color: token.colorSuccess, fontWeight: "bold" }}
            prefix={<CheckCircleOutlined />}
          />
          <Divider type="vertical" style={{ height: "auto" }} />
          <Statistic
            title="หยุดทำงาน (Offline)"
            value={stats.offline}
            valueStyle={{ color: token.colorError, fontWeight: "bold" }}
            prefix={<CloseCircleOutlined />}
          />
          <Divider type="vertical" style={{ height: "auto" }} />
          <Statistic
            title="เวลาตอบสนองเฉลี่ย"
            value={stats.avgResponseTime.toFixed(3)}
            suffix="ms"
            prefix={<ClockCircleOutlined />}
          />
        </Flex>

        <Space direction="vertical" align="end" size={4}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            ข้อมูลล่าสุดเมื่อ
          </Text>
          <Text strong>{lastChecked}</Text>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={isLoading}
            shape="round"
          >
            อัปเดตข้อมูล
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

const ServerCard: React.FC<{
  server: ServerStatus;
  onViewDetails: () => void;
  onEdit: () => void;
}> = ({ server, onViewDetails, onEdit }) => {
  const { token } = theme.useToken();
  const isOnline = server.status === STATUS.ONLINE;

  return (
    <Badge.Ribbon
      text={!isOnline ? "หยุดทำงาน" : "ปกติ"}
      color={!isOnline ? "error" : "success"}
      placement="end"
    >
      <Card
        hoverable
        style={{
          height: "100%",
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: "hidden",
          transition: "transform 0.3s ease",
        }}
        styles={{ body: { padding: "20px", height: "100%" } }}
        className="server-card-hover"
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
              icon={<DatabaseOutlined />}
              style={{
                backgroundColor: isOnline
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
                color: isOnline ? token.colorSuccess : token.colorError,
              }}
            />
            <Space
              direction="vertical"
              size={0}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Title level={5} ellipsis style={{ margin: 0 }}>
                {server.server_name_th || server.server_name}
              </Title>
              <Text type="secondary" ellipsis style={{ fontSize: "13px" }}>
                {server.description || "รอการระบุรายละเอียด..."}
              </Text>
            </Space>
          </Flex>

          {/* Metrics Section */}
          <Flex
            justify="space-between"
            align="center"
            style={{
              backgroundColor: token.colorFillQuaternary,
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <Space>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ความเร็วตอบสนอง:
              </Text>
              <ResponseTimeTag time={Number(server.response_time) || 0} />
            </Space>
          </Flex>

          <Divider style={{ margin: "12px 0" }} />

          {/* Info Section */}
          <Space
            direction="vertical"
            size="small"
            style={{ width: "100%", fontSize: "13px" }}
          >
            <Flex justify="space-between">
              <Text type="secondary">
                <ClockCircleOutlined /> ตรวจสอบเมื่อ:
              </Text>
              <Text>{server.timestamp}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text type="secondary">
                <GlobalOutlined /> เว็บไซต์:
              </Text>
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
              <Text type="secondary">
                <ApiOutlined /> จุดเชื่อมต่อ (Endpoint):
              </Text>
              <Text code ellipsis style={{ maxWidth: "150px" }}>
                {server.endpoint}
              </Text>
            </Flex>
          </Space>

          {/* Action Section */}
          <Flex
            justify="end"
            gap="small"
            style={{ marginTop: "auto", paddingTop: "16px" }}
          >
            <Tooltip title="แก้ไขหมายเหตุ">
              <Button size="small" icon={<EditOutlined />} onClick={onEdit} />
            </Tooltip>
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={onViewDetails}
            >
              ดูข้อมูลลึก
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Badge.Ribbon>
  );
};

const ServerDetailsModal: React.FC<{
  server: ServerStatus | null;
  visible: boolean;
  onClose: () => void;
}> = ({ server, visible, onClose }) => {
  const { isMobile } = useResponsive();
  const { token } = theme.useToken();

  if (!server) return null;

  const isOnline = server.status === STATUS.ONLINE;

  const handleCopy = async () => {
    const success = await copyToClipboard(JSON.stringify(server, null, 2));
    toast[success ? "success" : "error"](
      success ? "คัดลอกข้อมูลเรียบร้อย" : "คัดลอกข้อมูลล้มเหลว",
    );
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span>ข้อมูลเชิงลึกของเซิร์ฟเวอร์</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95%" : 820}
      destroyOnHidden
      centered
    >
      <Card variant="borderless" className="shadow-none">
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
              icon={<DatabaseOutlined />}
              style={{
                backgroundColor: isOnline
                  ? token.colorSuccessBg
                  : token.colorErrorBg,
                color: isOnline ? token.colorSuccess : token.colorError,
              }}
            />
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                {server.server_name_th || server.server_name}
              </Title>
              <Text type="secondary">
                {server.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </Text>
            </Space>
          </Space>

          <Space direction="vertical" align="end" size={4}>
            <ServerStatusTag isOnline={isOnline} />
            <Space>
              <Text type="secondary">Response Time:</Text>
              <ResponseTimeTag time={Number(server.response_time) || 0} />
            </Space>
          </Space>
        </Flex>

        <Descriptions
          bordered
          column={isMobile ? 1 : 2}
          size="middle"
          labelStyle={{ width: "160px" }}
        >
          <Descriptions.Item label="ชื่อเซิร์ฟเวอร์ (System)">
            {server.server}
          </Descriptions.Item>
          <Descriptions.Item label="สภาพแวดล้อม (Env)">
            <Tag icon={<EnvironmentOutlined />} color="geekblue">
              {server.environment}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="URL เว็บไซต์" span={isMobile ? 1 : 2}>
            <Typography.Link href={server.url} target="_blank" rel="noreferrer">
              {server.url} <LinkOutlined />
            </Typography.Link>
          </Descriptions.Item>

          <Descriptions.Item label="จุดเชื่อมต่อ API" span={isMobile ? 1 : 2}>
            <Text code copyable>
              {server.endpoint}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="ตรวจสอบล่าสุด">
            {server.timestamp}
          </Descriptions.Item>
          <Descriptions.Item label="รหัสสถานะ HTTP">
            {(server as any)?.status_code ? (
              <Tag
                color={(server as any).status_code === 200 ? "green" : "red"}
              >
                {(server as any).status_code}
              </Tag>
            ) : (
              "-"
            )}
          </Descriptions.Item>

          <Descriptions.Item label="ระดับความรุนแรง" span={isMobile ? 1 : 2}>
            {(server as any)?.response_time_severity_level ? (
              <Tag color="warning">
                {(server as any).response_time_severity_level}
              </Tag>
            ) : (
              <Tag>Normal</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Flex justify="flex-end" gap="small" style={{ marginTop: "24px" }}>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            คัดลอก JSON
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
  const { token } = theme.useToken();
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
      title={
        <Space>
          <EditOutlined style={{ color: token.colorPrimary }} />
          <span>แก้ไขหมายเหตุ / รายละเอียด</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      centered
    >
      <Flex vertical gap="middle">
        <Alert
          message="คำแนะนำสำหรับทีมงาน"
          description="พื้นที่นี้สำหรับบันทึกข้อความถึงทีม CS/QA เช่น 'ปิดปรับปรุงชั่วคราว', 'เซิร์ฟเวอร์นี้สำหรับเทสเท่านั้น' เพื่อให้ทุกคนเข้าใจตรงกัน"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
        <Input.TextArea
          rows={6}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="พิมพ์รายละเอียดที่ต้องการบันทึก..."
          showCount
          maxLength={500}
          style={{ borderRadius: 8 }}
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
  const { token } = theme.useToken();
  const { servers, isLoading, refresh, setServers } = useServerStatus();
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(
    null,
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
            : s,
        ),
      );

      setSelectedServer((prev) => (prev ? { ...prev, description } : prev));
      toast.success("บันทึกข้อมูลเรียบร้อย (อัปเดตในหน้าจอแล้ว)");
    },
    [selectedServer, setServers],
  );

  return (
    <DashboardLayout>
      <style jsx global>{`
        .server-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      <HeaderBar
        title="ระบบตรวจสอบสถานะเซิร์ฟเวอร์"
        subTitle="ภาพรวมความพร้อมใช้งานของระบบแบบเรียลไทม์"
        icon={<SafetyCertificateOutlined />}
        color="none"
      />
      <Divider className="my-6" />

      {/* Action Bar */}
      <Flex justify="end" align="center" style={{ marginBottom: 24 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Animated Badge for 'New' */}
          <span
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              zIndex: 10,
              display: "flex",
              height: 12,
              width: 12,
            }}
          >
            <span
              style={{
                position: "absolute",
                display: "inline-flex",
                height: "100%",
                width: "100%",
                borderRadius: "50%",
                backgroundColor: "#ff4d4f",
                opacity: 0.75,
                animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            ></span>
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                borderRadius: "50%",
                height: 12,
                width: 12,
                backgroundColor: "#ff4d4f",
              }}
            ></span>
          </span>

          {/* New Label Tag */}
          <Tag
            color="red"
            style={{
              position: "absolute",
              top: -12,
              left: -20,
              zIndex: 20,
              transform: "rotate(-10deg)",
              fontSize: 10,
              border: "none",
              fontWeight: "bold",
            }}
          >
            ใหม่
          </Tag>

          <Button
            type="default"
            onClick={() => {
              router.push("/health-check/v2/server-status");
            }}
            icon={<ThunderboltFilled style={{ color: token.colorPrimary }} />}
            style={{ borderRadius: 8, height: 40 }}
          >
            ไปที่หน้าตรวจสอบบอทหลังบ้าน (SB App Bot) <ArrowRightOutlined />
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
              <DatabaseOutlined style={{ color: token.colorPrimary }} />
              <span>รายการระบบทั้งหมด ({servers.length})</span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          {isLoading ? (
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Skeleton active avatar paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : servers.length > 0 ? (
            <Row gutter={[24, 24]}>
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="ไม่พบข้อมูลเซิร์ฟเวอร์ในขณะนี้"
              />
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
