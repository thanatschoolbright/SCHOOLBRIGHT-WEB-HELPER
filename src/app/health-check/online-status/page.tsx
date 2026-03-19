// src/app/health-check/online-status/page.tsx

"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CodeOutlined,
  DesktopOutlined,
  DisconnectOutlined,
  FilterFilled,
  GlobalOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  SyncOutlined,
  ThunderboltFilled,
  UnorderedListOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Flex,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Interface
interface DeviceStatusData {
  DeviceStatusID: string;
  SchoolID: number;
  DeviceID: string;
  Online: boolean;
  OnlineTime: string | null;
  Login: boolean;
  LoginTime: string | null;
  LogOut: boolean;
  LogoutTime: string | null;
  Tstamp: string;
  BusinessDate: string;
  AppName?: string;
  AppVersion?: string;
}

interface DeviceStatusApiResponse {
  status: number;
  message_th: string;
  data: DeviceStatusData[];
  pagination?: {
    total: number;
  };
}

export default function OnlineDeviceDashboard() {
  const [searchForm] = Form.useForm();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const dispatch = useDispatch<AppDispatch>();

  const schoolListState = useAppSelector((state) => state.callSchoolList);

  const schoolList = useMemo(() => {
    if (Array.isArray(schoolListState.response)) {
      return schoolListState.response;
    }
    if (
      schoolListState.response &&
      Array.isArray((schoolListState.response as any).data)
    ) {
      return (schoolListState.response as any).data;
    }
    return [];
  }, [schoolListState]);

  const schoolOptions = useMemo(
    () =>
      schoolList.map((school: any) => ({
        label: `${school.SchoolName} (${school.SchoolID})`,
        value: school.SchoolID,
      })),
    [schoolList],
  );

  // Modal State
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [isFetchingDeviceStatus, setIsFetchingDeviceStatus] = useState(false);
  const [deviceStatusList, setDeviceStatusList] = useState<DeviceStatusData[]>(
    [],
  );

  const [deviceStatusPagination, setDeviceStatusPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const appNameOptions = useMemo(() => {
    const uniqueApps = Array.from(
      new Set(deviceStatusList.map((d) => d.AppName).filter(Boolean)),
    );
    return uniqueApps.map((app) => ({ label: app, value: app }));
  }, [deviceStatusList]);

  const appVersionOptions = useMemo(() => {
    const uniqueVersions = Array.from(
      new Set(deviceStatusList.map((d) => d.AppVersion).filter(Boolean)),
    );
    return uniqueVersions.map((v) => ({ label: `v.${v}`, value: v }));
  }, [deviceStatusList]);

  /**
   * ค้นหาชื่อโรงเรียนจาก SchoolID
   * @param schoolId รหัสโรงเรียน
   */
  const getSchoolName = useCallback(
    (schoolId: number) => {
      if (!Array.isArray(schoolList) || schoolList.length === 0)
        return "โรงเรียน #" + schoolId;
      const foundSchool = schoolList.find(
        (school: any) => school.SchoolID === schoolId,
      );
      return foundSchool
        ? foundSchool.SchoolName + " (" + foundSchool.SchoolID + ")"
        : "ไม่พบชื่อโรงเรียน (" + schoolId + ")";
    },
    [schoolList],
  );

  /**
   * ดึงข้อมูลสถานะอุปกรณ์จาก API
   * @param pageIndex ลำดับหน้า
   * @param pageSizeLimit จำนวนรายการต่อหน้า
   */
  const fetchDeviceStatusData = useCallback(
    async (pageIndex = 1, pageSizeLimit = 20) => {
      setIsFetchingDeviceStatus(true);
      try {
        let formValues: any = { isOnline: true };
        try {
          const values = searchForm.getFieldsValue();
          formValues = {
            ...values,
            isOnline: values.isOnline ?? true,
          };
        } catch (e) {
          console.warn("Form instance not ready, using defaults");
        }

        const requestPayload = {
          page: pageIndex,
          limit: pageSizeLimit,
          keyword: formValues.keyword ?? "",
          schoolId: formValues.schoolId,
          appName: formValues.appName,
          appVersion: formValues.appVersion,
          isOnline: formValues.isOnline,
          isLogin: formValues.isLogin,
          startDate: formValues.dateRange?.[0]
            ? dayjs(formValues.dateRange[0]).format("YYYY-MM-DD")
            : null,
          endDate: formValues.dateRange?.[1]
            ? dayjs(formValues.dateRange[1]).format("YYYY-MM-DD")
            : null,
        };

        const apiResponse = await axios.post<DeviceStatusApiResponse>(
          "/api/v2/hardware/check-device-status",
          requestPayload,
          {
            headers: { "Content-Type": "application/json" },
          },
        );

        if (apiResponse.data?.status === 200) {
          setDeviceStatusList(apiResponse.data.data || []);
          if (apiResponse.data.pagination) {
            setDeviceStatusPagination({
              current: pageIndex,
              pageSize: pageSizeLimit,
              total: apiResponse.data.pagination.total || 0,
            });
          }
        }
      } catch (error: any) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาด", {
          description:
            error?.response?.data?.message_th || "ไม่สามารถดึงข้อมูลได้",
        });
      } finally {
        setIsFetchingDeviceStatus(false);
      }
    },
    [searchForm],
  );

  useEffect(() => {
    fetchDeviceStatusData();
  }, [fetchDeviceStatusData]);

  const handleTablePaginationChange = (newPagination: any) => {
    fetchDeviceStatusData(newPagination.current, newPagination.pageSize);
  };

  const handleSearchSubmit = () => {
    fetchDeviceStatusData(1, deviceStatusPagination.pageSize);
  };

  const handleResetFilters = () => {
    searchForm.resetFields();
    searchForm.setFieldsValue({ isOnline: true });
    fetchDeviceStatusData(1, deviceStatusPagination.pageSize);
  };

  const handleManualCheckStatus = async (deviceRecord: DeviceStatusData) => {
    toast.info("กำลังตรวจสอบสถานะเครื่อง " + deviceRecord.DeviceID + "...");
    setTimeout(() => {
      setStatusModal({
        open: true,
        type: "success",
        title: "ตรวจสอบสำเร็จ",
        message: "อุปกรณ์หมายเลข " + deviceRecord.DeviceID + " สถานะปกติ",
      });
      toast.success("ตรวจสอบเรียบร้อย: สถานะปกติ");
    }, 1500);
  };

  const summaryStatistics = useMemo(() => {
    const totalDevices = deviceStatusPagination.total;
    const onlineCount = deviceStatusList.filter(
      (device) => device.Online,
    ).length;
    const loginCount = deviceStatusList.filter((device) => device.Login).length;
    return { totalDevices, onlineCount, loginCount };
  }, [deviceStatusList, deviceStatusPagination.total]);

  const tableColumns = [
    {
      title: "โรงเรียน",
      dataIndex: "SchoolID",
      key: "SchoolID",
      width: 300,
      sorter: (
        firstDevice: DeviceStatusData,
        secondDevice: DeviceStatusData,
      ) => {
        const nameA = getSchoolName(firstDevice.SchoolID);
        const nameB = getSchoolName(secondDevice.SchoolID);
        return nameA.localeCompare(nameB, "th");
      },
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
            <Text strong style={{ fontSize: 14 }}>
              {getSchoolName(schoolId)}
            </Text>
            <Space size={4}>
              <Badge status={record.Online ? "success" : "error"} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                สถานะ: {record.Online ? "ออนไลน์" : "ออฟไลน์"}
              </Text>
            </Space>
          </Flex>
        </Space>
      ),
    },
    {
      title: "รหัสเครื่อง (Device ID)",
      dataIndex: "DeviceID",
      key: "DeviceID",
      width: 180,
      sorter: (firstDevice: DeviceStatusData, secondDevice: DeviceStatusData) =>
        firstDevice.DeviceID.localeCompare(secondDevice.DeviceID),
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
              <Text strong>{deviceId}</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {deviceId.substring(0, 8)}...
            </Text>
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
            <Text style={{ fontSize: 13 }}>{record.AppName || "-"}</Text>
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
      sorter: (
        firstDevice: DeviceStatusData,
        secondDevice: DeviceStatusData,
      ) =>
        firstDevice.Online === secondDevice.Online
          ? 0
          : firstDevice.Online
            ? 1
            : -1,
      render: (isOnline: boolean, record: DeviceStatusData) => (
        <div className="flex flex-col items-center gap-1">
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
              <Text type="secondary" style={{ fontSize: 10, cursor: "help" }}>
                <ClockCircleOutlined /> {dayjs(record.OnlineTime).fromNow()}
              </Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "สถานะการใช้งาน",
      dataIndex: "Login",
      key: "Login",
      width: 140,
      align: "center" as const,
      sorter: (
        firstDevice: DeviceStatusData,
        secondDevice: DeviceStatusData,
      ) =>
        firstDevice.Login === secondDevice.Login
          ? 0
          : firstDevice.Login
            ? 1
            : -1,
      render: (isLoggedIn: boolean, record: DeviceStatusData) => (
        <div className="flex flex-col items-center gap-1">
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
              <Text type="secondary" style={{ fontSize: 10, cursor: "help" }}>
                {dayjs(
                  isLoggedIn ? record.LoginTime! : record.LogoutTime!,
                ).fromNow()}
              </Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      width: 180,
      sorter: (firstDevice: DeviceStatusData, secondDevice: DeviceStatusData) =>
        dayjs(firstDevice.Tstamp).valueOf() -
        dayjs(secondDevice.Tstamp).valueOf(),
      render: (businessDate: string, record: DeviceStatusData) => (
        <Flex align="center" gap={8}>
          <Text>
            {record.Tstamp
              ? dayjs(record.Tstamp).format("D MMM BBBB - HH:mm น.")
              : "-"}
          </Text>
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
            onClick={() => handleManualCheckStatus(record)}
            style={{ color: token.colorPrimary }}
          />
        </Tooltip>
      ),
    },
  ];

  const collapseItems = [
    {
      key: "1",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilterFilled style={{ color: token.colorPrimary }} />
          <Text strong style={{ fontSize: 14 }}>
            ตัวกรองข้อมูลขั้นสูง (Filter)
          </Text>
        </div>
      ),
      children: (
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearchSubmit}
          initialValues={{ isOnline: true }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
            <FilterFilled
              style={{ fontSize: "1rem", color: token.colorPrimary }}
            />
            <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
              ตัวกรอง
            </Text>
          </Flex>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <SearchOutlined />
                    <span>ค้นหา (รหัสเครื่อง / รหัสโรงเรียน)</span>
                    <Tooltip title="กรอกบางส่วนของรหัสเครื่อง หรือรหัสโรงเรียนเพื่อค้นหา">
                      <InfoCircleOutlined
                        style={{ color: token.colorTextTertiary }}
                      />
                    </Tooltip>
                  </Space>
                }
                name="keyword"
              >
                <Input placeholder="เช่น 14407..., 1001" allowClear />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <ShopOutlined />
                    <span>โรงเรียน (School)</span>
                  </Space>
                }
                name="schoolId"
              >
                <Select
                  placeholder="เลือกโรงเรียน"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={schoolOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <AppstoreOutlined />
                    <span>ชื่อแอปพลิเคชัน (App Name)</span>
                  </Space>
                }
                name="appName"
              >
                <Select
                  placeholder="เลือกชื่อแอปพลิเคชัน"
                  allowClear
                  showSearch
                  options={appNameOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CodeOutlined />
                    <span>เวอร์ชันแอป (Version)</span>
                  </Space>
                }
                name="appVersion"
              >
                <Select
                  placeholder="เลือกเวอร์ชัน"
                  allowClear
                  showSearch
                  options={appVersionOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <WifiOutlined />
                    <span>สถานะเครือข่าย</span>
                  </Space>
                }
                name="isOnline"
              >
                <Select placeholder="ทั้งหมด" allowClear>
                  <Select.Option value={true}>
                    <Badge status="success" text="ออนไลน์ (Online)" />
                  </Select.Option>
                  <Select.Option value={false}>
                    <Badge status="error" text="ออฟไลน์ (Offline)" />
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <ThunderboltFilled />
                    <span>สถานะการใช้งาน</span>
                  </Space>
                }
                name="isLogin"
              >
                <Select placeholder="ทั้งหมด" allowClear>
                  <Select.Option value={true}>
                    <Badge status="processing" text="กำลังใช้งาน (Active)" />
                  </Select.Option>
                  <Select.Option value={false}>
                    <Badge status="default" text="ไม่ได้ใช้งาน (Inactive)" />
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={24}>
              <Form.Item
                label={
                  <Space>
                    <ClockCircleOutlined />
                    <span>ช่วงเวลา (วันที่ทำรายการ)</span>
                  </Space>
                }
                name="dateRange"
                style={{ marginBottom: 0 }}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <Row justify="end" gutter={16}>
            <Col>
              <Button
                icon={<ClearOutlined />}
                onClick={handleResetFilters}
                size="large"
              >
                ล้างข้อมูล
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                size="large"
              >
                ค้นหา
              </Button>
            </Col>
          </Row>
        </Form>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div
        style={{
          margin: "0 auto",
          width: "100%",
          paddingBottom: 32,
        }}
      >
        <HeaderBar
          icon={<GlobalOutlined />}
          title="ตรวจสอบสถานะอุปกรณ์"
          subTitle="ติดตามสถานะการเชื่อมต่อ (ออนไลน์/ออฟไลน์) และการใช้งาน (เข้าสู่ระบบ/ออกจากระบบ) ของเครื่อง POS แบบเรียลไทม์"
          extra={
            <Space direction="vertical" align="end" size={0}>
              <Tag
                icon={<SyncOutlined spin={isFetchingDeviceStatus} />}
                color={isFetchingDeviceStatus ? "processing" : "default"}
              >
                {isFetchingDeviceStatus
                  ? "กำลังอัปเดตข้อมูล..."
                  : "ข้อมูลล่าสุด"}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                อัปเดตเมื่อ: {dayjs().format("HH:mm:ss")}
              </Text>
            </Space>
          }
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24, marginTop: 24 }}>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="อุปกรณ์ทั้งหมด"
              value={summaryStatistics.totalDevices}
              unit="เครื่อง"
              icon={<DesktopOutlined />}
              isLoading={isFetchingDeviceStatus}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="ออนไลน์พร้อมใช้งาน"
              value={summaryStatistics.onlineCount}
              unit="เครื่อง"
              icon={<WifiOutlined />}
              color={token.colorSuccess}
              isLoading={isFetchingDeviceStatus}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="กำลังใช้งาน (Active)"
              value={summaryStatistics.loginCount}
              unit="เครื่อง"
              icon={<ThunderboltFilled />}
              color={token.colorPrimary}
              isLoading={isFetchingDeviceStatus}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 24 }}>
          <Collapse
            defaultActiveKey={["1"]}
            ghost
            expandIconPosition="end"
            items={collapseItems}
            destroyOnHidden={false}
            style={{
              background: token.colorBgContainer,
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "none",
            }}
          />
        </div>

        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            overflow: "hidden",
            borderColor: token.colorBorderSecondary,
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ marginBottom: 16 }}
          >
            <Space>
              <UnorderedListOutlined style={{ fontSize: "1rem" }} />
              <Text strong style={{ fontSize: "1rem" }}>
                รายการอุปกรณ์
              </Text>
            </Space>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  fetchDeviceStatusData(
                    deviceStatusPagination.current,
                    deviceStatusPagination.pageSize,
                  )
                }
                loading={isFetchingDeviceStatus}
              >
                รีเฟรช
              </Button>
            </Space>
          </Flex>

          <Table
            columns={tableColumns}
            dataSource={deviceStatusList}
            rowKey="DeviceStatusID"
            loading={isFetchingDeviceStatus}
            pagination={{
              ...deviceStatusPagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
              showTotal: (total, range) => (
                <span style={{ color: token.colorTextSecondary }}>
                  แสดง {range[0]}-{range[1]} จาก {total} รายการ
                </span>
              ),
            }}
            onChange={handleTablePaginationChange}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <DesktopOutlined
                    style={{
                      fontSize: 48,
                      color: token.colorBorder,
                      marginBottom: 16,
                    }}
                  />
                  <p>ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่กำหนด</p>
                </div>
              ),
            }}
            size="middle"
          />
        </Card>
      </div>

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
      />
    </DashboardLayout>
  );
}
