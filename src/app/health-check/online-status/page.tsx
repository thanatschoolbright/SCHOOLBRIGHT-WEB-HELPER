"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Input,
  DatePicker,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Tooltip,
  Form,
  Badge,
  Skeleton,
  Flex,
  Statistic,
  theme,
  Avatar,
  Divider,
} from "antd";
import {
  SearchOutlined,
  DesktopOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ClearOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ThunderboltFilled,
  GlobalOutlined,
  SyncOutlined,
  ShopOutlined,
  BarcodeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th"; // Import Thai locale
import { findSchoolName } from "@helpers/find-school-id";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";

// Setup Dayjs Locale
dayjs.extend(relativeTime);
dayjs.locale("th");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- Interfaces ---
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
}

interface SchoolOption {
  label: string;
  value: string;
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

  // --- States with Full Names ---
  const [isFetchingDeviceStatus, setIsFetchingDeviceStatus] = useState(false);
  const [deviceStatusList, setDeviceStatusList] = useState<DeviceStatusData[]>(
    []
  );
  const [paginationConfig, setPaginationConfig] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter States
  const [availableSchoolOptions, setAvailableSchoolOptions] = useState<
    SchoolOption[]
  >([]);

  // --- Fetch School List (Mock or API) ---
  const fetchSchoolList = useCallback(async () => {
    try {
      // Simulate API call or replace with actual API
      // const response = await axios.get("/api/v1/public/school-list");
      // setAvailableSchoolOptions(...)
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  }, []);

  useEffect(() => {
    fetchSchoolList();
  }, [fetchSchoolList]);

  // --- Main Fetch Data Function ---
  const fetchDeviceStatusData = useCallback(
    async (pageIndex = 1, pageSizeLimit = 10) => {
      setIsFetchingDeviceStatus(true);
      try {
        const formValues = searchForm.getFieldsValue();

        const requestPayload = {
          page: pageIndex,
          limit: pageSizeLimit,
          keyword: formValues.keyword || undefined,
          isOnline: formValues.isOnline,
          isLogin: formValues.isLogin,
          startDate: formValues.dateRange?.[0]
            ? dayjs(formValues.dateRange[0]).format("YYYY-MM-DD")
            : undefined,
          endDate: formValues.dateRange?.[1]
            ? dayjs(formValues.dateRange[1]).format("YYYY-MM-DD")
            : undefined,
        };

        // Artificial delay to see skeleton (Optional)
        // await new Promise(r => setTimeout(r, 500));

        const apiResponse = await axios.post<DeviceStatusApiResponse>(
          "/api/v2/hardware/check-device-status",
          requestPayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (apiResponse.data?.status === 200) {
          setDeviceStatusList(apiResponse.data.data || []);
          if (apiResponse.data.pagination) {
            setPaginationConfig({
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
    [searchForm]
  );

  // Initial Fetch
  useEffect(() => {
    fetchDeviceStatusData();
  }, [fetchDeviceStatusData]);

  // --- Handlers ---
  const handleTablePaginationChange = (newPagination: any) => {
    fetchDeviceStatusData(newPagination.current, newPagination.pageSize);
  };

  const handleSearchSubmit = () => {
    fetchDeviceStatusData(1, paginationConfig.pageSize);
  };

  const handleResetFilters = () => {
    searchForm.resetFields();
    fetchDeviceStatusData(1, paginationConfig.pageSize);
  };

  const handleManualCheckStatus = async (deviceRecord: DeviceStatusData) => {
    toast.info(`กำลังตรวจสอบสถานะเครื่อง ${deviceRecord.DeviceID}...`);
    // Simulate check
    setTimeout(() => {
      toast.success("ตรวจสอบเรียบร้อย: สถานะปกติ");
    }, 1500);
  };

  // --- Computed Statistics for Summary Cards ---
  const summaryStatistics = useMemo(() => {
    const totalDevices = paginationConfig.total;
    const onlineCount = deviceStatusList.filter((d) => d.Online).length;
    const loginCount = deviceStatusList.filter((d) => d.Login).length;
    return { totalDevices, onlineCount, loginCount };
  }, [deviceStatusList, paginationConfig.total]);

  // --- Columns Configuration ---
  const tableColumns = [
    {
      title: "โรงเรียน",
      dataIndex: "SchoolID",
      key: "SchoolID",
      width: 280,
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
            <Text strong style={{ fontSize: 15 }}>
              {findSchoolName(schoolId, availableSchoolOptions) ||
                "โรงเรียนสาธิต (Demo)"}
            </Text>
            <Space size={4}>
              <Badge status={record.Online ? "success" : "error"} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                รหัส: {schoolId}
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
      width: 200,
      render: (deviceId: string) => (
        <Flex vertical gap={2}>
          <Space>
            <BarcodeOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{deviceId}</Text>
          </Space>
          <Text
            type="secondary"
            style={{ fontSize: 11 }}
            copyable={{ text: deviceId }}
          >
            กดเพื่อคัดลอก
          </Text>
        </Flex>
      ),
    },
    {
      title: "สถานะเครือข่าย",
      dataIndex: "Online",
      key: "Online",
      width: 180,
      align: "center" as const,
      render: (isOnline: boolean, record: DeviceStatusData) => (
        <div className="flex flex-col items-center gap-1">
          <Tag
            color={isOnline ? "success" : "error"}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {isOnline ? <WifiOutlined /> : <DisconnectOutlined />}
            {isOnline ? "ออนไลน์" : "ขาดการเชื่อมต่อ"}
          </Tag>
          {record.OnlineTime && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              ล่าสุด: {dayjs(record.OnlineTime).format("HH:mm:ss")}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "สถานะการใช้งาน (Login)",
      dataIndex: "Login",
      key: "Login",
      width: 180,
      align: "center" as const,
      render: (isLoggedIn: boolean, record: DeviceStatusData) => (
        <div className="flex flex-col items-center gap-1">
          <Tag
            color={isLoggedIn ? "processing" : "default"}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: isLoggedIn
                ? `1px solid ${token.colorPrimary}`
                : undefined,
            }}
          >
            {isLoggedIn ? <CheckCircleFilled /> : <CloseCircleFilled />}
            {isLoggedIn ? "กำลังใช้งาน" : "ออกสู่ระบบ"}
          </Tag>
          {(isLoggedIn ? record.LoginTime : record.LogoutTime) && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              {isLoggedIn ? "เข้าเมื่อ: " : "ออกเมื่อ: "}
              {dayjs(
                isLoggedIn ? record.LoginTime! : record.LogoutTime!
              ).format("HH:mm:ss")}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      width: 150,
      render: (businessDate: string) => (
        <Flex align="center" gap={8}>
          <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
          <Text>
            {businessDate ? dayjs(businessDate).format("DD MMM BBBB") : "-"}
          </Text>
        </Flex>
      ),
    },
    {
      title: "",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, record: DeviceStatusData) => (
        <Tooltip title="กดเพื่อตรวจสอบสถานะล่าสุด">
          <Button
            type="primary"
            ghost
            shape="circle"
            icon={<ReloadOutlined />}
            onClick={() => handleManualCheckStatus(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Flex vertical gap="large" style={{ width: "100%", paddingBottom: 24 }}>
        {/* --- Header Section --- */}
        <Flex justify="space-between" align="center" wrap="wrap" gap="small">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <Space align="center">
                <GlobalOutlined style={{ color: token.colorPrimary }} />
                ตรวจสอบสถานะอุปกรณ์ (Device Monitor)
              </Space>
            </Title>
            <Text type="secondary">
              สำหรับเจ้าหน้าที่ตรวจสอบสถานะการเชื่อมต่อและการใช้งานของเครื่องจุดขาย
              (POS) แบบเรียลไทม์
            </Text>
          </div>
          <Space>
            {isFetchingDeviceStatus && (
              <Tag icon={<SyncOutlined spin />} color="processing">
                กำลังอัปเดต...
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              ข้อมูลล่าสุด: {dayjs().format("HH:mm")}
            </Text>
          </Space>
        </Flex>

        {/* --- Summary Cards (Overview) --- */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              style={{ boxShadow: token.boxShadowTertiary, borderRadius: 16 }}
            >
              <Statistic
                title="อุปกรณ์ทั้งหมดในระบบ"
                value={paginationConfig.total}
                prefix={<DesktopOutlined />}
                suffix="เครื่อง"
                valueStyle={{ fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{ boxShadow: token.boxShadowTertiary, borderRadius: 16 }}
            >
              <Statistic
                title="ออนไลน์พร้อมใช้งาน"
                value={summaryStatistics.onlineCount}
                prefix={<WifiOutlined />}
                suffix="เครื่อง"
                valueStyle={{ color: token.colorSuccess, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{ boxShadow: token.boxShadowTertiary, borderRadius: 16 }}
            >
              <Statistic
                title="กำลังล็อกอินใช้งาน"
                value={summaryStatistics.loginCount}
                prefix={<ThunderboltFilled />}
                suffix="เครื่อง"
                valueStyle={{ color: token.colorPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>

        {/* --- Filter Section --- */}
        <Card
          variant="borderless"
          style={{
            borderRadius: 16,
            boxShadow: token.boxShadowTertiary,
          }}
        >
          <Form
            form={searchForm}
            layout="vertical"
            onFinish={handleSearchSubmit}
          >
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={8} lg={6}>
                <Form.Item
                  label="ค้นหา (Search)"
                  name="keyword"
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="พิมพ์รหัสเครื่อง หรือ รหัสโรงเรียน..."
                    prefix={
                      <SearchOutlined
                        style={{ color: token.colorTextPlaceholder }}
                      />
                    }
                    allowClear
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8} lg={5}>
                <Form.Item
                  label="สถานะเครือข่าย"
                  name="isOnline"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="ทั้งหมด" allowClear size="large">
                    <Select.Option value={true}>
                      <Badge status="success" text="ออนไลน์ (Online)" />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="error" text="ขาดการเชื่อมต่อ (Offline)" />
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8} lg={5}>
                <Form.Item
                  label="สถานะการใช้งาน"
                  name="isLogin"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="ทั้งหมด" allowClear size="large">
                    <Select.Option value={true}>
                      <Badge
                        status="processing"
                        text="กำลังใช้งาน (Logged In)"
                      />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="default" text="ออกจากระบบ (Logged Out)" />
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={5}>
                <Form.Item
                  label="ช่วงเวลา (Business Date)"
                  name="dateRange"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={3} style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  block
                  size="large"
                >
                  ค้นหา
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleResetFilters}
                  size="large"
                />
              </Col>
            </Row>
          </Form>
        </Card>

        {/* --- Table Section --- */}
        <Card
          variant="borderless"
          style={{
            marginTop: 16, // ✅ Added margin-top to separate from filter card
            borderRadius: 16,
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {isFetchingDeviceStatus ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          ) : (
            <Table
              columns={tableColumns}
              dataSource={deviceStatusList}
              rowKey="DeviceStatusID"
              pagination={{
                ...paginationConfig,
                showSizeChanger: true,
                showTotal: (total) => `พบข้อมูลทั้งหมด ${total} รายการ`,
              }}
              onChange={handleTablePaginationChange}
              scroll={{ x: 1000 }}
              locale={{ emptyText: "ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่กำหนด" }}
              size="middle"
            />
          )}
        </Card>
      </Flex>
    </DashboardLayout>
  );
}
