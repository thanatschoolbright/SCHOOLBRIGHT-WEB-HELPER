"use client";

import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import {
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DatabaseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltFilled,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  StatusModalComponent,
  StatusModalType,
} from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Grid,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
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

// ==================== Sub-Components ====================
/**
 * ResponseTimeTag: แสดงป้ายกำกับความเร็วการตอบสนองพร้อมสีตามเกณฑ์
 */
const ResponseTimeTag: React.FC<{ time: number }> = ({ time }) => (
  <Tag color={getResponseTimeColor(time)} icon={<ClockCircleOutlined />}>
    {time.toFixed(3)} ms
  </Tag>
);

/**
 * ServerStatusTag: แสดงป้ายบอกสถานะการทำงาน (Online/Offline)
 */
const ServerStatusTag: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <Tag
    color={isOnline ? "success" : "error"}
    icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
    style={{ borderRadius: 12, padding: "2px 10px" }}
  >
    {isOnline ? "ทำงานปกติ" : "หยุดทำงาน"}
  </Tag>
);

/**
 * ServerDetailsModal: หน้าต่างแสดงข้อมูลรายละเอียดเชิงลึกของเซิร์ฟเวอร์
 */
const ServerDetailsModal: React.FC<{
  server: ServerStatus | null;
  visible: boolean;
  onClose: () => void;
}> = ({ server, visible, onClose }) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  if (!server) return null;

  const isOnline = server.status === STATUS.ONLINE;

  const handleCopy = async () => {
    const success = await copyToClipboard(JSON.stringify(server, null, 2));
    if (success) {
      toast.success("คัดลอกข้อมูล JSON เรียบร้อยแล้ว");
    } else {
      toast.error("ไม่สามารถคัดลอกข้อมูลได้");
    }
  };

  return (
    <Modal
      title={
        <Space size="small">
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
      <Row gutter={[0, 24]}>
        {/* Identity & Status Section */}
        <Col span={24}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={16}>
              <Space size="large" align="center">
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
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontWeight: 600 }}
                  >
                    {server.server_name_th || server.server_name}
                  </Typography.Title>
                  <Text type="secondary">
                    {server.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Flex vertical align={isMobile ? "start" : "end"} gap={8}>
                <ServerStatusTag isOnline={isOnline} />
                <Space size={4}>
                  <Text type="secondary">Response Time:</Text>
                  <ResponseTimeTag time={Number(server.response_time) || 0} />
                </Space>
              </Flex>
            </Col>
          </Row>
        </Col>

        {/* Technical Details Section */}
        <Col span={24}>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size="middle"
            labelStyle={{ width: isMobile ? "auto" : "25%", fontWeight: 600 }}
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
              <Typography.Link
                href={server.url}
                target="_blank"
                rel="noreferrer"
              >
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
          </Descriptions>
        </Col>

        {/* Modal Footer Actions */}
        <Col span={24}>
          <Row gutter={[8, 8]} justify="end">
            <Col>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                คัดลอก JSON
              </Button>
            </Col>
            <Col>
              <Button type="primary" onClick={onClose}>
                ปิดหน้าต่าง
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
};

