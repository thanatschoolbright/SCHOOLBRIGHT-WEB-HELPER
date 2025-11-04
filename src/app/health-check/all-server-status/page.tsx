"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
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

const StatisticsCard: React.FC<{
  stats: ReturnType<typeof calculateStats>;
  lastChecked: string;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ stats, lastChecked, onRefresh, isLoading }) => {
  const { isMobile } = useResponsive();

  return (
    <Card bordered={false}>
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space size="large" align="center">
          <Avatar size={56} icon={<CloudOutlined />} />
          <Space direction="vertical" size={0}>
            <Typography.Title level={4}>สถานะเซิร์ฟเวอร์</Typography.Title>
            <Typography.Text type="secondary">
              รายงานสถานะและความหน่วงของเซิร์ฟเวอร์ทั้งหมด
            </Typography.Text>
          </Space>
        </Space>

        <Space size="large" wrap>
          <Statistic
            title="ออนไลน์"
            value={stats.online}
            valueStyle={{ color: "#52c41a" }}
            prefix={<CheckCircleOutlined />}
          />
          <Statistic
            title="ออฟไลน์"
            value={stats.offline}
            valueStyle={{ color: "#ff4d4f" }}
            prefix={<CloseCircleOutlined />}
          />
          <Statistic
            title="เวลาตอบสนองเฉลี่ย"
            value={stats.avgResponseTime.toFixed(3)}
            suffix="ms"
            valueStyle={{ color: "#1890ff" }}
            prefix={<ClockCircleOutlined />}
          />
        </Space>

        <Space direction="vertical" align="end" size={4}>
          <Typography.Text type="secondary">อัพเดตล่าสุด</Typography.Text>
          <Typography.Text strong>{lastChecked}</Typography.Text>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={isLoading}
          >
            รีเฟรช
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
  const isOnline = server.status === STATUS.ONLINE;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Badge.Ribbon
      text={!isOnline ? "ออฟไลน์" : undefined}
      color="error"
      placement="start"
    >
      <Card
        hoverable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        styles={{ body: { height: "100%" } }}
      >
        <Flex vertical justify="space-between" gap="middle">
          <Flex justify="space-between" align="flex-start" gap="small">
            <Flex gap="middle" align="center" style={{ flex: 1, minWidth: 0 }}>
              <Avatar size={56} icon={<CloudOutlined />} />
              <Space
                direction="vertical"
                size={0}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Typography.Title level={5} ellipsis>
                  {server.server_name_th}
                </Typography.Title>
                <Typography.Text type="secondary" ellipsis>
                  {server.description}
                </Typography.Text>
              </Space>
            </Flex>

            <Space direction="vertical" align="end" size={4}>
              <ServerStatusTag isOnline={isOnline} />
              <ResponseTimeTag time={server.response_time} />
            </Space>
          </Flex>

          <Divider />

          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Typography.Text type="secondary">
              {server.timestamp}
            </Typography.Text>
            <Typography.Link
              href={server.url}
              target="_blank"
              rel="noreferrer"
              ellipsis
            >
              <LinkOutlined /> {server.url}
            </Typography.Link>
            <Typography.Text code ellipsis>
              <CodeOutlined /> {server.endpoint}
            </Typography.Text>
          </Space>

          <Flex justify="flex-end" gap="small">
            <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
              แก้ไข
            </Button>
            <Button
              size="small"
              type="primary"
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

const ServerDetailsModal: React.FC<{
  server: ServerStatus | null;
  visible: boolean;
  onClose: () => void;
}> = ({ server, visible, onClose }) => {
  const { isMobile } = useResponsive();

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
      title="รายละเอียดเซิร์ฟเวอร์"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95%" : 820}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Space align="center">
            <Avatar size={52} icon={<CloudOutlined />} />
            <Space direction="vertical" size={0}>
              <Typography.Title level={5}>
                {server.server_name_th || server.server_name}
              </Typography.Title>
              <Typography.Text type="secondary">
                {server.description}
              </Typography.Text>
            </Space>
          </Space>

          <Space direction="vertical" align="end" size={4}>
            <ServerStatusTag isOnline={isOnline} />
            <ResponseTimeTag time={Number(server.response_time) || 0} />
          </Space>
        </Flex>

        <Divider />

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Server">{server.server}</Descriptions.Item>
          <Descriptions.Item label="Environment">
            {server.environment}
          </Descriptions.Item>
          <Descriptions.Item label="URL">
            <Typography.Link href={server.url} target="_blank" rel="noreferrer">
              <LinkOutlined /> {server.url}
            </Typography.Link>
          </Descriptions.Item>
          <Descriptions.Item label="Endpoint">
            <Typography.Text code>{server.endpoint}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="เวลาตรวจสอบล่าสุด">
            {server.timestamp}
          </Descriptions.Item>
          <Descriptions.Item label="HTTP Status">
            {(server as any)?.status_code ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Severity">
            {(server as any)?.response_time_severity_level ?? "-"}
          </Descriptions.Item>
        </Descriptions>

        <Flex justify="flex-end" gap="small">
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            คัดลอก
          </Button>
          <Button type="primary" onClick={onClose}>
            ปิด
          </Button>
        </Flex>
      </Space>
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
      width={760}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          แก้ไขรายละเอียดของเซิร์ฟเวอร์ (ช่องนี้สำหรับ Developer ใส่การทำงานของ
          Bot)
        </Typography.Text>
        <Input.TextArea
          rows={8}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="กรอกรายละเอียด..."
        />
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button type="primary" onClick={handleSave}>
            บันทึก
          </Button>
        </Flex>
      </Space>
    </Modal>
  );
};

// ==================== Main Component ====================
const ServerStatusPage: React.FC = () => {
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
      toast.success("บันทึกเรียบร้อย (ยังไม่ได้ส่งไปยัง API)");
    },
    [selectedServer, setServers]
  );

  return (
    <DashboardLayout>
      <HeaderBar title="สถานะเซิร์ฟเวอร์" subTitle="ภาพรวมสถานะการออนไลน์ของทุกระบบ" icon={<CloudOutlined />} color="none" />
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <StatisticsCard
          stats={stats}
          lastChecked={lastChecked}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        <Card title="การทำงานทุกระบบ" bordered={false}>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : servers.length > 0 ? (
            <Row gutter={[16, 16]}>
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
            <Typography.Text type="secondary">ไม่มีข้อมูล</Typography.Text>
          )}
        </Card>
      </Space>

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
