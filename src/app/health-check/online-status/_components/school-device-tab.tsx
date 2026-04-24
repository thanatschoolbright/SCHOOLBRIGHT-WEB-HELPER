"use client";

import {
  BankOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  EyeOutlined,
  LaptopOutlined,
  MobileOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { callApiService } from "@services/axios-instance/sb-helper.axios";
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Flex,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useState } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

const { Text } = Typography;

// ----------------------------------------
// Types
// ----------------------------------------
type OfflineReason = "server_down" | "device_or_network" | null;

interface DeviceDetail {
  device_id: string;
  app_name: string;
  app_version: string;
  note: string | null;
  is_online: boolean;
  is_login: boolean;
  online_time: string | null;
  offline_reason: OfflineReason;
}

interface SchoolDeviceSummaryItem {
  school_id: number;
  school_name: string;
  online: number;
  offline: number;
  total: number;
  offline_reason: OfflineReason;
  devices: DeviceDetail[];
}

// ----------------------------------------
// App icon mapping ตาม app_name
// ----------------------------------------
const APP_ICONS: Record<string, React.ReactNode> = {
  "sb canteen": <CreditCardOutlined style={{ fontSize: 16 }} />,
  canteen: <CreditCardOutlined style={{ fontSize: 16 }} />,
  "facial recognition": <CameraOutlined style={{ fontSize: 16 }} />,
  facial: <CameraOutlined style={{ fontSize: 16 }} />,
  gate: <BankOutlined style={{ fontSize: 16 }} />,
  turnstile: <BankOutlined style={{ fontSize: 16 }} />,
  mobile: <MobileOutlined style={{ fontSize: 16 }} />,
  tablet: <LaptopOutlined style={{ fontSize: 16 }} />,
  server: <DatabaseOutlined style={{ fontSize: 16 }} />,
};

const getAppIcon = (appName: string): React.ReactNode => {
  const key = appName.toLowerCase().trim();
  for (const [pattern, icon] of Object.entries(APP_ICONS)) {
    if (key.includes(pattern)) return icon;
  }
  return <DesktopOutlined style={{ fontSize: 16 }} />;
};

