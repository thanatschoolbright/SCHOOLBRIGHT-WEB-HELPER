"use client";

import {
  BankOutlined,
  BellFilled,
  BellOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  EyeOutlined,
  FilterOutlined,
  LaptopOutlined,
  MobileOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
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
  Input,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, SorterResult } from "antd/es/table/interface";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
type StatusFilter = "all" | "has_offline" | "all_online";
type SortField = "offline" | "online" | "total" | "school_name";
type SortOrder = "asc" | "desc";

interface DeviceDetail {
  device_id: string;
  app_name: string;
  app_version: string;
  note: string | null;
  is_online: boolean;
  is_login: boolean;
  online_time: string | null;
  offline_reason: OfflineReason;
  notify_enabled: boolean;
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

interface FetchParams {
  search: string;
  status_filter: StatusFilter;
  sort_by: SortField;
  sort_order: SortOrder;
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
const DeviceGroupBlock = ({
  schoolId,
  appName,
  devices,
  onToggleNotify,
  togglingDeviceId,
}: {
  schoolId: number;
  appName: string;
  devices: DeviceDetail[];
  onToggleNotify: (
    schoolId: number,
    deviceId: string,
    enabled: boolean,
  ) => void;
  togglingDeviceId: string | null;
}) => {
  const onlineCount = devices.filter((d) => d.is_online).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div style={{ marginBottom: 20 }}>
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

      <Flex vertical gap={6}>
        {devices.map((device) => {
          const lastSeen = device.online_time
            ? dayjs.tz(device.online_time).fromNow()
            : null;
          const effectiveOnline = device.is_online;
          const isToggling = togglingDeviceId === device.device_id;

          return (
            <Flex
              key={`${appName}:${device.device_id}`}
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

              <Flex align="center" gap={12}>
                <Tooltip
                  title={
                    device.notify_enabled
                      ? "ปิดการแจ้งเตือน LINE สำหรับเครื่องนี้"
                      : "เปิดการแจ้งเตือน LINE สำหรับเครื่องนี้"
                  }
                >
                  <Flex align="center" gap={5}>
                    {device.notify_enabled ? (
                      <BellFilled style={{ fontSize: 12, color: "#16a34a" }} />
                    ) : (
                      <BellOutlined
                        style={{ fontSize: 12, color: "rgba(128,128,128,0.5)" }}
                      />
                    )}
                    <Switch
                      size="small"
                      checked={device.notify_enabled}
                      loading={isToggling}
                      onChange={(checked) =>
                        onToggleNotify(schoolId, device.device_id, checked)
                      }
                    />
                  </Flex>
                </Tooltip>

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
                      <Flex
                        align="center"
                        gap={3}
                        style={{ cursor: "default" }}
                      >
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
/*
 * Tab แสดงอุปกรณ์จัดกลุ่มตามโรงเรียน พร้อม Drawer ดูสถานะรายเครื่องและตั้งค่าการแจ้งเตือน
 * Filter/Sort ทำงานที่ API layer — UI ทำหน้าที่เก็บ state และส่ง query params เท่านั้น
 */
export const SchoolDeviceTab = () => {
  const [data, setData] = useState<SchoolDeviceSummaryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] =
    useState<SchoolDeviceSummaryItem | null>(null);
  const [togglingDeviceId, setTogglingDeviceId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("online");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (params: FetchParams) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: params.search,
        status_filter: params.status_filter,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      });
      const res = await callApiService.get(
        `/api/v2/hardware/school-device-summary?${query.toString()}`,
      );
      setData(res.data?.data?.items ?? []);
      setTotal(res.data?.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData({
      search: searchText,
      status_filter: statusFilter,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortBy, sortOrder]);

  // debounce search 400ms
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      void fetchData({
        search: value,
        status_filter: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
    }, 400);
  };

  const handleClearFilter = () => {
    setSearchText("");
    setStatusFilter("all");
    setSortBy("online");
    setSortOrder("desc");
    void fetchData({
      search: "",
      status_filter: "all",
      sort_by: "online",
      sort_order: "desc",
    });
  };

  // จัดการ sort จาก Table column header
  const handleTableChange = (
    _: unknown,
    __: unknown,
    sorter:
      | SorterResult<SchoolDeviceSummaryItem>
      | SorterResult<SchoolDeviceSummaryItem>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (!s || !s.columnKey || !s.order) return;

    const fieldMap: Record<string, SortField> = {
      offline: "offline",
      online: "online",
      total: "total",
      school: "school_name",
    };
    const newSortBy: SortField = fieldMap[s.columnKey as string] ?? "offline";
    const newSortOrder: SortOrder = s.order === "ascend" ? "asc" : "desc";

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // fetchData จะถูกเรียกจาก useEffect ที่ watch sortBy/sortOrder
  };

  const openDrawer = (record: SchoolDeviceSummaryItem) => {
    setSelectedSchool(record);
    setDrawerOpen(true);
  };

  // อัพเดท notify_enabled ของอุปกรณ์ใน state พร้อมส่ง API
  const handleToggleNotify = useCallback(
    async (schoolId: number, deviceId: string, enabled: boolean) => {
      setTogglingDeviceId(deviceId);

      const patchDevice = (items: SchoolDeviceSummaryItem[]) =>
        items.map((school) => {
          if (school.school_id !== schoolId) return school;
          return {
            ...school,
            devices: school.devices.map((d) =>
              d.device_id === deviceId ? { ...d, notify_enabled: enabled } : d,
            ),
          };
        });

      setData((prev) => patchDevice(prev));
      setSelectedSchool((prev) =>
        prev?.school_id === schoolId
          ? {
              ...prev,
              devices: prev.devices.map((d) =>
                d.device_id === deviceId
                  ? { ...d, notify_enabled: enabled }
                  : d,
              ),
            }
          : prev,
      );

      try {
        await callApiService.post(
          "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle",
          { school_id: schoolId, device_id: deviceId, notify_enabled: enabled },
        );
        toast.success(
          enabled
            ? `เปิดการแจ้งเตือนอุปกรณ์ ${deviceId} สำเร็จ`
            : `ปิดการแจ้งเตือนอุปกรณ์ ${deviceId} สำเร็จ`,
        );
      } catch {
        // rollback
        const rollback = (items: SchoolDeviceSummaryItem[]) =>
          items.map((school) => {
            if (school.school_id !== schoolId) return school;
            return {
              ...school,
              devices: school.devices.map((d) =>
                d.device_id === deviceId
                  ? { ...d, notify_enabled: !enabled }
                  : d,
              ),
            };
          });
        setData((prev) => rollback(prev));
        setSelectedSchool((prev) =>
          prev?.school_id === schoolId
            ? {
                ...prev,
                devices: prev.devices.map((d) =>
                  d.device_id === deviceId
                    ? { ...d, notify_enabled: !enabled }
                    : d,
                ),
              }
            : prev,
        );
        toast.error("ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองอีกครั้ง");
      } finally {
        setTogglingDeviceId(null);
      }
    },
    [],
  );

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
      sorter: true,
      sortOrder:
        sortBy === "school_name"
          ? sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,
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
      title: "ออนไลน์",
      dataIndex: "online",
      key: "online",
      align: "center",
      sorter: true,
      sortOrder:
        sortBy === "online"
          ? sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,
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
      title: "ออฟไลน์",
      dataIndex: "offline",
      key: "offline",
      align: "center",
      sorter: true,
      sortOrder:
        sortBy === "offline"
          ? sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,
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
      title: "รวม",
      dataIndex: "total",
      key: "total",
      align: "center",
      sorter: true,
      sortOrder:
        sortBy === "total"
          ? sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,
      render: (val: number) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {val} เครื่อง
        </Text>
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
          ดูสถานะ
        </Button>
      ),
    },
  ];

  const hasActiveFilter =
    searchText !== "" ||
    statusFilter !== "all" ||
    sortBy !== "online" ||
    sortOrder !== "desc";

  return (
    <>
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 16 }}>
        {/* หัว Card */}
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
            <Tag style={{ borderRadius: 8 }}>{total} โรงเรียน</Tag>
          </Flex>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() =>
              fetchData({
                search: searchText,
                status_filter: statusFilter,
                sort_by: sortBy,
                sort_order: sortOrder,
              })
            }
            style={{ borderRadius: 10 }}
          >
            รีเฟรช
          </Button>
        </Flex>

