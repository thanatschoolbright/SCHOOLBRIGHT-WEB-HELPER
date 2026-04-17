"use client";

import {
  ApiOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  CopyOutlined,
  DesktopOutlined,
  DisconnectOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  ShopOutlined,
  ThunderboltFilled,
  WifiOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import {
  Badge,
  Button,
  Card,
  Flex,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { DeviceStatusData } from "../_services/online-status-service";
import { useOnlineStatusStore } from "../_state/online-status-store";

// ตั้งค่า Day.js ให้จัดการ UTC และ Timezone
dayjs.extend(utc);
dayjs.extend(timezone);

const { Text: AntText } = Typography;

// คืนค่าสีและ label ตามสถานะ Online/Offline
const getNetworkStatus = (isOnline: boolean, onlineTime: string | null) => {
  // คำนวณแบบ Dynamic: ถ้า Online เป็น true หรือมีการส่ง Heartbeat มาใน 15 นาทีล่าสุด (ปรับตาม API)
  const isOnlineDynamic =
    isOnline ||
    (onlineTime ? dayjs().diff(dayjs(onlineTime), "minute") <= 15 : false);

  return isOnlineDynamic
    ? {
        label: "ออนไลน์",
        color: "#16a34a",
        bg: "#dcfce7",
        border: "#86efac",
        dot: "success" as const,
      }
    : {
        label: "ออฟไลน์",
        color: "#dc2626",
        bg: "#fee2e2",
        border: "#fca5a5",
        dot: "error" as const,
      };
};

// คืนค่าสีและ label ตามสถานะ Login
const getSessionStatus = (isLogin: boolean) =>
  isLogin
    ? {
        label: "กำลังใช้งาน",
        color: "#2563eb",
        bg: "#dbeafe",
        border: "#93c5fd",
      }
    : {
        label: "ออกระบบแล้ว",
        color: "#6b7280",
        bg: "#f3f4f6",
        border: "#d1d5db",
      };

// แสดงค่าวันที่และเวลาจาก String ตรงๆ (Raw String)
const FormatDateTime: React.FC<{ time: string | null; prefix?: string }> = ({
  time,
  prefix = "",
}) => {
  const { token } = theme.useToken();
  if (!time)
    return (
      <AntText type="secondary" style={{ fontSize: 11 }}>
        —
      </AntText>
    );

  // ดึงเฉพาะส่วนวันที่และเวลา (YYYY-MM-DD HH:mm:ss) จาก ISO String
  // ตัวอย่าง: 2026-04-17T11:57:25.017Z -> 17/04/2026 11:57
  const rawDate = time.split("T")[0];
  const rawTime = time.split("T")[1]?.split(".")[0]?.substring(0, 5);
  const [year, month, day] = rawDate.split("-");
  const formatted = `${day}/${month}/${year} ${rawTime}`;

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ fontSize: 11, color: token.colorTextTertiary }}
    >
      <ClockCircleOutlined style={{ fontSize: 10 }} />
      {prefix}
      {formatted}
    </span>
  );
};

/**
 * คอมโพเนนต์ตารางแสดงรายการสถานะอุปกรณ์แบบ Enterprise พร้อม pagination
 */
