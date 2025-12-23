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
// ✅ Import Actions
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
  Spin,
  Form,
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

  const isLoading =
    schoolListState.loading ||
    onlineDeviceState.loading ||
    checkDeviceState.loading;

  // ✅ Fetch School List on Mount
  useEffect(() => {
    dispatch(getSchoolList());
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
      limit: "100", // Adjust limit as needed
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

  // Check Online Status Action
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
        <Text strong>{findSchoolName(schoolId, schoolOptions)}</Text>
      ),
    },
    {
      title: "รหัสอุปกรณ์ (Device ID)",
      dataIndex: "DeviceID",
      key: "DeviceID",
      render: (text: string) => (
        <Space>
          <DesktopOutlined /> {text}
        </Space>
      ),
    },
    {
      title: "สถานะการเข้าสู่ระบบ",
      dataIndex: "Login",
      key: "Login",
      render: (login: boolean) =>
        login ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            เข้าสู่ระบบแล้ว
          </Tag>
        ) : (
          <Tag color="warning" icon={<CloseCircleOutlined />}>
            ยังไม่เข้าสู่ระบบ
          </Tag>
        ),
    },
    {
      title: "ออนไลน์ล่าสุดเมื่อ",
      dataIndex: "Tstamp",
      key: "Tstamp",
      render: (date: string) => convertTimeZoneToThai(new Date(date)),
    },
    {
      title: "ทำรายการขายล่าสุดเมื่อ",
      dataIndex: "BusinessDate",
      key: "BusinessDate",
      render: (date: string) => convertTimeZoneToThai(new Date(date)),
    },
    {
      title: "สถานะเครือข่าย",
      key: "OnlineStatus",
      render: (_: any, record: ResponseOnlineDeviceType) => {
        const online = isOnline(record.OnlineTime);
        return online ? (
          <Tag icon={<WifiOutlined />} color="green">
            ออนไลน์
          </Tag>
        ) : (
          <Tag icon={<DisconnectOutlined />} color="red">
            ออฟไลน์
          </Tag>
        );
      },
    },
    {
      title: "การจัดการ",
      key: "action",
      render: (_: any, record: ResponseOnlineDeviceType) => (
        <Tooltip title="ทดสอบยิงสัญญาณไปที่เครื่องเพื่อเช็คสถานะปัจจุบัน">
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() =>
              handleCheckOnlineStatus(record.SchoolID, record.DeviceID)
            }
            loading={checkDeviceState.loading}
          >
            ทดสอบการเชื่อมต่อ
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header & Alert Section */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={3}>
              <Space>
                <DesktopOutlined />
                รายงานสถานะอุปกรณ์ (Device Monitor)
              </Space>
            </Title>
            <Text type="secondary">
              ตรวจสอบสถานะการเชื่อมต่อของเครื่อง Canteen แบบ Real-time สำหรับทีม
              CS และ QA
            </Text>
          </Col>
          <Col span={24}>
            <Alert
              message="คำแนะนำการใช้งาน"
              description="กรุณาเลือกโรงเรียน หรือระบุ Device ID เพื่อเริ่มการค้นหาข้อมูลสถานะอุปกรณ์ล่าสุด (หากไม่เลือกโรงเรียน ระบบจะแสดงข้อมูลเท่าที่โหลดมาได้)"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              closable
            />
          </Col>
        </Row>

        {/* Filter Section */}
        <Card
          title={
            <Space>
              <FilterOutlined />
              ตัวกรองการค้นหา
            </Space>
          }
          variant="borderless" // ✅ แก้ไข: เปลี่ยน bordered={false} เป็น variant="borderless"
        >
          <Form layout="vertical" form={form}>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="เลือกโรงเรียน">
                  <Select
                    showSearch
                    placeholder="พิมพ์เพื่อค้นหาชื่อ หรือรหัสโรงเรียน..."
                    optionFilterProp="label"
                    options={schoolOptions}
                    value={selectedSchoolId}
                    onChange={setSelectedSchoolId}
                    allowClear
                    loading={schoolListState.loading}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="ค้นหา Device ID">
                  <Input
                    placeholder="ระบุ Device ID..."
                    prefix={<SearchOutlined />}
                    value={deviceIdSearch}
                    onChange={(e) => setDeviceIdSearch(e.target.value)}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="ช่วงเวลาที่ออนไลน์">
                  <RangePicker
                    style={{ width: "100%" }}
                    value={dateRange}
                    onChange={(dates) =>
                      setDateRange(
                        dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                      )
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  onClick={fetchData}
                  icon={<SearchOutlined />}
                  loading={isLoading}
                >
                  ค้นหาข้อมูล
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Data Table Section */}
        <Card
          title={
            <Space>
              <TableOutlined />
              รายการอุปกรณ์ทั้งหมด
            </Space>
          }
          variant="borderless" // ✅ แก้ไข: เปลี่ยน bordered={false} เป็น variant="borderless"
        >
          <Spin spinning={isLoading}>
            <Table
              columns={columns}
              dataSource={filteredTableData}
              rowKey={(record) => `${record.SchoolID}-${record.DeviceID}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              scroll={{ x: 800 }}
              locale={{ emptyText: "ไม่พบข้อมูลอุปกรณ์" }}
            />
          </Spin>
        </Card>
      </Space>
    </DashboardLayout>
  );
}
