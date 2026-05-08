"use client";

import {
  BankOutlined,
  BellFilled,
  BellOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  LaptopOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  MobileOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
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
  Collapse,
  Divider,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
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
  notify_round: 1 | 2 | null;
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

interface NotifyTimeWindow {
  id: number;
  round: number;
  label: string;
  start_hour: number;
  start_min: number;
  end_hour: number;
  end_min: number;
  is_active: boolean;
}

interface NotifyInterval {
  id: number;
  round: number;
  label: string;
  interval_minutes: number;
  is_active: boolean;
}

interface NotifyConfig {
  time_windows: NotifyTimeWindow[];
  intervals: NotifyInterval[];
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

// Tag แสดงรอบการแจ้งเตือนของเครื่องที่ Offline — ค่ามาจาก API เท่านั้น
const NotifyRoundTag = ({
  notifyRound,
  notifyEnabled,
}: {
  notifyRound: 1 | 2 | null;
  notifyEnabled: boolean;
}) => {
  if (notifyRound === null) {
    return (
      <Tag style={{ margin: 0, fontSize: 10, borderRadius: 6, marginTop: 4 }}>
        ยังไม่ถึงเกณฑ์
      </Tag>
    );
  }
  if (!notifyEnabled) {
    return (
      <Tooltip
        title={`Offline อยู่ในครั้งที่ ${notifyRound} แต่ปิดการแจ้งเตือนไว้`}
      >
        <Tag
          style={{
            margin: 0,
            fontSize: 10,
            borderRadius: 6,
            marginTop: 4,
            opacity: 0.5,
          }}
        >
          ครั้งที่ {notifyRound}
        </Tag>
      </Tooltip>
    );
  }
  return (
    <Tag
      color={notifyRound === 1 ? "warning" : "error"}
      style={{ margin: 0, fontSize: 10, borderRadius: 6, marginTop: 4 }}
    >
      {notifyRound === 1 ? "ครั้งที่ 1" : "ครั้งที่ 2"}
    </Tag>
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
  onUpdateNote,
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
  onUpdateNote: (
    schoolId: number,
    deviceId: string,
    note: string | null,
  ) => Promise<void>;
}) => {
  // state inline edit ต่อ device_id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleStartEdit = (device: DeviceDetail) => {
    setEditingId(device.device_id);
    setEditValue(device.note?.trim() ?? "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveNote = async (deviceId: string) => {
    setSavingId(deviceId);
    try {
      await onUpdateNote(schoolId, deviceId, editValue.trim() || null);
      setEditingId(null);
      setEditValue("");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <Flex vertical gap={6}>
        {devices.map((device) => {
          const lastSeen = device.online_time
            ? dayjs.tz(device.online_time).fromNow()
            : null;
          const effectiveOnline = device.is_online;
          const isToggling = togglingDeviceId === device.device_id;
          const isEditing = editingId === device.device_id;
          const isSaving = savingId === device.device_id;

          return (
            <Flex
              key={`${appName}:${device.device_id}`}
              vertical
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
              {/* แถวหลัก */}
              <Flex align="center">
                <Flex align="center" gap={10} flex={1} style={{ minWidth: 0 }}>
                  <Badge
                    status={effectiveOnline ? "success" : "error"}
                    style={{ marginTop: 1, flexShrink: 0 }}
                  />
                  <Flex vertical gap={1} style={{ minWidth: 0 }}>
                    <Flex align="center" gap={6}>
                      <Text strong style={{ fontSize: 13, lineHeight: 1.3 }}>
                        {device.note?.trim() || device.device_id}
                      </Text>
                      <Tooltip title="แก้ไขชื่อเล่นเครื่อง">
                        <EditOutlined
                          style={{
                            fontSize: 12,
                            color: "var(--ant-color-text-quaternary)",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                          onClick={() => handleStartEdit(device)}
                        />
                      </Tooltip>
                    </Flex>
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
                      <>
                        <OfflineReasonBadge reason={device.offline_reason} />
                        <NotifyRoundTag
                          notifyRound={device.notify_round}
                          notifyEnabled={device.notify_enabled}
                        />
                      </>
                    )}
                  </Flex>
                </Flex>

                {/* Toggle notification */}
                <Flex justify="center" style={{ width: 120, flexShrink: 0 }}>
                  <Tooltip
                    title={
                      device.notify_enabled
                        ? "ปิดการแจ้งเตือน LINE สำหรับเครื่องนี้"
                        : "เปิดการแจ้งเตือน LINE สำหรับเครื่องนี้"
                    }
                  >
                    <Flex align="center" gap={8}>
                      {device.notify_enabled ? (
                        <BellFilled
                          style={{ fontSize: 14, color: "#16a34a" }}
                        />
                      ) : (
                        <BellOutlined
                          style={{
                            fontSize: 14,
                            color: "rgba(128,128,128,0.5)",
                          }}
                        />
                      )}
                      <Switch
                        checked={device.notify_enabled}
                        loading={isToggling}
                        onChange={(checked) =>
                          onToggleNotify(schoolId, device.device_id, checked)
                        }
                      />
                    </Flex>
                  </Tooltip>
                </Flex>

                {/* สถานะและเวลา */}
                <Flex
                  vertical
                  align="end"
                  gap={3}
                  style={{ width: 100, flexShrink: 0 }}
                >
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

              {/* แถว inline edit ชื่อเล่น — แสดงเมื่อกดแก้ไขเท่านั้น */}
              {isEditing && (
                <Flex
                  align="center"
                  gap={8}
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(128,128,128,0.12)",
                  }}
                >
                  <EditOutlined
                    style={{
                      fontSize: 13,
                      color: "var(--ant-color-primary)",
                      flexShrink: 0,
                    }}
                  />
                  <Input
                    size="small"
                    placeholder="เช่น เครื่องสแกนหน้า หน้าโรงเรียน เครื่องที่ 1"
                    value={editValue}
                    maxLength={200}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onPressEnter={() => handleSaveNote(device.device_id)}
                    style={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Tooltip title="บันทึก">
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      loading={isSaving}
                      onClick={() => handleSaveNote(device.device_id)}
                      style={{ borderRadius: 8, flexShrink: 0 }}
                    />
                  </Tooltip>
                  <Tooltip title="ยกเลิก">
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      style={{ borderRadius: 8, flexShrink: 0 }}
                    />
                  </Tooltip>
                </Flex>
              )}
            </Flex>
          );
        })}
      </Flex>
    </div>
  );
};

// ----------------------------------------
// Batch Progress Types
// ----------------------------------------
type BatchRowStatus = "waiting" | "processing" | "success" | "error";

interface BatchProgressRow {
  device_id: string;
  label: string;
  status: BatchRowStatus;
  error?: string;
}

// ----------------------------------------
// BatchProgressModal — แสดง delivery tracking ทีละ row
// ----------------------------------------
const STEP_LABELS = ["รอดำเนินการ", "กำลังบันทึก", "เสร็จสิ้น"];

const BatchProgressModal = ({
  open,
  targetEnabled,
  rows,
  onClose,
}: {
  open: boolean;
  targetEnabled: boolean;
  rows: BatchProgressRow[];
  onClose: () => void;
}) => {
  const doneCount = rows.filter(
    (r) => r.status === "success" || r.status === "error",
  ).length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const processingCount = rows.filter((r) => r.status === "processing").length;
  const isAllDone = rows.length > 0 && doneCount === rows.length;
  const percent =
    rows.length > 0 ? Math.round((doneCount / rows.length) * 100) : 0;

  const statusIcon = (status: BatchRowStatus) => {
    if (status === "waiting")
      return (
        <MinusCircleOutlined
          style={{ fontSize: 16, color: "rgba(128,128,128,0.4)" }}
        />
      );
    if (status === "processing")
      return (
        <LoadingOutlined
          style={{ fontSize: 16, color: "var(--ant-color-primary)" }}
        />
      );
    if (status === "success")
      return <CheckCircleFilled style={{ fontSize: 16, color: "#16a34a" }} />;
    return <CloseCircleFilled style={{ fontSize: 16, color: "#dc2626" }} />;
  };

  const stepIndex = (status: BatchRowStatus) => {
    if (status === "waiting") return 0;
    if (status === "processing") return 1;
    return 2;
  };

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          {targetEnabled ? (
            <BellFilled style={{ color: "#16a34a" }} />
          ) : (
            <BellOutlined style={{ color: "rgba(128,128,128,0.5)" }} />
          )}
          <Text strong style={{ fontSize: 15 }}>
            {targetEnabled
              ? "เปิดการแจ้งเตือนทั้งหมด"
              : "ปิดการแจ้งเตือนทั้งหมด"}
          </Text>
        </Flex>
      }
      footer={
        isAllDone ? (
          <Flex justify="space-between" align="center">
            <Text type="secondary" style={{ fontSize: 12 }}>
              สำเร็จ {successCount} รายการ
              {errorCount > 0 && (
                <Text style={{ color: "#dc2626", marginLeft: 8 }}>
                  ล้มเหลว {errorCount} รายการ
                </Text>
              )}
            </Text>
            <Button
              type="primary"
              onClick={onClose}
              style={{ borderRadius: 8 }}
            >
              ปิด
            </Button>
          </Flex>
        ) : null
      }
      closable={isAllDone}
      onCancel={isAllDone ? onClose : undefined}
      maskClosable={false}
      width={620}
      style={{ top: 60 }}
    >
      {/* Progress bar รวม */}
      <div style={{ marginBottom: 16 }}>
        <Flex justify="space-between" style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 12 }}>
            {isAllDone
              ? "ดำเนินการครบทุกรายการแล้ว"
              : processingCount > 0
              ? `กำลังดำเนินการ...`
              : "เตรียมพร้อม"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {doneCount}/{rows.length} รายการ
          </Text>
        </Flex>
        <Progress
          percent={percent}
          status={
            isAllDone ? (errorCount > 0 ? "exception" : "success") : "active"
          }
          strokeColor={
            isAllDone
              ? errorCount > 0
                ? "#dc2626"
                : "#16a34a"
              : "var(--ant-color-primary)"
          }
          size="small"
        />
      </div>

      {/* รายการ row แบบ delivery tracking */}
      <div
        style={{
          maxHeight: 420,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {rows.map((row) => {
          const currentStep = stepIndex(row.status);
          return (
            <div
              key={row.device_id}
              style={{
                borderRadius: 10,
                border: `1px solid ${
                  row.status === "success"
                    ? "rgba(22,163,74,0.25)"
                    : row.status === "error"
                    ? "rgba(220,38,38,0.25)"
                    : row.status === "processing"
                    ? "rgba(22,119,255,0.25)"
                    : "rgba(128,128,128,0.15)"
                }`,
                background:
                  row.status === "success"
                    ? "rgba(22,163,74,0.04)"
                    : row.status === "error"
                    ? "rgba(220,38,38,0.04)"
                    : row.status === "processing"
                    ? "rgba(22,119,255,0.04)"
                    : "transparent",
                padding: "10px 14px",
                transition: "all 0.2s",
              }}
            >
              {/* Row header: icon + ชื่อ */}
              <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                {statusIcon(row.status)}
                <Flex vertical gap={1} flex={1}>
                  <Text strong style={{ fontSize: 13 }}>
                    {row.label}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, fontFamily: "monospace" }}
                  >
                    {row.device_id}
                  </Text>
                </Flex>
                {row.status === "error" && row.error && (
                  <Tooltip title={row.error}>
                    <Text style={{ fontSize: 11, color: "#dc2626" }}>
                      ล้มเหลว
                    </Text>
                  </Tooltip>
                )}
              </Flex>

              {/* Step track: รอ → กำลังบันทึก → เสร็จสิ้น */}
              <Flex align="center" gap={0}>
                {STEP_LABELS.map((label, idx) => {
                  const isPast = currentStep > idx;
                  const isCurrent = currentStep === idx;
                  const isError = row.status === "error" && idx === 2;
                  const dotColor = isError
                    ? "#dc2626"
                    : isPast || isCurrent
                    ? "#16a34a"
                    : "rgba(128,128,128,0.25)";
                  const lineColor = isPast
                    ? "#16a34a"
                    : "rgba(128,128,128,0.2)";
                  return (
                    <Flex
                      key={label}
                      align="center"
                      flex={idx < 2 ? 1 : undefined}
                    >
                      {/* Dot */}
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${dotColor}`,
                          background:
                            isPast || (isCurrent && row.status !== "waiting")
                              ? dotColor
                              : "transparent",
                          flexShrink: 0,
                          transition: "all 0.25s",
                        }}
                      >
                        {isCurrent && row.status === "processing" && (
                          <LoadingOutlined
                            style={{ fontSize: 9, color: "#fff" }}
                          />
                        )}
                        {isPast && !isError && (
                          <CheckCircleFilled
                            style={{ fontSize: 10, color: "#fff" }}
                          />
                        )}
                        {isError && (
                          <CloseCircleFilled
                            style={{ fontSize: 10, color: "#fff" }}
                          />
                        )}
                      </Flex>
                      {/* Label */}
                      <Text
                        style={{
                          fontSize: 10,
                          color: isCurrent
                            ? isError
                              ? "#dc2626"
                              : "var(--ant-color-primary)"
                            : isPast
                            ? "#16a34a"
                            : "rgba(128,128,128,0.5)",
                          marginLeft: 4,
                          whiteSpace: "nowrap",
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {label}
                      </Text>
                      {/* Line connector */}
                      {idx < 2 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: lineColor,
                            margin: "0 6px",
                            borderRadius: 1,
                            transition: "background 0.3s",
                          }}
                        />
                      )}
                    </Flex>
                  );
                })}
              </Flex>
            </div>
          );
        })}
      </div>
    </Modal>
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

  // Batch toggle state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchTargetEnabled, setBatchTargetEnabled] = useState(false);
  const [batchRows, setBatchRows] = useState<BatchProgressRow[]>([]);

  // การตั้งค่าช่วงเวลาและช่วงห่างการแจ้งเตือน (โหลดจาก DB)
  const [notifyConfig, setNotifyConfig] = useState<NotifyConfig | null>(null);
  const [notifyConfigLoading, setNotifyConfigLoading] = useState(false);
  const [savingWindowId, setSavingWindowId] = useState<number | null>(null);
  const [savingIntervalId, setSavingIntervalId] = useState<number | null>(null);
  // draft edits — keyed by row id
  const [windowDrafts, setWindowDrafts] = useState<
    Record<number, Partial<NotifyTimeWindow>>
  >({});
  const [intervalDrafts, setIntervalDrafts] = useState<
    Record<number, Partial<NotifyInterval>>
  >({});
  const [helpModalOpen, setHelpModalOpen] = useState(false);

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

  // โหลดการตั้งค่าช่วงเวลาและช่วงห่างการแจ้งเตือนของโรงเรียนจาก DB
  const fetchNotifyConfig = useCallback(async (schoolId: number) => {
    setNotifyConfigLoading(true);
    try {
      const res = await callApiService.get(
        `/api/v2/hardware/device-notify-config?school_id=${schoolId}`,
      );
      setNotifyConfig(res.data?.data ?? null);
      setWindowDrafts({});
      setIntervalDrafts({});
    } catch {
      toast.error("ไม่สามารถโหลดการตั้งค่าการแจ้งเตือนได้");
    } finally {
      setNotifyConfigLoading(false);
    }
  }, []);

  // บันทึกการแก้ไขช่วงเวลาแจ้งเตือน
  const handleSaveTimeWindow = useCallback(
    async (windowId: number, schoolId: number) => {
      const draft = windowDrafts[windowId];
      if (!draft || Object.keys(draft).length === 0) return;
      setSavingWindowId(windowId);
      try {
        await callApiService.patch(
          `/api/v2/hardware/device-notify-config/time-windows/${windowId}?school_id=${schoolId}`,
          draft,
        );
        setNotifyConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            time_windows: prev.time_windows.map((w) =>
              w.id === windowId ? { ...w, ...draft } : w,
            ),
          };
        });
        setWindowDrafts((prev) => {
          const next = { ...prev };
          delete next[windowId];
          return next;
        });
        toast.success("บันทึกช่วงเวลาแจ้งเตือนสำเร็จ");
      } catch {
        toast.error("ไม่สามารถบันทึกช่วงเวลาแจ้งเตือนได้");
      } finally {
        setSavingWindowId(null);
      }
    },
    [windowDrafts],
  );

  // ลบรอบการแจ้งเตือน
  const handleDeleteTimeWindow = useCallback(
    async (windowId: number, schoolId: number) => {
      try {
        await callApiService.delete(
          `/api/v2/hardware/device-notify-config/time-windows/${windowId}?school_id=${schoolId}`,
        );
        setNotifyConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            time_windows: prev.time_windows
              .filter((w) => w.id !== windowId)
              .map((w, i) => ({ ...w, round: i + 1 })),
          };
        });
        toast.success("ลบรอบการแจ้งเตือนสำเร็จ");
      } catch {
        toast.error("ไม่สามารถลบรอบการแจ้งเตือนได้");
      }
    },
    [],
  );

  // เพิ่มรอบการแจ้งเตือนใหม่
  const handleAddTimeWindow = useCallback(
    async (schoolId: number) => {
      try {
        const res = await callApiService.post(
          `/api/v2/hardware/device-notify-config?school_id=${schoolId}`,
          {
            label: `รอบที่ ${(notifyConfig?.time_windows.length ?? 0) + 1}`,
            start_hour: 7,
            start_min: 0,
            end_hour: 9,
            end_min: 0,
          },
        );
        const created = res.data?.data;
        if (created) {
          setNotifyConfig((prev) => {
            if (!prev) return prev;
            return { ...prev, time_windows: [...prev.time_windows, created] };
          });
        }
        toast.success("เพิ่มรอบการแจ้งเตือนสำเร็จ");
      } catch {
        toast.error("ไม่สามารถเพิ่มรอบการแจ้งเตือนได้ (สูงสุด 3 รอบ)");
      }
    },
    [notifyConfig?.time_windows.length],
  );

  // บันทึกการแก้ไขช่วงห่างการแจ้งเตือน
  const handleSaveInterval = useCallback(
    async (intervalId: number, schoolId: number) => {
      const draft = intervalDrafts[intervalId];
      if (!draft || Object.keys(draft).length === 0) return;
      setSavingIntervalId(intervalId);
      try {
        await callApiService.patch(
          `/api/v2/hardware/device-notify-config/intervals/${intervalId}?school_id=${schoolId}`,
          draft,
        );
        setNotifyConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            intervals: prev.intervals.map((v) =>
              v.id === intervalId ? { ...v, ...draft } : v,
            ),
          };
        });
        setIntervalDrafts((prev) => {
          const next = { ...prev };
          delete next[intervalId];
          return next;
        });
        toast.success("บันทึกช่วงห่างการแจ้งเตือนสำเร็จ");
      } catch {
        toast.error("ไม่สามารถบันทึกช่วงห่างการแจ้งเตือนได้");
      } finally {
        setSavingIntervalId(null);
      }
    },
    [intervalDrafts],
  );

  const openDrawer = (record: SchoolDeviceSummaryItem) => {
    setSelectedSchool(record);
    setDrawerOpen(true);
    void fetchNotifyConfig(record.school_id);
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

  // เปิด/ปิดการแจ้งเตือนทุกเครื่องในโรงเรียนพร้อมกัน ทีละ 1 เครื่องแบบ sequential tracking
  const handleBatchToggle = useCallback(
    async (schoolId: number, devices: DeviceDetail[], enabled: boolean) => {
      const initialRows: BatchProgressRow[] = devices.map((d) => ({
        device_id: d.device_id,
        label: d.note?.trim() || d.device_id,
        status: "waiting",
      }));
      setBatchRows(initialRows);
      setBatchTargetEnabled(enabled);
      setBatchModalOpen(true);

      const updatedRows = [...initialRows];

      for (let i = 0; i < devices.length; i++) {
        const device = devices[i]!;
        const currentRow = updatedRows[i]!;

        updatedRows[i] = { ...currentRow, status: "processing" };
        setBatchRows([...updatedRows]);

        try {
          await callApiService.post(
            "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle",
            {
              school_id: schoolId,
              device_id: device.device_id,
              notify_enabled: enabled,
            },
          );
          updatedRows[i] = { ...updatedRows[i]!, status: "success" };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "ไม่สามารถบันทึกได้";
          updatedRows[i] = {
            ...updatedRows[i]!,
            status: "error",
            error: msg,
          };
        }

        setBatchRows([...updatedRows]);
      }

      // อัพเดท state ทั้งหมดหลัง loop จบ (เฉพาะ success)
      const successIds = new Set(
        updatedRows
          .filter((r) => r.status === "success")
          .map((r) => r.device_id),
      );

      const patchDevices = (items: SchoolDeviceSummaryItem[]) =>
        items.map((school) => {
          if (school.school_id !== schoolId) return school;
          return {
            ...school,
            devices: school.devices.map((d) =>
              successIds.has(d.device_id)
                ? { ...d, notify_enabled: enabled }
                : d,
            ),
          };
        });

      setData((prev) => patchDevices(prev));
      setSelectedSchool((prev) =>
        prev?.school_id === schoolId
          ? {
              ...prev,
              devices: prev.devices.map((d) =>
                successIds.has(d.device_id)
                  ? { ...d, notify_enabled: enabled }
                  : d,
              ),
            }
          : prev,
      );

      const errorCount = updatedRows.filter((r) => r.status === "error").length;
      if (errorCount === 0) {
        toast.success(
          enabled
            ? "เปิดการแจ้งเตือนทุกเครื่องสำเร็จ"
            : "ปิดการแจ้งเตือนทุกเครื่องสำเร็จ",
        );
      } else {
        toast.error(`ล้มเหลว ${errorCount} รายการ — ตรวจสอบใน Modal`);
      }
    },
    [],
  );

  // อัพเดทชื่อเล่น (Note) ของอุปกรณ์ใน state และส่ง API
  const handleUpdateNote = useCallback(
    async (schoolId: number, deviceId: string, note: string | null) => {
      await callApiService.patch("/api/v2/hardware/school-device/note", {
        school_id: schoolId,
        device_id: deviceId,
        note,
      });

      const patch = (items: SchoolDeviceSummaryItem[]) =>
        items.map((school) => {
          if (school.school_id !== schoolId) return school;
          return {
            ...school,
            devices: school.devices.map((d) =>
              d.device_id === deviceId ? { ...d, note } : d,
            ),
          };
        });

      setData((prev) => patch(prev));
      setSelectedSchool((prev) =>
        prev?.school_id === schoolId
          ? {
              ...prev,
              devices: prev.devices.map((d) =>
                d.device_id === deviceId ? { ...d, note } : d,
              ),
            }
          : prev,
      );
      toast.success(
        note ? `บันทึกชื่อเล่น "${note}" สำเร็จ` : "ลบชื่อเล่นสำเร็จ",
      );
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
          <Flex gap={8}>
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setHelpModalOpen(true)}
              style={{ borderRadius: 10 }}
            >
              วิธีใช้งาน
            </Button>
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
            {/* การแจ้งเตือน LINE + ปุ่ม Batch */}
            <Flex align="center" gap={8} style={{ marginTop: 4 }}>
              <BellOutlined
                style={{
                  fontSize: 11,
                  color: "var(--ant-color-text-tertiary)",
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                การแจ้งเตือน LINE
              </Text>
              <Tooltip
                title={
                  notifyConfig && notifyConfig.time_windows.length > 0
                    ? `ส่งแจ้งเตือนในช่วงเวลา: ${notifyConfig.time_windows
                        .filter((w) => w.is_active)
                        .map(
                          (w) =>
                            `${String(w.start_hour).padStart(2, "0")}:${String(
                              w.start_min,
                            ).padStart(2, "0")}–${String(w.end_hour).padStart(
                              2,
                              "0",
                            )}:${String(w.end_min).padStart(2, "0")} น. (${
                              w.label
                            })`,
                        )
                        .join(
                          ", ",
                        )} — เฉพาะอุปกรณ์ที่เปิดการแจ้งเตือนไว้เท่านั้น`
                    : "กำลังโหลดการตั้งค่าช่วงเวลาการแจ้งเตือน..."
                }
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
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <Button
                  size="small"
                  icon={<BellFilled />}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#16a34a",
                    borderColor: "#16a34a",
                  }}
                  onClick={() =>
                    selectedSchool &&
                    handleBatchToggle(
                      selectedSchool.school_id,
                      selectedSchool.devices,
                      true,
                    )
                  }
                >
                  เปิดทั้งหมด
                </Button>
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  style={{ borderRadius: 8, fontSize: 12 }}
                  onClick={() =>
                    selectedSchool &&
                    handleBatchToggle(
                      selectedSchool.school_id,
                      selectedSchool.devices,
                      false,
                    )
                  }
                >
                  ปิดทั้งหมด
                </Button>
              </div>
            </Flex>
          </Flex>
        }
        width={850}
        styles={{ body: { padding: "20px 24px" } }}
      >
        {/* แผงตั้งค่าช่วงเวลาและช่วงห่างการแจ้งเตือน */}
        <Collapse
          size="small"
          ghost
          style={{
            marginBottom: 16,
            border: "1px solid rgba(128,128,128,0.15)",
            borderRadius: 10,
          }}
          items={[
            {
              key: "notify-config",
              label: (
                <Flex align="center" gap={8}>
                  <SettingOutlined style={{ fontSize: 13 }} />
                  <Text strong style={{ fontSize: 13 }}>
                    ตั้งค่าการแจ้งเตือน LINE
                  </Text>
                  {notifyConfig && (
                    <Tag style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>
                      {
                        notifyConfig.time_windows.filter((w) => w.is_active)
                          .length
                      }{" "}
                      รอบที่ใช้งาน
                    </Tag>
                  )}
                </Flex>
              ),
              children: notifyConfigLoading ? (
                <Flex justify="center" style={{ padding: 16 }}>
                  <Spin size="small" />
                </Flex>
              ) : !notifyConfig ? (
                <Flex vertical gap={8} align="center" style={{ padding: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ไม่สามารถโหลดการตั้งค่าได้
                  </Text>
                  <Button
                    size="small"
                    onClick={() =>
                      selectedSchool &&
                      void fetchNotifyConfig(selectedSchool.school_id)
                    }
                  >
                    ลองใหม่
                  </Button>
                </Flex>
              ) : (
                <Flex vertical gap={16}>
                  {/* ช่วงเวลาแจ้งเตือน — dynamic สูงสุด 3 รอบ */}
                  <div>
                    <Flex
                      align="center"
                      justify="space-between"
                      style={{ marginBottom: 8 }}
                    >
                      <Text strong style={{ fontSize: 12 }}>
                        ช่วงเวลาที่อนุญาตให้แจ้งเตือน
                      </Text>
                      {notifyConfig.time_windows.length < 3 && (
                        <Button
                          size="small"
                          type="dashed"
                          style={{ fontSize: 11, borderRadius: 6 }}
                          onClick={() =>
                            selectedSchool &&
                            void handleAddTimeWindow(selectedSchool.school_id)
                          }
                        >
                          + เพิ่มรอบ
                        </Button>
                      )}
                    </Flex>
                    <Flex vertical gap={8}>
                      {notifyConfig.time_windows.map((w) => {
                        const draft = windowDrafts[w.id] ?? {};
                        const merged = { ...w, ...draft };
                        const hasDraft = Object.keys(draft).length > 0;
                        const canDelete = notifyConfig.time_windows.length > 1;
                        return (
                          <Card
                            key={w.id}
                            size="small"
                            style={{
                              borderRadius: 8,
                              border: hasDraft
                                ? "1px solid var(--ant-color-primary)"
                                : "1px solid rgba(128,128,128,0.15)",
                            }}
                            styles={{ body: { padding: "10px 14px" } }}
                          >
                            <Flex vertical gap={8}>
                              {/* แถวบน: label + tag รอบ + ปุ่มลบ */}
                              <Flex align="center" gap={8}>
                                <Tag
                                  color="blue"
                                  style={{
                                    margin: 0,
                                    fontSize: 11,
                                    borderRadius: 6,
                                    flexShrink: 0,
                                  }}
                                >
                                  รอบ {w.round}
                                </Tag>
                                <Input
                                  size="small"
                                  value={merged.label}
                                  maxLength={50}
                                  onChange={(e) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        label: e.target.value,
                                      },
                                    }))
                                  }
                                  style={{ flex: 1, fontSize: 12 }}
                                />
                                <Switch
                                  size="small"
                                  checked={merged.is_active}
                                  onChange={(checked) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        is_active: checked,
                                      },
                                    }))
                                  }
                                />
                                {canDelete && (
                                  <Tooltip title="ลบรอบนี้">
                                    <Button
                                      size="small"
                                      danger
                                      icon={<CloseOutlined />}
                                      style={{ borderRadius: 6, flexShrink: 0 }}
                                      onClick={() =>
                                        selectedSchool &&
                                        void handleDeleteTimeWindow(
                                          w.id,
                                          selectedSchool.school_id,
                                        )
                                      }
                                    />
                                  </Tooltip>
                                )}
                              </Flex>
                              {/* แถวล่าง: เวลาเริ่ม-สิ้นสุด + ปุ่มบันทึก */}
                              <Flex align="center" gap={6} wrap="wrap">
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  เริ่ม
                                </Text>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={23}
                                  value={merged.start_hour}
                                  onChange={(val) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        start_hour: val ?? 0,
                                      },
                                    }))
                                  }
                                  style={{ width: 58 }}
                                />
                                <Text style={{ fontSize: 11 }}>:</Text>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={59}
                                  value={merged.start_min}
                                  onChange={(val) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        start_min: val ?? 0,
                                      },
                                    }))
                                  }
                                  style={{ width: 58 }}
                                />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  ถึง
                                </Text>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={23}
                                  value={merged.end_hour}
                                  onChange={(val) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        end_hour: val ?? 0,
                                      },
                                    }))
                                  }
                                  style={{ width: 58 }}
                                />
                                <Text style={{ fontSize: 11 }}>:</Text>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={59}
                                  value={merged.end_min}
                                  onChange={(val) =>
                                    setWindowDrafts((prev) => ({
                                      ...prev,
                                      [w.id]: {
                                        ...prev[w.id],
                                        end_min: val ?? 0,
                                      },
                                    }))
                                  }
                                  style={{ width: 58 }}
                                />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  น.
                                </Text>
                                {hasDraft && (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<SaveOutlined />}
                                    loading={savingWindowId === w.id}
                                    onClick={() =>
                                      selectedSchool &&
                                      void handleSaveTimeWindow(
                                        w.id,
                                        selectedSchool.school_id,
                                      )
                                    }
                                    style={{
                                      borderRadius: 6,
                                      fontSize: 11,
                                      marginLeft: "auto",
                                    }}
                                  >
                                    บันทึก
                                  </Button>
                                )}
                              </Flex>
                            </Flex>
                          </Card>
                        );
                      })}
                    </Flex>
                  </div>

                  {/* ช่วงห่างการแจ้งเตือน */}
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 12,
                      }}
                    >
                      ช่วงห่างการแจ้งเตือน (หลังจากเครื่อง Offline)
                    </Text>
                    <Flex vertical gap={10}>
                      {notifyConfig.intervals.map((v) => {
                        const draft = intervalDrafts[v.id] ?? {};
                        const merged = { ...v, ...draft };
                        const hasDraft = Object.keys(draft).length > 0;
                        return (
                          <Card
                            key={v.id}
                            size="small"
                            style={{
                              borderRadius: 12,
                              border: hasDraft
                                ? "1px solid var(--ant-color-primary)"
                                : "1px solid rgba(128,128,128,0.1)",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            }}
                            styles={{ body: { padding: "12px 16px" } }}
                          >
                            <Flex align="center" gap={12}>
                              <Flex
                                vertical
                                gap={4}
                                style={{ flex: 1, minWidth: 0 }}
                              >
                                <Flex align="center" gap={8}>
                                  <Tag
                                    color={v.round === 1 ? "orange" : "purple"}
                                    style={{
                                      margin: 0,
                                      fontSize: 10,
                                      borderRadius: 4,
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {v.round === 1 ? "ครั้งแรก" : "ครั้งถัดไป"}
                                  </Tag>
                                  <Text
                                    ellipsis
                                    style={{ fontSize: 13, fontWeight: 500 }}
                                  >
                                    {merged.label}
                                  </Text>
                                </Flex>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  แจ้งเตือนอัตโนมัติเมื่อครบกำหนด
                                </Text>
                              </Flex>

                              <Flex align="center" gap={12}>
                                <InputNumber
                                  size="small"
                                  min={1}
                                  max={1440}
                                  value={merged.interval_minutes}
                                  addonAfter="นาที"
                                  onChange={(val) =>
                                    setIntervalDrafts((prev) => ({
                                      ...prev,
                                      [v.id]: {
                                        ...prev[v.id],
                                        interval_minutes: val ?? 1,
                                      },
                                    }))
                                  }
                                  style={{ width: 120 }}
                                />

                                <Flex
                                  align="center"
                                  gap={8}
                                  style={{
                                    paddingLeft: 12,
                                    borderLeft:
                                      "1px solid rgba(128,128,128,0.15)",
                                  }}
                                >
                                  <Switch
                                    size="small"
                                    checked={merged.is_active}
                                    onChange={(checked) =>
                                      setIntervalDrafts((prev) => ({
                                        ...prev,
                                        [v.id]: {
                                          ...prev[v.id],
                                          is_active: checked,
                                        },
                                      }))
                                    }
                                  />
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: 11,
                                      minWidth: 24,
                                      textAlign: "right",
                                    }}
                                  >
                                    {merged.is_active ? "เปิด" : "ปิด"}
                                  </Text>
                                </Flex>

                                {hasDraft && (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<SaveOutlined />}
                                    loading={savingIntervalId === v.id}
                                    onClick={() =>
                                      selectedSchool &&
                                      void handleSaveInterval(
                                        v.id,
                                        selectedSchool.school_id,
                                      )
                                    }
                                    style={{ borderRadius: 6, fontSize: 11 }}
                                  >
                                    บันทึก
                                  </Button>
                                )}
                              </Flex>
                            </Flex>
                          </Card>
                        );
                      })}
                    </Flex>
                  </div>

                  <Text type="secondary" style={{ fontSize: 11 }}>
                    การตั้งค่านี้มีผลเฉพาะโรงเรียน {selectedSchool?.school_name}{" "}
                    เท่านั้น
                  </Text>
                </Flex>
              ),
            },
          ]}
        />

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
          <Collapse
            size="small"
            ghost
            defaultActiveKey={deviceGroups.map(([appName]) => appName)}
            style={{
              border: "1px solid rgba(128,128,128,0.15)",
              borderRadius: 10,
            }}
            items={deviceGroups.map(([appName, devices]) => {
              const onlineCount = devices.filter((d) => d.is_online).length;
              const offlineCount = devices.length - onlineCount;
              return {
                key: appName,
                label: (
                  <Flex align="center" gap={8}>
                    <span style={{ fontSize: 15 }}>{getAppIcon(appName)}</span>
                    <Text strong style={{ fontSize: 13 }}>
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
                ),
                children: (
                  <DeviceGroupBlock
                    schoolId={selectedSchool!.school_id}
                    appName={appName}
                    devices={devices}
                    onToggleNotify={handleToggleNotify}
                    togglingDeviceId={togglingDeviceId}
                    onUpdateNote={handleUpdateNote}
                  />
                ),
              };
            })}
          />
        )}
      </Drawer>

      <Modal
        open={helpModalOpen}
        title="วิธีการทำงานของระบบแจ้งเตือน LINE Bot"
        footer={<Button onClick={() => setHelpModalOpen(false)}>ปิด</Button>}
        onCancel={() => setHelpModalOpen(false)}
        width={720}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          ข้อมูลสำหรับ Customer Support และ Admin เพื่อเข้าใจการทำงานของระบบ
        </Typography.Paragraph>

        <Divider style={{ marginTop: 12, marginBottom: 16 }} />

        {/* Section 1 */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          ภาพรวมระบบ
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          ระบบ Cronjob รันทุก 1 นาที เพื่อตรวจสอบสถานะเครื่องทุกโรงเรียนที่มี
          LINE Group เชื่อมต่ออยู่
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          การแจ้งเตือนจะส่งผ่าน LINE
          เฉพาะในช่วงเวลาที่แต่ละโรงเรียนกำหนดไว้เท่านั้น
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          แต่ละโรงเรียนสามารถตั้งค่าช่วงเวลาและช่วงห่างได้แยกกัน
          โดยคลิกที่ชื่อโรงเรียนในตาราง แล้วเปิดแถบ "ตั้งค่าการแจ้งเตือน LINE"
          ใน Drawer
        </Typography.Paragraph>

        <Divider style={{ marginTop: 16, marginBottom: 16 }} />

        {/* Section 2 */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          เงื่อนไขที่ต้องครบก่อนส่งแจ้งเตือน
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          ระบบจะส่งแจ้งเตือนเฉพาะเมื่อครบทั้ง 3 เงื่อนไขพร้อมกัน ได้แก่
        </Typography.Paragraph>
        <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <Typography.Text>
              LINE Bot เปิดใช้งานอยู่ (ตั้งค่าได้จากปุ่มในหน้านี้)
            </Typography.Text>
          </li>
          <li style={{ marginBottom: 6 }}>
            <Typography.Text>
              เวลาปัจจุบันอยู่ในช่วงเวลาที่โรงเรียนกำหนด (ค่า default:
              06:00–08:00 และ 15:00–17:00)
            </Typography.Text>
          </li>
          <li style={{ marginBottom: 0 }}>
            <Typography.Text>
              มีเครื่องที่เปิดการแจ้งเตือนไว้ (toggle รายเครื่อง) และ Offline
              เกินเกณฑ์ที่กำหนด
            </Typography.Text>
          </li>
        </ol>

        <Divider style={{ marginTop: 16, marginBottom: 16 }} />

        {/* Section 3 */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          รอบการแจ้งเตือน
        </Typography.Title>
        <Table
          size="small"
          pagination={false}
          bordered
          style={{ marginBottom: 0 }}
          columns={[
            { title: "รอบ", dataIndex: "round", key: "round", width: 120 },
            { title: "เงื่อนไข", dataIndex: "condition", key: "condition" },
            {
              title: "ตัวอย่าง (ค่า default)",
              dataIndex: "example",
              key: "example",
              width: 240,
            },
          ]}
          dataSource={[
            {
              key: "1",
              round: "รอบแรก",
              condition:
                'เครื่อง Offline นานกว่าค่า "ช่วงห่างรอบแรก" ที่ตั้งไว้',
              example: "Offline ครบ 5 นาที จะแจ้งเตือนครั้งแรก",
            },
            {
              key: "2",
              round: "รอบถัดไป",
              condition:
                'Offline นานกว่าค่า "ช่วงห่างรอบถัดไป" และตรงกับรอบ cycle ที่คำนวณได้',
              example: "ทุก 30 นาทีหลังจากนั้น (30, 60, 90, ... นาที)",
            },
          ]}
        />

        <Divider style={{ marginTop: 16, marginBottom: 16 }} />

        {/* Section 4 */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          พฤติกรรมเมื่อเครื่อง Online กลับมาแล้ว Offline ใหม่
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          หากเครื่องกลับมา Online แล้ว Offline อีกครั้ง ระบบจะนับเวลา Offline
          ใหม่จากเวลา ping ล่าสุด
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          หมายความว่าเครื่องจะได้รับการแจ้งเตือนรอบแรกอีกครั้ง ไม่ข้ามไปรอบถัดไป
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          <Typography.Text type="warning">ข้อจำกัดปัจจุบัน:</Typography.Text>
          <Typography.Text>
            {" "}
            หากเครื่อง Offline มานานเกิน 30 นาทีก่อนที่ Cronjob จะรัน
            อาจข้ามรอบแรกไปได้
          </Typography.Text>
        </Typography.Paragraph>

        <Divider style={{ marginTop: 16, marginBottom: 16 }} />

        {/* Section 5 */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          ตั้งค่าการแจ้งเตือนของแต่ละโรงเรียน
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 4 }}>
          คลิกชื่อโรงเรียนในตาราง เพื่อเปิด Drawer แล้วกดแถบ
          "ตั้งค่าการแจ้งเตือน LINE"
        </Typography.Paragraph>
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <Typography.Text strong>ช่วงเวลา:</Typography.Text>
            <Typography.Text>
              {" "}
              กำหนดได้สูงสุด 3 รอบ เปิด/ปิดแต่ละรอบได้อิสระ
            </Typography.Text>
          </li>
          <li style={{ marginBottom: 6 }}>
            <Typography.Text strong>ช่วงห่าง:</Typography.Text>
            <Typography.Text>
              {" "}
              รอบแรก (จำนวนนาทีหลัง Offline) และรอบถัดไป (cycle ซ้ำ)
            </Typography.Text>
          </li>
          <li style={{ marginBottom: 0 }}>
            <Typography.Text strong>ค่า default ทุกโรงเรียน:</Typography.Text>
            <Typography.Text>
              {" "}
              06:00–08:00 และ 15:00–17:00 ช่วงห่าง 5 นาที / 30 นาที
            </Typography.Text>
          </li>
        </ul>
      </Modal>

      <BatchProgressModal
        open={batchModalOpen}
        targetEnabled={batchTargetEnabled}
        rows={batchRows}
        onClose={() => setBatchModalOpen(false)}
      />
    </>
  );
};
