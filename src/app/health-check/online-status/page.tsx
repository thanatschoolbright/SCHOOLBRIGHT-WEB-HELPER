"use client";
import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { findSchoolName } from "@helpers/find-school-id";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { isOnline } from "@helpers/check-online-device-status";
import { unwrapResult } from "@reduxjs/toolkit";
import { CallAPI as getSchoolList } from "@/stores/actions/call-school-list";
import { CallAPI as getOnlineDevice } from "@stores/actions/hardware/call-get-online-device";
import { CallAPI as postCheckOnlineDevice } from "@stores/actions/hardware/call-post-online-device";
import { RequestDeviceDailyStatusTypes } from "@/types/device-daily-status.types";
import { DeviceDailyStatus as ResponseOnlineDeviceType } from "generated/prisma";
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
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined,
  DisconnectOutlined,
  DesktopOutlined,
  FilterOutlined,
  TableOutlined,
  InfoCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function OnlineDeviceDashboard() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm();

  // Redux States
  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const onlineDeviceState = useAppSelector(
    (state) => state.callGetOnlineDevice
  );
  const checkDeviceState = useAppSelector(
    (state) => state.callPostOnlineDevice
  );

  // Local States
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(
    undefined
  );
  const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [tableData, setTableData] = useState<ResponseOnlineDeviceType[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // เช็คว่ากำลังโหลดอยู่หรือไม่
  const isLoading =
    schoolListState.loading ||
    onlineDeviceState.loading ||
    checkDeviceState.loading;

  // Initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch School List on Mount
  useEffect(() => {
    dispatch(getSchoolList()).then(() => setIsInitialLoading(false));
  }, [dispatch]);

  // Prepare School Options
  useEffect(() => {
    if (schoolListState?.response?.data?.data) {
      setSchoolOptions(
        schoolListState.response.data.data.map((item: any) => ({
          label: `${item.SchoolName} (${item.SchoolID})`,
          value: String(item.SchoolID),
        }))
      );
    }
  }, [schoolListState?.response]);

  // Fetch Data
  const fetchData = () => {
    const request: RequestDeviceDailyStatusTypes = {
      schoolId: selectedSchoolId || "",
      deviceId: deviceIdSearch,
      limit: "100",
    };
    dispatch(getOnlineDevice(request));
  };

  useEffect(() => {
    fetchData();
  }, [selectedSchoolId, deviceIdSearch]);

  // Update Table Data
  useEffect(() => {
    const data = onlineDeviceState?.response?.data?.data || [];
    setTableData(data);
  }, [onlineDeviceState]);

  // Filter Logic
  const filteredTableData = useMemo(() => {
    return tableData.filter((row) => {
      const matchDevice = deviceIdSearch
        ? row.DeviceID.toLowerCase().includes(deviceIdSearch.toLowerCase())
        : true;
      const matchSchool = selectedSchoolId
        ? String(row.SchoolID) === selectedSchoolId
        : true;

      let matchDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const rowDate = dayjs(row.Tstamp);
        matchDate =
          rowDate.isAfter(dateRange[0].startOf("day")) &&
          rowDate.isBefore(dateRange[1].endOf("day"));
      }

      return matchDevice && matchSchool && matchDate;
    });
  }, [tableData, deviceIdSearch, selectedSchoolId, dateRange]);

  // Handle Check Status
  const handleCheckOnlineStatus = async (
    schoolId: number,
    deviceId: string
  ) => {
    try {
      const actionResult = await dispatch(
        postCheckOnlineDevice({
          SchoolID: schoolId,
          DeviceID: deviceId,
          Status: "Online",
        })
      );
      const result = unwrapResult(actionResult);

      if (result?.data?.statusCode === 200) {
        toast.success("อุปกรณ์ออนไลน์อยู่", {
          description: `อุปกรณ์ ${deviceId} ที่โรงเรียน ${schoolId} สามารถติดต่อได้`,
          action: {
            label: "คัดลอก CURL",
            onClick: () => navigator.clipboard.writeText(result.curl),
          },
        });
      } else {
        toast.error("ไม่สามารถติดต่ออุปกรณ์ได้", {
          description: result?.data?.message || "การเชื่อมต่อล้มเหลว",
          action: {
            label: "คัดลอก CURL",
            onClick: () => navigator.clipboard.writeText(result.curl),
          },
        });
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", {
        description: error.message || "ข้อผิดพลาดจากเซิร์ฟเวอร์",
      });
    }
  };

  // Columns Configuration
  const columns = [
    {
      title: "โรงเรียน",
      dataIndex: "SchoolID",
      key: "SchoolID",
      render: (schoolId: number) => (
        <Space>
          <Badge status="processing" />
          <Text strong>{findSchoolName(schoolId, schoolOptions)}</Text>
        </Space>
      ),
    },
    {
      title: "รหัสอุปกรณ์",
      dataIndex: "DeviceID",
      key: "DeviceID",
      render: (text: string) => (
        <Tag icon={<DesktopOutlined />} color="geekblue" bordered={false}>
          {text}
        </Tag>
      ),
    },
    {
      title: "การเข้าสู่ระบบ",
      dataIndex: "Login",
      key: "Login",
      align: "center" as const,
      render: (login: boolean) =>
        login ? (
          <Tooltip title="พนักงาน Login เข้าใช้งานแล้ว">
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              bordered={false}
              style={{ borderRadius: "20px" }}
            >
              LOGIN
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="ยังไม่มีการ Login เข้าใช้งาน">
            <Tag
              color="warning"
              icon={<CloseCircleOutlined />}
              bordered={false}
              style={{ borderRadius: "20px" }}
            >
              LOGOUT
            </Tag>
          </Tooltip>
        ),
    },
    {
      title: "ออนไลน์ล่าสุด",
      dataIndex: "Tstamp",
      key: "Tstamp",
      render: (date: string) => (
        <span style={{ fontSize: 13, color: "#666" }}>
          {convertTimeZoneToThai(new Date(date))}
        </span>
      ),
    },
    {
      title: "ขายล่าสุด",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      render: (date: string) => (
        <span style={{ fontSize: 13, color: "#666" }}>
          {convertTimeZoneToThai(new Date(date))}
        </span>
      ),
    },
    {
      title: "สถานะ",
      key: "OnlineStatus",
      align: "center" as const,
      render: (_: any, record: ResponseOnlineDeviceType) => {
        const online = isOnline(record.OnlineTime);
        return (
          <Badge
            status={online ? "success" : "error"}
            text={
              <span
                style={{
                  color: online ? "#52c41a" : "#ff4d4f",
                  fontWeight: 500,
                }}
              >
                {online ? "ออนไลน์" : "ออฟไลน์"}
              </span>
            }
          />
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      width: 100,
      render: (_: any, record: ResponseOnlineDeviceType) => (
        <Tooltip title="ยิงสัญญาณ Ping เพื่อตรวจสอบ">
          <Button
            type="dashed"
            shape="circle"
            icon={<SyncOutlined />}
            onClick={() =>
              handleCheckOnlineStatus(record.SchoolID, record.DeviceID)
            }
            loading={checkDeviceState.loading}
            style={{ color: "#1890ff", borderColor: "#1890ff" }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Header & Alert Section */}
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            <Space align="center">
              <DesktopOutlined style={{ color: "#1890ff" }} />
              Device Monitor Dashboard
            </Space>
          </Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            ตรวจสอบสถานะการเชื่อมต่อของเครื่อง Canteen แบบ Real-time สำหรับทีม
            CS และ QA
          </Text>

          <Alert
            message="Tips"
            description="เลือก 'โรงเรียน' เพื่อดูข้อมูลเฉพาะเจาะจง หรือใส่ 'Device ID' เพื่อค้นหาเครื่องที่ต้องการตรวจสอบทันที"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ borderRadius: 8, border: "none", background: "#e6f7ff" }}
          />
        </div>

        {/* Filter Section */}
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            marginBottom: 8,
          }}
          className="hover:shadow-md transition-all duration-300"
        >
          <div style={{ marginBottom: 24 }}>
            <Space>
              <FilterOutlined style={{ color: "#1890ff" }} />
              <Text strong>ตัวกรองการค้นหา</Text>
            </Space>
          </div>

          {isInitialLoading ? (
            // Skeleton for Filter Form
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Skeleton.Input
                  active
                  size="large"
                  block
                  style={{ borderRadius: 6 }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Skeleton.Input
                  active
                  size="large"
                  block
                  style={{ borderRadius: 6 }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Skeleton.Input
                  active
                  size="large"
                  block
                  style={{ borderRadius: 6 }}
                />
              </Col>
              <Col
                xs={24}
                md={12}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                }}
              >
                <Skeleton.Button
                  active
                  size="large"
                  style={{ width: 150, borderRadius: 6 }}
                />
              </Col>
            </Row>
          ) : (
            <Form layout="vertical" form={form}>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item label="โรงเรียน" style={{ marginBottom: 0 }}>
                    <Select
                      showSearch
                      placeholder="พิมพ์ชื่อหรือรหัสโรงเรียน..."
                      optionFilterProp="label"
                      options={schoolOptions}
                      value={selectedSchoolId}
                      onChange={setSelectedSchoolId}
                      allowClear
                      loading={schoolListState.loading}
                      size="large"
                      suffixIcon={<SearchOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="รหัสอุปกรณ์ (Device ID)"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="ระบุ Device ID..."
                      prefix={<DesktopOutlined style={{ color: "#bfbfbf" }} />}
                      value={deviceIdSearch}
                      onChange={(e) => setDeviceIdSearch(e.target.value)}
                      allowClear
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="ช่วงเวลาที่ออนไลน์"
                    style={{ marginBottom: 0 }}
                  >
                    <RangePicker
                      style={{ width: "100%" }}
                      value={dateRange}
                      onChange={(dates) =>
                        setDateRange(
                          dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                        )
                      }
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  md={12}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="primary"
                    onClick={fetchData}
                    icon={<SearchOutlined />}
                    loading={isLoading && !isInitialLoading} // Show button spinner only on subsequent loads
                    size="large"
                    style={{
                      borderRadius: 6,
                      paddingLeft: 32,
                      paddingRight: 32,
                      width: "100%",
                    }}
                  >
                    ค้นหาข้อมูล
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Card>

        {/* Data Table Section */}
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
          // ✅ ลบ bodyStyle padding 0 ออก เพื่อให้ตารางไม่ชิดขอบ
          title={
            <Space>
              <TableOutlined style={{ color: "#1890ff" }} />
              <Text strong>รายการอุปกรณ์ทั้งหมด</Text>
            </Space>
          }
          extra={
            !isLoading && (
              <Badge
                count={filteredTableData.length}
                overflowCount={999}
                style={{ backgroundColor: "#52c41a" }}
              />
            )
          }
        >
          {isLoading ? (
            // Skeleton for Table
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredTableData}
              rowKey={(record) => `${record.SchoolID}-${record.DeviceID}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `แสดงทั้งหมด ${total} รายการ`,
              }}
              scroll={{ x: 1000 }}
              locale={{ emptyText: "ไม่พบข้อมูลอุปกรณ์" }}
              rowClassName="hover:bg-gray-50 transition-colors"
            />
          )}
        </Card>
      </Space>
    </DashboardLayout>
  );
}
