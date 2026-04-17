"use client";

import {
  AppstoreOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ClearOutlined,
  FilterFilled,
  InfoCircleOutlined,
  SearchOutlined,
  ShopOutlined,
  ThunderboltFilled,
  WifiOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import {
  Badge,
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useOnlineStatusStore } from "../_state/online-status-store";
import { DeviceStatusData } from "../_services/online-status-service";

const { RangePicker } = DatePicker;
const { Text: AntText } = Typography;

interface FilterSectionProps {
  deviceList: DeviceStatusData[];
}

/**
 * คอมโพเนนต์ส่วนตัวกรองข้อมูลสถานะอุปกรณ์
 */
const FilterSection: React.FC<FilterSectionProps> = ({ deviceList }) => {
  const [searchForm] = Form.useForm();
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  const {
    fetchData,
    resetFilters,
    pagination,
    setKeyword,
    setSchoolId,
    setAppName,
    setAppVersion,
    setIsOnline,
    setIsLogin,
    setDateRange,
  } = useOnlineStatusStore();

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

  const schoolOptions = useMemo(
    () =>
      schoolList.map((school: any) => ({
        label: `${school.SchoolName} (${school.SchoolID})`,
        value: school.SchoolID,
      })),
    [schoolList],
  );

  const appNameOptions = useMemo(() => {
    const uniqueApps = Array.from(
      new Set(deviceList.map((d) => d.AppName).filter(Boolean)),
    );
    return uniqueApps.map((app) => ({ label: app, value: app }));
  }, [deviceList]);

  const appVersionOptions = useMemo(() => {
    const uniqueVersions = Array.from(
      new Set(deviceList.map((d) => d.AppVersion).filter(Boolean)),
    );
    return uniqueVersions.map((v) => ({ label: `v.${v}`, value: v }));
  }, [deviceList]);

  /**
   * ยืนยันการค้นหาและดึงข้อมูลใหม่จาก page 1
   */
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setKeyword(values.keyword ?? "");
    setSchoolId(values.schoolId);
    setAppName(values.appName);
    setAppVersion(values.appVersion);
    setIsOnline(values.isOnline);
    setIsLogin(values.isLogin);
    setDateRange(values.dateRange);
    fetchData(1, pagination.pageSize);
  };

  /**
   * ล้างตัวกรองทั้งหมดและดึงข้อมูลใหม่
   */
  const handleReset = () => {
    searchForm.resetFields();
    searchForm.setFieldsValue({ isOnline: true });
    resetFilters();
    fetchData(1, pagination.pageSize);
  };

  return (
    <Form
      form={searchForm}
      layout="vertical"
      onFinish={handleSearch}
      initialValues={{ isOnline: true }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <FilterFilled style={{ fontSize: "1rem" }} />
        <AntText strong style={{ fontSize: "1rem", fontWeight: 600 }}>
          ตัวกรอง
        </AntText>
      </Flex>

      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space>
                <SearchOutlined />
                <span>ค้นหา (รหัสเครื่อง / รหัสโรงเรียน)</span>
                <Tooltip title="กรอกบางส่วนของรหัสเครื่อง หรือรหัสโรงเรียนเพื่อค้นหา">
                  <InfoCircleOutlined />
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
                <span>โรงเรียน</span>
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
                <span>ชื่อแอปพลิเคชัน</span>
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
                <span>เวอร์ชันแอป</span>
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
                <Badge status="success" text="ออนไลน์" />
              </Select.Option>
              <Select.Option value={false}>
                <Badge status="error" text="ออฟไลน์" />
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
                <Badge status="processing" text="กำลังใช้งาน" />
              </Select.Option>
              <Select.Option value={false}>
                <Badge status="default" text="ไม่ได้ใช้งาน" />
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
          <Button icon={<ClearOutlined />} onClick={handleReset} size="large">
            ล้างการค้นหา
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
  );
};

export default FilterSection;
