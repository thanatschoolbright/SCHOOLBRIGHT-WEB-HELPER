"use client";

import {
  AppstoreOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  DesktopOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  ShopOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import {
  Avatar,
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
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { DeviceStatusData } from "../_services/online-status-service";
import { useOnlineStatusStore } from "../_state/online-status-store";

const { Text: AntText } = Typography;

/**
 * คอมโพเนนต์ตารางแสดงรายการสถานะอุปกรณ์พร้อม pagination
 */
const DeviceTable: React.FC = () => {
  const { token } = theme.useToken();
  const { isFetching, deviceList, pagination, fetchData } =
    useOnlineStatusStore();

  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const schoolList = useMemo(() => {
    if (Array.isArray(schoolListState.response)) return schoolListState.response;
    if (
      schoolListState.response &&
      Array.isArray((schoolListState.response as any).data)
    ) {
      return (schoolListState.response as any).data;
    }
    return [];
  }, [schoolListState]);

  /**
   * ค้นหาชื่อโรงเรียนจาก SchoolID
   */
  const getSchoolName = useCallback(
    (schoolId: number) => {
      if (!Array.isArray(schoolList) || schoolList.length === 0)
        return "โรงเรียน #" + schoolId;
      const found = schoolList.find((s: any) => s.SchoolID === schoolId);
      return found
        ? found.SchoolName + " (" + found.SchoolID + ")"
        : "ไม่พบชื่อโรงเรียน (" + schoolId + ")";
    },
    [schoolList],
  );

  const columns = [
    {
      title: "โรงเรียน",
      dataIndex: "SchoolID",
      key: "SchoolID",
      width: 300,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        getSchoolName(a.SchoolID).localeCompare(getSchoolName(b.SchoolID), "th"),
      render: (schoolId: number, record: DeviceStatusData) => (
        <Space align="start">
          <Avatar
            shape="square"
            size={40}
            icon={<ShopOutlined />}
            style={{
              backgroundColor: record.Online
                ? token.colorSuccessBg
                : token.colorErrorBg,
              color: record.Online ? token.colorSuccess : token.colorError,
            }}
          />
          <Flex vertical>
            <AntText strong style={{ fontSize: 14 }}>
              {getSchoolName(schoolId)}
            </AntText>
            <Space size={4}>
              <Badge status={record.Online ? "success" : "error"} />
              <AntText type="secondary" style={{ fontSize: 11 }}>
                สถานะ: {record.Online ? "ออนไลน์" : "ออฟไลน์"}
              </AntText>
            </Space>
          </Flex>
        </Space>
      ),
    },
    {
      title: "รหัสเครื่อง",
      dataIndex: "DeviceID",
      key: "DeviceID",
      width: 180,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        a.DeviceID.localeCompare(b.DeviceID),
      render: (deviceId: string) => (
        <Tooltip title="คลิกเพื่อคัดลอก">
          <Flex
            vertical
            gap={2}
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigator.clipboard.writeText(deviceId);
              toast.success("คัดลอกรหัสเครื่องเรียบร้อย");
            }}
          >
            <Space>
              <BarcodeOutlined style={{ color: token.colorPrimary }} />
              <AntText strong>{deviceId}</AntText>
            </Space>
            <AntText type="secondary" style={{ fontSize: 11 }}>
              {deviceId.substring(0, 8)}...
            </AntText>
          </Flex>
        </Tooltip>
      ),
    },
    {
      title: "ข้อมูลแอปพลิเคชัน",
      key: "AppInfo",
      width: 200,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        (a.AppName || "").localeCompare(b.AppName || ""),
      render: (_: any, record: DeviceStatusData) => (
        <Flex vertical gap={2}>
          <Space>
            <AppstoreOutlined style={{ color: token.colorTextTertiary }} />
            <AntText style={{ fontSize: 13 }}>{record.AppName || "-"}</AntText>
          </Space>
          {record.AppVersion && (
            <Tag style={{ width: "fit-content", margin: 0, fontSize: 10 }}>
              v.{record.AppVersion}
            </Tag>
          )}
        </Flex>
      ),
    },
    {
      title: "สถานะเครือข่าย",
      dataIndex: "Online",
      key: "Online",
      width: 140,
      align: "center" as const,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        a.Online === b.Online ? 0 : a.Online ? 1 : -1,
      render: (isOnline: boolean, record: DeviceStatusData) => (
        <Flex vertical align="center" gap={4}>
          <Tag
            color={isOnline ? "success" : "error"}
            style={{
              borderRadius: 20,
              width: "100%",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {isOnline ? <WifiOutlined /> : <DisconnectOutlined />}{" "}
            {isOnline ? "ออนไลน์" : "ขาดการเชื่อมต่อ"}
          </Tag>
          {record.OnlineTime && (
            <Tooltip
              title={
                "อัปเดตล่าสุด: " +
                dayjs(record.OnlineTime).format("DD/MM/YYYY HH:mm:ss")
              }
            >
              <AntText type="secondary" style={{ fontSize: 10, cursor: "help" }}>
                <ClockCircleOutlined /> {dayjs(record.OnlineTime).fromNow()}
              </AntText>
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      title: "สถานะการใช้งาน",
      dataIndex: "Login",
      key: "Login",
      width: 140,
      align: "center" as const,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        a.Login === b.Login ? 0 : a.Login ? 1 : -1,
      render: (isLoggedIn: boolean, record: DeviceStatusData) => (
        <Flex vertical align="center" gap={4}>
          <Tag
            color={isLoggedIn ? "processing" : "default"}
            style={{
              borderRadius: 20,
              width: "100%",
              textAlign: "center",
              border: isLoggedIn
                ? "1px solid " + token.colorPrimary
                : undefined,
            }}
          >
            {isLoggedIn ? <CheckCircleFilled /> : <CloseCircleFilled />}{" "}
            {isLoggedIn ? "กำลังใช้งาน" : "ออกระบบ"}
          </Tag>
          {(isLoggedIn ? record.LoginTime : record.LogoutTime) && (
            <Tooltip
              title={
                (isLoggedIn ? "เข้าใช้งาน" : "ออกระบบ") +
                ": " +
                dayjs(
                  isLoggedIn ? record.LoginTime! : record.LogoutTime!,
                ).format("DD/MM/YYYY HH:mm:ss")
              }
            >
              <AntText type="secondary" style={{ fontSize: 10, cursor: "help" }}>
                {dayjs(
                  isLoggedIn ? record.LoginTime! : record.LogoutTime!,
                ).fromNow()}
              </AntText>
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      width: 180,
      sorter: (a: DeviceStatusData, b: DeviceStatusData) =>
        dayjs(a.Tstamp).valueOf() - dayjs(b.Tstamp).valueOf(),
      render: (_: string, record: DeviceStatusData) => (
        <Flex align="center" gap={8}>
          <AntText>
            {record.Tstamp
              ? dayjs(record.Tstamp).format("D MMM BBBB - HH:mm น.")
              : "-"}
          </AntText>
        </Flex>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      align: "center" as const,
      render: (_: any, record: DeviceStatusData) => (
        <Tooltip title="ตรวจสอบสถานะล่าสุด">
          <Button
            type="text"
            shape="circle"
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            style={{ color: token.colorPrimary }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 16 }}
      >
        <Space>
          <DesktopOutlined style={{ fontSize: "1rem" }} />
          <AntText strong style={{ fontSize: "1rem" }}>
            รายการอุปกรณ์
          </AntText>
        </Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchData(pagination.current, pagination.pageSize)}
          loading={isFetching}
        >
          รีเฟรช
        </Button>
      </Flex>

      <Table
        columns={columns}
        dataSource={deviceList}
        rowKey="DeviceStatusID"
        loading={isFetching}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
          showTotal: (total, range) => (
            <span style={{ color: token.colorTextSecondary }}>
              แสดง {range[0]}-{range[1]} จาก {total} รายการ
            </span>
          ),
        }}
        onChange={(newPagination) =>
          fetchData(newPagination.current, newPagination.pageSize)
        }
        scroll={{ x: 1200 }}
        locale={{
          emptyText: (
            <Flex vertical align="center" style={{ padding: 32 }}>
              <DesktopOutlined
                style={{
                  fontSize: 48,
                  color: token.colorBorder,
                  marginBottom: 16,
                }}
              />
              <AntText type="secondary">
                ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่กำหนด
              </AntText>
            </Flex>
          ),
        }}
        size="middle"
      />
    </Card>
  );
};

export default DeviceTable;