/**
 * EditDescriptionModal: หน้าต่างแก้ไขหมายเหตุหรือรายละเอียดเพิ่มเติม
 */
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
          message="คำแนะนำการจัดการ"
          description="บันทึกข้อความสำคัญเพื่อให้ทีมงาน (CS/QA/Dev) รับทราบสถานะพิเศษของเซิร์ฟเวอร์นี้"
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
  const [form] = Form.useForm();
  const { servers, isLoading, refresh, setServers } = useServerStatus();

  // State สำหรับจัดการ Modal ข้อมูลลึกและแก้ไข
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(
    null,
  );
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // State สำหรับ Status Modal (ตามมาตรฐานใหม่)
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: StatusModalType;
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // State สำหรับการกรองข้อมูลใน Table
  const [filters, setFilters] = useState({
    name: "",
    status: "all",
  });

  // คำนวณความเร็วตอบสนองเฉลี่ยและสถานะจากข้อมูลดิบ (ตามมาตรฐานห้ามกรองข้อมูลสรุปตาม Table)
  const stats = useMemo(() => calculateStats(servers), [servers]);
  const lastChecked = useMemo(() => getLatestTimestamp(servers), [servers]);

  // กรองข้อมูลสำหรับแสดงใน Table เท่านั้น
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const matchName = (server.server_name_th || server.server_name || "")
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchStatus =
        filters.status === "all" || server.status === filters.status;
      return matchName && matchStatus;
    });
  }, [servers, filters]);

  /**
   * * handleViewDetails: แสดงข้อมูลรายละเอียดเชิงลึกของเซิร์ฟเวอร์
   */
  const handleViewDetails = useCallback((server: ServerStatus) => {
    setSelectedServer(server);
    setDetailsModalVisible(true);
  }, []);

  /**
   * * handleEdit: เปิด Modal เพื่อแก้ไขหมายเหตุของเซิร์ฟเวอร์
   */
  const handleEdit = useCallback((server: ServerStatus) => {
    setSelectedServer(server);
    setEditModalVisible(true);
  }, []);

  /**
   * * handleSearch: ฟังก์ชันดำเนินการกรองข้อมูลเมื่อกดปุ่มค้นหา
   */
  const handleSearch = (values: any) => {
    setFilters({
      name: values.name || "",
      status: values.status || "all",
    });
    toast.success("กรองข้อมูลเซิร์ฟเวอร์เรียบร้อย");
  };

  /**
   * * handleReset: ล้างค่าการกรองข้อมูลทั้งหมด
   */
  const handleReset = () => {
    form.resetFields();
    setFilters({ name: "", status: "all" });
    toast.info("ล้างการค้นหาเรียบร้อย");
  };

  /**
   * * handleSaveDescription: บันทึกการเปลี่ยนแปลงรายละเอียด (Local Update)
   */
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

      setStatusModal({
        open: true,
        type: "success",
        title: "บันทึกสำเร็จ",
        message: "อัปเดตหมายเหตุเรียบร้อยแล้ว",
      });
    },
    [selectedServer, setServers],
  );

  /**
   * * handleRefreshData: ดึงข้อมูลล่าสุดจาก Server
   */
  const handleRefreshData = async () => {
    await refresh();
    toast.success("ดาวน์โหลดข้อมูลแสดงสถานะเซิร์ฟเวอร์สมบูรณ์");
  };

  // กำหนด Column สำหรับ Ant Design Table
  const columns = [
    {
      title: "ชื่อเซิร์ฟเวอร์ / ระบบ",
      key: "name",
      render: (_: any, record: ServerStatus) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontWeight: 600 }}>
            {record.server_name_th || record.server_name || "-"}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.endpoint || "-"}
          </Text>
        </Space>
      ),
      sorter: (a: ServerStatus, b: ServerStatus) =>
        (a.server_name_th || a.server_name || "").localeCompare(
          b.server_name_th || b.server_name || "",
        ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_: any, record: ServerStatus) => (
        <ServerStatusTag isOnline={record.status === STATUS.ONLINE} />
      ),
      sorter: (a: ServerStatus, b: ServerStatus) =>
        a.status.localeCompare(b.status),
    },
    {
      title: "ความเร็วตอบสนอง",
      dataIndex: "response_time",
      key: "response_time",
      render: (time: any) => <ResponseTimeTag time={Number(time) || 0} />,
      sorter: (a: ServerStatus, b: ServerStatus) =>
        (Number(a.response_time) || 0) - (Number(b.response_time) || 0),
    },
    {
      title: "ตรวจสอบล่าสุด",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a: ServerStatus, b: ServerStatus) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "จัดการ",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: ServerStatus) => (
        <Space>
          <Tooltip title="แก้ไขหมายเหตุ">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            ดูข้อมูลลึก
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* ส่วนที่ 1: หัวข้อหน้าเว็บ (Header Bar) */}
      <HeaderBar
        title="ระบบตรวจสอบสถานะเซิร์ฟเวอร์"
        subTitle="ภาพรวมความพร้อมใช้งานและความเร็วในการตอบสนองของระบบทั้งหมดแบบเรียลไทม์"
        icon={<SafetyCertificateOutlined />}
      />

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={8}>
            <SummaryCard
              title="ทำงานปกติ (Online)"
              value={stats.online}
              subtitle="เซิร์ฟเวอร์ที่พร้อมให้บริการ"
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              percent={stats.online > 0 ? 100 : 0}
              isLoading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <SummaryCard
              title="หยุดทำงาน (Offline)"
              value={stats.offline}
              subtitle="เซิร์ฟเวอร์ที่ขัดข้อง"
              icon={<CloseCircleOutlined />}
              color={token.colorError}
              percent={stats.offline > 0 ? 100 : 0}
              isLoading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <SummaryCard
              title="เวลาตอบสนองเฉลี่ย"
              value={stats.avgResponseTime.toFixed(2)}
              suffix="ms"
              subtitle={`อัปเดตล่าสุด: ${lastChecked}`}
              icon={<ClockCircleOutlined />}
              color={token.colorPrimary}
              isLoading={isLoading}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ตัวกรองข้อมูล (Filters) */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: "1.25rem" }}
            />
            <Typography.Title
              level={4}
              style={{ margin: 0, fontWeight: 600, fontSize: "1.25rem" }}
            >
              ตัวกรอง
            </Typography.Title>
          </Flex>

          <Form form={form} layout="vertical" onFinish={handleSearch}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="ค้นหาชื่อเซิร์ฟเวอร์ / ระบบ">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="ระบุชื่อเซิร์ฟเวอร์ที่ต้องการค้นหา..."
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="สถานะการทำงาน"
                  initialValue="all"
                >
                  <Select
                    options={[
                      { label: "ทั้งหมด", value: "all" },
                      { label: "ทำงานปกติ (Online)", value: STATUS.ONLINE },
                      { label: "หยุดทำงาน (Offline)", value: STATUS.OFFLINE },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Flex justify="end" gap="small">
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Form>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา (Content) */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          title={
            <Space>
              <UnorderedListOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
                รายการเซิร์ฟเวอร์
              </Text>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="default"
                onClick={() => router.push("/health-check/v2/server-status")}
                icon={
                  <ThunderboltFilled style={{ color: token.colorPrimary }} />
                }
              >
                บอทหลังบ้าน (SB App Bot)
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefreshData}
                loading={isLoading}
              >
                อัปเดตสถานะ
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={filteredServers}
            columns={columns}
            rowKey={(record) =>
              `${record.server}-${record.endpoint}-${record.timestamp}`
            }
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>

      {/* Modals & Components */}
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

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />
    </DashboardLayout>
  );
};

export default ServerStatusPage;