// ----------------------------------------
// Offline Reason Badge
// ----------------------------------------
const OfflineReasonBadge = ({ reason }: { reason: OfflineReason }) => {
  if (!reason) return null;
  if (reason === "server_down") {
    return (
      <Tooltip title="เซิร์ฟเวอร์ฮาร์ดแวร์ไม่ตอบสนอง — น่าจะเกิดจากปัญหาฝั่งเซิร์ฟเวอร์">
        <Flex
          align="center"
          gap={4}
          style={{
            marginTop: 4,
            padding: "2px 6px",
            borderRadius: 6,
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
            cursor: "default",
          }}
        >
          <WarningOutlined style={{ fontSize: 10, color: "#dc2626" }} />
          <Text style={{ fontSize: 10, color: "#dc2626" }}>
            เซิร์ฟเวอร์เกิดข้อขัดข้อง
          </Text>
        </Flex>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="เซิร์ฟเวอร์ฮาร์ดแวร์ปกติ — น่าจะเกิดจากอินเทอร์เน็ตของโรงเรียน หรือตัวเครื่องเสียหาย">
      <Flex
        align="center"
        gap={4}
        style={{
          marginTop: 4,
          padding: "2px 6px",
          borderRadius: 6,
          background: "rgba(217,119,6,0.08)",
          border: "1px solid rgba(217,119,6,0.2)",
          cursor: "default",
        }}
      >
        <WarningOutlined style={{ fontSize: 10, color: "#d97706" }} />
        <Text style={{ fontSize: 10, color: "#d97706" }}>
          อินเทอร์เน็ต / ตัวเครื่องเสียหาย
        </Text>
      </Flex>
    </Tooltip>
  );
};

// ----------------------------------------
// Device Group ใน Drawer
// ----------------------------------------
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const DeviceGroupBlock = ({
  appName,
  devices,
}: {
  appName: string;
  devices: DeviceDetail[];
}) => {
  const onlineCount = devices.filter((d) => d.is_online).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* App Group Header */}
      <Flex
        align="center"
        gap={10}
        style={{
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(128,128,128,0.15)",
        }}
      >
        <span style={{ fontSize: 18 }}>{getAppIcon(appName)}</span>
        <Text strong style={{ fontSize: 14 }}>
          {appName}
        </Text>
        <Flex gap={4} style={{ marginLeft: "auto" }}>
          <Tag
            color="success"
            style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
          >
            ออนไลน์ {onlineCount}
          </Tag>
          {offlineCount > 0 && (
            <Tag
              color="error"
              style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
            >
              ออฟไลน์ {offlineCount}
            </Tag>
          )}
        </Flex>
      </Flex>

      {/* Device rows */}
      <Flex vertical gap={6}>
        {devices.map((device) => {
          const lastSeen = device.online_time
            ? dayjs.tz(device.online_time).fromNow()
            : null;
          const isRecentOnline = device.online_time
            ? Date.now() - dayjs.tz(device.online_time).valueOf() <=
              FIFTEEN_MIN_MS
            : false;
          const effectiveOnline = device.is_online || isRecentOnline;

          return (
            <Flex
              key={device.device_id}
              align="center"
              justify="space-between"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: effectiveOnline
                  ? "rgba(22,163,74,0.06)"
                  : "rgba(220,38,38,0.06)",
                border: `1px solid ${
                  effectiveOnline
                    ? "rgba(22,163,74,0.18)"
                    : "rgba(220,38,38,0.18)"
                }`,
              }}
            >
              {/* ซ้าย: ชื่อเครื่อง + ID */}
              <Flex align="center" gap={10}>
                <Badge
                  status={effectiveOnline ? "success" : "error"}
                  style={{ marginTop: 1 }}
                />
                <Flex vertical gap={1}>
                  <Text strong style={{ fontSize: 13, lineHeight: 1.3 }}>
                    {device.note?.trim() || device.device_id}
                  </Text>
                  {device.note?.trim() && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, fontFamily: "monospace" }}
                    >
                      {device.device_id}
                    </Text>
                  )}
                  {device.app_version && device.app_version !== "-" && (
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      v{device.app_version}
                    </Text>
                  )}
                  {!effectiveOnline && (
                    <OfflineReasonBadge reason={device.offline_reason} />
                  )}
                </Flex>
              </Flex>

              {/* ขวา: สถานะ + เวลา */}
              <Flex vertical align="end" gap={3}>
                <Tag
                  color={effectiveOnline ? "success" : "error"}
                  style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                >
                  {effectiveOnline ? "ออนไลน์" : "ออฟไลน์"}
                </Tag>
                {device.is_login && (
                  <Tag
                    color="processing"
                    style={{ margin: 0, fontSize: 10, borderRadius: 6 }}
                  >
                    กำลังใช้งาน
                  </Tag>
                )}
                {lastSeen && (
                  <Tooltip
                    title={dayjs
                      .tz(device.online_time)
                      .format("DD/MM/YYYY HH:mm:ss")}
                  >
                    <Flex align="center" gap={3} style={{ cursor: "default" }}>
                      <ClockCircleOutlined
                        style={{
                          fontSize: 10,
                          color: "var(--ant-color-text-quaternary)",
                        }}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, whiteSpace: "nowrap" }}
                      >
                        {lastSeen}
                      </Text>
                    </Flex>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </div>
  );
};

// ----------------------------------------
// Main Component
// ----------------------------------------
/**
 * Tab แสดงอุปกรณ์จัดกลุ่มตามโรงเรียน พร้อม Drawer ดูสถานะรายเครื่อง
 */