        {/* Summary Cards */}
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
                  {total}
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

        {/* Filter Section */}
        <Card
          size="small"
          style={{
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid rgba(128,128,128,0.15)",
          }}
          styles={{ body: { padding: "12px 16px" } }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
            <Text strong style={{ fontSize: 13, fontWeight: 600 }}>
              ตัวกรอง
            </Text>
          </Flex>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                ค้นหาโรงเรียน
              </Text>
              <Input
                prefix={
                  <SearchOutlined style={{ color: "rgba(128,128,128,0.5)" }} />
                }
                placeholder="ชื่อโรงเรียน หรือ School ID"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                สถานะอุปกรณ์
              </Text>
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: "100%", borderRadius: 8 }}
                options={[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "has_offline", label: "มีอุปกรณ์ออฟไลน์" },
                  { value: "all_online", label: "ออนไลน์ทุกเครื่อง" },
                ]}
              />
            </Col>
          </Row>
          <Flex justify="end" gap={8} style={{ marginTop: 12 }}>
            <Button
              disabled={!hasActiveFilter}
              onClick={handleClearFilter}
              style={{ borderRadius: 8 }}
            >
              ล้างการค้นหา
            </Button>
          </Flex>
        </Card>

        {/* Sort indicator */}
        {(sortBy !== "online" || sortOrder !== "desc") && (
          <Flex align="center" gap={6} style={{ marginBottom: 8 }}>
            {sortOrder === "asc" ? (
              <SortAscendingOutlined
                style={{ fontSize: 13, color: "var(--ant-color-primary)" }}
              />
            ) : (
              <SortDescendingOutlined
                style={{ fontSize: 13, color: "var(--ant-color-primary)" }}
              />
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              เรียงตาม:{" "}
              <Text strong style={{ fontSize: 12 }}>
                {sortBy === "school_name"
                  ? "ชื่อโรงเรียน"
                  : sortBy === "online"
                  ? "ออนไลน์"
                  : sortBy === "total"
                  ? "รวม"
                  : "ออฟไลน์"}
              </Text>{" "}
              ({sortOrder === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})
            </Text>
          </Flex>
        )}

        <Table
          rowKey="school_id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          scroll={{ x: 700 }}
          onChange={handleTableChange}
          pagination={{
            pageSize: 20,
            showTotal: (t) => `ทั้งหมด ${t} โรงเรียน`,
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
          <Flex vertical gap={4}>
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
            {/* Phase 1 Tooltip */}
            <Flex align="center" gap={6} style={{ marginTop: 2 }}>
              <BellOutlined
                style={{
                  fontSize: 11,
                  color: "var(--ant-color-text-tertiary)",
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                การแจ้งเตือน LINE (Phase 1)
              </Text>
              <Tooltip
                title="Phase 1: ระบบจะส่งการแจ้งเตือนผ่าน LINE เฉพาะในช่วงเวลา 18:00 - 06:00 น. ตามเวลาประเทศไทย และเฉพาะอุปกรณ์ที่เปิดการแจ้งเตือนไว้เท่านั้น"
                placement="bottomLeft"
              >
                <QuestionCircleOutlined
                  style={{
                    fontSize: 12,
                    color: "var(--ant-color-text-tertiary)",
                    cursor: "pointer",
                  }}
                />
              </Tooltip>
            </Flex>
          </Flex>
        }
        width={680}
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
              schoolId={selectedSchool!.school_id}
              appName={appName}
              devices={devices}
              onToggleNotify={handleToggleNotify}
              togglingDeviceId={togglingDeviceId}
            />
          ))
        )}
      </Drawer>
    </>
  );
};