const DeviceTable: React.FC = () => {
  const { token } = theme.useToken();
  const { isFetching, deviceList, pagination, fetchData } =
    useOnlineStatusStore();

  const schoolListState = useAppSelector((state) => state.callGetSchoolListDetail);
  const schoolList = useMemo(() => {
    const raw = schoolListState.response?.data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [schoolListState]);

  // ค้นหาชื่อโรงเรียนจาก SchoolID
  const getSchoolName = useCallback(
    (schoolId: number) => {
      if (!Array.isArray(schoolList) || schoolList.length === 0) return null;
      const found = schoolList.find(
        (s: any) => Number(s.school_id ?? s.SchoolID) === schoolId,
      );
      if (!found) return null;
      return {
        SchoolName: found.company_name ?? found.SchoolName ?? `โรงเรียน #${schoolId}`,
      };
    },
    [schoolList],
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}เรียบร้อย`);
  };

  // สถิติรวมจาก deviceList ปัจจุบัน
  const stats = useMemo(() => {
    const calcOnline = (d: DeviceStatusData) =>
      d.Online ||
      (d.OnlineTime
        ? dayjs().diff(dayjs(d.OnlineTime), "minute") <= 15
        : false);

    return {
      online: deviceList.filter(calcOnline).length,
      offline: deviceList.filter((d) => !calcOnline(d)).length,
      active: deviceList.filter((d) => d.Login).length,
    };
  }, [deviceList]);

  const columns: ColumnsType<DeviceStatusData> = [
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <ShopOutlined />
          โรงเรียน
        </span>
      ),
      dataIndex: "SchoolID",
      key: "SchoolID",
      width: 280,
      sorter: (a, b) => {
        const aName =
          getSchoolName(a.SchoolID)?.SchoolName ?? String(a.SchoolID);
        const bName =
          getSchoolName(b.SchoolID)?.SchoolName ?? String(b.SchoolID);
        return aName.localeCompare(bName, "th");
      },
      render: (schoolId: number, record: DeviceStatusData) => {
        const net = getNetworkStatus(record.Online, record.OnlineTime);
        const school = getSchoolName(schoolId);
        const initials = school?.SchoolName?.charAt(0) ?? "#";
        const isOnlineDynamic =
          record.Online ||
          (record.OnlineTime
            ? dayjs().diff(dayjs(record.OnlineTime), "minute") <= 15
            : false);
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm relative"
              style={{
                background: net.bg,
                color: net.color,
                border: `1px solid ${net.border}`,
              }}
            >
              {initials}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  background: isOnlineDynamic ? "#22c55e" : "#ef4444",
                  borderColor: token.colorBgContainer,
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <AntText
                strong
                ellipsis={{
                  tooltip: school?.SchoolName ?? `โรงเรียน #${schoolId}`,
                }}
                style={{ fontSize: 13, maxWidth: 190 }}
              >
                {school?.SchoolName ?? `โรงเรียน #${schoolId}`}
              </AntText>
              <span
                className="inline-flex items-center gap-1 mt-0.5"
                style={{ fontSize: 11, color: token.colorTextTertiary }}
              >
                <ShopOutlined style={{ fontSize: 10 }} />
                ID: {schoolId}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <BarcodeOutlined />
          รหัสเครื่อง
        </span>
      ),
      dataIndex: "DeviceID",
      key: "DeviceID",
      width: 200,
      sorter: (a, b) => a.DeviceID.localeCompare(b.DeviceID),
      render: (deviceId: string) => (
        <div className="flex flex-col gap-1">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer group transition-all"
            style={{
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            onClick={() => handleCopy(deviceId, "รหัสเครื่อง")}
          >
            <BarcodeOutlined
              style={{ color: token.colorPrimary, fontSize: 13 }}
            />
            <code
              className="text-xs font-mono flex-1 truncate group-hover:text-blue-500 transition-colors"
              style={{ color: token.colorText }}
            >
              {deviceId}
            </code>
            <CopyOutlined
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontSize: 11, color: token.colorPrimary }}
            />
          </div>
        </div>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <AppstoreOutlined />
          แอปพลิเคชัน
        </span>
      ),
      key: "AppInfo",
      width: 180,
      sorter: (a, b) => (a.AppName ?? "").localeCompare(b.AppName ?? ""),
      render: (_: any, record: DeviceStatusData) => (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <AppstoreOutlined
              style={{ color: token.colorTextQuaternary, fontSize: 12 }}
            />
            <AntText style={{ fontSize: 13 }}>{record.AppName || "—"}</AntText>
          </span>
          {record.AppVersion && (
            <Tag
              style={{
                margin: 0,
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 6,
                padding: "1px 8px",
                width: "fit-content",
                background: token.colorPrimaryBg,
                borderColor: token.colorPrimaryBorder,
                color: token.colorPrimary,
              }}
            >
              v.{record.AppVersion}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <WifiOutlined />
          สถานะเครือข่าย
        </span>
      ),
      dataIndex: "Online",
      key: "Online",
      width: 160,
      align: "center",
      sorter: (a, b) => Number(b.Online) - Number(a.Online),
      render: (isOnline: boolean, record: DeviceStatusData) => {
        const net = getNetworkStatus(isOnline, record.OnlineTime);
        const isOnlineDynamic =
          isOnline ||
          (record.OnlineTime
            ? dayjs().diff(dayjs(record.OnlineTime), "minute") <= 15
            : false);
        return (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs"
              style={{
                background: net.bg,
                color: net.color,
                border: `1px solid ${net.border}`,
              }}
            >
              {isOnlineDynamic ? (
                <WifiOutlined style={{ fontSize: 11 }} />
              ) : (
                <DisconnectOutlined style={{ fontSize: 11 }} />
              )}
              {net.label}
            </div>
            <FormatDateTime time={record.OnlineTime} prefix="อัปเดต: " />
          </div>
        );
      },
    },
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <ThunderboltFilled />
          สถานะการใช้งาน
        </span>
      ),
      dataIndex: "Login",
      key: "Login",
      width: 160,
      align: "center",
      sorter: (a, b) => Number(b.Login) - Number(a.Login),
      render: (isLogin: boolean, record: DeviceStatusData) => {
        const sess = getSessionStatus(isLogin);
        return (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs"
              style={{
                background: sess.bg,
                color: sess.color,
                border: `1px solid ${sess.border}`,
              }}
            >
              {isLogin ? (
                <CheckCircleFilled style={{ fontSize: 11 }} />
              ) : (
                <CloseCircleFilled style={{ fontSize: 11 }} />
              )}
              {sess.label}
            </div>
            <FormatDateTime
              time={isLogin ? record.LoginTime : record.LogoutTime}
              prefix={isLogin ? "เข้าใช้: " : "ออกระบบ: "}
            />
          </div>
        );
      },
    },
    {
      title: (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <ClockCircleOutlined />
          วันที่ทำรายการ
        </span>
      ),
      dataIndex: "Tstamp",
      key: "Tstamp",
      width: 180,
      sorter: (a, b) => dayjs(a.Tstamp).valueOf() - dayjs(b.Tstamp).valueOf(),
      render: (tstamp: string) => {
        if (!tstamp) return "—";
        const rawDate = tstamp.split("T")[0];
        const rawTime = tstamp.split("T")[1]?.split(".")[0]?.substring(0, 5);
        const [year, month, day] = rawDate.split("-");
        return (
          <div className="flex flex-col gap-0.5">
            <AntText style={{ fontSize: 13 }}>
              {`${day}/${month}/${year} ${rawTime}`}
            </AntText>
          </div>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 56,
      align: "center",
      render: () => (
        <Tooltip title="รีเฟรชข้อมูล">
          <Button
            type="text"
            shape="circle"
            size="small"
            icon={<ReloadOutlined style={{ fontSize: 13 }} />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            style={{ color: token.colorPrimary }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: "16px" } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: token.colorPrimaryBg }}
          >
            <DesktopOutlined
              style={{ color: token.colorPrimary, fontSize: 16 }}
            />
          </div>
          <div>
            <AntText strong style={{ fontSize: 15 }}>
              รายการอุปกรณ์
            </AntText>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge status="success" />
              <AntText type="secondary" style={{ fontSize: 11 }}>
                {stats.online} ออนไลน์
              </AntText>
              <span style={{ color: token.colorBorderSecondary }}>·</span>
              <Badge status="error" />
              <AntText type="secondary" style={{ fontSize: 11 }}>
                {stats.offline} ออฟไลน์
              </AntText>
              <span style={{ color: token.colorBorderSecondary }}>·</span>
              <ThunderboltFilled
                style={{ fontSize: 10, color: token.colorPrimary }}
              />
              <AntText type="secondary" style={{ fontSize: 11 }}>
                {stats.active} กำลังใช้งาน
              </AntText>
            </div>
          </div>
        </div>

        <Space size={8}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorTextSecondary,
            }}
          >
            <ApiOutlined style={{ fontSize: 12 }} />
            {pagination.total.toLocaleString()} รายการ
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={isFetching}
            style={{ borderRadius: 10 }}
          >
            รีเฟรช
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: "hidden",
        }}
      >
        <Table<DeviceStatusData>
          columns={columns}
          dataSource={deviceList}
          rowKey="DeviceStatusID"
          loading={isFetching}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
            style: { padding: "12px 20px", margin: 0 },
            showTotal: (total, range) => (
              <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                แสดง {range[0].toLocaleString()}–{range[1].toLocaleString()} จาก{" "}
                {total.toLocaleString()} รายการ
              </span>
            ),
          }}
          onChange={(newPagination) =>
            fetchData(newPagination.current, newPagination.pageSize)
          }
          scroll={{ x: 1200 }}
          size="middle"
          rowClassName={(record) => {
            const isOnlineDynamic =
              record.Online ||
              (record.OnlineTime
                ? dayjs().diff(dayjs(record.OnlineTime), "minute") <= 15
                : false);
            return isOnlineDynamic
              ? "hover:bg-green-50/30 transition-colors"
              : "hover:bg-red-50/30 transition-colors";
          }}
          locale={{
            emptyText: (
              <Flex
                vertical
                align="center"
                gap={12}
                style={{ padding: "48px 0" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: token.colorFillAlter }}
                >
                  <PoweroffOutlined
                    style={{ fontSize: 28, color: token.colorBorder }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <AntText strong style={{ color: token.colorTextSecondary }}>
                    ไม่พบอุปกรณ์
                  </AntText>
                  <AntText type="secondary" style={{ fontSize: 12 }}>
                    ลองปรับตัวกรองหรือรีเฟรชข้อมูล
                  </AntText>
                </div>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => fetchData(1, pagination.pageSize)}
                >
                  รีเฟรช
                </Button>
              </Flex>
            ),
          }}
        />
      </div>
    </Card>
  );
};

export default DeviceTable;
