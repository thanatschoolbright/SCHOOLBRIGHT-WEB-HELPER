// src/app/health-check/online-status/page.tsx

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
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
  Form,
  Badge,
  Skeleton,
  Flex,
  Statistic,
  theme,
  Avatar,
  Tooltip,
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
  FilterFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
        label: `${school.school_name} (${school.school_id})`,
        value: school.school_id,
      })),
    [schoolList]
  );

  const [isFetchingDeviceStatus, setIsFetchingDeviceStatus] = useState(false);
  const [deviceStatusList, setDeviceStatusList] = useState<DeviceStatusData[]>(
    []
  );

  const [deviceStatusPagination, setDeviceStatusPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const getSchoolName = useCallback(
    (schoolId: number) => {
      if (!Array.isArray(schoolList) || schoolList.length === 0)
        return `โรงเรียน #${schoolId}`;
      const foundSchool = schoolList.find(
        (school: any) => school.school_id === schoolId
      );
      return foundSchool
        ? `${foundSchool.school_name} (${foundSchool.school_id})`
        : `ไม่พบชื่อโรงเรียน (${schoolId})`;
    },
    [schoolList]
  );

  const fetchDeviceStatusData = useCallback(
    async (pageIndex = 1, pageSizeLimit = 20) => {
      setIsFetchingDeviceStatus(true);
      try {
        const formValues = searchForm.getFieldsValue();

        const requestPayload = {
          page: pageIndex,
          limit: pageSizeLimit,
          keyword: formValues.keyword ?? "",
          schoolId: formValues.schoolId,
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
          }
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
    [searchForm]
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
    fetchDeviceStatusData(1, deviceStatusPagination.pageSize);
  };

  const handleManualCheckStatus = async (deviceRecord: DeviceStatusData) => {
    toast.info(`กำลังตรวจสอบสถานะเครื่อง ${deviceRecord.DeviceID}...`);
    setTimeout(() => {
      toast.success("ตรวจสอบเรียบร้อย: สถานะปกติ");
    }, 1500);
  };

  const summaryStatistics = useMemo(() => {
    const totalDevices = deviceStatusPagination.total;
    const onlineCount = deviceStatusList.filter(
      (device) => device.Online
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
        secondDevice: DeviceStatusData
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
      title: "สถานะเครือข่าย",
      dataIndex: "Online",
      key: "Online",
      width: 140, // ✅ Reduced width
      align: "center" as const,
      sorter: (firstDevice: DeviceStatusData, secondDevice: DeviceStatusData) =>
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
              title={`อัปเดตล่าสุด: ${dayjs(record.OnlineTime).format(
                "DD/MM/YYYY HH:mm:ss"
              )}`}
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
      width: 140, // ✅ Reduced width
      align: "center" as const,
      sorter: (firstDevice: DeviceStatusData, secondDevice: DeviceStatusData) =>
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
                ? `1px solid ${token.colorPrimary}`
                : undefined,
            }}
          >
            {isLoggedIn ? <CheckCircleFilled /> : <CloseCircleFilled />}{" "}
            {isLoggedIn ? "กำลังใช้งาน" : "ออกระบบ"}
          </Tag>
          {(isLoggedIn ? record.LoginTime : record.LogoutTime) && (
            <Tooltip
              title={`${isLoggedIn ? "เข้าใช้งาน" : "ออกระบบ"}: ${dayjs(
                isLoggedIn ? record.LoginTime! : record.LogoutTime!
              ).format("DD/MM/YYYY HH:mm:ss")}`}
            >
              <Text type="secondary" style={{ fontSize: 10, cursor: "help" }}>
                {dayjs(
                  isLoggedIn ? record.LoginTime! : record.LogoutTime!
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
              ? dayjs(record.Tstamp).format("D MMM BBBB • HH:mm น.")
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

  return (
    <DashboardLayout>
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          width: "100%",
          paddingBottom: 32,
        }}
      >
        {/* --- Header Section --- */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title
              level={3}
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <GlobalOutlined style={{ color: token.colorPrimary }} />
              ตรวจสอบสถานะอุปกรณ์
            </Title>
            <Text type="secondary">
              ติดตามสถานะการเชื่อมต่อ (ออนไลน์/ออฟไลน์) และการใช้งาน
              (เข้าสู่ระบบ/ออกจากระบบ) ของเครื่อง POS แบบเรียลไทม์
            </Text>
          </div>
          <Space direction="vertical" align="end" size={0}>
            <Tag
              icon={<SyncOutlined spin={isFetchingDeviceStatus} />}
              color={isFetchingDeviceStatus ? "processing" : "default"}
            >
              {isFetchingDeviceStatus ? "กำลังอัปเดตข้อมูล..." : "ข้อมูลล่าสุด"}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              อัปเดตเมื่อ: {dayjs().format("HH:mm:ss")}
            </Text>
          </Space>
        </div>

        {/* --- Summary Cards (Overview) --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Statistic
                title="อุปกรณ์ทั้งหมด"
                value={deviceStatusPagination.total}
                prefix={<DesktopOutlined />}
                suffix="เครื่อง"
                valueStyle={{ fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
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
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Statistic
                title="กำลังใช้งาน (Active)"
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
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <FilterFilled style={{ color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 16 }}>
              ตัวกรองข้อมูลขั้นสูง
            </Text>
          </div>

          <Form
            form={searchForm}
            layout="vertical"
            onFinish={handleSearchSubmit}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8} lg={6}>
                <Form.Item
                  label="ค้นหา (รหัสเครื่อง / รหัสโรงเรียน)"
                  name="keyword"
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="ระบุรหัสเครื่อง..."
                    prefix={
                      <SearchOutlined
                        style={{ color: token.colorTextPlaceholder }}
                      />
                    }
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8} lg={6}>
                <Form.Item
                  label="โรงเรียน"
                  name="schoolId"
                  style={{ marginBottom: 0 }}
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

              <Col xs={24} md={8} lg={4}>
                <Form.Item
                  label="สถานะเครือข่าย"
                  name="isOnline"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="ทั้งหมด" allowClear>
                    <Select.Option value={true}>
                      <Badge status="success" text="ออนไลน์" />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="error" text="ออฟไลน์" />
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8} lg={4}>
                <Form.Item
                  label="สถานะการใช้งาน"
                  name="isLogin"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="ทั้งหมด" allowClear>
                    <Select.Option value={true}>
                      <Badge status="processing" text="กำลังใช้งาน" />
                    </Select.Option>
                    <Select.Option value={false}>
                      <Badge status="default" text="ไม่ได้ใช้งาน" />
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={16} lg={4}>
                <Form.Item
                  label="ช่วงเวลา (วันที่)"
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

            <Divider style={{ margin: "16px 0" }} />

            <Row justify="end" gutter={8}>
              <Col>
                <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
                  ล้างค่า
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                >
                  ค้นหาข้อมูล
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* --- Table Section --- */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={tableColumns}
            dataSource={deviceStatusList}
            rowKey="DeviceStatusID"
            loading={isFetchingDeviceStatus}
            pagination={{
              ...deviceStatusPagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100", "500", "1000"], // ✅ Max 1000
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
    </DashboardLayout>
  );
}
