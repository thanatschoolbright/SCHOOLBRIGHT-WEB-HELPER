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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { findSchoolName } from "@helpers/find-school-id";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";

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
  // const [isFetchingSchools, setIsFetchingSchools] = useState(false); // Uncomment if using API

  // --- Fetch School List (Mock or API) ---
  const fetchSchoolList = useCallback(async () => {
    // setIsFetchingSchools(true);
    try {
      // Simulate API call or replace with actual API
      // const response = await axios.get("/api/v1/public/school-list");
      // setAvailableSchoolOptions(...)
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      // setIsFetchingSchools(false);
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

        // Artificial delay to show Skeleton (Optional: Remove in production)
        // await new Promise(resolve => setTimeout(resolve, 800));

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
    toast.info(`กำลังตรวจสอบสถานะ ${deviceRecord.DeviceID}...`);
    // Simulate check
    setTimeout(() => {
      toast.success("ตรวจสอบเรียบร้อย Online");
    }, 1000);
  };

  // --- Computed Statistics for Summary Cards ---
  const summaryStatistics = useMemo(() => {
    const totalDevices = paginationConfig.total; // Or deviceStatusList.length if pagination not fully supported
    // Note: These are based on current page data, ideally should come from API summary
    const onlineCount = deviceStatusList.filter((d) => d.Online).length;
    const loginCount = deviceStatusList.filter((d) => d.Login).length;
    return { totalDevices, onlineCount, loginCount };
  }, [deviceStatusList, paginationConfig.total]);

  // --- Columns Configuration ---
  const tableColumns = [
    {
      title: "โรงเรียน (School)",
      dataIndex: "SchoolID",
      key: "SchoolID",
      width: 220,
      render: (schoolId: number) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: token.colorPrimary }}>
            {schoolId}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {findSchoolName(schoolId, availableSchoolOptions) ||
              "ไม่พบข้อมูลชื่อ"}
          </Text>
        </Space>
      ),
    },
    {
      title: "รหัสอุปกรณ์ (Device ID)",
      dataIndex: "DeviceID",
      key: "DeviceID",
      render: (deviceId: string) => (
        <Flex align="center" gap={8}>
          <DesktopOutlined style={{ color: token.colorTextSecondary }} />
          <Text copyable>{deviceId}</Text>
        </Flex>
      ),
    },
    {
      title: "สถานะเครือข่าย",
      dataIndex: "Online",
      key: "Online",
      width: 180,
      render: (isOnline: boolean, record: DeviceStatusData) => (
        <Flex vertical gap={4}>
          <Badge
            status={isOnline ? "success" : "error"}
            text={
              <Text
                strong
                style={{
                  color: isOnline ? token.colorSuccess : token.colorError,
                }}
              >
                {isOnline ? "ONLINE" : "OFFLINE"}
              </Text>
            }
          />
          {record.OnlineTime && (
            <Text type="secondary" style={{ fontSize: 11, paddingLeft: 12 }}>
              ล่าสุด: {convertTimeZoneToThai(new Date(record.OnlineTime))}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "สถานะการใช้งาน (Login)",
      dataIndex: "Login",
      key: "Login",
      width: 180,
      render: (isLoggedIn: boolean, record: DeviceStatusData) => (
        <Flex vertical gap={4}>
          <Tag
            icon={isLoggedIn ? <CheckCircleFilled /> : <CloseCircleFilled />}
            color={isLoggedIn ? "blue" : "default"}
            style={{ width: "fit-content", borderRadius: 12 }}
          >
            {isLoggedIn ? "Active User" : "Logged Out"}
          </Tag>
          {(isLoggedIn ? record.LoginTime : record.LogoutTime) && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {convertTimeZoneToThai(
                new Date(isLoggedIn ? record.LoginTime! : record.LogoutTime!)
              )}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      render: (businessDate: string) => (
        <Text>
          {businessDate ? dayjs(businessDate).format("DD/MM/YYYY") : "-"}
        </Text>
      ),
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_: any, record: DeviceStatusData) => (
        <Tooltip title="ตรวจสอบสถานะเดี๋ยวนี้">
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

  return (
    <DashboardLayout>
      <Flex vertical gap="large" style={{ width: "100%", paddingBottom: 24 }}>
        {/* --- Header Section --- */}
        <Flex justify="space-between" align="center" wrap="wrap" gap="small">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <Space align="center">
                <GlobalOutlined style={{ color: token.colorPrimary }} />
                สถานะอุปกรณ์ (Device Monitor)
              </Space>
            </Title>
            <Text type="secondary">
              ตรวจสอบสถานะการเชื่อมต่อและการใช้งานของเครื่องจุดขาย (POS) แบบ
              Real-time
            </Text>
          </div>
          <Space>
            {isFetchingDeviceStatus && (
              <Tag icon={<SyncOutlined spin />} color="processing">
                Updating...
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last update: {dayjs().format("HH:mm")}
            </Text>
          </Space>
        </Flex>

        {/* --- Summary Cards (Overview) --- */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ boxShadow: token.boxShadowTertiary }}>
              <Statistic
                title="อุปกรณ์ทั้งหมด (Total Devices)"
                value={paginationConfig.total}
                prefix={<DesktopOutlined />}
                valueStyle={{ fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ boxShadow: token.boxShadowTertiary }}>
              <Statistic
                title="ออนไลน์ขณะนี้ (Online)"
                value={summaryStatistics.onlineCount} // Note: This mocks data from current page
                prefix={<WifiOutlined />}
                valueStyle={{ color: token.colorSuccess, fontWeight: 600 }}
                suffix={`/ ${deviceStatusList.length}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ boxShadow: token.boxShadowTertiary }}>
              <Statistic
                title="กำลังใช้งาน (Active Login)"
                value={summaryStatistics.loginCount}
                prefix={<ThunderboltFilled />}
                valueStyle={{ color: token.colorPrimary, fontWeight: 600 }}
                suffix={`/ ${deviceStatusList.length}`}
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
                    placeholder="ระบุ Device ID หรือรหัสโรงเรียน..."
                    prefix={
                      <SearchOutlined
                        style={{ color: token.colorTextPlaceholder }}
                      />
                    }
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8} lg={5}>
                <Form.Item
                  label="สถานะเครือข่าย"
                  name="isOnline"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="ทั้งหมด" allowClear>
                    <Select.Option value={true}>
                      <Badge status="success" text="Online" />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="error" text="Offline" />
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
                  <Select placeholder="ทั้งหมด" allowClear>
                    <Select.Option value={true}>
                      <Badge status="processing" text="Logged In" />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="default" text="Logged Out" />
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
                  <RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={3} style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  block
                >
                  ค้นหา
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleResetFilters} />
              </Col>
            </Row>
          </Form>
        </Card>

        {/* --- Table Section --- */}
        <Card
          variant="borderless"
          style={{
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
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              onChange={handleTablePaginationChange}
              scroll={{ x: 1000 }}
              locale={{ emptyText: "ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่กำหนด" }}
            />
          )}
        </Card>
      </Flex>
    </DashboardLayout>
  );
}