export const SchoolDeviceTab = () => {
  const [data, setData] = useState<SchoolDeviceSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] =
    useState<SchoolDeviceSummaryItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callApiService.get(
        "/api/v2/hardware/school-device-summary",
      );
      setData(res.data?.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openDrawer = (record: SchoolDeviceSummaryItem) => {
    setSelectedSchool(record);
    setDrawerOpen(true);
  };

  // จัดกลุ่มเครื่องใน Drawer ตาม app_name
  const deviceGroups = selectedSchool
    ? Array.from(
        selectedSchool.devices.reduce((map, device) => {
          const key = device.app_name;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(device);
          return map;
        }, new Map<string, DeviceDetail[]>()),
      )
    : [];

  const columns: ColumnsType<SchoolDeviceSummaryItem> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 70,
      align: "center",
      render: (_: unknown, __: unknown, idx: number) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {idx + 1}
        </Text>
      ),
    },
    {
      title: "โรงเรียน",
      key: "school",
      sorter: (a, b) => a.school_name.localeCompare(b.school_name),
      render: (_: unknown, record: SchoolDeviceSummaryItem) => (
        <Flex vertical gap={2}>
          <Text strong style={{ fontSize: 13 }}>
            {record.school_name}
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: 11, fontFamily: "monospace" }}
          >
            ID: {record.school_id}
          </Text>
        </Flex>
      ),
    },
    {
      title: "อุปกรณ์ออนไลน์",
      dataIndex: "online",
      key: "online",
      align: "center",
      sorter: (a, b) => a.online - b.online,
      render: (val: number, record: SchoolDeviceSummaryItem) => (
        <Flex align="center" justify="center" gap={6}>
          <WifiOutlined style={{ color: "#16a34a", fontSize: 13 }} />
          <Tag
            color="success"
            style={{ margin: 0, fontWeight: 600, borderRadius: 8 }}
          >
            {val} เครื่อง
          </Tag>
          {record.total > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ({Math.round((val / record.total) * 100)}%)
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "อุปกรณ์ออฟไลน์",
      dataIndex: "offline",
      key: "offline",
      align: "center",
      sorter: (a, b) => a.offline - b.offline,
      defaultSortOrder: "descend",
      render: (val: number) => (
        <Flex align="center" justify="center" gap={6}>
          <Tag
            color={val > 0 ? (val >= 5 ? "error" : "warning") : "success"}
            style={{ margin: 0, fontWeight: 600, borderRadius: 8 }}
          >
            {val} เครื่อง
          </Tag>
        </Flex>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 140,
      render: (_: unknown, record: SchoolDeviceSummaryItem) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(record)}
          style={{ borderRadius: 8, height: 32 }}
        >
          ดูสถานะอุปกรณ์
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 16 }}>
        <Flex
          align="center"
          justify="space-between"
          style={{ marginBottom: 16 }}
        >
          <Flex align="center" gap={10}>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Text strong style={{ fontSize: 14 }}>
              อุปกรณ์ตามรายชื่อโรงเรียน
            </Text>
            <Tag style={{ borderRadius: 8 }}>{data.length} โรงเรียน</Tag>
          </Flex>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchData}
            style={{ borderRadius: 10 }}
          >
            รีเฟรช
          </Button>
        </Flex>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              style={{ borderRadius: 10, textAlign: "center" }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                โรงเรียนทั้งหมด
              </Text>
              <div>
                <Text strong style={{ fontSize: 22 }}>
                  {data.length}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  แห่ง
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              style={{ borderRadius: 10, textAlign: "center" }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                มีอุปกรณ์ออฟไลน์
              </Text>
              <div>
                <Text strong style={{ fontSize: 22, color: "#dc2626" }}>
                  {data.filter((s) => s.offline > 0).length}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  แห่ง
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              style={{ borderRadius: 10, textAlign: "center" }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                ออนไลน์ทั้งหมด
              </Text>
              <div>
                <Text strong style={{ fontSize: 22, color: "#16a34a" }}>
                  {data.reduce((s, r) => s + r.online, 0)}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  เครื่อง
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              style={{ borderRadius: 10, textAlign: "center" }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                ออฟไลน์ทั้งหมด
              </Text>
              <div>
                <Text strong style={{ fontSize: 22, color: "#d97706" }}>
                  {data.reduce((s, r) => s + r.offline, 0)}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  เครื่อง
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Table
          rowKey="school_id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `ทั้งหมด ${total} โรงเรียน`,
            showSizeChanger: false,
          }}
          locale={{ emptyText: "ไม่พบข้อมูลโรงเรียน" }}
          rowClassName={(record) =>
            record.offline > 0 ? "row-has-offline" : ""
          }
        />
      </Card>

      {/* Drawer รายละเอียดอุปกรณ์ */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSchool(null);
        }}
        title={
          <Flex vertical gap={2}>
            <Flex align="center" gap={8}>
              <BankOutlined />
              <Text strong style={{ fontSize: 15 }}>
                {selectedSchool?.school_name}
              </Text>
            </Flex>
            <Space size={6}>
              <Tag
                color="success"
                style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
              >
                ออนไลน์ {selectedSchool?.online} เครื่อง
              </Tag>
              {(selectedSchool?.offline ?? 0) > 0 && (
                <Tag
                  color="error"
                  style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                >
                  ออฟไลน์ {selectedSchool?.offline} เครื่อง
                </Tag>
              )}
              <Tag style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>
                รวม {selectedSchool?.total} เครื่อง
              </Tag>
            </Space>
          </Flex>
        }
        width={480}
        styles={{ body: { padding: "20px 20px" } }}
      >
        {deviceGroups.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            style={{ height: 200 }}
            vertical
            gap={8}
          >
            <DesktopOutlined style={{ fontSize: 32, opacity: 0.3 }} />
            <Text type="secondary">ไม่พบข้อมูลอุปกรณ์</Text>
          </Flex>
        ) : (
          deviceGroups.map(([appName, devices]) => (
            <DeviceGroupBlock
              key={appName}
              appName={appName}
              devices={devices}
            />
          ))
        )}
      </Drawer>
    </>
  );
};
