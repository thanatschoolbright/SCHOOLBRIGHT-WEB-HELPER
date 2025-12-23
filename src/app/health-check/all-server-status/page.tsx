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
  Alert,
  Empty,
} from "antd";
import {
  GlobalOutlined, // ใช้แทน CloudOutlined สำหรับ URL/Web
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
  SafetyCertificateOutlined, // สำหรับ Status/Security
  DashboardOutlined, // สำหรับหน้า Dashboard หลัก
  InfoCircleOutlined,
  DatabaseOutlined, // สำหรับ Server Name
  EnvironmentOutlined, // สำหรับ Environment
  ApiOutlined, // สำหรับ Endpoint
  WarningOutlined,
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
    {isOnline ? "ทำงานปกติ" : "หยุดทำงาน"}
  </Tag>
);

const StatisticsCard: React.FC<{
  stats: ReturnType<typeof calculateStats>;
  lastChecked: string;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ stats, lastChecked, onRefresh, isLoading }) => {
  return (
    <Card
      styles={{ body: { padding: "24px" } }}
      className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl"
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space size="large" align="center">
          {/* เอาสี bg ออก ให้ Theme จัดการ หรือใช้ class Tailwind */}
          <Avatar
            size={64}
            icon={<DashboardOutlined />}
            className="bg-blue-50 text-blue-500" // Tailwind classes
          />
          <Space direction="vertical" size={2}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              ภาพรวมสถานะระบบ
            </Typography.Title>
            <Typography.Text type="secondary">
              ตรวจสอบความพร้อมใช้งานและความเร็วในการตอบสนอง
            </Typography.Text>
          </Space>
        </Space>

        <Flex gap="large" wrap="wrap">
          <Statistic
            title="ทำงานปกติ (Online)"
            value={stats.online}
            valueStyle={{ color: "#52c41a", fontWeight: "bold" }} // คงไว้เนื่องจากเป็น Semantic Color
            prefix={<CheckCircleOutlined />}
          />
          <Divider type="vertical" className="h-auto" />
          <Statistic
            title="หยุดทำงาน (Offline)"
            value={stats.offline}
            valueStyle={{ color: "#ff4d4f", fontWeight: "bold" }} // คงไว้เนื่องจากเป็น Semantic Color
            prefix={<CloseCircleOutlined />}
          />
          <Divider type="vertical" className="h-auto" />
          <Statistic
            title="เวลาตอบสนองเฉลี่ย"
            value={stats.avgResponseTime.toFixed(3)}
            suffix="ms"
            // valueStyle={{ color: "#1890ff", fontWeight: "bold" }} // ลบออกให้ใช้ default theme
            prefix={<ClockCircleOutlined />}
          />
        </Flex>

        <Space direction="vertical" align="end" size={4}>
          <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
            ข้อมูลล่าสุดเมื่อ
          </Typography.Text>
          <Typography.Text strong>{lastChecked}</Typography.Text>
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
  const isOnline = server.status === STATUS.ONLINE;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Badge.Ribbon
      text={!isOnline ? "หยุดทำงาน" : "ปกติ"}
      color={!isOnline ? "error" : "success"}
      placement="end"
    >
      <Card
        hoverable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        styles={{ body: { height: "100%", padding: "20px" } }}
        // ลบ inline style border ออก และใช้ Tailwind class แทน
        className="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg h-full rounded-xl overflow-hidden"
        bordered={false} // ใช้ shadow แทน border
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
              // ใช้ Tailwind class แทน inline style (ถ้าทำได้) หรือใช้ logic นี้สำหรับ semantic color
              className={
                isOnline
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }
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
                {server.description || "รอการระบุรายละเอียด..."}
              </Typography.Text>
            </Space>
          </Flex>

          {/* Metrics Section */}
          <Flex
            justify="space-between"
            align="center"
            className="rounded-lg px-3 py-2" // Tailwind for subtle background
          >
            <Space>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                ความเร็วตอบสนอง:
              </Typography.Text>
              <ResponseTimeTag time={Number(server.response_time) || 0} />
            </Space>
          </Flex>

          <Divider className="my-3" />

          {/* Info Section */}
          <Space
            direction="vertical"
            size="small"
            style={{ width: "100%", fontSize: "13px" }}
          >
            <Flex justify="space-between">
              <Typography.Text type="secondary">
                <ClockCircleOutlined /> ตรวจสอบเมื่อ:
              </Typography.Text>
              <Typography.Text>{server.timestamp}</Typography.Text>
            </Flex>

            <Flex justify="space-between">
              <Typography.Text type="secondary">
                <GlobalOutlined /> เว็บไซต์:
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
                <ApiOutlined /> จุดเชื่อมต่อ (Endpoint):
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
          <InfoCircleOutlined className="text-blue-500" />
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
      <Card bordered={false} className="shadow-none">
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
              className={
                isOnline
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }
            />
            <Space direction="vertical" size={0}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {server.server_name_th || server.server_name}
              </Typography.Title>
              <Typography.Text type="secondary">
                {server.description || "ไม่มีรายละเอียดเพิ่มเติม"}
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

        <Descriptions
          bordered
          column={isMobile ? 1 : 2}
          size="middle"
          styles={{
            label: {
              width: "160px",
            },
          }}
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
            <Typography.Text code copyable>
              {server.endpoint}
            </Typography.Text>
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
            {/* แสดงตามค่าที่มี หรือแสดงปกติถ้าไม่มี */}
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
          <EditOutlined className="text-blue-500" />
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
          className="rounded-lg" // Tailwind class
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
      toast.success("บันทึกข้อมูลเรียบร้อย (อัปเดตในหน้าจอแล้ว)");
    },
    [selectedServer, setServers]
  );

  return (
    <DashboardLayout>
      <HeaderBar
        title="ระบบตรวจสอบสถานะเซิร์ฟเวอร์" // ภาษาไทย
        subTitle="ภาพรวมความพร้อมใช้งานของระบบแบบเรียลไทม์" // ภาษาไทย
        icon={<SafetyCertificateOutlined />}
        color="none"
      />
      <Divider className="my-6" />

      {/* Action Bar */}
      <Flex justify="end" align="center" className="mb-6">
        <div className="relative inline-block">
          {/* Animated Badge for 'New' */}
          <span className="absolute -top-2 -left-2 z-10 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="absolute -top-3 -left-4 z-10 rounded-full bg-red-500 px-2 py-[2px] text-[10px] font-bold text-white shadow-sm ring-2 ring-white transform -rotate-6">
            ใหม่
          </span>

          <Button
            type="default"
            onClick={() => {
              router.push("/health-check/v2/server-status");
            }}
            icon={<ArrowRightOutlined />}
            className="hover:border-blue-500 hover:text-blue-500 transition-colors rounded-lg"
          >
            ไปที่หน้าตรวจสอบบอทหลังบ้าน (SB App Bot)
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
              <DatabaseOutlined className="text-blue-500" />
              <span>รายการระบบทั้งหมด ({servers.length})</span>
            </Space>
          }
          bordered={false}
          className="shadow-sm rounded-xl"
        >
          {isLoading ? (
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    bordered={false}
                    className="shadow-none border border-gray-100 rounded-xl"
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
